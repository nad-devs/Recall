import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConceptInput {
  title: string;
  summary: string;
  details: any;
  keyPoints: string[];
  category: string;
}

interface AnalyzeRequest {
  concepts: ConceptInput[];
}

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function to generate embedding for a concept
async function generateConceptEmbedding(concept: ConceptInput): Promise<number[]> {
  // Create a comprehensive text representation of the concept
  const conceptText = `
    Title: ${concept.title}
    Category: ${concept.category}
    Summary: ${concept.summary}
    Key Points: ${concept.keyPoints.join('. ')}
    Details: ${typeof concept.details === 'string' ? concept.details : JSON.stringify(concept.details)}
  `.trim();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: conceptText,
  });

  return response.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession(request);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { concepts }: AnalyzeRequest = await request.json();

    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json({ error: 'Invalid concepts data' }, { status: 400 });
    }

    // Generate embeddings for all new concepts
    const conceptsWithEmbeddings = await Promise.all(
      concepts.map(async (concept) => {
        const embedding = await generateConceptEmbedding(concept);
        return { ...concept, embedding };
      })
    );

    // Fetch existing concepts for this user
    // Note: We'll skip embedding comparison for now until the vector field is fully set up
    const existingConcepts = await prisma.concept.findMany({
      where: {
        userId: session.id,
      },
      select: {
        id: true,
        title: true,
        category: true,
        summary: true,
      }
    });

    // Analyze relationships for each new concept
    const analysisResults = conceptsWithEmbeddings.map((newConcept) => {
      const relationships: any[] = [];
      const potentialDuplicates: any[] = [];

      // TODO: Temporarily disabled until vector field is properly set up in production
      // This will be enabled once the database migration is confirmed
      // for (const existingConcept of existingConcepts) {
      //   if (!existingConcept.embedding) continue;

      //   // Convert stored embedding back to number array
      //   let existingEmbedding: number[];
      //   try {
      //     if (Array.isArray(existingConcept.embedding)) {
      //       existingEmbedding = existingConcept.embedding;
      //     } else if (typeof existingConcept.embedding === 'string') {
      //       existingEmbedding = JSON.parse(existingConcept.embedding);
      //     } else {
      //       // Skip this concept if embedding format is unexpected
      //       continue;
      //     }
      //   } catch (error) {
      //     console.warn(`Failed to parse embedding for concept ${existingConcept.id}:`, error);
      //     continue;
      //   }

      //   const similarity = cosineSimilarity(newConcept.embedding, existingEmbedding);

      //   // High similarity suggests potential duplicate
      //   if (similarity > 0.85) {
      //     potentialDuplicates.push({
      //       id: existingConcept.id,
      //       title: existingConcept.title,
      //       category: existingConcept.category,
      //       summary: existingConcept.summary,
      //       similarity: Math.round(similarity * 100)
      //     });
      //   }
      //   // Medium similarity suggests related concept
      //   else if (similarity > 0.6) {
      //     relationships.push({
      //       id: existingConcept.id,
      //       title: existingConcept.title,
      //       category: existingConcept.category,
      //       summary: existingConcept.summary,
      //       similarity: Math.round(similarity * 100)
      //     });
      //   }
      // }

      // Sort by similarity (highest first)
      relationships.sort((a, b) => b.similarity - a.similarity);
      potentialDuplicates.sort((a, b) => b.similarity - a.similarity);

      return {
        concept: newConcept,
        relationships: relationships.slice(0, 5), // Top 5 related concepts
        potentialDuplicates: potentialDuplicates.slice(0, 3), // Top 3 potential duplicates
        embedding: newConcept.embedding // Include embedding for saving later
      };
    });

    return NextResponse.json({
      success: true,
      results: analysisResults
    });

  } catch (error) {
    console.error('Error analyzing concept relationships:', error);
    return NextResponse.json(
      { error: 'Failed to analyze concept relationships' },
      { status: 500 }
    );
  }
} 