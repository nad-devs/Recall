import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { concept } = body;

    console.log('🔧 Generate Quiz API - User:', user.id, 'Concept:', concept?.title);

    if (!concept || !concept.title || !concept.summary) {
      return NextResponse.json(
        { error: 'Missing required concept data' },
        { status: 400 }
      );
    }

    // Call the Python microservice to generate quiz questions
    const httpsUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
    const httpUrl = httpsUrl.replace('https://', 'http://');

    let response;
    try {
      console.log("Attempting HTTPS connection for quiz generation...");
      response = await fetch(`${httpsUrl}/api/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      });
    } catch (sslError) {
      console.log("HTTPS failed for quiz generation, trying HTTP fallback...", sslError instanceof Error ? sslError.message : 'SSL connection failed');
      response = await fetch(`${httpUrl}/api/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      });
    }

    if (!response.ok) {
      throw new Error(`Python service responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔧 Generate Quiz API - Success, generated', result.questions?.length || 0, 'questions');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
} 