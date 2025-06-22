import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { getClientIP, canMakeServerConversation } from '@/lib/usage-tracker-server';

async function findOrCreateCategory(categoryString: string, userId: string): Promise<void> {
  if (!categoryString || categoryString === 'General') return;
  
  const parts = categoryString.split(' > ').map(p => p.trim());
  let parentId: string | null = null;

  for (const part of parts) {
    let category: any = await prisma.category.findFirst({
      where: {
        name: part,
        userId,
        parentId,
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: part,
          userId,
          parentId,
        },
      });
      console.log(`✅ Created new category: ${part} (parent: ${parentId})`);
    }
    parentId = category.id;
  }
}

interface Concept {
  id?: string;
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  details?: string;
  examples?: string[];
  relatedConcepts?: string[];
  relationships?: Record<string, any>;
  codeSnippets?: Array<{
    language: string;
    description: string;
    code: string;
  }>;
  videoResources?: string;
  // Enhanced learning fields from AI analysis
  masteryLevel?: string;
  difficultyRating?: number;
  timeToMaster?: number;
  learningTips?: string[];
  embeddingData?: {
    concept: any;
    relationships: Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      similarity: number;
      relationshipType?: string;
      reason?: string;
      context?: string[];
      sharedElements?: string[];
    }>;
    potentialDuplicates: Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      similarity: number;
      relationshipType?: string;
      reason?: string;
      context?: string[];
      sharedElements?: string[];
    }>;
    embedding: number[];
  };
  keyTakeaway?: string;
  analogy?: string;
  practicalTips?: string[];
  confidenceScore?: number;
}

// Let the backend provide proper categories - just fallback to General if none provided
function guessCategoryFromTitle(title: string): string {
  return 'General';
}

export async function POST(request: Request) {
  try {
    const { analysis, confirmUpdate = false, customApiKey, userInfo } = await request.json();
    
    // Get client information for usage tracking
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Try to get authenticated user first
    let user = await validateSession(request as any);
    
    // If no authenticated user but we have userInfo, try to find or create user
    if (!user && userInfo) {
      try {
        // Try to find existing user by email
        let existingUser = await prisma.user.findUnique({
          where: { email: userInfo.email.toLowerCase().trim() }
        });
        
        if (!existingUser) {
          // Create new user for email-based authentication
          existingUser = await prisma.user.create({
            data: {
              name: userInfo.name,
              email: userInfo.email.toLowerCase().trim(),
              emailVerified: null, // Email-based users don't need verification
              lastActiveAt: new Date(),
            }
          });
        } else {
          // Update last active time
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastActiveAt: new Date() }
          });
        }
        
        user = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          isEmailBased: true
        };
      } catch (error) {
        console.error('Error creating/finding user:', error);
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Validate the custom API key if provided
    let validatedApiKey = false;
    if (customApiKey && customApiKey.trim()) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${customApiKey.trim()}`
          }
        });
        
        if (testResponse.ok) {
          validatedApiKey = true;
          console.log('✅ Custom API key validated successfully');
        } else {
          console.log('❌ Custom API key validation failed:', testResponse.status);
        }
      } catch (error) {
        console.log('❌ Custom API key validation error:', error);
      }
    }

    // Check if user can make a conversation (server-side validation)
    // Skip this check for authenticated users or users with valid API keys
    if (!user.isEmailBased && !validatedApiKey) {
      const canMake = await canMakeServerConversation(clientIP, userAgent, customApiKey || null);
      if (!canMake) {
        return NextResponse.json({ 
          success: false, 
          error: 'You have reached the 25 free conversation limit. Please add your OpenAI API key to continue.',
          requiresApiKey: true
        }, { status: 403 });
      }
    }
    
    console.log("🔍 SERVER RECEIVED DATA:");
    console.log("📊 Analysis object:", JSON.stringify(analysis, null, 2));
    
    if (analysis) {
      console.log("📋 analysis.concepts:", analysis.concepts);
      console.log("📋 analysis.conceptMap:", analysis.conceptMap);
      console.log("📋 analysis.conversation_summary:", analysis.conversation_summary);
      console.log("📋 Type of analysis.concepts:", typeof analysis.concepts);
      console.log("📋 Is analysis.concepts array?", Array.isArray(analysis.concepts));
      if (analysis.concepts && Array.isArray(analysis.concepts)) {
        console.log("📋 Number of concepts:", analysis.concepts.length);
        analysis.concepts.forEach((concept: any, index: number) => {
          console.log(`📋 Concept ${index + 1}:`, JSON.stringify(concept, null, 2));
        });
      }
    }
    
    // Validate input - ensure we have the minimum required data
    if (!analysis || !analysis.concepts || analysis.concepts.length === 0) {
      console.error("Missing analysis data or concepts");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing analysis data or concepts' 
      }, { status: 400 });
    }

    // Ensure analysis is never undefined for the rest of the processing
    const safeAnalysis = analysis;

    // --- STAGE 2: Get Concepts to Process ---
    // Try to get concepts from a specific array in the analysis if it exists
    const conceptsToProcess: Concept[] = safeAnalysis.concepts && safeAnalysis.concepts.length > 0
      ? safeAnalysis.concepts
      : (safeAnalysis.conceptMap || []).map((title: string) => ({
          title,
          category: 'General',
          summary: '',
          keyPoints: [],
        }));

    // If no concepts are found after trying both, return error
    if (conceptsToProcess.length === 0) {
      console.error("No concepts found in analysis object");
      return NextResponse.json({ 
        success: false, 
        error: 'No concepts found in analysis object' 
      }, { status: 400 });
    }

    const createdConcepts = [];
    const updatedConcepts = [];
    
    console.log("💾 SAVING CONCEPTS TO DATABASE:");

    // First, create a single conversation to link all concepts to.
    const conversation = await prisma.conversation.create({
      data: {
        title: analysis.conversationTitle || "Untitled Analysis",
        summary: analysis.overallSummary || "No summary provided.",
        text: "Conversation text not stored in this version.", // Or you could pass the full text
        userId: user.id,
      },
    });

    for (const conceptData of conceptsToProcess) {
      console.log(`Processing concept: ${conceptData.title}`);

      // If the concept has an ID, it's an update
      if (conceptData.id) {
        // Logic for updating an existing concept can go here
        console.log(`Skipping update for existing concept: ${conceptData.title}`);
        continue;
       }
 
       // We'll handle duplicates/updates later. For now, we create new concepts.
       
       // Create or find the category structure in the database
       await findOrCreateCategory(conceptData.category || 'General', user.id);

       const newConcept = await prisma.concept.create({
         data: {
           title: conceptData.title,
           category: conceptData.category || guessCategoryFromTitle(conceptData.title),
           summary: conceptData.summary,
           keyPoints: JSON.stringify(conceptData.keyPoints || []),
           details: conceptData.details || '',
           examples: JSON.stringify(conceptData.examples || []),
           relatedConcepts: JSON.stringify(conceptData.relatedConcepts || []),
           relationships: JSON.stringify(conceptData.relationships || {}),
           keyTakeaway: conceptData.keyTakeaway,
           analogy: conceptData.analogy,
           practicalTips: JSON.stringify(conceptData.practicalTips || []),
           confidenceScore: conceptData.confidenceScore,
           videoResources: conceptData.videoResources || '',
           userId: user.id,
           conversationId: conversation.id, // Use the real conversation ID
         },
       });
 
       createdConcepts.push(newConcept.id);
       console.log(`✅ Created new concept: ${newConcept.title} with ID: ${newConcept.id}`);
 
       // Create code snippets if they exist
       if (conceptData.codeSnippets && conceptData.codeSnippets.length > 0) {
        console.log(`💾 Creating ${conceptData.codeSnippets.length} code snippets for concept: ${newConcept.title}`);
         
         for (const snippet of conceptData.codeSnippets) {
           try {
             await prisma.codeSnippet.create({
               data: {
                 ...snippet,
                 conceptId: newConcept.id,
               },
             });
            console.log(`✅ Created code snippet for concept: ${newConcept.title}`);
           } catch (snippetError) {
            console.error(`❌ Error creating code snippet for concept ${newConcept.title}:`, snippetError);
           }
         }
       }
    }
    
    console.log("📊 Final Results:", {
      conceptCount: createdConcepts.length,
      conceptIds: createdConcepts,
       userId: user.id,
       userEmail: user.email
    });

    return NextResponse.json({
      success: true, 
      message: "Concepts extracted and saved successfully",
      conceptIds: createdConcepts,
      conceptCount: createdConcepts.length,
      redirectTo: `/concepts`
    });

  } catch (error) {
    console.error('Error in saveAnalysis:', error);
    // Return a generic error response
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extract and save concepts' 
    }, { status: 500 });
  }
} 