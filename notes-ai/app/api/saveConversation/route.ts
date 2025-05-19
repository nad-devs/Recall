import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const { conversation_text, analysis } = await request.json();
    
    console.log("Server received:", JSON.stringify({ conversation_text, analysis }, null, 2));
    
    // Check if similar conversation already exists (based on first 100 chars)
    const textToCheck = conversation_text.substring(0, 100);
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        text: {
          startsWith: textToCheck
        }
      },
      include: {
        concepts: true
      }
    });
    
    // If we found an existing conversation with similar content
    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation.id);
      return NextResponse.json({ 
        success: true, 
        message: "Conversation already exists",
        conversationId: existingConversation.id,
        alreadyExists: true
      });
    }
    
    // Create the conversation
    const conversation = await prisma.conversation.create({
      data: {
        text: conversation_text,
        summary: analysis.learningSummary || '',
      },
    });

    // Get concepts from conceptMap or concepts array
    let conceptsToProcess: Concept[] = [];
    
    // Process concepts from the analysis.concepts array if available
    if (analysis.concepts && analysis.concepts.length > 0) {
      conceptsToProcess = analysis.concepts;
    } 
    // If we have a conceptMap array, create concepts from it
    else if (analysis.conceptMap && Array.isArray(analysis.conceptMap) && analysis.conceptMap.length > 0) {
      // Convert each concept name to a concept object
      conceptsToProcess = analysis.conceptMap.map((title: string) => ({
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

    // No concepts found to process
    if (conceptsToProcess.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No concepts were extracted from the conversation",
        conversationId: conversation.id
      });
    }

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

      // Ensure category is set - try to derive from title if not provided
      const category = concept.category || guessCategoryFromTitle(concept.title);

      // Check if this concept already exists
      const existingConcept = await prisma.concept.findFirst({
        where: {
          title: {
            equals: concept.title.toLowerCase()
          }
        }
      });

      let conceptId;
      
      if (existingConcept) {
        // Update existing concept with new information
        const updatedConcept = await prisma.concept.update({
          where: { id: existingConcept.id },
          data: {
            summary: existingConcept.summary 
              ? existingConcept.summary 
              : concept.summary || '',
            details: existingConcept.details !== '{}' && existingConcept.details !== ''
              ? existingConcept.details
              : details,
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
          },
        });
        
        conceptId = existingConcept.id;
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
            confidenceScore: concept.confidenceScore || 0.8,
            lastUpdated: new Date(),
            conversationId: conversation.id,
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
    
    // Second pass: establish relationships between concepts
    for (const concept of conceptsToProcess) {
      if (!concept.title || !createdConceptIds.has(concept.title.toLowerCase())) continue;
      
      const conceptId = createdConceptIds.get(concept.title.toLowerCase());
      
      // Get the related concepts
      let relatedConcepts = [];
      if (concept.relatedConcepts) {
        if (Array.isArray(concept.relatedConcepts)) {
          relatedConcepts = concept.relatedConcepts;
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
            // Store both IDs of existing concepts and names of concepts that don't exist yet
            relatedConcepts: JSON.stringify([
              ...relatedConceptIds.map(id => ({ id })),
              ...relatedConcepts
                .filter((title: string) => !createdConceptIds.has(title.toLowerCase()))
                .map((title: string) => ({ title }))
            ])
          }
        });
      }
    }

    // Return a success response with redirect to the concepts page
    return NextResponse.json({ 
      success: true, 
      message: "Analysis saved successfully",
      conversationId: conversation.id,
      // Redirect to concepts rather than conversation
      redirectTo: `/concepts`
    });
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

  // Mapping of keywords to categories
  const categoryKeywords: Record<string, string[]> = {
    "Frontend": ["react", "angular", "vue", "dom", "html", "css", "tailwind", "ui", "component", "responsive"],
    "Backend": ["node", "express", "api", "server", "database", "sql", "nosql", "mongodb", "rest", "graphql"],
    "JavaScript": ["javascript", "js", "es6", "typescript", "promise", "async", "function", "array", "object"],
    "React": ["react", "hook", "component", "props", "state", "effect", "context", "redux"],
    "Next.js": ["next", "app router", "ssr", "static", "rendering", "page", "link"],
    "CSS": ["css", "style", "grid", "flex", "tailwind", "sass", "scss"],
    "Data Structure": ["array", "list", "stack", "queue", "tree", "graph", "hash", "heap", "map", "set"],
    "Algorithm": ["search", "sort", "traverse", "recursion", "dynamic", "greedy"],
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