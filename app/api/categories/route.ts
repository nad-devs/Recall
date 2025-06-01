import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';
import { serverLogger, loggedPrismaQuery } from '@/lib/server-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      serverLogger.logAuth('validateSession', undefined, false, { endpoint: '/api/categories' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    userId = user.id;
    serverLogger.logAuth('validateSession', userId, true, { endpoint: '/api/categories' });

    // Fetch categories from concepts that belong to the user (with optional logging)
    const concepts = await loggedPrismaQuery(
      'concept.findMany (categories distinct)',
      () => prisma.concept.findMany({
        where: {
          userId: user.id
        },
        select: { category: true },
        distinct: ['category'],
      })
    );
    
    // Extract unique categories and build hierarchy
    const categoryStrings = concepts.map(c => c.category).filter(Boolean);
    const categoryPaths = categoryStrings.map(cat => cat.split(' > ').map(part => part.trim()));
    
    serverLogger.logApiCall('/api/categories', 'GET', startTime, userId);
    
    return NextResponse.json({ 
      categories: categoryPaths,
      flatCategories: categoryStrings
    });
  } catch (error) {
    serverLogger.logError('/api/categories GET', error, userId, { startTime, duration: Date.now() - startTime });
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
} 

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let operationData: any = {};
  
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      serverLogger.logAuth('validateSession', undefined, false, { endpoint: '/api/categories POST' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    userId = user.id;
    serverLogger.logAuth('validateSession', userId, true, { endpoint: '/api/categories POST' });

    const requestData = await request.json();
    const { name, parentPath } = requestData;
    operationData = { name, parentPath };
    
    // Only log when debug mode is enabled
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 POST /api/categories - Creating category:', { name, parentPath, userId });
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      serverLogger.logError('/api/categories POST', 'Category name is required and must be non-empty', userId, operationData);
      return NextResponse.json({ error: 'Category name is required and must be non-empty' }, { status: 400 });
    }
    
    // Sanitize the category name
    const sanitizedName = name.trim();
    if (sanitizedName.length > 100) {
      serverLogger.logError('/api/categories POST', 'Category name too long', userId, operationData);
      return NextResponse.json({ error: 'Category name must be 100 characters or less' }, { status: 400 });
    }
    
    // For concept-based categories, we just need to create the path string
    const newCategoryPath = parentPath && parentPath.length > 0 
      ? [...parentPath, sanitizedName].join(' > ')
      : sanitizedName;
    
    operationData.newCategoryPath = newCategoryPath;
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 POST /api/categories - New category path:', newCategoryPath);
    }
    
    // Check if a concept with this category already exists for this user (with optional logging)
    const existingConcept = await loggedPrismaQuery(
      'concept.findFirst (check existing category)',
      () => prisma.concept.findFirst({
        where: { 
          category: newCategoryPath,
          userId: user.id
        }
      })
    );
    
    if (existingConcept) {
      serverLogger.logError('/api/categories POST', 'Category already exists', userId, { ...operationData, existingConceptId: existingConcept.id });
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    // Create a minimal conversation for the placeholder concept (required by schema)
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 POST /api/categories - Creating placeholder conversation...');
    }
    
    let conversation;
    try {
      conversation = await loggedPrismaQuery(
        'conversation.create (placeholder)',
        () => prisma.conversation.create({
          data: {
            text: `Placeholder conversation for category: ${newCategoryPath}`,
            summary: `Placeholder for ${newCategoryPath} category`,
            userId: user.id,
          }
        })
      );

      if (serverLogger.isDebugEnabled()) {
        console.log('💾 POST /api/categories - Created conversation:', conversation.id);
      }
    } catch (conversationError) {
      console.error('❌ Error creating placeholder conversation:', conversationError);
      serverLogger.logError('/api/categories POST', 'Failed to create placeholder conversation', userId, { ...operationData, error: conversationError });
      return NextResponse.json({ error: 'Failed to create placeholder conversation' }, { status: 500 });
    }

    // Create a placeholder concept for the new category
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 POST /api/categories - Creating placeholder concept...');
    }
    
    let concept;
    try {
      concept = await loggedPrismaQuery(
        'concept.create (placeholder)',
        () => prisma.concept.create({
          data: {
            title: "📌 Add Concepts Here",
            category: newCategoryPath,
            summary: "This is a placeholder concept. It will be automatically removed when you add your first real concept to this category.",
            details: "Click 'Add Concept' or move concepts from other categories to get started. This placeholder will disappear once you have real content.",
            keyPoints: JSON.stringify([]),
            examples: JSON.stringify([]), // Changed from empty string to JSON array
            relatedConcepts: JSON.stringify([]),
            relationships: JSON.stringify({}), // Changed from empty string to JSON object
            confidenceScore: 0.1,
            isPlaceholder: true,
            lastUpdated: new Date(),
            userId: user.id, // Associate with the user
            conversationId: conversation.id, // Link to the minimal conversation
          }
        })
      );

      if (serverLogger.isDebugEnabled()) {
        console.log('💾 POST /api/categories - Created concept:', concept.id);
      }
    } catch (conceptError) {
      console.error('❌ Error creating placeholder concept:', conceptError);
      
      // Clean up the conversation we created
      try {
        await prisma.conversation.delete({
          where: { id: conversation.id }
        });
      } catch (cleanupError) {
        console.error('❌ Error cleaning up conversation after concept creation failure:', cleanupError);
      }
      
      serverLogger.logError('/api/categories POST', 'Failed to create placeholder concept', userId, { ...operationData, error: conceptError });
      return NextResponse.json({ error: 'Failed to create placeholder concept' }, { status: 500 });
    }
    
    serverLogger.logApiCall('/api/categories', 'POST', startTime, userId);
    
    return NextResponse.json({ category: { name: newCategoryPath, id: concept.id } });
  } catch (error) {
    console.error('❌ Unexpected error creating category:', error);
    serverLogger.logError('/api/categories POST', error, userId, { ...operationData, startTime, duration: Date.now() - startTime });
    
    // Return a more detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to create category',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let operationData: any = {};
  
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      serverLogger.logAuth('validateSession', undefined, false, { endpoint: '/api/categories PUT' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    userId = user.id;
    serverLogger.logAuth('validateSession', userId, true, { endpoint: '/api/categories PUT' });

    const requestData = await request.json();
    const { action, categoryPath, newName, newParentPath } = requestData;
    operationData = { action, categoryPath, newName, newParentPath };
    
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 PUT /api/categories called with:', operationData);
    }
    
    if (action === 'rename') {
      return await handleRenameCategory(categoryPath, newName, user.id, startTime);
    } else if (action === 'move') {
      return await handleMoveCategory(categoryPath, newParentPath, user.id, startTime);
    } else {
      serverLogger.logError('/api/categories PUT', 'Invalid action', userId, operationData);
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    serverLogger.logError('/api/categories PUT', error, userId, { ...operationData, startTime, duration: Date.now() - startTime });
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Handle renaming a category
async function handleRenameCategory(categoryPath: string[], newName: string, userId: string, apiStartTime: number) {
  const operationStartTime = Date.now();
  const oldCategoryPath = categoryPath.join(' > ');
  const newCategoryPath = [...categoryPath.slice(0, -1), newName].join(' > ');
  
  if (serverLogger.isDebugEnabled()) {
    console.log('💾 Renaming category from:', oldCategoryPath, 'to:', newCategoryPath);
  }
  
  try {
    // Check if new category path already exists for this user (with optional logging)
    const existingConcept = await loggedPrismaQuery(
      'concept.findFirst (check rename conflict)',
      () => prisma.concept.findFirst({
        where: { 
          category: newCategoryPath,
          userId: userId
        }
      })
    );
    
    if (existingConcept) {
      serverLogger.logError('/api/categories rename', 'Category with new name already exists', userId, { oldCategoryPath, newCategoryPath });
      return NextResponse.json({ error: 'Category with new name already exists' }, { status: 400 });
    }
    
    // Update all concepts that exactly match the old path and belong to the user
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Updating exact matches...');
    }
    
    const exactMatches = await loggedPrismaQuery(
      'concept.updateMany (exact matches)',
      () => prisma.concept.updateMany({
        where: { 
          category: oldCategoryPath,
          userId: userId
        },
        data: { category: newCategoryPath }
      })
    );
    
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Updated', exactMatches.count, 'concepts with exact match');
    }
    
    // Update all concepts that have the old path as a prefix (subcategories) and belong to the user
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Finding subcategory concepts...');
    }
    
    const conceptsToUpdate = await loggedPrismaQuery(
      'concept.findMany (subcategory search)',
      () => prisma.concept.findMany({
        where: {
          category: {
            startsWith: oldCategoryPath + ' > '
          },
          userId: userId
        }
      })
    );
    
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Found', conceptsToUpdate.length, 'concepts in subcategories to update');
    }
    
    // Update subcategory concepts one by one
    for (const concept of conceptsToUpdate) {
      const updatedCategoryPath = concept.category.replace(oldCategoryPath, newCategoryPath);
      await loggedPrismaQuery(
        `concept.update (subcategory ${concept.id})`,
        () => prisma.concept.update({
          where: { id: concept.id },
          data: { category: updatedCategoryPath }
        })
      );
    }
    
    const totalDuration = Date.now() - operationStartTime;
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Rename operation completed in', totalDuration, 'ms');
    }
    
    serverLogger.logApiCall('/api/categories', 'PUT', apiStartTime, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: `Renamed category from "${oldCategoryPath}" to "${newCategoryPath}"`,
      updatedConcepts: exactMatches.count + conceptsToUpdate.length
    });
  } catch (error) {
    const totalDuration = Date.now() - operationStartTime;
    serverLogger.logError('/api/categories rename', error, userId, { oldCategoryPath, newCategoryPath, duration: totalDuration });
    throw error;
  }
}

// Handle moving a category to a new parent
async function handleMoveCategory(categoryPath: string[], newParentPath: string[] | null, userId: string, apiStartTime: number) {
  const operationStartTime = Date.now();
  const oldCategoryPath = categoryPath.join(' > ');
  const categoryName = categoryPath[categoryPath.length - 1];
  const newCategoryPath = newParentPath && newParentPath.length > 0
    ? [...newParentPath, categoryName].join(' > ')
    : categoryName;
  
  if (serverLogger.isDebugEnabled()) {
    console.log('💾 Moving category from:', oldCategoryPath, 'to:', newCategoryPath);
  }
  
  try {
    // Check if new category path already exists for this user (with optional logging)
    const existingConcept = await loggedPrismaQuery(
      'concept.findFirst (check move conflict)',
      () => prisma.concept.findFirst({
        where: { 
          category: newCategoryPath,
          userId: userId
        }
      })
    );
    
    if (existingConcept && newCategoryPath !== oldCategoryPath) {
      serverLogger.logError('/api/categories move', 'Target category already exists', userId, { oldCategoryPath, newCategoryPath });
      return NextResponse.json({ error: 'Target category already exists' }, { status: 400 });
    }
    
    // Update all concepts that exactly match the old path and belong to the user
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Updating exact matches for move...');
    }
    
    const exactMatches = await loggedPrismaQuery(
      'concept.updateMany (move exact matches)',
      () => prisma.concept.updateMany({
        where: { 
          category: oldCategoryPath,
          userId: userId
        },
        data: { category: newCategoryPath }
      })
    );
    
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Updated', exactMatches.count, 'concepts with exact match for move');
    }
    
    // Update all concepts that have the old path as a prefix (subcategories) and belong to the user
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Finding subcategory concepts for move...');
    }
    
    const conceptsToUpdate = await loggedPrismaQuery(
      'concept.findMany (move subcategory search)',
      () => prisma.concept.findMany({
        where: {
          category: {
            startsWith: oldCategoryPath + ' > '
          },
          userId: userId
        }
      })
    );
    
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Found', conceptsToUpdate.length, 'concepts in subcategories to update for move');
    }
    
    // Update subcategory concepts one by one
    for (const concept of conceptsToUpdate) {
      const updatedCategoryPath = concept.category.replace(oldCategoryPath, newCategoryPath);
      await loggedPrismaQuery(
        `concept.update (move subcategory ${concept.id})`,
        () => prisma.concept.update({
          where: { id: concept.id },
          data: { category: updatedCategoryPath }
        })
      );
    }
    
    const totalDuration = Date.now() - operationStartTime;
    if (serverLogger.isDebugEnabled()) {
      console.log('💾 Move operation completed in', totalDuration, 'ms');
    }
    
    serverLogger.logApiCall('/api/categories', 'PUT', apiStartTime, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: `Moved category from "${oldCategoryPath}" to "${newCategoryPath}"`,
      updatedConcepts: exactMatches.count + conceptsToUpdate.length
    });
  } catch (error) {
    const totalDuration = Date.now() - operationStartTime;
    serverLogger.logError('/api/categories move', error, userId, { oldCategoryPath, newCategoryPath, duration: totalDuration });
    throw error;
  }
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