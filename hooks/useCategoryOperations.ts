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

  // Reset all dialog states - SIMPLIFIED to prevent race conditions
  const resetDialogState = useCallback(() => {
    // Cancel any pending operations first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    try {
      // Reset dialog states
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

  // Create placeholder concept - SIMPLIFIED to prevent race conditions
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
      
      // Let the calling function handle the refresh
      return response
    } catch (error: any) {
      console.error('Error creating placeholder concept:', error)
      throw new Error('Failed to create category. Please try again.')
    }
  }, [makeApiCall])

  // Handle category creation - COMPLETELY REWRITTEN to fix freezing issues
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
        return
      }
      
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          // Show transfer dialog for existing concepts
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false)
          setIsCreatingCategory(false)
          return
        }
      }
      
      // Create the category and wait for completion
      await createPlaceholderConcept(newCategoryPath)
      
      // Refresh data to show the new category
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
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
    } finally {
      // Always reset state in finally block
      setIsCreatingCategory(false)
      // Close dialog and reset state
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
      setSelectedParentCategory('')
      setNewSubcategoryName('')
      setEditingCategoryPath('')
      setNewCategoryName('')
      setTransferConcepts([])
      setSelectedConceptsForTransfer(new Set())
      setDragDropData(null)
      setIsMovingConcepts(false)
      setIsRenamingCategory(false)
      setOperationStarting(false)
    }
  }, [isCreatingCategory, isMovingConcepts, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, onDataRefresh])

  // Handle concept transfer - COMPLETELY REWRITTEN to fix freezing issues
  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts || conceptsToMove.length === 0) {
      return
    }
    
    try {
      setIsMovingConcepts(true)
      
      console.log(`Moving ${conceptsToMove.length} concept(s) to "${targetCategory}"`)
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        
        // Execute move and wait for completion
        await onConceptsMove(conceptIds, targetCategory)
        
        // Single refresh after successful move
        if (onDataRefresh) {
          await onDataRefresh()
        }
        
        // Select the target category
        onCategorySelect(targetCategory)
        
        toast({
          title: "Concepts Moved",
          description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
          duration: 2000,
        })
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
      // Always reset state in finally block
      setIsMovingConcepts(false)
      // Close dialog and reset state (but don't trigger additional refresh)
      setShowTransferDialog(false)
      setShowAddSubcategoryDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
      setSelectedParentCategory('')
      setNewSubcategoryName('')
      setEditingCategoryPath('')
      setNewCategoryName('')
      setTransferConcepts([])
      setSelectedConceptsForTransfer(new Set())
      setDragDropData(null)
      setIsCreatingCategory(false)
      setIsRenamingCategory(false)
      setOperationStarting(false)
    }
  }, [isMovingConcepts, toast, onConceptsMove, onDataRefresh, onCategorySelect])

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