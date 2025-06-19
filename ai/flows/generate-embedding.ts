import OpenAI from 'openai';

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Generates a vector embedding for a given text string.
 *
 * @param text The text to embed.
 * @returns A promise that resolves to a vector (array of numbers).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (!text) {
    console.warn("generateEmbedding was called with empty text.");
    return [];
  }

  // Initialize the OpenAI client when needed
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.replace(/\n/g, ' '), // The model performs better with single-line text
      dimensions: 1536, // Must match the dimensions defined in the database schema
    });

    return response.data[0].embedding;

  } catch (error) {
    console.error("Error generating embedding:", error);
    // Return an empty array on error to avoid breaking the main flow.
    return [];
  }
} 