import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import OpenAI from 'openai';

class QuizGenerator {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.client = new OpenAI({ 
      apiKey
    });
  }

  private validateQuizQuestion(questionData: any): { isValid: boolean; errorMsg: string } {
    const question = questionData.question || "";
    const options = questionData.options || [];
    const correctAnswer = questionData.correctAnswer ?? -1;
    const explanation = questionData.explanation || "";

    // Essential validations only
    if (options.length !== 4) {
      return { isValid: false, errorMsg: "Must have exactly 4 options" };
    }

    if (correctAnswer < 0 || correctAnswer >= 4) {
      return { isValid: false, errorMsg: "Correct answer index must be between 0-3" };
    }

    if (!question || !explanation) {
      return { isValid: false, errorMsg: "Question and explanation cannot be empty" };
    }

    // Check for duplicate options
    const optionsLower = options.map((opt: string) => opt.toLowerCase().trim());
    if (new Set(optionsLower).size !== optionsLower.length) {
      return { isValid: false, errorMsg: "Duplicate options found" };
    }

    // Minimum explanation length check
    if (explanation.split(" ").length < 8) {
      return { isValid: false, errorMsg: "Explanation too brief" };
    }

    return { isValid: true, errorMsg: "Valid question" };
  }

  private ensureAnswerDistribution(questions: any[]): any[] {
    if (questions.length < 4) {
      return questions;
    }

    // Quick answer distribution
    const targetPositions = [0, 1, 2, 3, 0];
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
      const question = questions[i];
      const targetPos = targetPositions[i];
      const currentPos = question.correctAnswer || 0;

      if (currentPos !== targetPos && question.options?.length === 4) {
        const options = [...question.options];
        [options[targetPos], options[currentPos]] = [options[currentPos], options[targetPos]];
        question.options = options;
        question.correctAnswer = targetPos;
        question.answer = options[targetPos];
      }
    }

    return questions;
  }

  async generateQuizQuestions(concept: any) {
    // Streamlined but comprehensive prompt
    const prompt = `Create 5 progressive quiz questions for: ${concept.title}

Content:
Summary: ${concept.summary}
Details: ${concept.details}
Key Points: ${concept.keyPoints}

Requirements:
- EASY (1): Basic understanding from summary/key points
- MEDIUM (2): Practical applications from details
- MEDIUM-HARD (3): Comparisons and trade-offs
- HARD (4): Problem-solving scenarios
- EXPERT (5): Integration and edge cases

Each question needs:
• 4 options, 1 correct answer
• Detailed explanation why correct/others wrong
• Real-world application focus
• Use ALL provided content, not just title
• Vary correct answer positions

JSON format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation."
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Faster model while maintaining quality
        messages: [
          {
            role: "system",
            content: "Expert programming instructor. Create high-quality quiz questions using ALL provided content. Focus on understanding and real-world application. Ensure progressive difficulty and comprehensive explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500, // Reduced for speed while still allowing detailed responses
        temperature: 0.6, // Slightly lower for faster, more focused responses
      });

      let content = response.choices[0]?.message?.content?.trim() || "";

      // Clean JSON formatting
      if (content.startsWith("```json")) content = content.substring(7);
      if (content.endsWith("```")) content = content.substring(0, content.length - 3);
      content = content.trim();

      const quizData = JSON.parse(content);

      if (!quizData || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz data structure');
      }

      // Streamlined validation and processing
      const validatedQuestions = [];
      for (let i = 0; i < Math.min(quizData.questions.length, 5); i++) {
        const question = quizData.questions[i];
        const validation = this.validateQuizQuestion(question);
        
        if (validation.isValid) {
          const correctAnswerIndex = question.correctAnswer ?? 0;
          const options = question.options || [];
          const answerText = (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) 
            ? options[correctAnswerIndex] 
            : options[0] || "Unknown";

          validatedQuestions.push({
            question: question.question || "",
            options: options,
            correctAnswer: correctAnswerIndex,
            answer: answerText,
            explanation: question.explanation || ""
          });
        }
      }

      // Quick answer distribution
      if (validatedQuestions.length >= 3) {
        return {
          questions: this.ensureAnswerDistribution(validatedQuestions),
          metadata: {
            conceptTitle: concept.title || '',
            difficulty: "progressive",
            totalQuestions: validatedQuestions.length,
            validationPassed: true
          }
        };
      }
    } catch (error) {
      console.log('Quiz generation error:', error);
    }

    return {
      questions: [],
      metadata: {
        conceptTitle: concept.title || '',
        difficulty: "progressive",
        totalQuestions: 0,
        validationPassed: false,
        error: "Quiz generation failed"
      }
    };
  }
}

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

    if (!concept || !concept.title || !concept.summary) {
      return NextResponse.json(
        { error: 'Missing required concept data' },
        { status: 400 }
      );
    }

    // Generate quiz questions
    const generator = new QuizGenerator();
    const result = await generator.generateQuizQuestions(concept);

    // Ensure we always return a valid structure
    if (!result) {
      return NextResponse.json({
        questions: [],
        error: 'Failed to generate quiz questions'
      }, { status: 500 });
    }

    const questions = Array.isArray(result.questions) ? result.questions : [];
    
    if (questions.length === 0) {
      return NextResponse.json({
        questions: [],
        error: 'No valid questions could be generated for this concept'
      }, { status: 500 });
    }

    // Return structured response
    return NextResponse.json({ 
      questions: questions.map(q => ({
        question: q.question || '',
        answer: q.answer || '',
        options: Array.isArray(q.options) ? q.options : [],
        explanation: q.explanation || ''
      }))
    });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    
    return NextResponse.json(
      { 
        questions: [],
        error: 'Failed to generate quiz questions. Please try again.' 
      },
      { status: 500 }
    );
  }
} 