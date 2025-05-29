import { useState, useCallback, useRef } from 'react'
import { useToast } from "@/hooks/use-toast"
import { flushSync } from 'react-dom'

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
  
  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
      }
    }
    
    return headers
  }

  // Enhanced API call wrapper with abort support
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const defaultOptions: RequestInit = {
        signal: abortController.signal,
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {})
        }
      }
      
      const response = await fetch(url, defaultOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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

  // Reset all dialog states - IMPROVED to prevent freezing
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
      
    } catch (error) {
      console.error('Error resetting dialog state:', error)
      // Fallback: Force reset the critical states
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
    }
  }, [])

  // Create placeholder concept
  const createPlaceholderConcept = useCallback(async (category: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const requestBody = {
        title: `[Category: ${category}]`,
        category: category,
        summary: 'This is a placeholder concept created to organize your knowledge. You can delete this once you have real concepts in this category.',
        notes: '',
        isPlaceholder: true
      }
      
      const data = await makeApiCall('/api/concepts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      return data
    } catch (error: any) {
      if (error.message === 'Operation was cancelled') {
        throw error
      }
      
      let errorMessage = 'Failed to create category. Please try again.'
      if (error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Operation timed out. Please try again.'
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.'
      }
      
      throw new Error(errorMessage)
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [makeApiCall, onDataRefresh])

  // Handle category creation
  const handleCreateSubcategory = useCallback(async () => {
    if (isCreatingCategory || isMovingConcepts || operationStarting) {
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
      setOperationStarting(true)
      await new Promise(resolve => setTimeout(resolve, 10))
      setIsCreatingCategory(true)
      setOperationStarting(false)
      
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
        return
      }
      
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false)
          return
        }
      }
      
      toast({
        title: "Creating Category",
        description: `Creating "${newCategoryPath}"...`,
        duration: 2000,
      })
      
      await createPlaceholderConcept(newCategoryPath)
      onCategorySelect(newCategoryPath)
      
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 3000,
      })
      
      resetDialogState()
      
    } catch (error) {
      console.error('Error in handleCreateSubcategory:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setOperationStarting(false)
      setIsCreatingCategory(false)
    }
  }, [isCreatingCategory, isMovingConcepts, operationStarting, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, resetDialogState])

  // Handle concept transfer - IMPROVED to prevent freezing
  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts || conceptsToMove.length === 0) {
      return
    }
    
    try {
      setIsMovingConcepts(true)
      
      toast({
        title: "Moving Concepts",
        description: `Moving ${conceptsToMove.length} concept(s) to "${targetCategory}"...`,
        duration: 2000,
      })
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        await onConceptsMove(conceptIds, targetCategory)
      }
      
      toast({
        title: "Concepts Moved",
        description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
        duration: 3000,
      })
      
      onCategorySelect(targetCategory)
      
      // Use timeout to prevent race conditions
      setTimeout(() => {
        resetDialogState()
      }, 100)
      
    } catch (error: any) {
      console.error('Error moving concepts:', error)
      
      let errorMessage = 'Failed to move concepts. Please try again.'
      if (error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Operation timed out. Please try again.'
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
      
      // Reset state even on error
      setTimeout(() => {
        resetDialogState()
      }, 100)
    } finally {
      setIsMovingConcepts(false)
    }
  }, [isMovingConcepts, toast, onConceptsMove, onCategorySelect, resetDialogState])

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