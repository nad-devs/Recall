/**
 * Note: This file originally contained mock quiz generation logic.
 * Quiz generation is now handled by the Python backend service via /api/generate-quiz
 * This file is kept for type definitions only.
 */

export interface QuizTopic {
  topic: string
  context: string
}

export interface QuizQuestion {
  question: string
  answer: string
  options: string[]
  explanation?: string
}

interface GenerateQuestionsOptions {
  conceptId?: string
  conceptTitle?: string
  conceptSummary?: string
  conceptKeyPoints?: string[]
  conceptDetails?: string
  difficultyLevel?: 'easy' | 'medium' | 'hard'
  numberOfQuestions?: number
}

/**
 * @deprecated Use /api/generate-quiz endpoint instead
 * This function is kept for backward compatibility but should not be used.
 * Quiz generation is now handled by the Python backend service.
 */
export async function generateQuestionsForConcept(
  options: GenerateQuestionsOptions
): Promise<QuizQuestion[]> {
  console.warn('⚠️ generateQuestionsForConcept is deprecated. Use /api/generate-quiz endpoint instead.');
  
  // Return empty array - force use of backend service
  return [];
}

/**
 * @deprecated Use backend AI service instead
 * Generates quiz topics based on conversation text
 * In a real implementation, this would use AI to extract relevant topics
 */
export async function generateQuizTopics(conversationText: string): Promise<QuizTopic[]> {
  console.warn('⚠️ generateQuizTopics is deprecated. Use backend AI service instead.');
  
  // Return empty array - force use of backend service
  return [];
}
