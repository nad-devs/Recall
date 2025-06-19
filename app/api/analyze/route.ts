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
  if (!EXTRACTION_SERVICE_URL) {
    console.error("EXTRACTION_SERVICE_URL is not configured in environment variables.");
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

    // 3. Call the extraction service
    const extractionResponse = await fetch(EXTRACTION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_text: body.conversation_text }),
    });

    // For now, we'll skip the journey analysis until the endpoint is ready
    const journeyResponse = null;

    // 4. Handle Potential Errors from Services
    if (!extractionResponse.ok) {
      const extractionError = await extractionResponse.text();
      console.error("Error from extraction service:", extractionError);
      return NextResponse.json({ success: false, error: 'Failed to get analysis from backend services.' }, { status: 502 });
    }

    const extractionData = await extractionResponse.json();
    const journeyData = { learning_journey_analysis: {} }; // Default empty data for now

    // 5. Weave Data Together (initial simple version)
    console.log("✅ Analysis received from extraction service.");

    // TODO: Save to database once analysisSession table is created
    // const analysisSession = await prisma.analysisSession.create({
    //     data: {
    //         userId: user.id,
    //         conversationText: body.conversation_text,
    //         conceptsData: extractionData.concepts || [],
    //         journeyAnalysisData: journeyData.learning_journey_analysis || {},
    //     }
    // });

    // 6. Return the combined result to the client
    return NextResponse.json({
      success: true,
      concepts: extractionData.concepts,
      learning_journey: journeyData.learning_journey_analysis,
    });

  } catch (error) {
    console.error("Unhandled error during analysis orchestration:", error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 