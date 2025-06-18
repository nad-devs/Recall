import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_API_KEY;
console.log('🔑 OpenAI API Key status:', apiKey ? `Present (${apiKey.substring(0, 7)}...)` : 'MISSING');

const openai = new OpenAI({
  apiKey: apiKey,
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
  // Check API key before making request
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Create a comprehensive text representation of the concept
  const conceptText = `
    Title: ${concept.title}
    Category: ${concept.category}
    Summary: ${concept.summary}
    Key Points: ${concept.keyPoints.join('. ')}
    Details: ${typeof concept.details === 'string' ? concept.details : JSON.stringify(concept.details)}
  `.trim();

  console.log('🔗 Making OpenAI embedding request for:', concept.title);
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: conceptText,
    });

    console.log('✅ OpenAI embedding response received for:', concept.title);
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ OpenAI embedding error for', concept.title, ':', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Analyze relationships API called');
    console.log('🔑 Environment check - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key is missing from environment variables');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        details: 'The OPENAI_API_KEY environment variable is not set'
      }, { status: 500 });
    }
    
    // Validate session
    const session = await validateSession(request);
    if (!session || !session.id) {
      console.log('❌ Unauthorized access');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { concepts }: AnalyzeRequest = await request.json();
    console.log('🔗 Received concepts:', concepts?.length);

    if (!concepts || !Array.isArray(concepts)) {
      console.log('❌ Invalid concepts data');
      return NextResponse.json({ error: 'Invalid concepts data' }, { status: 400 });
    }

    // Generate embeddings for all new concepts
    console.log('🔗 Generating embeddings...');
    const conceptsWithEmbeddings = await Promise.all(
      concepts.map(async (concept) => {
        const embedding = await generateConceptEmbedding(concept);
        return { ...concept, embedding };
      })
    );
    console.log('✅ Generated embeddings for', conceptsWithEmbeddings.length, 'concepts');

    // Use raw SQL to fetch existing concepts with embeddings (avoiding Prisma's vector limitation)
    console.log('🔗 Fetching existing concepts with embeddings...');
    const existingConcepts = await prisma.$queryRaw`
      SELECT id, title, category, summary, embedding
      FROM "Concept" 
      WHERE "userId" = ${session.id} 
      AND embedding IS NOT NULL
    ` as Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      embedding: number[];
    }>;
    
    console.log('✅ Found', existingConcepts.length, 'existing concepts with embeddings');

    // Analyze relationships for each new concept
    const analysisResults = conceptsWithEmbeddings.map((newConcept) => {
      const relationships: any[] = [];
      const potentialDuplicates: any[] = [];

      for (const existingConcept of existingConcepts) {
        if (!existingConcept.embedding) continue;

        // The embedding comes directly as array from pgvector
        const existingEmbedding = existingConcept.embedding;
        
        const similarity = cosineSimilarity(newConcept.embedding, existingEmbedding);

        // High similarity suggests potential duplicate
        if (similarity > 0.85) {
          potentialDuplicates.push({
            id: existingConcept.id,
            title: existingConcept.title,
            category: existingConcept.category,
            summary: existingConcept.summary,
            similarity: Math.round(similarity * 100)
          });
        }
        // Medium similarity suggests related concept
        else if (similarity > 0.6) {
          relationships.push({
            id: existingConcept.id,
            title: existingConcept.title,
            category: existingConcept.category,
            summary: existingConcept.summary,
            similarity: Math.round(similarity * 100)
          });
        }
      }

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

    console.log('✅ Analysis completed successfully');
    return NextResponse.json({
      success: true,
      results: analysisResults
    });

  } catch (error) {
    console.error('❌ Error analyzing concept relationships:', error);
    
    // Provide more specific error details
    let errorMessage = 'Failed to analyze concept relationships';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('API key')) {
      errorMessage = 'OpenAI API key configuration error';
    } else if (errorDetails.includes('rate limit') || errorDetails.includes('quota')) {
      errorMessage = 'OpenAI API rate limit or quota exceeded';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
} 