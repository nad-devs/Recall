import { NextRequest, NextResponse } from 'next/server';
import { canMakeServerConversation } from '@/lib/usage-tracker-server';

// Let the backend handle all pattern detection and analysis

// Removed hardcoded fallback - backend should handle all intelligent analysis

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_text, customApiKey, user_id } = body;

    if (!conversation_text) {
      return NextResponse.json(
        { error: 'Missing conversation text' },
        { status: 400 }
      );
    }

    // Server-side usage validation - check if user can make a conversation
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Check if user can make a conversation (server-side validation)
    if (!customApiKey) {
      const canMake = await canMakeServerConversation(clientIP, userAgent, customApiKey);
      if (!canMake) {
        return NextResponse.json({ 
          success: false, 
          error: 'You have reached the 25 free conversation limit. Please add your OpenAI API key to continue.',
          requiresApiKey: true
        }, { status: 403 });
      }
    }

    console.log("🔄 Proxying request to Render backend...");
    console.log("📝 Conversation preview:", conversation_text.substring(0, 200) + "...");
    console.log("🔑 Using custom API key:", !!customApiKey);
    console.log("👤 User ID:", user_id || 'not provided');

    // Let backend handle all analysis without frontend guidance

    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || 'https://recall-p3vg.onrender.com';
    
    // First, wake up the service with a health check to avoid SSL cold start issues
    try {
      console.log("🔋 Warming up backend service...");
      await fetch(`${backendUrl}/api/v1/health`, { 
        method: 'GET',
        headers: {
          'User-Agent': 'Vercel-Frontend/1.0',
        },
        signal: AbortSignal.timeout(15000), // Increased timeout for health check
        keepalive: false,
      });
      console.log("✅ Backend service is awake");
      // Longer delay to ensure SSL is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (warmupError) {
      console.log("⚠️ Service warmup failed, proceeding anyway:", warmupError instanceof Error ? warmupError.message : 'Unknown error');
    }

    // TLS settings are configured in vercel.json for deployment
    const httpsUrl = backendUrl;
    const httpUrl = backendUrl.replace('https://', 'http://');
    
    // Enhanced fetch options
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
        ...(customApiKey && { custom_api_key: customApiKey }),
        ...(user_id && { user_id: user_id }),
        context: null
      }),
      keepalive: false,
    });
    
    let response;
    let backendSuccess = false;
    let lastError = null;
    
    // Strategy 1: Try HTTPS with aggressive SSL bypass (longer timeout)
    try {
      console.log("🔒 Attempting HTTPS with forced SSL bypass...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds
      
      response = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        ...createFetchOptions(httpsUrl),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log("✅ HTTPS connection successful with SSL bypass");
      backendSuccess = true;
    } catch (sslError) {
      lastError = sslError;
      console.log("🔄 HTTPS with SSL bypass failed, trying direct HTTP...", sslError instanceof Error ? sslError.message : 'Connection failed');
      
      // Strategy 2: Direct HTTP fallback (longer timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds
        
        response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          ...createFetchOptions(httpUrl),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("✅ HTTP connection successful");
        backendSuccess = true;
      } catch (httpError) {
        lastError = httpError;
        console.log("🔄 HTTP also failed, trying without timeout...", httpError instanceof Error ? httpError.message : 'Connection failed');
        
        // Strategy 3: Last resort - no timeout, basic fetch
        try {
          response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              conversation_text,
              ...(customApiKey && { custom_api_key: customApiKey }),
              ...(user_id && { user_id: user_id }),
              context: null
            }),
          });
          console.log("✅ Basic HTTP connection successful");
          backendSuccess = true;
        } catch (finalError) {
          lastError = finalError;
          console.log("❌ All backend connection attempts failed:", finalError instanceof Error ? finalError.message : 'Connection failed');
          backendSuccess = false;
        }
      }
    }
    
    // If backend failed completely, return a proper error (NO FALLBACK)
    if (!backendSuccess || !response) {
      console.log("❌ Backend completely failed - no fallback, returning error");
      return NextResponse.json(
        { 
          error: 'AI analysis service temporarily unavailable',
          details: 'The AI backend service is not responding. Please try again in a moment.',
          lastError: lastError instanceof Error ? lastError.message : 'Connection failed',
          suggestion: 'The service may be starting up. Please wait 30 seconds and try again.'
        },
        { status: 503 }
      );
    }

    console.log(`📊 Backend response status: ${response.status}`);
    console.log(`📊 Backend response headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log("📦 Received result from backend:", {
        concepts: result.concepts?.length || 0,
        summary: result.summary ? 'present' : 'missing',
        conceptTitles: result.concepts?.map((c: any) => c.title) || []
      });
      
      // Return the AI result directly - no fallback interference
      return NextResponse.json(result);
    } else {
      const errorText = await response.text();
      console.error("❌ Render backend error:", response.status, errorText);
      
      // Return backend error directly - no fallback
      return NextResponse.json(
        { 
          error: 'AI analysis service error',
          status: response.status,
          details: errorText,
          backendUrl: httpsUrl,
          suggestion: 'The AI service encountered an error. Please try again.'
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('💥 Error in extract-concepts proxy:', error);
    
    // Return error directly - no fallback
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again. If the problem persists, the AI service may be starting up.'
      },
      { status: 500 }
    );
  }
} 