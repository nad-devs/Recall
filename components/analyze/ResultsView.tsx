"use client"

import { formatRelatedConcepts } from "@/lib/utils"
import { ConversationAnalysis, Concept } from '@/lib/types/conversation'
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import React from "react"
import { Autocomplete } from "@/components/ui/autocomplete"
import { ConceptMatchDialog } from "./ConceptMatchDialog"
import { ConversationSaveDialog } from "./ConversationSaveDialog"
import { getAuthHeaders, makeAuthenticatedRequest } from '@/lib/auth-utils'

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
  // Analysis result update function
  setAnalysisResult?: (analysisResult: ConversationAnalysis) => void
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
    // Analysis result update function
    setAnalysisResult,
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

  // Add suggested related concepts state
  const [suggestedRelatedConcepts, setSuggestedRelatedConcepts] = useState<Array<{id: string, title: string, category: string}>>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Fetch categories for the picker and autocomplete
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        // Check authentication first
        const userEmail = localStorage.getItem('userEmail')
        const userId = localStorage.getItem('userId')
        
        // Get authentication headers
        const headers = getAuthHeaders()
        
        try {
          const categoriesRes = await fetch("/api/categories", { headers })
          
          if (!categoriesRes.ok) {
            console.error('🔧 ResultsView - Categories API failed:', categoriesRes.status, categoriesRes.statusText)
            if (categoriesRes.status === 401) {
              console.warn('🔧 ResultsView - Authentication error when fetching categories')
              
              // Provide default categories
              setCategoryOptions([
                { value: "Algorithms", label: "Algorithms", description: "Default category" },
                { value: "Data Structures", label: "Data Structures", description: "Default category" },
                { value: "LeetCode Problems", label: "LeetCode Problems", description: "Default category" },
                { value: "System Design", label: "System Design", description: "Default category" },
                { value: "Backend Engineering", label: "Backend Engineering", description: "Default category" },
                { value: "Frontend Engineering", label: "Frontend Engineering", description: "Default category" },
                { value: "Algorithm Technique", label: "Algorithm Technique", description: "Default category" }
              ])
              
              // Don't show toast for auth errors - handled elsewhere
              return
            }
            throw new Error(`Categories API failed: ${categoriesRes.status}`)
          }
          
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
          
          // Now try to fetch concepts for additional categories
          const conceptsRes = await fetch("/api/concepts", { headers })
          
          if (!conceptsRes.ok) {
            console.error('🔧 ResultsView - Concepts API failed:', conceptsRes.status, conceptsRes.statusText)
            // Continue with just categories data
          } else {
            const conceptsData = await conceptsRes.json()
            
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
            
            // Add default categories if none exist
            if (options.length === 0) {
              const defaultCategories = [
                "Algorithms",
                "Data Structures", 
                "LeetCode Problems",
                "System Design",
                "Backend Engineering",
                "Frontend Engineering",
                "Algorithm Technique"
              ]
              
              defaultCategories.forEach(cat => {
                options.push({
                  value: cat,
                  label: cat,
                  description: 'Default category'
                })
              })
            }
            
            // Sort options
            options.sort((a, b) => a.label.localeCompare(b.label))
            
            setCategoryOptions(options)
          }
        } catch (error) {
          console.error('🔧 ResultsView - Error in API calls:', error)
          
          // Provide fallback categories
          setCategoryOptions([
            { value: "Algorithms", label: "Algorithms", description: "Default category" },
            { value: "Data Structures", label: "Data Structures", description: "Default category" },
            { value: "LeetCode Problems", label: "LeetCode Problems", description: "Default category" },
            { value: "System Design", label: "System Design", description: "Default category" },
            { value: "Backend Engineering", label: "Backend Engineering", description: "Default category" },
            { value: "Frontend Engineering", label: "Frontend Engineering", description: "Default category" },
            { value: "Algorithm Technique", label: "Algorithm Technique", description: "Default category" }
          ])
        }
      } catch (error) {
        console.error('🔧 ResultsView - Error fetching categories:', error)
        
        // Provide fallback categories
        setCategoryOptions([
          { value: "Algorithms", label: "Algorithms", description: "Default category" },
          { value: "Data Structures", label: "Data Structures", description: "Default category" },
          { value: "LeetCode Problems", label: "LeetCode Problems", description: "Default category" },
          { value: "System Design", label: "System Design", description: "Default category" },
          { value: "Backend Engineering", label: "Backend Engineering", description: "Default category" },
          { value: "Frontend Engineering", label: "Frontend Engineering", description: "Default category" },
          { value: "Algorithm Technique", label: "Algorithm Technique", description: "Default category" }
        ])
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

  // Fetch suggested related concepts when selectedConcept changes
  useEffect(() => {
    const fetchSuggestedRelatedConcepts = async () => {
      if (!selectedConcept) {
        setSuggestedRelatedConcepts([])
        return
      }

      setIsLoadingSuggestions(true)
      try {
        // Prepare authentication headers
        const headers = getAuthHeaders()

        // Fetch all concepts to find suggestions
        const response = await fetch('/api/concepts', { headers })
        if (!response.ok) {
          throw new Error('Failed to fetch concepts')
        }

        const data = await response.json()
        const allConcepts = data.concepts || []

        // Get existing related concept IDs to exclude them
        const existingRelatedIds = new Set<string>()
        if (selectedConcept.relatedConcepts) {
          try {
            const relatedConcepts = typeof selectedConcept.relatedConcepts === 'string' 
              ? JSON.parse(selectedConcept.relatedConcepts)
              : selectedConcept.relatedConcepts
            
            if (Array.isArray(relatedConcepts)) {
              relatedConcepts.forEach((rel: any) => {
                if (rel.id) existingRelatedIds.add(rel.id)
              })
            }
          } catch (e) {
            console.error('Error parsing related concepts:', e)
          }
        }

        // Find suggested concepts based on:
        // 1. Same category
        // 2. Similar keywords in title/summary
        // 3. Common techniques (for algorithm problems)
        const suggestions = allConcepts
          .filter((concept: any) => 
            concept.id !== selectedConcept.id && // Not the same concept
            !existingRelatedIds.has(concept.id) // Not already related
          )
          .map((concept: any) => {
            let score = 0
            
            // Same category gets high score
            if (concept.category === selectedConcept.category) {
              score += 10
            }
            
            // Similar category (same root) gets medium score
            if (concept.category && selectedConcept.category) {
              const conceptRoot = concept.category.split(' > ')[0]
              const selectedRoot = selectedConcept.category.split(' > ')[0]
              if (conceptRoot === selectedRoot && concept.category !== selectedConcept.category) {
                score += 5
              }
            }
            
            // Common keywords in title
            const conceptWords = concept.title.toLowerCase().split(/\s+/)
            const selectedWords = selectedConcept.title.toLowerCase().split(/\s+/)
            const commonWords = conceptWords.filter((word: string) => 
              selectedWords.includes(word) && word.length > 3
            )
            score += commonWords.length * 2
            
            // Algorithm/technique relationships
            const algorithmKeywords = ['hash', 'array', 'tree', 'graph', 'sort', 'search', 'dynamic', 'two pointer', 'sliding window']
            const conceptHasAlgoKeywords = algorithmKeywords.some(keyword => 
              concept.title.toLowerCase().includes(keyword) || 
              (concept.summary && concept.summary.toLowerCase().includes(keyword))
            )
            const selectedHasAlgoKeywords = algorithmKeywords.some(keyword => 
              selectedConcept.title.toLowerCase().includes(keyword) || 
              (selectedConcept.summary && selectedConcept.summary.toLowerCase().includes(keyword))
            )
            
            if (conceptHasAlgoKeywords && selectedHasAlgoKeywords) {
              score += 3
            }
            
            return { ...concept, score }
          })
          .filter((concept: any) => concept.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 6) // Top 6 suggestions
          .map((concept: any) => ({
            id: concept.id,
            title: concept.title,
            category: concept.category || 'Uncategorized'
          }))

        setSuggestedRelatedConcepts(suggestions)
      } catch (error) {
        console.error('Error fetching suggested related concepts:', error)
        setSuggestedRelatedConcepts([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestedRelatedConcepts()
  }, [selectedConcept])

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
      // Check if this is a temporary concept (not saved to database yet)
      const isTemporaryConcept = selectedConcept.id.startsWith('temp-') || selectedConcept.id.startsWith('concept-')
      
      if (isTemporaryConcept) {
        // For temporary concepts, update locally in the analysis result
        const updatedConcept = {
          ...selectedConcept,
          title: editingTitleValue.trim(),
          lastUpdated: new Date().toISOString()
        }
        
        // Update the selected concept
        setSelectedConcept(updatedConcept)
        
        // Update the concept in the analysis result if setAnalysisResult is available
        if (analysisResult && setAnalysisResult) {
          const updatedConcepts = analysisResult.concepts.map(concept => 
            concept.id === selectedConcept.id 
              ? updatedConcept 
              : concept
          )
          
          setAnalysisResult({
            ...analysisResult,
            concepts: updatedConcepts
          })
        }

        toast({
          title: "Title updated",
          description: `Concept title changed to "${editingTitleValue.trim()}"`,
        })
      } else {
        // For saved concepts, make API call to update in database
        const headers = getAuthHeaders()

        const response = await fetch(`/api/concepts/${selectedConcept.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: editingTitleValue.trim()
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update title')
        }

        const result = await response.json()
        
        // Update the selected concept with the response data
        const updatedConcept = {
          ...selectedConcept,
          title: editingTitleValue.trim(),
          lastUpdated: new Date().toISOString()
        }
        
        setSelectedConcept(updatedConcept)

        toast({
          title: "Title updated",
          description: `Concept title changed to "${editingTitleValue.trim()}"`,
        })
      }

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

  // Handle adding a suggested related concept
  const handleAddSuggestedConcept = async (suggestedConcept: {id: string, title: string, category: string}) => {
    if (!selectedConcept) return

    try {
      // Get current related concepts
      let currentRelated: any[] = []
      if (selectedConcept.relatedConcepts) {
        try {
          currentRelated = typeof selectedConcept.relatedConcepts === 'string' 
            ? JSON.parse(selectedConcept.relatedConcepts)
            : selectedConcept.relatedConcepts
          
          if (!Array.isArray(currentRelated)) {
            currentRelated = []
          }
        } catch (e) {
          currentRelated = []
        }
      }

      // Add the new related concept
      const newRelatedConcept = {
        id: suggestedConcept.id,
        title: suggestedConcept.title
      }

      const updatedRelated = [...currentRelated, newRelatedConcept]

      // Update the selected concept
      const updatedConcept = {
        ...selectedConcept,
        relatedConcepts: updatedRelated
      }

      setSelectedConcept(updatedConcept)

      // Remove from suggestions
      setSuggestedRelatedConcepts(prev => 
        prev.filter(concept => concept.id !== suggestedConcept.id)
      )

      toast({
        title: "Related concept added",
        description: `Added "${suggestedConcept.title}" as a related concept`,
      })
    } catch (error) {
      console.error('Error adding suggested concept:', error)
      toast({
        title: "Error",
        description: "Failed to add related concept. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Modal-style background overlay for category editing */}
      {isEditingCategory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => {
              setEditCategoryValue(selectedConcept?.category || "Uncategorized")
              setRootCategory("")
              setSubCategory("")
              setIsEditingCategory(false)
            }} 
          />
          <div className="relative z-[10000] bg-card border border-border rounded-lg p-6 shadow-2xl max-w-2xl w-full mx-4">
            {isLoadingCategories ? (
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-xs text-muted-foreground">Loading categories...</span>
              </div>
            ) : (
              <>
                {/* Enhanced Hierarchical Category Builder */}
                <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <label className="text-base sm:text-lg font-semibold text-foreground">Edit Category</label>
                    </div>
                    <button
                      onClick={() => {
                        setEditCategoryValue(selectedConcept?.category || "Uncategorized")
                        setRootCategory("")
                        setSubCategory("")
                        setIsEditingCategory(false)
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Root Category Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Root Category:</label>
                    <div className="relative">
                      <Autocomplete
                        options={[
                          // Default category options
                          { value: "Algorithms", label: "Algorithms", description: "Algorithm concepts and techniques" },
                          { value: "Data Structures", label: "Data Structures", description: "Data organization and storage" },
                          { value: "LeetCode Problems", label: "LeetCode Problems", description: "Coding challenges and problem-solving" },
                          { value: "System Design", label: "System Design", description: "Architecture and scalability" },
                          { value: "Backend Engineering", label: "Backend Engineering", description: "Server-side development" },
                          { value: "Frontend Engineering", label: "Frontend Engineering", description: "Client-side development" },
                          { value: "Machine Learning", label: "Machine Learning", description: "ML algorithms and models" },
                          { value: "Database Design", label: "Database Design", description: "Data modeling and queries" },
                          { value: "DevOps", label: "DevOps", description: "Development operations" },
                          { value: "Software Engineering", label: "Software Engineering", description: "General programming concepts" },
                          { value: "Cloud Computing", label: "Cloud Computing", description: "Cloud services and architecture" },
                          // Filter existing root categories (not subcategories)
                          ...categoryOptions
                            .filter(opt => !opt.value.includes(' > '))
                            .map(opt => ({
                              ...opt,
                              label: opt.value,
                              description: opt.description || 'Existing category'
                            }))
                        ].reduce((unique, item) => {
                          // Remove duplicates based on value
                          if (!unique.find(u => u.value === item.value)) {
                            unique.push(item);
                          }
                          return unique;
                        }, [] as any[])}
                        value={rootCategory}
                        onChange={setRootCategory}
                        placeholder="Select or type a root category..."
                        className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm"
                        autoSelectOnFocus={true}
                      />
                    </div>
                  </div>
                  
                  {/* Subcategory Selection */}
                  {rootCategory && (
                    <div className="space-y-3 bg-white/70 dark:bg-slate-800/70 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory (Optional):</label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <Autocomplete
                          options={[
                            // Show existing subcategories for this root
                            ...categoryOptions
                              .filter(opt => opt.value.startsWith(rootCategory + ' > '))
                              .map(opt => ({
                                ...opt,
                                label: opt.value.split(' > ')[1],
                                value: opt.value.split(' > ')[1],
                                description: 'Existing subcategory'
                              })),
                            // Common subcategories based on root category
                            ...(rootCategory === 'Algorithms' ? [
                              { value: 'Sorting', label: 'Sorting', description: 'Sorting algorithms' },
                              { value: 'Graph Algorithms', label: 'Graph Algorithms', description: 'Graph traversal and algorithms' },
                              { value: 'Dynamic Programming', label: 'Dynamic Programming', description: 'DP techniques and patterns' },
                              { value: 'Greedy Algorithms', label: 'Greedy Algorithms', description: 'Greedy approach algorithms' },
                              { value: 'Binary Search', label: 'Binary Search', description: 'Binary search variations' }
                            ] : rootCategory === 'LeetCode Problems' ? [
                              { value: 'Arrays and Hashing', label: 'Arrays and Hashing', description: 'Array and hash table problems' },
                              { value: 'Two Pointers', label: 'Two Pointers', description: 'Two pointer technique problems' },
                              { value: 'Sliding Window', label: 'Sliding Window', description: 'Sliding window problems' },
                              { value: 'Stack', label: 'Stack', description: 'Stack-based problems' },
                              { value: 'Binary Search', label: 'Binary Search', description: 'Binary search problems' },
                              { value: 'Linked Lists', label: 'Linked Lists', description: 'Linked list problems' },
                              { value: 'Trees', label: 'Trees', description: 'Tree traversal and manipulation' },
                              { value: 'Graphs', label: 'Graphs', description: 'Graph algorithms and traversal' },
                              { value: 'Dynamic Programming', label: 'Dynamic Programming', description: 'DP problems' },
                              { value: 'Greedy', label: 'Greedy', description: 'Greedy algorithm problems' },
                              { value: 'Intervals', label: 'Intervals', description: 'Interval-based problems' },
                              { value: 'Math & Geometry', label: 'Math & Geometry', description: 'Mathematical problems' }
                            ] : rootCategory === 'Data Structures' ? [
                              { value: 'Arrays', label: 'Arrays', description: 'Array-based structures' },
                              { value: 'Linked Lists', label: 'Linked Lists', description: 'Linked list variations' },
                              { value: 'Trees', label: 'Trees', description: 'Tree structures' },
                              { value: 'Hash Tables', label: 'Hash Tables', description: 'Hash-based structures' },
                              { value: 'Heaps', label: 'Heaps', description: 'Heap and priority queue' }
                            ] : rootCategory === 'System Design' ? [
                              { value: 'Scalability', label: 'Scalability', description: 'Scaling strategies' },
                              { value: 'Load Balancing', label: 'Load Balancing', description: 'Load distribution' },
                              { value: 'Caching', label: 'Caching', description: 'Caching strategies' },
                              { value: 'Microservices', label: 'Microservices', description: 'Service architecture' },
                              { value: 'Database Sharding', label: 'Database Sharding', description: 'Data distribution' }
                            ] : rootCategory === 'Backend Engineering' ? [
                              { value: 'APIs', label: 'APIs', description: 'API design and development' },
                              { value: 'Authentication', label: 'Authentication', description: 'Auth and security' },
                              { value: 'Performance', label: 'Performance', description: 'Backend optimization' },
                              { value: 'Testing', label: 'Testing', description: 'Backend testing strategies' },
                              { value: 'Deployment', label: 'Deployment', description: 'Deployment strategies' }
                            ] : rootCategory === 'Frontend Engineering' ? [
                              { value: 'React', label: 'React', description: 'React framework' },
                              { value: 'State Management', label: 'State Management', description: 'Application state' },
                              { value: 'Performance', label: 'Performance', description: 'Frontend optimization' },
                              { value: 'UI/UX', label: 'UI/UX', description: 'User interface design' },
                              { value: 'Testing', label: 'Testing', description: 'Frontend testing' }
                            ] : [
                              { value: 'General', label: 'General', description: 'General concepts' },
                              { value: 'Best Practices', label: 'Best Practices', description: 'Best practices' },
                              { value: 'Tools', label: 'Tools', description: 'Tools and utilities' }
                            ]),
                            // Always include option for no subcategory
                            { value: '', label: 'No subcategory', description: 'Use root category only' }
                          ]}
                          value={subCategory}
                          onChange={setSubCategory}
                          placeholder="Select or type a subcategory..."
                          className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        />
                        {subCategory && subCategory !== '' && !categoryOptions.some(opt => opt.value === `${rootCategory} > ${subCategory}`) && (
                          <button
                            onClick={() => {
                              // Add the new subcategory to options for future use
                              const newCategoryPath = `${rootCategory} > ${subCategory}`
                              setCategoryOptions(prev => [
                                ...prev,
                                {
                                  value: newCategoryPath,
                                  label: newCategoryPath,
                                  description: 'Custom subcategory'
                                }
                              ])
                              
                              toast({
                                title: "Subcategory Added",
                                description: `"${subCategory}" added as a new subcategory under "${rootCategory}"`,
                              })
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto"
                            title="Add new subcategory"
                          >
                            <svg className="h-4 w-4 sm:mr-0 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"/>
                            </svg>
                            <span className="sm:hidden">Add Subcategory</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Preview */}
                  {rootCategory && (
                    <div className="space-y-2 bg-blue-50 dark:bg-blue-950/50 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Preview:</label>
                      <div className="text-base sm:text-lg font-semibold bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 break-words">
                        {subCategory ? `${rootCategory} > ${subCategory}` : rootCategory}
                      </div>
                    </div>
                  )}
                  
                  {/* Alternative: Direct Input */}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Or enter custom category path:</label>
                    <Autocomplete
                      options={categoryOptions}
                      value={editCategoryValue}
                      onChange={(value) => {
                        setEditCategoryValue(value)
                        // Parse the value to update root and sub category
                        if (value.includes(' > ')) {
                          const parts = value.split(' > ')
                          setRootCategory(parts[0])
                          setSubCategory(parts[1] || '')
                        } else {
                          setRootCategory(value)
                          setSubCategory('')
                        }
                      }}
                      placeholder="e.g., Data Structures > Hash Tables"
                      className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      autoSelectOnFocus={true}
                    />
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => {
                      setEditCategoryValue(selectedConcept?.category || "Uncategorized")
                      setRootCategory("")
                      setSubCategory("")
                      setIsEditingCategory(false)
                    }}
                    disabled={isSaving || isLoadingCategories}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const finalCategory = subCategory 
                        ? `${rootCategory} > ${subCategory}` 
                        : rootCategory || editCategoryValue
                      handleCategoryUpdate(finalCategory)
                    }}
                    disabled={isSaving || isLoadingCategories || (!rootCategory && !editCategoryValue)}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17,21 17,13 7,13 7,21"/>
                          <polyline points="7,3 7,8 15,8"/>
                        </svg>
                        Save Category
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
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
            <div className="flex flex-col p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  {/* Title editing */}
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-3 mb-2">
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
                        className="text-3xl font-bold tracking-tight bg-background border rounded px-3 py-2 flex-1"
                        autoFocus
                        disabled={isSavingTitle}
                      />
                      <button 
                        onClick={handleTitleSave}
                        disabled={isSavingTitle}
                        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
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
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 mb-2 group">
                      <h2 className="text-3xl font-bold tracking-tight">
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
                  <div className="flex items-center text-sm text-muted-foreground mb-6">
                    <div className="flex items-center space-x-3 group">
                      <span className="inline-block px-3 py-1 rounded-full bg-muted">
                        {selectedConcept.category || "Uncategorized"}
                      </span>
                      <button
                        onClick={() => {
                          const currentCategory = selectedConcept.category || "Uncategorized"
                          setEditCategoryValue(currentCategory)
                          
                          // Parse existing category for hierarchical editing
                          if (currentCategory.includes(' > ')) {
                            const parts = currentCategory.split(' > ')
                            setRootCategory(parts[0])
                            setSubCategory(parts[1] || '')
                          } else {
                            setRootCategory(currentCategory === "Uncategorized" ? "" : currentCategory)
                            setSubCategory("")
                          }
                          
                          setIsEditingCategory(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-accent"
                        title="Edit category"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-lg text-card-foreground mb-6 leading-relaxed">
                    {selectedConcept.summary}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDeleteConcept(selectedConcept.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center rounded-md border border-destructive text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10 disabled:opacity-50"
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
              <div className="border-b mb-8">
                <div className="flex -mb-px space-x-12">
                  <button
                    className={`pb-4 text-base font-medium transition-colors ${
                      selectedTab === "summary"
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedTab("summary")}
                  >
                    Summary
                  </button>
                  <button
                    className={`pb-4 text-base font-medium transition-colors ${
                      selectedTab === "details"
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedTab("details")}
                  >
                    Details
                  </button>
                  <button
                    className={`pb-4 text-base font-medium transition-colors ${
                      selectedTab === "code"
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedTab("code")}
                  >
                    Code Examples
                  </button>
                  <button
                    className={`pb-4 text-base font-medium transition-colors ${
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
                <div className="space-y-6">
                  <h3 className="font-semibold text-xl">Summary</h3>
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="text-base leading-relaxed text-foreground">
                      {selectedConcept.summary || "No summary available."}
                    </p>
                  </div>
                  
                  {selectedConcept.keyPoints && selectedConcept.keyPoints.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-lg mb-4">Key Points</h4>
                      <ul className="list-disc pl-6 space-y-3">
                        {selectedConcept.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-foreground leading-relaxed">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === "details" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-xl">Details</h3>
                  <div className="prose max-w-none dark:prose-invert">
                    {selectedConcept.details ? (
                      <div className="whitespace-pre-line leading-relaxed text-foreground">
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
                    <div className="mt-8">
                      <h3 className="font-semibold text-xl mb-4">Key Points</h3>
                      <ul className="list-disc pl-6 space-y-3">
                        {selectedConcept.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-foreground leading-relaxed">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === "code" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-xl">Code Examples</h3>
                  {selectedConcept.codeSnippets && selectedConcept.codeSnippets.length > 0 ? (
                    <div className="space-y-8">
                      {selectedConcept.codeSnippets.map((snippet: any, index: number) => (
                        <div key={index} className="rounded-md border bg-muted p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded">
                                {snippet.language || "Code"}
                              </span>
                              {snippet.description && (
                                <span className="ml-3 text-base text-muted-foreground">
                                  {snippet.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <pre className="overflow-x-auto p-4 text-sm bg-background rounded border">
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xl">Related Concepts</h3>
                    <button
                      onClick={() => setShowAddConceptCard(true)}
                      className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add Related Concept
                    </button>
                  </div>

                  {/* Suggested Related Concepts */}
                  {(suggestedRelatedConcepts.length > 0 || isLoadingSuggestions) && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg text-muted-foreground">Suggested Related Concepts</h4>
                      {isLoadingSuggestions ? (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-sm">Finding related concepts...</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {suggestedRelatedConcepts.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleAddSuggestedConcept(suggestion)}
                              className="inline-flex items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors"
                              title={`Add "${suggestion.title}" as related concept`}
                            >
                              <svg className="h-3 w-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              {suggestion.title}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({suggestion.category})
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing Related Concepts */}
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
                      <div className="space-y-3">
                        <h4 className="font-medium text-base">Current Related Concepts</h4>
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
        
        {/* Dialog components - Move outside conditional rendering for better visibility */}
        {handleConceptMatchDecision && (
          <ConceptMatchDialog
            open={showConceptMatchDialog}
            matches={conceptMatches}
            isProcessing={isProcessingMatches}
            onDecision={handleConceptMatchDecision}
          />
        )}
        
        {handleSaveConversationDecision && handleSkipSavingDecision && (
          <ConversationSaveDialog
            open={showConversationSaveDialog}
            updatedConceptsCount={updatedConceptsCount}
            onSaveConversation={handleSaveConversationDecision}
            onSkipSaving={handleSkipSavingDecision}
            isProcessing={isSaving}
          />
        )}
      </div>
    </>
  )
} 