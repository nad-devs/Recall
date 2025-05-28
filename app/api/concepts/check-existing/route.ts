import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📋 CHECK-EXISTING API ROUTE CALLED');
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
      console.log('📋 Error: User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
              
              // If more than half the keywords match, consider it a potential match
              if (matchingKeywords.length >= Math.ceil(keywords.length / 2)) {
                existingConcepts.push(fuzzyMatch);
                console.log(`📋 Accepted fuzzy match: "${fuzzyMatch.title}" with ${matchingKeywords.length}/${keywords.length} keywords matching`);
                break; // Only take the first good match
              }
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