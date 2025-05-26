import OpenAI from 'openai';

// Use OPENAI_API_KEY directly
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Missing OPENAI_API_KEY environment variable');
  throw new Error('OpenAI API key is required but not found in environment variables');
}

// Create a reusable OpenAI client instance
export const openai = new OpenAI({
  apiKey: apiKey
});

// Function to generate quiz questions for a concept
export async function generateQuizQuestions(concept: {
  title: string;
  summary: string;
  details: string;
  keyPoints: string;
  id?: string; // Make id optional to match the usage
}) {
  try {
    // Parse the key points if they're stored as a JSON string
    let keyPointsArray: string[] = [];
    try {
      const parsed = JSON.parse(concept.keyPoints);
      keyPointsArray = Array.isArray(parsed) ? parsed : [concept.keyPoints];
    } catch {
      // If parsing fails, use as is and convert to array
      keyPointsArray = [concept.keyPoints];
    }

    // Prepare the content to send to OpenAI
    const conceptContent = `
Title: ${concept.title}
Summary: ${concept.summary}
Details: ${concept.details}
Key Points: ${keyPointsArray.join("\n- ")}
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator for learning concepts. Carefully analyze the provided concept and its key points. Then, generate 3 multiple-choice questions that progressively increase in difficulty:\n- The first question should test basic understanding.\n- The second should require application or analysis.\n- The third should be challenging, requiring synthesis or deeper reasoning.\nEach question must have 4 options, with only one correct answer. Format your response as a JSON object with a 'questions' array, where each item has 'question', 'answer', and 'options' properties. The 'answer' should be the exact text of the correct option.`
        },
        {
          role: "user",
          content: `Concept Details:\n${conceptContent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(responseContent);
    
    // Return the questions in the format expected by the application
    return {
      conceptId: concept.id,
      questions: parsedResponse.questions || []
    };
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw error;
  }
} 