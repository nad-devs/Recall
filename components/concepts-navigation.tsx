import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Search, BookOpen, Plus } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy'
import { CategoryNodeComponent } from './concepts-navigation/CategoryNode'

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

interface ConceptsNavigationProps {
  concepts: Concept[]
  conceptsByCategory: Record<string, Concept[]>
  sortedCategories: string[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onCategorySelect: (category: string | null) => void
  selectedCategory: string | null
  showNeedsReview: boolean
  onNeedsReviewToggle: () => void
  onConceptsMove?: (conceptIds: string[], newCategory: string) => void
  onDataRefresh?: () => Promise<void>
  onAddSubcategory?: (parentCategory: string) => void
  className?: string
}

export const ConceptsNavigation = React.memo(function ConceptsNavigationComponent({ 
  concepts, 
  conceptsByCategory, 
  searchQuery, 
  onSearchChange, 
  onCategorySelect, 
  selectedCategory,
  onAddSubcategory,
  className = ""
}: ConceptsNavigationProps) {
  
  const categoryHierarchy = useCategoryHierarchy(conceptsByCategory)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Backend Engineering', 'Data Structures', 'Computer Science'])
  )

  // Enhanced search functionality
  const filteredConceptsByCategory = useMemo(() => {
    if (!searchQuery.trim()) {
      return conceptsByCategory
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered: Record<string, Concept[]> = {}

    Object.entries(conceptsByCategory).forEach(([category, categoryItems]) => {
      const matchingConcepts = categoryItems.filter(concept => {
        const titleMatch = concept.title.toLowerCase().includes(query)
        const notesMatch = concept.notes?.toLowerCase().includes(query) || false
        const summaryMatch = concept.summary?.toLowerCase().includes(query) || false
        const categoryMatch = concept.category.toLowerCase().includes(query)
        
        return titleMatch || notesMatch || summaryMatch || categoryMatch
      })

      if (matchingConcepts.length > 0) {
        filtered[category] = matchingConcepts
      }
    })

    return filtered
  }, [conceptsByCategory, searchQuery])

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const categoriesToExpand = new Set<string>()
      Object.keys(filteredConceptsByCategory).forEach(category => {
        const parts = category.split(' > ')
        for (let i = 0; i < parts.length; i++) {
          const parentPath = parts.slice(0, i + 1).join(' > ')
          categoriesToExpand.add(parentPath)
        }
      })
      setExpandedCategories(categoriesToExpand)
    }
  }, [searchQuery, filteredConceptsByCategory])

  const toggleCategory = useCallback((categoryPath: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryPath)) {
      newExpanded.delete(categoryPath)
    } else {
      newExpanded.add(categoryPath)
    }
    setExpandedCategories(newExpanded)
  }, [expandedCategories])

  // Use filtered hierarchy for rendering
  const filteredHierarchy = useMemo(() => {
    const filtered: Record<string, any> = {}
    
    // Helper function to calculate total concepts in a node and its subcategories
    const calculateTotalConcepts = (node: any, filteredConceptsByCategory: Record<string, Concept[]>): number => {
      let total = filteredConceptsByCategory[node.fullPath]?.length || 0
      
      Object.values(node.subcategories).forEach((subNode: any) => {
        total += calculateTotalConcepts(subNode, filteredConceptsByCategory)
      })
      
      return total
    }
    
    Object.entries(categoryHierarchy).forEach(([key, node]) => {
      const hasFilteredConcepts = filteredConceptsByCategory[node.fullPath]
      const hasFilteredSubcategories = Object.values(node.subcategories).some(subNode => 
        filteredConceptsByCategory[subNode.fullPath] || 
        Object.values(subNode.subcategories).some((deepNode: any) => 
          filteredConceptsByCategory[deepNode.fullPath]))

      if (hasFilteredConcepts || hasFilteredSubcategories) {
        const totalConceptCount = calculateTotalConcepts(node, filteredConceptsByCategory)
        
        filtered[key] = {
          ...node,
          conceptCount: totalConceptCount,
          concepts: filteredConceptsByCategory[node.fullPath] || []
        }
      }
    })
    
    return filtered
  }, [categoryHierarchy, filteredConceptsByCategory])

  const renderCategoryNode = useCallback((node: any, depth: number = 0) => {
    const hasFilteredConcepts = filteredConceptsByCategory[node.fullPath]
    const hasFilteredSubcategories = Object.values(node.subcategories).some((subNode: any) => 
      filteredConceptsByCategory[subNode.fullPath] || 
      Object.values(subNode.subcategories).some((deepNode: any) => 
        filteredConceptsByCategory[deepNode.fullPath]))

    if (!hasFilteredConcepts && !hasFilteredSubcategories) return null

    // Helper function to calculate total concepts in a node and its subcategories
    const calculateTotalConcepts = (nodeToCalculate: any): number => {
      let total = filteredConceptsByCategory[nodeToCalculate.fullPath]?.length || 0
      
      Object.values(nodeToCalculate.subcategories).forEach((subNode: any) => {
        total += calculateTotalConcepts(subNode)
      })
      
      return total
    }

    const nodeWithFilteredCount = {
      ...node,
      conceptCount: calculateTotalConcepts(node),
      concepts: filteredConceptsByCategory[node.fullPath] || []
    }

    return (
      <React.Fragment key={node.fullPath}>
        <CategoryNodeComponent
          key={node.fullPath}
          node={nodeWithFilteredCount}
          depth={depth}
          isExpanded={expandedCategories.has(node.fullPath)}
          isSelected={selectedCategory === node.fullPath}
          isInlineEditing={false}
          onToggleCategory={toggleCategory}
          onCategorySelect={onCategorySelect}
          onAddSubcategory={onAddSubcategory || (() => {})}
          onStartInlineEdit={() => {}}
          onSaveInlineEdit={() => {}}
          onCancelInlineEdit={() => {}}
          onSetTransferConcepts={() => {}}
          inlineEditValue=""
          onSetInlineEditValue={() => {}}
          isCreatingCategory={false}
          isMovingConcepts={false}
          isRenamingCategory={false}
          handleCategoryDrop={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          isDraggingAny={false}
        />
        
        {/* Render subcategories when expanded */}
        {expandedCategories.has(node.fullPath) && (
          <div>
            {Object.values(node.subcategories)
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((subNode: any) => renderCategoryNode(subNode, depth + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }, [filteredConceptsByCategory, expandedCategories, selectedCategory, toggleCategory, onCategorySelect, onAddSubcategory])

  return (
    <div className={`w-80 border-r bg-card flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Navigate Concepts
          <Badge variant="secondary" className="ml-auto text-xs">
            {Object.values(filteredConceptsByCategory).flat().length}
          </Badge>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {Object.values(filteredHierarchy).length > 0 ? (
            Object.values(filteredHierarchy)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(node => renderCategoryNode(node, 0))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-sm font-medium mb-1">
                {searchQuery ? 'No concepts match your search' : 'No concepts yet'}
              </p>
              <p className="text-xs">
                {searchQuery ? 'Try a different search term' : 'Start analyzing conversations to build your knowledge base'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Button */}
      <div className="p-4 border-t bg-gradient-to-r from-primary/5 to-secondary/5">
        <button
          onClick={() => onAddSubcategory && onAddSubcategory("")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Create a new top-level category"
        >
          <Plus className="h-4 w-4" />
          Add Top-Level Category
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Hover over categories above to add subcategories
        </p>
      </div>
    </div>
  )
}) 