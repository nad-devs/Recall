import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { validateSession } from '@/lib/session';
import { 
  getClientIP, 
  canMakeServerConversation, 
  incrementServerConversationCount 
} from '@/lib/usage-tracker-server';

interface CodeSnippet {
  language: string;
  description?: string;
  code: string;
}

interface Concept {
  title: string;
  category?: string;
  summary?: string;
  keyPoints?: string[] | string;
  details?: any;
  examples?: any[];
  relatedConcepts?: string[] | string;
  relationships?: any;
  confidenceScore?: number;
  codeSnippets?: CodeSnippet[];
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
    
    // If still no user, create anonymous conversation (for demo purposes)
    if (!user) {
      console.log('No user found - creating anonymous conversation');
      // For now, we'll create a demo user or handle anonymously
      // You can modify this behavior based on your requirements
      try {
        let demoUser = await prisma.user.findFirst({
          where: { email: 'demo@recall.app' }
        });
        
        if (!demoUser) {
          demoUser = await prisma.user.create({
            data: {
              name: 'Demo User',
              email: 'demo@recall.app',
              emailVerified: null,
              lastActiveAt: new Date(),
            }
          });
        }
        
        user = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          isEmailBased: true
        };
      } catch (error) {
        console.error('Error creating demo user:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Unable to save conversation. Please try again.' 
        }, { status: 500 });
      }
    }
    
    // Validate API key if provided
    let validatedApiKey = null;
    if (customApiKey) {
      try {
        const validateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/validate-api-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: customApiKey })
        });
        
        if (validateResponse.ok) {
          validatedApiKey = customApiKey;
        } else {
          validatedApiKey = null;
        }
      } catch (error) {
        console.error('API key validation failed:', error);
        validatedApiKey = null;
      }
    }

    // Check if user can make a conversation (server-side validation)
    // Skip this check for authenticated users or users with valid API keys
    if (!user.isEmailBased && !validatedApiKey) {
      const canMake = await canMakeServerConversation(clientIP, userAgent, validatedApiKey);
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
    console.log("🎯 Analysis type:", typeof analysis);
    console.log("🔑 Analysis keys:", analysis ? Object.keys(analysis) : 'null');
    
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
    
    // Check if similar conversation already exists (based on first 100 chars)
    const textToCheck = conversation_text.substring(0, 100);
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        text: {
          startsWith: textToCheck
        }
      },
      select: {
        id: true,
        text: true,
        summary: true,
        concepts: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    // If we found an existing conversation with similar content
    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation.id);
      return NextResponse.json({ 
        success: true, 
        message: "Conversation already exists",
        conversationId: existingConversation.id,
        alreadyExists: true,
        redirectTo: `/conversation/${existingConversation.id}`
      });
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
        codeSnippets: []
      }));
    }

    // No concepts found to process - continue with saving conversation instead of returning error
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
        relatedConcepts: []
      });
      
      console.log("Created generic fallback concept:", title);
    }

    console.log("🎯 FINAL CONCEPTS TO PROCESS:");
    console.log("🎯 Number of concepts:", conceptsToProcess.length);
    conceptsToProcess.forEach((concept: any, index: number) => {
      console.log(`🎯 Final Concept ${index + 1}:`, {
        title: concept.title,
        category: concept.category,
        summary: concept.summary?.substring(0, 100) + '...',
        hasDetails: !!concept.details,
        hasKeyPoints: !!concept.keyPoints,
        hasCodeSnippets: !!concept.codeSnippets
      });
    });

    console.log("💾 CREATING CONVERSATION IN DATABASE...");
    // Create the conversation
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

    // Store created concept IDs to establish relationships later
    const createdConceptIds = new Map<string, string>();
    
    // First pass: create or update all concepts
    for (const concept of conceptsToProcess) {
      // Skip empty concepts
      if (!concept.title) continue;
      
      // Log the concept structure for debugging
      console.log(`\n=== PROCESSING CONCEPT: ${concept.title} ===`);
      console.log('Raw concept structure:', {
        title: concept.title,
        summary: concept.summary ? `${concept.summary.substring(0, 100)}...` : 'NONE',
        details: concept.details ? (typeof concept.details === 'object' ? 'OBJECT' : `STRING: ${concept.details.substring(0, 100)}...`) : 'NONE',
        detailsType: typeof concept.details,
        detailsKeys: typeof concept.details === 'object' ? Object.keys(concept.details) : 'N/A'
      });
      
      // Normalize the concept data
      const keyPoints = Array.isArray(concept.keyPoints)
        ? concept.keyPoints
        : tryParseJson(concept.keyPoints || '[]');
      
      const examples = typeof concept.examples === 'object' 
        ? JSON.stringify(concept.examples) 
        : concept.examples || '[]';
        
      // Extract rich details from the Python service's object format
      let details = '';
      if (typeof concept.details === 'object' && concept.details !== null) {
        // Python service sends details as an object with implementation, complexity, etc.
        const detailsObj = concept.details;
        
        // Extract the main implementation text
        if (detailsObj.implementation) {
          details = detailsObj.implementation;
        } else if (detailsObj.details) {
          details = detailsObj.details;
        } else {
          // Fallback: convert the whole object to a readable format
          details = Object.entries(detailsObj)
            .map(([key, value]) => {
              if (key === 'complexity' && typeof value === 'object') {
                const complexity = value as any;
                return `Complexity:\n- Time: ${complexity.time || 'N/A'}\n- Space: ${complexity.space || 'N/A'}`;
              } else if (Array.isArray(value)) {
                return `${key.charAt(0).toUpperCase() + key.slice(1)}:\n${value.map(item => `- ${item}`).join('\n')}`;
              } else if (typeof value === 'string') {
                return `${key.charAt(0).toUpperCase() + key.slice(1)}:\n${value}`;
              }
              return '';
            })
            .filter(Boolean)
            .join('\n\n');
        }
             } else {
         details = concept.details || '';
       }
       
       // Log the processed details for debugging
       console.log('Processed details:', {
         originalType: typeof concept.details,
         processedLength: details.length,
         processedPreview: details.substring(0, 200) + (details.length > 200 ? '...' : '')
       });
          
        const relationships = typeof concept.relationships === 'object' 
        ? JSON.stringify(concept.relationships) 
        : concept.relationships || '{}';

      // Preserve category from analysis - only guess if no category was provided at all
      const category = concept.category || guessCategoryFromTitle(concept.title);

      // Check if this concept already exists
      const normalizedTitle = concept.title.toLowerCase().trim().replace(/\s+/g, ' ');
      
      const existingConcepts = await prisma.concept.findMany({
        where: {
          OR: [
            { title: { equals: concept.title } },
            { title: { equals: normalizedTitle } }
          ]
        }
      });
      
      let existingConcept = existingConcepts[0];
      let conceptId;
      
      if (existingConcept) {
        // Update existing concept with new information
        const updatedConcept = await prisma.concept.update({
          where: { id: existingConcept.id },
          data: {
            summary: existingConcept.summary 
              ? existingConcept.summary 
              : concept.summary || '',
            details: (existingConcept.details === '{}' || existingConcept.details === '' || 
                     isRelatedContent(existingConcept.title, concept.title))
              ? details
              : existingConcept.details,
            keyPoints: existingConcept.keyPoints !== '[]' && existingConcept.keyPoints !== ''
              ? existingConcept.keyPoints
              : JSON.stringify(keyPoints),
            category: existingConcept.category || category,
            lastUpdated: new Date(),
            codeSnippets: {
              create: (concept.codeSnippets || []).map((snippet: CodeSnippet) => ({
                language: snippet.language || 'Unknown',
                description: snippet.description || '',
                code: snippet.code || '',
              })),
            },
            conversationId: existingConcept.conversationId || conversation.id
          },
        });
        
        conceptId = existingConcept.id;
      } else {
        // Create new concept
        const newConcept = await prisma.concept.create({
          data: {
            title: concept.title,
            category: category,
            summary: concept.summary || '',
            details: details,
            keyPoints: JSON.stringify(keyPoints),
            examples: examples,
            relatedConcepts: '[]',
            relationships: relationships,
            confidenceScore: 0.5,
            lastUpdated: new Date(),
            conversationId: conversation.id,
            userId: user.id,
            codeSnippets: {
              create: (concept.codeSnippets || []).map((snippet: CodeSnippet) => ({
                language: snippet.language || 'Unknown',
                description: snippet.description || '',
                code: snippet.code || '',
              })),
            },
          },
        });
        
        conceptId = newConcept.id;
      }
      
      // Store the concept ID for relationship creation
      createdConceptIds.set(concept.title.toLowerCase(), conceptId);
      
      // Create occurrence record to track this concept in this conversation
      await prisma.occurrence.create({
        data: {
          conversationId: conversation.id,
          conceptId: conceptId,
          notes: concept.summary || '',
        }
      });
    }
    
    // Second pass: establish relationships between concepts
    for (const concept of conceptsToProcess) {
      if (!concept.title || !createdConceptIds.has(concept.title.toLowerCase())) continue;
      
      const conceptId = createdConceptIds.get(concept.title.toLowerCase());
      
      // Get the related concepts
      let relatedConcepts: string[] = [];
      if (concept.relatedConcepts) {
        if (Array.isArray(concept.relatedConcepts)) {
          relatedConcepts = concept.relatedConcepts as string[];
        } else if (typeof concept.relatedConcepts === 'string') {
          relatedConcepts = tryParseJson(concept.relatedConcepts);
        }
      }
      
      // Filter out the concept's own title and empty strings
      relatedConcepts = relatedConcepts
        .filter((rc: string) => 
          rc && typeof rc === 'string' && 
          rc.toLowerCase() !== concept.title.toLowerCase());
      
      // Get IDs of related concepts that exist
      const relatedConceptIds = relatedConcepts
        .map((title: string) => createdConceptIds.get(title.toLowerCase()))
        .filter(Boolean);
      
      // Update the concept with related concept information
      if (relatedConceptIds.length > 0 || relatedConcepts.length > 0) {
        await prisma.concept.update({
          where: { id: conceptId },
          data: {
            relatedConcepts: JSON.stringify([
              ...relatedConceptIds.map(id => ({ id })),
              ...relatedConcepts
                .filter((title: string) => !createdConceptIds.has(title.toLowerCase()))
                .map((title: string) => ({ title }))
            ]),
            conversationId: conversation.id
          }
        });
      }
    }

    // Increment conversation count on successful save
    await incrementServerConversationCount(clientIP, userAgent, validatedApiKey);

    console.log("🎉 CONVERSATION SAVE COMPLETED SUCCESSFULLY!");
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
      message: "Conversation saved successfully",
      conversationId: conversation.id,
      conceptIds: Array.from(createdConceptIds.values()),
      conceptCount: Array.from(createdConceptIds.values()).length,
      redirectTo: `/conversation/${conversation.id}`
    };
    
    console.log("📤 SENDING RESPONSE:", response);
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error saving conversation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save analysis and extract concepts' 
    }, { status: 500 });
  }
}

function tryParseJson(jsonString: any) {
  if (!jsonString) return [];
  
  try {
    const result = JSON.parse(jsonString);
    return Array.isArray(result) ? result : [result];
  } catch (e) {
    return typeof jsonString === 'string' ? [jsonString] : [];
  }
}

function guessCategoryFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    "LeetCode Problems": ["problem", "valid anagram", "two sum", "contains duplicate", "three sum", "merge sorted", "reverse linked", "palindrome"],
    "Data Structures": ["array", "list", "stack", "queue", "tree", "graph", "hash table", "hash map", "heap", "set"],
    "Algorithms": ["search", "sort", "traverse", "recursion", "dynamic", "greedy", "algorithm"],
    "Frontend": ["react", "angular", "vue", "dom", "html", "css", "tailwind", "ui", "component", "responsive"],
    "Backend": ["node", "express", "api", "server", "database", "sql", "nosql", "mongodb", "rest", "graphql"],
    "JavaScript": ["javascript", "js", "es6", "typescript", "promise", "async", "function", "array", "object"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }

  return "General";
}

function isRelatedContent(title1: string, title2: string): boolean {
  const lowerTitle1 = title1.toLowerCase();
  const lowerTitle2 = title2.toLowerCase();
  
  const relatedTopics = [
    "Frontend", "Backend", "JavaScript", "React", "Next.js", "CSS", "Data Structure", "Algorithm", "Machine Learning"
  ];
  
  for (const topic of relatedTopics) {
    if (lowerTitle1.includes(topic.toLowerCase()) && lowerTitle2.includes(topic.toLowerCase())) {
      return true;
    }
  }
  
  return false;
} 