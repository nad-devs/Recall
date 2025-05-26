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
 * Generates quiz questions for a given concept.
 * In a real implementation, this would call an AI service or API.
 */
export async function generateQuestionsForConcept(
  options: GenerateQuestionsOptions
): Promise<QuizQuestion[]> {
  const {
    conceptTitle = '',
    conceptSummary = '',
    conceptKeyPoints = [],
    difficultyLevel = 'medium',
    numberOfQuestions = 5
  } = options;

  // For now, we'll generate mock questions based on the concept data provided
  const questions: QuizQuestion[] = [];
  
  // Helper function to randomize the correct answer position
  const randomizeOptions = (correctAnswer: string, wrongOptions: string[]): {options: string[], answerIndex: number} => {
    const allOptions = [...wrongOptions.slice(0, 3)]; // Get first 3 wrong options
    const answerIndex = Math.floor(Math.random() * 4); // Random position (0-3)
    allOptions.splice(answerIndex, 0, correctAnswer);
    return { options: allOptions, answerIndex };
  };
  
  // Title-based question (always include if we have a title)
  if (conceptTitle && questions.length < numberOfQuestions) {
    const correctAnswer = 'To provide a structured approach to solving problems';
    const wrongOptions = [
      'To optimize database queries',
      'To render user interfaces',
      'To manage network connections'
    ];
    
    const { options, answerIndex } = randomizeOptions(correctAnswer, wrongOptions);
    
    questions.push({
      question: `What is the main purpose of ${conceptTitle}?`,
      answer: options[answerIndex],
      options,
      explanation: 'This is the core purpose as described in the concept summary.'
    });
  }
  
  // Add key point based questions if available
  if (conceptKeyPoints.length > 0) {
    // Take up to 3 key points to create questions from
    const pointsToUse = conceptKeyPoints.slice(0, 3);
    
    pointsToUse.forEach((point, index) => {
      if (questions.length < numberOfQuestions) {
        const correctAnswer = point;
        const plausibleWrongOptions = [
          `Requires high computational complexity (O(n²))`,
          `Only works with primitive data types`,
          `Must be implemented using recursion`
        ];
        
        const { options, answerIndex } = randomizeOptions(correctAnswer, plausibleWrongOptions);
        
        questions.push({
          question: `Which of the following is a key characteristic of ${conceptTitle}?`,
          answer: options[answerIndex],
          options,
          explanation: `This is directly stated in the key points of the concept.`
        });
      }
    });
  }
  
  // Add a definition question based on the summary
  if (conceptSummary && questions.length < numberOfQuestions) {
    const correctAnswer = `${conceptSummary.substring(0, 100)}${conceptSummary.length > 100 ? '...' : ''}`;
    const wrongOptions = [
      `A performance optimization technique for reducing memory usage in applications`,
      `A design pattern that separates data access logic from business logic`,
      `An algorithm for efficiently searching and sorting large datasets`
    ];
    
    const { options, answerIndex } = randomizeOptions(correctAnswer, wrongOptions);
    
    questions.push({
      question: `Which definition best describes ${conceptTitle}?`,
      answer: options[answerIndex],
      options,
      explanation: 'This is based on the summary provided for the concept.'
    });
  }
  
  // Generate additional questions to reach the desired number
  const additionalQuestions = [
    {
      question: `What is a common use case for ${conceptTitle}?`,
      correctAnswer: `Efficiently solving complex problems with optimal solutions`,
      wrongOptions: [
        `Rendering graphics in web applications`,
        `Managing cloud infrastructure deployments`,
        `Encrypting sensitive data in transit`
      ]
    },
    {
      question: `Which of the following is NOT a limitation of ${conceptTitle}?`,
      correctAnswer: `Can be implemented in any programming language`,
      wrongOptions: [
        `May require significant processing power for large datasets`,
        `Often requires specialized knowledge to implement correctly`,
        `Can be difficult to maintain in complex systems`
      ]
    },
    {
      question: `In what scenario would ${conceptTitle} be most beneficial?`,
      correctAnswer: `When optimizing performance is critical to application success`,
      wrongOptions: [
        `When working with small, fixed-size datasets`,
        `When user interface responsiveness is the main concern`,
        `When backward compatibility with legacy systems is required`
      ]
    }
  ];
  
  for (let i = 0; i < additionalQuestions.length && questions.length < numberOfQuestions; i++) {
    const q = additionalQuestions[i];
    const { options, answerIndex } = randomizeOptions(q.correctAnswer, q.wrongOptions);
    
    questions.push({
      question: q.question,
      answer: options[answerIndex],
      options,
      explanation: 'This relates to practical applications of the concept.'
    });
  }
  
  return questions;
}

/**
 * Generates quiz topics based on conversation text
 * In a real implementation, this would use AI to extract relevant topics
 */
export async function generateQuizTopics(conversationText: string): Promise<QuizTopic[]> {
  // Mock implementation - in a real app this would use AI to analyze the text
  // and generate relevant quiz topics
  const mockTopics: QuizTopic[] = [
    {
      topic: "SQL Query Optimization",
      context: "SQL query optimization involves techniques like proper indexing, avoiding functions on indexed columns, and using EXPLAIN to analyze execution plans."
    },
    {
      topic: "Natural Language Processing",
      context: "NLP is a field of AI focused on enabling computers to understand and process human language."
    },
    {
      topic: "Data Structures",
      context: "Data structures are specialized formats for organizing and storing data to enable efficient access and modification."
    },
    {
      topic: "Machine Learning Model Deployment",
      context: "Deploying ML models involves creating APIs for serving predictions, containerization for consistent environments, and monitoring."
    }
  ];
  
  return mockTopics;
}
