import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  BookOpen, 
  AlertTriangle,
  Plus,
  FolderPlus,
  ArrowRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDrop } from 'react-dnd'
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy'
import { useCategoryOperations } from '@/hooks/useCategoryOperations'
import { CategoryNodeComponent } from './concepts-navigation/CategoryNode'
import { CategoryDialogs } from './concepts-navigation/CategoryDialogs'
import { useDebugLogger } from '@/utils/debug-logger'

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
  className?: string
}

export function ConceptsNavigation({ 
  concepts, 
  conceptsByCategory, 
  sortedCategories, 
  searchQuery, 
  onSearchChange, 
  onCategorySelect, 
  selectedCategory,
  showNeedsReview,
  onNeedsReviewToggle,
  onConceptsMove,
  onDataRefresh,
  className = ""
}: ConceptsNavigationProps) {
  const { toast } = useToast()
  const debug = useDebugLogger('ConceptsNavigation')
  
  // Track component renders
  debug.logUserAction('ConceptsNavigation render', { 
    conceptsCount: concepts.length,
    categoriesCount: Object.keys(conceptsByCategory).length,
    selectedCategory,
    showNeedsReview
  })
  
  // Category expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Backend Engineering', 'Data Structures', 'Computer Science'])
  )
  
  // Drag and drop state
  const [isDraggingAny, setIsDraggingAny] = useState(false)
  const [expandedBeforeDrag, setExpandedBeforeDrag] = useState<Set<string>>(new Set())
  
  // Inline editing state
  const [inlineEditingCategory, setInlineEditingCategory] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState('')
  
  // Build dynamic hierarchy from actual categories
  const categoryHierarchy = useCategoryHierarchy(conceptsByCategory)
  
  // Category operations hook
  debug.logUserAction('Initializing category operations hook', { 
    conceptsByCategoryKeys: Object.keys(conceptsByCategory).length 
  })
  
  const categoryOps = useCategoryOperations({
    conceptsByCategory,
    onDataRefresh,
    onCategorySelect,
    onConceptsMove
  })
  
  debug.logUserAction('Category operations hook initialized', { 
    isCreatingCategory: categoryOps.isCreatingCategory,
    isMovingConcepts: categoryOps.isMovingConcepts,
    isRenamingCategory: categoryOps.isRenamingCategory
  })

  // Calculate stats
  const totalConcepts = concepts.length
  const needsReviewCount = concepts.filter(c => c.needsReview).length

  // Drag handlers
  const handleDragStart = useCallback(() => {
    setIsDraggingAny(true)
    setExpandedBeforeDrag(new Set(expandedCategories))
    
    // Expand all categories that have subcategories
    const allCategoriesWithSubs = new Set<string>()
    Object.values(categoryHierarchy).forEach(node => {
      const addCategoriesWithSubs = (n: any) => {
        if (Object.keys(n.subcategories).length > 0) {
          allCategoriesWithSubs.add(n.fullPath)
        }
        Object.values(n.subcategories).forEach(addCategoriesWithSubs)
      }
      addCategoriesWithSubs(node)
    })
    setExpandedCategories(allCategoriesWithSubs)
  }, [expandedCategories, categoryHierarchy])

  const handleDragEnd = useCallback(() => {
    setIsDraggingAny(false)
    setExpandedCategories(expandedBeforeDrag)
    setExpandedBeforeDrag(new Set())
  }, [expandedBeforeDrag])

  const toggleCategory = useCallback((categoryPath: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryPath)) {
      newExpanded.delete(categoryPath)
    } else {
      newExpanded.add(categoryPath)
    }
    setExpandedCategories(newExpanded)
  }, [expandedCategories])

  // Inline editing handlers
  const startInlineEdit = useCallback((categoryPath: string) => {
    const categoryName = categoryPath.includes(' > ') 
      ? categoryPath.split(' > ').pop() || '' 
      : categoryPath
    setInlineEditingCategory(categoryPath)
    setInlineEditValue(categoryName)
  }, [])

  const cancelInlineEdit = useCallback(() => {
    debug.logUserAction('Starting cancelInlineEdit')
    setInlineEditingCategory(null)
    setInlineEditValue('')
    
    debug.logUserAction('Inline edit cancelled, scheduling refresh')
    
    // Apply same refresh logic as other cancel operations
    setTimeout(async () => {
      try {
        debug.logUserAction('Executing refresh after inline edit cancel')
        if (onDataRefresh) {
          await onDataRefresh()
        }
        debug.logUserAction('Refresh after inline edit cancel completed')
      } catch (refreshError: any) {
        debug.logError('Refresh error after inline edit cancel', refreshError)
        console.error('Non-critical refresh error:', refreshError)
        // Fallback: simple page reload if refresh fails
        window.location.reload()
      }
    }, 100) // Small delay to allow UI to update
  }, [onDataRefresh, debug])

  const saveInlineEdit = useCallback(async () => {
    if (!inlineEditingCategory || !inlineEditValue.trim()) {
      cancelInlineEdit()
      return
    }
    
    const trimmedName = inlineEditValue.trim()
    const oldPath = inlineEditingCategory
    const pathParts = oldPath.split(' > ')
    pathParts[pathParts.length - 1] = trimmedName
    const newPath = pathParts.join(' > ')
    
    if (newPath === oldPath) {
      cancelInlineEdit()
      return
    }
    
    if (conceptsByCategory[newPath]) {
      toast({
        title: "Category Exists",
        description: `Category "${newPath}" already exists.`,
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          categoryPath: oldPath.split(' > '),
          newName: trimmedName
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to rename category')
      }
      
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      onCategorySelect(newPath)
      
      toast({
        title: "Category Renamed",
        description: `Successfully renamed "${oldPath}" to "${newPath}"`,
        duration: 3000,
      })
      
      cancelInlineEdit()
      
    } catch (error) {
      console.error('Error renaming category:', error)
      toast({
        title: "Error",
        description: "Failed to rename category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [inlineEditingCategory, inlineEditValue, conceptsByCategory, toast, onDataRefresh, onCategorySelect, cancelInlineEdit])

  // Additional handlers for CategoryDialogs
  const handleAddSubcategory = useCallback((parentCategory: string) => {
    if (categoryOps.isCreatingCategory || categoryOps.isMovingConcepts) {
      return
    }
    categoryOps.setSelectedParentCategory(parentCategory)
    categoryOps.setNewSubcategoryName('')
    categoryOps.setShowAddSubcategoryDialog(true)
  }, [categoryOps])

  const handleAddTopLevelCategory = useCallback(() => {
    if (categoryOps.isCreatingCategory || categoryOps.isMovingConcepts) {
      return
    }
    categoryOps.setSelectedParentCategory('')
    categoryOps.setNewSubcategoryName('')
    categoryOps.setShowAddSubcategoryDialog(true)
  }, [categoryOps])

  // Category drop handler
  const handleCategoryDrop = useCallback(async (draggedCategoryPath: string, targetCategoryPath: string | null) => {
    if (draggedCategoryPath === targetCategoryPath) return
    
    if (targetCategoryPath && targetCategoryPath.startsWith(draggedCategoryPath + ' > ')) {
      toast({
        title: "Invalid Move",
        description: "Cannot move a category into its own subcategory.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    const targetName = targetCategoryPath 
      ? targetCategoryPath.split(' > ').pop() || 'Unknown'
      : 'Root Level'
    
    categoryOps.setDragDropData({
      draggedCategoryPath,
      targetCategoryPath,
      targetCategoryName: targetName
    })
    categoryOps.setShowDragDropDialog(true)
  }, [toast, categoryOps])

  // Additional drag/drop handlers
  const executeCategoryMove = useCallback(async (draggedCategoryPath: string, targetCategoryPath: string | null) => {
    try {
      const draggedPathParts = draggedCategoryPath.split(' > ')
      const targetPathParts = targetCategoryPath ? targetCategoryPath.split(' > ') : []
      
      toast({
        title: "Moving Category",
        description: `Moving "${draggedCategoryPath}" to ${targetCategoryPath || 'root level'}...`,
        duration: 2000,
      })
      
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          categoryPath: draggedPathParts,
          newParentPath: targetPathParts.length > 0 ? targetPathParts : null
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to move category')
      }
      
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      toast({
        title: "Category Moved",
        description: `Successfully moved "${draggedCategoryPath}" to ${targetCategoryPath || 'root level'}`,
        duration: 3000,
      })
      
    } catch (error) {
      console.error('Error moving category:', error)
      toast({
        title: "Error",
        description: "Failed to move category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [toast, onDataRefresh])

  const moveConceptsToCategory = useCallback(async (sourceCategoryPath: string, targetCategoryPath: string) => {
    try {
      const sourceConcepts = conceptsByCategory[sourceCategoryPath] || []
      
      if (sourceConcepts.length === 0) {
        toast({
          title: "No Concepts Found",
          description: `No concepts found in "${sourceCategoryPath}" to move.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }
      
      toast({
        title: "Moving Concepts",
        description: `Moving ${sourceConcepts.length} concept(s) from "${sourceCategoryPath}" to "${targetCategoryPath}"...`,
        duration: 2000,
      })
      
      if (onConceptsMove) {
        const conceptIds = sourceConcepts.map(c => c.id)
        await onConceptsMove(conceptIds, targetCategoryPath)
      }
      
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      toast({
        title: "Concepts Moved",
        description: `Successfully moved ${sourceConcepts.length} concept(s) to "${targetCategoryPath}"`,
        duration: 3000,
      })
      
    } catch (error) {
      console.error('Error moving concepts:', error)
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [conceptsByCategory, toast, onConceptsMove, onDataRefresh])

  // Drop zone for empty space (root level drops)
  const [{ isOverEmptySpace }, dropEmptySpace] = useDrop(() => ({
    accept: 'CATEGORY',
    drop: (item: { categoryPath: string }, monitor) => {
      if (!monitor.isOver({ shallow: true })) {
        return
      }
      handleCategoryDrop(item.categoryPath, null)
    },
    collect: (monitor) => ({
      isOverEmptySpace: !!monitor.isOver({ shallow: true }),
    }),
  }), [handleCategoryDrop])

  const renderCategoryNode = useCallback((node: any, depth: number = 0) => {
    if (node.conceptCount === 0) return null

    const hasSubcategories = Object.keys(node.subcategories).length > 0

    return (
      <React.Fragment key={node.fullPath}>
        <CategoryNodeComponent
          key={node.fullPath}
          node={node}
          depth={depth}
          isExpanded={expandedCategories.has(node.fullPath)}
          isSelected={selectedCategory === node.fullPath}
          isInlineEditing={inlineEditingCategory === node.fullPath}
          onToggleCategory={toggleCategory}
          onCategorySelect={onCategorySelect}
          onAddSubcategory={handleAddSubcategory}
          onStartInlineEdit={startInlineEdit}
          onSaveInlineEdit={saveInlineEdit}
          onCancelInlineEdit={cancelInlineEdit}
          onSetTransferConcepts={categoryOps.setTransferConcepts}
          onShowTransferDialog={categoryOps.setShowTransferDialog}
          inlineEditValue={inlineEditValue}
          onSetInlineEditValue={setInlineEditValue}
          isCreatingCategory={categoryOps.isCreatingCategory}
          isMovingConcepts={categoryOps.isMovingConcepts}
          isRenamingCategory={categoryOps.isRenamingCategory}
          handleCategoryDrop={handleCategoryDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          isDraggingAny={isDraggingAny}
        />
        {/* Render children here if expanded and has subcategories */}
        {hasSubcategories && expandedCategories.has(node.fullPath) && (
          <div>
            {Object.values(node.subcategories)
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .filter((subNode: any) => subNode.conceptCount > 0)
              .map((subNode: any) => renderCategoryNode(subNode, depth + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }, [
    expandedCategories, selectedCategory, inlineEditingCategory, inlineEditValue,
    toggleCategory, onCategorySelect, handleAddSubcategory, startInlineEdit,
    saveInlineEdit, cancelInlineEdit, categoryOps, handleCategoryDrop,
    handleDragStart, handleDragEnd, isDraggingAny
  ])

  return (
    <div className={`w-80 bg-card border-r border-border h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Navigate Concepts
        </h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{totalConcepts}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{Object.keys(conceptsByCategory).length}</div>
            <div className="text-muted-foreground">Categories</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Quick Filters</h3>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null && !showNeedsReview ? "secondary" : "ghost"}
            className="w-full justify-start text-sm h-8"
            onClick={() => {
              onCategorySelect(null)
              if (showNeedsReview) onNeedsReviewToggle()
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            All Concepts
            <Badge variant="secondary" className="ml-auto">
              {totalConcepts}
            </Badge>
          </Button>
          
          <Button
            variant={showNeedsReview ? "secondary" : "ghost"}
            className="w-full justify-start text-sm h-8"
            onClick={onNeedsReviewToggle}
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
            Needs Review
            <Badge variant="secondary" className="ml-auto">
              {needsReviewCount}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        ref={(el) => {
          dropEmptySpace(el)
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={handleAddTopLevelCategory}
            disabled={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory}
            title={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory ? "Please wait for current operation to complete" : "Add new category"}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className={`space-y-1 min-h-32 ${isOverEmptySpace ? 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg p-2' : ''}`}>
          {Object.values(categoryHierarchy).length > 0 ? (
            Object.values(categoryHierarchy)
              .sort((a, b) => a.name.localeCompare(b.name))
              .filter(node => node.conceptCount > 0)
              .map(node => renderCategoryNode(node, 0))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FolderPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm mb-1">No categories yet</p>
              <p className="text-xs">Click the + button above to create your first category</p>
            </div>
          )}
        </div>
      </div>

      {/* All Dialogs */}
      {(() => {
        debug.logUserAction('About to render CategoryDialogs', {
          showAddSubcategoryDialog: categoryOps.showAddSubcategoryDialog,
          showTransferDialog: categoryOps.showTransferDialog,
          showEditCategoryDialog: categoryOps.showEditCategoryDialog,
          showDragDropDialog: categoryOps.showDragDropDialog,
          isCreatingCategory: categoryOps.isCreatingCategory,
          isMovingConcepts: categoryOps.isMovingConcepts
        })
        
        const startTime = performance.now()
        
        const result = (
          <CategoryDialogs
            // Add Subcategory Dialog
            showAddSubcategoryDialog={categoryOps.showAddSubcategoryDialog}
            setShowAddSubcategoryDialog={categoryOps.setShowAddSubcategoryDialog}
            selectedParentCategory={categoryOps.selectedParentCategory}
            newSubcategoryName={categoryOps.newSubcategoryName}
            setNewSubcategoryName={categoryOps.setNewSubcategoryName}
            isCreatingCategory={categoryOps.isCreatingCategory}
            handleCreateSubcategory={categoryOps.handleCreateSubcategory}
            
            // Transfer Concepts Dialog
            showTransferDialog={categoryOps.showTransferDialog}
            setShowTransferDialog={categoryOps.setShowTransferDialog}
            transferConcepts={categoryOps.transferConcepts}
            selectedConceptsForTransfer={categoryOps.selectedConceptsForTransfer}
            setSelectedConceptsForTransfer={categoryOps.setSelectedConceptsForTransfer}
            isMovingConcepts={categoryOps.isMovingConcepts}
            conceptsByCategory={conceptsByCategory}
            handleTransferConcepts={categoryOps.handleTransferConcepts}
            createPlaceholderConcept={categoryOps.createPlaceholderConcept}
            resetDialogState={categoryOps.resetDialogState}
            
            // Edit Category Dialog
            showEditCategoryDialog={categoryOps.showEditCategoryDialog}
            setShowEditCategoryDialog={categoryOps.setShowEditCategoryDialog}
            editingCategoryPath={categoryOps.editingCategoryPath}
            newCategoryName={categoryOps.newCategoryName}
            setNewCategoryName={categoryOps.setNewCategoryName}
            isRenamingCategory={categoryOps.isRenamingCategory}
            handleRenameCategoryConfirm={() => {}} // TODO: implement this
            
            // Drag Drop Dialog
            showDragDropDialog={categoryOps.showDragDropDialog}
            setShowDragDropDialog={categoryOps.setShowDragDropDialog}
            dragDropData={categoryOps.dragDropData}
            isDraggingCategory={false} // TODO: implement this state
            executeCategoryMove={executeCategoryMove}
            moveConceptsToCategory={moveConceptsToCategory}
          />
        )
        
        const endTime = performance.now()
        debug.logUserAction('CategoryDialogs render completed', { 
          renderTime: `${endTime - startTime}ms`
        })
        
        return result
      })()}
    </div>
  )
} 