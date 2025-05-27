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
        headers: {
          'User-Agent': 'Vercel-Frontend/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout for health check
        keepalive: false,
      });
      console.log("✅ Backend service is awake");
      // Small delay to ensure SSL is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (warmupError) {
      console.log("⚠️ Service warmup failed, proceeding anyway:", warmupError instanceof Error ? warmupError.message : 'Unknown error');
    }

    // Force disable SSL verification and use aggressive connection settings
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const httpsUrl = backendUrl;
    const httpUrl = backendUrl.replace('https://', 'http://');
    
    // Enhanced fetch options with forced SSL settings
    const createFetchOptions = (url: string) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Frontend/1.0',
        'Connection': 'close',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ 
        conversation_text,
        ...(customApiKey && { customApiKey }),
        context: null,
        category_guidance: null
      }),
      keepalive: false,
      // Force disable certificate validation
      ...(url.startsWith('https') && {
        rejectUnauthorized: false,
      }),
    });
    
    let response;
    
    // Strategy 1: Try HTTPS with aggressive SSL bypass
    try {
      console.log("🔒 Attempting HTTPS with forced SSL bypass...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      response = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        ...createFetchOptions(httpsUrl),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log("✅ HTTPS connection successful with SSL bypass");
    } catch (sslError) {
      console.log("🔄 HTTPS with SSL bypass failed, trying direct HTTP...", sslError instanceof Error ? sslError.message : 'Connection failed');
      
      // Strategy 2: Direct HTTP fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          ...createFetchOptions(httpUrl),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("✅ HTTP connection successful");
      } catch (httpError) {
        console.log("🔄 HTTP also failed, trying without timeout...", httpError instanceof Error ? httpError.message : 'Connection failed');
        
        // Strategy 3: Last resort - no timeout, basic fetch
        response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            conversation_text,
            ...(customApiKey && { customApiKey }),
          }),
        });
        console.log("✅ Basic HTTP connection successful");
      }
    }
    
    // Restore original TLS setting
    if (originalRejectUnauthorized !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }

    console.log(`📊 Backend response status: ${response.status}`);
    console.log(`📊 Backend response headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
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
          backendUrl: httpsUrl
        },
        { status: response.status }
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