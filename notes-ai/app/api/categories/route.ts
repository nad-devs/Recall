import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all categories with their hierarchy info
    const categories = await prisma.category.findMany({
      select: { 
        id: true,
        name: true,
        parentId: true
      },
      orderBy: { name: 'asc' },
    });
    
    // Convert flat list to paths
    const categoryPaths = buildCategoryPaths(categories);
    
    return NextResponse.json({ 
      categories: categoryPaths,
      flatCategories: categories.map(c => c.name) // Keep for backward compatibility
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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