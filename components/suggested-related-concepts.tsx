"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
    console.log('🔍 [SuggestedConcepts] Starting suggestion generation for:', currentConcept.title)
    console.log('🔍 [SuggestedConcepts] Current concept:', {
      id: currentConcept.id,
      title: currentConcept.title,
      category: currentConcept.category
    })
    console.log('🔍 [SuggestedConcepts] Existing related IDs:', Array.from(existingRelatedIds))
    
    setIsLoading(true)
    try {
      console.log('📡 [SuggestedConcepts] Fetching all concepts...')
      // First get all existing concepts to find patterns
      const conceptsResponse = await fetch('/api/concepts', {
        headers: getAuthHeaders()
      })
      
      if (!conceptsResponse.ok) {
        throw new Error('Failed to fetch concepts')
      }
      
      const data = await conceptsResponse.json()
      const allConcepts = data.concepts || []
      console.log('📊 [SuggestedConcepts] Total concepts in database:', allConcepts.length)
      
      // Generate smart suggestions based on various factors
      const suggestions: SuggestedConcept[] = []
      
      // 1. Category-based suggestions
      const sameCategoryConcepts = allConcepts.filter((c: any) => 
        c.category === currentConcept.category && 
        c.id !== currentConcept.id &&
        !existingRelatedIds.has(c.id)
      )
      console.log('🏷️ [SuggestedConcepts] Same category concepts found:', sameCategoryConcepts.length)
      
      // 2. Generate concept name suggestions using patterns
      const conceptSuggestions = []
      console.log('🧠 [SuggestedConcepts] Analyzing concept patterns for category:', currentConcept.category)
      
      if (currentConcept.category.includes('Algorithm') || currentConcept.category.includes('Data Structure')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🔤 [SuggestedConcepts] Analyzing algorithm/data structure title:', baseTitle)
        
        if (baseTitle.includes('hash')) {
          console.log('🔑 [SuggestedConcepts] Hash-related concept detected, adding hash suggestions')
          conceptSuggestions.push(
            { title: 'Hash Collision Resolution', reason: 'Related hashing technique' },
            { title: 'Bloom Filter', reason: 'Uses hashing for membership testing' },
            { title: 'Consistent Hashing', reason: 'Advanced hashing strategy' }
          )
        }
        
        if (baseTitle.includes('tree')) {
          console.log('🌳 [SuggestedConcepts] Tree-related concept detected, adding tree suggestions')
          conceptSuggestions.push(
            { title: 'Tree Traversal Methods', reason: 'Fundamental tree operations' },
            { title: 'Balanced Tree Properties', reason: 'Tree optimization concepts' },
            { title: 'Binary Search Tree', reason: 'Core tree data structure' }
          )
        }
        
        if (baseTitle.includes('array') || baseTitle.includes('list')) {
          console.log('📊 [SuggestedConcepts] Array/list-related concept detected, adding array suggestions')
          conceptSuggestions.push(
            { title: 'Two Pointer Technique', reason: 'Common array manipulation pattern' },
            { title: 'Sliding Window Pattern', reason: 'Efficient array processing method' },
            { title: 'Dynamic Array Resizing', reason: 'Array implementation detail' }
          )
        }
        
        if (baseTitle.includes('graph')) {
          console.log('🕸️ [SuggestedConcepts] Graph-related concept detected, adding graph suggestions')
          conceptSuggestions.push(
            { title: 'Graph Traversal Algorithms', reason: 'Essential graph operations' },
            { title: 'Shortest Path Algorithms', reason: 'Common graph problem category' },
            { title: 'Topological Sorting', reason: 'Important graph algorithm' }
          )
        }
        
        if (baseTitle.includes('sort')) {
          console.log('🔄 [SuggestedConcepts] Sort-related concept detected, adding sorting suggestions')
          conceptSuggestions.push(
            { title: 'Time Complexity Analysis', reason: 'Important for sorting algorithms' },
            { title: 'Stable vs Unstable Sorting', reason: 'Sorting algorithm property' },
            { title: 'In-place Sorting', reason: 'Memory optimization technique' }
          )
        }
      }
      
      if (currentConcept.category.includes('System Design') || currentConcept.category.includes('Architecture') || currentConcept.category.includes('Backend')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🏗️ [SuggestedConcepts] System design concept detected, analyzing:', baseTitle)
        
        if (baseTitle.includes('cache') || baseTitle.includes('caching')) {
          console.log('💾 [SuggestedConcepts] Cache-related concept detected, adding cache suggestions')
          conceptSuggestions.push(
            { title: 'Cache Eviction Policies', reason: 'Cache management strategy' },
            { title: 'Cache Coherence', reason: 'Distributed caching concern' },
            { title: 'Write-Through vs Write-Back', reason: 'Cache writing strategies' }
          )
        }
        
        if (baseTitle.includes('database') || baseTitle.includes('db')) {
          console.log('🗄️ [SuggestedConcepts] Database-related concept detected, adding DB suggestions')
          conceptSuggestions.push(
            { title: 'Database Indexing', reason: 'Database performance optimization' },
            { title: 'ACID Properties', reason: 'Database transaction guarantees' },
            { title: 'Database Sharding', reason: 'Database scaling technique' }
          )
        }
        
        if (baseTitle.includes('load') || baseTitle.includes('balancer')) {
          console.log('⚖️ [SuggestedConcepts] Load balancer concept detected, adding related suggestions')
          conceptSuggestions.push(
            { title: 'Health Check Mechanisms', reason: 'Load balancer monitoring' },
            { title: 'Round Robin Algorithm', reason: 'Load balancing strategy' },
            { title: 'Sticky Sessions', reason: 'Load balancer session management' }
          )
        }
        
        if (baseTitle.includes('cdn') || baseTitle.includes('content delivery')) {
          console.log('🌐 [SuggestedConcepts] CDN concept detected, adding CDN suggestions')
          conceptSuggestions.push(
            { title: 'Edge Computing', reason: 'CDN edge optimization' },
            { title: 'Cache Invalidation', reason: 'CDN cache management' },
            { title: 'Geographic Load Distribution', reason: 'CDN routing strategy' }
          )
        }
      }
      
      if (currentConcept.category.includes('Frontend') || currentConcept.category.includes('Web')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🖥️ [SuggestedConcepts] Frontend concept detected, analyzing:', baseTitle)
        
        if (baseTitle.includes('react') || baseTitle.includes('component')) {
          console.log('⚛️ [SuggestedConcepts] React-related concept detected, adding React suggestions')
          conceptSuggestions.push(
            { title: 'React Hooks Patterns', reason: 'Modern React development' },
            { title: 'Component Lifecycle', reason: 'Component behavior management' },
            { title: 'State Management Patterns', reason: 'Application state handling' }
          )
        }
      }
      
      console.log('💡 [SuggestedConcepts] Generated concept suggestions:', conceptSuggestions.length)
      
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
          console.log('✅ [SuggestedConcepts] Added new suggestion:', suggestion.title)
        } else {
          console.log('❌ [SuggestedConcepts] Skipped existing concept:', suggestion.title)
        }
      }
      
      // Add some existing concepts that might be related but not connected
      const relatedExisting = sameCategoryConcepts
        .slice(0, 2) // Reduced from 3 to 2 to avoid clutter
        .map((c: any) => ({
          title: c.title,
          category: c.category,
          reason: 'Same category - consider linking',
          relevanceScore: 0.6
        }))
      
      suggestions.push(...relatedExisting)
      console.log('🔗 [SuggestedConcepts] Added existing category suggestions:', relatedExisting.length)
      
      // Sort by relevance score and limit results
      const finalSuggestions = suggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5) // Reduced from 6 to 5
      
      console.log('🎯 [SuggestedConcepts] Final suggestions count:', finalSuggestions.length)
      console.log('🎯 [SuggestedConcepts] Final suggestions:', finalSuggestions.map(s => s.title))
      
      setSuggestedConcepts(finalSuggestions)
    } catch (error) {
      console.error('❌ [SuggestedConcepts] Error generating suggestions:', error)
      setSuggestedConcepts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 [SuggestedConcepts] Component mounted/updated, generating suggestions...')
    generateSuggestions()
  }, [currentConcept.id])

  const handleCreateAndLinkConcept = async (suggestedTitle: string) => {
    console.log('🔨 [SuggestedConcepts] Creating concept:', suggestedTitle)
    setCreatingConcept(suggestedTitle)
    
    try {
      console.log('📡 [SuggestedConcepts] Calling generate API...')
      // Generate the concept using AI (this calls the enhanced backend endpoint)
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
      
      console.log('📊 [SuggestedConcepts] Generate API response status:', generateResponse.status)
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        console.error('❌ [SuggestedConcepts] Generate API error:', errorData)
        throw new Error(errorData.error || 'Failed to generate concept')
      }
      
      const newConcept = await generateResponse.json()
      console.log('✅ [SuggestedConcepts] Generated concept:', newConcept)
      
      if (!newConcept.concept || !newConcept.concept.id) {
        console.error('❌ [SuggestedConcepts] Invalid response structure:', newConcept)
        throw new Error('Invalid response from concept generation')
      }
      
      console.log('🔗 [SuggestedConcepts] Linking concepts:', currentConcept.id, '←→', newConcept.concept.id)
      // Link the new concept to the current concept
      await connectConcepts(currentConcept.id, newConcept.concept.id)
      
      toast({
        title: "✨ Concept Created & Linked!",
        description: `"${suggestedTitle}" has been created with AI and linked to "${currentConcept.title}"`,
        duration: 4000,
      })
      
      // Remove the suggestion from the list
      setSuggestedConcepts(prev => prev.filter(s => s.title !== suggestedTitle))
      console.log('🧹 [SuggestedConcepts] Removed suggestion from list')
      
      // Refresh the parent component
      console.log('🔄 [SuggestedConcepts] Refreshing parent component...')
      await onConceptCreated()
      
    } catch (error) {
      console.error('❌ [SuggestedConcepts] Error creating concept:', error)
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
      <div className="space-y-3 pt-4 border-t border-dashed border-primary/30">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary animate-pulse" />
          <h4 className="text-sm font-medium text-muted-foreground">🤖 AI is finding related concepts...</h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (suggestedConcepts.length === 0) {
    console.log('🤷 [SuggestedConcepts] No suggestions to display')
    return null
  }

  return (
    <div className="space-y-3 pt-4 border-t border-dashed border-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-medium text-muted-foreground">🤖 AI Suggested Related Concepts</h4>
        <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
          ✨ AI Powered
        </Badge>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        💡 AI analyzed "{currentConcept.title}" and suggests these related concepts:
      </div>
      
      <div className="space-y-2">
        {suggestedConcepts.map((suggestion, index) => (
          <Card key={index} className="group hover:shadow-md transition-all duration-200 border-dashed border-primary/40 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium truncate">{suggestion.title}</h5>
                    <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">💭 {suggestion.reason}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-7 px-2 text-xs border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all"
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
      
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-dashed border-amber-300/50">
        🚀 These concepts will be generated with AI and automatically linked to "{currentConcept.title}"
      </div>
    </div>
  )
} 