import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { validateSession } from '@/lib/session';

// Using the most straightforward Next.js API route pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`🔍 [Conversation Details] Starting request for conversation ID: ${id}`);
    
    if (!id) {
      console.log(`❌ [Conversation Details] No conversation ID provided`);
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Validate session - but make it optional
    const user = await validateSession(request);
    console.log(`🔍 [Conversation Details] validateSession result:`, {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isEmailBased: user?.isEmailBased
    });
    
    if (!user) {
      console.log(`❌ [Conversation Details] No authenticated user - returning not found`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log(`🔍 [Conversation Details] Looking for conversation with:`, {
      conversationId: id,
      userId: user.id
    });

    // First, let's check if the conversation exists at all (without user filter)
    const conversationExists = await prisma.conversation.findUnique({
      where: { id: id }
    });
    
    console.log(`🔍 [Conversation Details] Conversation exists check:`, {
      exists: !!conversationExists,
      actualUserId: conversationExists?.userId,
      requestedUserId: user.id,
      userMatch: conversationExists?.userId === user.id
    });

    // Fetch the conversation with its concepts and code snippets
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: id,
        userId: user.id // Ensure the user can only access their own conversations
      },
      include: {
        concepts: {
          include: {
            codeSnippets: true,
            occurrences: true,
          }
        },
      },
    });

    console.log(`🔍 [Conversation Details] Final conversation query result:`, {
      found: !!conversation,
      conversationId: conversation?.id,
      conceptsCount: conversation?.concepts?.length || 0
    });

    if (!conversation) {
      console.log(`❌ [Conversation Details] Conversation not found after user filter`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log(`✅ [Conversation Details] Successfully found conversation, processing response...`);

    // Process the conversation for the frontend
    const conceptMap = conversation.concepts.map(concept => concept.title);
    
    // Extract key points from all concepts
    const allKeyPoints = conversation.concepts
      .map((concept) => {
        try {
          return typeof concept.keyPoints === 'string'
            ? JSON.parse(concept.keyPoints)
            : concept.keyPoints;
        } catch (e) {
          return [];
        }
      })
      .flat()
      .filter(Boolean);

    // Generate summary using LLM
    let summary;
    try {
      summary = await generateSummaryWithLLM(conversation.text, conceptMap);
    } catch (error) {
      console.error('Error generating summary with LLM:', error);
      // Fallback to simple summary if LLM fails
      summary = generateSimpleSummary(conversation.text, conceptMap);
    }

    // Format the response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title, // Include the LLM-generated title
      text: conversation.text,
      summary: summary,
      conceptMap: conceptMap,
      keyPoints: allKeyPoints,
      concepts: conversation.concepts.map(concept => ({
        id: concept.id,
        title: concept.title,
        category: concept.category,
        summary: concept.summary,
        keyPoints: typeof concept.keyPoints === 'string' 
          ? JSON.parse(concept.keyPoints || '[]') 
          : concept.keyPoints || [],
        codeSnippets: concept.codeSnippets,
        needsReview: concept.confidenceScore < 0.7
      })),
      createdAt: conversation.createdAt,
    };

    console.log(`✅ [Conversation Details] Returning formatted conversation with ${formattedConversation.concepts.length} concepts`);
    return NextResponse.json(formattedConversation);
  } catch (error) {
    console.error('❌ [Conversation Details] Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// Helper function to check if text appears to be conversational
function isConversationalText(text: string): boolean {
  if (!text) return false;
  
  const conversationalStarts = [
    'hi', 'hello', 'hey', 'so as you know', 'so', 'thanks', 'i want to', 
    'i need', 'i am', 'i\'m', 'can you', 'could you', 'i have', 'what is'
  ];
  
  const lowerText = text.toLowerCase().trim();
  return conversationalStarts.some(phrase => lowerText.startsWith(phrase));
}

// Fallback simple summary generation
function generateSimpleSummary(text: string, concepts: string[]): string {
  if (concepts && concepts.length > 0) {
    if (concepts.length === 1) {
      return `Deep dive into ${concepts[0]}.`;
    } else if (concepts.length === 2) {
      return `Discussion about ${concepts[0]} and ${concepts[1]}.`;
    } else {
      return `Explored concepts including ${concepts.slice(0, 3).join(', ')}${concepts.length > 3 ? ', and more' : ''}.`;
    }
  }
  
  return 'Discussion about programming concepts.';
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

// Add DELETE method to remove a conversation and its associated concepts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Validate session - require authentication for DELETE
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in to delete conversations' }, { status: 401 });
    }

    // Check if the conversation exists and belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: { 
        id,
        userId: user.id // Ensure the user can only delete their own conversations
      },
      include: {
        concepts: true,
        occurrences: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Use a transaction to ensure all deletes succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete code snippets associated with concepts in this conversation
      for (const concept of conversation.concepts) {
        await tx.codeSnippet.deleteMany({
          where: { conceptId: concept.id }
        });
      }

      // Delete all occurrences associated with this conversation
      await tx.occurrence.deleteMany({
        where: { conversationId: id }
      });

      // Delete all concepts associated with this conversation
      await tx.concept.deleteMany({
        where: { conversationId: id }
      });

      // Delete the conversation itself
      await tx.conversation.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      success: true,
      message: 'Conversation and related concepts deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Database constraint error - please try again' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete conversation - please try again later' },
      { status: 500 }
    );
  }
}

// Generate a summary using LLM
async function generateSummaryWithLLM(text: string, concepts: string[]): Promise<string> {
  // Initialize OpenAI client only when needed
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a prompt for the LLM
  const prompt = `
    Below is a technical conversation about programming. 
    ${concepts.length > 0 ? `The main concepts discussed are: ${concepts.join(', ')}.` : ''}
    
    Write a single concise sentence (maximum 150 characters) summarizing what this conversation is about.
    Make it professional, informative, and focus on the technical content, not the conversation itself.
    
    Conversation:
    ${text.substring(0, 4000)} ${text.length > 4000 ? '...' : ''}
  `;
  
  // Call the OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a technical assistant that creates concise, professional summaries of programming conversations."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 100,
    temperature: 0.7,
  });
  
  // Return the generated summary
  return response.choices[0].message.content?.trim() || 'Discussion about programming concepts.';
} 