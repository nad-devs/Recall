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
import { FolderPlus, ArrowRight } from "lucide-react"

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

  // Simple cancel handler
  const handleCancel = () => {
    console.log('🔵 Simple cancel - closing dialogs')
    resetDialogState()
  }

  // Simple create category handler
  const handleCreate = async () => {
    console.log('🔵 Simple create category')
    await handleCreateSubcategory()
  }

  // Simple transfer handler
  const handleTransfer = async () => {
    if (transferConcepts.length === 0) return
    
    console.log('🔵 Simple transfer concepts')
    
    const conceptsToMove = selectedConceptsForTransfer.size > 0
      ? transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
      : transferConcepts

    if (conceptsToMove.length === 0) return

    const targetCategory = selectedParentCategory 
      ? `${selectedParentCategory} > ${newSubcategoryName.trim()}`
      : newSubcategoryName.trim()

    // Create category with placeholder first
    try {
      await createPlaceholderConcept(targetCategory)
      // Then move concepts
      await handleTransferConcepts(conceptsToMove, targetCategory)
    } catch (error) {
      console.error('Error in transfer:', error)
    }
  }

  return (
    <>
      {/* Add Subcategory Dialog */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderPlus className="mr-2 h-5 w-5" />
              Add {selectedParentCategory ? 'Subcategory' : 'Category'}
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isCreatingCategory}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newSubcategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Concepts Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Move Concepts to New Category</DialogTitle>
            <DialogDescription>
              Select concepts to move to the new category "{selectedParentCategory ? `${selectedParentCategory} > ${newSubcategoryName}` : newSubcategoryName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {transferConcepts.map((concept) => (
                <div key={concept.id} className="flex items-center space-x-3 p-3 border rounded">
                  <input
                    type="checkbox"
                    id={`concept-${concept.id}`}
                    checked={selectedConceptsForTransfer.has(concept.id)}
                    onChange={(e) => {
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
                  <div className="flex-1">
                    <label htmlFor={`concept-${concept.id}`} className="text-sm font-medium cursor-pointer">
                      {concept.title}
                    </label>
                    {concept.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {concept.notes}
                      </p>
                    )}
                  </div>
                  {concept.needsReview && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Review
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedConceptsForTransfer.size} of {transferConcepts.length} selected
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isMovingConcepts}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={isMovingConcepts}
              >
                {isMovingConcepts ? 'Moving...' : `Move ${selectedConceptsForTransfer.size || transferConcepts.length} Concept${(selectedConceptsForTransfer.size || transferConcepts.length) !== 1 ? 's' : ''}`}
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

      {/* Drag Drop Dialog - Simplified placeholder */}
      <Dialog open={showDragDropDialog} onOpenChange={setShowDragDropDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Category</DialogTitle>
            <DialogDescription>
              Move "{dragDropData?.draggedCategoryPath}" to "{dragDropData?.targetCategoryName || 'Root Level'}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (dragDropData) {
                  await executeCategoryMove(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath)
                  handleCancel()
                }
              }}
            >
              Move Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 