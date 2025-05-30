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
  
  // Track hook renders to detect excessive re-renders
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  
  // Only log every 5th render to avoid spam
  if (renderCountRef.current % 5 === 1) {
    debug.logUserAction('useCategoryOperations hook render', { 
      renderCount: renderCountRef.current,
      conceptsByCategoryKeys: Object.keys(conceptsByCategory).length
    })
  }
  
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

  // Enhanced API call wrapper with abort support and debug logging
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const operationId = `api-call-${url}-${Date.now()}`
    debug.logAsyncStart('makeApiCall', operationId, { url, method: options.method })
    
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
      debug.logAsyncEnd('makeApiCall', operationId, { url, method: options.method })
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') {
        debug.logAsyncError('makeApiCall', operationId, { url, method: options.method, type: 'AbortError' })
        throw new Error('Operation was cancelled')
      }
      debug.logAsyncError('makeApiCall', operationId, { url, method: options.method, error: error.message })
      throw error
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [debug])

  // CRITICAL: Enhanced reset function with comprehensive debugging
  const resetDialogState = useCallback(() => {
    const resetId = `reset-${Date.now()}`
    debug.logAsyncStart('resetDialogState', resetId)
    debug.logStackTrace('resetDialogState called')
    
    // Prevent multiple simultaneous resets
    if (isResettingRef.current) {
      debug.logUserAction('Reset already in progress, skipping', { resetId })
      debug.logAsyncEnd('resetDialogState', resetId, { result: 'skipped' })
      return
    }
    
    isResettingRef.current = true
    
    try {
      debug.logUserAction('Starting dialog state reset', { resetId })
      
      // Cancel any pending operations first
      if (abortControllerRef.current) {
        debug.logUserAction('Aborting pending API call', { resetId })
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      // Reset dialog states with individual tracking
      debug.logUserAction('Closing all dialogs', { resetId })
      debug.trackDialogTransition('AddSubcategory', 'any', 'closed', 'reset')
      setShowAddSubcategoryDialog(false)
      
      debug.trackDialogTransition('Transfer', 'any', 'closed', 'reset')
      setShowTransferDialog(false)
      
      debug.trackDialogTransition('EditCategory', 'any', 'closed', 'reset')
      setShowEditCategoryDialog(false)
      
      debug.trackDialogTransition('DragDrop', 'any', 'closed', 'reset')
      setShowDragDropDialog(false)
      
      // Reset form data with individual tracking
      debug.logUserAction('Clearing form data', { resetId })
      debug.trackStateUpdate('useCategoryOperations', 'selectedParentCategory', '')
      setSelectedParentCategory('')
      
      debug.trackStateUpdate('useCategoryOperations', 'newSubcategoryName', '')
      setNewSubcategoryName('')
      
      debug.trackStateUpdate('useCategoryOperations', 'editingCategoryPath', '')
      setEditingCategoryPath('')
      
      debug.trackStateUpdate('useCategoryOperations', 'newCategoryName', '')
      setNewCategoryName('')
      
      debug.trackStateUpdate('useCategoryOperations', 'transferConcepts', [])
      setTransferConcepts([])
      
      debug.trackStateUpdate('useCategoryOperations', 'selectedConceptsForTransfer', new Set())
      setSelectedConceptsForTransfer(new Set())
      
      debug.trackStateUpdate('useCategoryOperations', 'dragDropData', null)
      setDragDropData(null)
      
      // Reset loading states with individual tracking
      debug.logUserAction('Resetting loading states', { resetId })
      debug.trackStateUpdate('useCategoryOperations', 'isCreatingCategory', false)
      setIsCreatingCategory(false)
      
      debug.trackStateUpdate('useCategoryOperations', 'isMovingConcepts', false)
      setIsMovingConcepts(false)
      
      debug.trackStateUpdate('useCategoryOperations', 'isRenamingCategory', false)
      setIsRenamingCategory(false)
      
      debug.trackStateUpdate('useCategoryOperations', 'operationStarting', false)
      setOperationStarting(false)
      
      debug.logUserAction('Dialog state reset completed successfully', { resetId })
      debug.logAsyncEnd('resetDialogState', resetId, { result: 'success' })
      
    } catch (error) {
      debug.logAsyncError('resetDialogState', resetId, error)
      debug.logError('Error resetting dialog state', error)
      
      // Fallback: Force reset the critical states
      debug.logUserAction('Executing fallback reset', { resetId })
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
    } finally {
      // Always clear the reset flag
      isResettingRef.current = false
      debug.logUserAction('Reset flag cleared', { resetId })
      
      // CRITICAL: Add data refresh after reset to ensure UI consistency
      setTimeout(async () => {
        debug.logAsyncStart('resetDialogState-refresh', `${resetId}-refresh`)
        try {
          debug.logUserAction('Executing post-reset data refresh', { resetId })
          
          if (onDataRefresh) {
            await onDataRefresh()
            debug.logUserAction('Post-reset data refresh completed', { resetId })
            debug.completeOperation(`${resetId}-refresh`)
            
            // CRITICAL: Monitor React rendering after state reset completion
            debug.logUserAction('Starting React render monitoring after reset', { resetId })
            
            // Schedule immediate render check
            setTimeout(() => {
              debug.logUserAction('CRITICAL: First post-reset render check - JavaScript executing', { resetId })
              console.log(`🔄 REACT RENDER CHECK 1: JavaScript continues after resetDialogState (${resetId})`)
              
              // Schedule React reconciliation check
              setTimeout(() => {
                debug.logUserAction('CRITICAL: React reconciliation check - JavaScript executing', { resetId })
                console.log(`🔄 REACT RENDER CHECK 2: React reconciliation phase (${resetId})`)
                
                // Schedule final render confirmation
                setTimeout(() => {
                  debug.logUserAction('CRITICAL: Final render confirmation - JavaScript executing', { resetId })
                  console.log(`🔄 REACT RENDER CHECK 3: Final render completion (${resetId})`)
                }, 100)
              }, 50)
            }, 0)
            
            // Add React Fiber monitoring
            const startTime = performance.now()
            setTimeout(() => {
              const renderTime = performance.now() - startTime
              if (renderTime > 100) {
                debug.logError('POTENTIAL REACT RENDER FREEZE DETECTED', { 
                  resetId, 
                  renderTime,
                  message: 'React render took >100ms after resetDialogState'
                })
                console.error(`🚨 REACT FREEZE: Render took ${renderTime}ms after resetDialogState (${resetId})`)
              } else {
                debug.logUserAction('React render completed normally', { resetId, renderTime })
                console.log(`✅ REACT OK: Render completed in ${renderTime}ms after resetDialogState (${resetId})`)
              }
            }, 200)
            
          }
          
          debug.logAsyncEnd('resetDialogState-refresh', `${resetId}-refresh`, { result: 'success' })
        } catch (refreshError: any) {
          debug.logAsyncError('resetDialogState-refresh', `${resetId}-refresh`, refreshError)
          debug.logError('Post-reset refresh error (non-critical)', refreshError)
          
          // If refresh fails, try a simple page reload as fallback
          debug.logUserAction('Fallback: reloading page due to refresh failure', { resetId })
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      }, 100) // Small delay to allow UI to update
    }
  }, []) // FIXED: Removed all dependencies that cause infinite loops

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
  }, []) // FIXED: Removed unstable dependencies

  // Handle category creation - REDUCE DEPENDENCIES to prevent infinite loops
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
      
      // Reset dialog state using setTimeout to avoid render loop
      setTimeout(() => {
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
      }, 0)
    }
  }, [isCreatingCategory, isMovingConcepts, newSubcategoryName, selectedParentCategory, conceptsByCategory]) // FIXED: Removed unstable dependencies

  // Handle concept transfer - FIX INFINITE LOOP by removing unstable dependencies
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
      
      // Call resetDialogState directly without depending on it in useCallback
      debug.logUserAction('Calling resetDialogState after concept transfer cleanup')
      // Use setTimeout to avoid calling resetDialogState during render
      setTimeout(() => {
        resetDialogState()
      }, 0)
    }
  }, [isMovingConcepts]) // FIXED: Removed all unstable dependencies

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