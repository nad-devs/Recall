import React, { useState, useEffect, useCallback } from 'react'
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
import { useDebugLogger } from '@/utils/debug-logger'

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
  const debug = useDebugLogger('CategoryDialogs')
  
  // Track component renders and critical state
  debug.logUserAction('CategoryDialogs render', {
    showAddSubcategoryDialog,
    showTransferDialog,
    showEditCategoryDialog,
    showDragDropDialog,
    isCreatingCategory,
    isMovingConcepts,
    isRenamingCategory,
    transferConceptsCount: transferConcepts.length,
    selectedParentCategory
  })

  // CRITICAL: Enhanced cancel handler with comprehensive debugging
  const handleCancel = React.useCallback((dialogType: string, trigger: string = 'cancel-button') => {
    const cancelId = `cancel-${dialogType}-${Date.now()}`
    debug.logAsyncStart('handleCancel', cancelId, { dialogType, trigger })
    debug.logStackTrace(`Cancel triggered for ${dialogType}`)
    
    try {
      debug.logUserAction('Cancel button clicked', { dialogType, trigger, cancelId })
      debug.trackDialogTransition(dialogType, 'open', 'closing', trigger)
      
      // Check for blocking operations
      if (isCreatingCategory || isMovingConcepts || isRenamingCategory) {
        debug.logUserAction('Cancel blocked by pending operation', { 
          dialogType, 
          cancelId,
          isCreatingCategory, 
          isMovingConcepts, 
          isRenamingCategory 
        })
        
        // Force unblock after a timeout
        setTimeout(() => {
          debug.logUserAction('Force unblocking cancel operation', { dialogType, cancelId })
          resetDialogState()
        }, 2000)
        
        debug.logAsyncEnd('handleCancel', cancelId, { result: 'blocked-but-scheduled' })
        return
      }
      
      debug.logUserAction('Executing immediate cancel', { dialogType, cancelId })
      debug.logEventLoop('before-resetDialogState')
      
      // Execute the reset with event loop monitoring
      setTimeout(() => {
        debug.logUserAction('Executing resetDialogState in setTimeout', { dialogType, cancelId })
        debug.logEventLoop('resetDialogState-setTimeout-start')
        
        try {
          resetDialogState()
          debug.logUserAction('resetDialogState completed successfully', { dialogType, cancelId })
          debug.logEventLoop('resetDialogState-completed')
          debug.logAsyncEnd('handleCancel', cancelId, { result: 'success' })
        } catch (resetError: any) {
          debug.logAsyncError('handleCancel', cancelId, { dialogType, resetError: resetError.message })
          debug.logError('resetDialogState failed in cancel handler', resetError)
          
          // Fallback: force page reload
          debug.logUserAction('Fallback: forcing page reload due to reset failure', { dialogType, cancelId })
          window.location.reload()
        }
      }, 0)
      
    } catch (error: any) {
      debug.logAsyncError('handleCancel', cancelId, { dialogType, error: error.message })
      debug.logError('Error in cancel handler', error)
      
      // Emergency fallback
      debug.logUserAction('Emergency fallback: immediate page reload', { dialogType, cancelId })
      window.location.reload()
    }
  }, [debug, resetDialogState, isCreatingCategory, isMovingConcepts, isRenamingCategory])

  // Enhanced dialog close handlers
  const handleAddSubcategoryDialogClose = React.useCallback((open: boolean) => {
    debug.logUserAction('Add subcategory dialog onOpenChange', { open, showAddSubcategoryDialog })
    if (!open) {
      debug.logUserAction('Closing add subcategory dialog via onOpenChange')
      handleCancel('AddSubcategory', 'dialog-close')
    }
  }, [debug, showAddSubcategoryDialog, handleCancel])

  const handleTransferDialogClose = React.useCallback((open: boolean) => {
    debug.logUserAction('Transfer dialog onOpenChange', { open, showTransferDialog })
    if (!open) {
      debug.logUserAction('Closing transfer dialog via onOpenChange')
      handleCancel('Transfer', 'dialog-close')
    }
  }, [debug, showTransferDialog, handleCancel])

  return (
    <>
      {/* Add Subcategory Dialog */}
      <Dialog 
        open={showAddSubcategoryDialog} 
        onOpenChange={handleAddSubcategoryDialogClose}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreatingCategory) {
                  handleCreateSubcategory()
                } else if (e.key === 'Escape') {
                  handleCancel('AddSubcategory', 'escape-key')
                }
              }}
              disabled={isCreatingCategory}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Will create: "{selectedParentCategory ? `${selectedParentCategory} > ${newSubcategoryName}` : newSubcategoryName}"
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleCancel('AddSubcategory', 'cancel-button')}
              disabled={false}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubcategory} 
              disabled={!newSubcategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? 'Creating...' : (selectedParentCategory ? 'Create Subcategory' : 'Create Category')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Concepts Dialog - ENHANCED with comprehensive debugging */}
      <Dialog 
        open={showTransferDialog} 
        onOpenChange={handleTransferDialogClose}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
            <DialogDescription>
              You're creating "{selectedParentCategory} {newSubcategoryName ? `> ${newSubcategoryName}` : '> [Enter name below]'}". What would you like to do with the {transferConcepts.length} existing concept(s) in "{transferConcepts[0]?.category}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Subcategory name input */}
            <div className="mb-4">
              <label className="text-sm font-medium">Subcategory Name:</label>
              <Input
                placeholder="Enter subcategory name..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCancel('Transfer', 'escape-key')
                  }
                }}
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
            <div className="space-y-2">
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
              
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {transferConcepts.map((concept) => (
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
                    <div className="flex items-center space-x-2">
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
            </div>
            
            {/* Action options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose an option:</h4>
              
              {/* Move to Existing Categories */}
              {Object.keys(conceptsByCategory).length > 1 && (
                <div className="p-3 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                  <h5 className="text-sm font-medium mb-2">Move to Existing Categories:</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.keys(conceptsByCategory)
                      .filter(cat => cat !== transferConcepts[0]?.category) // Don't show current category
                      .sort()
                      .map(category => (
                        <Button
                          key={category}
                          variant="outline"
                          className="w-full justify-start text-sm h-8 border-green-300 hover:bg-green-100"
                          disabled={isCreatingCategory || isMovingConcepts}
                          onClick={async () => {
                            if (isCreatingCategory || isMovingConcepts) return
                            
                            try {
                              const selectedConcepts = selectedConceptsForTransfer.size > 0 
                                ? transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
                                : transferConcepts
                              await handleTransferConcepts(selectedConcepts, category)
                            } catch (error) {
                              console.error('Error moving concepts to existing category:', error)
                              handleCancel('Transfer', 'error-fallback')
                            }
                          }}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          {category} ({(conceptsByCategory[category] || []).length})
                        </Button>
                      ))}
                  </div>
                  {selectedConceptsForTransfer.size > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Will move {selectedConceptsForTransfer.size} selected concept(s)
                    </p>
                  )}
                  {selectedConceptsForTransfer.size === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Will move all {transferConcepts.length} concept(s)
                    </p>
                  )}
                </div>
              )}
              
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
                      handleCancel('Transfer', 'create-empty-success')
                    } catch (error) {
                      console.error('Error creating empty subcategory:', error)
                      handleCancel('Transfer', 'error-fallback')
                    }
                  }}
                >
                  {isCreatingCategory ? 'Creating...' : (
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
                        handleCancel('Transfer', 'error-fallback')
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
                      handleCancel('Transfer', 'error-fallback')
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
              onClick={() => handleCancel('Transfer', 'cancel-button')}
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
            handleCancel('EditCategory', 'dialog-close')
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenamingCategory) {
                  handleRenameCategoryConfirm()
                } else if (e.key === 'Escape') {
                  handleCancel('EditCategory', 'escape-key')
                }
              }}
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
              onClick={() => handleCancel('EditCategory', 'cancel-button')}
              disabled={false}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameCategoryConfirm} 
              disabled={!newCategoryName.trim() || isRenamingCategory}
            >
              {isRenamingCategory ? 'Renaming...' : 'Rename Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag Drop Dialog */}
      <Dialog 
        open={showDragDropDialog} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancel('DragDrop', 'dialog-close')
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
                          handleCancel('DragDrop', 'move-success')
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
                          handleCancel('DragDrop', 'move-success')
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
                        handleCancel('DragDrop', 'move-success')
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create new root category "{dragDropData.draggedCategoryPath.split(' > ').pop()}"
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleCancel('DragDrop', 'cancel-button')}
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