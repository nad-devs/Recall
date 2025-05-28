"use client"

import { formatRelatedConcepts } from "@/lib/utils"
import { ConversationAnalysis, Concept } from '@/lib/types/conversation'
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import React from "react"
import { Autocomplete } from "@/components/ui/autocomplete"
import { ConceptMatchDialog } from "./ConceptMatchDialog"
import { ConversationSaveDialog } from "./ConversationSaveDialog"

// Define proper props interfaces for the dialog components
interface ConceptMatchDialogProps {
  open: boolean;
  matches: any[];
  isProcessing: boolean;
  onDecision: (matchIndex: number, shouldUpdate: boolean) => void;
}

interface ConversationSaveDialogProps {
  open: boolean;
  updatedConceptsCount: number;
  onSaveConversation: () => void;
  onSkipSaving: () => void;
  isProcessing: boolean;
}

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
  
  // Add title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState("")
  const [isSavingTitle, setIsSavingTitle] = useState(false)

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
        
        // Sort options
        options.sort((a, b) => a.label.localeCompare(b.label))
        
        setCategoryOptions(options)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

  // Handle title save
  const handleTitleSave = async () => {
    if (!selectedConcept || editingTitleValue.trim() === selectedConcept.title) {
      setIsEditingTitle(false)
      return
    }

    if (!editingTitleValue.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSavingTitle(true)
    try {
      // Update the selected concept
      const updatedConcept = {
        ...selectedConcept,
        title: editingTitleValue.trim()
      }
      
      setSelectedConcept(updatedConcept)

      toast({
        title: "Title updated",
        description: `Concept title changed to "${editingTitleValue.trim()}"`,
      })

      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
      toast({
        title: "Error",
        description: "Failed to update title. Please try again.",
        variant: "destructive",
      })
      setEditingTitleValue(selectedConcept.title || "")
    } finally {
      setIsSavingTitle(false)
    }
  }

  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Save button at the top */}
      {analysisResult && (
        <div className="flex justify-end mb-4">
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
        </div>
      )}

      {/* Save error display */}
      {saveError && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4">
          {saveError}
        </div>
      )}

      {/* Concept confirmation dialog */}
      {showConceptConfirmation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
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
        </div>
      )}

      {/* Dialog components */}
      {showConceptMatchDialog && handleConceptMatchDecision && (
        <ConceptMatchDialog
          open={showConceptMatchDialog}
          matches={conceptMatches}
          isProcessing={isProcessingMatches}
          onDecision={handleConceptMatchDecision}
        />
      )}
      
      {showConversationSaveDialog && handleSaveConversationDecision && handleSkipSavingDecision && (
        <ConversationSaveDialog
          open={showConversationSaveDialog}
          updatedConceptsCount={updatedConceptsCount}
          onSaveConversation={handleSaveConversationDecision}
          onSkipSaving={handleSkipSavingDecision}
          isProcessing={false}
        />
      )}

      {/* Main content */}
      {showAddConceptCard ? (
        // Add Concept Card
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm group">
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              Add a concept that wasn't identified in the conversation.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const inputEl = e.currentTarget.querySelector('input') as HTMLInputElement;
              if (inputEl.value.trim()) {
                handleAddConcept(inputEl.value.trim());
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
      ) : selectedConcept ? (
        // Display selected concept
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm group">
          <div className="flex flex-col p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                {/* Title editing */}
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2 mb-1">
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTitleSave()
                        } else if (e.key === 'Escape') {
                          setEditingTitleValue(selectedConcept.title)
                          setIsEditingTitle(false)
                        }
                      }}
                      className="text-2xl font-bold tracking-tight bg-background border rounded px-2 py-1 flex-1"
                      autoFocus
                      disabled={isSavingTitle}
                    />
                    <button 
                      onClick={handleTitleSave}
                      disabled={isSavingTitle}
                      className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-2 py-1 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSavingTitle ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingTitleValue(selectedConcept.title)
                        setIsEditingTitle(false)
                      }}
                      disabled={isSavingTitle}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium hover:bg-accent"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mb-1 group">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {selectedConcept.title}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingTitleValue(selectedConcept.title)
                        setIsEditingTitle(true)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium hover:bg-accent"
                      title="Edit title"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Category editing */}
                <div className="flex items-center text-xs text-muted-foreground mb-4">
                  {isEditingCategory ? (
                    <div className="flex items-center space-x-2">
                      {isLoadingCategories ? (
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-xs text-muted-foreground">Loading categories...</span>
                        </div>
                      ) : (
                        <>
                          <Autocomplete
                            options={categoryOptions}
                            value={editCategoryValue}
                            onChange={setEditCategoryValue}
                            placeholder="Select or type category..."
                            className="min-w-[200px]"
                          />
                          <button 
                            onClick={() => handleCategoryUpdate(editCategoryValue)}
                            disabled={isSaving || isLoadingCategories}
                            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-2 py-1 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setEditCategoryValue(selectedConcept.category || "Uncategorized")
                              setIsEditingCategory(false)
                            }}
                            disabled={isSaving || isLoadingCategories}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium hover:bg-accent"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 group">
                      <span className="inline-block px-2 py-1 rounded-full bg-muted">
                        {selectedConcept.category || "Uncategorized"}
                      </span>
                      <button
                        onClick={() => {
                          setEditCategoryValue(selectedConcept.category || "Uncategorized")
                          setIsEditingCategory(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md border border-input bg-background px-1 py-1 text-xs font-medium hover:bg-accent"
                        title="Edit category"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                  <span className="ml-2">
                    Last updated: {(selectedConcept as any).lastUpdated ? new Date((selectedConcept as any).lastUpdated).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <p className="text-base text-card-foreground mb-4">
                  {selectedConcept.summary}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteConcept(selectedConcept.id)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-md border border-destructive text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/10 disabled:opacity-50"
                  title="Delete concept"
                >
                  {isDeleting ? (
                    <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                  )}
                  Delete Concept
                </button>
              </div>
            </div>

            {/* Tabs for different concept content */}
            <div className="border-b mb-6">
              <div className="flex -mb-px space-x-8">
                <button
                  className={`pb-4 text-sm font-medium ${
                    selectedTab === "summary"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedTab("summary")}
                >
                  Summary
                </button>
                <button
                  className={`pb-4 text-sm font-medium ${
                    selectedTab === "details"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedTab("details")}
                >
                  Details
                </button>
                <button
                  className={`pb-4 text-sm font-medium ${
                    selectedTab === "code"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedTab("code")}
                >
                  Code Examples
                </button>
                <button
                  className={`pb-4 text-sm font-medium ${
                    selectedTab === "related"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedTab("related")}
                >
                  Related Concepts
                </button>
              </div>
            </div>

            {/* Tab content */}
            {selectedTab === "summary" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Summary</h3>
                <div className="prose max-w-none dark:prose-invert">
                  <p className="text-base leading-relaxed">
                    {selectedConcept.summary || "No summary available."}
                  </p>
                </div>
                
                {selectedConcept.keyPoints && selectedConcept.keyPoints.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-base mb-3">Key Points</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {selectedConcept.keyPoints.map((point: string, index: number) => (
                        <li key={index} className="text-foreground leading-relaxed">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "details" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Details</h3>
                <div className="prose max-w-none dark:prose-invert">
                  {selectedConcept.details ? (
                    <div className="whitespace-pre-line">
                      {typeof selectedConcept.details === 'string' 
                        ? selectedConcept.details 
                        : typeof selectedConcept.details === 'object' && selectedConcept.details.implementation
                          ? selectedConcept.details.implementation
                          : JSON.stringify(selectedConcept.details, null, 2)
                      }
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No detailed information available.</p>
                  )}
                </div>
                
                {selectedConcept.keyPoints && selectedConcept.keyPoints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2">Key Points</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {selectedConcept.keyPoints.map((point: string, index: number) => (
                        <li key={index} className="text-foreground">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "code" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Code Examples</h3>
                {selectedConcept.codeSnippets && selectedConcept.codeSnippets.length > 0 ? (
                  <div className="space-y-6">
                    {selectedConcept.codeSnippets.map((snippet: any, index: number) => (
                      <div key={index} className="rounded-md border bg-muted p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                              {snippet.language || "Code"}
                            </span>
                            {snippet.description && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                {snippet.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <pre className="overflow-x-auto p-2 text-sm">
                          <code className="font-mono">{snippet.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No code examples available.</p>
                )}
              </div>
            )}

            {selectedTab === "related" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Related Concepts</h3>
                  <button
                    onClick={() => setShowAddConceptCard(true)}
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add Related Concept
                  </button>
                </div>
                {(() => {
                  const relatedConcepts = selectedConcept.relatedConcepts;
                  if (!relatedConcepts) return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No related concepts found.</p>
                      <button
                        onClick={() => setShowAddConceptCard(true)}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Add First Related Concept
                      </button>
                    </div>
                  );
                  
                  const formattedConcepts = formatRelatedConcepts(relatedConcepts);
                  if (!Array.isArray(formattedConcepts) || formattedConcepts.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No related concepts found.</p>
                        <button
                          onClick={() => setShowAddConceptCard(true)}
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                          Add First Related Concept
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {formattedConcepts.map((concept: any, index: number) => (
                        <div key={index} className="group relative rounded-md border p-3 hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {concept.title || concept}
                              </h4>
                              {concept.id && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Click to view concept
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle removing related concept
                                const updatedRelatedConcepts = formattedConcepts.filter((_, i) => i !== index);
                                const updatedConcept = {
                                  ...selectedConcept,
                                  relatedConcepts: updatedRelatedConcepts
                                };
                                setSelectedConcept(updatedConcept);
                                toast({
                                  title: "Related concept removed",
                                  description: `Removed "${concept.title || concept}" from related concepts`,
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 p-1"
                              title="Remove related concept"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                          {concept.id && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  // Navigate to the related concept (if it has an ID)
                                  if (concept.id) {
                                    window.open(`/concept/${concept.id}`, '_blank');
                                  }
                                }}
                                className="text-xs text-primary hover:text-primary/80 font-medium"
                              >
                                View concept →
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : (
        // No concept selected or other state
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 text-center">
          <h3 className="text-lg font-medium mb-2">Select a concept</h3>
          <p className="text-muted-foreground">
            Choose a concept from the list to view its details, or add a new concept.
          </p>
        </div>
      )}
    </div>
  )
} 