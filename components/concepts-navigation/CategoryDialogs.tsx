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
import { FolderPlus, ArrowRight, AlertTriangle, Folder, ChevronDown } from "lucide-react"
import { Select, SelectOption } from "@/components/ui/select"

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

// Custom searchable select component
const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
  className = ""
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; description?: string }>
  placeholder: string
  disabled?: boolean
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const selectedOption = options.find(opt => opt.value === value)
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-2 px-3 border rounded-md bg-background text-sm flex items-center justify-between hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border bg-popover">
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm h-8 bg-background border-input"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto bg-popover">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                No categories found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-colors border-b border-border/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{option.description}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90]" 
          onClick={() => {
            setIsOpen(false)
            setSearchQuery('')
          }}
        />
      )}
    </div>
  )
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
  const [localSelectedParentCategory, setLocalSelectedParentCategory] = useState('')

  console.log('🚀 CategoryDialogs: Redux-only mode - no loading context conflicts!')
  
  // REDUX-ONLY cancel handler - no loading system conflicts
  const handleDialogCancel = () => {
    console.log('🚀 Redux: Instant dialog cancel - no loading conflicts!')
    
    // Reset local state immediately
    setTargetCategory('')
    setCreateNewCategory(false)
    setLocalSelectedParentCategory('')
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

  // Redux-only create and move handler
  const handleCreateAndMove = async () => {
    if (!newSubcategoryName.trim() || transferConcepts.length === 0 || isAnyOperationInProgress) return
    
    console.log('🚀 Redux: Create new category and move concepts - background processing!')
    
    try {
      // Create the full category path including parent if selected
      const fullCategoryPath = localSelectedParentCategory ? 
        `${localSelectedParentCategory} > ${newSubcategoryName.trim()}` : 
        newSubcategoryName.trim()
      
      // Create the new category and move concepts to it
      await handleTransferConcepts(transferConcepts, fullCategoryPath)
    } catch (error) {
      console.error('Redux: Error in create and move:', error)
    }
  }

  // Get available categories for transfer (excluding current category) - includes both parents and subcategories
  const getAllAvailableCategories = () => {
    const currentCategory = transferConcepts[0]?.category || ''
    const allCategories = new Set<string>()
    
    // Add all existing categories
    Object.keys(conceptsByCategory).forEach(cat => {
      if (cat !== currentCategory && conceptsByCategory[cat].some(c => !c.isPlaceholder)) {
        allCategories.add(cat)
        
        // If this is a subcategory, also add its parent
        if (cat.includes(' > ')) {
          const parentParts = cat.split(' > ')
          for (let i = 1; i < parentParts.length; i++) {
            const parentPath = parentParts.slice(0, i).join(' > ')
            allCategories.add(parentPath)
          }
        }
      }
    })
    
    return Array.from(allCategories).sort()
  }

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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] w-[90vw]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center">
              <ArrowRight className="mr-2 h-5 w-5" />
              Move Concepts
            </DialogTitle>
            <DialogDescription>
              Choose where to move the selected concepts from "{transferConcepts[0]?.category || 'Unknown'}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Concept Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium">Select Concepts to Move</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-8 text-sm px-3"
                >
                  {getSelectedCount() === transferConcepts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto border rounded-md bg-muted/10">
                <div className="space-y-2 p-3">
                  {transferConcepts.map((concept) => (
                    <div key={concept.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded border bg-background">
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
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {concept.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
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
              <Label className="font-medium">Choose Destination</Label>
              
              {/* Option 1: Move to existing category */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
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
                  <div className="ml-7 space-y-2">
                    <Label className="text-sm text-muted-foreground">Select destination category</Label>
                    <div className="space-y-2">
                      <SearchableSelect
                        value={targetCategory}
                        onChange={setTargetCategory}
                        options={getAllAvailableCategories().map(category => {
                          const conceptCount = conceptsByCategory[category]?.length || 0
                          const isParentCategory = !conceptsByCategory[category] && Object.keys(conceptsByCategory).some(cat => cat.startsWith(category + ' > '))
                          
                          return {
                            value: category,
                            label: `📁 ${category}`,
                            description: isParentCategory ? '(parent category)' : `(${conceptCount} concepts)`
                          }
                        })}
                        placeholder="Choose a category..."
                        disabled={isMovingConcepts}
                      />
                    </div>
                    
                    {targetCategory && (
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm">
                        ✅ Will move {getSelectedCount()} concept(s) to "<strong>{targetCategory}</strong>"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Option 2: Create new subcategory */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="new"
                    name="destination"
                    checked={createNewCategory}
                    onChange={() => setCreateNewCategory(true)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="new" className="text-sm font-medium">Create new subcategory</label>
                </div>
                
                {createNewCategory && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Select parent category</Label>
                      <div className="space-y-2 mt-1">
                        <SearchableSelect
                          value={localSelectedParentCategory}
                          onChange={setLocalSelectedParentCategory}
                          options={[
                            { value: '', label: 'Create as top-level category', description: '(no parent)' },
                            ...getAllAvailableCategories().map(category => ({
                              value: category,
                              label: `📁 ${category}`,
                              description: conceptsByCategory[category]?.length ? `(${conceptsByCategory[category].length} concepts)` : undefined
                            }))
                          ]}
                          placeholder="Select parent category..."
                          disabled={isMovingConcepts}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Enter subcategory name</Label>
                      <Input
                        placeholder="Enter subcategory name..."
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        disabled={isMovingConcepts}
                        className="text-sm py-2 mt-1"
                      />
                    </div>
                    
                    {newSubcategoryName.trim() && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                        ✅ Will create "<strong>{localSelectedParentCategory ? `${localSelectedParentCategory} > ${newSubcategoryName.trim()}` : newSubcategoryName.trim()}</strong>" and move {getSelectedCount()} concept(s) to it
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Moving <strong>{getSelectedCount()}</strong> of <strong>{transferConcepts.length}</strong> concept(s)
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={handleDialogCancel} 
                disabled={isMovingConcepts}
                className="px-4"
              >
                Cancel
              </Button>
              <Button 
                onClick={createNewCategory ? handleCreateAndMove : handleTransferToExisting}
                disabled={isMovingConcepts || (!targetCategory && !createNewCategory) || (!targetCategory && createNewCategory && !newSubcategoryName.trim()) || getSelectedCount() === 0}
                className="px-4"
              >
                {isMovingConcepts ? 'Moving...' : createNewCategory ? `Create & Move` : `Move to ${targetCategory || '...'}`}
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