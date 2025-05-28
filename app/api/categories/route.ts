import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch categories from concepts that belong to the user
    const concepts = await prisma.concept.findMany({
      where: {
        userId: user.id
      },
      select: { category: true },
      distinct: ['category'],
    });
    
    // Extract unique categories and build hierarchy
    const categoryStrings = concepts.map(c => c.category).filter(Boolean);
    const categoryPaths = categoryStrings.map(cat => cat.split(' > ').map(part => part.trim()));
    
    return NextResponse.json({ 
      categories: categoryPaths,
      flatCategories: categoryStrings
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
} 

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, parentPath } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    // For concept-based categories, we just need to create the path string
    const newCategoryPath = parentPath && parentPath.length > 0 
      ? [...parentPath, name].join(' > ')
      : name;
    
    // Check if a concept with this category already exists for this user
    const existingConcept = await prisma.concept.findFirst({
      where: { 
        category: newCategoryPath,
        userId: user.id
      }
    });
    
    if (existingConcept) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    // Create a minimal conversation for the placeholder concept (required by schema)
    const conversation = await prisma.conversation.create({
      data: {
        text: `Placeholder conversation for category: ${newCategoryPath}`,
        summary: `Placeholder for ${newCategoryPath} category`,
        userId: user.id,
      }
    });

    // Create a placeholder concept for the new category
    const concept = await prisma.concept.create({
      data: {
        title: "📌 Add Concepts Here",
        category: newCategoryPath,
        summary: "This is a placeholder concept. It will be automatically removed when you add your first real concept to this category.",
        details: "Click 'Add Concept' or move concepts from other categories to get started. This placeholder will disappear once you have real content.",
        keyPoints: JSON.stringify([]),
        examples: "",
        relatedConcepts: JSON.stringify([]),
        relationships: "",
        confidenceScore: 0.1,
        isPlaceholder: true,
        lastUpdated: new Date(),
        userId: user.id, // Associate with the user
        conversationId: conversation.id, // Link to the minimal conversation
      }
    });
    
    return NextResponse.json({ category: { name: newCategoryPath, id: concept.id } });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, categoryPath, newName, newParentPath } = await request.json();
    
    console.log('PUT /api/categories called with:', { action, categoryPath, newName, newParentPath });
    
    if (action === 'rename') {
      return await handleRenameCategory(categoryPath, newName, user.id);
    } else if (action === 'move') {
      return await handleMoveCategory(categoryPath, newParentPath, user.id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Handle renaming a category
async function handleRenameCategory(categoryPath: string[], newName: string, userId: string) {
  const oldCategoryPath = categoryPath.join(' > ');
  const newCategoryPath = [...categoryPath.slice(0, -1), newName].join(' > ');
  
  console.log('Renaming category from:', oldCategoryPath, 'to:', newCategoryPath);
  
  // Check if new category path already exists for this user
  const existingConcept = await prisma.concept.findFirst({
    where: { 
      category: newCategoryPath,
      userId: userId
    }
  });
  
  if (existingConcept) {
    return NextResponse.json({ error: 'Category with new name already exists' }, { status: 400 });
  }
  
  // Update all concepts that exactly match the old path and belong to the user
  const exactMatches = await prisma.concept.updateMany({
    where: { 
      category: oldCategoryPath,
      userId: userId
    },
    data: { category: newCategoryPath }
  });
  
  console.log('Updated', exactMatches.count, 'concepts with exact match');
  
  // Update all concepts that have the old path as a prefix (subcategories) and belong to the user
  const conceptsToUpdate = await prisma.concept.findMany({
    where: {
      category: {
        startsWith: oldCategoryPath + ' > '
      },
      userId: userId
    }
  });
  
  console.log('Found', conceptsToUpdate.length, 'concepts in subcategories to update');
  
  for (const concept of conceptsToUpdate) {
    const updatedCategoryPath = concept.category.replace(oldCategoryPath, newCategoryPath);
    await prisma.concept.update({
      where: { id: concept.id },
      data: { category: updatedCategoryPath }
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: `Renamed category from "${oldCategoryPath}" to "${newCategoryPath}"`,
    updatedConcepts: exactMatches.count + conceptsToUpdate.length
  });
}

// Handle moving a category to a new parent
async function handleMoveCategory(categoryPath: string[], newParentPath: string[] | null, userId: string) {
  const oldCategoryPath = categoryPath.join(' > ');
  const categoryName = categoryPath[categoryPath.length - 1];
  const newCategoryPath = newParentPath && newParentPath.length > 0
    ? [...newParentPath, categoryName].join(' > ')
    : categoryName;
  
  console.log('Moving category from:', oldCategoryPath, 'to:', newCategoryPath);
  
  // Check if new category path already exists for this user
  const existingConcept = await prisma.concept.findFirst({
    where: { 
      category: newCategoryPath,
      userId: userId
    }
  });
  
  if (existingConcept && newCategoryPath !== oldCategoryPath) {
    return NextResponse.json({ error: 'Target category already exists' }, { status: 400 });
  }
  
  // Update all concepts that exactly match the old path and belong to the user
  const exactMatches = await prisma.concept.updateMany({
    where: { 
      category: oldCategoryPath,
      userId: userId
    },
    data: { category: newCategoryPath }
  });
  
  console.log('Updated', exactMatches.count, 'concepts with exact match');
  
  // Update all concepts that have the old path as a prefix (subcategories) and belong to the user
  const conceptsToUpdate = await prisma.concept.findMany({
    where: {
      category: {
        startsWith: oldCategoryPath + ' > '
      },
      userId: userId
    }
  });
  
  console.log('Found', conceptsToUpdate.length, 'concepts in subcategories to update');
  
  for (const concept of conceptsToUpdate) {
    const updatedCategoryPath = concept.category.replace(oldCategoryPath, newCategoryPath);
    await prisma.concept.update({
      where: { id: concept.id },
      data: { category: updatedCategoryPath }
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: `Moved category from "${oldCategoryPath}" to "${newCategoryPath}"`,
    updatedConcepts: exactMatches.count + conceptsToUpdate.length
  });
}

// Remove the unused helper functions since we're working with concept categories now
// Helper function to build category paths from flat list (kept for backward compatibility)
function buildCategoryPaths(categories: { id: string, name: string, parentId: string | null }[]): string[][] {
  // This is now unused but kept for potential future use
  const categoryMap = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, category);
  });
  
  function getCategoryPath(categoryId: string): string[] {
    const category = categoryMap.get(categoryId);
    if (!category) return [];
    
    if (category.parentId) {
      const parentPath = getCategoryPath(category.parentId);
      return [...parentPath, category.name];
    }
    
    return [category.name];
  }
  
  const paths: string[][] = [];
  categories.forEach(category => {
    paths.push(getCategoryPath(category.id));
  });
  
  return paths;
} 