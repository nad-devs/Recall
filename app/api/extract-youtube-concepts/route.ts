import { NextRequest, NextResponse } from 'next/server';
import { canMakeServerConversation } from '@/lib/usage-tracker-server';
import { YoutubeTranscript } from 'youtube-transcript';

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
    
    console.log('📺 Extracting transcript from YouTube...')
    
    // Extract transcript locally using youtube-transcript library
    let transcript;
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(youtube_url);
      transcript = transcriptData.map(item => item.text).join(' ');
      console.log('📺 Successfully extracted transcript, length:', transcript.length);
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Empty transcript received');
      }
    } catch (transcriptError: any) {
      console.error('📺 Transcript extraction failed:', transcriptError.message);
      
      // Provide more helpful error message
      let userFriendlyMessage = 'Failed to extract YouTube transcript.';
      
      if (transcriptError.message.includes('Transcript is disabled')) {
        userFriendlyMessage = 'This YouTube video has disabled captions/transcripts. Please try a different video that has captions enabled (most educational and tutorial videos have them).';
      } else if (transcriptError.message.includes('No transcripts were found')) {
        userFriendlyMessage = 'No captions/transcripts found for this video. Please try a video that has captions available.';
      } else {
        userFriendlyMessage = `Failed to extract transcript: ${transcriptError.message}`;
      }
      
      return NextResponse.json(
        { error: userFriendlyMessage },
        { status: 400 }
      );
    }
    
    console.log('📺 Now analyzing transcript with regular text extraction...')
    
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
          conversation_text: `YouTube Video Analysis:\n\nURL: ${youtube_url}\n\nTranscript:\n${transcript}`,
          customApiKey: customApiKey
        }),
      });
      
      console.log('📺 Text analysis response status:', analysisResponse.status);
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        console.error('📺 Text analysis failed:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Failed to analyze transcript content' },
          { status: analysisResponse.status }
        );
      }
      
      const analysisData = await analysisResponse.json();
      console.log('📺 Successfully analyzed transcript');
      console.log('📺 Found', analysisData.concepts?.length || 0, 'concepts');
      
      // Add YouTube-specific metadata
      const enhancedData = {
        ...analysisData,
        source_type: 'youtube',
        source_url: youtube_url,
        transcript_length: transcript.length
      };
      
      return NextResponse.json(enhancedData);
      
    } catch (analysisError: any) {
      console.error('📺 Analysis request failed:', analysisError.message);
      return NextResponse.json(
        { error: 'Failed to analyze transcript content' },
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