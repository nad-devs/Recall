"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Network,
  BookOpen
} from "lucide-react"
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
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

// Custom node component with hover tooltip and effects
const ConceptNode = ({ data }: { data: any }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="flex items-center justify-center text-center p-2 h-full rounded-full overflow-hidden relative transition-all duration-200 ease-in-out"
      onMouseEnter={(e) => {
        setShowTooltip(true)
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.border = '3px solid rgba(255, 255, 255, 0.8)'
        e.currentTarget.style.zIndex = '10'
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false)
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.border = '2px solid transparent'
        e.currentTarget.style.zIndex = '1'
      }}
    >
      <div className="text-sm font-medium leading-tight">{data.label}</div>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-background/95 border text-foreground p-3 rounded-lg w-64 z-50 mb-2 shadow-xl backdrop-blur-sm" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold mb-1">{data.label}</h3>
          <div className="text-xs text-blue-600 mb-1">📁 {data.category}</div>
          {data.summary && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
              {data.summary}
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

// Category label node component
const CategoryNode = ({ data }: { data: any }) => {
  return (
    <div className="flex items-center justify-center text-center h-full w-full">
      <div 
        className="text-lg font-bold text-center px-4 py-2 rounded-lg"
        style={{
          color: data.color,
          backgroundColor: `${data.color}20`,
          border: `2px dashed ${data.color}40`
        }}
      >
        {data.label}
        <div className="text-xs font-normal mt-1">
          {data.count} concept{data.count !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
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
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null)

  // Define node types for custom rendering
  const nodeTypes = useMemo(() => ({ 
    concept: ConceptNode,
    category: CategoryNode
  }), [])

  // Get category color function
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Frontend': '#3b82f6',
      'Backend': '#8b5cf6',
      'Database': '#10b981',
      'AI': '#f59e0b',
      'Design': '#ec4899',
      'Algorithms': '#ef4444',
      'Data Structures': '#14b8a6',
      'System Design': '#8b5cf6',
      'LeetCode Problems': '#f97316',
      'Backend Engineering': '#6366f1',
      'Frontend Engineering': '#0ea5e9',
      'Data Structures and Algorithms': '#8b5cf6',
      'default': '#6b7280'
    }
    return colors[category] || colors.default
  }

  // Generate category labels
  const generateCategoryLabels = (categories: string[], categoryPositions: Record<string, {x: number, y: number}>, conceptCounts: Record<string, number>) => {
    return categories.map((category) => ({
      id: `category-${category}`,
      type: 'category',
      position: {
        x: categoryPositions[category].x - 150, // Center the category label
        y: categoryPositions[category].y - 150
      },
      data: { 
        label: category,
        color: getCategoryColor(category),
        count: conceptCounts[category] || 0
      },
      style: {
        width: 300,
        height: 300,
        backgroundColor: 'transparent',
        border: 'none',
        zIndex: -1
      },
      draggable: false,
      selectable: false
    }))
  }

  // Generate better organized nodes with proper clustering
  const generateNodesWithProperClustering = (concepts: Concept[]) => {
    const nodes: Node[] = []
    
    // Get unique categories and their counts
    const categories = [...new Set(concepts.map(c => c.category || 'Uncategorized'))]
    const conceptCounts = concepts.reduce((acc, concept) => {
      const cat = concept.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const categoryPositions: Record<string, { x: number, y: number }> = {}
    const centerX = 800
    const centerY = 500
    const mainRadius = 400 // Distance between category centers
    
    // Position categories in a circle
    categories.forEach((category, index) => {
      const angle = (index / categories.length) * 2 * Math.PI - Math.PI / 2 // Start from top
      categoryPositions[category] = {
        x: centerX + mainRadius * Math.cos(angle),
        y: centerY + mainRadius * Math.sin(angle)
      }
    })
    
    // Add category label nodes
    const categoryNodes = generateCategoryLabels(categories, categoryPositions, conceptCounts)
    nodes.push(...categoryNodes)
    
    // Group concepts by category
    const grouped = concepts.reduce((acc, concept) => {
      const cat = concept.category || 'Uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(concept)
      return acc
    }, {} as Record<string, Concept[]>)
    
    // Position concept nodes around their category center
    Object.entries(grouped).forEach(([category, items]) => {
      const center = categoryPositions[category]
      const itemCount = items.length
      
      items.forEach((concept, index) => {
        let x, y
        
        if (itemCount <= 8) {
          // Circle layout for few nodes
          const angle = (index / itemCount) * 2 * Math.PI
          const radius = Math.min(120, 80 + itemCount * 5)
          x = center.x + radius * Math.cos(angle)
          y = center.y + radius * Math.sin(angle)
        } else {
          // Spiral layout for many nodes
          const spiralAngle = index * 0.8
          const spiralRadius = 60 + (index * 12)
          x = center.x + spiralRadius * Math.cos(spiralAngle)
          y = center.y + spiralRadius * Math.sin(spiralAngle)
        }
        
        nodes.push({
          id: concept.id,
          type: 'concept',
          position: { x, y },
          data: { 
            label: concept.title,
            category: category,
            summary: concept.summary?.substring(0, 150) || 'No summary available',
            conceptData: concept
          },
          style: {
            background: getCategoryColor(category),
            color: 'white',
            border: '2px solid transparent',
            borderRadius: '50%',
            width: 110,
            height: 110,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '8px',
            fontSize: '11px',
            fontWeight: '500',
            transition: 'all 0.2s ease-in-out',
            zIndex: 1
          }
        })
      })
    })

    return { nodes, categoryPositions }
  }

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
      const concepts = (data.concepts || []) as Concept[]

      // Generate better layout nodes
      const { nodes: graphNodes } = generateNodesWithProperClustering(concepts)
      setNodes(graphNodes)
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [setNodes])

  // Handle node click to navigate to concept details (only for concept nodes)
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'concept') {
      router.push(`/concept/${node.id}`)
    }
  }, [router])

  // Handle right-click on nodes (only for concept nodes)
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'concept') {
      event.preventDefault()
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id
      })
    }
  }, [])

  // Handle background click to close context menu
  const onPaneClick = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Actions for context menu
  const startConnection = (nodeId: string) => {
    console.log('Start connecting from node:', nodeId)
    setContextMenu(null)
  }

  const deleteNode = (nodeId: string) => {
    console.log('Delete node:', nodeId)
    setContextMenu(null)
  }

  // Load data on mount
  useEffect(() => {
    loadConcepts()
  }, [loadConcepts])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <AuthGuard>
      <PageTransition>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className="container flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center">
                  <Network className="h-5 w-5 mr-2 text-primary" />
                  <h1 className="text-xl font-semibold">Knowledge Graph</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/concepts">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Concepts
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
                  {error}
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ 
                  padding: 0.15,
                  includeHiddenNodes: false 
                }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
                minZoom={0.2}
                maxZoom={1.5}
                nodesDraggable={true}
                attributionPosition="bottom-left"
              >
                <Background gap={20} size={1} color="#333" />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.type === 'category') return 'transparent'
                    return (node.style?.background as string) || '#666'
                  }}
                  maskColor="rgba(0, 0, 0, 0.2)"
                />
                <Panel position="top-right" className="bg-background/60 p-2 rounded shadow backdrop-blur-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Concepts: {nodes.filter(n => n.type === 'concept').length} | Categories: {nodes.filter(n => n.type === 'category').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    💡 Hover for details • Click to explore • Right-click for options
                  </div>
                </Panel>
              </ReactFlow>
            )}

            {/* Context Menu */}
            {contextMenu && (
              <div
                className="fixed bg-background shadow-lg border rounded-md p-2 z-[1000]"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col gap-1 text-sm">
                  <button 
                    className="hover:bg-accent px-3 py-1.5 rounded-sm text-left flex items-center gap-2"
                    onClick={() => startConnection(contextMenu.nodeId)}
                  >
                    <span className="h-4 w-4">↔</span>
                    Connect to concept
                  </button>
                  <button 
                    className="hover:bg-accent px-3 py-1.5 rounded-sm text-left flex items-center gap-2 text-destructive"
                    onClick={() => deleteNode(contextMenu.nodeId)}
                  >
                    <span className="h-4 w-4">×</span>
                    Delete node
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 