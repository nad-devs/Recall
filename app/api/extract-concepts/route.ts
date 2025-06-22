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

    // Server-side usage validation
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
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

    console.log("🔄 Proxying request to Python backend...");
    
    const backendUrl = process.env.PYTHON_ANALYSIS_SERVICE_URL || 'https://recall-p3vg.onrender.com';
    
    const response = await fetch(`${backendUrl}/api/v1/extract-concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Frontend/1.0',
      },
      body: JSON.stringify({ 
        conversation_text,
        ...(customApiKey && { custom_api_key: customApiKey }),
        ...(user_id && { user_id: user_id }),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json(result);
    } else {
      const errorText = await response.text();
      console.error("❌ Python backend error:", response.status, errorText);
      return NextResponse.json(
        { error: 'AI analysis service error', details: errorText },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('💥 Error in extract-concepts proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 