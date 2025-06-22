import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import { generateEmbedding } from '@/ai/flows/generate-embedding';
import { findSimilarConcepts, SearchResult } from '@/lib/vector-search';
import { generateLearningJourney } from '@/ai/flows/generate-learning-journey';

// Define the expected structure of the request body
interface AnalyzeRequestBody {
  conversation_text: string;
}

// URL for the new, unified extraction service
const UNIFIED_ANALYSIS_SERVICE_URL = process.env.PYTHON_ANALYSIS_SERVICE_URL || 'https://recall-p3vg.onrender.com/api/v1/extract-concepts';

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
  console.log("--- FRONTEND /api/analyze ENDPOINT HIT ---");
  // 1. Validate User and Request
  const user = await validateSession(request as any);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
    console.log("--- BACKEND API ROUTE (Next.js) ---");
    console.log("Received conversation text:", body.conversation_text);
    if (!body.conversation_text) {
      throw new Error("Missing 'conversation_text'");
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!UNIFIED_ANALYSIS_SERVICE_URL) {
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 2. Extract initial concepts from the new, unified external service
    const extractionResponse = await fetch(UNIFIED_ANALYSIS_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        conversation_text: body.conversation_text
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error(`Unified analysis service failed: ${await extractionResponse.text()}`);
    }

    const extractionData = await extractionResponse.json();
    const newConcepts = extractionData.concepts || [];
    console.log(`✅ Extracted ${newConcepts.length} new concepts from backend.`);

    // --- Perform deep, database-aware relationship analysis ---
    console.log("🧠 Performing deep relationship analysis across the database...");
    let deepAnalysisResults = [];
    try {
      const host = request.headers.get('host');
      const protocol = host?.startsWith('localhost') ? 'http' : 'https';
      const analyzeRelationshipsUrl = `${protocol}://${host}/api/concepts/analyze-relationships`;

      const relationshipsResponse = await fetch(analyzeRelationshipsUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
         },
        body: JSON.stringify({ concepts: newConcepts }),
      });

      if (relationshipsResponse.ok) {
        deepAnalysisResults = await relationshipsResponse.json();
        console.log(`✅ Deep relationship analysis complete. Found ${deepAnalysisResults.length} concepts with new relationships.`);
      } else {
        console.error("Deep relationship analysis failed:", await relationshipsResponse.text());
      }
    } catch (error) {
      console.error("Error calling analyze-relationships endpoint:", error);
    }

    // Merge deep analysis results back into the concepts
    const finalConcepts = newConcepts.map((concept: any) => {
      const deepData = deepAnalysisResults.find((d: any) => d.title === concept.title);
      return deepData ? { ...concept, embeddingData: deepData } : concept;
    });

    console.log(`🧠 Starting learning journey generation...`);

    // Generate the final learning journey with this new, high-quality context
    // We get the existing concepts from the `potentialDuplicates` field of our new deep analysis
    const existingConcepts = finalConcepts.flatMap((c: any) => c.embeddingData?.potentialDuplicates || []);
    const learningJourney = await generateLearningJourney(finalConcepts, existingConcepts);

    // Return the final, enriched data to the client
    return NextResponse.json({
      success: true,
      concepts: finalConcepts,
      learning_journey: learningJourney,
    });

  } catch (error) {
    console.error("Unhandled error during analysis orchestration:", error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 