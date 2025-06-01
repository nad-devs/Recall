import { NextRequest, NextResponse } from 'next/server';
import { canMakeServerConversation } from '@/lib/usage-tracker-server';

export async function POST(request: NextRequest) {
  try {
    console.log('📺 YouTube Concept Extraction - Starting request')
    
    const body = await request.json()
    const { youtube_url, customApiKey, ...otherParams } = body
    
    console.log('📺 Received YouTube URL:', youtube_url)
    console.log('📺 Has custom API key:', !!customApiKey)
    
    // Validate YouTube URL
    if (!youtube_url || typeof youtube_url !== 'string') {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }
    
    // Server-side usage validation - same as extract-concepts
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Check if user can make a conversation (server-side validation)
    if (!customApiKey) {
      const canMake = await canMakeServerConversation(clientIP, userAgent, customApiKey);
      if (!canMake) {
        console.log('📺 Server-side usage limit reached for YouTube analysis')
        return NextResponse.json({ 
          success: false, 
          error: 'You have reached the 25 free conversation limit. Please add your OpenAI API key to continue.',
          requiresApiKey: true
        }, { status: 403 });
      }
    }
    
    // Get backend URL from environment
    const backendUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    const url = `${backendUrl}/api/v1/extract-youtube-concepts`
    
    console.log('📺 Forwarding to backend:', url)
    
    // Forward the request to the Python backend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        youtube_url,
        context: otherParams.context,
        category_guidance: otherParams.category_guidance,
        custom_api_key: customApiKey,
        languages: otherParams.languages || ['en']
      }),
    })
    
    console.log('📺 Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('📺 Backend error:', errorText)
      
      // Try to parse as JSON for better error handling
      let errorMessage = 'Failed to analyze YouTube video'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.error || errorMessage
      } catch {
        // If not JSON, use the raw text or a default message
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      )
    }
    
    const data = await response.json()
    console.log('📺 Successfully processed YouTube analysis')
    console.log('📺 Found', data.concepts?.length || 0, 'concepts')
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('📺 YouTube analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error during YouTube analysis' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'YouTube concept extraction endpoint. Use POST with youtube_url.' },
    { status: 200 }
  )
} 