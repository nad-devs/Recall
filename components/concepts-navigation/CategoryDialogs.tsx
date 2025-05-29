import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  ArrowRight,
  FolderPlus,
  Layers,
  BookOpen
} from "lucide-react"

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
  handleCreateSubcategory: () => void
  handleCancelCategoryCreation: () => void
  
  // Transfer Concepts Dialog
  showTransferDialog: boolean
  setShowTransferDialog: (show: boolean) => void
  transferConcepts: Concept[]
  selectedConceptsForTransfer: Set<string>
  setSelectedConceptsForTransfer: (selected: Set<string>) => void
  isMovingConcepts: boolean
  conceptsByCategory: Record<string, Concept[]>
  handleTransferConcepts: (concepts: Concept[], targetCategory: string) => void
  createPlaceholderConcept: (category: string) => Promise<any>
  resetDialogState: () => void
  
  // Edit Category Dialog
  showEditCategoryDialog: boolean
  setShowEditCategoryDialog: (show: boolean) => void
  editingCategoryPath: string
  newCategoryName: string
  setNewCategoryName: (name: string) => void
  isRenamingCategory: boolean
  handleRenameCategoryConfirm: () => void
  
  // Drag Drop Dialog
  showDragDropDialog: boolean
  setShowDragDropDialog: (show: boolean) => void
  dragDropData: {
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null
  isDraggingCategory: boolean
  executeCategoryMove: (draggedPath: string, targetPath: string | null) => void
  moveConceptsToCategory: (sourcePath: string, targetPath: string) => void
}

export const CategoryDialogs: React.FC<CategoryDialogsProps> = ({
  // Add Subcategory Dialog props
  showAddSubcategoryDialog,
  setShowAddSubcategoryDialog,
  selectedParentCategory,
  newSubcategoryName,
  setNewSubcategoryName,
  isCreatingCategory,
  handleCreateSubcategory,
  handleCancelCategoryCreation,
  
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
  moveConceptsToCategory
}) => {
  // Silent refresh function to avoid loading animations
  const silentRefresh = () => {
    window.location.replace(window.location.href)
  }

  return (
    <>
      {/* Add Subcategory Dialog */}
      <Dialog 
        open={showAddSubcategoryDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Just refresh the page silently to reset everything
            silentRefresh()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedParentCategory ? 'Add Subcategory' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedParentCategory 
                ? `Create a new subcategory under "${selectedParentCategory}"`
                : 'Create a new top-level category'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={selectedParentCategory ? "Enter subcategory name..." : "Enter category name..."}
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isCreatingCategory && handleCreateSubcategory()}
              disabled={isCreatingCategory}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Will create: "{selectedParentCategory ? `${selectedParentCategory} > ${newSubcategoryName}` : newSubcategoryName}"
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelCategoryCreation}
              disabled={false}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubcategory} 
              disabled={!newSubcategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                selectedParentCategory ? 'Create Subcategory' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Concepts Dialog - COMPLETELY FIXED to prevent freezing */}
      <Dialog 
        open={showTransferDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Just refresh the page silently to reset everything
            silentRefresh()
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
            <DialogDescription>
              You're creating "{selectedParentCategory} {newSubcategoryName ? `> ${newSubcategoryName}` : '> [Enter name below]'}". What would you like to do with the {transferConcepts.length} existing concept(s) in "{transferConcepts[0]?.category}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Subcategory name input */}
            <div className="mb-4">
              <label className="text-sm font-medium">Subcategory Name:</label>
              <Input
                placeholder="Enter subcategory name..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                disabled={isCreatingCategory || isMovingConcepts}
                className="mt-1"
              />
              {newSubcategoryName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will create: "{selectedParentCategory} {`>`} {newSubcategoryName}"
                </p>
              )}
            </div>
            
            {/* Concepts selection */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Existing concepts in {transferConcepts[0]?.category}:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isMovingConcepts || isCreatingCategory}
                  onClick={() => {
                    if (isMovingConcepts || isCreatingCategory) return
                    
                    try {
                      // Prevent rapid clicking
                      setTimeout(() => {
                        try {
                          const allSelected = selectedConceptsForTransfer.size === transferConcepts.length
                          if (allSelected) {
                            setSelectedConceptsForTransfer(new Set())
                          } else {
                            setSelectedConceptsForTransfer(new Set(transferConcepts.map(c => c.id)))
                          }
                        } catch (innerError) {
                          console.error('Inner error updating concept selection:', innerError)
                          setSelectedConceptsForTransfer(new Set())
                        }
                      }, 0)
                    } catch (error) {
                      console.error('Error updating concept selection:', error)
                      setSelectedConceptsForTransfer(new Set())
                    }
                  }}
                >
                  {selectedConceptsForTransfer.size === transferConcepts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              {transferConcepts.map(concept => (
                <div 
                  key={concept.id} 
                  className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                    selectedConceptsForTransfer.has(concept.id) 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'hover:bg-muted/50'
                  } ${isMovingConcepts || isCreatingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isMovingConcepts || isCreatingCategory) return
                    
                    try {
                      // Prevent rapid clicking and state corruption
                      setTimeout(() => {
                        try {
                          const newSelected = new Set(selectedConceptsForTransfer)
                          if (newSelected.has(concept.id)) {
                            newSelected.delete(concept.id)
                          } else {
                            newSelected.add(concept.id)
                          }
                          setSelectedConceptsForTransfer(newSelected)
                        } catch (innerError) {
                          console.error('Inner error updating individual concept selection:', innerError)
                          setSelectedConceptsForTransfer(new Set())
                        }
                      }, 0)
                    } catch (error) {
                      console.error('Error updating concept selection:', error)
                      setSelectedConceptsForTransfer(new Set())
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedConceptsForTransfer.has(concept.id)}
                      onChange={() => {}}
                      className="w-4 h-4"
                      disabled={isMovingConcepts || isCreatingCategory}
                    />
                    <span className="font-medium">{concept.title}</span>
                  </div>
                  <Badge variant="outline">{concept.category}</Badge>
                </div>
              ))}
            </div>
            
            {/* Action options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose an option:</h4>
              
              {/* Create empty subcategory */}
              <div className="p-3 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <Button
                  variant="default"
                  className="w-full justify-start text-sm h-10 bg-green-600 hover:bg-green-700"
                  disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                  onClick={async () => {
                    if (!newSubcategoryName || !newSubcategoryName.trim()) return
                    if (isCreatingCategory || isMovingConcepts) return
                    
                    try {
                      const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                      await createPlaceholderConcept(newCategory)
                      setTimeout(() => resetDialogState(), 0)
                    } catch (error) {
                      console.error('Error creating empty subcategory:', error)
                      setTimeout(() => resetDialogState(), 0)
                    }
                  }}
                >
                  {isCreatingCategory ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create Empty Subcategory
                    </>
                  )}
                </Button>
              </div>
              
              {/* Move selected concepts */}
              {selectedConceptsForTransfer.size > 0 && (
                <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-10 border-purple-300 hover:bg-purple-100"
                    disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                    onClick={async () => {
                      if (!newSubcategoryName || !newSubcategoryName.trim()) return
                      if (isCreatingCategory || isMovingConcepts) return
                      
                      try {
                        const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                        await createPlaceholderConcept(newCategory)
                        const selectedConcepts = transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
                        await handleTransferConcepts(selectedConcepts, newCategory)
                      } catch (error) {
                        console.error('Error creating subcategory with selected concepts:', error)
                        setTimeout(() => resetDialogState(), 0)
                      }
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move Selected Concepts to New Subcategory ({selectedConceptsForTransfer.size})
                  </Button>
                </div>
              )}
              
              {/* Move all concepts */}
              <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm h-10 border-blue-300 hover:bg-blue-100"
                  disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                  onClick={async () => {
                    if (!newSubcategoryName || !newSubcategoryName.trim()) return
                    if (isCreatingCategory || isMovingConcepts) return
                    
                    try {
                      const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                      await createPlaceholderConcept(newCategory)
                      await handleTransferConcepts(transferConcepts, newCategory)
                    } catch (error) {
                      console.error('Error creating subcategory with all concepts:', error)
                      setTimeout(() => resetDialogState(), 0)
                    }
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Move All Concepts to New Subcategory
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelCategoryCreation}
              disabled={false}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog 
        open={showEditCategoryDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Just refresh the page silently to reset everything
            silentRefresh()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Name</DialogTitle>
            <DialogDescription>
              Rename "{editingCategoryPath}" to a new name. This will update all concepts in this category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isRenamingCategory && handleRenameCategoryConfirm()}
              disabled={isRenamingCategory}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {editingCategoryPath.includes(' > ') ? (
                <>Will rename to: "{editingCategoryPath.split(' > ').slice(0, -1).join(' > ')} {`>`} {newCategoryName}"</>
              ) : (
                <>Will rename to: "{newCategoryName}"</>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelCategoryCreation}
              disabled={false}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameCategoryConfirm} 
              disabled={!newCategoryName.trim() || isRenamingCategory}
            >
              {isRenamingCategory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Renaming...
                </>
              ) : (
                'Rename Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag and Drop Confirmation Dialog */}
      <Dialog 
        open={showDragDropDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Just refresh the page silently to reset everything
            silentRefresh()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Category</DialogTitle>
            <DialogDescription>
              {dragDropData && (
                <>
                  You're moving "<strong>{dragDropData.draggedCategoryPath}</strong>" 
                  {dragDropData.targetCategoryPath 
                    ? ` to "${dragDropData.targetCategoryPath}"`
                    : " to the root level"
                  }. 
                  Where would you like to place the concepts?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {dragDropData && (
              <>
                {dragDropData.targetCategoryPath ? (
                  <>
                    {/* Move concepts INTO the existing target category */}
                    <div className="p-3 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                      <Button
                        variant="default"
                        className="w-full justify-start text-sm h-10 bg-green-600 hover:bg-green-700"
                        disabled={isDraggingCategory}
                        onClick={async () => {
                          await moveConceptsToCategory(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath!)
                          resetDialogState()
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Put in "{dragDropData.targetCategoryName}"
                      </Button>
                    </div>
                    
                    {/* Create subcategory UNDER the target */}
                    <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm h-10 border-blue-300 hover:bg-blue-100"
                        disabled={isDraggingCategory}
                        onClick={async () => {
                          await executeCategoryMove(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath)
                          resetDialogState()
                        }}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        Put as "{dragDropData.targetCategoryName} {`>`} {dragDropData.draggedCategoryPath.split(' > ').pop()}"
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Create root category */
                  <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                    <Button
                      variant="default"
                      className="w-full justify-start text-sm h-10 bg-purple-600 hover:bg-purple-700"
                      disabled={isDraggingCategory}
                      onClick={async () => {
                        await executeCategoryMove(dragDropData.draggedCategoryPath, null)
                        resetDialogState()
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create new root category "{dragDropData.draggedCategoryPath.split(' {`>`} ').pop()}"
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelCategoryCreation}
              disabled={isDraggingCategory}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 