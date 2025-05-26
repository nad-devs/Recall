import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concept } = body;

    if (!concept || !concept.title || !concept.summary) {
      return NextResponse.json(
        { error: 'Missing required concept data' },
        { status: 400 }
      );
    }

    // Generate quiz questions using the server-side OpenAI function
    const result = await generateQuizQuestions(concept);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
} 