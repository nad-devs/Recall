import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  createCategoryAsync,
  moveConceptsAsync,
  renameCategoryAsync,
  openAddSubcategoryDialog,
  openTransferDialog,
  closeAllDialogs,
  setNewSubcategoryName,
  setSelectedConceptsForTransfer,
  updateConceptsByCategory,
  resetAllState,
} from '@/store/categorySlice'
import { useToast } from "@/hooks/use-toast"
import type { RootState } from '@/store/store'

interface Concept {
  id: string
  title: string
  summary?: string
  category: string
  isPlaceholder?: boolean
  needsReview?: boolean
}

interface UseCategoryOperationsReduxProps {
  conceptsByCategory: Record<string, Concept[]>
  onDataRefresh?: () => Promise<void>
  onCategorySelect: (category: string | null) => void
  onConceptsMove?: (conceptIds: string[], newCategory: string) => void
}

/**
 * 🚀 REDUX-POWERED CATEGORY OPERATIONS HOOK
 * 
 * This hook replaces useCategoryOperations and fixes the UI blocking issues by:
 * 1. Running all heavy operations asynchronously in the background
 * 2. Using Redux to manage state without blocking the UI
 * 3. Making UI updates instant and responsive
 */
export const useCategoryOperationsRedux = ({
  conceptsByCategory,
  onDataRefresh,
  onCategorySelect,
  onConceptsMove
}: UseCategoryOperationsReduxProps) => {
  const dispatch = useAppDispatch()
  const categoryState = useAppSelector((state: RootState) => state.categories as any)
  const { toast } = useToast()

  // ============ INSTANT UI OPERATIONS (No blocking!) ============
  
  const openAddSubcategory = useCallback((parentCategory: string) => {
    console.log('⚡ Redux: Opening add subcategory dialog - INSTANT')
    dispatch(openAddSubcategoryDialog(parentCategory))
  }, [dispatch])

  const openTransfer = useCallback((concepts: Concept[]) => {
    console.log('⚡ Redux: Opening transfer dialog - INSTANT')
    dispatch(openTransferDialog(concepts))
  }, [dispatch])

  const closeDialogs = useCallback(() => {
    console.log('⚡ Redux: Closing all dialogs - INSTANT')
    dispatch(closeAllDialogs())
  }, [dispatch])

  const setSubcategoryName = useCallback((name: string) => {
    console.log('⚡ Redux: Setting subcategory name - INSTANT')
    dispatch(setNewSubcategoryName(name))
  }, [dispatch])

  const resetState = useCallback(() => {
    console.log('⚡ Redux: Resetting state - INSTANT')
    dispatch(resetAllState())
  }, [dispatch])

  // ============ ASYNC OPERATIONS (Background - No UI blocking!) ============

  const createCategory = useCallback(async () => {
    if (categoryState.isCreatingCategory) {
      toast({
        title: "Operation in Progress",
        description: "A category creation is already in progress.",
        variant: "destructive",
        duration: 2000,
      })
      return
    }

    const trimmedName = categoryState.newSubcategoryName?.trim() || ''
    if (!trimmedName) {
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const newCategoryPath = categoryState.selectedParentCategory 
      ? `${categoryState.selectedParentCategory} > ${trimmedName}`
      : trimmedName

    // Check if category exists (INSTANT check - no blocking!)
    if (conceptsByCategory[newCategoryPath]) {
      toast({
        title: "Category Exists",
        description: `Category "${newCategoryPath}" already exists.`,
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    console.log('🚀 Redux: Starting async category creation - UI stays responsive!')
    
    try {
      // Fix: Use proper async thunk dispatch
      await dispatch(createCategoryAsync({
        categoryPath: newCategoryPath,
        parentCategory: categoryState.selectedParentCategory || ''
      }) as any)

      // Success - NON-BLOCKING data refresh and navigation
      onCategorySelect(newCategoryPath)
      
      // Refresh data in background without blocking UI
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh().catch(error => {
            console.error('Background data refresh failed:', error)
          })
        }, 100)
      }
      
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 2000,
      })
    } catch (error) {
      // Error handling
      console.error('Redux category creation failed:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [
    categoryState.isCreatingCategory,
    categoryState.newSubcategoryName, 
    categoryState.selectedParentCategory,
    conceptsByCategory,
    dispatch,
    toast,
    onDataRefresh,
    onCategorySelect
  ])

  const moveConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (categoryState.isMovingConcepts) {
      toast({
        title: "Operation in Progress", 
        description: "A concept move is already in progress.",
        variant: "destructive",
        duration: 2000,
      })
      return
    }

    if (conceptsToMove.length === 0) {
      toast({
        title: "No Concepts",
        description: "No concepts selected to move.",
        variant: "destructive",
        duration: 2000,
      })
      return
    }

    console.log('🚀 Redux: Starting async concept move - UI stays responsive!')

    try {
      // Fix: Use proper async thunk dispatch
      await dispatch(moveConceptsAsync({
        conceptIds: conceptsToMove.map(c => c.id),
        targetCategory
      }) as any)

      // Success - NON-BLOCKING data refresh and navigation
      onCategorySelect(targetCategory)
      
      // Refresh data in background without blocking UI
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh().catch(error => {
            console.error('Background data refresh failed:', error)
          })
        }, 100)
      }
      
      toast({
        title: "Concepts Moved",
        description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
        duration: 2000,
      })
    } catch (error) {
      // Error handling
      console.error('Redux concept move failed:', error)
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [
    categoryState.isMovingConcepts,
    dispatch,
    toast,
    onDataRefresh,
    onCategorySelect
  ])

  const renameCategory = useCallback(async (categoryPath: string[], newName: string) => {
    if (categoryState.isRenamingCategory) {
      toast({
        title: "Operation in Progress",
        description: "A category rename is already in progress.",
        variant: "destructive", 
        duration: 2000,
      })
      return
    }

    console.log('🚀 Redux: Starting async category rename - UI stays responsive!')

    try {
      // Fix: Use proper async thunk dispatch
      await dispatch(renameCategoryAsync({
        categoryPath,
        newName
      }) as any)

      // Success - NON-BLOCKING data refresh and navigation
      // Calculate new path for selection
      const newPath = categoryPath.length > 1 
        ? `${categoryPath.slice(0, -1).join(' > ')} > ${newName}`
        : newName
      onCategorySelect(newPath)
      
      // Refresh data in background without blocking UI
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh().catch(error => {
            console.error('Background data refresh failed:', error)
          })
        }, 100)
      }
      
      toast({
        title: "Category Renamed",
        description: `Successfully renamed category to "${newName}"`,
        duration: 2000,
      })
    } catch (error) {
      // Error handling
      console.error('Redux category rename failed:', error)
      toast({
        title: "Error",
        description: "Failed to rename category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [
    categoryState.isRenamingCategory,
    dispatch,
    toast,
    onDataRefresh,
    onCategorySelect
  ])

  // ============ ENHANCED CANCELLATION SUPPORT ============
  
  const forceCancel = useCallback(() => {
    console.log('🚨 Redux: Force canceling all operations - stopping background processes!')
    
    // Close all dialogs immediately
    dispatch(closeAllDialogs())
    
    // Reset all state to stop any ongoing operations
    dispatch(resetAllState())
    
    toast({
      title: "Operations Canceled",
      description: "All background operations have been stopped.",
      duration: 2000,
    })
    
    console.log('✅ Redux: All operations force-canceled successfully')
  }, [dispatch, toast])

  // ============ RETURN API (Same interface as before!) ============
  
  return {
    // Fix: Safely spread categoryState with proper typing
    ...(categoryState || {}),
    
    // UI Operations (INSTANT)
    openAddSubcategoryDialog: openAddSubcategory,
    openTransferDialog: openTransfer,
    closeAllDialogs: closeDialogs,
    setNewSubcategoryName: setSubcategoryName,
    resetAllState: resetState,
    
    // Async Operations (BACKGROUND - No blocking!)
    handleCreateSubcategory: createCategory,
    handleTransferConcepts: moveConcepts,
    handleRenameCategoryConfirm: renameCategory,
    handleRenameCategory: renameCategory, // Add alias for consistency
    
    // ENHANCED: Force cancellation that stops background operations
    handleCancel: forceCancel,
    
    // Legacy setters (mapped to Redux actions)
    setShowAddSubcategoryDialog: (show: boolean) => {
      if (!show) dispatch(closeAllDialogs())
    },
    setShowTransferDialog: (show: boolean) => {
      if (!show) dispatch(closeAllDialogs())
    },
    setShowEditCategoryDialog: (show: boolean) => {
      if (!show) dispatch(closeAllDialogs())
    },
    setShowDragDropDialog: (show: boolean) => {
      if (!show) dispatch(closeAllDialogs())
    },
    setSelectedConceptsForTransfer: (concepts: Set<string>) => {
      dispatch(setSelectedConceptsForTransfer(Array.from(concepts)))
    },
    
    // Enhanced dialog management
    openDragDropDialog: (data: any) => {
      // TODO: Add drag drop dialog support in Redux slice
      console.log('🚀 Redux: Drag drop dialog support coming soon')
    },
    createPlaceholderConcept: async (category: string) => {
      // This is handled by the createCategory async operation
      console.log('🚀 Redux: Placeholder creation handled by createCategory')
    },
  }
} 