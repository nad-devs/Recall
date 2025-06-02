import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import OpenAI from 'openai';

// Initialize OpenAI client conditionally
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const user = await validateSession(request);
    if (!user) {
      // Return empty conversations array for unauthenticated users instead of 401
      console.log('No authenticated user - returning empty conversations array');
      return NextResponse.json([]);
    }

    // Get conversations for the authenticated user
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id
      },
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

    // Process conversations in parallel (with summaries)
    const formattedConversations = await Promise.all(conversations.map(async (conversation: any) => {
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
      const conceptMap = Array.from(conceptSet) as string[];
      
      // Use the LLM-generated title from the database, or generate a fallback
      let title = conversation.title || '';
      
      // If no title in database, generate one based on concepts
      if (!title || title.trim() === '') {
        if (conceptMap.length === 1) {
          title = `Discussion about ${conceptMap[0]}`;
        } else if (conceptMap.length === 2) {
          title = `${conceptMap[0]} and ${conceptMap[1]} Discussion`;
        } else if (conceptMap.length > 2) {
          title = `${conceptMap[0]}, ${conceptMap[1]} & More`;
        } else {
          title = `Conversation ${conversation.id.substring(0, 8)}`;
        }
      }
      
      // Check if the existing summary appears to be raw conversation text
      const existingSummary = conversation.summary || '';
      const isConversational = isConversationalText(existingSummary);
      const needsSummary = !existingSummary || 
                           existingSummary.length > 300 || 
                           isConversational ||
                           existingSummary.startsWith('The conversation focused on'); // Common pattern in bad summaries
      
      console.log(`📊 Summary analysis for ${conversation.id.substring(0, 8)}:`, {
        hasExisting: !!existingSummary,
        length: existingSummary.length,
        isConversational,
        needsRegeneration: needsSummary,
        preview: existingSummary.substring(0, 100)
      });
      
      // Generate a concise summary if needed
      let summary = '';
      if (needsSummary) {
        console.log(`🤖 Generating LLM summary for conversation ${conversation.id.substring(0, 8)}...`);
        try {
          summary = await generateSummaryWithLLM(conversation.text, conceptMap);
          console.log(`✅ LLM summary generated: "${summary}"`);
        } catch (error) {
          console.error('❌ Error generating summary with LLM:', error);
          // Fallback to a simpler approach if LLM fails
          summary = generateSimpleSummary(conversation.text, conceptMap);
          console.log(`🔄 Using fallback summary: "${summary}"`);
        }
      } else {
        summary = existingSummary;
        console.log(`📝 Using existing summary: "${summary.substring(0, 50)}..."`);
      }

      // For display on cards, limit the summary length but keep it readable
      const displaySummary = summary.length > 200
        ? summary.substring(0, 197) + '...'
        : summary;

      // Count code snippets across all concepts
      const codeSnippetCount = conversation.concepts.reduce(
        (count: number, concept: any) => count + (concept.codeSnippets?.length || 0), 
        0
      );

      return {
        id: conversation.id,
        title: title,
        summary: displaySummary,
        conceptMap: conceptMap,
        keyPoints: allKeyPoints.slice(0, 5), // Limit to 5 key points for display
        metadata: {
          extractionTime: conversation.createdAt,
          conceptCount: conversation.concepts.length,
          codeSnippetCount: codeSnippetCount
        },
        createdAt: conversation.createdAt
      };
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Return empty array with 200 status instead of error
    return NextResponse.json([], { status: 200 });
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

// Generate a summary using LLM
async function generateSummaryWithLLM(text: string, concepts: string[]): Promise<string> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY || !openai) {
    console.error('❌ OpenAI API key not found in environment variables');
    throw new Error('OpenAI API key not configured');
  }

  // Create a prompt for the LLM
  const prompt = `
    Below is a technical conversation about programming. 
    ${concepts.length > 0 ? `The main concepts discussed are: ${concepts.join(', ')}.` : ''}
    
    Write a single concise sentence (maximum 150 characters) summarizing what this conversation is about.
    Make it professional, informative, and focus on the technical content, not the conversation itself.
    
    Conversation:
    ${text.substring(0, 4000)} ${text.length > 4000 ? '...' : ''}
  `;
  
  console.log(`🔑 Making OpenAI API call with ${concepts.length} concepts...`);
  
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
  
  const generatedSummary = response.choices[0].message.content?.trim();
  console.log(`🎯 OpenAI response: "${generatedSummary}"`);
  
  // Return the generated summary
  return generatedSummary || 'Discussion about programming concepts.';
}

// Fallback simple summary generation if LLM call fails
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