"use client"

import { useEffect, useState, useRef } from "react"
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
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptsByCategory, setConceptsByCategory] = useState<Record<string, Concept[]>>({})
  const [sortedCategories, setSortedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingConcept, setIsCreatingConcept] = useState(false)
  const [newConceptId, setNewConceptId] = useState<string | null>(null)
  const [newConceptTitle, setNewConceptTitle] = useState("")
  const [loadingConcepts, setLoadingConcepts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set())
  const [showNavigation, setShowNavigation] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showNeedsReview, setShowNeedsReview] = useState(false)
  const { toast } = useToast()

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

  // Fetch concepts data
  useEffect(() => {
    fetchConcepts()
  }, [])

  // Fetch concepts function - extracted so it can be reused for refreshing
  const fetchConcepts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/concepts')
      if (!response.ok) {
        throw new Error('Failed to fetch concepts')
      }
      const data = await response.json()
      
      // Check if we have concepts data in the response
      if (data.concepts && Array.isArray(data.concepts)) {
        formatAndOrganizeConcepts(data.concepts)
      } else if (data.error) {
        // Handle error case
        setError(data.error || 'Failed to load concepts')
        console.error('Error in concepts response:', data.error)
        formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
      } else {
        // Fallback for unexpected response format
        setError('Invalid response format')
        console.error('Unexpected concepts response format:', data)
        formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
      }
    } catch (error) {
      setError('Failed to load concepts')
      console.error('Error fetching concepts:', error)
      formatAndOrganizeConcepts([]) // Use empty array to avoid crashes
    } finally {
      setLoading(false)
    }
  }

  // Refresh data function to be used after mutations
  const refreshData = async () => {
    await fetchConcepts()
  }

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
  }

  // Clean up empty categories after state updates
  useEffect(() => {
    setSortedCategories(prevSorted => {
      const categoriesWithConcepts = Object.keys(conceptsByCategory).filter(
        category => conceptsByCategory[category] && conceptsByCategory[category].length > 0
      );
      
      // Only update if there's actually a difference
      const shouldUpdate = prevSorted.some(cat => !categoriesWithConcepts.includes(cat)) ||
                          categoriesWithConcepts.some(cat => !prevSorted.includes(cat));
      
      if (shouldUpdate) {
        return categoriesWithConcepts.sort();
      }
      
      return prevSorted;
    });
  }, [conceptsByCategory])

  // Process and organize the concepts by category
  const formatAndOrganizeConcepts = (conceptsData: any[]) => {
    const formattedConcepts = conceptsData.map(concept => ({
      id: concept.id,
      title: concept.title,
      category: concept.category,
      notes: concept.summary,
      discussedInConversations: concept.occurrences?.map((o: any) => o.conversationId) || [],
      needsReview: concept.confidenceScore < 0.7
    }))

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

    setConceptsByCategory(byCategory)
    setSortedCategories(Object.keys(byCategory).sort())
  }

  // Handle creating a new concept
  const handleAddConcept = async (title: string) => {
    try {
      setIsCreatingConcept(true)
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to create concept')
      }

      const data = await response.json()
      
      // Refresh data to get updated concepts (including removed placeholders)
      await refreshData()
      
      // Store the new concept ID and redirect to its edit page
      setNewConceptId(data.concept.id)
      router.push(`/concept/${data.concept.id}`)
    } catch (error) {
      console.error('Error creating concept:', error)
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
          headers: {
            'Content-Type': 'application/json',
          },
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
      // Update concepts in the database using PUT method (not PATCH)
      const updatePromises = conceptIds.map(async (conceptId) => {
        // First fetch the current concept to preserve other fields
        const response = await fetch(`/api/concepts/${conceptId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch concept ${conceptId}`)
        }
        const conceptData = await response.json()
        
        // Update with new category while preserving other fields
        const updateResponse = await fetch(`/api/concepts/${conceptId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Filtered by:</span>
                    <div className="flex gap-2">
                      {selectedCategory && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                          <Tag className="h-3 w-3" />
                          {selectedCategory}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-primary/20"
                            onClick={() => setSelectedCategory(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {showNeedsReview && (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-sm">
                          <AlertTriangle className="h-3 w-3" />
                          Needs Review
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-orange-200"
                            onClick={() => setShowNeedsReview(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Tabs defaultValue="byCategory" className="w-full flex-1 flex flex-col min-h-0">
                  <TabsList>
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
                    <div className="mt-4 text-sm">
                      <p>
                        {filteredConcepts.length === 0 
                          ? "No results found" 
                          : filteredConcepts.length === 1 
                            ? "1 concept found" 
                            : `${filteredConcepts.length} concepts found`} 
                        for "{searchQuery}"
                        {selectedCategory && ` in ${selectedCategory}`}
                        {showNeedsReview && ` needing review`}
                      </p>
                    </div>
                  )}

                  <TabsContent value="byCategory" className="flex-1 overflow-y-auto mt-6">
                    <div className="space-y-6 pb-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
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
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                          <div className="bg-red-50 dark:bg-red-950/20 rounded-full p-4">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              Unable to load concepts
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                              {error === 'Failed to fetch concepts' 
                                ? "It looks like you haven't analyzed any conversations yet. Start by analyzing a conversation to create your first concepts!"
                                : error
                              }
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button asChild>
                              <Link href="/analyze">
                                <Plus className="h-4 w-4 mr-2" />
                                Analyze a Conversation
                              </Link>
                            </Button>
                            <Button variant="outline" onClick={refreshData}>
                              Try Again
                            </Button>
                          </div>
                        </div>
                      ) : filteredSortedCategories.length > 0 ? (
                        filteredSortedCategories.map((category) => (
                          <div key={category} className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center">
                              <Tag className="mr-2 h-5 w-5 text-primary" />
                              {category}
                            </h2>
                            <CategoryDropZone category={category} onDrop={handleConceptDrop}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredConceptsByCategory[category].map((concept) => (
                                  <div key={concept.id}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-3 flex items-center justify-center py-8 text-muted-foreground">
                            No concepts found matching "{searchQuery}"{selectedCategory && ` in ${selectedCategory}`}. Try a different search term.
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-3 flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-full p-4">
                              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                No concepts yet
                              </h3>
                              <p className="text-muted-foreground max-w-md">
                                Start by analyzing a conversation to extract concepts automatically. 
                                Your learning journey begins with your first analysis!
                              </p>
                            </div>
                            <Button asChild className="mt-4">
                              <Link href="/analyze">
                                <Plus className="h-4 w-4 mr-2" />
                                Analyze Your First Conversation
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="alphabetical" className="flex-1 overflow-y-auto mt-6">
                    <div className="pb-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
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
                        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                          {error}
                        </div>
                      ) : filteredConcepts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredConcepts
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((concept) => (
                              <ConceptCard 
                                key={concept.id} 
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
                            ))}
                        </div>
                      ) : searchQuery && concepts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-3 flex items-center justify-center py-8 text-muted-foreground">
                            No concepts found matching "{searchQuery}"{selectedCategory && ` in ${selectedCategory}`}. Try a different search term.
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-3 flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-full p-4">
                              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                No concepts yet
                              </h3>
                              <p className="text-muted-foreground max-w-md">
                                Start by analyzing a conversation to extract concepts automatically. 
                                Your learning journey begins with your first analysis!
                              </p>
                            </div>
                            <Button asChild className="mt-4">
                              <Link href="/analyze">
                                <Plus className="h-4 w-4 mr-2" />
                                Analyze Your First Conversation
                              </Link>
                            </Button>
                          </div>
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
