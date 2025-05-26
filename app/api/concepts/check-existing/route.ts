import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { concepts } = await request.json();

    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json(
        { error: 'Concepts array is required' },
        { status: 400 }
      );
    }

    const matches = [];

    for (const concept of concepts) {
      if (!concept.title) continue;

      // Normalize the concept title for comparison
      const normalizedTitle = concept.title.toLowerCase().trim().replace(/\s+/g, ' ');

      // Check for exact matches first
      let existingConcepts = await prisma.concept.findMany({
        where: {
          OR: [
            { title: { equals: concept.title } },
            { title: { equals: normalizedTitle } }
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

      // If no exact matches, check for similar titles
      if (existingConcepts.length === 0) {
        // Handle common variations like "Contains Duplicate" vs "Contains Duplicate Problem"
        if (concept.title.includes("Contains Duplicate") || normalizedTitle.includes("contains duplicate")) {
          const similarConcepts = await prisma.concept.findMany({
            where: {
              title: {
                contains: "Duplicate"
              }
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
                  title: {
                    equals: stdName
                  }
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
                break;
              }
            }
          }
        }

        // Check for fuzzy matches based on keywords
        if (existingConcepts.length === 0) {
          const keywords = concept.title.toLowerCase().split(/\s+/).filter((word: string) => word.length > 3);
          if (keywords.length > 0) {
            const fuzzyMatches = await prisma.concept.findMany({
              where: {
                OR: keywords.map((keyword: string) => ({
                  title: {
                    contains: keyword
                  }
                }))
              },
              select: {
                id: true,
                title: true,
                summary: true,
                category: true,
                lastUpdated: true
              }
            });

            // Filter for high similarity matches
            for (const fuzzyMatch of fuzzyMatches) {
              const matchTitle = fuzzyMatch.title.toLowerCase();
              const matchingKeywords = keywords.filter((keyword: string) => matchTitle.includes(keyword));
              
              // If more than half the keywords match, consider it a potential match
              if (matchingKeywords.length >= Math.ceil(keywords.length / 2)) {
                existingConcepts.push(fuzzyMatch);
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
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error checking existing concepts:', error);
    return NextResponse.json(
      { error: 'Failed to check existing concepts' },
      { status: 500 }
    );
  }
} 