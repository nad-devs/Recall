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
    this.client = new OpenAI({ apiKey });
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
    const prompt = `
    Based on the following programming concept, generate 5 multiple-choice quiz questions with PROGRESSIVE DIFFICULTY:
    
    Concept: ${concept.title || ''}
    Summary: ${concept.summary || ''}
    
    DIFFICULTY PROGRESSION REQUIREMENTS:
    1. Question 1 (EASY): Basic understanding - not just definitions, but WHY this concept matters
    2. Question 2 (EASY-MEDIUM): Practical scenarios - when and where to apply this concept
    3. Question 3 (MEDIUM): Critical thinking - comparing this concept with alternatives, trade-offs
    4. Question 4 (MEDIUM-HARD): Problem-solving - debugging, optimization, or handling complex situations
    5. Question 5 (HARD): Expert-level application - integration with other concepts, performance considerations, edge cases
    
    QUESTION VARIETY REQUIREMENTS:
    - Create scenario-based questions that require understanding, not memorization
    - Include real-world coding situations and problem-solving challenges
    - Ask about trade-offs, best practices, and common mistakes
    - Test conceptual understanding through practical applications
    - For advanced questions, include code analysis, debugging scenarios, or architectural decisions
    - Ask "what would happen if..." and "how would you..." style questions
    - Include questions about performance implications, scalability, and maintainability
    
    CHALLENGING QUESTION EXAMPLES:
    - "In a scenario where [complex situation], what would be the best approach using [concept] and why?"
    - "A developer is experiencing [problem]. Which aspect of [concept] would most likely solve this?"
    - "When comparing [concept] to [alternative], what is the most significant trade-off to consider?"
    - "If you needed to [complex task], how would [concept] help and what challenges might arise?"
    - "What would be the performance implications of using [concept] in [specific scenario]?"
    
    ANSWER DISTRIBUTION:
    - Vary the position of correct answers across questions (A, B, C, D)
    - Create sophisticated wrong answers that seem plausible to someone with surface knowledge
    - Wrong answers should represent common misconceptions or partial understanding
    
    CRITICAL REQUIREMENTS:
    1. Each question must have EXACTLY ONE correct answer
    2. Create distractors that test deep understanding - avoid obviously wrong answers
    3. Questions should challenge comprehension, application, analysis, and evaluation skills
    4. Avoid pure memorization questions - focus on understanding and application
    5. Explanations must be comprehensive and educational, explaining the reasoning
    6. Questions should be relevant to real-world programming scenarios
    7. Progressive difficulty should be clearly evident - each question should be noticeably harder
    
    AVOID:
    - Simple definition questions ("What is X?")
    - Questions that can be answered by memorizing a list
    - Overly abstract or theoretical questions without practical relevance
    - Questions where the answer is obvious from context
    
    Return the response in this exact JSON format:
    {
      "questions": [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Comprehensive explanation of why this answer is correct and others are wrong."
        }
      ]
    }
    `;

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert programming instructor and assessment designer specializing in creating challenging, thought-provoking quiz questions. Your goal is to test true understanding, not memorization. Create questions that require learners to think critically, apply concepts to real scenarios, analyze trade-offs, and solve problems. Each question should progressively increase in difficulty and cognitive complexity. Focus on practical application, problem-solving, and deep conceptual understanding. Avoid simple recall questions and instead create scenarios that a working programmer would actually encounter."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.8,
        });

        let content = response.choices[0]?.message?.content?.trim() || "";

        // Clean up markdown formatting if present
        if (content.startsWith("```json")) {
          content = content.substring(7);
        }
        if (content.endsWith("```")) {
          content = content.substring(0, content.length - 3);
        }
        content = content.trim();

        // Parse the JSON response
        const quizData = JSON.parse(content);

        // Validate each question
        const validatedQuestions = [];
        for (let i = 0; i < quizData.questions.length; i++) {
          const question = quizData.questions[i];
          const validation = this.validateQuizQuestion(question);
          
          if (validation.isValid) {
            const correctAnswerIndex = question.correctAnswer || 0;
            const options = question.options || [];

            // Ensure the correct answer index is valid
            let answerText;
            if (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) {
              answerText = options[correctAnswerIndex];
            } else {
              console.log(`Warning: Invalid correctAnswer index ${correctAnswerIndex} for question ${i + 1}`);
              answerText = options[0] || "Unknown";
            }

            const validatedQuestion = {
              question: question.question || "",
              options: options,
              correctAnswer: correctAnswerIndex,
              answer: answerText,
              explanation: question.explanation || ""
            };
            validatedQuestions.push(validatedQuestion);
          } else {
            console.log(`Question ${i + 1} validation failed: ${validation.errorMsg}`);
            console.log(`Question: ${question.question || 'N/A'}`);
            console.log(`Options: ${question.options || []}`);
            console.log(`Correct Answer: ${question.correctAnswer ?? 'N/A'}`);
          }
        }

        // Ensure answer distribution across positions
        const distributedQuestions = this.ensureAnswerDistribution(validatedQuestions);

        // If we have at least 3 valid questions, return them
        if (distributedQuestions.length >= 3) {
          const positions = distributedQuestions.map(q => q.correctAnswer);
          console.log(`Final answer positions: ${positions}`);

          return {
            questions: distributedQuestions,
            metadata: {
              conceptTitle: concept.title || '',
              difficulty: "progressive",
              totalQuestions: distributedQuestions.length,
              validationPassed: true,
              attempt: attempt + 1,
              answerPositions: positions
            }
          };
        } else {
          console.log(`Attempt ${attempt + 1}: Only ${distributedQuestions.length} valid questions generated`);
          if (attempt === maxAttempts - 1) {
            return {
              questions: distributedQuestions,
              metadata: {
                conceptTitle: concept.title || '',
                difficulty: "progressive",
                totalQuestions: distributedQuestions.length,
                validationPassed: false,
                warning: "Some questions failed validation"
              }
            };
          }
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.log(`Attempt ${attempt + 1}: JSON parsing error:`, error.message);
          if (attempt === maxAttempts - 1) throw error;
        } else {
          console.log(`Attempt ${attempt + 1}: Error generating quiz questions:`, error);
          if (attempt === maxAttempts - 1) throw error;
        }
      }
    }
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

    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    // Log final validation summary
    console.log('🔧 Final validated questions summary:');
    result.questions.forEach((q: any, index: number) => {
      console.log(`🔧 Question ${index + 1}: "${q.question.substring(0, 50)}..." -> Answer: "${q.answer}"`);
    });

    return NextResponse.json({ questions: result.questions });
  } catch (error) {
    console.error('🔧 Error generating quiz questions:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate quiz questions. Please try again.' },
      { status: 500 }
    );
  }
} 