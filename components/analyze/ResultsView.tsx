"use client"

import { motion } from "framer-motion"
import { formatRelatedConcepts } from "@/lib/utils"
import { ConversationAnalysis, Concept } from '@/lib/types/conversation'
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import React from "react"
import { Autocomplete } from "@/components/ui/autocomplete"
import { ConceptMatchDialog } from "./ConceptMatchDialog"
import { ConversationSaveDialog } from "./ConversationSaveDialog"


interface ResultsViewProps {
  analysisResult: ConversationAnalysis
  selectedConcept: Concept | null
  selectedTab: string
  setSelectedTab: (tab: string) => void
  showAddConceptCard: boolean
  setShowAddConceptCard: (show: boolean) => void
  editConceptMode: boolean
  setEditConceptMode: (mode: boolean) => void
  editConceptTitle: string
  setEditConceptTitle: (title: string) => void
  editConceptCategory: string
  setEditConceptCategory: (category: string) => void
  isEditingCategory: boolean
  setIsEditingCategory: (editing: boolean) => void
  editCategoryValue: string
  setEditCategoryValue: (value: string) => void
  isAddingConcept: boolean
  isSaving: boolean
  saveError: string | null
  isDeleting: boolean
  showConceptConfirmation: boolean
  existingConcepts: any[]
  handleSaveConversation: () => void
  handleAddConcept: (title: string) => void
  handleDeleteConcept: (id: string) => void
  handleDeleteCodeSnippet: (conceptId: string, index: number) => void
  handleCategoryUpdate: (value: string) => void
  handleConfirmConceptUpdates: () => void
  handleCancelConceptUpdates: () => void
  setSelectedConcept: (concept: Concept) => void
  addConceptToCurrentAnalysis: (title: string, originalConcept?: Concept) => Promise<Concept>
  // Concept matching props
  conceptMatches?: any[]
  showConceptMatchDialog?: boolean
  isProcessingMatches?: boolean
  handleConceptMatchDecision?: (matchIndex: number, shouldUpdate: boolean) => void
  // Conversation save props
  showConversationSaveDialog?: boolean
  updatedConceptsCount?: number
  handleSaveConversationDecision?: () => void
  handleSkipSavingDecision?: () => void
}

export function ResultsView(props: ResultsViewProps) {
  const {
    analysisResult,
    selectedConcept,
    selectedTab,
    setSelectedTab,
    showAddConceptCard,
    setShowAddConceptCard,
    editConceptMode,
    setEditConceptMode,
    editConceptTitle,
    setEditConceptTitle,
    editConceptCategory,
    setEditConceptCategory,
    isEditingCategory,
    setIsEditingCategory,
    editCategoryValue,
    setEditCategoryValue,
    isAddingConcept,
    isSaving,
    saveError,
    isDeleting,
    showConceptConfirmation,
    existingConcepts,
    handleSaveConversation,
    handleAddConcept,
    handleDeleteConcept,
    handleDeleteCodeSnippet,
    handleCategoryUpdate,
    handleConfirmConceptUpdates,
    handleCancelConceptUpdates,
    setSelectedConcept,
    addConceptToCurrentAnalysis,
    // Concept matching props
    conceptMatches = [],
    showConceptMatchDialog = false,
    isProcessingMatches = false,
    handleConceptMatchDecision,
    // Conversation save props
    showConversationSaveDialog = false,
    updatedConceptsCount = 0,
    handleSaveConversationDecision,
    handleSkipSavingDecision,
  } = props

  const { toast } = useToast()
  const [conceptExistenceCache, setConceptExistenceCache] = useState<Record<string, {exists: boolean, id?: string}>>({})
  const [categories, setCategories] = useState<string[][]>([])
  const [rootCategory, setRootCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [categoryPathInput, setCategoryPathInput] = useState("")
  const [categoryPathParts, setCategoryPathParts] = useState<string[]>([])
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<Array<{value: string, label: string, description?: string}>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Fetch categories for the picker and autocomplete
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const [categoriesRes, conceptsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/concepts")
        ])
        
        const categoriesData = await categoriesRes.json()
        const conceptsData = await conceptsRes.json()
        
        setCategories(categoriesData.categories || [])
        
        // Build autocomplete options from existing categories
        const categorySet = new Set<string>()
        const options: Array<{value: string, label: string, description?: string}> = []
        
        // Add hierarchical categories from database
        if (categoriesData.categories) {
          categoriesData.categories.forEach((path: string[]) => {
            const fullPath = path.join(' > ')
            if (!categorySet.has(fullPath)) {
              categorySet.add(fullPath)
              options.push({
                value: fullPath,
                label: fullPath,
                description: path.length > 1 ? `${path.length}-level category` : 'Root category'
              })
            }
          })
        }
        
        // Add categories from existing concepts
        if (conceptsData.concepts) {
          conceptsData.concepts.forEach((concept: any) => {
            if (concept.category && !categorySet.has(concept.category)) {
              categorySet.add(concept.category)
              options.push({
                value: concept.category,
                label: concept.category,
                description: 'Used in existing concepts'
              })
            }
          })
        }
        
        // Sort options: hierarchical first, then alphabetically
        options.sort((a, b) => {
          const aHierarchical = a.value.includes(' > ')
          const bHierarchical = b.value.includes(' > ')
          
          if (aHierarchical && !bHierarchical) return -1
          if (!aHierarchical && bHierarchical) return 1
          
          return a.label.localeCompare(b.label)
        })
        
        setCategoryOptions(options)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

  // When editing a concept, prefill the category path parts
  useEffect(() => {
    if (isEditingCategory && selectedConcept) {
      const path = selectedConcept.categoryPath || [selectedConcept.category];
      setCategoryPathParts(path);
      setIsAddingSubcategory(false);
    }
  }, [isEditingCategory, selectedConcept]);

  // Helper to get unique root categories
  const rootOptions = Array.from(new Set(categories.map(path => path[0]).filter(Boolean)))
  // Helper to get subcategories for selected root
  const subOptions = Array.from(new Set(categories.filter(path => path[0] === rootCategory && path[1]).map(path => path[1])))

  const showAddConceptDialog = (relatedTitle: string) => {
    if (!selectedConcept) {
      console.error('No selected concept to link back to')
      return
    }

    const toastRef = toast({
      title: "Add as New Concept",
      description: `"${relatedTitle}" doesn't exist yet. Do you want to create and add it to identified concepts?`,
      action: (
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-medium h-8 px-3 hover:bg-primary/90"
            onClick={async () => {
              // Dismiss the toast immediately
              toastRef.dismiss();
              
              try {
                // Create the new concept using addConceptToCurrentAnalysis, passing the selected concept for linking
                const newConcept = await addConceptToCurrentAnalysis(relatedTitle, selectedConcept);
                
                // Show success toast (the function will show its own toast with linking info)
                if (!selectedConcept) {
                  toast({
                    title: "Concept Added",
                    description: `"${relatedTitle}" has been added to your identified concepts`,
                    duration: 3000,
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to create concept. Please try again.",
                  variant: "destructive",
                  duration: 3000,
                });
              }
            }}
          >
            Yes
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md border border-input bg-background text-xs font-medium h-8 px-3 hover:bg-accent"
            onClick={() => {
              // Dismiss the toast when No is clicked too
              toastRef.dismiss();
            }}
          >
            No
          </button>
        </div>
      ),
      duration: 5000,
    })
  }

  // Function to check if concept exists in database
  const checkConceptExists = async (conceptTitle: string): Promise<{exists: boolean, id?: string}> => {
    // Return cached result if available
    if (conceptExistenceCache[conceptTitle]) {
      return conceptExistenceCache[conceptTitle]
    }

    try {
      const response = await fetch(`/api/concepts-by-title/${encodeURIComponent(conceptTitle)}`)
      
      if (response.ok) {
        const conceptData = await response.json()
        
        // Double-check that we have valid concept data
        if (conceptData && conceptData.id && conceptData.title) {
          const result: {exists: boolean, id?: string} = {
            exists: true,
            id: conceptData.id
          }
          
          // Cache the result
          setConceptExistenceCache(prev => ({
            ...prev,
            [conceptTitle]: result
          }))
          
          return result
        }
      }
      
      // If response is not ok or data is invalid, concept doesn't exist
      const result: {exists: boolean, id?: string} = { exists: false }
      setConceptExistenceCache(prev => ({
        ...prev,
        [conceptTitle]: result
      }))
      return result
      
    } catch (error) {
      console.error('Error checking concept existence:', error)
      const result: {exists: boolean, id?: string} = { exists: false }
      setConceptExistenceCache(prev => ({
        ...prev,
        [conceptTitle]: result
      }))
      return result
    }
  }

  return (
    <motion.div
      className="lg:col-span-3 space-y-6"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Save button at the top */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-end mb-4"
        >
          <button
            onClick={handleSaveConversation}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4 animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Conversation
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Save error display */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4"
        >
          {saveError}
        </motion.div>
      )}

      {/* Concept confirmation dialog */}
      {showConceptConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4"
        >
          <h3 className="font-medium text-yellow-800 mb-2">Existing concepts found</h3>
          <p className="text-sm text-yellow-700 mb-3">
            Some concepts in this conversation already exist in your library:
          </p>
          <ul className="text-sm text-yellow-700 mb-4 list-disc list-inside">
            {existingConcepts.map((concept, index) => (
              <li key={index}>{concept.title}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmConceptUpdates}
              className="inline-flex items-center justify-center rounded-md bg-yellow-600 text-white px-3 py-2 text-sm font-medium hover:bg-yellow-700"
            >
              Update Existing Concepts
            </button>
            <button
              onClick={handleCancelConceptUpdates}
              className="inline-flex items-center justify-center rounded-md border border-yellow-600 text-yellow-600 px-3 py-2 text-sm font-medium hover:bg-yellow-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Main content based on current state */}
      {showAddConceptCard ? (
        // Add Concept Card
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              Add a concept that wasn't identified in the conversation.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const inputEl = e.currentTarget.querySelector('input') as HTMLInputElement;
              if (inputEl.value.trim()) {
                addConceptToCurrentAnalysis(inputEl.value.trim());
              }
            }} className="space-y-6">
              <div>
                <input 
                  type="text"
                  placeholder="Enter concept title..."
                  className="w-full p-3 text-xl font-semibold border-0 border-b bg-background focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
                  autoFocus
                  disabled={isAddingConcept}
                />
                <div className="text-center text-muted-foreground mt-6">
                  AI will generate content automatically.
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddConceptCard(false)}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                  disabled={isAddingConcept}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90"
                  disabled={isAddingConcept}
                >
                  {isAddingConcept ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 animate-spin"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Creating...
                    </>
                  ) : "Create Concept"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : selectedConcept && editConceptMode ? (
        // Edit concept form
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Concept</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedConcept) {
                // Update concept logic would go here
                setEditConceptMode(false);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input 
                  type="text"
                  value={editConceptTitle}
                  onChange={e => setEditConceptTitle(e.target.value)}
                  className="w-full p-2 text-md border rounded-md bg-background"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="relative ml-2 flex flex-col gap-2 items-start">
                  <div className="flex gap-2 items-center flex-wrap">
                    {categoryPathParts.map((part, idx) => (
                      <React.Fragment key={idx}>
                        <input
                          type="text"
                          value={part}
                          onChange={e => {
                            const newParts = [...categoryPathParts];
                            newParts[idx] = e.target.value;
                            setCategoryPathParts(newParts);
                          }}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs w-36"
                          placeholder={idx === 0 ? "Root category" : `Subcategory ${idx}`}
                        />
                        {idx < categoryPathParts.length - 1 && <span className="mx-1">&gt;</span>}
                      </React.Fragment>
                    ))}
                    {isAddingSubcategory ? (
                      <input
                        type="text"
                        value={""}
                        autoFocus
                        onBlur={e => {
                          if (e.target.value.trim()) {
                            setCategoryPathParts([...categoryPathParts, e.target.value.trim()]);
                          }
                          setIsAddingSubcategory(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            setCategoryPathParts([...categoryPathParts, e.currentTarget.value.trim()]);
                            setIsAddingSubcategory(false);
                          } else if (e.key === 'Escape') {
                            setIsAddingSubcategory(false);
                          }
                        }}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs w-36"
                        placeholder="New subcategory"
                      />
                    ) : (
                      <button
                        type="button"
                        className="ml-1 text-xs px-2 py-1 rounded bg-primary text-white"
                        onClick={() => setIsAddingSubcategory(true)}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tip: Edit any part of the path. Click '+ Add' to add a subcategory. The leftmost is the root.
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-primary text-white"
                      onClick={() => handleCategoryUpdate(categoryPathParts.filter(Boolean).join(' > '))}
                      disabled={!categoryPathParts[0]?.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-input"
                      onClick={() => setIsEditingCategory(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditConceptMode(false)}
                  className="px-3 py-2 rounded-md border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : selectedConcept ? (
        // Selected concept details
        <>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedConcept.title}</h2>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 mr-1"
                    >
                      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                      <path d="M7 7h.01" />
                    </svg>
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {selectedConcept.categoryPath ? (
                        <span>
                          {selectedConcept.categoryPath.join(' > ')}
                        </span>
                      ) : (
                        selectedConcept.category
                      )}
                      <button 
                        className="ml-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded p-1 transition-colors" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditCategoryValue(selectedConcept.categoryPath ? 
                            selectedConcept.categoryPath.join(' > ') : 
                            selectedConcept.category);
                          setIsEditingCategory(true);
                        }}
                        title="Edit category"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                    </div>
                    {isEditingCategory && (
                      <div className="relative ml-2 flex flex-col gap-3 items-start bg-muted/50 p-3 rounded-md border">
                        <div className="flex gap-2 items-center flex-wrap">
                          {categoryPathParts.map((part, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex items-center gap-1">
                                <Autocomplete
                                  value={part}
                                  onChange={(value) => {
                                    const newParts = [...categoryPathParts];
                                    newParts[idx] = value;
                                    setCategoryPathParts(newParts);
                                  }}
                                  options={categoryOptions}
                                  placeholder={idx === 0 ? "Root category" : `Subcategory ${idx}`}
                                  className="w-40"
                                  disabled={isLoadingCategories}
                                  maxSuggestions={8}
                                />
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newParts = categoryPathParts.filter((_, i) => i !== idx);
                                      setCategoryPathParts(newParts);
                                    }}
                                    className="text-destructive hover:bg-destructive/10 rounded p-1"
                                    title="Remove this subcategory"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {idx < categoryPathParts.length - 1 && <span className="mx-2 text-muted-foreground font-bold">&gt;</span>}
                            </React.Fragment>
                          ))}
                          {isAddingSubcategory ? (
                            <div className="flex items-center gap-2">
                              <span className="mx-2 text-muted-foreground font-bold">&gt;</span>
                              <Autocomplete
                                value=""
                                onChange={(value) => {
                                  if (value.trim()) {
                                    setCategoryPathParts([...categoryPathParts, value.trim()]);
                                    setIsAddingSubcategory(false);
                                  }
                                }}
                                options={categoryOptions}
                                placeholder="Enter subcategory..."
                                className="w-40"
                                disabled={isLoadingCategories}
                                maxSuggestions={8}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="ml-2 text-sm px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-medium flex items-center gap-1 shadow-sm border border-green-700 dark:border-green-400 transition-all duration-200"
                              onClick={() => setIsAddingSubcategory(true)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              Add
                            </button>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border-l-4 border-blue-400">
                          <strong>Preview:</strong> {categoryPathParts.filter(Boolean).join(' > ') || 'Enter categories above'}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            className="text-sm px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium"
                            onClick={() => {
                              // Auto-correct common misspellings and format
                              const correctedParts = categoryPathParts
                                .filter(Boolean)
                                .map(part => {
                                  const trimmed = part.trim();
                                  // Auto-correct "Artificial Intelligence" variations
                                  if (/^(ai|artificial\s*intelligence?|artif\w*\s*intel\w*|machine\s*learning)$/i.test(trimmed)) {
                                    return 'Artificial Intelligence';
                                  }
                                  // Auto-correct "Natural Language Processing" variations
                                  if (/^(nlp|natural\s*language?\s*process\w*|nat\w*\s*lang\w*)$/i.test(trimmed)) {
                                    return 'Natural Language Processing';
                                  }
                                  // Capitalize first letter of each word
                                  return trimmed.split(' ').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                  ).join(' ');
                                });
                              
                              const newPath = correctedParts.join(' > ');
                              handleCategoryUpdate(newPath);
                            }}
                            disabled={!categoryPathParts[0]?.trim()}
                          >
                            Save Category
                          </button>
                          <button
                            className="text-sm px-4 py-2 rounded-md border border-input hover:bg-muted font-medium"
                            onClick={() => {
                              setIsEditingCategory(false);
                              setIsAddingSubcategory(false);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedConcept.relatedConcepts.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Related to: {formatRelatedConcepts(selectedConcept.relatedConcepts)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteConcept(selectedConcept.id)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center text-destructive rounded-md hover:bg-destructive/10 px-2 py-1 text-sm"
                  aria-label="Delete concept"
                  title="Delete concept"
                >
                  {isDeleting ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 animate-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Tabs for concept details */}
              <div className="w-full">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
                  <button 
                    onClick={() => setSelectedTab("summary")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "summary" ? "bg-background text-foreground shadow-sm" : ""}`}
                  >
                    Summary
                  </button>
                  <button 
                    onClick={() => setSelectedTab("details")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "details" ? "bg-background text-foreground shadow-sm" : ""}`}
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => setSelectedTab("code")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "code" ? "bg-background text-foreground shadow-sm" : ""}`}
                  >
                    Code Snippets
                  </button>
                </div>

                {/* Tab content */}
                {selectedTab === "summary" && (
                  <div className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-line">{selectedConcept.summary}</p>
                    </div>

                    {selectedConcept.keyPoints?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">Key Points</h3>
                        <ul className="space-y-1 list-disc list-inside text-sm">
                          {selectedConcept.keyPoints.map((point, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: 0.1 * index }}
                            >
                              {point}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === "details" && (
                  <div className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {selectedConcept?.details?.implementation ? (
                        <div className="space-y-4">
                          {selectedConcept.details.implementation.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-sm leading-relaxed">
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                      ) : selectedConcept?.details ? (
                        <div className="space-y-4">
                          {(typeof selectedConcept.details === 'string' ? selectedConcept.details : JSON.stringify(selectedConcept.details))
                            .split('\n\n')
                            .filter(paragraph => paragraph.trim().length > 0)
                            .map((paragraph, index) => (
                              <p key={index} className="text-sm leading-relaxed">
                                {paragraph.trim()}
                              </p>
                            ))}
                        </div>
                      ) : (
                        <p className="italic text-muted-foreground">No detailed information available for this concept.</p>
                      )}
                      
                      {/* Complexity section */}
                      {selectedConcept?.details?.complexity &&
                        ((selectedConcept.details.complexity.time && !['O(n)', 'O(1)', ''].includes(selectedConcept.details.complexity.time)) ||
                         (selectedConcept.details.complexity.space && !['O(n)', 'O(1)', ''].includes(selectedConcept.details.complexity.space)) ||
                         ((selectedConcept.category || '').toLowerCase().includes('algorithm') || (selectedConcept.category || '').toLowerCase().includes('data structure'))) && (
                          <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">Complexity</h3>
                            <ul className="space-y-1 list-disc list-inside text-sm">
                              {selectedConcept.details.complexity.time && !['O(n)', 'O(1)', ''].includes(selectedConcept.details.complexity.time) && (
                                <li><strong>Time:</strong> {selectedConcept.details.complexity.time}</li>
                              )}
                              {selectedConcept.details.complexity.space && !['O(n)', 'O(1)', ''].includes(selectedConcept.details.complexity.space) && (
                                <li><strong>Space:</strong> {selectedConcept.details.complexity.space}</li>
                              )}
                            </ul>
                          </div>
                        )}
                      
                      {/* Use Cases section */}
                      {selectedConcept?.details?.useCases && selectedConcept.details.useCases.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Use Cases</h3>
                          <ul className="space-y-1 list-disc list-inside text-sm">
                            {selectedConcept.details.useCases.map((useCase, index) => (
                              <li key={index}>{useCase}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Edge Cases section */}
                      {selectedConcept?.details?.edgeCases && selectedConcept.details.edgeCases.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Edge Cases</h3>
                          <ul className="space-y-1 list-disc list-inside text-sm">
                            {selectedConcept.details.edgeCases.map((edgeCase, index) => (
                              <li key={index}>{edgeCase}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Performance section */}
                      {selectedConcept?.details?.performance && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Performance</h3>
                          <p>{selectedConcept.details.performance}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === "code" && (
                  <div className="space-y-4">
                    {selectedConcept.codeSnippets && selectedConcept.codeSnippets.length > 0 ? (
                      <div className="space-y-6">
                        {selectedConcept.codeSnippets.map((snippet, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                {snippet.language}
                              </div>
                              <div className="flex items-center gap-2">
                                {snippet.description && (
                                  <div className="text-xs text-muted-foreground">{snippet.description}</div>
                                )}
                                <button
                                  onClick={() => handleDeleteCodeSnippet(selectedConcept.id, index)}
                                  className="inline-flex items-center justify-center text-destructive rounded-md hover:bg-destructive/10 p-1"
                                  aria-label="Delete code snippet"
                                  title="Delete code snippet"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3.5 w-3.5"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                              <code>{snippet.code}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No code snippets available for this concept
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related concepts section */}
          {selectedConcept.relatedConcepts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="py-4 px-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 text-primary"
                    >
                      <rect x="16" y="16" width="6" height="6" rx="1" />
                      <rect x="2" y="16" width="6" height="6" rx="1" />
                      <rect x="9" y="2" width="6" height="6" rx="1" />
                      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                      <path d="M12 12V8" />
                    </svg>
                    Related Concepts
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {selectedConcept.relatedConcepts.map((relatedTitle, index) => {
                      // First check if the related concept exists in the current analysis
                      const relatedConceptInAnalysis = analysisResult.concepts.find((c) => c.title === relatedTitle)
                      
                      return (
                        <motion.div
                          key={`${relatedTitle}-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                        >
                          {relatedConceptInAnalysis ? (
                            // Existing concept in current analysis - can be clicked to navigate
                            <button
                              onClick={() => setSelectedConcept(relatedConceptInAnalysis)}
                              className="inline-flex items-center justify-center rounded-md border bg-background text-sm font-medium shadow-sm h-9 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                              title={`View ${relatedTitle} concept`}
                            >
                              {relatedTitle}
                            </button>
                          ) : (
                            // Check if concept exists in database before showing as missing
                            <button
                              onClick={async () => {
                                try {
                                  const conceptCheck = await checkConceptExists(relatedTitle)
                                  
                                  if (conceptCheck.exists && conceptCheck.id) {
                                    // Concept exists in database - create bidirectional relationship and navigate
                                    const conceptId = conceptCheck.id
                                    
                                    // Double-check by making a quick request to the concept endpoint
                                    try {
                                      const verifyResponse = await fetch(`/api/concepts/${conceptId}`)
                                      if (verifyResponse.ok) {
                                        // Concept is valid, create relationship if selectedConcept has an ID
                                        if (selectedConcept && selectedConcept.id && !selectedConcept.id.startsWith('temp-')) {
                                          try {
                                            // Create bidirectional relationship
                                            const linkResponse = await fetch('/api/concepts/link', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({
                                                conceptId1: selectedConcept.id,
                                                conceptId2: conceptId
                                              })
                                            })
                                            
                                                                                         if (linkResponse.ok) {
                                               toast({
                                                 title: "Concepts Linked!",
                                                 description: `"${selectedConcept.title}" has been linked to "${relatedTitle}"`,
                                                 duration: 3000,
                                               })
                                               
                                               // Trigger storage event to notify other tabs/pages
                                               localStorage.setItem('conceptLinked', JSON.stringify({
                                                 sourceId: selectedConcept.id,
                                                 targetId: conceptId,
                                                 timestamp: Date.now()
                                               }));
                                             }
                                          } catch (linkError) {
                                            console.error('Error linking concepts:', linkError)
                                          }
                                        }
                                        
                                        // Navigate to the concept
                                        window.location.href = `/concept/${conceptId}`
                                      } else {
                                        // Concept doesn't actually exist, treat as missing
                                        showAddConceptDialog(relatedTitle)
                                      }
                                    } catch (verifyError) {
                                      console.error('Error verifying concept:', verifyError)
                                      // On verification error, treat as missing concept
                                      showAddConceptDialog(relatedTitle)
                                    }
                                  } else {
                                    // Concept truly doesn't exist - show confirmation dialog
                                    showAddConceptDialog(relatedTitle)
                                  }
                                } catch (error) {
                                  console.error('Error checking concept existence:', error)
                                  // On any error, treat as missing concept
                                  showAddConceptDialog(relatedTitle)
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-dashed border-primary/50 bg-background text-sm font-medium text-primary h-9 px-3 hover:bg-primary/10 hover:border-primary transition-colors"
                              title={`Check "${relatedTitle}" concept`}
                            >
                              {relatedTitle}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-1 h-3 w-3"
                              >
                                <path d="M7 17L17 7" />
                                <path d="M7 7h10v10" />
                              </svg>
                            </button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Concept map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="py-3 px-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4 text-primary"
                  >
                    <rect x="16" y="16" width="6" height="6" rx="1" />
                    <rect x="2" y="16" width="6" height="6" rx="1" />
                    <rect x="9" y="2" width="6" height="6" rx="1" />
                    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                    <path d="M12 12V8" />
                  </svg>
                  Concept Map
                </h3>
              </div>
              <div className="p-6">
                <div className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    {analysisResult.conceptMap.map((item, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 mr-1 mt-0.5 text-primary"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        // Empty state when no concept is selected
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 text-muted-foreground mx-auto mb-4"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <h3 className="text-lg font-medium">Select a concept</h3>
            <p className="text-muted-foreground">Choose a concept from the sidebar to view details</p>
          </div>
        </div>
      )}
      
      {/* Concept Match Dialog */}
      {handleConceptMatchDecision && (
        <ConceptMatchDialog
          open={showConceptMatchDialog}
          matches={conceptMatches}
          isProcessing={isProcessingMatches}
          onDecision={handleConceptMatchDecision}
        />
      )}
      
      {/* Conversation Save Dialog */}
      {handleSaveConversationDecision && handleSkipSavingDecision && (
        <ConversationSaveDialog
          open={showConversationSaveDialog}
          updatedConceptsCount={updatedConceptsCount}
          onSaveConversation={handleSaveConversationDecision}
          onSkipSaving={handleSkipSavingDecision}
          isProcessing={isSaving}
        />
      )}
    </motion.div>
  )
} 