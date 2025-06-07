import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { getClientIP, canMakeServerConversation } from '@/lib/usage-tracker-server';
import { normalizeCategory } from '@/lib/utils/conversation';

interface Concept {
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
}

// Simple heuristic to guess category from concept title
function guessCategoryFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  // Check for LeetCode problems first
  if (titleLower.match(/(valid anagram|two sum|contains duplicate|three sum|merge sorted|reverse linked|palindrome)/i) ||
      titleLower.includes("problem")) {
    return normalizeCategory('LeetCode Problems');
  }
  
  if (titleLower.includes('array') || titleLower.includes('list') || titleLower.includes('hash')) {
    return normalizeCategory('Arrays and Hashing');
  }
  if (titleLower.includes('tree') || titleLower.includes('graph')) {
    return normalizeCategory('Trees and Graphs');
  }
  if (titleLower.includes('sort') || titleLower.includes('search')) {
    return normalizeCategory('Algorithms');
  }
  if (titleLower.includes('api') || titleLower.includes('http') || titleLower.includes('rest')) {
    return normalizeCategory('APIs and Web Services');
  }
  if (titleLower.includes('database') || titleLower.includes('sql')) {
    return normalizeCategory('Database');
  }
  if (titleLower.includes('react') || titleLower.includes('frontend') || titleLower.includes('ui')) {
    return normalizeCategory('Frontend Development');
  }
  if (titleLower.includes('backend') || titleLower.includes('server')) {
    return normalizeCategory('Backend Engineering');
  }
  
  return normalizeCategory('General');
}

export async function POST(request: Request) {
  try {
    const { conversation_text, analysis, confirmUpdate = false, customApiKey, userInfo } = await request.json();
    
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
    console.log("📝 Conversation text length:", conversation_text?.length || 0);
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
    if (!conversation_text || conversation_text.trim() === '') {
      console.error("Missing conversation text");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing conversation text' 
      }, { status: 400 });
    }

    // Ensure analysis is never undefined for the rest of the processing
    const safeAnalysis = analysis || { concepts: [] };

    // Get concepts from conceptMap or concepts array
    let conceptsToProcess: Concept[] = [];
    
    console.log("🔄 PROCESSING CONCEPTS:");
    console.log("🔄 safeAnalysis.concepts exists?", !!safeAnalysis.concepts);
    console.log("🔄 safeAnalysis.concepts length:", safeAnalysis.concepts?.length || 0);
    console.log("🔄 safeAnalysis.conceptMap exists?", !!safeAnalysis.conceptMap);
    console.log("🔄 safeAnalysis.conceptMap length:", safeAnalysis.conceptMap?.length || 0);
    
    // Process concepts from the analysis.concepts array if available
    if (safeAnalysis.concepts && safeAnalysis.concepts.length > 0) {
      console.log("✅ Using analysis.concepts array");
      conceptsToProcess = safeAnalysis.concepts;
    } 
    // If we have a conceptMap array, create concepts from it
    else if (safeAnalysis.conceptMap && Array.isArray(safeAnalysis.conceptMap) && safeAnalysis.conceptMap.length > 0) {
      console.log("⚠️ Falling back to conceptMap array");
      // Convert each concept name to a concept object
      conceptsToProcess = safeAnalysis.conceptMap.map((title: string) => ({
        title,
        category: guessCategoryFromTitle(title),
        summary: '',
        keyPoints: [],
        details: '',
        examples: [],
        relatedConcepts: [],
        relationships: {},
        codeSnippets: [],
        videoResources: ''
      }));
    }

    // No concepts found to process - continue with creating generic concepts
    if (conceptsToProcess.length === 0) {
      console.log("No concepts found in analysis - attempting to create generic concepts");
      
      const summary = safeAnalysis.conversation_summary || '';
      const firstSentences = conversation_text.split(/[.!?]/).slice(0, 2).join('. ');
      const title = firstSentences.length > 50 
        ? firstSentences.substring(0, 50) + '...' 
        : (firstSentences || 'Programming Discussion');
        
      conceptsToProcess.push({
        title: title,
        category: "General",
        summary: summary || "Conversation about programming topics",
        keyPoints: ["Extracted from conversation"],
        relatedConcepts: [],
        videoResources: ''
      });
      
      console.log("Created generic fallback concept:", title);
    }

    console.log("🎯 FINAL CONCEPTS TO PROCESS:");
    conceptsToProcess.forEach((concept: any, index: number) => {
      console.log(`🎯 Final Concept ${index + 1}:`, {
        title: concept.title,
        category: concept.category,
        summary: concept.summary?.substring(0, 100) + '...',
        hasDetails: !!concept.details,
        hasKeyPoints: !!concept.keyPoints,
        hasCodeSnippets: !!concept.codeSnippets,
        hasVideoResources: !!concept.videoResources
      });
    });

    console.log("💾 CREATING CONVERSATION IN DATABASE...");
    // Create the conversation for source tracking
    const conversationData: any = {
      text: conversation_text,
      summary: analysis?.conversation_summary || '',
      createdAt: new Date(),
      userId: user.id
    };
    
    if (analysis?.conversation_title) {
      conversationData.title = analysis.conversation_title;
    }
    
    const conversation = await prisma.conversation.create({
      data: conversationData,
    });

    console.log("✅ CONVERSATION CREATED:", {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      summary: conversation.summary?.substring(0, 100) + '...',
      textLength: conversation.text.length
    });

    // Store created concept IDs
    const createdConceptIds = new Map<string, string>();

    console.log("💾 CREATING CONCEPTS IN DATABASE...");

    // Process each concept and save to database
    for (const conceptData of conceptsToProcess) {
      try {
        console.log(`💾 Processing concept: ${conceptData.title}`);
        
        // Prepare concept data for database insertion
        const conceptToCreate: any = {
          title: conceptData.title,
          category: normalizeCategory(conceptData.category || 'General'),
          summary: conceptData.summary || '',
          details: JSON.stringify(conceptData.details || ''),
          keyPoints: JSON.stringify(conceptData.keyPoints || []),
          examples: JSON.stringify(conceptData.examples || []),
          relatedConcepts: JSON.stringify(conceptData.relatedConcepts || []),
          relationships: JSON.stringify(conceptData.relationships || {}),
          videoResources: conceptData.videoResources 
            ? (typeof conceptData.videoResources === 'string' 
                ? JSON.stringify([conceptData.videoResources]) // Single URL -> JSON array
                : JSON.stringify(conceptData.videoResources))   // Already an array -> JSON string
            : '[]', // Default to empty array
          confidenceScore: 0.5, // Default confidence score
          userId: user.id,
          conversationId: conversation.id, // Link to conversation for source tracking
          createdAt: new Date(),
          lastUpdated: new Date()
        };

        // Create the concept
        const createdConcept = await prisma.concept.create({
          data: conceptToCreate,
        });

        createdConceptIds.set(conceptData.title, createdConcept.id);
        console.log(`✅ Created concept: ${createdConcept.id} - ${createdConcept.title}`);

        // Create code snippets if they exist
        if (conceptData.codeSnippets && conceptData.codeSnippets.length > 0) {
          console.log(`💾 Creating ${conceptData.codeSnippets.length} code snippets for concept: ${createdConcept.title}`);
          
          for (const snippet of conceptData.codeSnippets) {
            try {
              await prisma.codeSnippet.create({
                data: {
                  language: snippet.language || 'text',
                  description: snippet.description || '',
                  code: snippet.code || '',
                  conceptId: createdConcept.id,
                },
              });
              console.log(`✅ Created code snippet for concept: ${createdConcept.title}`);
            } catch (snippetError) {
              console.error(`❌ Error creating code snippet for concept ${createdConcept.title}:`, snippetError);
            }
          }
        }

        // Create occurrence record to track this concept in this conversation
        await prisma.occurrence.create({
          data: {
            conversationId: conversation.id,
            conceptId: createdConcept.id,
            notes: conceptData.summary || '',
          }
        });

      } catch (error) {
        console.error(`❌ Error creating concept ${conceptData.title}:`, error);
        // Continue with other concepts even if one fails
        continue;
      }
    }

    console.log("📊 Final Results:", {
      conversationId: conversation.id,
      conceptCount: Array.from(createdConceptIds.values()).length,
      conceptIds: Array.from(createdConceptIds.values()),
      conceptTitles: Array.from(createdConceptIds.keys()),
      userId: user.id,
      userEmail: user.email
    });

    // Return a success response with redirect to the concepts page
    const response = { 
      success: true, 
      message: "Concepts extracted and saved successfully",
      conversationId: conversation.id,
      conceptIds: Array.from(createdConceptIds.values()),
      conceptCount: Array.from(createdConceptIds.values()).length,
      redirectTo: `/concepts`
    };
    
    console.log("📤 SENDING RESPONSE:", response);
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error saving concepts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extract and save concepts' 
    }, { status: 500 });
  }
} 