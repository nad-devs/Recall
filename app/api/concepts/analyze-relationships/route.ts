import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';

// OpenAI client will be instantiated when needed

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

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a comprehensive text representation of the concept
  const conceptText = `
    Title: ${concept.title}
    Category: ${concept.category}
    Summary: ${concept.summary}
    Key Points: ${concept.keyPoints.join('. ')}
    Details: ${typeof concept.details === 'string' ? concept.details : JSON.stringify(concept.details)}
  `.trim();

  console.log('🔗 Making OpenAI embedding request for:', concept.title);
  console.log('🔗 Concept text for embedding:', conceptText.substring(0, 200) + '...');
  
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

// Function to analyze WHY concepts are related
function analyzeRelationshipType(concept1: ConceptInput, concept2: any): {
  type: string;
  reason: string;
  context: string[];
  strength: number;
  sharedElements: string[];
} {
  const title1 = concept1.title.toLowerCase();
  const title2 = concept2.title.toLowerCase();
  const summary1 = concept1.summary.toLowerCase();
  const summary2 = concept2.summary.toLowerCase();
  const keyPoints1 = concept1.keyPoints.join(' ').toLowerCase();
  const keyPoints2 = (concept2.keyPoints || []).join(' ').toLowerCase();
  
  const sharedElements: string[] = [];
  const context: string[] = [];
  let relationshipType = 'GENERAL_SIMILARITY';
  let reason = 'Semantically similar concepts';

  // Check for shared data structures
  const dataStructures = ['array', 'set', 'map', 'list', 'queue', 'stack', 'tree', 'graph', 'hash'];
  const sharedDataStructures = dataStructures.filter(ds => 
    (title1.includes(ds) || summary1.includes(ds) || keyPoints1.includes(ds)) &&
    (title2.includes(ds) || summary2.includes(ds) || keyPoints2.includes(ds))
  );
  
  if (sharedDataStructures.length > 0) {
    relationshipType = 'SHARED_DATA_STRUCTURE';
    reason = `Both use ${sharedDataStructures.join(', ')}`;
    sharedElements.push(...sharedDataStructures);
    context.push(`data_structure:${sharedDataStructures.join(',')}`);
  }

  // Check for shared algorithms/techniques
  const algorithms = ['sorting', 'searching', 'traversal', 'recursion', 'iteration', 'dynamic programming', 'greedy', 'backtracking'];
  const sharedAlgorithms = algorithms.filter(algo => 
    (title1.includes(algo) || summary1.includes(algo) || keyPoints1.includes(algo)) &&
    (title2.includes(algo) || summary2.includes(algo) || keyPoints2.includes(algo))
  );
  
  if (sharedAlgorithms.length > 0) {
    relationshipType = 'SHARED_ALGORITHM';
    reason = `Both involve ${sharedAlgorithms.join(', ')}`;
    sharedElements.push(...sharedAlgorithms);
    context.push(`algorithm:${sharedAlgorithms.join(',')}`);
  }

  // Check for shared problem patterns
  const patterns = ['duplicate', 'contains', 'find', 'remove', 'insert', 'merge', 'split', 'reverse'];
  const sharedPatterns = patterns.filter(pattern => 
    (title1.includes(pattern) || summary1.includes(pattern) || keyPoints1.includes(pattern)) &&
    (title2.includes(pattern) || summary2.includes(pattern) || keyPoints2.includes(pattern))
  );
  
  if (sharedPatterns.length > 0) {
    relationshipType = 'SHARED_PROBLEM_PATTERN';
    reason = `Both involve ${sharedPatterns.join(', ')} operations`;
    sharedElements.push(...sharedPatterns);
    context.push(`pattern:${sharedPatterns.join(',')}`);
  }

  // Check for shared complexity concerns
  const complexities = ['time complexity', 'space complexity', 'o(n)', 'o(1)', 'o(log n)', 'optimization'];
  const sharedComplexities = complexities.filter(comp => 
    (summary1.includes(comp) || keyPoints1.includes(comp)) &&
    (summary2.includes(comp) || keyPoints2.includes(comp))
  );
  
  if (sharedComplexities.length > 0) {
    relationshipType = 'SHARED_COMPLEXITY_CONCERN';
    reason = `Both involve ${sharedComplexities.join(', ')} considerations`;
    sharedElements.push(...sharedComplexities);
    context.push(`complexity:${sharedComplexities.join(',')}`);
  }

  // Check for same category but different approaches
  if (concept1.category === concept2.category && concept1.category !== 'General') {
    if (relationshipType === 'GENERAL_SIMILARITY') {
      relationshipType = 'SAME_CATEGORY';
      reason = `Both are ${concept1.category} concepts`;
      context.push(`category:${concept1.category}`);
    } else {
      context.push(`category:${concept1.category}`);
    }
  }

  // Check for prerequisite relationships
  const prerequisites = ['basic', 'fundamental', 'introduction', 'beginner'];
  const advanced = ['advanced', 'complex', 'optimization', 'expert'];
  
  const concept1IsBasic = prerequisites.some(p => title1.includes(p) || summary1.includes(p));
  const concept2IsBasic = prerequisites.some(p => title2.includes(p) || summary2.includes(p));
  const concept1IsAdvanced = advanced.some(a => title1.includes(a) || summary1.includes(a));
  const concept2IsAdvanced = advanced.some(a => title2.includes(a) || summary2.includes(a));

  if ((concept1IsBasic && concept2IsAdvanced) || (concept1IsAdvanced && concept2IsBasic)) {
    relationshipType = 'PREREQUISITE';
    reason = concept1IsBasic ? 'This is a prerequisite for the other concept' : 'The other concept is a prerequisite for this';
    context.push('prerequisite_relationship');
  }

  return {
    type: relationshipType,
    reason: reason,
    context: context,
    strength: Math.min(sharedElements.length * 0.2 + 0.6, 1.0), // Base 60% + 20% per shared element
    sharedElements: sharedElements
  };
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
      SELECT id, title, category, summary, "keyPoints", "details", embedding::text as embedding_text
      FROM "Concept" 
      WHERE "userId" = ${session.id} 
      AND embedding IS NOT NULL
    ` as Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      keyPoints: string;
      details: string;
      embedding_text: string;
    }>;
    
    console.log('✅ Found', existingConcepts.length, 'existing concepts with embeddings');

    // Analyze relationships for each new concept
    const analysisResults = conceptsWithEmbeddings.map((newConcept) => {
      const relationships: any[] = [];
      const potentialDuplicates: any[] = [];

      for (const existingConcept of existingConcepts) {
        if (!existingConcept.embedding_text) continue;

        // Parse the embedding from text back to number array
        let existingEmbedding: number[];
        try {
          existingEmbedding = JSON.parse(existingConcept.embedding_text);
        } catch (error) {
          console.warn('❌ Failed to parse embedding for concept:', existingConcept.title);
          continue;
        }
        
        const similarity = cosineSimilarity(newConcept.embedding, existingEmbedding);
        
        // Parse existing concept's structured data
        let existingKeyPoints: string[] = [];
        try {
          existingKeyPoints = JSON.parse(existingConcept.keyPoints || '[]');
        } catch (e) {
          existingKeyPoints = [];
        }

        const existingConceptStructured = {
          ...existingConcept,
          keyPoints: existingKeyPoints
        };

        // Analyze the relationship type and context
        const relationshipAnalysis = analyzeRelationshipType(newConcept, existingConceptStructured);
        
        // Log similarity details for debugging
        console.log(`🔗 ${relationshipAnalysis.type}: "${newConcept.title}" and "${existingConcept.title}": ${Math.round(similarity * 100)}% similarity`);
        console.log(`   Reason: ${relationshipAnalysis.reason}`);
        console.log(`   Context: ${relationshipAnalysis.context.join(', ')}`);
        console.log(`   Shared: ${relationshipAnalysis.sharedElements.join(', ')}`);

        // High similarity suggests potential duplicate
        if (similarity > 0.85) {
          console.log(`🟠 DUPLICATE DETECTED: ${Math.round(similarity * 100)}% similarity with "${existingConcept.title}"`);
          potentialDuplicates.push({
            id: existingConcept.id,
            title: existingConcept.title,
            category: existingConcept.category,
            summary: existingConcept.summary,
            similarity: Math.round(similarity * 100),
            relationshipType: relationshipAnalysis.type,
            reason: relationshipAnalysis.reason,
            context: relationshipAnalysis.context,
            sharedElements: relationshipAnalysis.sharedElements
          });
        }
        // Medium similarity suggests related concept
        else if (similarity > 0.6) {
          console.log(`🔗 RELATED CONCEPT: ${Math.round(similarity * 100)}% similarity with "${existingConcept.title}"`);
          relationships.push({
            id: existingConcept.id,
            title: existingConcept.title,
            category: existingConcept.category,
            summary: existingConcept.summary,
            similarity: Math.round(similarity * 100),
            relationshipType: relationshipAnalysis.type,
            reason: relationshipAnalysis.reason,
            context: relationshipAnalysis.context,
            sharedElements: relationshipAnalysis.sharedElements
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