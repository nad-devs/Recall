import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, ArrowRight, AlertTriangle, Folder } from "lucide-react"

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

interface CategoryDialogsProps {
  // State values
  showAddSubcategoryDialog: boolean
  showTransferDialog: boolean
  showEditCategoryDialog: boolean
  showDragDropDialog: boolean
  selectedParentCategory: string
  newSubcategoryName: string
  editingCategoryPath: string
  newCategoryName: string
  transferConcepts: Concept[]
  selectedConceptsForTransfer: Set<string>
  isCreatingCategory: boolean
  isMovingConcepts: boolean
  isRenamingCategory: boolean
  isResettingState: boolean
  dragDropData: {
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null
  
  // Action dispatchers
  setNewSubcategoryName: (name: string) => void
  setNewCategoryName: (name: string) => void
  setSelectedConceptsForTransfer: (concepts: Set<string>) => void
  
  // Handlers
  handleCreateSubcategory: () => Promise<void>
  handleTransferConcepts: (concepts: Concept[], targetCategory: string) => Promise<void>
  handleCancel: () => Promise<void>
  createPlaceholderConcept: (category: string) => Promise<any>
  
  // Data
  conceptsByCategory: Record<string, Concept[]>
  
  // Legacy handlers (for drag drop functionality)
  isDraggingCategory: boolean
  executeCategoryMove: (draggedPath: string, targetPath: string | null) => Promise<void>
  moveConceptsToCategory: (sourcePath: string, targetPath: string) => Promise<void>
  handleRenameCategoryConfirm: () => void
}

export const CategoryDialogs = React.memo(function CategoryDialogs({
  // State values
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
  isResettingState,
  dragDropData,
  
  // Action dispatchers
  setNewSubcategoryName,
  setNewCategoryName,
  setSelectedConceptsForTransfer,
  
  // Handlers
  handleCreateSubcategory,
  handleTransferConcepts,
  handleCancel,
  createPlaceholderConcept,
  
  // Data
  conceptsByCategory,
  
  // Legacy handlers
  isDraggingCategory,
  executeCategoryMove,
  moveConceptsToCategory,
  handleRenameCategoryConfirm,
}: CategoryDialogsProps) {

  // Enhanced state for move concepts functionality
  const [targetCategory, setTargetCategory] = useState('')
  const [createNewCategory, setCreateNewCategory] = useState(false)

  console.log('🚀 CategoryDialogs: Redux-only mode - no loading context conflicts!')
  
  // REDUX-ONLY cancel handler - no loading system conflicts
  const handleDialogCancel = () => {
    console.log('🚀 Redux: Instant dialog cancel - no loading conflicts!')
    
    // Reset local state immediately
    setTargetCategory('')
    setCreateNewCategory(false)
    console.log('✅ Redux: Dialog state reset instantly')
    
    // Call Redux cancel immediately - no loading system interference
    handleCancel()
  }

  const isAnyOperationInProgress = isCreatingCategory || isMovingConcepts || isRenamingCategory || isResettingState

  // Redux-only create handler
  const handleCreate = async () => {
    console.log('🚀 Redux: Create category - background processing, UI stays responsive!')
    
    if (!newSubcategoryName.trim() || isAnyOperationInProgress) {
      return
    }

    try {
      await handleCreateSubcategory()
    } catch (error) {
      console.error('Redux: Error in create:', error)
    }
  }

  // Redux-only transfer handler
  const handleTransferToExisting = async () => {
    if (!targetCategory || transferConcepts.length === 0 || isAnyOperationInProgress) return
    
    console.log('🚀 Redux: Transfer to existing category - background processing!')
    
    try {
      await handleTransferConcepts(transferConcepts, targetCategory)
    } catch (error) {
      console.error('Redux: Error in transfer:', error)
    }
  }

  // Get available categories for transfer (excluding current category)
  const availableCategories = Object.keys(conceptsByCategory).filter(cat => 
    cat !== (transferConcepts[0]?.category || '') && 
    conceptsByCategory[cat].some(c => !c.isPlaceholder)
  ).sort()

  // Toggle select all/none
  const handleToggleAll = () => {
    const selectedCount = selectedConceptsForTransfer && typeof selectedConceptsForTransfer.size === 'number' 
      ? selectedConceptsForTransfer.size 
      : Array.isArray(selectedConceptsForTransfer) 
        ? selectedConceptsForTransfer.length 
        : 0
    
    if (selectedCount === transferConcepts.length) {
      setSelectedConceptsForTransfer(new Set())
    } else {
      setSelectedConceptsForTransfer(new Set(transferConcepts.map(c => c.id)))
    }
  }

  // Defensive function to check if concept is selected
  const isConceptSelected = (conceptId: string) => {
    if (selectedConceptsForTransfer && typeof selectedConceptsForTransfer.has === 'function') {
      return selectedConceptsForTransfer.has(conceptId)
    } else if (Array.isArray(selectedConceptsForTransfer)) {
      return selectedConceptsForTransfer.includes(conceptId)
    }
    return false
  }

  // Defensive function to get selected count
  const getSelectedCount = () => {
    if (selectedConceptsForTransfer && typeof selectedConceptsForTransfer.size === 'number') {
      return selectedConceptsForTransfer.size
    } else if (Array.isArray(selectedConceptsForTransfer)) {
      return selectedConceptsForTransfer.length
    }
    return 0
  }

  return (
    <>
      {/* ENHANCED: Add Subcategory Dialog */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={(open) => {
        if (!open) handleDialogCancel()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderPlus className="mr-2 h-5 w-5" />
              Create {selectedParentCategory ? 'Subcategory' : 'Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedParentCategory 
                ? `Create a new subcategory under "${selectedParentCategory}"`
                : 'Create a new top-level category'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="Enter category name..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                disabled={isCreatingCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubcategoryName.trim()) {
                    handleCreate()
                  }
                }}
              />
            </div>
            
            {selectedParentCategory && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                <strong>Full path:</strong> {selectedParentCategory} → {newSubcategoryName || '...'}
              </div>
            )}

            {/* Show concept transfer option if this is triggered from transfer dialog */}
            {transferConcepts.length > 0 && showTransferDialog && (
              <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center mb-2">
                  <ArrowRight className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Move Concepts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getSelectedCount()} concept(s) will be moved to this new category
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogCancel} disabled={isCreatingCategory}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newSubcategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? 'Creating...' : `Create ${transferConcepts.length > 0 ? '& Move' : 'Category'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ENHANCED: Transfer Concepts Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={(open) => {
        if (!open) handleDialogCancel()
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ArrowRight className="mr-2 h-5 w-5" />
              Move Concepts
            </DialogTitle>
            <DialogDescription>
              Choose where to move the selected concepts from "{transferConcepts[0]?.category || 'Unknown'}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Concept Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Select Concepts to Move</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-7 text-xs"
                >
                  {getSelectedCount() === transferConcepts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <div className="space-y-1 p-2">
                  {transferConcepts.map((concept) => (
                    <div key={concept.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                      <input
                        type="checkbox"
                        id={`concept-${concept.id}`}
                        checked={isConceptSelected(concept.id)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newSelected = new Set(selectedConceptsForTransfer)
                          if (e.target.checked) {
                            newSelected.add(concept.id)
                          } else {
                            newSelected.delete(concept.id)
                          }
                          setSelectedConceptsForTransfer(newSelected)
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`concept-${concept.id}`} className="text-sm font-medium cursor-pointer block truncate">
                          {concept.title}
                        </label>
                        {concept.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {concept.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {concept.needsReview && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                            Review
                          </Badge>
                        )}
                        {concept.isPlaceholder && (
                          <Badge variant="outline" className="text-gray-500 border-gray-200 text-xs">
                            Placeholder
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Choose Destination</Label>
              
              {/* Option 1: Move to existing category */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="existing"
                    name="destination"
                    checked={!createNewCategory}
                    onChange={() => setCreateNewCategory(false)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="existing" className="text-sm font-medium">Move to existing category</label>
                </div>
                
                {!createNewCategory && (
                  <div className="ml-6 space-y-2">
                    <Label className="text-xs text-muted-foreground">Select destination category</Label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full p-3 border rounded-lg text-sm bg-background hover:bg-accent focus:bg-background focus:ring-2 focus:ring-primary transition-colors"
                      disabled={isMovingConcepts}
                    >
                      <option value="">Choose a category...</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          📁 {category} ({conceptsByCategory[category]?.length || 0} concepts)
                        </option>
                      ))}
                    </select>
                    
                    {targetCategory && (
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs">
                        ✅ Will move {getSelectedCount()} concept(s) to "<strong>{targetCategory}</strong>"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Option 2: Create new category */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="new"
                    name="destination"
                    checked={createNewCategory}
                    onChange={() => setCreateNewCategory(true)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="new" className="text-sm font-medium">Create new category</label>
                </div>
                
                {createNewCategory && (
                  <div className="ml-6 space-y-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        // Close transfer dialog and open add subcategory dialog
                        // The transfer context will be preserved in the state
                        try {
                          await handleCancel()
                          // Add a small delay to ensure state is reset before opening new dialog
                          setTimeout(() => {
                            // The hook will handle opening the add subcategory dialog
                            // with the transfer concepts preserved
                          }, 100)
                        } catch (error) {
                          console.error('Error transitioning to create category:', error)
                        }
                      }}
                      className="w-full"
                      disabled={isAnyOperationInProgress}
                    >
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create New Category & Move Concepts
                    </Button>
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      This will create a new category and move the selected concepts to it.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Moving {getSelectedCount()} of {transferConcepts.length} concept(s)
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleDialogCancel} disabled={isMovingConcepts}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferToExisting}
                disabled={isMovingConcepts || createNewCategory || !targetCategory}
              >
                {isMovingConcepts ? 'Moving...' : `Move to ${targetCategory || '...'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog - Simplified placeholder */}
      <Dialog open={showEditCategoryDialog} onOpenChange={(open) => {
        if (!open) handleDialogCancel()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription>
              Rename "{editingCategoryPath}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">New Name</Label>
              <Input
                id="newCategoryName"
                placeholder="Enter new name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isRenamingCategory}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogCancel} disabled={isRenamingCategory}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameCategoryConfirm}
              disabled={!newCategoryName.trim() || isRenamingCategory}
            >
              {isRenamingCategory ? 'Renaming...' : 'Rename'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ENHANCED: Drag Drop Dialog */}
      <Dialog open={showDragDropDialog} onOpenChange={(open) => {
        if (!open) handleDialogCancel()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Folder className="mr-2 h-5 w-5" />
              Move Category
            </DialogTitle>
            <DialogDescription>
              What would you like to do with "{dragDropData?.draggedCategoryPath}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-sm">
                <strong>Moving:</strong> {dragDropData?.draggedCategoryPath}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>To:</strong> {dragDropData?.targetCategoryName || 'Root Level'}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  if (dragDropData) {
                    await executeCategoryMove(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath)
                    handleDialogCancel()
                  }
                }}
              >
                <Folder className="mr-2 h-4 w-4" />
                Move category only
              </Button>
              
              {dragDropData && conceptsByCategory[dragDropData.draggedCategoryPath]?.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    if (dragDropData) {
                      const targetPath = dragDropData.targetCategoryPath || 'Root'
                      await moveConceptsToCategory(dragDropData.draggedCategoryPath, targetPath)
                      handleDialogCancel()
                    }
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Move concepts to {dragDropData.targetCategoryName || 'Root Level'}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}) 