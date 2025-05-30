import { useState, useReducer } from 'react'
import { useToast } from "@/hooks/use-toast"

interface Concept {
  id: string
  title: string
  summary?: string
  category: string
  isPlaceholder?: boolean
  needsReview?: boolean
}

interface UseCategoryOperationsProps {
  conceptsByCategory: Record<string, Concept[]>
  onDataRefresh?: () => Promise<void>
  onCategorySelect: (category: string | null) => void
  onConceptsMove?: (conceptIds: string[], newCategory: string) => void
}

// State interface for the reducer
interface CategoryOperationsState {
  // Dialog states
  showAddSubcategoryDialog: boolean
  showTransferDialog: boolean
  showEditCategoryDialog: boolean
  showDragDropDialog: boolean
  
  // Form states
  selectedParentCategory: string
  newSubcategoryName: string
  editingCategoryPath: string
  newCategoryName: string
  transferConcepts: Concept[]
  selectedConceptsForTransfer: Set<string>
  
  // Loading states
  isCreatingCategory: boolean
  isMovingConcepts: boolean
  isRenamingCategory: boolean
  isResettingState: boolean
  
  // Drag and drop state
  dragDropData: {
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null
}

// Action types for the reducer
type CategoryOperationsAction =
  | { type: 'SHOW_ADD_SUBCATEGORY_DIALOG'; payload: { parentCategory: string } }
  | { type: 'SHOW_TRANSFER_DIALOG'; payload: { concepts: Concept[] } }
  | { type: 'SHOW_EDIT_CATEGORY_DIALOG'; payload: { categoryPath: string; currentName: string } }
  | { type: 'SHOW_DRAG_DROP_DIALOG'; payload: { dragDropData: CategoryOperationsState['dragDropData'] } }
  | { type: 'SET_NEW_SUBCATEGORY_NAME'; payload: string }
  | { type: 'SET_NEW_CATEGORY_NAME'; payload: string }
  | { type: 'SET_SELECTED_CONCEPTS_FOR_TRANSFER'; payload: Set<string> }
  | { type: 'SET_DRAG_DROP_DATA'; payload: CategoryOperationsState['dragDropData'] }
  | { type: 'START_CREATING_CATEGORY' }
  | { type: 'FINISH_CREATING_CATEGORY' }
  | { type: 'START_MOVING_CONCEPTS' }
  | { type: 'FINISH_MOVING_CONCEPTS' }
  | { type: 'START_RENAMING_CATEGORY' }
  | { type: 'FINISH_RENAMING_CATEGORY' }
  | { type: 'START_RESETTING_STATE' }
  | { type: 'RESET_ALL_STATE' }
  | { type: 'CLOSE_ALL_DIALOGS' }

// Initial state
const initialState: CategoryOperationsState = {
  showAddSubcategoryDialog: false,
  showTransferDialog: false,
  showEditCategoryDialog: false,
  showDragDropDialog: false,
  selectedParentCategory: '',
  newSubcategoryName: '',
  editingCategoryPath: '',
  newCategoryName: '',
  transferConcepts: [],
  selectedConceptsForTransfer: new Set(),
  isCreatingCategory: false,
  isMovingConcepts: false,
  isRenamingCategory: false,
  isResettingState: false,
  dragDropData: null,
}

// Reducer function
function categoryOperationsReducer(
  state: CategoryOperationsState,
  action: CategoryOperationsAction
): CategoryOperationsState {
  switch (action.type) {
    case 'SHOW_ADD_SUBCATEGORY_DIALOG':
      return {
        ...state,
        showAddSubcategoryDialog: true,
        selectedParentCategory: action.payload.parentCategory,
        newSubcategoryName: '',
        // Close other dialogs
        showTransferDialog: false,
        showEditCategoryDialog: false,
        showDragDropDialog: false,
      }

    case 'SHOW_TRANSFER_DIALOG':
      return {
        ...state,
        showTransferDialog: true,
        transferConcepts: action.payload.concepts,
        selectedConceptsForTransfer: new Set(action.payload.concepts.map(c => c.id)),
        // Close other dialogs
        showAddSubcategoryDialog: false,
        showEditCategoryDialog: false,
        showDragDropDialog: false,
      }

    case 'SHOW_EDIT_CATEGORY_DIALOG':
      return {
        ...state,
        showEditCategoryDialog: true,
        editingCategoryPath: action.payload.categoryPath,
        newCategoryName: action.payload.currentName,
        // Close other dialogs
        showAddSubcategoryDialog: false,
        showTransferDialog: false,
        showDragDropDialog: false,
      }

    case 'SHOW_DRAG_DROP_DIALOG':
      return {
        ...state,
        showDragDropDialog: true,
        dragDropData: action.payload.dragDropData,
        // Close other dialogs
        showAddSubcategoryDialog: false,
        showTransferDialog: false,
        showEditCategoryDialog: false,
      }

    case 'SET_NEW_SUBCATEGORY_NAME':
      return {
        ...state,
        newSubcategoryName: action.payload,
      }

    case 'SET_NEW_CATEGORY_NAME':
      return {
        ...state,
        newCategoryName: action.payload,
      }

    case 'SET_SELECTED_CONCEPTS_FOR_TRANSFER':
      return {
        ...state,
        selectedConceptsForTransfer: action.payload,
      }

    case 'SET_DRAG_DROP_DATA':
      return {
        ...state,
        dragDropData: action.payload,
      }

    case 'START_CREATING_CATEGORY':
      return {
        ...state,
        isCreatingCategory: true,
      }

    case 'FINISH_CREATING_CATEGORY':
      return {
        ...state,
        isCreatingCategory: false,
      }

    case 'START_MOVING_CONCEPTS':
      return {
        ...state,
        isMovingConcepts: true,
      }

    case 'FINISH_MOVING_CONCEPTS':
      return {
        ...state,
        isMovingConcepts: false,
      }

    case 'START_RENAMING_CATEGORY':
      return {
        ...state,
        isRenamingCategory: true,
      }

    case 'FINISH_RENAMING_CATEGORY':
      return {
        ...state,
        isRenamingCategory: false,
      }

    case 'START_RESETTING_STATE':
      return {
        ...state,
        isResettingState: true,
      }

    case 'CLOSE_ALL_DIALOGS':
      return {
        ...state,
        showAddSubcategoryDialog: false,
        showTransferDialog: false,
        showEditCategoryDialog: false,
        showDragDropDialog: false,
      }

    case 'RESET_ALL_STATE':
      return {
        ...initialState,
      }

    default:
      return state
  }
}

export const useCategoryOperations = ({
  conceptsByCategory,
  onDataRefresh,
  onCategorySelect,
  onConceptsMove
}: UseCategoryOperationsProps) => {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(categoryOperationsReducer, initialState)

  // Improved dialog lifecycle management with batched state updates
  const resetDialogState = async () => {
    console.log('🔵 Starting dialog state reset with loading indicator')
    
    dispatch({ type: 'START_RESETTING_STATE' })
    
    // Small delay to ensure UI shows loading state
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Close all dialogs first
    dispatch({ type: 'CLOSE_ALL_DIALOGS' })
    
    // Small delay between UI updates
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Reset all state atomically
    dispatch({ type: 'RESET_ALL_STATE' })
    
    console.log('🔵 Dialog state reset complete')
  }

  // Enhanced cancel handler with proper sequencing
  const handleCancel = async () => {
    console.log('🔵 Canceling operation - enhanced single state update')
    
    try {
      // First, show that we're processing the cancel
      dispatch({ type: 'START_RESETTING_STATE' })
      
      // Wait for current operations to complete
      if (state.isCreatingCategory || state.isMovingConcepts || state.isRenamingCategory) {
        console.log('🔵 Waiting for current operation to complete before cancel')
        // Give operations time to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Batch all dialog closes
      dispatch({ type: 'CLOSE_ALL_DIALOGS' })
      
      // Small delay to ensure UI updates are processed
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Complete reset
      dispatch({ type: 'RESET_ALL_STATE' })
      
    } catch (error) {
      console.error('Error during cancel operation:', error)
      // Force reset as fallback
      dispatch({ type: 'RESET_ALL_STATE' })
    }
  }

  // Enhanced category creation with separated data and UI operations
  const handleCreateSubcategory = async () => {
    if (state.isCreatingCategory || state.isMovingConcepts || state.isResettingState) return
    
    if (!state.newSubcategoryName || !state.newSubcategoryName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    const trimmedName = state.newSubcategoryName.trim()
    const newCategoryPath = state.selectedParentCategory 
      ? `${state.selectedParentCategory} > ${trimmedName}`
      : trimmedName
    
    try {
      // Step 1: Start loading state
      dispatch({ type: 'START_CREATING_CATEGORY' })
      
      // Step 2: Check if category already exists (data operation)
      if (conceptsByCategory[newCategoryPath]) {
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        dispatch({ type: 'FINISH_CREATING_CATEGORY' })
        return
      }
      
      // Step 3: Handle parent concepts transfer if needed (data operation)
      if (state.selectedParentCategory) {
        const parentConcepts = conceptsByCategory[state.selectedParentCategory] || []
        if (parentConcepts.length > 0) {
          // Show transfer dialog instead of creating immediately
          dispatch({ type: 'SHOW_TRANSFER_DIALOG', payload: { concepts: parentConcepts } })
          dispatch({ type: 'FINISH_CREATING_CATEGORY' })
          return
        }
      }
      
      // Step 4: Create category (data operation)
      await createPlaceholderConcept(newCategoryPath)
      
      // Step 5: Wait for data operation to complete before UI updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Step 6: Refresh data (data operation)
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      // Step 7: UI updates after data operations are complete
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Step 8: Select new category (UI operation)
      onCategorySelect(newCategoryPath)
      
      // Step 9: Show success message
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 2000,
      })
      
      // Step 10: Reset dialog state
      await resetDialogState()
      
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'FINISH_CREATING_CATEGORY' })
    }
  }

  // Enhanced concept transfer with separated data and UI operations
  const handleTransferConcepts = async (conceptsToMove: Concept[], targetCategory: string) => {
    if (state.isMovingConcepts || conceptsToMove.length === 0 || state.isResettingState) return
    
    try {
      // Step 1: Start loading state
      dispatch({ type: 'START_MOVING_CONCEPTS' })
      
      // Step 2: Data operation - move concepts
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        await onConceptsMove(conceptIds, targetCategory)
        
        // Step 3: Wait for move operation to complete
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Step 4: Refresh data (data operation)
        if (onDataRefresh) {
          await onDataRefresh()
        }
        
        // Step 5: UI updates after data operations are complete
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // Step 6: Select target category (UI operation)
        onCategorySelect(targetCategory)
        
        // Step 7: Show success message
        toast({
          title: "Concepts Moved",
          description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
          duration: 2000,
        })
        
        // Step 8: Reset dialog state
        await resetDialogState()
      }
      
    } catch (error: any) {
      console.error('Error moving concepts:', error)
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'FINISH_MOVING_CONCEPTS' })
    }
  }

  // Utility function for creating placeholder concepts
  const createPlaceholderConcept = async (category: string) => {
    const response = await fetch('/api/concepts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${category} Placeholder`,
        summary: `This is a placeholder concept for the ${category} category.`,
        category: category,
        isPlaceholder: true,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create placeholder concept')
    }
    
    return response.json()
  }

  return {
    // State values
    ...state,
    
    // Action dispatchers for showing dialogs
    openAddSubcategoryDialog: (parentCategory: string) => 
      dispatch({ type: 'SHOW_ADD_SUBCATEGORY_DIALOG', payload: { parentCategory } }),
    
    openTransferDialog: (concepts: Concept[]) => 
      dispatch({ type: 'SHOW_TRANSFER_DIALOG', payload: { concepts } }),
    
    openEditCategoryDialog: (categoryPath: string, currentName: string) => 
      dispatch({ type: 'SHOW_EDIT_CATEGORY_DIALOG', payload: { categoryPath, currentName } }),
    
    openDragDropDialog: (dragDropData: CategoryOperationsState['dragDropData']) => 
      dispatch({ type: 'SHOW_DRAG_DROP_DIALOG', payload: { dragDropData } }),
    
    // Setter functions for form data
    setNewSubcategoryName: (name: string) => 
      dispatch({ type: 'SET_NEW_SUBCATEGORY_NAME', payload: name }),
    
    setNewCategoryName: (name: string) => 
      dispatch({ type: 'SET_NEW_CATEGORY_NAME', payload: name }),
    
    setSelectedConceptsForTransfer: (concepts: Set<string>) => 
      dispatch({ type: 'SET_SELECTED_CONCEPTS_FOR_TRANSFER', payload: concepts }),
    
    setDragDropData: (data: CategoryOperationsState['dragDropData']) => 
      dispatch({ type: 'SET_DRAG_DROP_DATA', payload: data }),
    
    // Enhanced handlers
    handleCreateSubcategory,
    handleTransferConcepts,
    resetDialogState,
    handleCancel,
    createPlaceholderConcept,
    
    // Backward compatibility setters
    setShowAddSubcategoryDialog: (show: boolean) => {
      if (!show) dispatch({ type: 'CLOSE_ALL_DIALOGS' })
    },
    setShowTransferDialog: (show: boolean) => {
      if (!show) dispatch({ type: 'CLOSE_ALL_DIALOGS' })
    },
    setShowEditCategoryDialog: (show: boolean) => {
      if (!show) dispatch({ type: 'CLOSE_ALL_DIALOGS' })
    },
    setShowDragDropDialog: (show: boolean) => {
      if (!show) dispatch({ type: 'CLOSE_ALL_DIALOGS' })
    },
    setSelectedParentCategory: (category: string) => {
      // This will be handled by the show dialog actions
    },
    setTransferConcepts: (concepts: Concept[]) => {
      // This will be handled by the show transfer dialog action
    },
  }
} 