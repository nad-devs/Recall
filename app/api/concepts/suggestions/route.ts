import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conceptId, conceptTitle, conceptCategory, conceptSummary, conceptDetails } = body

    if (!conceptId || !conceptTitle || !conceptCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: conceptId, conceptTitle, conceptCategory' },
        { status: 400 }
      )
    }

    // Get user authentication
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all existing concepts for this user to check against
    const existingConcepts = await prisma.concept.findMany({
      where: { userId },
      select: { id: true, title: true, category: true, relatedConcepts: true }
    })

    // Find the current concept to get its related concepts
    const currentConcept = await prisma.concept.findUnique({
      where: { id: conceptId },
      select: { relatedConcepts: true }
    })

    // Parse related concepts from JSON string
    let relatedConceptIds: string[] = []
    if (currentConcept?.relatedConcepts) {
      try {
        const parsed = JSON.parse(currentConcept.relatedConcepts)
        relatedConceptIds = Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.error('Error parsing related concepts:', error)
      }
    }

    const relatedIds = new Set<string>(relatedConceptIds)

    // Generate intelligent suggestions based on concept analysis
    const suggestions = generateIntelligentSuggestions(
      conceptTitle, 
      conceptCategory, 
      conceptSummary, 
      conceptDetails,
      existingConcepts,
      relatedIds
    )

    return NextResponse.json({
      suggestions: suggestions.slice(0, 6) // Limit to 6 suggestions
    })

  } catch (error) {
    console.error('Error generating concept suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

function generateIntelligentSuggestions(
  title: string,
  category: string,
  summary?: string,
  details?: string,
  existingConcepts: Array<{ id: string; title: string; category: string }> = [],
  relatedIds: Set<string> = new Set()
): Array<{ title: string; reason: string; relevanceScore: number }> {
  const suggestions: Array<{ title: string; reason: string; relevanceScore: number }> = []
  const baseTitle = title.toLowerCase()
  const context = `${summary || ''} ${details || ''}`.toLowerCase()

  // Helper function to check if concept already exists
  const conceptExists = (suggestedTitle: string) => 
    existingConcepts.some(c => c.title.toLowerCase() === suggestedTitle.toLowerCase())

  // Helper function to add suggestion if it doesn't exist
  const addSuggestion = (suggestedTitle: string, reason: string, score: number = 0.8) => {
    if (!conceptExists(suggestedTitle)) {
      suggestions.push({ title: suggestedTitle, reason, relevanceScore: score })
    }
  }

  // Universal concepts for technical topics
  if (category.includes('Algorithm') || category.includes('Data Structure')) {
    addSuggestion('Time Complexity Analysis', 'Performance analysis for algorithms/data structures', 0.9)
    addSuggestion('Space Complexity Analysis', 'Memory usage analysis', 0.85)
    addSuggestion('Big O Notation', 'Complexity representation standard', 0.8)
  }

  // Algorithm & Data Structure specific patterns
  if (category.includes('Algorithm') || category.includes('Data Structure')) {
    
    // Redis-specific suggestions
    if (baseTitle.includes('redis')) {
      addSuggestion('Redis Cache Eviction Policies', 'Redis memory management strategies', 0.95)
      addSuggestion('Redis Persistence Mechanisms', 'Data durability in Redis (RDB vs AOF)', 0.9)
      addSuggestion('Redis Clustering', 'Scaling Redis horizontally', 0.85)
      addSuggestion('Redis Pub/Sub Pattern', 'Message broadcasting in Redis', 0.8)
      addSuggestion('Redis Transactions', 'Atomic operations in Redis', 0.8)
      addSuggestion('Redis Lua Scripting', 'Server-side scripting in Redis', 0.75)
      addSuggestion('Redis Memory Optimization', 'Efficient Redis memory usage', 0.8)
      addSuggestion('Redis Sentinel', 'High availability for Redis', 0.75)
    }

    // Hash/Dictionary/Map patterns
    if (baseTitle.includes('hash') || baseTitle.includes('dictionary') || baseTitle.includes('map')) {
      addSuggestion('Hash Collision Resolution', 'Handling hash conflicts', 0.9)
      addSuggestion('Hash Functions', 'Core hashing mechanism', 0.85)
      addSuggestion('Load Factor', 'Hash table performance metric', 0.8)
      addSuggestion('Open Addressing', 'Hash collision resolution technique', 0.8)
      addSuggestion('Chaining', 'Hash collision resolution technique', 0.8)
      addSuggestion('Bloom Filter', 'Probabilistic hash-based structure', 0.75)
      addSuggestion('Consistent Hashing', 'Advanced hashing strategy', 0.75)
    }

    // Array/List patterns
    if (baseTitle.includes('array') || baseTitle.includes('list')) {
      addSuggestion('Two Pointer Technique', 'Common array manipulation pattern', 0.9)
      addSuggestion('Sliding Window Pattern', 'Efficient array processing method', 0.85)
      addSuggestion('Dynamic Array Resizing', 'Array implementation detail', 0.8)
      addSuggestion('Array vs Linked List', 'Fundamental data structure comparison', 0.8)
    }

    // Tree patterns
    if (baseTitle.includes('tree')) {
      addSuggestion('Tree Traversal Methods', 'Fundamental tree operations', 0.9)
      addSuggestion('Binary Search Tree', 'Core tree data structure', 0.85)
      addSuggestion('Balanced Tree Properties', 'Tree optimization concepts', 0.8)
      addSuggestion('Tree Height and Depth', 'Tree structural properties', 0.8)
      addSuggestion('AVL Tree', 'Self-balancing tree implementation', 0.75)
      addSuggestion('Red-Black Tree', 'Self-balancing tree implementation', 0.75)
    }

    // Graph patterns
    if (baseTitle.includes('graph')) {
      addSuggestion('Graph Traversal Algorithms', 'Essential graph operations', 0.9)
      addSuggestion('Depth-First Search (DFS)', 'Fundamental graph traversal', 0.85)
      addSuggestion('Breadth-First Search (BFS)', 'Fundamental graph traversal', 0.85)
      addSuggestion('Shortest Path Algorithms', 'Common graph problem category', 0.8)
      addSuggestion('Topological Sorting', 'Important graph algorithm', 0.8)
    }

    // Sorting patterns
    if (baseTitle.includes('sort')) {
      addSuggestion('Comparison-based Sorting', 'Sorting algorithm category', 0.85)
      addSuggestion('Stable vs Unstable Sorting', 'Sorting algorithm property', 0.8)
      addSuggestion('In-place Sorting', 'Memory optimization technique', 0.8)
      addSuggestion('Merge Sort', 'Divide and conquer sorting', 0.75)
      addSuggestion('Quick Sort', 'Efficient comparison sort', 0.75)
    }

    // Stack patterns
    if (baseTitle.includes('stack')) {
      addSuggestion('LIFO Principle', 'Stack operating principle', 0.85)
      addSuggestion('Stack vs Queue', 'Fundamental data structure comparison', 0.8)
      addSuggestion('Call Stack', 'Stack application in programming', 0.8)
      addSuggestion('Expression Evaluation', 'Common stack application', 0.75)
    }

    // Queue patterns
    if (baseTitle.includes('queue')) {
      addSuggestion('FIFO Principle', 'Queue operating principle', 0.85)
      addSuggestion('Priority Queue', 'Enhanced queue variant', 0.8)
      addSuggestion('Circular Queue', 'Efficient queue implementation', 0.75)
      addSuggestion('Deque (Double-ended Queue)', 'Flexible queue variant', 0.75)
    }
  }

  // System Design & Architecture patterns
  if (category.includes('System Design') || category.includes('Architecture') || 
      category.includes('Backend') || category.includes('Database')) {
    
    addSuggestion('Scalability Patterns', 'System growth considerations', 0.85)
    addSuggestion('Performance Optimization', 'System efficiency techniques', 0.8)
    addSuggestion('Reliability and Fault Tolerance', 'System robustness', 0.8)

    // Redis for system design
    if (baseTitle.includes('redis')) {
      addSuggestion('Redis as Session Store', 'Web session management with Redis', 0.9)
      addSuggestion('Redis Caching Strategies', 'Cache-aside, write-through patterns', 0.85)
      addSuggestion('Redis for Real-time Analytics', 'Stream processing and analytics', 0.8)
      addSuggestion('Redis High Availability Setup', 'Master-slave replication and failover', 0.8)
      addSuggestion('Redis Performance Tuning', 'Optimization techniques for Redis', 0.75)
    }

    // Cache patterns
    if (baseTitle.includes('cache') || baseTitle.includes('caching')) {
      addSuggestion('Cache Eviction Policies', 'Cache management strategy', 0.9)
      addSuggestion('LRU Cache', 'Popular eviction policy', 0.85)
      addSuggestion('Cache Coherence', 'Distributed caching concern', 0.8)
      addSuggestion('Write-Through vs Write-Back', 'Cache writing strategies', 0.8)
      addSuggestion('Distributed Caching', 'Scalable caching approach', 0.75)
    }

    // Database patterns
    if (baseTitle.includes('database') || baseTitle.includes('db')) {
      addSuggestion('Database Indexing', 'Database performance optimization', 0.9)
      addSuggestion('ACID Properties', 'Database transaction guarantees', 0.85)
      addSuggestion('Database Sharding', 'Database scaling technique', 0.8)
      addSuggestion('SQL vs NoSQL', 'Database paradigm comparison', 0.8)
      addSuggestion('CAP Theorem', 'Distributed database constraints', 0.75)
    }

    // Load balancer patterns
    if (baseTitle.includes('load') || baseTitle.includes('balancer')) {
      addSuggestion('Load Balancing Algorithms', 'Distribution strategies', 0.85)
      addSuggestion('Round Robin Algorithm', 'Simple load balancing strategy', 0.8)
      addSuggestion('Health Check Mechanisms', 'Load balancer monitoring', 0.8)
      addSuggestion('Sticky Sessions', 'Session affinity management', 0.75)
    }

    // API patterns
    if (baseTitle.includes('api') || baseTitle.includes('rest') || baseTitle.includes('graphql')) {
      addSuggestion('API Rate Limiting', 'API protection mechanism', 0.85)
      addSuggestion('REST vs GraphQL', 'API paradigm comparison', 0.8)
      addSuggestion('API Versioning', 'API evolution strategy', 0.8)
      addSuggestion('API Gateway', 'API management layer', 0.75)
    }
  }

  // Frontend & Web Development patterns
  if (category.includes('Frontend') || category.includes('Web')) {
    
    // React patterns
    if (baseTitle.includes('react') || baseTitle.includes('component')) {
      addSuggestion('React Hooks Patterns', 'Modern React development', 0.9)
      addSuggestion('Component Lifecycle', 'Component behavior management', 0.85)
      addSuggestion('State Management Patterns', 'Application state handling', 0.8)
      addSuggestion('Virtual DOM', 'React rendering optimization', 0.8)
      addSuggestion('React Context API', 'State sharing mechanism', 0.75)
    }

    // Performance patterns
    if (baseTitle.includes('performance') || baseTitle.includes('optimization')) {
      addSuggestion('Code Splitting', 'Performance optimization technique', 0.85)
      addSuggestion('Lazy Loading', 'Resource loading optimization', 0.8)
      addSuggestion('Bundle Optimization', 'Asset delivery efficiency', 0.8)
    }
  }

  // Sort by relevance score and return
  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
} 