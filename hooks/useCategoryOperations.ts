import { useState } from 'react'
import { useToast } from "@/hooks/use-toast"

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
  
  // Simple dialog states - no complex tracking
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showDragDropDialog, setShowDragDropDialog] = useState(false)
  
  // Simple form states
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [editingCategoryPath, setEditingCategoryPath] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [transferConcepts, setTransferConcepts] = useState<Concept[]>([])
  const [selectedConceptsForTransfer, setSelectedConceptsForTransfer] = useState<Set<string>>(new Set())
  
  // Simple loading states
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isMovingConcepts, setIsMovingConcepts] = useState(false)
  const [isRenamingCategory, setIsRenamingCategory] = useState(false)
  
  // Drag and drop state
  const [dragDropData, setDragDropData] = useState<{
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null>(null)

  // Simple reset function - no complex dependencies
  const resetDialogState = () => {
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
    setIsCreatingCategory(false)
    setIsMovingConcepts(false)
    setIsRenamingCategory(false)
  }

  // Simple API helper
  const makeApiCall = async (url: string, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    // Add auth headers if available
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  }

  // Simple placeholder creation
  const createPlaceholderConcept = async (category: string) => {
    const requestBody = {
      title: `📌 Add Concepts Here`,
      category: category,
      summary: 'This is a placeholder concept created to organize your knowledge. You can delete this once you have real concepts in this category.',
      details: 'Click "Add Concept" or move concepts from other categories to get started. This placeholder will disappear once you have real content.',
      notes: '',
      isPlaceholder: true,
      isManualCreation: true
    }
    
    return await makeApiCall('/api/concepts', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
  }

  // Simple category creation
  const handleCreateSubcategory = async () => {
    if (isCreatingCategory || isMovingConcepts) return
    
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
    const newCategoryPath = selectedParentCategory 
      ? `${selectedParentCategory} > ${trimmedName}`
      : trimmedName
    
    try {
      setIsCreatingCategory(true)
      
      // Check if category already exists
      if (conceptsByCategory[newCategoryPath]) {
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }
      
      // If parent has concepts, show transfer dialog
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        if (parentConcepts.length > 0) {
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false)
          setIsCreatingCategory(false)
          return
        }
      }
      
      // Create category with placeholder
      await createPlaceholderConcept(newCategoryPath)
      
      // Refresh data
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      // Select new category
      onCategorySelect(newCategoryPath)
      
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 2000,
      })
      
      resetDialogState()
      
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Simple concept transfer
  const handleTransferConcepts = async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts || conceptsToMove.length === 0) return
    
    try {
      setIsMovingConcepts(true)
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        await onConceptsMove(conceptIds, targetCategory)
        
        // Refresh data
        if (onDataRefresh) {
          await onDataRefresh()
        }
        
        // Select target category
        onCategorySelect(targetCategory)
        
        toast({
          title: "Concepts Moved",
          description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
          duration: 2000,
        })
        
        resetDialogState()
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
      setIsMovingConcepts(false)
    }
  }

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