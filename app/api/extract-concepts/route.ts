import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_text, customApiKey } = body;

    if (!conversation_text) {
      return NextResponse.json(
        { error: 'Missing conversation text' },
        { status: 400 }
      );
    }

    console.log("🔄 Proxying request to Render backend...");

    // Use HTTP only for Render backend due to SSL issues
    const httpUrl = 'http://recall.p3vg.onrender.com';

    try {
      console.log("🌐 Connecting to Render backend via HTTP...");
      const response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text,
          context: null,
          category_guidance: null
        }),
      });

      console.log(`📊 Backend response status: ${response.status}`);

      if (response.ok) {
        console.log("✅ HTTP connection successful");
        const result = await response.json();
        console.log("📦 Received result from backend:", {
          concepts: result.concepts?.length || 0,
          summary: result.summary ? 'present' : 'missing'
        });
        return NextResponse.json(result);
      } else {
        const errorText = await response.text();
        console.error("❌ Render backend error:", response.status, errorText);
        return NextResponse.json(
          { 
            error: 'Backend service error',
            status: response.status,
            details: errorText,
            backendUrl: httpUrl
          },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error("🚨 Failed to connect to Render backend:", fetchError);
      return NextResponse.json(
        { 
          error: 'Backend service unavailable',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          backendUrl: httpUrl
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('💥 Error in extract-concepts proxy:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 