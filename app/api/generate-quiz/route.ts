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

    // Basic validation
    if (options.length !== 4) {
      return { isValid: false, errorMsg: "Must have exactly 4 options" };
    }

    if (correctAnswer < 0 || correctAnswer >= 4) {
      return { isValid: false, errorMsg: "Correct answer index must be between 0-3" };
    }

    if (!question || !explanation) {
      return { isValid: false, errorMsg: "Question and explanation cannot be empty" };
    }

    // Check for contradictory content
    const questionLower = question.toLowerCase();

    // Special validation for NLP questions
    if (questionLower.includes("nlp") || questionLower.includes("natural language processing")) {
      if (questionLower.includes("not") || questionLower.includes("which of the following")) {
        const correctOption = options[correctAnswer].toLowerCase();

        // Known NLP tasks that should NOT be the answer for "not part of NLP"
        const nlpTasks = [
          "speech recognition", "text analysis", "sentiment analysis",
          "machine translation", "named entity recognition", "text classification",
          "language modeling", "natural language understanding", "text generation",
          "parsing", "tokenization", "part-of-speech tagging"
        ];

        // Non-NLP tasks that SHOULD be the answer for "not part of NLP"
        const nonNlpTasks = [
          "image processing", "computer vision", "image recognition",
          "facial recognition", "object detection", "image classification",
          "photo editing", "graphics rendering", "3d modeling"
        ];

        const isCorrectNonNlp = nonNlpTasks.some(task => correctOption.includes(task));
        const isIncorrectNlp = nlpTasks.some(task => correctOption.includes(task));

        if (isIncorrectNlp) {
          return { isValid: false, errorMsg: `Answer '${options[correctAnswer]}' is actually part of NLP - contradicts the question` };
        }

        if (!isCorrectNonNlp) {
          if (["text", "language", "speech", "translation", "sentiment"].some(word => correctOption.includes(word))) {
            return { isValid: false, errorMsg: `Answer '${options[correctAnswer]}' appears to be related to NLP` };
          }
        }
      }
    }

    // General validation for other negative questions
    else if (questionLower.includes("not") && (questionLower.includes("which") || questionLower.includes("what"))) {
      const explanationLower = explanation.toLowerCase();
      if (!["not", "isn't", "does not"].some(word => explanationLower.includes(word))) {
        console.log(`Warning: Negative question may lack proper explanation - ${question}`);
      }
    }

    // Check for duplicate options
    const optionsLower = options.map((opt: string) => opt.toLowerCase().trim());
    if (new Set(optionsLower).size !== optionsLower.length) {
      return { isValid: false, errorMsg: "Duplicate options found" };
    }

    // Check explanation quality
    if (explanation.split(" ").length < 10) {
      return { isValid: false, errorMsg: "Explanation too brief - should explain why answer is correct and others are wrong" };
    }

    // Additional validation: ensure explanation mentions the correct answer
    const correctOptionWords = options[correctAnswer].toLowerCase().split(" ");
    const explanationWords = explanation.toLowerCase().split(" ");
    const significantWords = correctOptionWords.filter((word: string) => word.length > 3);
    
    if (significantWords.length > 0 && !significantWords.some((word: string) => explanationWords.includes(word))) {
      console.log(`Warning: Explanation may not adequately address the correct answer`);
    }

    return { isValid: true, errorMsg: "Valid question" };
  }

  private ensureAnswerDistribution(questions: any[]): any[] {
    if (questions.length < 4) {
      return questions;
    }

    // Randomize the target positions for correct answers
    const targetPositions = [0, 1, 2, 3, 0]; // 5 questions, ensure all positions used
    this.shuffleArray(targetPositions);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const targetPos = targetPositions[i];
      const currentPos = question.correctAnswer || 0;

      if (currentPos !== targetPos && question.options?.length === 4) {
        // Swap the correct answer to the target position
        const options = [...question.options];
        [options[targetPos], options[currentPos]] = [options[currentPos], options[targetPos]];
        question.options = options;
        question.correctAnswer = targetPos;
        question.answer = options[targetPos];
        console.log(`Redistributed Q${i + 1} correct answer from position ${currentPos} to ${targetPos}`);
      }
    }

    return questions;
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async generateQuizQuestions(concept: any) {
    const prompt = `Generate 5 progressive difficulty quiz questions for: ${concept.title || ''}

Summary: ${concept.summary || ''}

Requirements:
1. EASY: Basic understanding and importance
2. MEDIUM: Practical application scenarios  
3. MEDIUM-HARD: Comparisons and trade-offs
4. HARD: Problem-solving and debugging
5. EXPERT: Integration, performance, edge cases

Each question must:
- Test understanding, not memorization
- Have exactly 4 options with 1 correct answer
- Include detailed explanation
- Use real-world scenarios for harder questions
- Vary correct answer positions (A,B,C,D)

Format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why correct and others wrong."
    }
  ]
}`;

    const maxAttempts = 2; // Reduced from 3 for speed
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Expert programming instructor creating challenging quiz questions. Focus on understanding over memorization. Create progressive difficulty that tests real-world application."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2000, // Reduced from 4000 for speed
          temperature: 0.7, // Reduced from 0.8 for faster processing
        });

        let content = response.choices[0]?.message?.content?.trim() || "";

        // Clean up markdown formatting
        if (content.startsWith("```json")) content = content.substring(7);
        if (content.endsWith("```")) content = content.substring(0, content.length - 3);
        content = content.trim();

        const quizData = JSON.parse(content);

        if (!quizData || !Array.isArray(quizData.questions)) {
          throw new Error('Invalid quiz data structure');
        }

        // Quick validation and processing
        const validatedQuestions = [];
        for (let i = 0; i < Math.min(quizData.questions.length, 5); i++) { // Limit to 5 for speed
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

        // Quick answer distribution (simplified for speed)
        if (validatedQuestions.length >= 3) {
          return {
            questions: validatedQuestions,
            metadata: {
              conceptTitle: concept.title || '',
              difficulty: "progressive",
              totalQuestions: validatedQuestions.length,
              validationPassed: true,
              attempt: attempt + 1
            }
          };
        }
      } catch (error) {
        console.log(`Attempt ${attempt + 1}: Error:`, error);
        if (attempt === maxAttempts - 1) {
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

    console.log('🔧 Generate Quiz API - User:', user.id, 'Concept:', concept?.title);

    if (!concept || !concept.title || !concept.summary) {
      return NextResponse.json(
        { error: 'Missing required concept data' },
        { status: 400 }
      );
    }

    // Generate quiz questions using the local QuizGenerator
    const generator = new QuizGenerator();
    const result = await generator.generateQuizQuestions(concept);

    console.log('🔧 Generate Quiz API - Success, generated', result?.questions?.length || 0, 'questions');

    // Ensure we always return a valid structure
    if (!result) {
      return NextResponse.json({
        questions: [],
        error: 'Failed to generate quiz questions'
      }, { status: 500 });
    }

    // Ensure questions array exists and is valid
    const questions = Array.isArray(result.questions) ? result.questions : [];
    
    if (questions.length === 0) {
      console.log('🔧 No valid questions generated');
      return NextResponse.json({
        questions: [],
        error: 'No valid questions could be generated for this concept'
      }, { status: 500 });
    }

    // Log final validation summary
    console.log('🔧 Final validated questions summary:');
    questions.forEach((q: any, index: number) => {
      if (q && q.question && q.answer) {
        console.log(`🔧 Question ${index + 1}: "${q.question.substring(0, 50)}..." -> Answer: "${q.answer}"`);
      }
    });

    // Return only the questions array, ensuring consistent structure
    return NextResponse.json({ 
      questions: questions.map(q => ({
        question: q.question || '',
        answer: q.answer || '',
        options: Array.isArray(q.options) ? q.options : [],
        explanation: q.explanation || ''
      }))
    });
  } catch (error) {
    console.error('🔧 Error generating quiz questions:', error);
    
    // Always return a consistent error structure
    return NextResponse.json(
      { 
        questions: [],
        error: 'Failed to generate quiz questions. Please try again.' 
      },
      { status: 500 }
    );
  }
} 