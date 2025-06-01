import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

// Enhanced similarity calculation using multiple metrics
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // If strings are identical, return perfect match
  if (s1 === s2) return 1.0;
  
  // Jaccard similarity (shared words / total unique words)
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  const jaccardScore = union.size > 0 ? intersection.size / union.size : 0;
  
  // Substring containment check (one contains the other)
  const containmentScore = s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;
  
  // Character overlap ratio
  const chars1 = s1.replace(/\s/g, '');
  const chars2 = s2.replace(/\s/g, '');
  const commonChars = [...chars1].filter(c => chars2.includes(c)).length;
  const charOverlap = Math.max(chars1.length, chars2.length) > 0 
    ? commonChars / Math.max(chars1.length, chars2.length) : 0;
  
  // Combined score with weights
  const finalScore = (jaccardScore * 0.5) + (containmentScore * 0.3) + (charOverlap * 0.2);
  
  return Math.min(finalScore, 1.0);
}

export async function POST(request: Request) {
  try {
    console.log('📋 CHECK-EXISTING API ROUTE CALLED');
    console.log('📋 DEBUG: New version of the API route with empty array response');
    const { concepts } = await request.json();
    console.log(`📋 Received ${concepts?.length || 0} concepts to check`);

    if (!concepts || !Array.isArray(concepts)) {
      console.log('📋 Error: Concepts array is missing or invalid');
      return NextResponse.json(
        { error: 'Concepts array is required' },
        { status: 400 }
      );
    }

    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      console.log('📋 Error: User not authenticated - returning empty matches array');
      // Return empty matches instead of 401 error to match behavior of other APIs
      return NextResponse.json({ matches: [] });
    }
    console.log(`📋 User authenticated: ${user.id}`);

    const matches = [];

    for (const concept of concepts) {
      if (!concept.title) continue;

      // Normalize the concept title for comparison
      const normalizedTitle = concept.title.toLowerCase().trim().replace(/\s+/g, ' ');
      console.log(`📋 Checking for existing concept: "${concept.title}" (normalized: "${normalizedTitle}")`);

      // Check for exact matches first - only within user's concepts
      let existingConcepts = await prisma.concept.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { equals: concept.title } },
                { title: { equals: normalizedTitle } }
              ]
            },
            { userId: user.id }  // Ensure user can only see their own concepts
          ]
        },
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          lastUpdated: true
        }
      });
      
      console.log(`📋 Found ${existingConcepts.length} exact matches for "${concept.title}"`);

      // If no exact matches, check for similar titles
      if (existingConcepts.length === 0) {
        // Handle common variations like "Contains Duplicate" vs "Contains Duplicate Problem"
        if (concept.title.includes("Contains Duplicate") || normalizedTitle.includes("contains duplicate")) {
          const similarConcepts = await prisma.concept.findMany({
            where: {
              AND: [
                {
                  title: {
                    contains: "Duplicate"
                  }
                },
                { userId: user.id }  // User filtering
              ]
            },
            select: {
              id: true,
              title: true,
              summary: true,
              category: true,
              lastUpdated: true
            }
          });

          for (const similar of similarConcepts) {
            const similarTitle = similar.title.toLowerCase().trim();
            if (
              similarTitle.includes("contains duplicate") || 
              normalizedTitle.includes(similarTitle) ||
              similarTitle.includes(normalizedTitle)
            ) {
              existingConcepts.push(similar);
              console.log(`📋 Found similar match: "${similar.title}" for "${concept.title}"`);
              break;
            }
          }
        }

        // Special case for LeetCode problems
        if (existingConcepts.length === 0 && concept.category === "LeetCode Problems") {
          const standardNames = [
            "Contains Duplicate",
            "Valid Anagram", 
            "Two Sum",
            "Reverse Linked List",
            "Maximum Subarray"
          ];

          const titleLower = concept.title.toLowerCase();
          for (const stdName of standardNames) {
            if (titleLower.includes(stdName.toLowerCase()) && titleLower !== stdName.toLowerCase()) {
              const leetCodeMatch = await prisma.concept.findFirst({
                where: {
                  AND: [
                    {
                      title: {
                        equals: stdName
                      }
                    },
                    { userId: user.id }  // User filtering
                  ]
                },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  category: true,
                  lastUpdated: true
                }
              });
              if (leetCodeMatch) {
                existingConcepts.push(leetCodeMatch);
                console.log(`📋 Found LeetCode match: "${leetCodeMatch.title}" for "${concept.title}"`);
                break;
              }
            }
          }
        }

        // Check for fuzzy matches based on keywords
        if (existingConcepts.length === 0) {
          const keywords = concept.title.toLowerCase().split(/\s+/).filter((word: string) => word.length > 3);
          if (keywords.length > 0) {
            console.log(`📋 Checking fuzzy matches with keywords: ${keywords.join(', ')}`);
            const fuzzyMatches = await prisma.concept.findMany({
              where: {
                AND: [
                  {
                    OR: keywords.map((keyword: string) => ({
                      title: {
                        contains: keyword
                      }
                    }))
                  },
                  { userId: user.id }  // User filtering
                ]
              },
              select: {
                id: true,
                title: true,
                summary: true,
                category: true,
                lastUpdated: true
              }
            });
            
            console.log(`📋 Found ${fuzzyMatches.length} potential fuzzy matches`);

            // Filter for high similarity matches
            for (const fuzzyMatch of fuzzyMatches) {
              const matchTitle = fuzzyMatch.title.toLowerCase();
              const matchingKeywords = keywords.filter((keyword: string) => matchTitle.includes(keyword));
              
              // If more than 1/3 the keywords match, consider it a potential match (reduced from 1/2)
              if (matchingKeywords.length >= Math.ceil(keywords.length / 3)) {
                existingConcepts.push(fuzzyMatch);
                console.log(`📋 Accepted fuzzy match: "${fuzzyMatch.title}" with ${matchingKeywords.length}/${keywords.length} keywords matching`);
                break; // Only take the first good match
              }
            }
          }
        }
        
        // Special case for Algorithm variants (e.g. "Anagram Check" vs "Anagram Validation")
        if (existingConcepts.length === 0 && 
            (concept.category === "Algorithms" || 
             concept.category === "Algorithm Technique" || 
             concept.category === "Data Structures and Algorithms" ||
             concept.category === "LeetCode Problems")) {
             
          // Common algorithm problems and their variations
          const algorithmVariants = [
            {base: "anagram", variations: ["anagram", "valid anagram", "anagram check", "anagram validation"]},
            {base: "two sum", variations: ["two sum", "2sum", "two sum problem", "find two sum"]},
            {base: "linked list", variations: ["linked list", "singly linked list", "doubly linked list", "reverse linked list"]},
            {base: "binary search", variations: ["binary search", "binary search algorithm", "binary search implementation"]},
            {
              base: "hash table", 
              variations: [
                "hash table", "hash tables", "hash map", "hash maps", "hash set", "hashtable", "hashtables",
                "hash table implementation", "hash table optimization", "hash table implementation and optimization",
                "hash table design", "hash table structure", "hash table algorithm", "hash table data structure"
              ]
            },
          ];
          
          const lowerTitle = concept.title.toLowerCase();
          
          // Check if this concept matches any of our known algorithm variants
          for (const variantGroup of algorithmVariants) {
            // If this concept contains the base algorithm name
            if (lowerTitle.includes(variantGroup.base)) {
              console.log(`📋 Checking algorithm variants for "${variantGroup.base}"`);
              
              // Look for existing concepts with any of the variations
              for (const variation of variantGroup.variations) {
                const variantMatches = await prisma.concept.findMany({
                  where: {
                    AND: [
                      {
                        OR: [
                          { title: { contains: variation } },
                          // Also check if the variation is contained in the existing concept title
                          { title: { contains: variantGroup.base } }
                        ]
                      },
                      { userId: user.id }  // User filtering
                    ]
                  },
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    category: true,
                    lastUpdated: true
                  }
                });
                
                // Additional filtering for better matches
                for (const match of variantMatches) {
                  const matchTitleLower = match.title.toLowerCase();
                  
                  // Check if this is a good match by seeing if:
                  // 1. The existing concept contains the base term (e.g., "hash table")
                  // 2. The new concept also contains the base term
                  // 3. They're not exactly the same title
                  if (matchTitleLower.includes(variantGroup.base) && 
                      lowerTitle.includes(variantGroup.base) &&
                      matchTitleLower !== lowerTitle) {
                    
                    existingConcepts.push(match);
                    console.log(`📋 Found algorithm variant match: "${match.title}" for "${concept.title}"`);
                    break;
                  }
                }
                
                // If we found a match, break out of variations loop
                if (existingConcepts.length > 0) break;
              }
              
              // If we found a match, break out of the outer loop
              if (existingConcepts.length > 0) break;
            }
          }
        }
      }

      // If we found matching concepts, add to matches
      if (existingConcepts.length > 0) {
        matches.push({
          newConcept: {
            title: concept.title,
            summary: concept.summary || '',
            category: concept.category || 'General',
            keyPoints: concept.keyPoints || [],
            details: concept.details || {},
            examples: concept.examples || [],
            codeSnippets: concept.codeSnippets || [],
            relatedConcepts: concept.relatedConcepts || []
          },
          existingConcept: existingConcepts[0] // Take the first/best match
        });
        console.log(`📋 Added match to results: "${concept.title}" -> "${existingConcepts[0].title}"`);
      }
    }

    console.log(`📋 Returning ${matches.length} total matches`);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error checking existing concepts:', error);
    return NextResponse.json(
      { error: 'Failed to check existing concepts' },
      { status: 500 }
    );
  }
} 