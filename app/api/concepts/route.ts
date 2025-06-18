import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';

// Function to calculate string similarity (Levenshtein distance-based)
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings for comparison
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Simple word overlap check
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // Check if one string is a substring of the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Count common words
  const commonWords = words1.filter(word => words2.includes(word));
  if (commonWords.length > 0) {
    const commonRatio = commonWords.length / Math.max(words1.length, words2.length);
    return commonRatio;
  }
  
  return 0;
}

// Enhanced categorization system
interface CategoryKeywords {
  category: string;
  subcategories?: string[];
  keywords: string[];
}

const categorySystem: CategoryKeywords[] = [
  {
    category: "Algorithms",
    subcategories: ["Sorting Algorithms", "Search Algorithms", "Graph Algorithms", "String Manipulation", "Dynamic Programming"],
    keywords: ["algorithm", "sort", "search", "path", "traverse", "dynamic programming", "greedy", "backtracking"]
  },
  {
    category: "Data Structures",
    subcategories: ["Arrays", "Linked Lists", "Trees", "Graphs", "Hash Tables", "Stacks", "Queues", "Heaps"],
    keywords: ["data structure", "array", "list", "tree", "graph", "hash table", "map", "stack", "queue", "heap", "dictionary"]
  },
  {
    category: "Data Structures and Algorithms",
    subcategories: ["Arrays", "Linked Lists", "Trees", "Graphs", "Hash Tables", "Sorting Algorithms", "Search Algorithms", "Dynamic Programming"],
    keywords: ["data structure", "algorithm", "array", "list", "tree", "graph", "hash table", "map", "stack", "queue", "heap", "sort", "search", "path", "traverse"]
  },
  {
    category: "Algorithm Technique",
    subcategories: ["Two Pointers", "Sliding Window", "Frequency Counting", "Binary Search", "Depth-First Search", "Breadth-First Search"],
    keywords: ["technique", "approach", "method", "pattern", "count", "frequency", "two pointer", "sliding window", "binary search", "dfs", "bfs"]
  },
  {
    category: "String Manipulation",
    subcategories: ["Anagrams", "Palindromes", "String Matching", "String Encoding"],
    keywords: ["string", "character", "substring", "anagram", "palindrome", "encoding", "decoding"]
  },
  {
    category: "Math & Logic",
    subcategories: ["Number Theory", "Probability", "Combinatorics", "Bit Manipulation"],
    keywords: ["math", "number", "probability", "combinatorics", "bit", "binary", "xor", "prime", "factorial"]
  },
  {
    category: "Backend Engineering",
    subcategories: ["Databases", "APIs", "Caching", "Authentication", "Architecture"],
    keywords: ["backend", "server", "database", "api", "rest", "http", "authentication", "authorization", "architecture"]
  },
  {
    category: "System Design",
    subcategories: ["Scalability", "Load Balancing", "Caching Strategies", "Database Design"],
    keywords: ["system design", "scalability", "distributed", "load balancing", "caching", "database design", "microservices"]
  }
];

// Update common techniques to have more consistent naming and structure
const commonTechniques = [
  {
    technique: "Frequency Count",
    variations: ["frequency counting", "character counting", "frequency map", "frequency table", "character frequency"],
    relatedProblems: ["anagram", "palindrome", "permutation", "duplicate", "valid anagram"],
    category: "Algorithm Technique"
  },
  {
    technique: "Two Pointers",
    variations: ["two pointer", "two-pointer", "multiple pointers", "fast and slow pointers"],
    relatedProblems: ["linked list cycle", "palindrome", "reverse", "find pair"],
    category: "Algorithm Technique"
  },
  {
    technique: "Sliding Window",
    variations: ["sliding window", "window sliding", "variable window"],
    relatedProblems: ["substring", "subarray", "consecutive", "maximum sum"],
    category: "Algorithm Technique"
  },
  {
    technique: "Hash Table",
    variations: ["hash map", "hash set", "dictionary", "map"],
    relatedProblems: ["duplicate", "pair sum", "two sum", "contains", "anagram", "valid anagram"],
    category: "Data Structures"
  },
  {
    technique: "Binary Search",
    variations: ["binary search", "log time search", "divide and conquer"],
    relatedProblems: ["sorted array", "search", "find element", "rotated array"],
    category: "Algorithm Technique"
  }
];

// Completely revised determination function for better consistency
function determineCategory(concept: any): { category: string, subcategory?: string } {
  // Let the backend handle all categorization - just use what's provided or default to General
    return { category: concept.category || 'General' };
}

function normalizeCategory(category: string): { category: string, subcategory?: string } | null {
  // Special case: If category is "Algorithms", return "Data Structures and Algorithms" as the preferred category
  if (category === "Algorithms") {
    return { category: "Data Structures and Algorithms" };
  }

  // First try exact match with our category system
  for (const categoryData of categorySystem) {
    if (categoryData.category === category) {
      return { category: categoryData.category };
    }
  }

  // Try case-insensitive match
  const categoryLower = category.toLowerCase();
  for (const categoryData of categorySystem) {
    if (categoryData.category.toLowerCase() === categoryLower) {
      return { category: categoryData.category };
    }
  }

  // Try fuzzy matching for common variations
  const categoryMapping: { [key: string]: string } = {
    "leetcode": "LeetCode Problems",
    "algorithm": "Data Structures and Algorithms", // Updated from "Algorithm Technique" to "Data Structures and Algorithms"
    "data structure": "Data Structures and Algorithms", // Updated from "Data Structure" to "Data Structures and Algorithms"
    "backend": "Backend Engineering",
    "frontend": "Frontend Engineering",
    "mobile": "Mobile Development",
    "devops": "DevOps",
    "machine learning": "Machine Learning",
    "problem solving": "Problem-Solving",
    "database": "Database"
  };

  for (const [key, value] of Object.entries(categoryMapping)) {
    if (categoryLower.includes(key)) {
      return { category: value };
    }
  }

  // Check for hierarchical categories (e.g., "Data Structure > Hash Table")
  if (category.includes('>')) {
    const parts = category.split('>').map(part => part.trim());
    if (parts.length >= 2) {
      const mainCategory = normalizeCategory(parts[0]);
      if (mainCategory) {
        return {
          category: mainCategory.category,
          subcategory: parts[1]
        };
      }
    }
  }

  return null;
}

// Improved detector function to better connect problems with their techniques
function detectTechniquesInConcept(conceptText: string): string[] {
  const detectedTechniques: string[] = [];
  const normalizedText = conceptText.toLowerCase();
  
  // Check for common problem names and automatically associate them with techniques
  if (normalizedText.includes("valid anagram") || normalizedText.includes("anagram")) {
    detectedTechniques.push("Hash Table");
    detectedTechniques.push("Frequency Count");
  }
  
      if (normalizedText.includes("find duplicate")) {
    detectedTechniques.push("Hash Table");
  }
  
  if (normalizedText.includes("two sum") || normalizedText.includes("pair sum")) {
    detectedTechniques.push("Hash Table");
    detectedTechniques.push("Two Pointers");
  }
  
  if (normalizedText.includes("longest substring") || normalizedText.includes("maximum subarray")) {
    detectedTechniques.push("Sliding Window");
  }
  
  if (normalizedText.includes("linked list cycle") || normalizedText.includes("cycle detection")) {
    detectedTechniques.push("Two Pointers");
  }
  
  // Check for explicit technique mentions
  for (const tech of commonTechniques) {
    // Check for the main technique name
    if (normalizedText.includes(tech.technique.toLowerCase())) {
      detectedTechniques.push(tech.technique);
      continue;
    }
    
    // Check for variations of the technique
    for (const variation of tech.variations) {
      if (normalizedText.includes(variation.toLowerCase())) {
        detectedTechniques.push(tech.technique);
        break;
      }
    }
    
    // For problem concepts, check if they match known problem types for this technique
    if (normalizedText.includes("problem")) {
      for (const problem of tech.relatedProblems) {
        if (normalizedText.includes(problem.toLowerCase())) {
          detectedTechniques.push(tech.technique);
          break;
        }
      }
    }
  }
  
  return [...new Set(detectedTechniques)]; // Remove duplicates
}

// Update the concept relationship establishment to better connect related concepts
async function establishConceptRelationships(
  conceptId: string, 
  conceptText: string,
  explicitRelatedConcepts: string[] = []
): Promise<void> {
  try {
    // Get the current concept to determine its category
    const conceptDetails = await prisma.concept.findUnique({
      where: { id: conceptId },
      select: { 
        title: true,
        category: true,
        relatedConcepts: true
      }
    });
    
    if (!conceptDetails) return;
    
    const conceptTitle = conceptDetails.title.toLowerCase();
    const conceptCategory = conceptDetails.category;
    
    // Detect techniques used in this concept
    const detectedTechniques = detectTechniquesInConcept(conceptText);
    
    // If this is a problem concept, make sure to associate it with relevant techniques
    let relatedTechniques: string[] = [];
    if (conceptTitle.includes("problem") || 
        conceptCategory.includes("Algorithms") ||
        /valid|contains|find|check|search|maximum|minimum/i.test(conceptTitle)) {
      
      // Ensure hash table relation for specific problems
      if (conceptTitle.includes("anagram") || 
          conceptTitle.includes("duplicate") ||
          conceptTitle.includes("two sum")) {
        relatedTechniques.push("Hash Table");
      }
      
      // Add frequency counting for specific problems
      if (conceptTitle.includes("anagram") ||
          conceptTitle.includes("palindrome") ||
          conceptTitle.includes("permutation")) {
        relatedTechniques.push("Frequency Count");
      }
    }
    
    // If this is a technique concept, make sure it relates to appropriate problems
    if (conceptCategory.includes("Algorithm Technique") || 
        conceptTitle.includes("technique") || 
        conceptTitle.includes("method")) {
      
      // Find appropriate problems to relate to
      for (const tech of commonTechniques) {
        if (tech.technique.toLowerCase() === conceptTitle ||
            tech.variations.some(v => conceptTitle.includes(v.toLowerCase()))) {
          
          // This is the technique - find problems to relate to
          for (const problemKeyword of tech.relatedProblems) {
            const problemConcepts = await prisma.concept.findMany({
              where: {
                title: {
                  contains: problemKeyword
                },
                category: {
                  contains: "Algorithm"
                }
              },
              select: { id: true, title: true }
            });
            
            if (problemConcepts.length > 0) {
              explicitRelatedConcepts.push(...problemConcepts.map(c => c.title));
            }
          }
        }
      }
    }
    
    // Combine explicit, detected, and category-based relationships
    const allRelatedConcepts = [...new Set([
      ...explicitRelatedConcepts, 
      ...detectedTechniques,
      ...relatedTechniques
    ])];
    
    if (allRelatedConcepts.length === 0) return;
    
    // Parse existing related concepts
    let existingRelated: any[] = [];
    try {
      existingRelated = JSON.parse(conceptDetails.relatedConcepts || '[]');
      if (!Array.isArray(existingRelated)) existingRelated = [];
    } catch {
      existingRelated = [];
    }
    
    // Add the new related concepts
    const updatedRelatedConcepts = [...existingRelated];
    
    for (const relatedTitle of allRelatedConcepts) {
      // Skip if it's the same as the concept itself
      if (relatedTitle.toLowerCase() === conceptTitle) continue;
      
      // Check if this related concept already exists
      const alreadyExists = existingRelated.some(rel => 
        (typeof rel === 'string' && rel.toLowerCase() === relatedTitle.toLowerCase()) ||
        (rel.title && rel.title.toLowerCase() === relatedTitle.toLowerCase())
      );
      
      if (!alreadyExists) {
        // Find if the concept exists in the database
        const existingConcept = await prisma.concept.findFirst({
          where: {
            title: {
              contains: relatedTitle,
            }
          },
          select: { id: true, title: true, relatedConcepts: true }
        });
        
        if (existingConcept) {
          // Add as object with ID
          updatedRelatedConcepts.push({ id: existingConcept.id, title: existingConcept.title });
          
          // Also establish the reverse relationship
          let reverseRelated: any[] = [];
          try {
            reverseRelated = JSON.parse(existingConcept.relatedConcepts || '[]');
            if (!Array.isArray(reverseRelated)) reverseRelated = [];
          } catch {
            reverseRelated = [];
          }
          
          // Check if the reverse relationship already exists
          const reverseExists = reverseRelated.some(rel => 
            (typeof rel === 'string' && rel.toLowerCase() === conceptTitle.toLowerCase()) ||
            (rel.title && rel.title.toLowerCase() === conceptTitle.toLowerCase())
          );
          
          if (!reverseExists) {
            reverseRelated.push({ id: conceptId, title: conceptTitle });
            
            // Update the related concept with the reverse relationship
            await prisma.concept.update({
              where: { id: existingConcept.id },
              data: { relatedConcepts: JSON.stringify(reverseRelated) }
            });
          }
        } else {
          // Add as string (concept doesn't exist yet)
          updatedRelatedConcepts.push(relatedTitle);
        }
      }
    }
    
    // Update the concept with the new related concepts
    await prisma.concept.update({
      where: { id: conceptId },
      data: { relatedConcepts: JSON.stringify(updatedRelatedConcepts) }
    });
  } catch (error) {
    console.error("Error establishing concept relationships:", error);
  }
}

// Find similar concepts
async function findSimilarConcepts(title: string, userId: string, similarityThreshold: number = 0.7) {
  const allConcepts = await prisma.concept.findMany({
    where: {
      userId: userId  // Filter by user
    },
    select: {
      id: true,
      title: true,
    }
  });
  
  const similarConcepts = allConcepts.filter(concept => 
    calculateSimilarity(concept.title, title) >= similarityThreshold
  );
  
  return similarConcepts;
}

// Function to remove placeholder concepts from a category
async function removePlaceholderConcepts(category: string): Promise<void> {
  try {
    const placeholderConcepts = await prisma.concept.findMany({
      where: {
        category: category,
        isPlaceholder: true
      },
      select: {
        id: true,
        conversationId: true,
        title: true
      }
    });

    if (placeholderConcepts.length > 0) {
      // Collect conversation IDs to delete
      const conversationIds = placeholderConcepts
        .map(concept => concept.conversationId)
        .filter(id => id !== null);
      
      // Delete all placeholder concepts in this category first
      await prisma.concept.deleteMany({
        where: {
          category: category,
          isPlaceholder: true
        }
      });
      
      // Then delete the associated dummy conversations
      if (conversationIds.length > 0) {
        try {
          await prisma.conversation.deleteMany({
            where: {
              id: {
                in: conversationIds
              }
            }
          });
          console.log(`Removed ${conversationIds.length} dummy conversation(s) associated with placeholder concepts`);
        } catch (conversationError) {
          console.error('Error removing dummy conversations (non-critical):', conversationError);
          // Don't throw here as the main goal (removing placeholders) is already done
        }
      }
      
      console.log(`Removed ${placeholderConcepts.length} placeholder concept(s) and their associated conversations from category: ${category}`);
    }
  } catch (error) {
    console.error('Error removing placeholder concepts and conversations:', error);
    throw error; // Re-throw to maintain original error handling behavior
  }
}

// Let the backend handle all pattern detection and guidance

// Utility function to clean up orphaned conversations that don't have any associated concepts
async function cleanupOrphanedConversations(userId: string): Promise<void> {
  try {
    // Find conversations that don't have any associated concepts
    const orphanedConversations = await prisma.conversation.findMany({
      where: {
        userId: userId,
        concepts: {
          none: {} // No associated concepts
        }
      },
      select: {
        id: true,
        summary: true
      }
    });

    if (orphanedConversations.length > 0) {
      console.log(`Found ${orphanedConversations.length} orphaned conversations for cleanup`);
      
      // Delete orphaned conversations
      await prisma.conversation.deleteMany({
        where: {
          id: {
            in: orphanedConversations.map(conv => conv.id)
          }
        }
      });
      
      console.log(`Cleaned up ${orphanedConversations.length} orphaned conversation(s) for user ${userId}`);
    }
  } catch (error) {
    console.error('Error cleaning up orphaned conversations (non-critical):', error);
    // Don't throw - this is a maintenance operation that shouldn't break main functionality
  }
}

// Utility function to clean up broken related concept references
async function cleanupBrokenReferencesForUser(userId: string): Promise<void> {
  try {
    // Get all concepts for this user
    const allConcepts = await prisma.concept.findMany({
      where: { userId },
      select: { id: true, title: true, relatedConcepts: true }
    });

    // Create a map of valid concept IDs and titles
    const validConceptIds = new Set(allConcepts.map(c => c.id));
    const validConceptTitles = new Set(allConcepts.map(c => c.title.toLowerCase().trim()));
    const titleToIdMap = new Map();
    allConcepts.forEach(c => titleToIdMap.set(c.title.toLowerCase().trim(), c.id));

    let totalCleaned = 0;

    // Process each concept's related concepts
    for (const concept of allConcepts) {
      if (!concept.relatedConcepts) continue;

      try {
        const relatedConcepts = JSON.parse(concept.relatedConcepts);
        if (!Array.isArray(relatedConcepts)) continue;

        let hasChanges = false;
        const cleanedRelatedConcepts = [];

        for (const related of relatedConcepts) {
          if (typeof related === 'string') {
            // Check if this title still exists
            const normalizedTitle = related.toLowerCase().trim();
            if (validConceptTitles.has(normalizedTitle)) {
              // Convert to object format with ID if we can find it
              const conceptId = titleToIdMap.get(normalizedTitle);
              if (conceptId) {
                cleanedRelatedConcepts.push({ id: conceptId, title: related });
              } else {
                cleanedRelatedConcepts.push(related);
              }
            } else {
              hasChanges = true; // This reference is broken, skip it
            }
          } else if (typeof related === 'object' && related !== null) {
            // Check if ID exists
            if (related.id && validConceptIds.has(related.id)) {
              // Valid ID, keep it
              cleanedRelatedConcepts.push(related);
            } else if (related.title) {
              // Check if title exists
              const normalizedTitle = related.title.toLowerCase().trim();
              if (validConceptTitles.has(normalizedTitle)) {
                // Title exists, update with correct ID
                const conceptId = titleToIdMap.get(normalizedTitle);
                if (conceptId) {
                  cleanedRelatedConcepts.push({ id: conceptId, title: related.title });
                } else {
                  cleanedRelatedConcepts.push(related);
                }
              } else {
                hasChanges = true; // This reference is broken, skip it
              }
            } else {
              hasChanges = true; // Invalid entry, skip it
            }
          }
        }

        // Update the concept if we found broken references
        if (hasChanges) {
          await prisma.concept.update({
            where: { id: concept.id },
            data: { relatedConcepts: JSON.stringify(cleanedRelatedConcepts) }
          });
          totalCleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning related concepts for ${concept.title}:`, error);
      }
    }

    if (totalCleaned > 0) {
      console.log(`Cleaned up broken references in ${totalCleaned} concepts for user ${userId}`);
    }
  } catch (error) {
    console.error('Error in cleanupBrokenReferencesForUser:', error);
  }
}

export async function GET(request: Request) {
  console.log('📋📋📋 MAIN CONCEPTS API ROUTE CALLED 📋📋📋');
  try {
    // Validate session - but make it optional
    const user = await validateSession(request as NextRequest);
    if (!user) {
      // Return empty concepts array for unauthenticated users instead of 401
      console.log('No authenticated user - returning empty concepts array');
      return NextResponse.json({ concepts: [] });
    }

    // Fetch concepts from the database with better error handling
    let concepts;
    try {
      concepts = await prisma.concept.findMany({
        where: {
          userId: user.id
        },
        include: {
          occurrences: true,
        },
        orderBy: {
          title: 'asc',
        },
      });
      
      // Occasionally clean up broken related concept references (every 20 requests approximately)
      if (Math.random() < 0.05) { // 5% chance to run cleanup
        console.log('Running periodic cleanup of broken related concept references and orphaned conversations...');
        try {
          // Run both cleanup functions
          await cleanupBrokenReferencesForUser(user.id);
          await cleanupOrphanedConversations(user.id);
        } catch (cleanupError) {
          console.error('Cleanup error (non-critical):', cleanupError);
        }
      }
    } catch (dbError) {
      console.error('Database error when fetching concepts:', dbError);
      return NextResponse.json(
        { error: 'Database error when fetching concepts', details: String(dbError) },
        { status: 500 }
      );
    }
    
    if (!concepts || !Array.isArray(concepts)) {
      console.error('Invalid concepts data returned from database');
      return NextResponse.json(
        { error: 'Invalid data returned from database', concepts: [] },
        { status: 200 }  // Return 200 with empty array instead of error
      );
    }
    
    // Return concepts as they are from the database - no override logic
    // The backend categorization system is intelligent and improves over time
    return NextResponse.json({ concepts });
  } catch (error) {
    console.error('Error fetching concepts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concepts', details: String(error), concepts: [] },
      { status: 200 } // Return 200 with empty array instead of 500 error
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let operationStep = 'starting'
  
  try {
    console.log('🔧 SERVER: POST /api/concepts - Operation started at', new Date().toISOString())
    
    // Validate user session
    operationStep = 'validating session'
    console.log('🔧 SERVER: Step 1 - Validating user session...')
    const user = await validateSession(request as NextRequest);
    if (!user) {
      console.error('🔧 SERVER: UNAUTHORIZED - No valid user session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔧 SERVER: ✅ Authenticated user:', user.id, `(${Date.now() - startTime}ms)`)

    operationStep = 'parsing request data'
    console.log('🔧 SERVER: Step 2 - Parsing request data...')
    const data = await request.json();
    console.log('🔧 SERVER: ✅ Request data parsed:', JSON.stringify(data, null, 2), `(${Date.now() - startTime}ms)`)
    
    // Extract the title from request, use "Untitled Concept" as fallback
    const title = data.title || "Untitled Concept";
    
    // Extract context (conversation text) if provided
    const context = data.context || "";
    
    // Check if this is a placeholder concept creation
    const isPlaceholder = data.isPlaceholder || false;
    
    // Check if this is a manual concept creation (not from conversation analysis)
    const isManualCreation = data.isManualCreation || false;
    
    // Check if this is an AI-generated concept (from frontend extraction API)
    const isAIGenerated = data.isAIGenerated || false;
    
    // Check if this should bypass similarity checking (e.g., from connect dialog)
    const bypassSimilarityCheck = data.bypassSimilarityCheck || isAIGenerated || false;
    
    console.log('🔧 SERVER: Step 3 - Processing concept with params:', {
      title,
      isPlaceholder,
      isManualCreation,
      isAIGenerated,
      bypassSimilarityCheck,
      category: data.category,
      hasContext: !!context,
      step: operationStep,
      elapsed: `${Date.now() - startTime}ms`
    })
    
    // If creating a real concept (not placeholder), remove any existing placeholder concepts in the same category
    if (!isPlaceholder && data.category) {
      operationStep = 'removing placeholder concepts'
      console.log('🔧 SERVER: Step 4 - Removing placeholder concepts for category:', data.category)
      try {
        await removePlaceholderConcepts(data.category);
        console.log('🔧 SERVER: ✅ Removed placeholder concepts for category:', data.category, `(${Date.now() - startTime}ms)`)
      } catch (placeholderError) {
        console.error('🔧 SERVER: ❌ Error removing placeholder concepts:', placeholderError)
        // Continue anyway - this shouldn't block concept creation
      }
    }
    
    // Check for similar concepts (skip for placeholder concepts AND when bypassing similarity check)
    if (!isPlaceholder && !bypassSimilarityCheck) {
      operationStep = 'checking similar concepts'
      console.log('🔧 SERVER: Step 5 - Checking for similar concepts...')
      try {
        const similarConcepts = await findSimilarConcepts(title, user.id);
        console.log('🔧 SERVER: ✅ Found similar concepts:', similarConcepts.length, `(${Date.now() - startTime}ms)`)
        
        // If we found similar concepts, return the most similar one instead of creating a new one
        if (similarConcepts.length > 0) {
          operationStep = 'returning existing concept'
          console.log('🔧 SERVER: Step 6 - Returning existing similar concept...')
          const mostSimilarConcept = await prisma.concept.findUnique({
            where: { id: similarConcepts[0].id },
            include: { 
              codeSnippets: true,
              occurrences: true 
            }
          });
          
          console.log('🔧 SERVER: ✅ Found existing concept:', mostSimilarConcept?.id, `(${Date.now() - startTime}ms)`)
          
          // If this is being added from a conversation, add the relationship
          if (data.conversationId) {
            operationStep = 'creating relationship'
            console.log('🔧 SERVER: Step 7 - Creating conversation relationship...')
            // Check if the relationship already exists
            const existingOccurrence = await prisma.occurrence.findFirst({
              where: {
                conceptId: mostSimilarConcept!.id,
                conversationId: data.conversationId
              }
            });
            
            // If there's no existing relationship, create one
            if (!existingOccurrence) {
              await prisma.occurrence.create({
                data: {
                  conceptId: mostSimilarConcept!.id,
                  conversationId: data.conversationId,
                  notes: data.notes || ""
                }
              });
            }
            
            // Check if we should establish relationships with technique concepts
            if (context) {
              operationStep = 'establishing relationships'
              console.log('🔧 SERVER: Step 8 - Establishing concept relationships...')
              // Extract techniques from the context
              const contextWithTitle = `${title} ${context}`;
              await establishConceptRelationships(mostSimilarConcept!.id, contextWithTitle);
              console.log('🔧 SERVER: ✅ Established relationships', `(${Date.now() - startTime}ms)`)
            }
          }
          
          console.log('🔧 SERVER: ✅ COMPLETE - Returning existing concept', mostSimilarConcept?.id, `TOTAL: ${Date.now() - startTime}ms`)
          return NextResponse.json({ 
            concept: mostSimilarConcept,
            isExisting: true,
            message: "Found existing similar concept" 
          }, { status: 200 });
        }
      } catch (similarError) {
        console.error('🔧 SERVER: ❌ Error checking similar concepts:', similarError)
        // Continue anyway - this shouldn't block concept creation
      }
    } else if (bypassSimilarityCheck) {
      console.log('🔧 SERVER: Step 5 - Skipping similar concept check (bypass flag set)')
    }

    let conversationId = data.conversationId;
    
    // Create a dummy conversation ONLY for non-placeholder concepts if no conversationId is provided
    if (!conversationId && !isPlaceholder) {
      try {
        console.log('🔧 POST /api/concepts - Creating dummy conversation for non-placeholder concept type:', {
          isManualCreation,
          title
        })
        
        let conversationText = '';
        let conversationSummary = '';
        
        if (isManualCreation) {
          conversationText = context 
            ? `${context}\n\nManual concept creation for: ${title}`
            : `Manual concept creation for: ${title}. Please explain this concept in detail.`;
          conversationSummary = `Manual concept: ${title}`;
        } else {
          conversationText = context 
            ? `${context}\n\nPlease explain the concept of ${title} in detail.`
            : `Auto-generated conversation for concept: ${title}. Please explain the concept of ${title} in detail.`;
          conversationSummary = `Conversation for ${title} concept`;
        }
        
        const dummyConversation = await prisma.conversation.create({
          data: {
            text: conversationText,
            summary: conversationSummary,
            userId: user.id
          }
        });
        conversationId = dummyConversation.id;
        console.log('🔧 POST /api/concepts - Created dummy conversation:', conversationId)
      } catch (conversationError) {
        console.error('🔧 POST /api/concepts - Error creating dummy conversation:', conversationError)
        throw new Error('Failed to create required conversation for concept')
      }
    }

    // Pre-determine the category using our improved function
    const initialCategory = data.category || determineCategory({ 
      title,
      summary: data.summary || "",
      keyPoints: []
    });

    // Format the initial category with subcategory if available
    const formattedInitialCategory = typeof initialCategory === 'string' 
      ? initialCategory 
      : initialCategory.subcategory 
        ? `${initialCategory.category} > ${initialCategory.subcategory}`
        : initialCategory.category;

    console.log('🔧 POST /api/concepts - Creating concept with category:', formattedInitialCategory)

    // Create the concept - only include conversationId for non-placeholder concepts
    const conceptData: any = {
      title,
      category: formattedInitialCategory,
      summary: data.summary || "",
      details: typeof data.details === 'object' ? JSON.stringify(data.details) : (data.details || ""),
      keyPoints: typeof data.keyPoints === 'object' ? JSON.stringify(data.keyPoints) : JSON.stringify(data.keyPoints ? [data.keyPoints] : []),
      examples: typeof data.examples === 'object' ? JSON.stringify(data.examples) : (data.examples || ""),
      relatedConcepts: typeof data.relatedConcepts === 'object' ? JSON.stringify(data.relatedConcepts) : JSON.stringify(data.relatedConcepts ? [data.relatedConcepts] : []),
      relationships: "",
      confidenceScore: isPlaceholder ? 0.1 : (isAIGenerated ? 0.9 : (isManualCreation ? 0.4 : 0.5)), // High score for AI-generated, lower for manual
      isPlaceholder: isPlaceholder,
      lastUpdated: new Date(),
      userId: user.id
    };

    // Only add conversationId for non-placeholder concepts
    if (!isPlaceholder && conversationId) {
      conceptData.conversationId = conversationId;
    }

    console.log('🔧 POST /api/concepts - Concept data to create:', JSON.stringify(conceptData, null, 2))

    const concept = await prisma.concept.create({
      data: conceptData
    });

    console.log('🔧 POST /api/concepts - Successfully created concept:', concept.id)

    // If this is a placeholder concept, return early without generating content or creating occurrences
    if (isPlaceholder) {
      console.log('🔧 POST /api/concepts - Placeholder concept created, skipping content generation and occurrences')
      return NextResponse.json({ concept }, { status: 201 });
    }

    // For manual creations or AI-generated concepts, don't generate content via backend
    if (isManualCreation || isAIGenerated) {
      console.log(`📝 ${isAIGenerated ? 'AI-generated' : 'Manual'} concept creation: "${title}" - skipping backend AI generation`);
      
      // For AI-generated concepts, we need to create code snippets from the provided data
      if (isAIGenerated && data.codeSnippets && Array.isArray(data.codeSnippets) && data.codeSnippets.length > 0) {
        console.log(`🔧 Creating ${data.codeSnippets.length} code snippets for AI-generated concept...`);
        
        // Create code snippets
        const codeSnippetsToCreate = data.codeSnippets.map((snippet: any) => ({
          conceptId: concept.id,
          language: snippet.language || 'Unknown',
          description: snippet.description || '',
          code: snippet.code || '',
        }));
        
        try {
          await prisma.codeSnippet.createMany({
            data: codeSnippetsToCreate
          });
          console.log(`✅ Created ${codeSnippetsToCreate.length} code snippets for concept ${concept.id}`);
        } catch (snippetError) {
          console.error('❌ Error creating code snippets:', snippetError);
          // Don't fail the whole operation for snippet errors
        }
      }
      
      // Fetch the concept with code snippets to return complete data
      const conceptWithSnippets = await prisma.concept.findUnique({
        where: { id: concept.id },
        include: { 
          codeSnippets: true,
          occurrences: true 
        }
      });
      
      return NextResponse.json({ concept: conceptWithSnippets }, { status: 201 });
    }

    // Use the same backend service that analyzes conversations to generate concept content
    // (Only for conversation-based concepts)
    try {
      const generationPrompt = context 
        ? `Based on this conversation:\n\n${context}\n\nPlease provide a detailed explanation of the concept: ${title}.` 
        : `Please provide a detailed explanation of the concept: ${title}.`;
      
      // Let backend handle all analysis without frontend guidance
      
      // Use consistent backend URL logic with fallback
      const httpsUrl = process.env.BACKEND_URL || 'https://recall-p3vg.onrender.com';
      const httpUrl = httpsUrl.replace('https://', 'http://');
      
      let generationResponse;
      try {
        console.log("Attempting HTTPS connection for concept generation...");
        generationResponse = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            conversation_text: generationPrompt +
            ` Include summary, key points, code examples if applicable, and any related concepts.`,
            context: null
          }),
        });
      } catch (sslError) {
        console.log("HTTPS failed for concept generation, trying HTTP fallback...", sslError instanceof Error ? sslError.message : 'SSL connection failed');
        generationResponse = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            conversation_text: generationPrompt +
            ` Include summary, key points, code examples if applicable, and any related concepts.`,
            context: null
          }),
        });
      }
      
      if (!generationResponse.ok) {
        throw new Error('Failed to generate concept content');
      }
      
      const generatedData = await generationResponse.json();
      
      // If we get a relevant concept, update our placeholder with the generated content
      if (generatedData.concepts && generatedData.concepts.length > 0) {
        const generatedConcept = generatedData.concepts[0];
        
        // Prepare code snippets if any
        const codeSnippetsToCreate = (generatedConcept.codeSnippets || []).map((snippet: any) => ({
          language: snippet.language || 'Unknown',
          description: snippet.description || '',
          code: snippet.code || '',
        }));
        
        // Extract related concepts
        const relatedConceptTitles = 
          Array.isArray(generatedConcept.relatedConcepts) ? generatedConcept.relatedConcepts : 
          typeof generatedConcept.relatedConcepts === 'string' ? 
            (generatedConcept.relatedConcepts ? [generatedConcept.relatedConcepts] : []) : [];
        
        // Determine appropriate category using our enhanced system
        const { category, subcategory } = determineCategory(generatedConcept);
        
        // Format the category with subcategory if available
        const formattedCategory = subcategory 
          ? `${category} > ${subcategory}` 
          : category;
        
        // Prepare combined text for technique detection
        const combinedText = `
          ${generatedConcept.title || ''} 
          ${generatedConcept.summary || ''}
          ${Array.isArray(generatedConcept.keyPoints) 
            ? generatedConcept.keyPoints.join(" ") 
            : typeof generatedConcept.keyPoints === 'string'
              ? generatedConcept.keyPoints
              : ''
          }
          ${typeof generatedConcept.details === 'string' 
            ? generatedConcept.details
            : typeof generatedConcept.details === 'object'
              ? JSON.stringify(generatedConcept.details)
            : ''
          }
        `;
        
        // Update the concept with the generated content
        await prisma.concept.update({
          where: { id: concept.id },
          data: {
            summary: generatedConcept.summary || '',
            details: typeof generatedConcept.details === 'object' 
              ? JSON.stringify(generatedConcept.details) 
              : generatedConcept.details || '',
            keyPoints: typeof generatedConcept.keyPoints === 'object'
              ? JSON.stringify(generatedConcept.keyPoints)
              : generatedConcept.keyPoints || '[]',
            category: formattedCategory,
            examples: typeof generatedConcept.examples === 'object'
              ? JSON.stringify(generatedConcept.examples)
              : generatedConcept.examples || '',
            relatedConcepts: typeof generatedConcept.relatedConcepts === 'object'
              ? JSON.stringify(generatedConcept.relatedConcepts)
              : generatedConcept.relatedConcepts || '[]',
            confidenceScore: 0.8,
            lastUpdated: new Date(),
            // Add code snippets if they exist
            codeSnippets: {
              create: codeSnippetsToCreate
            }
          }
        });
        
        // Establish relationships with technique concepts
        await establishConceptRelationships(concept.id, combinedText, relatedConceptTitles);
        
        // Fetch the updated concept to return
        const updatedConcept = await prisma.concept.findUnique({
          where: { id: concept.id },
          include: { 
            codeSnippets: true,
            occurrences: true 
          }
        });
        
        return NextResponse.json({ concept: updatedConcept }, { status: 201 });
      }
      
      return NextResponse.json({ concept }, { status: 201 });
    } catch (generationError) {
      console.error('🔧 POST /api/concepts - Error generating concept content:', generationError);
      // Still return the basic concept even if generation fails
      return NextResponse.json({ concept }, { status: 201 });
    }
  } catch (error) {
    console.error('🔧 POST /api/concepts - Critical error creating concept:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to create concept';
    let statusCode = 500;
    
    if (error instanceof Error) {
      console.error('🔧 POST /api/concepts - Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check for specific error types
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A concept with this title already exists';
        statusCode = 409;
      } else if (error.message.includes('Required field')) {
        errorMessage = 'Missing required fields for concept creation';
        statusCode = 400;
      } else if (error.message.includes('Database')) {
        errorMessage = 'Database error occurred while creating concept';
        statusCode = 503;
      } else {
        errorMessage = `Failed to create concept: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: statusCode }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Concept ID is required' },
        { status: 400 }
      );
    }

    // Get the current concept to check for category changes
    const currentConcept = await prisma.concept.findUnique({
      where: { id },
      select: { category: true, title: true, summary: true }
    });

    // Check if category is being changed (for learning purposes)
    if (currentConcept && updates.category && updates.category !== currentConcept.category) {
      console.log(`📚 Learning: User changed "${currentConcept.title}" from "${currentConcept.category}" to "${updates.category}"`);
      
      // TODO: In future, we could store these corrections to improve the learning algorithm
      // For now, we just log them to understand user patterns
    }

    // Update the concept
    const updatedConcept = await prisma.concept.update({
      where: { id },
      data: {
        ...updates,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(updatedConcept);
  } catch (error) {
    console.error('Error updating concept:', error);
    return NextResponse.json(
      { error: 'Failed to update concept' },
      { status: 500 }
    );
  }
} 