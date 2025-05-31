"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2, Brain, Lightbulb, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { connectConcepts } from "@/lib/concept-utils"

interface SuggestedConcept {
  title: string
  category: string
  reason: string
  relevanceScore: number
}

interface SuggestedRelatedConceptsProps {
  currentConcept: {
    id: string
    title: string
    category: string
    summary?: string
    details?: string
  }
  existingRelatedIds: Set<string>
  onConceptCreated: () => Promise<void>
}

// Get authentication headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    if (userEmail && userId) {
      headers['x-user-email'] = userEmail;
      headers['x-user-id'] = userId;
    }
  }
  
  return headers;
}

export function SuggestedRelatedConcepts({ 
  currentConcept, 
  existingRelatedIds, 
  onConceptCreated 
}: SuggestedRelatedConceptsProps) {
  const [suggestedConcepts, setSuggestedConcepts] = useState<SuggestedConcept[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [creatingConcept, setCreatingConcept] = useState<string | null>(null)
  const { toast } = useToast()

  // Generate AI-powered suggestions
  const generateSuggestions = async () => {
    setIsLoading(true)
    try {
      // First get all existing concepts to find patterns
      const conceptsResponse = await fetch('/api/concepts', {
        headers: getAuthHeaders()
      })
      
      if (!conceptsResponse.ok) {
        throw new Error('Failed to fetch concepts')
      }
      
      const data = await conceptsResponse.json()
      const allConcepts = data.concepts || []
      
      // Generate smart suggestions based on various factors
      const suggestions: SuggestedConcept[] = []
      
      // 1. Category-based suggestions
      const sameCategoryConcepts = allConcepts.filter((c: any) => 
        c.category === currentConcept.category && 
        c.id !== currentConcept.id &&
        !existingRelatedIds.has(c.id)
      )
      
      // 2. Cross-category suggestions for programming concepts
      const programmingKeywords = ['algorithm', 'data structure', 'pattern', 'design', 'optimization', 'performance']
      const isProgrammingConcept = programmingKeywords.some(keyword => 
        currentConcept.title.toLowerCase().includes(keyword) ||
        currentConcept.category.toLowerCase().includes('programming') ||
        currentConcept.category.toLowerCase().includes('engineering')
      )
      
      // 3. Generate concept name suggestions using AI patterns
      const conceptSuggestions = []
      
      if (currentConcept.category.includes('Algorithm') || currentConcept.category.includes('Data Structure')) {
        const baseTitle = currentConcept.title.toLowerCase()
        
        if (baseTitle.includes('hash')) {
          conceptSuggestions.push(
            { title: 'Hash Collision Resolution', reason: 'Related hashing technique' },
            { title: 'Bloom Filter', reason: 'Uses hashing for membership testing' },
            { title: 'Consistent Hashing', reason: 'Advanced hashing strategy' }
          )
        }
        
        if (baseTitle.includes('tree')) {
          conceptSuggestions.push(
            { title: 'Tree Traversal Methods', reason: 'Fundamental tree operations' },
            { title: 'Balanced Tree Properties', reason: 'Tree optimization concepts' },
            { title: 'Binary Search Tree', reason: 'Core tree data structure' }
          )
        }
        
        if (baseTitle.includes('array') || baseTitle.includes('list')) {
          conceptSuggestions.push(
            { title: 'Two Pointer Technique', reason: 'Common array manipulation pattern' },
            { title: 'Sliding Window Pattern', reason: 'Efficient array processing method' },
            { title: 'Dynamic Array Resizing', reason: 'Array implementation detail' }
          )
        }
        
        if (baseTitle.includes('graph')) {
          conceptSuggestions.push(
            { title: 'Graph Traversal Algorithms', reason: 'Essential graph operations' },
            { title: 'Shortest Path Algorithms', reason: 'Common graph problem category' },
            { title: 'Topological Sorting', reason: 'Important graph algorithm' }
          )
        }
        
        if (baseTitle.includes('sort')) {
          conceptSuggestions.push(
            { title: 'Time Complexity Analysis', reason: 'Important for sorting algorithms' },
            { title: 'Stable vs Unstable Sorting', reason: 'Sorting algorithm property' },
            { title: 'In-place Sorting', reason: 'Memory optimization technique' }
          )
        }
        
        if (baseTitle.includes('search')) {
          conceptSuggestions.push(
            { title: 'Binary Search Variants', reason: 'Search algorithm extensions' },
            { title: 'Search Space Pruning', reason: 'Search optimization technique' },
            { title: 'Index Structures', reason: 'Enables efficient searching' }
          )
        }
      }
      
      if (currentConcept.category.includes('System Design') || currentConcept.category.includes('Architecture')) {
        const baseTitle = currentConcept.title.toLowerCase()
        
        if (baseTitle.includes('cache') || baseTitle.includes('caching')) {
          conceptSuggestions.push(
            { title: 'Cache Eviction Policies', reason: 'Cache management strategy' },
            { title: 'Cache Coherence', reason: 'Distributed caching concern' },
            { title: 'Write-Through vs Write-Back', reason: 'Cache writing strategies' }
          )
        }
        
        if (baseTitle.includes('database') || baseTitle.includes('db')) {
          conceptSuggestions.push(
            { title: 'Database Indexing', reason: 'Database performance optimization' },
            { title: 'ACID Properties', reason: 'Database transaction guarantees' },
            { title: 'Database Sharding', reason: 'Database scaling technique' }
          )
        }
        
        if (baseTitle.includes('load balancer') || baseTitle.includes('scaling')) {
          conceptSuggestions.push(
            { title: 'Horizontal vs Vertical Scaling', reason: 'Scaling strategies' },
            { title: 'Consistent Hashing', reason: 'Load balancing technique' },
            { title: 'Auto-scaling Policies', reason: 'Dynamic scaling management' }
          )
        }
      }
      
      if (currentConcept.category.includes('Frontend') || currentConcept.category.includes('Web')) {
        const baseTitle = currentConcept.title.toLowerCase()
        
        if (baseTitle.includes('react') || baseTitle.includes('component')) {
          conceptSuggestions.push(
            { title: 'React Hooks Patterns', reason: 'Modern React development' },
            { title: 'Component Lifecycle', reason: 'Component behavior management' },
            { title: 'State Management Patterns', reason: 'Application state handling' }
          )
        }
        
        if (baseTitle.includes('performance') || baseTitle.includes('optimization')) {
          conceptSuggestions.push(
            { title: 'Code Splitting', reason: 'Performance optimization technique' },
            { title: 'Lazy Loading', reason: 'Resource loading optimization' },
            { title: 'Bundle Optimization', reason: 'Build process improvement' }
          )
        }
      }
      
      // Filter out concepts that already exist and add relevance scores
      for (const suggestion of conceptSuggestions) {
        const exists = allConcepts.some((c: any) => 
          c.title.toLowerCase() === suggestion.title.toLowerCase()
        )
        
        if (!exists) {
          suggestions.push({
            title: suggestion.title,
            category: currentConcept.category,
            reason: suggestion.reason,
            relevanceScore: 0.8
          })
        }
      }
      
      // Add some existing concepts that might be related but not connected
      const relatedExisting = sameCategoryConcepts
        .slice(0, 3)
        .map((c: any) => ({
          title: c.title,
          category: c.category,
          reason: 'Same category',
          relevanceScore: 0.6
        }))
      
      suggestions.push(...relatedExisting)
      
      // Sort by relevance score and limit results
      const finalSuggestions = suggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 6)
      
      setSuggestedConcepts(finalSuggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setSuggestedConcepts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generateSuggestions()
  }, [currentConcept.id])

  const handleCreateAndLinkConcept = async (suggestedTitle: string) => {
    setCreatingConcept(suggestedTitle)
    
    try {
      // Generate the concept using AI
      const generateResponse = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conceptName: suggestedTitle,
          context: `Generate a comprehensive concept for "${suggestedTitle}" that relates to "${currentConcept.title}" in the "${currentConcept.category}" category. 
          
Context about the source concept: ${currentConcept.summary || currentConcept.details || 'No additional context'}

Make this concept practical and detailed, focusing on real-world applications and implementation details.`,
          sourceConcept: {
            id: currentConcept.id,
            title: currentConcept.title,
            category: currentConcept.category
          }
        }),
      })
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate concept')
      }
      
      const newConcept = await generateResponse.json()
      
      if (!newConcept.concept || !newConcept.concept.id) {
        throw new Error('Invalid response from concept generation')
      }
      
      // Link the new concept to the current concept
      await connectConcepts(currentConcept.id, newConcept.concept.id)
      
      toast({
        title: "✨ Concept Created & Linked!",
        description: `"${suggestedTitle}" has been created with AI and linked to "${currentConcept.title}"`,
        duration: 4000,
      })
      
      // Remove the suggestion from the list
      setSuggestedConcepts(prev => prev.filter(s => s.title !== suggestedTitle))
      
      // Refresh the parent component
      await onConceptCreated()
      
    } catch (error) {
      console.error('Error creating concept:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create concept. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setCreatingConcept(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary animate-pulse" />
          <h4 className="text-sm font-medium text-muted-foreground">Finding Related Concepts...</h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (suggestedConcepts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-medium text-muted-foreground">Suggested Related Concepts</h4>
        <Badge variant="outline" className="text-xs">AI Powered</Badge>
      </div>
      
      <div className="space-y-2">
        {suggestedConcepts.map((suggestion, index) => (
          <Card key={index} className="group hover:shadow-sm transition-all duration-200 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium truncate">{suggestion.title}</h5>
                    <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.reason}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-7 px-2 text-xs border-primary/50 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleCreateAndLinkConcept(suggestion.title)}
                  disabled={creatingConcept !== null}
                  title={`Create "${suggestion.title}" with AI and link to this concept`}
                >
                  {creatingConcept === suggestion.title ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground text-center pt-2">
        💡 These concepts will be generated with AI and automatically linked
      </div>
    </div>
  )
} 