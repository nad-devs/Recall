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
      
      // Universal concepts that relate to most technical concepts
      const universalSuggestions = []
      if (currentConcept.category.includes('Algorithm') || currentConcept.category.includes('Data Structure')) {
        universalSuggestions.push(
          { title: 'Time Complexity Analysis', reason: 'Performance analysis for any algorithm/data structure' },
          { title: 'Space Complexity Analysis', reason: 'Memory usage analysis' },
          { title: 'Big O Notation', reason: 'Complexity representation standard' }
        )
      }
      
      if (currentConcept.category.includes('Algorithm') || currentConcept.category.includes('Data Structure')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🔤 [SuggestedConcepts] Analyzing algorithm/data structure title:', baseTitle)
        
        // Hash Table / HashMap / Dictionary relationships
        if (baseTitle.includes('hash') || baseTitle.includes('dictionary') || baseTitle.includes('map')) {
          console.log('🔑 [SuggestedConcepts] Hash/Dictionary/Map concept detected, adding related suggestions')
          conceptSuggestions.push(
            { title: 'Hash Collision Resolution', reason: 'Handling hash conflicts' },
            { title: 'Hash Functions', reason: 'Core hashing mechanism' },
            { title: 'Dictionary Implementation', reason: 'Alternative name for hash tables' },
            { title: 'HashMap vs HashSet', reason: 'Related hash-based data structures' },
            { title: 'Load Factor', reason: 'Hash table performance metric' },
            { title: 'Open Addressing', reason: 'Hash collision resolution technique' },
            { title: 'Chaining', reason: 'Hash collision resolution technique' },
            { title: 'Bloom Filter', reason: 'Probabilistic hash-based structure' },
            { title: 'Consistent Hashing', reason: 'Advanced hashing strategy' }
          )
        }
        
        // Array / List relationships
        if (baseTitle.includes('array') || baseTitle.includes('list')) {
          console.log('📊 [SuggestedConcepts] Array/list concept detected, adding related suggestions')
          conceptSuggestions.push(
            { title: 'Two Pointer Technique', reason: 'Common array manipulation pattern' },
            { title: 'Sliding Window Pattern', reason: 'Efficient array processing method' },
            { title: 'Dynamic Array Resizing', reason: 'Array implementation detail' },
            { title: 'Array vs Linked List', reason: 'Fundamental data structure comparison' },
            { title: 'Contiguous Memory Layout', reason: 'Array storage principle' },
            { title: 'Array Indexing', reason: 'Random access mechanism' },
            { title: 'ArrayList vs LinkedList', reason: 'Implementation trade-offs' }
          )
        }
        
        // Tree relationships
        if (baseTitle.includes('tree')) {
          console.log('🌳 [SuggestedConcepts] Tree concept detected, adding tree suggestions')
          conceptSuggestions.push(
            { title: 'Tree Traversal Methods', reason: 'Fundamental tree operations' },
            { title: 'Binary Search Tree', reason: 'Core tree data structure' },
            { title: 'Balanced Tree Properties', reason: 'Tree optimization concepts' },
            { title: 'Tree Height and Depth', reason: 'Tree structural properties' },
            { title: 'AVL Tree', reason: 'Self-balancing tree implementation' },
            { title: 'Red-Black Tree', reason: 'Self-balancing tree implementation' },
            { title: 'Tree Rotation', reason: 'Balancing mechanism' },
            { title: 'Heap Data Structure', reason: 'Specialized tree structure' }
          )
        }
        
        // Graph relationships
        if (baseTitle.includes('graph')) {
          console.log('🕸️ [SuggestedConcepts] Graph concept detected, adding graph suggestions')
          conceptSuggestions.push(
            { title: 'Graph Traversal Algorithms', reason: 'Essential graph operations' },
            { title: 'Depth-First Search (DFS)', reason: 'Fundamental graph traversal' },
            { title: 'Breadth-First Search (BFS)', reason: 'Fundamental graph traversal' },
            { title: 'Shortest Path Algorithms', reason: 'Common graph problem category' },
            { title: 'Topological Sorting', reason: 'Important graph algorithm' },
            { title: 'Graph Representation', reason: 'Adjacency list vs matrix' },
            { title: 'Directed vs Undirected Graphs', reason: 'Graph type distinction' },
            { title: 'Graph Cycles', reason: 'Important graph property' }
          )
        }
        
        // Sorting relationships
        if (baseTitle.includes('sort')) {
          console.log('🔄 [SuggestedConcepts] Sort concept detected, adding sorting suggestions')
          conceptSuggestions.push(
            { title: 'Comparison-based Sorting', reason: 'Sorting algorithm category' },
            { title: 'Non-comparison Sorting', reason: 'Alternative sorting approaches' },
            { title: 'Stable vs Unstable Sorting', reason: 'Sorting algorithm property' },
            { title: 'In-place Sorting', reason: 'Memory optimization technique' },
            { title: 'Merge Sort', reason: 'Divide and conquer sorting' },
            { title: 'Quick Sort', reason: 'Efficient comparison sort' },
            { title: 'Heap Sort', reason: 'Heap-based sorting algorithm' },
            { title: 'Radix Sort', reason: 'Non-comparison sorting' }
          )
        }
        
        // Search relationships
        if (baseTitle.includes('search')) {
          console.log('🔍 [SuggestedConcepts] Search concept detected, adding search suggestions')
          conceptSuggestions.push(
            { title: 'Binary Search', reason: 'Fundamental search algorithm' },
            { title: 'Linear Search', reason: 'Basic search method' },
            { title: 'Search Space Optimization', reason: 'Search efficiency techniques' },
            { title: 'Search vs Sort Trade-offs', reason: 'Algorithm design decisions' }
          )
        }
        
        // Stack relationships
        if (baseTitle.includes('stack')) {
          console.log('📚 [SuggestedConcepts] Stack concept detected, adding stack suggestions')
          conceptSuggestions.push(
            { title: 'LIFO Principle', reason: 'Stack operating principle' },
            { title: 'Stack vs Queue', reason: 'Fundamental data structure comparison' },
            { title: 'Call Stack', reason: 'Stack application in programming' },
            { title: 'Stack Overflow', reason: 'Stack limitation concept' },
            { title: 'Expression Evaluation', reason: 'Common stack application' }
          )
        }
        
        // Queue relationships
        if (baseTitle.includes('queue')) {
          console.log('🚶 [SuggestedConcepts] Queue concept detected, adding queue suggestions')
          conceptSuggestions.push(
            { title: 'FIFO Principle', reason: 'Queue operating principle' },
            { title: 'Priority Queue', reason: 'Enhanced queue variant' },
            { title: 'Circular Queue', reason: 'Efficient queue implementation' },
            { title: 'Deque (Double-ended Queue)', reason: 'Flexible queue variant' },
            { title: 'Queue vs Stack', reason: 'Fundamental data structure comparison' }
          )
        }
        
        // Heap relationships
        if (baseTitle.includes('heap')) {
          conceptSuggestions.push(
            { title: 'Min Heap vs Max Heap', reason: 'Heap variants' },
            { title: 'Heap Sort', reason: 'Heap-based sorting algorithm' },
            { title: 'Priority Queue Implementation', reason: 'Heap application' },
            { title: 'Heapify Operation', reason: 'Heap construction method' }
          )
        }
        
        // Dynamic Programming relationships
        if (baseTitle.includes('dynamic') || baseTitle.includes('dp') || baseTitle.includes('memoization')) {
          conceptSuggestions.push(
            { title: 'Memoization', reason: 'DP optimization technique' },
            { title: 'Tabulation', reason: 'Bottom-up DP approach' },
            { title: 'Optimal Substructure', reason: 'DP requirement' },
            { title: 'Overlapping Subproblems', reason: 'DP characteristic' }
          )
        }
      }
      
      // System Design and Architecture relationships
      if (currentConcept.category.includes('System Design') || currentConcept.category.includes('Architecture') || currentConcept.category.includes('Backend')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🏗️ [SuggestedConcepts] System design concept detected, analyzing:', baseTitle)
        
        // Universal system design concepts
        universalSuggestions.push(
          { title: 'Scalability Patterns', reason: 'System growth considerations' },
          { title: 'Performance Optimization', reason: 'System efficiency techniques' },
          { title: 'Reliability and Fault Tolerance', reason: 'System robustness' }
        )
        
        // Cache relationships
        if (baseTitle.includes('cache') || baseTitle.includes('caching')) {
          console.log('💾 [SuggestedConcepts] Cache concept detected, adding cache suggestions')
          conceptSuggestions.push(
            { title: 'Cache Eviction Policies', reason: 'Cache management strategy' },
            { title: 'LRU Cache', reason: 'Popular eviction policy' },
            { title: 'LFU Cache', reason: 'Frequency-based eviction' },
            { title: 'Cache Coherence', reason: 'Distributed caching concern' },
            { title: 'Write-Through vs Write-Back', reason: 'Cache writing strategies' },
            { title: 'Cache Miss vs Cache Hit', reason: 'Cache performance metrics' },
            { title: 'Distributed Caching', reason: 'Scalable caching approach' },
            { title: 'Redis Implementation', reason: 'Popular cache technology' }
          )
        }
        
        // Database relationships
        if (baseTitle.includes('database') || baseTitle.includes('db')) {
          console.log('🗄️ [SuggestedConcepts] Database concept detected, adding DB suggestions')
          conceptSuggestions.push(
            { title: 'Database Indexing', reason: 'Database performance optimization' },
            { title: 'ACID Properties', reason: 'Database transaction guarantees' },
            { title: 'Database Sharding', reason: 'Database scaling technique' },
            { title: 'SQL vs NoSQL', reason: 'Database paradigm comparison' },
            { title: 'Database Normalization', reason: 'Data organization principle' },
            { title: 'CAP Theorem', reason: 'Distributed database constraints' },
            { title: 'Database Replication', reason: 'Data redundancy strategy' },
            { title: 'Query Optimization', reason: 'Database performance tuning' }
          )
        }
        
        // Load Balancer relationships
        if (baseTitle.includes('load') || baseTitle.includes('balancer')) {
          console.log('⚖️ [SuggestedConcepts] Load balancer concept detected, adding related suggestions')
          conceptSuggestions.push(
            { title: 'Load Balancing Algorithms', reason: 'Distribution strategies' },
            { title: 'Round Robin Algorithm', reason: 'Simple load balancing strategy' },
            { title: 'Weighted Round Robin', reason: 'Advanced distribution method' },
            { title: 'Least Connections', reason: 'Dynamic load balancing' },
            { title: 'Health Check Mechanisms', reason: 'Load balancer monitoring' },
            { title: 'Sticky Sessions', reason: 'Session affinity management' },
            { title: 'Layer 4 vs Layer 7 Load Balancing', reason: 'Load balancer types' },
            { title: 'Auto Scaling', reason: 'Dynamic capacity management' }
          )
        }
        
        // CDN relationships
        if (baseTitle.includes('cdn') || baseTitle.includes('content delivery')) {
          console.log('🌐 [SuggestedConcepts] CDN concept detected, adding CDN suggestions')
          conceptSuggestions.push(
            { title: 'Edge Computing', reason: 'CDN edge optimization' },
            { title: 'Cache Invalidation', reason: 'CDN cache management' },
            { title: 'Geographic Load Distribution', reason: 'CDN routing strategy' },
            { title: 'Origin Server', reason: 'CDN source concept' },
            { title: 'Edge Caching', reason: 'CDN performance technique' },
            { title: 'Global Server Load Balancing', reason: 'CDN traffic management' }
          )
        }
        
        // API relationships
        if (baseTitle.includes('api') || baseTitle.includes('rest') || baseTitle.includes('graphql')) {
          conceptSuggestions.push(
            { title: 'API Rate Limiting', reason: 'API protection mechanism' },
            { title: 'REST vs GraphQL', reason: 'API paradigm comparison' },
            { title: 'API Versioning', reason: 'API evolution strategy' },
            { title: 'API Gateway', reason: 'API management layer' },
            { title: 'Authentication and Authorization', reason: 'API security' }
          )
        }
        
        // Microservices relationships
        if (baseTitle.includes('microservice') || baseTitle.includes('service')) {
          conceptSuggestions.push(
            { title: 'Service Discovery', reason: 'Microservice coordination' },
            { title: 'Circuit Breaker Pattern', reason: 'Service resilience' },
            { title: 'Event-Driven Architecture', reason: 'Service communication pattern' },
            { title: 'Monolith vs Microservices', reason: 'Architecture comparison' }
          )
        }
      }
      
      // Frontend and Web Development relationships
      if (currentConcept.category.includes('Frontend') || currentConcept.category.includes('Web')) {
        const baseTitle = currentConcept.title.toLowerCase()
        console.log('🖥️ [SuggestedConcepts] Frontend concept detected, analyzing:', baseTitle)
        
        // React relationships
        if (baseTitle.includes('react') || baseTitle.includes('component')) {
          console.log('⚛️ [SuggestedConcepts] React concept detected, adding React suggestions')
          conceptSuggestions.push(
            { title: 'React Hooks Patterns', reason: 'Modern React development' },
            { title: 'Component Lifecycle', reason: 'Component behavior management' },
            { title: 'State Management Patterns', reason: 'Application state handling' },
            { title: 'Props vs State', reason: 'React data concepts' },
            { title: 'Virtual DOM', reason: 'React rendering optimization' },
            { title: 'React Context API', reason: 'State sharing mechanism' },
            { title: 'useEffect Hook', reason: 'Side effect management' },
            { title: 'useState Hook', reason: 'State management hook' }
          )
        }
        
        // Performance relationships
        if (baseTitle.includes('performance') || baseTitle.includes('optimization')) {
          conceptSuggestions.push(
            { title: 'Code Splitting', reason: 'Performance optimization technique' },
            { title: 'Lazy Loading', reason: 'Resource loading optimization' },
            { title: 'Bundle Optimization', reason: 'Asset delivery efficiency' },
            { title: 'Caching Strategies', reason: 'Client-side performance' }
          )
        }
      }
      
      // Add universal suggestions for relevant categories
      conceptSuggestions.push(...universalSuggestions)
      
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