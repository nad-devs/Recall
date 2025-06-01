import { NextRequest, NextResponse } from 'next/server';
import { canMakeServerConversation } from '@/lib/usage-tracker-server';
import ytdl from 'ytdl-core';

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
    
    // Server-side usage validation
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
    
    console.log('📺 Attempting to get video info with ytdl-core...')
    
    // Try to get video info and description using ytdl-core
    let videoText = '';
    try {
      if (!ytdl.validateURL(youtube_url)) {
        throw new Error('Invalid YouTube URL format');
      }
      
      console.log('📺 Fetching video info...')
      const info = await ytdl.getInfo(youtube_url);
      const videoDetails = info.videoDetails;
      
      console.log('📺 Video found:', {
        title: videoDetails.title,
        lengthSeconds: videoDetails.lengthSeconds,
        description: videoDetails.description?.length || 0
      });
      
      // Extract available text content
      videoText = `Video Title: ${videoDetails.title}\n\n`;
      
      if (videoDetails.description && videoDetails.description.length > 100) {
        videoText += `Video Description:\n${videoDetails.description}\n\n`;
      }
      
      // Add video metadata
      if (videoDetails.keywords && videoDetails.keywords.length > 0) {
        videoText += `Tags: ${videoDetails.keywords.slice(0, 10).join(', ')}\n\n`;
      }
      
      console.log('📺 Extracted text length:', videoText.length);
      
      if (videoText.length < 200) {
        throw new Error('Insufficient video content available for analysis');
      }
      
    } catch (videoError: any) {
      console.error('📺 Video extraction failed:', {
        message: videoError.message,
        name: videoError.name,
        url: youtube_url
      });
      
      return NextResponse.json(
        { 
          error: `Unable to analyze YouTube video: ${videoError.message}. This could be due to video restrictions, age-gating, or the video being private.`,
          debug: {
            originalError: videoError.message,
            url: youtube_url,
            method: 'ytdl-core'
          }
        },
        { status: 400 }
      );
    }
    
    console.log('📺 Now analyzing video content with text extraction...')
    
    // Now use the regular text extraction endpoint (which works fine)
    const textExtractionUrl = `${request.nextUrl.origin}/api/extract-concepts`;
    
    try {
      const analysisResponse = await fetch(textExtractionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward auth headers
          ...Object.fromEntries(
            ['authorization', 'x-user-id', 'x-user-email'].map(header => [
              header,
              request.headers.get(header)
            ]).filter(([_, value]) => value !== null)
          )
        },
        body: JSON.stringify({
          conversation_text: `YouTube Video Analysis:\n\nURL: ${youtube_url}\n\n${videoText}`,
          customApiKey: customApiKey
        }),
      });
      
      console.log('📺 Text analysis response status:', analysisResponse.status);
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        console.error('📺 Text analysis failed:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Failed to analyze video content' },
          { status: analysisResponse.status }
        );
      }
      
      const analysisData = await analysisResponse.json();
      console.log('📺 Successfully analyzed video content');
      console.log('📺 Found', analysisData.concepts?.length || 0, 'concepts');
      
      // Add YouTube-specific metadata
      const enhancedData = {
        ...analysisData,
        source_type: 'youtube',
        source_url: youtube_url,
        content_length: videoText.length,
        analysis_method: 'title_and_description'
      };
      
      return NextResponse.json(enhancedData);
      
    } catch (analysisError: any) {
      console.error('📺 Analysis request failed:', analysisError.message);
      return NextResponse.json(
        { error: 'Failed to analyze video content' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('📺 YouTube analysis error:', error);
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