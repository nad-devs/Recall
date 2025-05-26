import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    const { conversation_text, analysis, confirmUpdate = false, customApiKey } = await request.json();
    
    // Get client information for usage tracking
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Validate API key if provided
    let validatedApiKey = null;
    if (customApiKey) {
      try {
        const validateResponse = await fetch('http://localhost:3000/api/validate-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: customApiKey })
        });
        
        if (validateResponse.ok) {
          validatedApiKey = customApiKey;
        } else {
          // Invalid API key - treat as no API key
          validatedApiKey = null;
        }
      } catch (error) {
        console.error('API key validation failed:', error);
        validatedApiKey = null;
      }
    }

    // Check if user can make a conversation (server-side validation)
    const canMake = await canMakeServerConversation(clientIP, userAgent, validatedApiKey);
    if (!canMake) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have reached the 25 free conversation limit. Please add your OpenAI API key to continue.',
        requiresApiKey: true
      }, { status: 403 });
    }
    
    console.log("Server received:", JSON.stringify({ conversation_text, analysis, confirmUpdate }, null, 2));
    
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
        // Add redirect information to direct users to the conversation page
        redirectTo: `/conversation/${existingConversation.id}`
      });
    }

    // Ensure analysis is never undefined for the rest of the processing
    const safeAnalysis = analysis || { concepts: [] };

    // Get concepts from conceptMap or concepts array
    let conceptsToProcess: Concept[] = [];
    
    // Process concepts from the analysis.concepts array if available
    if (safeAnalysis.concepts && safeAnalysis.concepts.length > 0) {
      conceptsToProcess = safeAnalysis.concepts;
    } 
    // If we have a conceptMap array, create concepts from it
    else if (safeAnalysis.conceptMap && Array.isArray(safeAnalysis.conceptMap) && safeAnalysis.conceptMap.length > 0) {
      // Convert each concept name to a concept object
      conceptsToProcess = safeAnalysis.conceptMap.map((title: string) => ({
        title,
        // Attempt to determine a more specific category from the title
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
      
      // Use a simpler fallback approach without being too specific
      const summary = safeAnalysis.conversation_summary || '';
      
      // Create a generic fallback concept based on the content
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



    // Create the conversation - use safe approach to handle potential missing fields in schema
    try {
      // Prepare the data using only fields we know exist in the schema
      const conversationData: any = {
        text: conversation_text,
        summary: analysis?.conversation_summary || '',
        createdAt: new Date(),
      };
      
      // Only include title if it's in the schema - this helps prevent errors
      if (analysis?.conversation_title) {
        try {
          // First check if we can query a conversation with title field
          // This is a safe way to detect if the field exists in the schema
          await prisma.$queryRaw`SELECT title FROM Conversation LIMIT 1`;
          // If no error, add the title to our data
          conversationData.title = analysis.conversation_title;
        } catch (err) {
          console.log("Title field doesn't exist in schema, omitting it");
          // Skip adding title if it doesn't exist in schema
        }
      }
      
      const conversation = await prisma.conversation.create({
        data: conversationData,
      });

      // Store created concept IDs to establish relationships later
      const createdConceptIds = new Map<string, string>();
      
      // First pass: create or update all concepts
      for (const concept of conceptsToProcess) {
        // Skip empty concepts
        if (!concept.title) continue;
        
        // Normalize the concept data
        const keyPoints = Array.isArray(concept.keyPoints)
          ? concept.keyPoints
          : tryParseJson(concept.keyPoints || '[]');
        
        const examples = typeof concept.examples === 'object' 
          ? JSON.stringify(concept.examples) 
          : concept.examples || '[]';
          
        const details = typeof concept.details === 'object' 
          ? JSON.stringify(concept.details) 
          : concept.details || '';
          
        const relationships = typeof concept.relationships === 'object' 
          ? JSON.stringify(concept.relationships) 
          : concept.relationships || '{}';

        // Preserve category from analysis - only guess if no category was provided at all
        const category = concept.category || guessCategoryFromTitle(concept.title);

        // Check if this concept already exists - using improved matching
        // Convert the title to lowercase and normalize it for comparison
        const normalizedTitle = concept.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // First, try to find exact or close matches
        const existingConcepts = await prisma.concept.findMany({
          where: {
            OR: [
              { title: { equals: concept.title } },
              { title: { equals: normalizedTitle } }
            ]
          }
        });
        
        // If no exact matches, look for similar titles (e.g., "Contains Duplicate" and "Contains Duplicate Problem")
        let existingConcept = existingConcepts[0];
        let conceptId;
        let leetCodeMatch = null;
        
        if (!existingConcept && (
            // Handle common cases for duplicate prevention
            concept.title.includes("Contains Duplicate") || 
            normalizedTitle.includes("contains duplicate") 
        )) {
          // Find concepts with similar titles
          const similarConcepts = await prisma.concept.findMany({
            where: {
              title: {
                contains: "Duplicate"
              }
            }
          });
          
          // Find the most similar match
          for (const similar of similarConcepts) {
            const similarTitle = similar.title.toLowerCase().trim();
            // Check if one title contains the other
            if (
              similarTitle.includes("contains duplicate") || 
              normalizedTitle.includes(similarTitle) ||
              similarTitle.includes(normalizedTitle)
            ) {
              existingConcept = similar;
              break;
            }
          }
        }
        
        // Special case for LeetCode problems - check for standard LeetCode names with alternate wordings
        if (!existingConcept && concept.category === "LeetCode Problems") {
          // List of standard LeetCode problem names
          const standardNames = [
            "Contains Duplicate",
            "Valid Anagram",
            "Two Sum",
            "Reverse Linked List",
            "Maximum Subarray"
          ];
          
          // Check if this concept's title is a variation of a standard name
          const titleLower = concept.title.toLowerCase();
          for (const stdName of standardNames) {
            if (titleLower.includes(stdName.toLowerCase()) && titleLower !== stdName.toLowerCase()) {
              // We found a variation - look for the standard name in the database
              leetCodeMatch = await prisma.concept.findFirst({
                where: {
                  title: {
                    equals: stdName
                  }
                }
              });
              if (leetCodeMatch) break;
            }
          }
        }
        
        if (existingConcept) {
          // Update existing concept with new information
          const updatedConcept = await prisma.concept.update({
            where: { id: existingConcept.id },
            data: {
              summary: existingConcept.summary 
                ? existingConcept.summary 
                : concept.summary || '',
              // Only update details if the existing details is empty or if the new details is from the same topic
              // This prevents unrelated content from being mixed together
              details: (existingConcept.details === '{}' || existingConcept.details === '' || 
                       isRelatedContent(existingConcept.title, concept.title))
                ? details
                : existingConcept.details,
              keyPoints: existingConcept.keyPoints !== '[]' && existingConcept.keyPoints !== ''
                ? existingConcept.keyPoints
                : JSON.stringify(keyPoints),
              // Use the derived category if existing one is empty
              category: existingConcept.category || category,
              lastUpdated: new Date(),
              // Add new code snippets if they exist
              codeSnippets: {
                create: (concept.codeSnippets || []).map((snippet: CodeSnippet) => ({
                  language: snippet.language || 'Unknown',
                  description: snippet.description || '',
                  code: snippet.code || '',
                })),
              },
              // If no conversationId is set, link it to the current conversation
              conversationId: existingConcept.conversationId || conversation.id
            },
          });
          
          conceptId = existingConcept.id;
        } else if (leetCodeMatch) {
          // We found a standard LeetCode problem with a different title variation
          // Update it with new information while keeping the standard name
          const updatedConcept = await prisma.concept.update({
            where: { id: leetCodeMatch.id },
            data: {
              summary: leetCodeMatch.summary 
                ? leetCodeMatch.summary 
                : concept.summary || '',
              details: (leetCodeMatch.details === '{}' || leetCodeMatch.details === '' || 
                       concept.details)
                ? details
                : leetCodeMatch.details,
              keyPoints: leetCodeMatch.keyPoints !== '[]' && leetCodeMatch.keyPoints !== ''
                ? leetCodeMatch.keyPoints
                : JSON.stringify(keyPoints),
              category: "LeetCode Problems", // Ensure the category is set correctly
              lastUpdated: new Date(),
              // Add new code snippets if they exist
              codeSnippets: {
                create: (concept.codeSnippets || []).map((snippet: CodeSnippet) => ({
                  language: snippet.language || 'Unknown',
                  description: snippet.description || '',
                  code: snippet.code || '',
                })),
              },
              conversationId: leetCodeMatch.conversationId || conversation.id
            },
          });
          
          conceptId = leetCodeMatch.id;
        } else {
          // Create new concept
          const newConcept = await prisma.concept.create({
            data: {
              title: concept.title,
              category: category, // Use the derived category
              summary: concept.summary || '',
              details: details,
              keyPoints: JSON.stringify(keyPoints),
              examples: examples,
              relatedConcepts: '[]', // We'll update this in the second pass
              relationships: relationships,
              confidenceScore: 0.5, // Start with low confidence so it needs review
              lastUpdated: new Date(),
              conversationId: conversation.id, // Always link to the current conversation
              // Create code snippets if they exist
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
      
      // Note: Removed auto-generation of fundamental concepts to avoid redundancy
      // If users want individual concepts, they should be explicitly extracted or created
      
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
        
        // Note: Removed auto-detection of fundamental concepts from titles
        // Related concepts should be explicitly defined in the extraction process
        
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
              // Store both IDs of existing concepts and names of concepts that don't exist yet
              relatedConcepts: JSON.stringify([
                ...relatedConceptIds.map(id => ({ id })),
                ...relatedConcepts
                  .filter((title: string) => !createdConceptIds.has(title.toLowerCase()))
                  .map((title: string) => ({ title }))
              ]),
              // Ensure the concept is properly linked to the conversation
              conversationId: conversation.id
            }
          });
        }
        
        // Note: Removed bidirectional linking with auto-generated fundamental concepts
        // Relationships should be managed explicitly through the extraction process
      }

      // Increment conversation count on successful save
      await incrementServerConversationCount(clientIP, userAgent, validatedApiKey);

      // Return a success response with redirect to the concepts page
      return NextResponse.json({ 
        success: true, 
        message: "Conversation saved successfully",
        conversationId: conversation.id,
        conceptIds: Array.from(createdConceptIds.values()),
        // Add redirect information to direct users to the specific conversation page
        redirectTo: `/conversation/${conversation.id}`
      });
    } catch (error) {
      // If we encounter a database-related error, let's try to create without the title field
      console.error('First attempt at saving conversation failed, trying without title:', error);
      
      const conversation = await prisma.conversation.create({
        data: {
          text: conversation_text,
          summary: analysis?.conversation_summary || '',
          createdAt: new Date()
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Conversation saved successfully (fallback mode)",
        conversationId: conversation.id,
        // Add redirect information to direct users to the specific conversation page
        redirectTo: `/conversation/${conversation.id}`
      });
    }
  } catch (error) {
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
    // If it's not valid JSON, treat it as a single string value
    return typeof jsonString === 'string' ? [jsonString] : [];
  }
}

// Helper function to guess the category from the title
function guessCategoryFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Mapping of keywords to categories - order matters, more specific first
  const categoryKeywords: Record<string, string[]> = {
    "Algorithmic Technique": ["frequency counting", "two pointers", "sliding window", "counting", "technique", "approach", "method", "pattern"],
    "LeetCode Problems": ["problem", "valid anagram", "two sum", "contains duplicate", "three sum", "merge sorted", "reverse linked", "palindrome"],
    "Frontend": ["react", "angular", "vue", "dom", "html", "css", "tailwind", "ui", "component", "responsive"],
    "Backend": ["node", "express", "api", "server", "database", "sql", "nosql", "mongodb", "rest", "graphql"],
    "JavaScript": ["javascript", "js", "es6", "typescript", "promise", "async", "function", "array", "object"],
    "React": ["react", "hook", "component", "props", "state", "effect", "context", "redux"],
    "Next.js": ["next", "app router", "ssr", "static", "rendering", "page", "link"],
    "CSS": ["css", "style", "grid", "flex", "tailwind", "sass", "scss"],
    "Data Structures": ["array", "list", "stack", "queue", "tree", "graph", "hash table", "hash map", "heap", "set"],
    "Algorithms": ["search", "sort", "traverse", "recursion", "dynamic", "greedy", "algorithm"],
    "Machine Learning": ["ml", "ai", "model", "training", "feature", "neural", "deep learning", "nlp", "classification"]
  };

  // Check for category matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }

  // Default category
  return "General";
}

// Note: Removed detectFundamentalConcepts function as auto-generation was removed

function isRelatedContent(title1: string, title2: string): boolean {
  const lowerTitle1 = title1.toLowerCase();
  const lowerTitle2 = title2.toLowerCase();
  
  // Define related topics
  const relatedTopics = [
    "Frontend", "Backend", "JavaScript", "React", "Next.js", "CSS", "Data Structure", "Algorithm", "Machine Learning"
  ];
  
  // Check if any of the related topics are present in both titles
  for (const topic of relatedTopics) {
    if (lowerTitle1.includes(topic.toLowerCase()) && lowerTitle2.includes(topic.toLowerCase())) {
      return true;
    }
  }
  
  return false;
} 