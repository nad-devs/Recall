import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';

// Define the expected structure of the request body
interface AnalyzeRequestBody {
  conversation_text: string;
  // We can add more context if needed, like existing concepts
}

// URLs for our backend microservices, fetched from environment variables
const EXTRACTION_SERVICE_URL = process.env.EXTRACTION_SERVICE_URL;
const JOURNEY_ANALYSIS_URL = process.env.JOURNEY_ANALYSIS_URL;

export async function POST(request: Request) {
  // 1. Validate User Session
  const user = await validateSession(request as any);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  // 2. Validate Request Body
  if (!EXTRACTION_SERVICE_URL || !JOURNEY_ANALYSIS_URL) {
    console.error("One or more backend service URLs are not configured in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }
  
  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
    if (!body.conversation_text || typeof body.conversation_text !== 'string') {
      throw new Error("Missing or invalid 'conversation_text'");
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    console.log("🚀 Kicking off parallel analysis...");

    // 3. Make Concurrent Calls to Backend Services
    const [extractionResponse, journeyResponse] = await Promise.all([
      fetch(EXTRACTION_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_text: body.conversation_text }),
      }),
      fetch(JOURNEY_ANALYSIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_text: body.conversation_text }),
      }),
    ]);

    // 4. Handle Potential Errors from Services
    if (!extractionResponse.ok || !journeyResponse.ok) {
      const extractionError = !extractionResponse.ok ? await extractionResponse.text() : null;
      const journeyError = !journeyResponse.ok ? await journeyResponse.text() : null;
      console.error("Error from backend services:", { extractionError, journeyError });
      return NextResponse.json({ success: false, error: 'Failed to get analysis from backend services.' }, { status: 502 });
    }

    const extractionData = await extractionResponse.json();
    const journeyData = await journeyResponse.json();

    // 5. Weave Data Together (initial simple version)
    // Here we can save the raw results to the database or process them further.
    // For now, let's create a "AnalysisSession" to hold the results of this run.
    
    console.log("✅ Analysis received from both services.");

    const analysisSession = await prisma.analysisSession.create({
        data: {
            userId: user.id,
            conversationText: body.conversation_text,
            // Storing the raw JSON from our services
            conceptsData: extractionData.concepts || [],
            journeyAnalysisData: journeyData.learning_journey_analysis || {},
        }
    });

    console.log("💾 Analysis session saved to database with ID:", analysisSession.id);

    // 6. Return the combined result to the client
    return NextResponse.json({
      success: true,
      analysisSessionId: analysisSession.id,
      concepts: extractionData.concepts,
      learning_journey: journeyData.learning_journey_analysis,
    });

  } catch (error) {
    console.error("Unhandled error during analysis orchestration:", error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 