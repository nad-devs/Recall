import { useState, useCallback, useRef } from 'react'
import { useToast } from "@/hooks/use-toast"
import { makeAuthenticatedRequest } from '@/lib/auth-utils'
import { useDebugLogger, loggedFetch } from '@/utils/debug-logger'

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
  const debug = useDebugLogger('useCategoryOperations')
  
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
  const isResettingRef = useRef(false) // Add guard to prevent infinite resets

  // Enhanced state setters with debug logging
  const setIsCreatingCategoryWithLogging = useCallback((value: boolean) => {
    debug.logStateChange('isCreatingCategory', isCreatingCategory, value)
    setIsCreatingCategory(value)
  }, [debug, isCreatingCategory])

  const setIsMovingConceptsWithLogging = useCallback((value: boolean) => {
    debug.logStateChange('isMovingConcepts', isMovingConcepts, value)
    setIsMovingConcepts(value)
  }, [debug, isMovingConcepts])

  const setShowAddSubcategoryDialogWithLogging = useCallback((value: boolean) => {
    debug.logStateChange('showAddSubcategoryDialog', showAddSubcategoryDialog, value)
    debug.logUserAction('Dialog state change', { dialog: 'AddSubcategory', show: value })
    setShowAddSubcategoryDialog(value)
  }, [debug, showAddSubcategoryDialog])
  
  // Enhanced API call wrapper with abort support and debug logging
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const operationId = `api-call-${url}-${Date.now()}`
    debug.startOperation(operationId)
    debug.logUserAction('API call started', { url, method: options.method })
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const defaultOptions: RequestInit = {
        signal: abortController.signal,
        ...options
      }
      
      // Use the logged fetch wrapper when available, fall back to makeAuthenticatedRequest
      let response
      if (options.headers || defaultOptions.headers) {
        // If we have custom headers, use makeAuthenticatedRequest 
        response = await makeAuthenticatedRequest(url, defaultOptions)
      } else {
        // Otherwise use the logged fetch wrapper
        response = await loggedFetch(url, defaultOptions)
      }
      
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
      debug.completeOperation(operationId)
      debug.logUserAction('API call completed', { url, method: options.method })
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') {
        debug.logUserAction('API call aborted', { url, method: options.method })
        throw new Error('Operation was cancelled')
      }
      debug.failOperation(operationId, error)
      debug.logError('API call failed', { url, method: options.method, error: error.message })
      throw error
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [debug])

  // Reset all dialog states - REMOVE DEPENDENCIES to prevent infinite loops
  const resetDialogState = useCallback(() => {
    // Prevent multiple simultaneous resets
    if (isResettingRef.current) {
      debug.logUserAction('Reset already in progress, skipping')
      return
    }
    
    isResettingRef.current = true
    
    const operationId = 'reset-dialog-state'
    debug.startOperation(operationId)
    debug.logUserAction('Resetting dialog state')
    
    // Cancel any pending operations first
    if (abortControllerRef.current) {
      debug.logUserAction('Aborting pending API call')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    try {
      // Reset dialog states
      debug.logUserAction('Closing all dialogs')
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
      
      // Reset form data
      debug.logUserAction('Clearing form data')
      setSelectedParentCategory('')
      setNewSubcategoryName('')
      setEditingCategoryPath('')
      setNewCategoryName('')
      setTransferConcepts([])
      setSelectedConceptsForTransfer(new Set())
      setDragDropData(null)
      
      // Reset loading states
      debug.logUserAction('Resetting loading states')
      setIsCreatingCategory(false)
      setIsMovingConcepts(false)
      setIsRenamingCategory(false)
      setOperationStarting(false)
      
      debug.completeOperation(operationId)
      debug.logUserAction('Dialog state reset completed')
      
    } catch (error) {
      debug.failOperation(operationId, error)
      debug.logError('Error resetting dialog state', error)
      // Fallback: Force reset the critical states
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
    } finally {
      // Always clear the reset flag
      isResettingRef.current = false
    }
  }, [debug]) // ONLY depend on debug

  // Create placeholder concept - SIMPLIFIED to prevent race conditions
  const createPlaceholderConcept = useCallback(async (category: string) => {
    const operationId = 'create-placeholder-concept'
    debug.startOperation(operationId)
    debug.logUserAction('Creating placeholder concept', { category })
    
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
      
      debug.logUserAction('Creating placeholder concept for category', { category })
      
      const response = await makeApiCall('/api/concepts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      debug.completeOperation(operationId)
      debug.logUserAction('Placeholder concept created successfully', { category })
      
      // Let the calling function handle the refresh
      return response
    } catch (error: any) {
      debug.failOperation(operationId, error)
      debug.logError('Error creating placeholder concept', { category, error: error.message })
      throw new Error('Failed to create category. Please try again.')
    }
  }, [makeApiCall, debug])

  // Handle category creation - COMPLETELY REWRITTEN to fix freezing issues
  const handleCreateSubcategory = useCallback(async () => {
    const operationId = 'create-subcategory'
    debug.startOperation(operationId)
    debug.logUserAction('Starting subcategory creation', { 
      selectedParentCategory, 
      newSubcategoryName, 
      isCreatingCategory, 
      isMovingConcepts 
    })
    
    if (isCreatingCategory || isMovingConcepts) {
      debug.logUserAction('Blocked subcategory creation - operation in progress', { isCreatingCategory, isMovingConcepts })
      return
    }
    
    if (!newSubcategoryName || !newSubcategoryName.trim()) {
      debug.logUserAction('Blocked subcategory creation - invalid name', { newSubcategoryName })
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      debug.failOperation(operationId, 'Invalid name')
      return
    }
    
    const trimmedName = newSubcategoryName.trim()
    let newCategoryPath = ''
    
    try {
      debug.logStateChange('isCreatingCategory', isCreatingCategory, true)
      setIsCreatingCategory(true)
      
      newCategoryPath = selectedParentCategory 
        ? `${selectedParentCategory} > ${trimmedName}`
        : trimmedName
      
      debug.logUserAction('Checking category existence', { newCategoryPath })
      
      if (conceptsByCategory[newCategoryPath]) {
        debug.logUserAction('Category already exists', { newCategoryPath })
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        debug.failOperation(operationId, 'Category exists')
        return
      }
      
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          debug.logUserAction('Parent has concepts - showing transfer dialog', { 
            parentCategory: selectedParentCategory, 
            conceptCount: parentConcepts.length 
          })
          // Show transfer dialog for existing concepts
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false)
          setIsCreatingCategory(false)
          debug.completeOperation(operationId)
          return
        }
      }
      
      debug.logUserAction('Creating category with placeholder concept', { newCategoryPath })
      
      // Create the category and wait for completion
      await createPlaceholderConcept(newCategoryPath)
      
      debug.logUserAction('Refreshing data after category creation', { newCategoryPath })
      
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
      
      debug.completeOperation(operationId)
      debug.logUserAction('Subcategory creation completed successfully', { newCategoryPath })
      
    } catch (error: any) {
      debug.failOperation(operationId, error)
      debug.logError('Error creating category', { newCategoryPath: newCategoryPath || 'unknown', error: error.message })
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      // Always reset state in finally block
      debug.logUserAction('Cleaning up after subcategory creation')
      debug.logStateChange('isCreatingCategory', isCreatingCategory, false)
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
  }, [isCreatingCategory, isMovingConcepts, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, onDataRefresh, debug])

  // Handle concept transfer - COMPLETELY REWRITTEN to fix freezing issues
  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    const operationId = 'transfer-concepts'
    debug.startOperation(operationId)
    debug.logUserAction('Starting concept transfer', { 
      conceptCount: conceptsToMove.length, 
      targetCategory, 
      isMovingConcepts 
    })
    
    if (isMovingConcepts || conceptsToMove.length === 0) {
      debug.logUserAction('Blocked concept transfer', { isMovingConcepts, conceptCount: conceptsToMove.length })
      return
    }
    
    try {
      debug.logStateChange('isMovingConcepts', isMovingConcepts, true)
      setIsMovingConcepts(true)
      
      debug.logUserAction('Moving concepts to category', { conceptCount: conceptsToMove.length, targetCategory })
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        
        debug.logUserAction('Executing concept move', { conceptIds, targetCategory })
        
        // Execute move and wait for completion
        await onConceptsMove(conceptIds, targetCategory)
        
        debug.logUserAction('Refreshing data after concept move', { targetCategory })
        
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
        
        debug.completeOperation(operationId)
        debug.logUserAction('Concept transfer completed successfully', { conceptCount: conceptsToMove.length, targetCategory })
      }
      
    } catch (error: any) {
      debug.failOperation(operationId, error)
      debug.logError('Error moving concepts', { conceptCount: conceptsToMove.length, targetCategory, error: error.message })
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      // Always reset state in finally block
      debug.logUserAction('Cleaning up after concept transfer')
      debug.logStateChange('isMovingConcepts', isMovingConcepts, false)
      setIsMovingConcepts(false)
      
      // Call resetDialogState directly (it has a guard to prevent conflicts)
      debug.logUserAction('Calling resetDialogState after concept transfer cleanup')
      resetDialogState()
    }
  }, [isMovingConcepts, toast, onConceptsMove, onDataRefresh, onCategorySelect, debug, resetDialogState])

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
    setShowAddSubcategoryDialog: setShowAddSubcategoryDialogWithLogging,
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