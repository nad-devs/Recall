import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import { generateEmbedding } from '@/ai/flows/generate-embedding';
import { findSimilarConcepts, SearchResult } from '@/lib/vector-search';
import { generateLearningJourney } from '@/ai/flows/generate-learning-journey';

// Define the expected structure of the request body
interface AnalyzeRequestBody {
  conversation_text: string;
  mode: 'deepdive' | 'recall';
}

// URL for the "dumb" extraction service
const EXTRACTION_SERVICE_URL = process.env.EXTRACTION_SERVICE_URL;

// This is where we'll orchestrate the "smart" comparison
// We'll need a way to call an AI model from here.
// For now, let's mock the response.
async function getLearningJourneyAnalysis(newConcepts: any[], existingConcepts: any[]): Promise<any> {
  console.log(`🧠 Performing learning journey analysis by comparing ${newConcepts.length} new concepts against ${existingConcepts.length} existing ones.`);
  
  // In a real implementation, this would make a call to an AI service (e.g., OpenAI)
  // with a prompt that asks it to compare the two lists and generate insights.
  if (existingConcepts.length > 0) {
    // Mock response to show it's working
    return {
      summary: "Based on your history, you're building on your knowledge of data structures.",
      analyses: newConcepts.map(c => ({
        conceptTitle: c.title,
        isLearningNewTopic: !existingConcepts.some(ec => ec.title === c.title),
        masteredPrerequisites: ["Arrays", "Basic Data Structures"], // Mock data
        suggestedNextSteps: ["Advanced Topic A", "Practical Application B"], // Mock data
        learningProgress: Math.random() // Mock data
      }))
    }
  }

  // If there's no history, return an empty analysis
  return {};
}

export async function POST(request: Request) {
  // 1. Validate User and Request
  const user = await validateSession(request as any);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
    if (!body.conversation_text || !body.mode) {
      throw new Error("Missing 'conversation_text' or 'mode'");
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!EXTRACTION_SERVICE_URL) {
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 2. Extract initial concepts from the external service
    const extractionResponse = await fetch(EXTRACTION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_text: body.conversation_text, mode: body.mode }),
    });

    if (!extractionResponse.ok) {
      throw new Error(`Extraction service failed: ${await extractionResponse.text()}`);
    }

    const extractionData = await extractionResponse.json();
    const newConcepts = extractionData.concepts || [];
    console.log(`✅ Extracted ${newConcepts.length} new concepts.`);

    // 3. Enhance new concepts with vector search results
    const enhancedConceptsInfo = [];
    for (const concept of newConcepts) {
      const textToEmbed = `${concept.title}: ${concept.summary}`;
      const embedding = await generateEmbedding(textToEmbed);
      
      let similarConcepts: SearchResult[] = [];
      if (embedding.length > 0) {
        similarConcepts = await findSimilarConcepts(embedding, user.id);
      }
      
      enhancedConceptsInfo.push({
        ...concept,
        // Add the search result to the concept object itself for the next step
        similarExistingConcepts: similarConcepts 
      });
    }
    console.log(`✅ Enhanced new concepts with similarity search results.`);

    // 4. Generate the final learning journey with this new, high-quality context
    // The `generateLearningJourney` function expects a list of new concepts and a list of existing ones.
    // We can now provide the accurate list of existing concepts found via vector search.
    const learningJourney = await generateLearningJourney(newConcepts, enhancedConceptsInfo.flatMap(c => c.similarExistingConcepts));

    // 5. Return the final, enriched data to the client
    return NextResponse.json({
      success: true,
      concepts: enhancedConceptsInfo, // Send the concepts with the similarity data included
      learning_journey: learningJourney,
    });

  } catch (error) {
    console.error("Unhandled error during analysis orchestration:", error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 