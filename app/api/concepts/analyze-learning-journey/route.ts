import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LearningAnalysis {
  conceptId: string;
  title: string;
  isLearningNewTopic: boolean;
  masteredPrerequisites: Array<{
    id: string;
    title: string;
    masteryLevel: string;
    similarity: number;
  }>;
  missingPrerequisites: Array<{
    title: string;
    importance: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  }>;
  suggestedNextSteps: Array<{
    title: string;
    reason: string;
    difficulty: number;
  }>;
  learningPath: Array<{
    id?: string;
    title: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
    estimatedTime: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const { conceptIds, customApiKey } = await request.json();
    
    // Validate user session
    const user = await validateSession(request as any);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log(`🧠 Analyzing learning journey for user ${user.id} with concepts:`, conceptIds);

    // Get the concepts to analyze
    const conceptsToAnalyze = await prisma.concept.findMany({
      where: {
        id: { in: conceptIds },
        userId: user.id
      }
    });

    if (conceptsToAnalyze.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No concepts found to analyze' 
      }, { status: 404 });
    }

    // Get all user's existing concepts for comparison
    const existingConcepts = await prisma.concept.findMany({
      where: {
        userId: user.id,
        id: { notIn: conceptIds } // Exclude the concepts we're analyzing
      }
    });

    console.log(`📚 Found ${existingConcepts.length} existing concepts for comparison`);

    const analyses: LearningAnalysis[] = [];

    // Analyze each concept
    for (const concept of conceptsToAnalyze) {
      console.log(`🔍 Analyzing concept: ${concept.title}`);
      
      const analysis: LearningAnalysis = {
        conceptId: concept.id,
        title: concept.title,
        isLearningNewTopic: false,
        masteredPrerequisites: [],
        missingPrerequisites: [],
        suggestedNextSteps: [],
        learningPath: []
      };

      // 1. Determine if this is a new learning topic
      analysis.isLearningNewTopic = await isNewLearningTopic(concept, existingConcepts);

      // 2. Find mastered prerequisites using vector embeddings
      const conceptEmbedding = await getConceptEmbedding(concept.id);
      if (conceptEmbedding && existingConcepts.length > 0) {
        analysis.masteredPrerequisites = await findMasteredPrerequisites(
          concept, 
          existingConcepts,
          conceptEmbedding
        );
      }

      // 3. Identify missing prerequisites using AI analysis
      analysis.missingPrerequisites = await identifyMissingPrerequisites(
        concept, 
        analysis.masteredPrerequisites,
        customApiKey
      );

      // 4. Generate suggested next steps
      analysis.suggestedNextSteps = await generateNextSteps(
        concept,
        existingConcepts,
        customApiKey
      );

      // 5. Create learning path
      analysis.learningPath = await createLearningPath(
        concept,
        analysis.masteredPrerequisites,
        analysis.missingPrerequisites,
        existingConcepts
      );

      analyses.push(analysis);
      console.log(`✅ Completed analysis for: ${concept.title}`);
    }

    return NextResponse.json({
      success: true,
      analyses,
      userStats: {
        totalConcepts: existingConcepts.length + conceptsToAnalyze.length,
        masteredConcepts: existingConcepts.filter(c => 
          c.masteryLevel === 'ADVANCED' || c.masteryLevel === 'EXPERT'
        ).length,
        learningConcepts: existingConcepts.filter(c => 
          c.masteryLevel === 'BEGINNER' || c.masteryLevel === 'INTERMEDIATE'
        ).length
      }
    });

  } catch (error) {
    console.error('Error analyzing learning journey:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to analyze learning journey' 
    }, { status: 500 });
  }
}

// Helper function to determine if this is a new learning topic
async function isNewLearningTopic(
  concept: any, 
  existingConcepts: any[]
): Promise<boolean> {
  // If user has no previous concepts, it's definitely new
  if (existingConcepts.length === 0) {
    return true;
  }

  // Check if concept's mastery level indicates it's new
  if (concept.masteryLevel === 'BEGINNER' || !concept.masteryLevel) {
    return true;
  }

  // Use vector similarity to check if they have similar concepts
  const conceptEmbedding = await getConceptEmbedding(concept.id);
  if (!conceptEmbedding) {
    return true; // No embedding means we can't compare, assume new
  }

  // Find highly similar concepts (>85% similarity)
  const highSimilarity = await Promise.all(
    existingConcepts.map(async existing => {
      const existingEmbedding = await getConceptEmbedding(existing.id);
      if (!existingEmbedding) return false;
      
      const similarity = calculateCosineSimilarity(
        conceptEmbedding,
        existingEmbedding
      );
      
      return similarity > 0.85;
    })
  );

  return !highSimilarity.some(Boolean);
}

// Helper function to get concept embedding
async function getConceptEmbedding(conceptId: string): Promise<number[] | null> {
  try {
    const result = await prisma.$queryRaw<Array<{embedding: number[]}>>
      `SELECT embedding FROM "Concept" WHERE id = ${conceptId}`;
    
    if (result.length > 0 && result[0].embedding) {
      return result[0].embedding;
    }
    return null;
  } catch (error) {
    console.error('Error getting concept embedding:', error);
    return null;
  }
}

// Helper function to find mastered prerequisites using embeddings
async function findMasteredPrerequisites(
  concept: any,
  existingConcepts: any[],
  conceptEmbedding: number[]
): Promise<Array<{id: string, title: string, masteryLevel: string, similarity: number}>> {
  const prerequisites: Array<{id: string, title: string, masteryLevel: string, similarity: number}> = [];

  for (const existing of existingConcepts) {
    const existingEmbedding = await getConceptEmbedding(existing.id);
    if (!existingEmbedding) continue;

    const similarity = calculateCosineSimilarity(
      conceptEmbedding,
      existingEmbedding
    );

    // Consider concepts with 40-75% similarity as potential prerequisites
    // (not too similar to be duplicates, but related enough to be foundational)
    if (similarity >= 0.4 && similarity <= 0.75) {
      // Only include if the existing concept has some mastery
      if (existing.masteryLevel && existing.masteryLevel !== 'BEGINNER') {
        prerequisites.push({
          id: existing.id,
          title: existing.title,
          masteryLevel: existing.masteryLevel,
          similarity: Math.round(similarity * 100)
        });
      }
    }
  }

  // Sort by similarity and return top 5
  return prerequisites
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

// Helper function to identify missing prerequisites using AI
async function identifyMissingPrerequisites(
  concept: any,
  masteredPrerequisites: any[],
  customApiKey?: string
): Promise<Array<{title: string, importance: 'LOW' | 'MEDIUM' | 'HIGH', reason: string}>> {
  try {
    const client = customApiKey ? new OpenAI({ apiKey: customApiKey }) : openai;
    
    const prompt = `
You are an expert learning path analyst. Analyze this concept and identify what foundational knowledge might be missing.

Concept: ${concept.title}
Category: ${concept.category}
Summary: ${concept.summary}
Difficulty: ${concept.difficultyRating || 'Unknown'}/5

Already Mastered Prerequisites:
${masteredPrerequisites.map(p => `- ${p.title} (${p.masteryLevel})`).join('\n')}

Based on this concept and what the user already knows, identify 2-4 missing prerequisites that would be helpful before learning this concept. Consider:
1. Fundamental concepts needed to understand this topic
2. Tools or technologies that should be familiar first
3. Mathematical or theoretical foundations

Respond with a JSON array of objects with this structure:
[
  {
    "title": "Prerequisite name",
    "importance": "HIGH|MEDIUM|LOW", 
    "reason": "Why this is important to learn first"
  }
]

Keep responses practical and actionable. Focus on concepts that can be learned, not abstract requirements.
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    // Try to parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error identifying missing prerequisites:', error);
    return [];
  }
}

// Helper function to generate next steps
async function generateNextSteps(
  concept: any,
  existingConcepts: any[],
  customApiKey?: string
): Promise<Array<{title: string, reason: string, difficulty: number}>> {
  try {
    const client = customApiKey ? new OpenAI({ apiKey: customApiKey }) : openai;
    
    const relatedTopics = existingConcepts
      .map(c => c.title)
      .slice(0, 10)
      .join(', ');

    const prompt = `
You are an expert learning path designer. Given this newly learned concept, suggest 3-4 logical next steps.

Newly Learned: ${concept.title}
Category: ${concept.category}
Summary: ${concept.summary}

User's Other Knowledge: ${relatedTopics}

Suggest natural next steps that build upon this concept. Consider:
1. Advanced applications of this concept
2. Related concepts that work well together
3. Practical projects to apply the knowledge
4. Specialized areas to explore

Respond with JSON array:
[
  {
    "title": "Next step concept/skill", 
    "reason": "Why this logically follows",
    "difficulty": 1-5
  }
]

Focus on actionable, learnable concepts rather than vague advice.
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error generating next steps:', error);
    return [];
  }
}

// Helper function to create learning path
async function createLearningPath(
  concept: any,
  masteredPrerequisites: any[],
  missingPrerequisites: any[],
  existingConcepts: any[]
): Promise<Array<{id?: string, title: string, status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED', estimatedTime: number}>> {
  const learningPath: Array<{id?: string, title: string, status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED', estimatedTime: number}> = [];

  // Add completed prerequisites
  masteredPrerequisites.forEach(prereq => {
    learningPath.push({
      id: prereq.id,
      title: prereq.title,
      status: 'COMPLETED',
      estimatedTime: 0
    });
  });

  // Add missing prerequisites
  missingPrerequisites.forEach(missing => {
    learningPath.push({
      title: missing.title,
      status: 'NOT_STARTED',
      estimatedTime: missing.importance === 'HIGH' ? 8 : missing.importance === 'MEDIUM' ? 5 : 3
    });
  });

  // Add current concept
  learningPath.push({
    id: concept.id,
    title: concept.title,
    status: 'IN_PROGRESS',
    estimatedTime: concept.timeToMaster || 6
  });

  return learningPath;
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
} 