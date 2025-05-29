import { useState, useCallback, useRef } from 'react'
import { useToast } from "@/hooks/use-toast"
import { makeAuthenticatedRequest } from '@/lib/auth-utils'

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

interface UseCategoryOperationsProps {
  conceptsByCategory: Record<string, Concept[]>
  onDataRefresh?: () => Promise<void>
  onCategorySelect: (category: string | null) => void
  onConceptsMove?: (conceptIds: string[], newCategory: string) => void
}

export const useCategoryOperations = ({
  conceptsByCategory,
  onDataRefresh,
  onCategorySelect,
  onConceptsMove
}: UseCategoryOperationsProps) => {
  const { toast } = useToast()
  
  // Dialog states
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showDragDropDialog, setShowDragDropDialog] = useState(false)
  
  // Form states
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [editingCategoryPath, setEditingCategoryPath] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [transferConcepts, setTransferConcepts] = useState<Concept[]>([])
  const [selectedConceptsForTransfer, setSelectedConceptsForTransfer] = useState<Set<string>>(new Set())
  
  // Loading states
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isMovingConcepts, setIsMovingConcepts] = useState(false)
  const [isRenamingCategory, setIsRenamingCategory] = useState(false)
  const [operationStarting, setOperationStarting] = useState(false)
  
  // Drag and drop states
  const [dragDropData, setDragDropData] = useState<{
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Enhanced API call wrapper with abort support
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const defaultOptions: RequestInit = {
        signal: abortController.signal,
        ...options
      }
      
      const response = await makeAuthenticatedRequest(url, defaultOptions)
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Use the raw text if it's not JSON
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Operation was cancelled')
      }
      throw error
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [])

  // Reset all dialog states - IMPROVED to prevent freezing and refresh data
  const resetDialogState = useCallback(() => {
    // Cancel any pending operations first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    try {
      // Use a more gradual reset approach instead of flushSync
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
      
      // Reset form data
      setSelectedParentCategory('')
      setNewSubcategoryName('')
      setEditingCategoryPath('')
      setNewCategoryName('')
      setTransferConcepts([])
      setSelectedConceptsForTransfer(new Set())
      setDragDropData(null)
      
      // Reset loading states
      setIsCreatingCategory(false)
      setIsMovingConcepts(false)
      setIsRenamingCategory(false)
      setOperationStarting(false)
      
      // Apply same refresh logic as concept drag/drop operations
      setTimeout(async () => {
        try {
          if (onDataRefresh) {
            await onDataRefresh()
          }
        } catch (refreshError: any) {
          console.error('Non-critical refresh error:', refreshError)
          // Fallback: simple page reload if refresh fails
          window.location.reload()
        }
      }, 100) // Small delay to allow UI to update
      
    } catch (error) {
      console.error('Error resetting dialog state:', error)
      // Fallback: Force reset the critical states
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
    }
  }, [onDataRefresh])

  // Create placeholder concept - FIXED to prevent freezing
  const createPlaceholderConcept = useCallback(async (category: string) => {
    try {
      const requestBody = {
        title: `📌 Add Concepts Here`,
        category: category,
        summary: 'This is a placeholder concept created to organize your knowledge. You can delete this once you have real concepts in this category.',
        details: 'Click "Add Concept" or move concepts from other categories to get started. This placeholder will disappear once you have real content.',
        notes: '',
        isPlaceholder: true,
        isManualCreation: true
      }
      
      console.log('Creating placeholder concept for category:', category)
      
      const response = await makeApiCall('/api/concepts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      // Immediate soft refresh without waiting
      setTimeout(async () => {
        try {
          if (onDataRefresh) {
            await onDataRefresh()
          }
        } catch (refreshError) {
          console.error('Non-critical refresh error:', refreshError)
          // Fallback: simple page reload if refresh fails
          window.location.reload()
        }
      }, 0)
      
      return response
    } catch (error: any) {
      console.error('Error creating placeholder concept:', error)
      throw new Error('Failed to create category. Please try again.')
    }
  }, [makeApiCall, onDataRefresh])

  // Handle category creation - FIXED to prevent freezing
  const handleCreateSubcategory = useCallback(async () => {
    if (isCreatingCategory || isMovingConcepts) {
      return
    }
    
    if (!newSubcategoryName || !newSubcategoryName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    const trimmedName = newSubcategoryName.trim()
    
    try {
      // Set loading state but don't wait for animations
      setIsCreatingCategory(true)
      
      const newCategoryPath = selectedParentCategory 
        ? `${selectedParentCategory} > ${trimmedName}`
        : trimmedName
      
      if (conceptsByCategory[newCategoryPath]) {
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        setIsCreatingCategory(false)
        return
      }
      
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          // Immediately show transfer dialog without waiting
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false)
          setIsCreatingCategory(false)
          return
        }
      }
      
      // Create the category immediately and don't wait for responses
      setTimeout(async () => {
        try {
          await createPlaceholderConcept(newCategoryPath)
          
          // Select the new category after creation
          onCategorySelect(newCategoryPath)
          
          toast({
            title: "Category Created",
            description: `Successfully created "${newCategoryPath}"`,
            duration: 2000,
          })
        } catch (error: any) {
          console.error('Error creating category:', error)
          toast({
            title: "Error",
            description: "Failed to create category. Please try again.",
            variant: "destructive",
            duration: 3000,
          })
        }
      }, 0)
      
      // Don't wait - immediately reset to prevent freezing
      resetDialogState()
      
    } catch (error) {
      console.error('Error in handleCreateSubcategory:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      resetDialogState()
    }
  }, [isCreatingCategory, isMovingConcepts, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, resetDialogState])

  // Handle concept transfer - FIXED to prevent freezing
  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts || conceptsToMove.length === 0) {
      return
    }
    
    try {
      setIsMovingConcepts(true)
      
      console.log(`Moving ${conceptsToMove.length} concept(s) to "${targetCategory}"`)
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        
        // Execute move without waiting for completion
        setTimeout(async () => {
          try {
            await onConceptsMove(conceptIds, targetCategory)
            
            // Soft refresh after move
            setTimeout(async () => {
              try {
                if (onDataRefresh) {
                  await onDataRefresh()
                }
                onCategorySelect(targetCategory)
              } catch (refreshError: any) {
                console.error('Non-critical refresh error:', refreshError)
                // Fallback: simple page reload if refresh fails
                window.location.reload()
              }
            }, 100) // Small delay to allow UI to update
            
            toast({
              title: "Concepts Moved",
              description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
              duration: 2000,
            })
          } catch (error: any) {
            console.error('Error moving concepts:', error)
            toast({
              title: "Error",
              description: "Failed to move concepts. Please try again.",
              variant: "destructive",
              duration: 3000,
            })
          } finally {
            // Always reset state to prevent hanging
            setIsMovingConcepts(false)
          }
        }, 0)
      }
      
      // Reset dialog immediately to prevent freezing
      resetDialogState()
      
    } catch (error: any) {
      console.error('Error moving concepts:', error)
      
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      
      resetDialogState()
      setIsMovingConcepts(false)
    }
  }, [isMovingConcepts, toast, onConceptsMove, onDataRefresh, onCategorySelect, resetDialogState])

  return {
    // States
    showAddSubcategoryDialog,
    showTransferDialog,
    showEditCategoryDialog,
    showDragDropDialog,
    selectedParentCategory,
    newSubcategoryName,
    editingCategoryPath,
    newCategoryName,
    transferConcepts,
    selectedConceptsForTransfer,
    isCreatingCategory,
    isMovingConcepts,
    isRenamingCategory,
    dragDropData,
    
    // Setters
    setShowAddSubcategoryDialog,
    setShowTransferDialog,
    setShowEditCategoryDialog,
    setShowDragDropDialog,
    setSelectedParentCategory,
    setNewSubcategoryName,
    setEditingCategoryPath,
    setNewCategoryName,
    setTransferConcepts,
    setSelectedConceptsForTransfer,
    setDragDropData,
    
    // Handlers
    handleCreateSubcategory,
    handleTransferConcepts,
    resetDialogState,
    createPlaceholderConcept
  }
} 