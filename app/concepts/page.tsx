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

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
}

// FIXED: Moved CategoryDropZone component OUTSIDE to prevent conditional hook usage
interface CategoryDropZoneProps {
  category: string
  onDrop: (item: any, category: string) => void
  children: React.ReactNode
}

// This is now a separate component that can be safely used conditionally
function CategoryDropZone({ category, onDrop, children }: CategoryDropZoneProps) {
  // TEMPORARILY DISABLED: Testing if this component is causing hook violations
  // const dropRef = useRef<HTMLDivElement>(null);
  // const [{ isOver }, drop] = useDrop(() => ({
  //   accept: 'CONCEPT_CARD',
  //   drop: (item: any) => onDrop(item, category),
  //   collect: (monitor) => ({
  //     isOver: !!monitor.isOver(),
  //   }),
  // }))
  
  // // Connect the drop ref
  // useEffect(() => {
  //   if (dropRef.current) {
  //     drop(dropRef);
  //   }
  // }, [drop, dropRef]);

  return (
    <div 
      // ref={dropRef} 
      className={`space-y-4`} // ${isOver ? 'bg-primary-50 dark:bg-primary-950/20 rounded-lg p-2' : ''}
    >
      {children}
    </div>
  )
}

export default function ConceptsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Simple state management - no complex tracking
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptsByCategory, setConceptsByCategory] = useState<Record<string, Concept[]>>({})
  const [sortedCategories, setSortedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Read the flag once and use it for both states to avoid race condition
  const [isReduxRefresh] = useState(() => {
    if (typeof window !== 'undefined') {
      const shouldSkip = sessionStorage.getItem('skipLoadingScreen')
      if (shouldSkip) {
        console.log('🔄 Detected Redux operation refresh - will show SKELETON')
        sessionStorage.removeItem('skipLoadingScreen') // Clear flag after reading
        return true // This was a Redux operation refresh
      }
    }
    console.log('🆕 Normal page load - will show BEAUTIFUL animation')
    return false // This is a normal page load
  })
  
  const [showLoadingScreen, setShowLoadingScreen] = useState(!isReduxRefresh)
  const [showSkeletonOnly, setShowSkeletonOnly] = useState(isReduxRefresh)
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
  
  // Simple rate limiting
  const lastFetchTime = useRef<number>(0)
  const FETCH_RATE_LIMIT = 1000
  const refreshDataRef = useRef<(() => Promise<void>) | null>(null)
  const isRefreshingRef = useRef<boolean>(false)

  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
      }
    }
    
    return headers
  }

  // Filter concepts based on search query, selected category, and needs review filter
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.notes && concept.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (concept.summary && concept.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === null || concept.category === selectedCategory
    const matchesNeedsReview = !showNeedsReview || concept.needsReview
    
    return matchesSearch && matchesCategory && matchesNeedsReview
  })
  
  // Filter concepts by category
  const filteredConceptsByCategory = Object.entries(conceptsByCategory).reduce((acc, [category, categoryItems]) => {
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

  // Simple format and organize function
  const formatAndOrganizeConcepts = useCallback((conceptsData: any[]) => {
    const formattedConcepts = conceptsData.map(concept => ({
      id: concept.id,
      title: concept.title,
      category: concept.category,
      notes: concept.summary,
      discussedInConversations: concept.occurrences?.map((o: any) => o.conversationId) || [],
      needsReview: concept.confidenceScore < 0.7
    }))

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

    const sortedCategoryList = Object.keys(byCategory).sort()

    // Update all state simultaneously
    setConcepts(formattedConcepts)
    setConceptsByCategory(byCategory)
    setSortedCategories(sortedCategoryList)
  }, [])

  // Simple fetch concepts function
  const fetchConcepts = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime.current
    if (timeSinceLastFetch < FETCH_RATE_LIMIT) {
      return
    }
    lastFetchTime.current = now
    
    try {
      setLoading(true)
      setDataLoaded(false)
      
      const headers = getAuthHeaders()
      const startTime = Date.now()
      
      const response = await fetch('/api/concepts', { headers })
      const fetchDuration = Date.now() - startTime
      
      if (!response.ok) {
        throw new Error('Failed to fetch concepts')
      }
      const data = await response.json()
      
      if (data.concepts && Array.isArray(data.concepts)) {
        formatAndOrganizeConcepts(data.concepts)
      } else if (data.error) {
        setError(data.error || 'Failed to load concepts')
        formatAndOrganizeConcepts([])
      } else {
        setError('Invalid response format')
        formatAndOrganizeConcepts([])
      }
      
      setDataLoaded(true)
      
    } catch (error) {
      console.error('Failed to fetch concepts:', error)
      setError('Failed to load concepts')
      setDataLoaded(true)
      formatAndOrganizeConcepts([])
    } finally {
      setLoading(false)
    }
  }, [formatAndOrganizeConcepts])

  // Simple refresh data function
  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) {
      return
    }
    
    isRefreshingRef.current = true
    
    try {
      await fetchConcepts()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [fetchConcepts])

  // ✨ SILENT REFRESH - No loading animation, no loading states!
  const silentRefreshData = useCallback(async () => {
    if (isRefreshingRef.current) {
      return
    }
    
    isRefreshingRef.current = true
    console.log('🤫 Silent refresh: Updating data without loading animation')
    
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/concepts', { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch concepts')
      }
      
      const data = await response.json()
      
      if (data.concepts && Array.isArray(data.concepts)) {
        // Update data silently - no loading states changed!
        formatAndOrganizeConcepts(data.concepts)
        console.log('✅ Silent refresh completed - no loading animation shown')
      } else {
        console.warn('Silent refresh: Invalid response format')
        formatAndOrganizeConcepts([])
      }
      
    } catch (error) {
      console.error('Silent refresh error:', error)
      // Don't change error state - just log it
    } finally {
      isRefreshingRef.current = false
    }
  }, [formatAndOrganizeConcepts])
  
  // Store both refresh functions in refs
  refreshDataRef.current = refreshData

  // Auto-refresh event listener
  useEffect(() => {
    const handleRefreshConcepts = async () => {
      try {
        if (refreshDataRef.current) {
          await refreshDataRef.current()
        }
      } catch (error) {
        console.error('Error in auto-refresh:', error)
      }
    }

    window.addEventListener('refreshConcepts', handleRefreshConcepts)
    
    return () => {
      window.removeEventListener('refreshConcepts', handleRefreshConcepts)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    const executeRefresh = async () => {
      try {
        if (refreshDataRef.current) {
          await refreshDataRef.current()
        }
      } catch (error) {
        console.error('Error in initial data fetch:', error)
      }
    }
    executeRefresh()
  }, [])

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    if (dataLoaded) {
      setShowLoadingScreen(false)
    } else {
      setTimeout(() => {
        setShowLoadingScreen(false)
      }, 3000)
    }
  }

  // Simple effect to hide loading screen
  useEffect(() => {
    if (dataLoaded && !loading && showLoadingScreen) {
      const timer = setTimeout(() => {
        setShowLoadingScreen(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [dataLoaded, loading, showLoadingScreen])

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
    try {
      // Update concepts in the database using PUT method
      const updatePromises = conceptIds.map(async (conceptId) => {
        // First fetch the current concept to preserve other fields
        const response = await fetch(`/api/concepts/${conceptId}`, { headers: getAuthHeaders() })
        if (!response.ok) {
          throw new Error(`Failed to fetch concept ${conceptId}`)
        }
        const conceptData = await response.json()
        
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
      
      await Promise.all(updatePromises)
      
      // Refresh the data to show updated concepts
      await refreshData()
      
      toast({
        title: "Concepts moved successfully",
        description: `Moved ${conceptIds.length} concept(s) to "${newCategory}"`,
      })
      
    } catch (error) {
      console.error('Error moving concepts:', error)
      toast({
        title: "Error moving concepts",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show skeleton loading screen only for Redux operations
  if ((showLoadingScreen || loading) && showSkeletonOnly) {
    console.log('🦴 Showing SKELETON loading screen (Redux operation)')
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 h-[calc(100vh-73px)]">
          {/* Left sidebar skeleton */}
          <div className="w-80 border-r bg-card p-4 space-y-4">
            {/* Search skeleton */}
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            
            {/* Category tree skeleton */}
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                  <div className={`h-4 bg-muted rounded animate-pulse ${
                    i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-32' : 'w-28'
                  }`}></div>
                </div>
              ))}
            </div>
            
            {/* Add category button skeleton */}
            <div className="h-9 w-full bg-muted rounded animate-pulse mt-4"></div>
          </div>

          {/* Main content skeleton */}
          <div className="flex-1 p-6">
            {/* Content header skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>

            {/* Concept cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-4/6 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show beautiful animation loading screen for initial page loads
  if (showLoadingScreen || loading) {
    console.log('🎨 Showing BEAUTIFUL animation loading screen (initial page load)')
    return (
      <ConceptsLoading onComplete={handleLoadingComplete} />
    )
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
                onDataRefresh={silentRefreshData}
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
      </DndProvider>
    </LinkingProvider>
  )
}
