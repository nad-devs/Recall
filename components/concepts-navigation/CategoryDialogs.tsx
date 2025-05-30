import React, { useState } from 'react'
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
  // Add Subcategory Dialog
  showAddSubcategoryDialog: boolean
  setShowAddSubcategoryDialog: (show: boolean) => void
  selectedParentCategory: string
  newSubcategoryName: string
  setNewSubcategoryName: (name: string) => void
  isCreatingCategory: boolean
  handleCreateSubcategory: () => Promise<void>
  
  // Transfer Concepts Dialog
  showTransferDialog: boolean
  setShowTransferDialog: (show: boolean) => void
  transferConcepts: Concept[]
  selectedConceptsForTransfer: Set<string>
  setSelectedConceptsForTransfer: (concepts: Set<string>) => void
  isMovingConcepts: boolean
  conceptsByCategory: Record<string, Concept[]>
  handleTransferConcepts: (concepts: Concept[], targetCategory: string) => Promise<void>
  createPlaceholderConcept: (category: string) => Promise<any>
  resetDialogState: () => void
  
  // Edit Category Dialog (simplified)
  showEditCategoryDialog: boolean
  setShowEditCategoryDialog: (show: boolean) => void
  editingCategoryPath: string
  newCategoryName: string
  setNewCategoryName: (name: string) => void
  isRenamingCategory: boolean
  handleRenameCategoryConfirm: () => void
  
  // Drag Drop Dialog (simplified)
  showDragDropDialog: boolean
  setShowDragDropDialog: (show: boolean) => void
  dragDropData: {
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null
  isDraggingCategory: boolean
  executeCategoryMove: (draggedPath: string, targetPath: string | null) => Promise<void>
  moveConceptsToCategory: (sourcePath: string, targetPath: string) => Promise<void>
}

export function CategoryDialogs({
  // Add Subcategory Dialog props
  showAddSubcategoryDialog,
  setShowAddSubcategoryDialog,
  selectedParentCategory,
  newSubcategoryName,
  setNewSubcategoryName,
  isCreatingCategory,
  handleCreateSubcategory,
  
  // Transfer Concepts Dialog props
  showTransferDialog,
  setShowTransferDialog,
  transferConcepts,
  selectedConceptsForTransfer,
  setSelectedConceptsForTransfer,
  isMovingConcepts,
  conceptsByCategory,
  handleTransferConcepts,
  createPlaceholderConcept,
  resetDialogState,
  
  // Edit Category Dialog props
  showEditCategoryDialog,
  setShowEditCategoryDialog,
  editingCategoryPath,
  newCategoryName,
  setNewCategoryName,
  isRenamingCategory,
  handleRenameCategoryConfirm,
  
  // Drag Drop Dialog props
  showDragDropDialog,
  setShowDragDropDialog,
  dragDropData,
  isDraggingCategory,
  executeCategoryMove,
  moveConceptsToCategory,
}: CategoryDialogsProps) {

  // Enhanced state for move concepts functionality
  const [targetCategory, setTargetCategory] = useState('')
  const [createNewCategory, setCreateNewCategory] = useState(false)

  // Simple cancel handler
  const handleCancel = () => {
    console.log('🔵 Simple cancel - closing dialogs')
    setTargetCategory('')
    setCreateNewCategory(false)
    resetDialogState()
  }

  // ENHANCED: Create category with optional concept transfer
  const handleCreate = async () => {
    console.log('🔵 Enhanced create category')
    
    if (!newSubcategoryName.trim()) {
      return
    }

    try {
      await handleCreateSubcategory()
      
      // If there are concepts in the parent category and this is being called from transfer dialog
      if (transferConcepts.length > 0 && showTransferDialog) {
        const newCategoryPath = selectedParentCategory 
          ? `${selectedParentCategory} > ${newSubcategoryName.trim()}`
          : newSubcategoryName.trim()
        
        // Transfer selected concepts or all concepts if none selected
        const conceptsToMove = selectedConceptsForTransfer.size > 0
          ? transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
          : transferConcepts

        if (conceptsToMove.length > 0) {
          await handleTransferConcepts(conceptsToMove, newCategoryPath)
        }
      }
    } catch (error) {
      console.error('Error in enhanced create:', error)
    }
  }

  // ENHANCED: Transfer concepts to existing category
  const handleTransferToExisting = async () => {
    if (!targetCategory || transferConcepts.length === 0) return
    
    console.log('🔵 Enhanced transfer to existing category:', targetCategory)
    
    const conceptsToMove = selectedConceptsForTransfer.size > 0
      ? transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
      : transferConcepts

    if (conceptsToMove.length === 0) return

    try {
      await handleTransferConcepts(conceptsToMove, targetCategory)
    } catch (error) {
      console.error('Error in transfer to existing:', error)
    }
  }

  // Get available categories for transfer (excluding current category)
  const availableCategories = Object.keys(conceptsByCategory).filter(cat => 
    cat !== (transferConcepts[0]?.category || '') && 
    conceptsByCategory[cat].some(c => !c.isPlaceholder)
  ).sort()

  // Toggle select all/none
  const handleToggleAll = () => {
    if (selectedConceptsForTransfer.size === transferConcepts.length) {
      setSelectedConceptsForTransfer(new Set())
    } else {
      setSelectedConceptsForTransfer(new Set(transferConcepts.map(c => c.id)))
    }
  }

  return (
    <>
      {/* ENHANCED: Add Subcategory Dialog */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
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
                  {selectedConceptsForTransfer.size || transferConcepts.length} concept(s) will be moved to this new category
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isCreatingCategory}>
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
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
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
                  {selectedConceptsForTransfer.size === transferConcepts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <div className="space-y-1 p-2">
                  {transferConcepts.map((concept) => (
                    <div key={concept.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                      <input
                        type="checkbox"
                        id={`concept-${concept.id}`}
                        checked={selectedConceptsForTransfer.has(concept.id)}
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
                  <div className="ml-6">
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                      disabled={isMovingConcepts}
                    >
                      <option value="">Select a category...</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category} ({conceptsByCategory[category]?.length || 0} concepts)
                        </option>
                      ))}
                    </select>
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
                      onClick={() => {
                        setShowTransferDialog(false)
                        setShowAddSubcategoryDialog(true)
                      }}
                      className="w-full"
                      disabled={isMovingConcepts}
                    >
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create New Category & Move Concepts
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Moving {selectedConceptsForTransfer.size || transferConcepts.length} of {transferConcepts.length} concept(s)
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isMovingConcepts}>
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
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
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
            <Button variant="outline" onClick={handleCancel} disabled={isRenamingCategory}>
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
      <Dialog open={showDragDropDialog} onOpenChange={setShowDragDropDialog}>
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
                    handleCancel()
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
                      handleCancel()
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
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 