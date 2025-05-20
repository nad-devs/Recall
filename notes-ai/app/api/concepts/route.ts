import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    subcategories: ["Sorting Algorithms", "Search Algorithms", "Graph Algorithms", "String Algorithms", "Dynamic Programming"],
    keywords: ["algorithm", "sort", "search", "path", "traverse", "dynamic programming", "greedy", "backtracking"]
  },
  {
    category: "Data Structures",
    subcategories: ["Arrays", "Linked Lists", "Trees", "Graphs", "Hash Tables", "Stacks", "Queues", "Heaps"],
    keywords: ["data structure", "array", "list", "tree", "graph", "hash table", "map", "stack", "queue", "heap", "dictionary"]
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
  // First check if we have a valid LLM-suggested category
  if (concept.category && typeof concept.category === 'string') {
    const normalizedCategory = normalizeCategory(concept.category);
    if (normalizedCategory) {
      return normalizedCategory;
    }
  }

  // Combine all relevant text from the concept for analysis
  const conceptText = `${concept.title} ${concept.summary || ''} ${
    typeof concept.keyPoints === 'string' 
      ? concept.keyPoints 
      : Array.isArray(concept.keyPoints) 
        ? concept.keyPoints.join(' ') 
        : ''
  }`.toLowerCase();
  
  const title = concept.title.toLowerCase();
  
  // STEP 1: Check for pure data structures (not problems)
  if ((title.includes("hash table") || title.includes("hash map") || title.includes("hashmap") || 
       title.includes("dictionary") || title.includes("set")) &&
      !title.includes("problem")) {
    return { category: "Data Structures", subcategory: "Hash Tables" };
  }
  
  if ((title.includes("array") || title.includes("list")) && 
      !title.includes("problem")) {
    return { category: "Data Structures", subcategory: "Arrays" };
  }
  
  if ((title.includes("tree") || title.includes("binary search tree") || title.includes("bst")) &&
      !title.includes("problem")) {
    return { category: "Data Structures", subcategory: "Trees" };
  }
  
  if ((title.includes("graph") || title.includes("network")) &&
      !title.includes("problem")) {
    return { category: "Data Structures", subcategory: "Graphs" };
  }
  
  // STEP 2: Check for pure techniques (not problems)
  if ((title.includes("technique") || title.includes("method") || title.includes("approach") ||
       title.includes("algorithm") || title.includes("count") || title.includes("frequency")) &&
      !title.includes("problem")) {
    
    // Specific technique checks
    if (title.includes("frequency") || title.includes("count")) {
      return { category: "Algorithm Technique", subcategory: "Frequency Counting" };
    }
    
    if (title.includes("two pointer") || title.includes("two-pointer")) {
      return { category: "Algorithm Technique", subcategory: "Two Pointers" };
    }
    
    if (title.includes("sliding window")) {
      return { category: "Algorithm Technique", subcategory: "Sliding Window" };
    }
    
    if (title.includes("binary search")) {
      return { category: "Algorithm Technique", subcategory: "Binary Search" };
    }
    
    if (title.includes("dfs") || title.includes("depth first")) {
      return { category: "Algorithm Technique", subcategory: "Depth-First Search" };
    }
    
    if (title.includes("bfs") || title.includes("breadth first")) {
      return { category: "Algorithm Technique", subcategory: "Breadth-First Search" };
    }
    
    // Generic technique
    return { category: "Algorithm Technique" };
  }
  
  // STEP 3: Check for problem types
  if (title.includes("problem") || /find|valid|check|contains|determine|is\s|are\s/i.test(title)) {
    // Check what type of problem it is based on content
    
    // String problems
    if (conceptText.includes("anagram") || conceptText.includes("palindrome") || 
        conceptText.includes("substring") || conceptText.includes("string")) {
      return { category: "Algorithms", subcategory: "String Algorithms" };
    }
    
    // Graph problems
    if (conceptText.includes("graph") || conceptText.includes("node") || 
        conceptText.includes("edge") || conceptText.includes("vertex") || 
        conceptText.includes("vertices") || conceptText.includes("path")) {
      return { category: "Algorithms", subcategory: "Graph Algorithms" };
    }
    
    // Sorting problems
    if (conceptText.includes("sort") || conceptText.includes("order")) {
      return { category: "Algorithms", subcategory: "Sorting Algorithms" };
    }
    
    // Search problems
    if (conceptText.includes("search") || conceptText.includes("find")) {
      return { category: "Algorithms", subcategory: "Search Algorithms" };
    }
    
    // Dynamic Programming problems
    if (conceptText.includes("dynamic programming") || conceptText.includes("dp") ||
        conceptText.includes("memoization") || conceptText.includes("optimal substructure")) {
      return { category: "Algorithms", subcategory: "Dynamic Programming" };
    }
    
    // If no specific algorithm type is determined, but it's still a problem
    return { category: "Algorithms" };
  }
  
  // STEP 4: If we haven't determined a category yet, use keyword scoring
  let bestCategory = "Algorithms"; // Default changed from Backend Engineering
  let bestSubcategory: string | undefined = undefined;
  let highestScore = 0;
  
  // Score each category based on keyword matches
  for (const categoryData of categorySystem) {
    let score = 0;
    
    // Check for keyword matches
    for (const keyword of categoryData.keywords) {
      if (conceptText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    // If we found a better match
    if (score > highestScore) {
      highestScore = score;
      bestCategory = categoryData.category;
      
      // Try to identify a subcategory
      if (categoryData.subcategories) {
        for (const subcategory of categoryData.subcategories) {
          if (conceptText.includes(subcategory.toLowerCase())) {
            bestSubcategory = subcategory;
            break;
          }
        }
      }
    }
  }
  
  return { category: bestCategory, subcategory: bestSubcategory };
}

function normalizeCategory(category: string): { category: string, subcategory?: string } | null {
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
    "algorithm": "Algorithm Technique",
    "data structure": "Data Structure",
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
  
  if (normalizedText.includes("contains duplicate") || normalizedText.includes("find duplicate")) {
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
async function findSimilarConcepts(title: string, similarityThreshold: number = 0.7) {
  const allConcepts = await prisma.concept.findMany({
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

export async function GET(request: Request) {
  try {
    // Fetch concepts from the database
    const concepts = await prisma.concept.findMany({
      include: {
        occurrences: true,
      },
      orderBy: {
        title: 'asc',
      },
    });
    
    // Fix any inconsistent categories in the returned results
    // This doesn't update the database but ensures consistent UI display
    const fixedConcepts = concepts.map(concept => {
      // Check for inconsistent categories that need fixing
      if (concept.title.toLowerCase().includes("frequency count") || 
          concept.title.toLowerCase().includes("two pointer") ||
          concept.title.toLowerCase().includes("sliding window")) {
        return {
          ...concept,
          category: "Algorithm Technique"
        };
      }
      
      if (concept.title.toLowerCase().includes("problem")) {
        return {
          ...concept,
          category: "Algorithms"
        };
      }
      
      if ((concept.title.toLowerCase().includes("hash table") || 
           concept.title.toLowerCase().includes("tree") ||
           concept.title.toLowerCase().includes("graph") ||
           concept.title.toLowerCase().includes("array")) && 
          !concept.title.toLowerCase().includes("problem")) {
        return {
          ...concept,
          category: "Data Structures"
        };
      }
      
      return concept;
    });
    
    return NextResponse.json(fixedConcepts);
  } catch (error) {
    console.error('Error fetching concepts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concepts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Extract the title from request, use "Untitled Concept" as fallback
    const title = data.title || "Untitled Concept";
    
    // Extract context (conversation text) if provided
    const context = data.context || "";
    
    // Check for similar concepts
    const similarConcepts = await findSimilarConcepts(title);
    
    // If we found similar concepts, return the most similar one instead of creating a new one
    if (similarConcepts.length > 0) {
      const mostSimilarConcept = await prisma.concept.findUnique({
        where: { id: similarConcepts[0].id },
        include: { 
          codeSnippets: true,
          occurrences: true 
        }
      });
      
      // If this is being added from a conversation, add the relationship
      if (data.conversationId) {
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
          // Extract techniques from the context
          const contextWithTitle = `${title} ${context}`;
          await establishConceptRelationships(mostSimilarConcept!.id, contextWithTitle);
        }
      }
      
      return NextResponse.json({ 
        concept: mostSimilarConcept,
        isExisting: true,
        message: "Found existing similar concept" 
      }, { status: 200 });
    }
    
    // We need to create a dummy conversation first since concept requires a conversation relation
    const dummyConversation = await prisma.conversation.create({
      data: {
        text: context 
          ? `${context}\n\nPlease explain the concept of ${title} in detail.`
          : `Auto-generated conversation for concept: ${title}. Please explain the concept of ${title} in detail.`,
        summary: `Conversation for ${title} concept`,
      }
    });
    
    // Pre-determine the category using our improved function
    const initialCategory = determineCategory({ 
      title,
      summary: "",
      keyPoints: []
    });
    
    // Create a basic placeholder concept first
    const concept = await prisma.concept.create({
      data: {
        title,
        category: initialCategory.category, // Use our improved categorization
        summary: "",
        details: "",
        keyPoints: JSON.stringify([]),
        examples: "",
        relatedConcepts: JSON.stringify([]),
        relationships: "",
        confidenceScore: 0.5,
        lastUpdated: new Date(),
        conversation: {
          connect: {
            id: dummyConversation.id
          }
        }
      }
    });
    
    // If this is being added from a conversation, create the relationship
    if (data.conversationId) {
      await prisma.occurrence.create({
        data: {
          conceptId: concept.id,
          conversationId: data.conversationId,
          notes: data.notes || ""
        }
      });
    }
    
    // Use the same backend service that analyzes conversations to generate concept content
    try {
      const generationPrompt = context 
        ? `Based on this conversation:\n\n${context}\n\nPlease provide a detailed explanation of the concept: ${title}.` 
        : `Please provide a detailed explanation of the concept: ${title}.`;
      
      const generationResponse = await fetch('http://localhost:8000/api/v1/extract-concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text: generationPrompt +
          ` Include summary, key points, code examples if applicable, and any related concepts.` 
        }),
      });
      
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
      console.error('Error generating concept content:', generationError);
      // Still return the basic concept even if generation fails
      return NextResponse.json({ concept }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating concept:', error);
    return NextResponse.json(
      { error: 'Failed to create concept' },
      { status: 500 }
    );
  }
} 