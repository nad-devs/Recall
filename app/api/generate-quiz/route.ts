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

    // Enhanced validation for detailed answers
    if (explanation.split(" ").length < 15) {
      return { isValid: false, errorMsg: "Explanation too brief for complex scenarios" };
    }

    // Check that options are sufficiently detailed (not one-word answers)
    const hasDetailedOptions = options.every((option: string) => option.split(" ").length >= 3);
    if (!hasDetailedOptions) {
      return { isValid: false, errorMsg: "Options should be detailed scenarios, not one-word answers" };
    }

    // Ensure question is scenario-based (contains context indicators)
    const scenarioIndicators = ["when", "how would", "what would", "scenario", "situation", "implementation", "approach", "strategy"];
    const hasScenarioContext = scenarioIndicators.some(indicator => 
      question.toLowerCase().includes(indicator)
    );
    
    if (!hasScenarioContext && question.split(" ").length < 10) {
      console.log("Warning: Question may lack sufficient scenario context");
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
    // Enhanced prompt for challenging, scenario-based questions
    const prompt = `Create 5 challenging, scenario-based quiz questions for: ${concept.title}

Content:
Summary: ${concept.summary}
Details: ${concept.details}
Key Points: ${concept.keyPoints}

Requirements:
- EASY (1): Conceptual understanding with practical context
- MEDIUM (2): Real-world implementation scenarios with trade-offs
- MEDIUM-HARD (3): Complex debugging and optimization scenarios
- HARD (4): Architecture decisions and performance considerations
- EXPERT (5): Advanced integration, edge cases, and system design

Question Guidelines:
• Create SCENARIO-BASED questions (not simple definitions)
• Use detailed, multi-sentence answer options (avoid one-word answers)
• Include code snippets, system design, or workflow scenarios when relevant
• Focus on "What would you do when..." or "How would you handle..." situations
• Make wrong answers plausible but clearly incorrect to experts
• Test critical thinking and practical application skills
• Ensure questions require deep understanding, not memorization

Each question structure:
• 4 detailed options with explanations/reasoning
• Correct answer should be comprehensive solution/approach
• Wrong answers should be common misconceptions or partial solutions
• Real-world context and consequences
• Progressive complexity building on previous concepts

JSON format:
{
  "questions": [
    {
      "question": "Detailed scenario-based question with context?",
      "options": [
        "Detailed option A with reasoning and approach",
        "Detailed option B with different methodology", 
        "Detailed option C with alternative solution",
        "Detailed option D with comprehensive explanation"
      ],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this approach works best, why others fail, and real-world implications."
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Keeping the faster model
        messages: [
          {
            role: "system",
            content: "Expert software architect and senior developer. Create challenging, real-world scenario questions that test practical problem-solving skills. Focus on complex situations developers face in production environments. Avoid simple definition questions. Make answer choices detailed and comprehensive, requiring deep understanding to distinguish correct from incorrect approaches."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1800, // Slightly increased for more detailed scenarios
        temperature: 0.6,
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