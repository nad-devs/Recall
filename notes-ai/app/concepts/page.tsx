import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptCard } from "@/components/concept-card"
import { BookOpen, Search, ArrowLeft, Tag } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "All Concepts | ChatMapper",
  description: "Browse all your learning concepts",
}

export default async function ConceptsPage() {
  // Fetch concepts from the database
  const concepts = await prisma.concept.findMany({
    include: {
      occurrences: true,
    },
    orderBy: {
      title: 'asc',
    },
  });

  // Format concepts for the UI
  const formattedConcepts = concepts.map(concept => ({
    id: concept.id,
    title: concept.title,
    category: concept.category,
    notes: concept.summary,
    discussedInConversations: concept.occurrences.map(o => o.conversationId),
    needsReview: concept.confidenceScore < 0.7
  }));

  // Group concepts by category
  const conceptsByCategory: Record<string, any[]> = {}

  formattedConcepts.forEach((concept) => {
    if (!conceptsByCategory[concept.category]) {
      conceptsByCategory[concept.category] = []
    }

    conceptsByCategory[concept.category].push(concept)
  })

  // Sort concepts within each category alphabetically
  Object.keys(conceptsByCategory).forEach((category) => {
    conceptsByCategory[category].sort((a, b) => a.title.localeCompare(b.title))
  })

  // Get sorted categories alphabetically
  const sortedCategories = Object.keys(conceptsByCategory).sort()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
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
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-primary" />
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conceptsByCategory[category].map((concept) => (
                    <ConceptCard 
                      key={concept.id} 
                      concept={concept} 
                      showDescription={true}
                      showRelatedConcepts={true}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No concepts found. Analyze some conversations to get started!
            </div>
          )}
        </TabsContent>

        <TabsContent value="alphabetical" className="mt-6">
          {formattedConcepts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formattedConcepts
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((concept) => (
                  <ConceptCard 
                    key={concept.id} 
                    concept={concept} 
                    showDescription={true}
                    showRelatedConcepts={false}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No concepts found. Analyze some conversations to get started!
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
