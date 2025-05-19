import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        concepts: {
          include: {
            codeSnippets: true
          }
        },
      },
      take: 10, // Limit to 10 most recent conversations
    });

    // Transform the data to match the expected format
    const formattedConversations = conversations.map((conversation: any) => {
      // Get all the key points from all concepts
      const allKeyPoints = conversation.concepts
        .map((concept: any) => {
          try {
            return Array.isArray(concept.keyPoints) 
              ? concept.keyPoints 
              : JSON.parse(concept.keyPoints);
          } catch (e) {
            return [];
          }
        })
        .flat()
        .filter(Boolean);

      // Use the concept titles directly for the conceptMap
      // Ensure there are no duplicates in the conceptMap
      const conceptSet = new Set(conversation.concepts.map((concept: any) => concept.title));
      const conceptMap = Array.from(conceptSet);
      
      // Use the title from the first concept if available, or generate one
      const title = conceptMap.length > 0 
        ? conceptMap[0] 
        : `Conversation ${conversation.id.substring(0, 8)}`;
      
      // Use the existing summary or create a meaningful fallback
      const summary = conversation.summary && conversation.summary.trim().length > 0
        ? conversation.summary
        : extractFocusedSummary(conversation.text);

      // Count code snippets across all concepts
      const codeSnippetCount = conversation.concepts.reduce(
        (count: number, concept: any) => count + (concept.codeSnippets?.length || 0), 
        0
      );

      return {
        id: conversation.id,
        title: title,
        summary: summary.substring(0, 200) + (summary.length > 200 ? '...' : ''),
        conceptMap: conceptMap,
        keyPoints: allKeyPoints.slice(0, 5), // Limit to 5 key points for display
        metadata: {
          extractionTime: conversation.createdAt,
          conceptCount: conversation.concepts.length,
          codeSnippetCount: codeSnippetCount
        },
        createdAt: conversation.createdAt
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// Extract a more focused summary
function extractFocusedSummary(text: string): string {
  if (!text) return '';
  
  // Look for a clear description or statement about the problem/topic
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  
  // Try to find a sentence that describes what the topic is about
  for (const sentence of sentences) {
    if (sentence.includes('involves') || 
        sentence.includes('is about') || 
        sentence.includes('refers to') ||
        sentence.includes('problem is')) {
      return sentence.trim();
    }
  }
  
  // If no clear description found, use the first 1-2 sentences
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join('. ').trim();
  }
  
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
} 