import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

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
            {base: "hash table", variations: ["hash table", "hash map", "hash set", "hashtable"]},
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
                        title: {
                          contains: variation
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
                
                if (variantMatches.length > 0) {
                  existingConcepts.push(variantMatches[0]);
                  console.log(`📋 Found algorithm variant match: "${variantMatches[0].title}" for "${concept.title}"`);
                  break;
                }
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