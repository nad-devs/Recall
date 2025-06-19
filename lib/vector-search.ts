import { prisma } from './prisma';

// This is a placeholder for the actual vector type from your DB client if available.
// For raw queries, we often deal with arrays of numbers.
type Vector = number[];

export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  similarity: number;
}

/**
 * Performs a cosine similarity search on the Concept embeddings.
 * Requires the `pgvector` extension to be enabled in PostgreSQL.
 *
 * @param queryEmbedding The vector embedding of the new concept to search for.
 * @param userId The ID of the current user to scope the search.
 * @param matchThreshold The minimum similarity score to consider a match (e.g., 0.9).
 * @param matchCount The maximum number of matches to return.
 * @returns A promise that resolves to an array of similar concepts.
 */
export async function findSimilarConcepts(
  queryEmbedding: Vector,
  userId: string,
  matchThreshold: number = 0.9,
  matchCount: number = 5
): Promise<SearchResult[]> {
  // The Prisma client still doesn't have native support for pgvector types,
  // so we must use a raw query. The `::vector` cast is crucial.
  // The `<=>` operator calculates the cosine distance (0=identical, 2=opposite).
  // We convert it to similarity (1 - distance) for easier interpretation.
  const query = `
    SELECT
      id,
      title,
      summary,
      1 - (embedding <=> $1::vector) AS similarity
    FROM "Concept"
    WHERE "userId" = $2 AND 1 - (embedding <=> $1::vector) > $3
    ORDER BY similarity DESC
    LIMIT $4;
  `;

  try {
    const results = await prisma.$queryRawUnsafe<SearchResult[]>(
      query,
      `[${queryEmbedding.join(',')}]`, // Pass the embedding as a string representation of a PG array
      userId,
      matchThreshold,
      matchCount
    );
    return results;
  } catch (error) {
    console.error("Error during vector similarity search:", error);
    // Returning an empty array to prevent crashes on DB errors.
    return [];
  }
} 