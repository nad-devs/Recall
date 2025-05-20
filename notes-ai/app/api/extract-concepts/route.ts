import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversation_text, category_guidance } = body;

    if (!conversation_text) {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      );
    }

    // Get existing categories if not provided
    let existingCategories = category_guidance?.existing_categories;
    if (!existingCategories) {
      try {
        const categories = await prisma.category.findMany({
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        });
        
        // Convert to paths
        existingCategories = buildCategoryPaths(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Continue without categories if fetch fails
      }
    }

    // Call the external extraction service
    const extractionServiceUrl = process.env.EXTRACTION_SERVICE_URL || 'http://localhost:8000/api/v1/extract-concepts';
    const extractionResponse = await fetch(extractionServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_text,
        category_guidance: {
          use_hierarchical_categories: true,
          existing_categories: existingCategories || [],
          instructions: "Group concepts into hierarchical categories. Use the existing categories when possible, or create new ones as needed. Format as path arrays, e.g. ['Cloud', 'Google Cloud', 'BigQuery'] or ['Data Structure', 'Hash Table']."
        }
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error(`Extraction service returned ${extractionResponse.status}`);
    }

    const extractionData = await extractionResponse.json();

    // Transform the data if needed to ensure categoryPath is included
    const transformedData = {
      ...extractionData,
      concepts: extractionData.concepts.map((concept: any) => {
        // If concept doesn't have categoryPath, create it from category
        if (!concept.categoryPath && concept.category) {
          // Parse the category - it might be a path string like "Cloud > Google Cloud" or just a flat category
          const categoryParts = concept.category.includes('>') 
            ? concept.category.split('>').map((part: string) => part.trim()) 
            : [concept.category];
            
          return {
            ...concept,
            categoryPath: categoryParts
          };
        }
        return concept;
      })
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error extracting concepts:', error);
    return NextResponse.json(
      { error: 'Failed to extract concepts' },
      { status: 500 }
    );
  }
}

// Helper function to build category paths from flat list
function buildCategoryPaths(categories: { id: string, name: string, parentId: string | null }[]): string[][] {
  // Create a map of id -> category for easy lookup
  const categoryMap = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, category);
  });
  
  // Function to build path for a category
  function getCategoryPath(categoryId: string): string[] {
    const category = categoryMap.get(categoryId);
    if (!category) return [];
    
    // If it has a parent, recursively get the parent path and append this category
    if (category.parentId) {
      const parentPath = getCategoryPath(category.parentId);
      return [...parentPath, category.name];
    }
    
    // If no parent, this is a root category
    return [category.name];
  }
  
  // Build paths for all categories
  const paths: string[][] = [];
  categories.forEach(category => {
    paths.push(getCategoryPath(category.id));
  });
  
  return paths;
} 