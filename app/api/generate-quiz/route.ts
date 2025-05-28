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
      console.log("🔧 Attempting HTTPS connection for quiz generation...");
      response = await fetch(`${httpsUrl}/api/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      });
    } catch (sslError) {
      console.log("🔧 HTTPS failed for quiz generation, trying HTTP fallback...", sslError instanceof Error ? sslError.message : 'SSL connection failed');
      response = await fetch(`${httpUrl}/api/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      });
    }

    if (!response.ok) {
      console.error('🔧 Python service error:', response.status, response.statusText);
      throw new Error(`Python service responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔧 Raw Python backend response:', JSON.stringify(result, null, 2));
    
    // Validate and fix the questions if needed
    if (result.questions && Array.isArray(result.questions)) {
      const validatedQuestions = result.questions.map((question: any, index: number) => {
        console.log(`🔧 Validating question ${index + 1}:`, question);
        
        // Ensure all required fields are present
        if (!question.question || !question.options || !Array.isArray(question.options)) {
          console.error(`🔧 Invalid question structure at index ${index}:`, question);
          return null;
        }
        
        // Validate the answer field more carefully
        let validAnswer = question.answer;
        
        // Check if the answer exists in the options
        if (!validAnswer || !question.options.includes(validAnswer)) {
          console.warn(`🔧 Question ${index + 1} has invalid answer field: "${validAnswer}"`);
          console.warn(`🔧 Available options:`, question.options);
          
          // Try to find a reasonable answer from the options instead of defaulting to first
          // Look for the option that seems most correct based on content length or specificity
          if (question.options.length > 0) {
            // Find the longest option as it's likely to be the correct detailed answer
            validAnswer = question.options.reduce((prev: string, current: string) => 
              current.length > prev.length ? current : prev
            );
            console.log(`🔧 Selected best answer candidate: "${validAnswer}"`);
          } else {
            console.error(`🔧 No options available for question ${index + 1}`);
            return null;
          }
        }
        
        console.log(`🔧 Question ${index + 1} validated - Answer: "${validAnswer}"`);
        
        return {
          question: question.question,
          answer: validAnswer,
          options: question.options,
          explanation: question.explanation || `This relates to the concept: ${concept.title}`
        };
      }).filter(Boolean); // Remove any null questions
      
      console.log('🔧 Generate Quiz API - Success, generated', validatedQuestions.length, 'valid questions');
      
      if (validatedQuestions.length === 0) {
        throw new Error('No valid questions were generated');
      }
      
      return NextResponse.json({ questions: validatedQuestions });
    } else {
      console.error('🔧 Invalid response structure from Python backend:', result);
      throw new Error('Invalid response structure from Python service');
    }
  } catch (error) {
    console.error('🔧 Error generating quiz questions:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate quiz questions. Please try again.' },
      { status: 500 }
    );
  }
} 