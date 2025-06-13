"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Network,
  BookOpen,
  Minimize2,
  Maximize2
} from "lucide-react"
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
  NodeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'
import { PageTransition } from "@/components/page-transition"
import { AuthGuard } from "@/components/auth-guard"
import { getAuthHeaders } from "@/lib/auth-utils"
import featureFlags from '@/lib/feature-flags'

// Define types for our concepts
interface Concept {
  id: string
  title: string
  category: string
  summary?: string
  details?: string
  [key: string]: any
}

export default function GraphPage() {
  // Check feature flag - render dashboard redirect if disabled
  if (!featureFlags.enableKnowledgeGraph) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Feature Unavailable</h1>
              <p className="text-muted-foreground">The Knowledge Graph feature is currently disabled.</p>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    );
  }

  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [showCollapseAll, setShowCollapseAll] = useState(false)

  // Simplified category colors with better contrast
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Machine Learning': '#8b5cf6',
      'Data Engineering': '#10b981', 
      'LeetCode Problems': '#f59e0b',
      'Frontend': '#3b82f6',
      'Backend': '#ef4444',
      'Database': '#06b6d4',
      'Cloud Engineering': '#84cc16',
      'Artificial Intelligence': '#a855f7',
      'AI': '#a855f7',
      'System Design': '#ec4899',
      'Algorithms': '#f97316',
      'Data Structures': '#14b8a6',
      'General': '#6b7280',
      'default': '#6b7280'
    }
    return colors[category] || colors.default
  }

  // Custom Category Node Component
  const CategoryNode = ({ data, id }: { data: any, id: string }) => {
    const isExpanded = expandedCategories.has(id)
    
    return (
      <div
        onClick={() => toggleCategory(id, data.concepts)}
        className="relative cursor-pointer transition-all duration-300 ease-in-out"
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          backgroundColor: getCategoryColor(data.label),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isExpanded ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isExpanded ? '0 0 40px rgba(255,255,255,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
          border: isExpanded ? '4px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.2)',
          zIndex: isExpanded ? 10 : 1
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
          }
        }}
      >
        <div className="text-white font-bold text-center leading-tight mb-2" style={{ fontSize: '14px' }}>
          {data.label}
        </div>
        <div className="text-white/80 text-center mb-1" style={{ fontSize: '11px' }}>
          {data.conceptCount} concept{data.conceptCount !== 1 ? 's' : ''}
        </div>
        <div className="text-white/60 text-center" style={{ fontSize: '9px' }}>
          {isExpanded ? '🔽 Click to collapse' : '🔼 Click to expand'}
        </div>
        
        {/* Pulse animation for unexpanded categories */}
        {!isExpanded && (
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              backgroundColor: getCategoryColor(data.label),
              opacity: 0.3,
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </div>
    )
  }

  // Custom Concept Node Component
  const ConceptNode = ({ data }: { data: any }) => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
      <div
        onClick={() => router.push(`/concept/${data.concept.id}`)}
        className="relative cursor-pointer transition-all duration-200 ease-in-out"
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'white',
          textAlign: 'center',
          padding: '8px',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          setShowTooltip(true)
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.border = '3px solid rgba(255,255,255,0.8)'
          e.currentTarget.style.zIndex = '20'
        }}
        onMouseLeave={(e) => {
          setShowTooltip(false)
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.border = '2px solid rgba(255,255,255,0.5)'
          e.currentTarget.style.zIndex = '1'
        }}
      >
        <div className="font-medium leading-tight break-words">
          {data.label}
        </div>
        
        {showTooltip && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-background/95 border text-foreground p-3 rounded-lg w-64 z-50 mb-2 shadow-xl backdrop-blur-sm" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-1">{data.label}</h3>
            <div className="text-xs text-blue-600 mb-1">📁 {data.concept.category}</div>
            {data.concept.summary && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                {data.concept.summary.substring(0, 150)}...
              </p>
            )}
            <div className="text-xs mt-1 pt-1 border-t text-primary font-medium">
              Click to view details
            </div>
          </div>
        )}
      </div>
    )
  }

  // Define node types for custom rendering
  const nodeTypes = useMemo(() => ({ 
    category: CategoryNode,
    concept: ConceptNode
  }), [expandedCategories])

  // Initialize with just category nodes
  const initializeCategoryNodes = useCallback((conceptsData: Concept[]) => {
    const categories: Record<string, Concept[]> = {}
    
    // Group concepts by main category
    conceptsData.forEach(concept => {
      const mainCategory = concept.category?.split(' > ')[0] || 'General'
      if (!categories[mainCategory]) {
        categories[mainCategory] = []
      }
      categories[mainCategory].push(concept)
    })

    // Create category nodes in a circle
    const categoryNodes: Node[] = []
    const categoryNames = Object.keys(categories)
    const radius = Math.min(300, Math.max(200, categoryNames.length * 30))
    const centerX = 600
    const centerY = 400

    categoryNames.forEach((category, index) => {
      const angle = (index / categoryNames.length) * 2 * Math.PI - Math.PI / 2 // Start from top
      
      categoryNodes.push({
        id: `category-${category}`,
        type: 'category',
        position: {
          x: centerX + radius * Math.cos(angle) - 80,
          y: centerY + radius * Math.sin(angle) - 80
        },
        data: {
          label: category,
          conceptCount: categories[category].length,
          concepts: categories[category]
        },
        draggable: false
      })
    })

    setNodes(categoryNodes)
    setEdges([])
  }, [setNodes, setEdges])

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string, categoryConcepts: Concept[]) => {
    const newExpanded = new Set(expandedCategories)
    
    if (newExpanded.has(categoryId)) {
      // Collapse: remove concept nodes and edges
      newExpanded.delete(categoryId)
      setNodes(current => 
        current.filter(node => 
          node.type === 'category' || !node.id.startsWith(`concept-${categoryId}`)
        )
      )
      setEdges(current => 
        current.filter(edge => !edge.id.startsWith(`edge-${categoryId}`))
      )
    } else {
      // Expand: add concept nodes
      newExpanded.add(categoryId)
      addConceptNodes(categoryId, categoryConcepts)
    }
    
    setExpandedCategories(newExpanded)
    setShowCollapseAll(newExpanded.size > 0)
  }, [expandedCategories, setNodes, setEdges])

  // Add concept nodes when category is expanded
  const addConceptNodes = useCallback((categoryId: string, categoryConcepts: Concept[]) => {
    setNodes(current => {
      const categoryNode = current.find(n => n.id === categoryId)
      if (!categoryNode) return current

      const conceptNodes: Node[] = []
      const centerX = categoryNode.position.x + 80
      const centerY = categoryNode.position.y + 80
      const conceptRadius = Math.min(250, Math.max(150, categoryConcepts.length * 20))

      categoryConcepts.forEach((concept, index) => {
        const angle = (index / categoryConcepts.length) * 2 * Math.PI
        const nodeId = `concept-${categoryId}-${concept.id}`
        
        conceptNodes.push({
          id: nodeId,
          type: 'concept',
          position: {
            x: centerX + conceptRadius * Math.cos(angle) - 50,
            y: centerY + conceptRadius * Math.sin(angle) - 50
          },
          data: {
            label: concept.title,
            concept: concept
          },
          draggable: true
        })
      })

      return [...current, ...conceptNodes]
    })

    // Add edges from category to concepts
    setEdges(current => {
      const newEdges: Edge[] = []
      
      categoryConcepts.forEach((concept) => {
        const nodeId = `concept-${categoryId}-${concept.id}`
        newEdges.push({
          id: `edge-${categoryId}-${nodeId}`,
          source: categoryId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: 'rgba(255,255,255,0.3)',
            strokeWidth: 2
          }
        })
      })

      return [...current, ...newEdges]
    })
  }, [setNodes, setEdges])

  // Collapse all categories
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set())
    setShowCollapseAll(false)
    initializeCategoryNodes(concepts)
  }, [concepts, initializeCategoryNodes])

  // Load concepts data
  const loadConcepts = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/concepts', { 
        headers: getAuthHeaders() 
      })

      if (!response.ok) {
        throw new Error('Failed to load concepts')
      }

      const data = await response.json()
      const conceptsData = (data.concepts || []) as Concept[]

      setConcepts(conceptsData)
      initializeCategoryNodes(conceptsData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [initializeCategoryNodes])

  // Load data on mount
  useEffect(() => {
    loadConcepts()
  }, [loadConcepts])

  return (
    <AuthGuard>
      <PageTransition>
        <div className="flex flex-col h-screen bg-slate-900">
          {/* Header */}
          <header className="border-b border-slate-700 bg-slate-800/95 backdrop-blur supports-[backdrop-filter]:bg-slate-800/60 z-10">
            <div className="container flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-700">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center">
                  <Network className="h-5 w-5 mr-2 text-blue-400" />
                  <h1 className="text-xl font-semibold text-white">Knowledge Graph</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showCollapseAll && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={collapseAll}
                    className="text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Collapse All
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild className="text-white border-slate-600 hover:bg-slate-700">
                  <Link href="/concepts">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Concepts
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Instructions */}
          <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="text-slate-300 text-sm">
                💡 <strong>Click on category bubbles</strong> to explore concepts • <strong>Hover</strong> for details • <strong>Click concepts</strong> to view full details
              </div>
              <div className="text-slate-400 text-xs">
                Categories: {nodes.filter(n => n.type === 'category').length} | 
                Expanded: {expandedCategories.size} | 
                Total Concepts: {concepts.length}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <p className="text-slate-300">Loading knowledge graph...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-900/20 text-red-400 px-6 py-4 rounded-lg border border-red-800">
                  {error}
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ 
                  padding: 0.2,
                  maxZoom: 1.2,
                  includeHiddenNodes: false 
                }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                minZoom={0.4}
                maxZoom={2}
                attributionPosition="bottom-left"
                className="bg-slate-900"
              >
                <Background 
                  gap={20} 
                  size={1} 
                  color="rgba(148, 163, 184, 0.1)" 
                  className="bg-slate-900"
                />
                <Controls className="bg-slate-800 border-slate-600 text-white" />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.type === 'category') return getCategoryColor(node.data?.label || 'default')
                    return 'rgba(255,255,255,0.3)'
                  }}
                  maskColor="rgba(15, 23, 42, 0.8)"
                  className="bg-slate-800 border-slate-600"
                />
              </ReactFlow>
            )}
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 