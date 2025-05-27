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

    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
    
    // First, wake up the service with a health check to avoid SSL cold start issues
    try {
      console.log("🔋 Warming up backend service...");
      await fetch(`${backendUrl}/api/v1/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout for health check
      });
      console.log("✅ Backend service is awake");
      // Small delay to ensure SSL is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (warmupError) {
      console.log("⚠️ Service warmup failed, proceeding anyway:", warmupError instanceof Error ? warmupError.message : 'Unknown error');
    }

    try {
      console.log("🌐 Connecting to Render backend via HTTPS...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${backendUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text,
          ...(customApiKey && { customApiKey }),
          context: null,
          category_guidance: null
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`📊 Backend response status: ${response.status}`);
      console.log(`📊 Backend response headers:`, Object.fromEntries(response.headers.entries()));

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
            backendUrl: backendUrl
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
          backendUrl: backendUrl
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