import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Using the most straightforward Next.js API route pattern
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Fix for Next.js 15: await the params object before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
  }

  try {
    // Fetch the conversation with its concepts and their code snippets
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        concepts: {
          include: {
            codeSnippets: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get the first concept as the main concept if available
    const mainConcept = conversation.concepts.length > 0 ? conversation.concepts[0] : null;
    
    // Use the first concept title as the conversation title if available
    const title = mainConcept?.title || `Conversation ${conversation.id.substring(0, 8)}`;
    
    // Use the existing summary or create a fallback
    const summary = conversation.summary || 
                    conversation.text.substring(0, 300) + 
                    (conversation.text.length > 300 ? '...' : '');

    // Collect all code snippets
    const allCodeSnippets = conversation.concepts.flatMap(concept => 
      concept.codeSnippets.map(snippet => ({
        language: snippet.language || 'Unknown',
        code: snippet.code,
        description: snippet.description || '',
        conceptId: concept.id
      }))
    );

    // Format the conversation data consistently
    const formattedConversation = {
      id: conversation.id,
      title: title,
      date: conversation.createdAt,
      summary: summary,
      concepts: conversation.concepts.map(concept => ({
        id: concept.id,
        title: concept.title
      })),
      codeSnippets: allCodeSnippets
    };

    // Process concepts to ensure consistent data structure
    const formattedConcepts = conversation.concepts.map(concept => {
      let keyPoints: string[] = [];
      try {
        // Handle both string and array formats for keyPoints
        keyPoints = typeof concept.keyPoints === 'string' 
          ? JSON.parse(concept.keyPoints) 
          : concept.keyPoints || [];
        // Ensure keyPoints is an array
        if (!Array.isArray(keyPoints)) keyPoints = [String(keyPoints)];
      } catch (e) {
        keyPoints = typeof concept.keyPoints === 'string' 
          ? [concept.keyPoints] 
          : [];
      }

      // Process related concepts
      let relatedConcepts: string[] = [];
      try {
        relatedConcepts = typeof concept.relatedConcepts === 'string'
          ? JSON.parse(concept.relatedConcepts)
          : concept.relatedConcepts || [];
        if (!Array.isArray(relatedConcepts)) relatedConcepts = [String(relatedConcepts)];
      } catch (e) {
        relatedConcepts = [];
      }

      // Return concept data with consistent format
      return {
        id: concept.id,
        title: concept.title,
        category: concept.category || '',
        summary: concept.summary || '',
        details: concept.details || '',
        keyPoints: keyPoints,
        examples: concept.examples || '[]',
        relatedConcepts: relatedConcepts,
        relationships: concept.relationships || '{}',
        conversationId: concept.conversationId,
        codeSnippets: concept.codeSnippets || []
      };
    });

    return NextResponse.json({
      conversation: formattedConversation,
      concepts: formattedConcepts,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// Helper function to safely parse JSON
function tryParseJson(jsonString: any) {
  if (!jsonString) return [];
  if (Array.isArray(jsonString)) return jsonString;
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [jsonString];
  } catch (e) {
    return typeof jsonString === 'string' ? [jsonString] : [];
  }
} 