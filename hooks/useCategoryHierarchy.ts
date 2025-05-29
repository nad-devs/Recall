import { useMemo } from 'react'

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
  isPlaceholder?: boolean
}

export interface CategoryNode {
  name: string
  fullPath: string
  concepts: Concept[]
  subcategories: Record<string, CategoryNode>
  conceptCount: number
}

// Dynamic hierarchy builder - parses actual category strings into tree structure
const buildCategoryHierarchy = (conceptsByCategory: Record<string, Concept[]>) => {
  const root: CategoryNode = {
    name: 'root',
    fullPath: '',
    concepts: [],
    subcategories: {},
    conceptCount: 0
  }

  // Process each category
  Object.entries(conceptsByCategory).forEach(([categoryPath, concepts]) => {
    const parts = categoryPath.split(' > ').map(part => part.trim())
    let currentNode = root

    // Build the path in the tree
    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1
      const fullPath = parts.slice(0, index + 1).join(' > ')

      if (!currentNode.subcategories[part]) {
        currentNode.subcategories[part] = {
          name: part,
          fullPath: fullPath,
          concepts: [],
          subcategories: {},
          conceptCount: 0
        }
      }

      currentNode = currentNode.subcategories[part]

      // If this is the exact category, add the concepts here
      if (isLastPart) {
        currentNode.concepts = concepts
      }
    })
  })

  // Calculate concept counts - include both direct concepts and subcategory concepts
  const calculateDirectCounts = (node: CategoryNode): number => {
    // Count direct concepts
    let totalCount = node.concepts.length
    
    // Add counts from all subcategories
    Object.values(node.subcategories).forEach(subNode => {
      totalCount += calculateDirectCounts(subNode)
    })
    
    // Set the total count for this node
    node.conceptCount = totalCount
    
    return totalCount
  }

  Object.values(root.subcategories).forEach(calculateDirectCounts)

  // Simple duplicate elimination: Remove top-level categories that also exist as subcategories
  const topLevelNames = Object.keys(root.subcategories)
  const subcategoryNames = new Set<string>()
  
  // Collect all subcategory names
  Object.values(root.subcategories).forEach(node => {
    Object.keys(node.subcategories).forEach(subName => {
      subcategoryNames.add(subName)
    })
  })
  
  // Filter out top-level categories that are also subcategories (unless they have direct concepts)
  const filteredHierarchy: Record<string, CategoryNode> = {}
  
  Object.entries(root.subcategories).forEach(([name, node]) => {
    const isAlsoSubcategory = subcategoryNames.has(name)
    const hasDirectConcepts = node.concepts.length > 0
    
    if (!isAlsoSubcategory || hasDirectConcepts) {
      filteredHierarchy[name] = node
    }
  })
  
  return filteredHierarchy
}

export const useCategoryHierarchy = (conceptsByCategory: Record<string, Concept[]>) => {
  return useMemo(() => buildCategoryHierarchy(conceptsByCategory), [conceptsByCategory])
}

export const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase()
  if (lower.includes('algorithm') || lower.includes('data structures')) return 'Code'
  if (lower.includes('backend') || lower.includes('database')) return 'Database'
  if (lower.includes('frontend') || lower.includes('react')) return 'Layers'
  if (lower.includes('cloud') || lower.includes('aws')) return 'Globe'
  if (lower.includes('machine learning') || lower.includes('ai') || lower.includes('deep learning')) return 'Brain'
  return 'BookOpen'
} 