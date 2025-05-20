"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptCard } from "@/components/concept-card"
import { BookOpen, Search, ArrowLeft, Tag } from "lucide-react"
import { useRouter } from "next/navigation"

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
}

export default function ConceptsPage() {
  const router = useRouter()
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptsByCategory, setConceptsByCategory] = useState<Record<string, Concept[]>>({})
  const [sortedCategories, setSortedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingConcept, setIsCreatingConcept] = useState(false)
  const [newConceptId, setNewConceptId] = useState<string | null>(null)
  const [newConceptTitle, setNewConceptTitle] = useState("")

  // Fetch concepts data
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/concepts')
        if (!response.ok) {
          throw new Error('Failed to fetch concepts')
        }
        const data = await response.json()
        formatAndOrganizeConcepts(data)
      } catch (error) {
        setError('Failed to load concepts')
        console.error('Error fetching concepts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [])

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
      const newConcept: Concept = {
        id: data.concept.id,
        title: data.concept.title,
        category: data.concept.category,
        notes: data.concept.summary,
        discussedInConversations: [],
        needsReview: true
      }

      // Add the new concept to our state
      setConcepts((prev) => [newConcept, ...prev])
      
      // Add to categories
      if (!conceptsByCategory[newConcept.category]) {
        setConceptsByCategory((prev) => ({
          ...prev,
          [newConcept.category]: [newConcept]
        }))
        
        setSortedCategories((prev) => 
          [...prev, newConcept.category].sort()
        )
      } else {
        setConceptsByCategory((prev) => ({
          ...prev,
          [newConcept.category]: [newConcept, ...prev[newConcept.category]]
        }))
      }
      
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
    // Find the concept
    const conceptToUpdate = concepts.find(c => c.id === conceptId);
    if (!conceptToUpdate) return;
    
    const oldCategory = conceptToUpdate.category;
    
    // Update concepts array with the new category
    setConcepts(prevConcepts => 
      prevConcepts.map(c => 
        c.id === conceptId ? { ...c, category: newCategory } : c
      )
    );
    
    // Remove from old category
    const updatedOldCategoryList = conceptsByCategory[oldCategory]
      ?.filter(c => c.id !== conceptId) || [];
      
    // Add to new category (create if doesn't exist)
    const updatedNewCategoryList = conceptsByCategory[newCategory] 
      ? [...conceptsByCategory[newCategory], { ...conceptToUpdate, category: newCategory }]
      : [{ ...conceptToUpdate, category: newCategory }];
      
    // Update conceptsByCategory
    setConceptsByCategory(prev => ({
      ...prev,
      [oldCategory]: updatedOldCategoryList,
      [newCategory]: updatedNewCategoryList
    }));
    
    // Update sortedCategories if necessary
    if (!conceptsByCategory[newCategory] && !sortedCategories.includes(newCategory)) {
      setSortedCategories(prev => [...prev, newCategory].sort());
    }
    
    // Remove empty categories
    if (updatedOldCategoryList.length === 0) {
      setSortedCategories(prev => prev.filter(cat => cat !== oldCategory));
    }
  };



  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" asChild>
            <Link href="/" prefetch={false}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Concepts</h1>
            <p className="text-muted-foreground">Browse your knowledge base</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search concepts..." className="pl-8" />
        </div>
      </div>

      <Tabs defaultValue="byCategory" className="w-full">
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

        <TabsContent value="byCategory" className="space-y-6 mt-6">
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
          ) : sortedCategories.length > 0 ? (
            sortedCategories.map((category) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-primary" />
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conceptsByCategory[category].map((concept) => (
                    <div key={concept.id}>
                      <ConceptCard 
                        concept={concept} 
                        showDescription={true}
                        onCategoryUpdate={handleCategoryUpdate}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-3 flex items-center justify-center py-8 text-muted-foreground">
                No concepts found. Create a concept from your conversations to get started!
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alphabetical" className="mt-6">
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
          ) : concepts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concepts
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((concept) => (
                  <ConceptCard 
                    key={concept.id} 
                    concept={concept} 
                    showDescription={true}
                    showRelatedConcepts={false}
                    onCategoryUpdate={handleCategoryUpdate}
                  />
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-3 flex items-center justify-center py-8 text-muted-foreground">
                No concepts found. Create a concept from your conversations to get started!
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
