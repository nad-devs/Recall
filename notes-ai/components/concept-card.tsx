"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowRight, BookOpen, ExternalLink, Edit, Check, X, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

// Predefined categories for selection
const CATEGORIES = [
  "Algorithms",
  "Algorithm Technique",
  "Data Structures",
  "String Manipulation",
  "Math & Logic",
  "Backend Engineering",
  "System Design",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "CSS",
  "Node.js",
  "Database",
  "UI/UX",
  "General"
];

interface ConceptCardProps {
  concept: any
  showDescription?: boolean
  showRelatedConcepts?: boolean
  onCategoryUpdate?: (id: string, newCategory: string) => void
}

export function ConceptCard({ 
  concept, 
  showDescription = false, 
  showRelatedConcepts = false,
  onCategoryUpdate
}: ConceptCardProps) {
  const { id, title, category, notes, discussedInConversations, needsReview } = concept
  const [parsedRelatedConcepts, setParsedRelatedConcepts] = useState<Array<string | {id?: string, title?: string}>>([])
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(category || "General")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Parse the related concepts safely
    if (concept.relatedConcepts) {
      try {
        // Handle both array and JSON string formats
        if (typeof concept.relatedConcepts === 'string') {
          const parsed = JSON.parse(concept.relatedConcepts);
          setParsedRelatedConcepts(Array.isArray(parsed) ? parsed : []);
        } else if (Array.isArray(concept.relatedConcepts)) {
          setParsedRelatedConcepts(concept.relatedConcepts);
        }
      } catch (e) {
        console.error("Error parsing related concepts:", e);
        setParsedRelatedConcepts([]);
      }
    }
  }, [concept.relatedConcepts]);

  // Function to get display title and link for related concept
  const getRelatedConceptInfo = (related: string | {id?: string, title?: string}) => {
    if (typeof related === 'string') {
      return {
        displayTitle: related,
        linkPath: `/concept/${encodeURIComponent(related)}`
      };
    } else if (typeof related === 'object' && related !== null) {
      const displayTitle = related.title || (related.id ? 'Related concept' : 'Unknown');
      const linkPath = related.id 
        ? `/concept/${related.id}` 
        : (related.title ? `/concept/${encodeURIComponent(related.title)}` : '#');
      
      return { displayTitle, linkPath };
    } else {
      return {
        displayTitle: 'Unknown concept',
        linkPath: '#'
      };
    }
  };

  // Handle updating the category
  const handleCategoryUpdate = async () => {
    if (selectedCategory === category) {
      setIsEditingCategory(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      // Call the callback if provided
      if (onCategoryUpdate) {
        onCategoryUpdate(id, selectedCategory)
      }

      toast({
        title: "Category Updated",
        description: `Category changed to ${selectedCategory}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
      setIsEditingCategory(false)
    }
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${needsReview ? "border-amber-300 dark:border-amber-700" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-2">
            {needsReview && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
              >
                Needs Review
              </Badge>
            )}
            {isEditingCategory ? (
              <div className="flex items-center space-x-1">
                <select 
                  className="text-xs border rounded py-1 px-2 bg-background" 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isSaving}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={handleCategoryUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => {
                    setSelectedCategory(category || "General")
                    setIsEditingCategory(false)
                  }}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center">
                <Badge onClick={() => setIsEditingCategory(true)} className="cursor-pointer">
                  {category || "General"}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1" 
                  onClick={() => setIsEditingCategory(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {showDescription && notes && (
          <CardDescription className="line-clamp-2">{notes.substring(0, 120)}...</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <MessageSquare className="mr-1 h-3 w-3" />
          Discussed in {discussedInConversations?.length || 0} conversation{discussedInConversations?.length !== 1 ? "s" : ""}
        </div>
        
        {showRelatedConcepts && parsedRelatedConcepts.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center text-sm font-medium">
              <ExternalLink className="mr-1 h-3 w-3 text-primary" />
              Related Concepts
            </div>
            <div className="flex flex-wrap gap-1">
              {parsedRelatedConcepts.map((related, i) => {
                const { displayTitle, linkPath } = getRelatedConceptInfo(related);
                return (
                  <Badge key={i} variant="outline" className="text-xs">
                    {linkPath !== '#' ? (
                      <Link href={linkPath}>
                        {displayTitle}
                      </Link>
                    ) : (
                      <span>{displayTitle}</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/concept/${id}`}>
            <BookOpen className="mr-1 h-3 w-3" />
            Review
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/concept/${id}`}>
            View concept
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
