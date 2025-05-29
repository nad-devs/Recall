"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptCard } from "@/components/concept-card"
import { ConceptsNavigation } from "@/components/concepts-navigation"
import { BookOpen, Search, ArrowLeft, Tag, Plus, X, PanelLeftClose, PanelLeftOpen, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useToast } from "@/hooks/use-toast"
import { PageTransition } from "@/components/page-transition"
import { LinkingProvider } from "@/components/concept-card"
import { ConceptsLoading } from "@/components/concepts-loading"
import { DebugDashboard } from "@/components/debug-dashboard"
import { useDebugLogger } from '@/utils/debug-logger'

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
}

// CategoryDropZone component to handle concept drops
interface CategoryDropZoneProps {
  category: string
  onDrop: (item: any, category: string) => void
  children: React.ReactNode
}

function CategoryDropZone({ category, onDrop, children }: CategoryDropZoneProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CONCEPT_CARD',
    drop: (item: any) => onDrop(item, category),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))
  
  // Connect the drop ref
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop, dropRef]);

  return (
    <div 
      ref={dropRef} 
      className={`space-y-4 ${isOver ? 'bg-primary-50 dark:bg-primary-950/20 rounded-lg p-2' : ''}`}
    >
      {children}
    </div>
  )
}

export default function ConceptsPage() {
  const router = useRouter()
  const debug = useDebugLogger('ConceptsPage')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptsByCategory, setConceptsByCategory] = useState<Record<string, Concept[]>>({})
  const [sortedCategories, setSortedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isCreatingConcept, setIsCreatingConcept] = useState(false)
  const [newConceptId, setNewConceptId] = useState<string | null>(null)
  const [newConceptTitle, setNewConceptTitle] = useState("")
  const [loadingConcepts, setLoadingConcepts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set())
  const [showNavigation, setShowNavigation] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showNeedsReview, setShowNeedsReview] = useState(false)
  
  // Add rate limiting protection
  const lastFetchTime = useRef<number>(0)
  const FETCH_RATE_LIMIT = 1000 // 1 second between requests
  
  const { toast } = useToast()

  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      console.log('🔧 Auth check - userEmail:', userEmail ? 'present' : 'missing')
      console.log('🔧 Auth check - userId:', userId ? 'present' : 'missing')
      
      // For email-based sessions
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
        console.log('🔧 Added email-based auth headers')
      } else {
        console.warn('🔧 No authentication data found in localStorage')
      }
    } else {
      console.log('🔧 Server-side environment, no localStorage available')
    }
    
    return headers
  }

  // Filter concepts based on search query, selected category, and needs review filter
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.notes && concept.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (concept.summary && concept.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Use exact category matching (not hierarchical)
    const matchesCategory = selectedCategory === null || concept.category === selectedCategory
    const matchesNeedsReview = !showNeedsReview || concept.needsReview
    
    return matchesSearch && matchesCategory && matchesNeedsReview
  })
  
  // Filter concepts by category based on search query, selected category, and needs review filter
  const filteredConceptsByCategory = Object.entries(conceptsByCategory).reduce((acc, [category, categoryItems]) => {
    // If a category is selected and this isn't it, skip
    if (selectedCategory !== null && category !== selectedCategory) {
      return acc
    }
    
    const filtered = categoryItems.filter(concept => {
      const matchesSearch = concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (concept.notes && concept.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (concept.summary && concept.summary.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesNeedsReview = !showNeedsReview || concept.needsReview
      
      return matchesSearch && matchesNeedsReview
    });
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    
    return acc;
  }, {} as Record<string, Concept[]>);
  
  // Create filtered sorted categories list
  const filteredSortedCategories = Object.keys(filteredConceptsByCategory).sort();

  // Fetch concepts function - extracted so it can be reused for refreshing - WRAP IN useCallback
  const fetchConcepts = useCallback(async () => {
    // Rate limiting protection to prevent 429 errors
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime.current
    if (timeSinceLastFetch < FETCH_RATE_LIMIT) {
      debug.logUserAction('Rate limiting: Skipping fetch request', { 
        timeSinceLastFetch, 
        rateLimitMs: FETCH_RATE_LIMIT 
      })
      console.log(`🚫 Rate limiting: Skipping fetch (${timeSinceLastFetch}ms since last fetch)`)
      return
    }
    lastFetchTime.current = now
    
    const operationId = 'fetch-concepts'
    debug.startOperation(operationId)
    debug.logUserAction('Starting concepts fetch')
    
    try {
      console.log('🔧 Starting concepts fetch...')
      debug.logUserAction('Setting loading state', { currentLoading: loading, newLoading: true })
      setLoading(true)
      setDataLoaded(false) // Reset data loaded state
      
      const headers = getAuthHeaders()
      
      console.log('Concepts page: Using headers:', headers)
      debug.logUserAction('Making API call to /api/concepts', { headers })
      
      // Add timestamp to track loading duration
      const startTime = Date.now()
      
      const response = await fetch('/api/concepts', { headers })
      const fetchDuration = Date.now() - startTime
      
      console.log(`Concepts page: Fetch completed in ${fetchDuration}ms, status:`, response.status)
      debug.logUserAction('API call completed', { duration: fetchDuration, status: response.status })
      
      if (!response.ok) {
        throw new Error('Failed to fetch concepts')
      }
      const data = await response.json()
      
      console.log('Concepts page: Fetched concepts raw response:', data)
      
      // Check if we have concepts data in the response
      if (data.concepts && Array.isArray(data.concepts)) {
        console.log(`🔧 Processing ${data.concepts.length} concepts...`)
        debug.logUserAction('Processing concepts data', { count: data.concepts.length })
        formatAndOrganizeConcepts(data.concepts)
        console.log('🔧 Concepts formatting complete')
      } else if (data.error) {
        // Handle error case
        setError(data.error || 'Failed to load concepts')
        console.error('Error in concepts response:', data.error)
        debug.logError('Error in concepts response', { error: data.error })
        formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
      } else {
        // Fallback for unexpected response format
        setError('Invalid response format')
        console.error('Unexpected concepts response format:', data)
        debug.logError('Unexpected response format', { data })
        formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
      }
      
      // Mark data as loaded AFTER processing concepts
      debug.logUserAction('Setting dataLoaded to true')
      setDataLoaded(true)
      console.log('🔧 Concepts data successfully loaded and processed')
      debug.completeOperation(operationId)
      debug.logUserAction('Concepts fetch completed successfully')
      
    } catch (error) {
      debug.failOperation(operationId, error)
      debug.logError('Failed to fetch concepts', { error })
      console.error('Failed to fetch concepts:', error)
      setError('Failed to load concepts')
      // Still mark as loaded to prevent infinite loading
      setDataLoaded(true)
      formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
    } finally {
      console.log('🔧 Setting loading to false')
      debug.logUserAction('Setting loading state to false', { currentLoading: loading })
      setLoading(false)
    }
  }, [debug]) // ONLY depend on debug, remove loading dependency

  // Refresh data function to be used after mutations - FIX DEPENDENCIES
  const refreshData = useCallback(async () => {
    debug.logUserAction('refreshData called - starting data refresh')
    await fetchConcepts()
    debug.logUserAction('refreshData completed')
  }, [fetchConcepts]) // REMOVE debug dependency

  // Auto-refresh event listener
  useEffect(() => {
    debug.logUserAction('Auto-refresh event listener effect triggered')
    const handleRefreshConcepts = () => {
      debug.logUserAction('Received refresh concepts event, refreshing data...')
      console.log('🔄 Received refresh concepts event, refreshing data...')
      refreshData()
    }

    // Listen for custom refresh events from other pages
    window.addEventListener('refreshConcepts', handleRefreshConcepts)
    
    // Cleanup listener on unmount
    return () => {
      debug.logUserAction('Cleaning up auto-refresh event listener')
      window.removeEventListener('refreshConcepts', handleRefreshConcepts)
    }
  }, []) // REMOVE refreshData and debug dependencies to prevent infinite loop

  // Initial data fetch
  useEffect(() => {
    debug.logUserAction('Initial data fetch effect triggered')
    refreshData()
  }, []) // REMOVE debug dependency to prevent infinite loop

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    console.log('🔧 Concepts: Loading animation complete. Data loaded:', dataLoaded)
    // Only hide loading screen if data has been loaded
    if (dataLoaded) {
      setShowLoadingScreen(false)
    } else {
      console.log('🔧 Concepts: Data not yet loaded, keeping loading screen visible')
      // Set a timeout to prevent infinite loading in case of errors
      setTimeout(() => {
        console.log('🔧 Concepts: Timeout reached, hiding loading screen anyway')
        setShowLoadingScreen(false)
      }, 3000)
    }
  }

  // Effect to hide loading screen once data is loaded - REMOVE debug dependency
  useEffect(() => {
    debug.logUserAction('Loading screen effect triggered', { dataLoaded, loading, showLoadingScreen })
    
    if (dataLoaded && !loading) {
      debug.logUserAction('Conditions met for hiding loading screen', { dataLoaded, loading, showLoadingScreen })
      
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        debug.logUserAction('Setting showLoadingScreen to false via timeout')
        setShowLoadingScreen(false)
      }, 500)
      
      return () => {
        debug.logUserAction('Cleaning up loading screen timeout')
        clearTimeout(timer)
      }
    } else {
      debug.logUserAction('Conditions not met for hiding loading screen', { dataLoaded, loading, showLoadingScreen })
    }
  }, [dataLoaded, loading]) // REMOVE debug dependency

  // Clean up empty categories after state updates - REMOVE debug dependency
  useEffect(() => {
    debug.logUserAction('Category cleanup effect triggered', { 
      conceptsByCategoryKeys: Object.keys(conceptsByCategory).length,
      sortedCategoriesLength: sortedCategories.length
    })
    
    setSortedCategories(prevSorted => {
      const categoriesWithConcepts = Object.keys(conceptsByCategory).filter(
        category => conceptsByCategory[category] && conceptsByCategory[category].length > 0
      );
      
      // Only update if there's actually a difference
      const shouldUpdate = prevSorted.some(cat => !categoriesWithConcepts.includes(cat)) ||
                          categoriesWithConcepts.some(cat => !prevSorted.includes(cat));
      
      if (shouldUpdate) {
        debug.logUserAction('Updating sorted categories', { 
          oldCategories: prevSorted, 
          newCategories: categoriesWithConcepts 
        })
        return categoriesWithConcepts.sort();
      }
      
      debug.logUserAction('No category update needed', { categories: prevSorted })
      return prevSorted;
    });
  }, [conceptsByCategory]) // REMOVE debug dependency

  // Process and organize the concepts by category
  const formatAndOrganizeConcepts = (conceptsData: any[]) => {
    debug.logUserAction('Starting formatAndOrganizeConcepts', { 
      conceptsDataLength: conceptsData.length,
      currentConceptsLength: concepts.length,
      currentCategoriesCount: Object.keys(conceptsByCategory).length
    })
    
    const formattedConcepts = conceptsData.map(concept => ({
      id: concept.id,
      title: concept.title,
      category: concept.category,
      notes: concept.summary,
      discussedInConversations: concept.occurrences?.map((o: any) => o.conversationId) || [],
      needsReview: concept.confidenceScore < 0.7
    }))

    debug.logUserAction('Setting formatted concepts', { count: formattedConcepts.length })
    setConcepts(formattedConcepts)

    // Group concepts by category
    const byCategory: Record<string, Concept[]> = {}

    formattedConcepts.forEach((concept) => {
      if (!byCategory[concept.category]) {
        byCategory[concept.category] = []
      }

      byCategory[concept.category].push(concept)
    })

    // Sort concepts within each category alphabetically
    Object.keys(byCategory).forEach((category) => {
      byCategory[category].sort((a, b) => a.title.localeCompare(b.title))
    })

    debug.logUserAction('Setting concepts by category', { 
      categoriesCount: Object.keys(byCategory).length,
      categories: Object.keys(byCategory)
    })
    setConceptsByCategory(byCategory)
    
    debug.logUserAction('Setting sorted categories', { 
      categories: Object.keys(byCategory).sort()
    })
    setSortedCategories(Object.keys(byCategory).sort())
    
    debug.logUserAction('formatAndOrganizeConcepts completed')
  }

  // Handle creating a new concept
  const handleAddConcept = async (title: string) => {
    try {
      setIsCreatingConcept(true)
      const headers = getAuthHeaders()
      console.log('🔧 Creating concept with title:', title)
      console.log('🔧 Using headers:', headers)
      console.log('🔧 Current window location:', typeof window !== 'undefined' ? window.location.href : 'server-side')
      
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          title,
          isManualCreation: true // Mark as manual creation so it gets lower confidence score
        }),
      })

      console.log('🔧 Response status:', response.status)
      console.log('🔧 Response URL:', response.url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔧 Error response:', errorData)
        
        // Provide more specific error messages
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please refresh the page and try again. Your session may have expired.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Authentication failed')
        } else if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Rate limited')
        } else {
          toast({
            title: "Error Creating Concept",
            description: errorData.error || 'Failed to create concept. Please try again.',
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Failed to create concept')
        }
      }

      const data = await response.json()
      console.log('🔧 Success response:', data)
      
      // Refresh data to get updated concepts (including removed placeholders)
      await refreshData()
      
      // Store the new concept ID and redirect to its edit page
      setNewConceptId(data.concept.id)
      router.push(`/concept/${data.concept.id}`)
    } catch (error) {
      console.error('Error creating concept:', error)
      // Don't show additional toast if we already showed one above
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('Authentication failed') && 
          !errorMessage.includes('Rate limited') && 
          !errorMessage.includes('Failed to create concept')) {
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } finally {
      setIsCreatingConcept(false)
    }
  }

  // Handle updating a concept's category
  const handleCategoryUpdate = (conceptId: string, newCategory: string) => {
    // Update concepts array with the new category
    setConcepts(prevConcepts => {
      const conceptToUpdate = prevConcepts.find(c => c.id === conceptId);
      if (!conceptToUpdate) return prevConcepts;
      
      const oldCategory = conceptToUpdate.category;
      
      // Skip if category hasn't changed
      if (oldCategory === newCategory) return prevConcepts;
      
      return prevConcepts.map(c => 
        c.id === conceptId ? { ...c, category: newCategory } : c
      );
    });
    
    // Update conceptsByCategory using functional updates to avoid stale state
    setConceptsByCategory(prevCategories => {
      // Find the concept in the current categories state to get the old category
      let conceptToUpdate = null;
      let oldCategory = null;
      
      // Look through all categories to find the concept
      for (const [cat, conceptsInCat] of Object.entries(prevCategories)) {
        const found = conceptsInCat.find(c => c.id === conceptId);
        if (found) {
          conceptToUpdate = found;
          oldCategory = cat;
          break;
        }
      }
      
      if (!conceptToUpdate || !oldCategory) return prevCategories;
      
      // Skip if category hasn't changed
      if (oldCategory === newCategory) return prevCategories;
      
      // Remove from old category
      const updatedOldCategoryList = (prevCategories[oldCategory] || [])
        .filter(c => c.id !== conceptId);
        
      // Add to new category (create if doesn't exist)
      const updatedNewCategoryList = prevCategories[newCategory] 
        ? [...prevCategories[newCategory], { ...conceptToUpdate, category: newCategory }]
        : [{ ...conceptToUpdate, category: newCategory }];
      
      return {
        ...prevCategories,
        [oldCategory]: updatedOldCategoryList,
        [newCategory]: updatedNewCategoryList
      };
    });
    
    // Update sortedCategories using functional updates
    setSortedCategories(prevSorted => {
      let newSorted = [...prevSorted];
      
      // Add new category if it doesn't exist
      if (!prevSorted.includes(newCategory)) {
        newSorted = [...newSorted, newCategory].sort();
      }
      
      // Note: We don't remove empty categories here to avoid race conditions
      // Empty categories will be cleaned up in the next render cycle
      
      return newSorted;
    });
  };

  // Handle concept selection
  const handleConceptSelect = (conceptId: string) => {
    setSelectedConcepts(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(conceptId)) {
        newSelected.delete(conceptId);
      } else {
        newSelected.add(conceptId);
      }
      return newSelected;
    });
  };

  // Handle dropping concepts into a category
  const handleConceptDrop = async (item: any, newCategory: string) => {
    // Get all selected concepts including the dragged one
    const conceptsToMove = new Set(selectedConcepts);
    if (item.isSelected) {
      // If dragged item was selected, move all selected items
      conceptsToMove.add(item.id);
    } else {
      // If dragged item wasn't selected, only move that item
      conceptsToMove.clear();
      conceptsToMove.add(item.id);
    }

    // Update loading state for all concepts being moved
    setLoadingConcepts(prev => [...prev, ...Array.from(conceptsToMove)]);
    
    try {
      // Update each concept
      const updatePromises = Array.from(conceptsToMove).map(async (conceptId) => {
        const response = await fetch(`/api/concepts/${conceptId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            category: newCategory,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update category for concept ${conceptId}`);
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refresh data to get updated concepts (including removed placeholders)
      await refreshData()
      
      // Show success message
      const count = conceptsToMove.size;
      toast({
        title: "Categories Updated",
        description: `${count} concept${count > 1 ? 's' : ''} moved to ${newCategory}`,
        duration: 3000,
      });
      
      // Clear selection after successful move
      setSelectedConcepts(new Set());
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({
        title: "Error",
        description: "Failed to save category changes. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Clear loading state
      setLoadingConcepts(prev => 
        prev.filter(id => !conceptsToMove.has(id))
      );
    }
  };

  // Handle deleting a concept
  const handleDeleteConcept = async (conceptId: string) => {
    try {
      const response = await fetch(`/api/concepts/${conceptId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete concept');
      }

      // Refresh data to get updated concepts list
      await refreshData();

      toast({
        title: "Concept deleted",
        description: "The concept has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting concept:', error);
      toast({
        title: "Error deleting concept",
        description: "Failed to delete the concept. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleNeedsReviewToggle = () => {
    setShowNeedsReview(!showNeedsReview)
  }

  const handleConceptsMove = async (conceptIds: string[], newCategory: string) => {
    const operationId = 'handle-concepts-move'
    debug.startOperation(operationId)
    debug.logUserAction('Starting handleConceptsMove', { conceptIds, newCategory })
    
    try {
      debug.logUserAction('Updating concepts in database using PUT method')
      
      // Update concepts in the database using PUT method (not PATCH)
      const updatePromises = conceptIds.map(async (conceptId) => {
        debug.logUserAction('Fetching current concept data', { conceptId })
        
        // First fetch the current concept to preserve other fields
        const response = await fetch(`/api/concepts/${conceptId}`, { headers: getAuthHeaders() })
        if (!response.ok) {
          throw new Error(`Failed to fetch concept ${conceptId}`)
        }
        const conceptData = await response.json()
        
        debug.logUserAction('Updating concept with new category', { conceptId, newCategory })
        
        // Update with new category while preserving other fields
        const updateResponse = await fetch(`/api/concepts/${conceptId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...conceptData,
            category: newCategory
          })
        })
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update concept ${conceptId}`)
        }
        
        return updateResponse.json()
      })
      
      debug.logUserAction('Waiting for all concept updates to complete')
      await Promise.all(updatePromises)
      
      debug.logUserAction('All concept updates completed, refreshing data')
      
      // Refresh the data to show updated concepts
      await refreshData()
      
      debug.logUserAction('Data refresh completed, showing success toast')
      
      toast({
        title: "Concepts moved successfully",
        description: `Moved ${conceptIds.length} concept(s) to "${newCategory}"`,
      })
      
      debug.completeOperation(operationId)
      debug.logUserAction('handleConceptsMove completed successfully', { conceptIds, newCategory })
      
    } catch (error) {
      debug.failOperation(operationId, error)
      debug.logError('Error moving concepts', { conceptIds, newCategory, error })
      console.error('Error moving concepts:', error)
      toast({
        title: "Error moving concepts",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show loading screen if still loading or if we haven't completed the loading animation
  if (showLoadingScreen) {
    return <ConceptsLoading onComplete={handleLoadingComplete} />
  }

  return (
    <LinkingProvider>
      <DndProvider backend={HTML5Backend}>
        <PageTransition>
          <div className="flex h-screen bg-background">
            {/* Navigation Sidebar */}
            {showNavigation && (
              <ConceptsNavigation
                concepts={concepts}
                conceptsByCategory={conceptsByCategory}
                sortedCategories={sortedCategories}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onCategorySelect={handleCategorySelect}
                selectedCategory={selectedCategory}
                showNeedsReview={showNeedsReview}
                onNeedsReviewToggle={handleNeedsReviewToggle}
                onConceptsMove={handleConceptsMove}
                onDataRefresh={refreshData}
                className="hidden md:flex"
              />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="container px-4 py-8 mx-auto max-w-none flex-1 flex flex-col min-h-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-2" asChild>
                      <Link href="/dashboard" prefetch={false}>
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2 md:hidden"
                      onClick={() => setShowNavigation(!showNavigation)}
                    >
                      {showNavigation ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2 hidden md:flex"
                      onClick={() => setShowNavigation(!showNavigation)}
                    >
                      {showNavigation ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {selectedCategory ? selectedCategory : showNeedsReview ? "Concepts Needing Review" : "All Concepts"}
                      </h1>
                      <p className="text-muted-foreground mb-4">
                        {selectedCategory 
                          ? `Browse concepts in ${selectedCategory}${showNeedsReview ? ' that need review' : ''}`
                          : showNeedsReview
                            ? "Focus on concepts with low confidence scores"
                            : "Browse your knowledge base"
                        }
                      </p>
                    </div>
                  </div>

                </div>

                {/* Show selected filters */}
                {(selectedCategory || showNeedsReview) && (
                  <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-muted/30 rounded-lg border">
                    <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium border border-primary/20">
                          <Tag className="h-4 w-4" />
                          <span>{selectedCategory}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1 hover:bg-primary/20 rounded-full"
                            onClick={() => setSelectedCategory(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {showNeedsReview && (
                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-lg text-sm font-medium border border-orange-200 dark:border-orange-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Needs Review</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full"
                            onClick={() => setShowNeedsReview(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground ml-auto">
                      {filteredConcepts.length} concept{filteredConcepts.length !== 1 ? 's' : ''} shown
                    </div>
                  </div>
                )}

                <Tabs defaultValue="byCategory" className="w-full flex-1 flex flex-col min-h-0">
                  <TabsList className="mb-6">
                    <TabsTrigger value="byCategory" className="flex items-center">
                      <Tag className="mr-2 h-4 w-4" />
                      By Category
                    </TabsTrigger>
                    <TabsTrigger value="alphabetical" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Alphabetical
                    </TabsTrigger>
                  </TabsList>

                  {searchQuery && (
                    <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {filteredConcepts.length === 0 
                          ? "No results found" 
                          : filteredConcepts.length === 1 
                            ? "1 concept found" 
                            : `${filteredConcepts.length} concepts found`} 
                        for <span className="font-medium">"{searchQuery}"</span>
                        {selectedCategory && <span> in <span className="font-medium">{selectedCategory}</span></span>}
                        {showNeedsReview && <span> needing review</span>}
                      </p>
                    </div>
                  )}

                  <TabsContent value="byCategory" className="flex-1 overflow-y-auto">
                    <div className="space-y-8 pb-8">
                      {loading ? (
                        <div className="flex items-center justify-center py-16">
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
                            className="h-8 w-8 animate-spin text-muted-foreground"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                      ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                          <div className="bg-red-50 dark:bg-red-950/20 rounded-full p-6">
                            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="space-y-3 max-w-md">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              Unable to load concepts
                            </h3>
                            <p className="text-muted-foreground">
                              {error === 'Failed to fetch concepts' 
                                ? "It looks like you haven't analyzed any conversations yet. Start by analyzing a conversation to create your first concepts!"
                                : error
                              }
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <Button asChild size="lg">
                              <Link href="/analyze">
                                <Plus className="h-4 w-4 mr-2" />
                                Analyze a Conversation
                              </Link>
                            </Button>
                            <Button variant="outline" onClick={refreshData} size="lg">
                              Try Again
                            </Button>
                          </div>
                        </div>
                      ) : filteredSortedCategories.length > 0 ? (
                        filteredSortedCategories.map((category) => (
                          <div key={category} className="space-y-6">
                            <h2 className="text-2xl font-semibold flex items-center pb-2 border-b border-border">
                              <Tag className="mr-3 h-6 w-6 text-primary" />
                              {/* Parse and display hierarchical categories */}
                              {category.includes(' > ') ? (
                                <span className="flex items-center">
                                  {category.split(' > ').map((part, index, array) => (
                                    <span key={index} className="flex items-center">
                                      <span className={index === 0 ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}>
                                        {part}
                                      </span>
                                      {index < array.length - 1 && (
                                        <span className="mx-3 text-muted-foreground text-lg">›</span>
                                      )}
                                    </span>
                                  ))}
                                </span>
                              ) : (
                                category
                              )}
                            </h2>
                            <CategoryDropZone category={category} onDrop={handleConceptDrop}>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredConceptsByCategory[category].map((concept) => (
                                  <div key={concept.id} className="h-full">
                                    <ConceptCard 
                                      concept={concept} 
                                      showDescription={true}
                                      onCategoryUpdate={handleCategoryUpdate}
                                      onDelete={handleDeleteConcept}
                                      isLoading={loadingConcepts.includes(concept.id)}
                                      isSelected={selectedConcepts.has(concept.id)}
                                      onSelect={handleConceptSelect}
                                      enableRightClickLinking={true}
                                    />
                                  </div>
                                ))}
                              </div>
                            </CategoryDropZone>
                          </div>
                        ))
                      ) : searchQuery && concepts.length > 0 ? (
                        <div className="flex items-center justify-center py-16 text-center">
                          <div className="space-y-4 max-w-md">
                            <div className="bg-gray-50 dark:bg-gray-950/20 rounded-full p-6 mx-auto w-fit">
                              <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">No matching concepts</h3>
                              <p className="text-muted-foreground">
                                No concepts found matching <span className="font-medium">"{searchQuery}"</span>
                                {selectedCategory && <span> in <span className="font-medium">{selectedCategory}</span></span>}. 
                                Try a different search term.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-full p-6">
                            <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-3 max-w-md">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              No concepts yet
                            </h3>
                            <p className="text-muted-foreground">
                              Start by analyzing a conversation to extract concepts automatically. 
                              Your learning journey begins with your first analysis!
                            </p>
                          </div>
                          <Button asChild className="mt-4" size="lg">
                            <Link href="/analyze">
                              <Plus className="h-4 w-4 mr-2" />
                              Analyze Your First Conversation
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="alphabetical" className="flex-1 overflow-y-auto">
                    <div className="pb-8">
                      {loading ? (
                        <div className="flex items-center justify-center py-16">
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
                            className="h-8 w-8 animate-spin text-muted-foreground"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                      ) : error ? (
                        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                          {error}
                        </div>
                      ) : filteredConcepts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {filteredConcepts
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((concept) => (
                              <div key={concept.id} className="h-full">
                                <ConceptCard 
                                  concept={concept} 
                                  showDescription={true}
                                  showRelatedConcepts={false}
                                  onCategoryUpdate={handleCategoryUpdate}
                                  onDelete={handleDeleteConcept}
                                  isLoading={loadingConcepts.includes(concept.id)}
                                  isSelected={selectedConcepts.has(concept.id)}
                                  onSelect={handleConceptSelect}
                                  enableRightClickLinking={true}
                                />
                              </div>
                            ))}
                        </div>
                      ) : searchQuery && concepts.length > 0 ? (
                        <div className="flex items-center justify-center py-16 text-center">
                          <div className="space-y-4 max-w-md">
                            <div className="bg-gray-50 dark:bg-gray-950/20 rounded-full p-6 mx-auto w-fit">
                              <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">No matching concepts</h3>
                              <p className="text-muted-foreground">
                                No concepts found matching <span className="font-medium">"{searchQuery}"</span>
                                {selectedCategory && <span> in <span className="font-medium">{selectedCategory}</span></span>}. 
                                Try a different search term.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-full p-6">
                            <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-3 max-w-md">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              No concepts yet
                            </h3>
                            <p className="text-muted-foreground">
                              Start by analyzing a conversation to extract concepts automatically. 
                              Your learning journey begins with your first analysis!
                            </p>
                          </div>
                          <Button asChild className="mt-4" size="lg">
                            <Link href="/analyze">
                              <Plus className="h-4 w-4 mr-2" />
                              Analyze Your First Conversation
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </PageTransition>
        
        {/* Add Debug Dashboard for monitoring stuck operations */}
        <DebugDashboard />
      </DndProvider>
    </LinkingProvider>
  )
}
