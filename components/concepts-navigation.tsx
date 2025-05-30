import React, { useState, useCallback, useMemo, useEffect, lazy } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Filter, 
  BookOpen, 
  AlertTriangle, 
  FolderPlus 
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useDrop } from 'react-dnd'
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy'
import { useCategoryOperations } from '@/hooks/useCategoryOperations'
import { useCategoryOperationsRedux } from '@/hooks/useCategoryOperationsRedux'
import { CategoryNodeComponent } from './concepts-navigation/CategoryNode'
import { CategoryDialogs } from './concepts-navigation/CategoryDialogs'
import { PerformanceMonitor } from './concepts-navigation/LoadingOverlay'
import { useLoading } from '@/contexts/LoadingContext'

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

export const ConceptsNavigation = React.memo(function ConceptsNavigationComponent({ 
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
  
  // ADD: Redux test toggle - set to true to test Redux!
  const USE_REDUX = process.env.NODE_ENV === 'production' && 
    typeof window !== 'undefined' && 
    window.location.search.includes('redux=true')
  
  // 🚀 PURE REDUX MODE - No React state management when Redux is active
  if (USE_REDUX) {
    console.log('🚀 PURE REDUX MODE ACTIVATED - No React state management')
    
    // Import the Redux navigation component
    const ConceptsNavigationRedux = lazy(() => 
      import('./concepts-navigation-redux').then(module => ({ default: module.ConceptsNavigationRedux }))
    )
    
    return (
      <React.Suspense fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">Loading Redux Navigation...</div>
          </div>
        </div>
      }>
        <ConceptsNavigationRedux
          concepts={concepts}
          conceptsByCategory={conceptsByCategory}
          sortedCategories={sortedCategories}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onCategorySelect={onCategorySelect}
          selectedCategory={selectedCategory}
          showNeedsReview={showNeedsReview}
          onNeedsReviewToggle={onNeedsReviewToggle}
          onConceptsMove={onConceptsMove}
          onDataRefresh={onDataRefresh}
          className={className}
        />
      </React.Suspense>
    )
  }
  
  // 🟢 LEGACY REACT MODE - All original React state management
  console.log('🟢 LEGACY REACT MODE - Using original React state management')
  
  // Original loading system for React mode
  const { isLoading, startLoading, stopLoading } = useLoading()
  
  // Original category operations for React mode
  const categoryOps = useCategoryOperations({
    conceptsByCategory,
    onDataRefresh,
    onCategorySelect,
    onConceptsMove
  })

  // React state management for legacy mode
  const categoryHierarchy = useCategoryHierarchy(conceptsByCategory)

  // Simple state management
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Backend Engineering', 'Data Structures', 'Computer Science'])
  )
  const [isDraggingAny, setIsDraggingAny] = useState(false)
  const [expandedBeforeDrag, setExpandedBeforeDrag] = useState<Set<string>>(new Set())
  const [inlineEditingCategory, setInlineEditingCategory] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState('')

  // Calculate stats
  const stats = useMemo(() => {
    const totalConcepts = concepts.length
    const needsReviewCount = concepts.filter(c => c.needsReview).length
    return { totalConcepts, needsReviewCount }
  }, [concepts])

  // IMPROVED: Enhanced search functionality
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

  // Simple drag handlers
  const handleDragStart = useCallback(() => {
    setIsDraggingAny(true)
    setExpandedBeforeDrag(new Set(expandedCategories))
    
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

  // IMPROVED: Enhanced inline editing with proper API calls
  const startInlineEdit = useCallback((categoryPath: string) => {
    const categoryName = categoryPath.includes(' > ') 
      ? categoryPath.split(' > ').pop() || '' 
      : categoryPath
    setInlineEditingCategory(categoryPath)
    setInlineEditValue(categoryName)
  }, [])

  const cancelInlineEdit = useCallback(() => {
    setInlineEditingCategory(null)
    setInlineEditValue('')
  }, [])

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

  // IMPROVED: Enhanced subcategory creation
  const handleAddSubcategory = useCallback((parentCategory: string) => {
    if (categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isResettingState) {
      toast({
        title: "Operation in Progress",
        description: "Please wait for the current operation to complete.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    categoryOps.openAddSubcategoryDialog(parentCategory)
  }, [categoryOps, toast])

  const handleAddTopLevelCategory = useCallback(() => {
    if (categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isResettingState) {
      toast({
        title: "Operation in Progress", 
        description: "Please wait for the current operation to complete.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    categoryOps.openAddSubcategoryDialog('')
  }, [categoryOps, toast])

  // IMPROVED: Enhanced category drop handling
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
    
    categoryOps.openDragDropDialog({
      draggedCategoryPath,
      targetCategoryPath,
      targetCategoryName: targetName
    })
  }, [toast, categoryOps])

  // IMPROVED: Enhanced category move execution
  const executeCategoryMove = useCallback(async (draggedCategoryPath: string, targetCategoryPath: string | null) => {
    // Start a loading operation
    const stopLoadingFn = startLoading('move-category', `Moving ${draggedCategoryPath} to ${targetCategoryPath || 'Root'}...`)
    
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
    } finally {
      // Always stop the loading operation
      stopLoadingFn()
    }
  }, [toast, onDataRefresh, startLoading, stopLoading])

  // IMPROVED: Enhanced concept move functionality with loading state
  const moveConceptsToCategory = useCallback(async (sourceCategoryPath: string, targetCategoryPath: string) => {
    // Start a loading operation
    const stopLoadingFn = startLoading('move-concepts', `Moving concepts from ${sourceCategoryPath} to ${targetCategoryPath}...`);
    
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
    } finally {
      // Always stop the loading operation
      stopLoadingFn()
    }
  }, [conceptsByCategory, toast, onConceptsMove, onDataRefresh, startLoading, stopLoading])

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

  // Use filtered hierarchy for rendering
  const filteredHierarchy = useMemo(() => {
    const filtered: Record<string, any> = {}
    
    Object.entries(categoryHierarchy).forEach(([key, node]) => {
      if (filteredConceptsByCategory[node.fullPath] || 
          Object.values(node.subcategories).some(subNode => 
            filteredConceptsByCategory[subNode.fullPath])) {
        filtered[key] = {
          ...node,
          conceptCount: filteredConceptsByCategory[node.fullPath]?.length || 0
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

    // Don't render if no concepts match the search
    if (!hasFilteredConcepts && !hasFilteredSubcategories) return null

    const nodeWithFilteredCount = {
      ...node,
      conceptCount: filteredConceptsByCategory[node.fullPath]?.length || 0
    }

    return (
      <React.Fragment key={node.fullPath}>
        <CategoryNodeComponent
          key={node.fullPath}
          node={nodeWithFilteredCount}
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
          onSetTransferConcepts={(concepts: Concept[]) => {
            categoryOps.openTransferDialog(concepts)
          }}
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
        {Object.keys(node.subcategories).length > 0 && expandedCategories.has(node.fullPath) && (
          <div>
            {Object.values(node.subcategories)
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((subNode: any) => renderCategoryNode(subNode, depth + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }, [
    filteredConceptsByCategory, expandedCategories, selectedCategory, inlineEditingCategory, 
    inlineEditValue, toggleCategory, onCategorySelect, handleAddSubcategory, startInlineEdit,
    saveInlineEdit, cancelInlineEdit, handleCategoryDrop, handleDragStart, handleDragEnd,
    isDraggingAny, categoryOps
  ])

  // Enhanced cancel handler with proper sequencing and global loading state
  const handleCancel = useCallback(async () => {
    if (USE_REDUX) {
      // Use Redux cancel (instant, no loading conflicts)
      console.log('🚀 Redux: Using instant cancel')
      categoryOps.handleCancel()
      return
    }
    
    // Original cancel logic for non-Redux mode
    const stopLoadingFn = startLoading('cancel-dialog-operation', 'Canceling operation...');
    
    try {
      await categoryOps.handleCancel()
      console.log('🟢 Dialog cancel completed successfully')
    } catch (error) {
      console.error('Error during cancel operation:', error)
      toast({
        title: "Reset Error",
        description: "There was an issue resetting the dialogs. Please refresh if problems persist.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      // Always stop the loading operation
      stopLoadingFn()
    }
  }, [USE_REDUX, categoryOps, toast, startLoading, stopLoading])

  // EMERGENCY: Force close all dialogs if normal cancel fails
  const emergencyClose = useCallback(() => {
    console.log('🚨 EMERGENCY CLOSE - Force closing all dialogs')
    
    // Force close everything immediately
    categoryOps.setShowAddSubcategoryDialog(false)
    categoryOps.setShowTransferDialog(false) 
    categoryOps.setShowEditCategoryDialog(false)
    categoryOps.setShowDragDropDialog(false)
    
    // Reset inline editing
    setInlineEditingCategory(null)
    setInlineEditValue('')
    
    // Clear all selection state
    onCategorySelect(null)
    
    toast({
      title: "Dialog Reset",
      description: "All dialogs have been force-closed.",
      duration: 2000,
    })
  }, [categoryOps, onCategorySelect, toast])

  // Listen for Escape key as emergency exit
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (e.ctrlKey || e.metaKey)) {
        console.log('🚨 Emergency escape key detected')
        emergencyClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [emergencyClose])

  // Determine loading message based on current operation
  const getLoadingMessage = () => {
    if (categoryOps.isCreatingCategory) return "Creating category..."
    if (categoryOps.isMovingConcepts) return "Moving concepts..."
    if (categoryOps.isRenamingCategory) return "Renaming category..."
    if (categoryOps.isResettingState) return "Resetting dialogs..."
    return "Processing operation..."
  }

  // Check if any operation is in progress for loading state check
  const isAnyOperationInProgress = categoryOps.isCreatingCategory || 
    categoryOps.isMovingConcepts || 
    categoryOps.isRenamingCategory || 
    categoryOps.isResettingState || 
    isLoading

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Performance Monitor for debugging - DISABLED when Redux is active */}
      {!USE_REDUX && isAnyOperationInProgress && (
        <PerformanceMonitor 
          operationName={getLoadingMessage()} 
          onComplete={(duration) => {
            if (duration > 1000) {
              console.warn(`⚠️ Slow operation detected: ${getLoadingMessage()} took ${duration.toFixed(2)}ms`)
            } else {
              console.log(`Operation completed in ${duration.toFixed(2)}ms`)
            }
          }}
        />
      )}

      {/* Redux Status Indicator */}
      {USE_REDUX && (categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory) && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 m-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 dark:text-green-300">
              {categoryOps.isCreatingCategory && "🚀 Redux: Creating category in background..."}
              {categoryOps.isMovingConcepts && "🚀 Redux: Moving concepts in background..."}
              {categoryOps.isRenamingCategory && "🚀 Redux: Renaming category in background..."}
            </span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✅ UI stays responsive! No blocking operations.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Navigate Concepts
          {USE_REDUX && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full animate-pulse">
              🚀 Redux Active
            </span>
          )}
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
        
        {searchQuery && (
          <div className="mt-2 text-xs text-muted-foreground">
            Found {Object.values(filteredConceptsByCategory).flat().length} concepts
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{stats.totalConcepts}</div>
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
              {stats.totalConcepts}
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
              {stats.needsReviewCount}
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
          {Object.values(filteredHierarchy).length > 0 ? (
            Object.values(filteredHierarchy)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(node => renderCategoryNode(node, 0))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FolderPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm mb-1">
                {searchQuery ? 'No categories match your search' : 'No categories yet'}
              </p>
              <p className="text-xs">
                {searchQuery ? 'Try a different search term' : 'Click the + button above to create your first category'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All Dialogs */}
      <CategoryDialogs
        // State values
        showAddSubcategoryDialog={categoryOps.showAddSubcategoryDialog}
        showTransferDialog={categoryOps.showTransferDialog}
        showEditCategoryDialog={categoryOps.showEditCategoryDialog}
        showDragDropDialog={categoryOps.showDragDropDialog}
        selectedParentCategory={categoryOps.selectedParentCategory}
        newSubcategoryName={categoryOps.newSubcategoryName}
        editingCategoryPath={categoryOps.editingCategoryPath}
        newCategoryName={categoryOps.newCategoryName}
        transferConcepts={categoryOps.transferConcepts}
        selectedConceptsForTransfer={USE_REDUX 
          ? (categoryOps.selectedConceptsForTransfer instanceof Array 
             ? new Set(categoryOps.selectedConceptsForTransfer)
             : categoryOps.selectedConceptsForTransfer)
          : categoryOps.selectedConceptsForTransfer}
        isCreatingCategory={categoryOps.isCreatingCategory}
        isMovingConcepts={categoryOps.isMovingConcepts}
        isRenamingCategory={categoryOps.isRenamingCategory}
        isResettingState={categoryOps.isResettingState}
        dragDropData={categoryOps.dragDropData}
        
        // Action dispatchers
        setNewSubcategoryName={categoryOps.setNewSubcategoryName}
        setNewCategoryName={categoryOps.setNewCategoryName}
        setSelectedConceptsForTransfer={categoryOps.setSelectedConceptsForTransfer}
        
        // Handlers
        handleCreateSubcategory={categoryOps.handleCreateSubcategory}
        handleTransferConcepts={categoryOps.handleTransferConcepts}
        handleCancel={handleCancel}
        createPlaceholderConcept={categoryOps.createPlaceholderConcept}
        
        // Data
        conceptsByCategory={conceptsByCategory}
        
        // Handlers with loading state for drag drop functionality
        isDraggingCategory={false}
        executeCategoryMove={executeCategoryMove}
        moveConceptsToCategory={moveConceptsToCategory}
        handleRenameCategoryConfirm={async () => {
          // Start a loading operation
          const stopLoadingFn = startLoading('rename-category', `Renaming category...`);
          
          try {
            // Access the current values from the categoryOps object
            const currentPath = categoryOps.editingCategoryPath;
            const newName = categoryOps.newCategoryName;
            
            console.log(`Renaming category ${currentPath} to ${newName}`);
            const pathParts = currentPath.split(' > ');
            
            const response = await fetch('/api/categories', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'rename',
                categoryPath: pathParts,
                newName: newName
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to rename category')
            }
            
            if (onDataRefresh) {
              await onDataRefresh();
            }
            
            toast({
              title: "Category Renamed",
              description: `Successfully renamed category to "${newName}".`,
              duration: 3000,
            });
            
            // Calculate the new path for selection
            if (pathParts.length > 1) {
              const parentPath = pathParts.slice(0, -1).join(' > ');
              const newPath = `${parentPath} > ${newName}`;
              onCategorySelect(newPath);
            } else {
              onCategorySelect(newName);
            }
          } catch (error) {
            console.error('Error renaming category:', error);
            toast({
              title: "Error",
              description: "Failed to rename category. Please try again.",
              variant: "destructive",
              duration: 3000,
            });
          } finally {
            stopLoadingFn();
          }
        }}
      />
    </div>
  )
}) 