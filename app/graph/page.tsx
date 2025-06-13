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

// Custom node component with hover tooltip
const ConceptNode = ({ data }: { data: any }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="flex items-center justify-center text-center p-2 h-full rounded-full overflow-hidden relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-sm font-medium">{data.label}</div>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-background/90 border text-foreground p-3 rounded-lg w-64 z-50 mb-2 shadow-lg" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold mb-1">{data.label}</h3>
          {data.summary && (
            <p className="text-xs text-muted-foreground mb-1 line-clamp-3">
              {data.summary}
            </p>
          )}
          <div className="text-xs mt-1 pt-1 border-t text-primary">
            Click to view details
          </div>
        </div>
      )}
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
    concept: ConceptNode 
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

  // Group by function
  const groupBy = <T extends Record<string, any>>(
    array: T[],
    key: keyof T
  ): Record<string, T[]> => {
    return array.reduce((result, currentItem) => {
      const groupKey = currentItem[key] as string || 'Uncategorized'
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(currentItem)
      return result
    }, {} as Record<string, T[]>)
  }

  // Generate better organized nodes
  const generateNodesWithBetterLayout = (concepts: Concept[]) => {
    // Get unique categories and create positions in a circle
    const categories = [...new Set(concepts.map(c => c.category || 'Uncategorized'))]
    const categoryPositions: Record<string, { x: number, y: number }> = {}
    
    // Position categories in a large circle
    categories.forEach((category, index) => {
      const angle = (index / categories.length) * 2 * Math.PI
      const radius = 400  // Distance from center
      categoryPositions[category] = {
        x: 600 + radius * Math.cos(angle),
        y: 400 + radius * Math.sin(angle)
      }
    })
    
    // Group concepts by category
    const grouped = groupBy(concepts, 'category')
    const graphNodes: Node[] = []
    
    // Create nodes for each concept, clustered around their category center
    Object.entries(grouped).forEach(([category, items]) => {
      const center = categoryPositions[category] || { x: 600, y: 400 }
      
      items.forEach((concept, index) => {
        // Calculate position in a circle around the category center
        const angle = (index / items.length) * 2 * Math.PI
        const nodeRadius = Math.min(150, 80 + (items.length * 5))  // Dynamic radius based on count
        
        graphNodes.push({
          id: concept.id,
          type: 'concept',  // Use our custom node type
          position: {
            x: center.x + nodeRadius * Math.cos(angle),
            y: center.y + nodeRadius * Math.sin(angle)
          },
          data: { 
            label: concept.title,
            category: concept.category,
            summary: concept.summary?.substring(0, 150) || 'No summary available',
          },
          style: {
            background: getCategoryColor(concept.category),
            color: 'white',
            border: '1px solid #222',
            borderRadius: '50%',
            width: 120,
            height: 120,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '10px'
          }
        })
      })
    })

    return graphNodes
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
      const graphNodes = generateNodesWithBetterLayout(concepts)
      setNodes(graphNodes)
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [setNodes])

  // Handle node click to navigate to concept details
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    router.push(`/concept/${node.id}`)
  }, [router])

  // Handle right-click on nodes
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    })
  }, [])

  // Handle background click to close context menu
  const onPaneClick = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Actions for context menu
  const startConnection = (nodeId: string) => {
    // Placeholder for future connection functionality
    console.log('Start connecting from node:', nodeId)
    setContextMenu(null)
  }

  const deleteNode = (nodeId: string) => {
    // Placeholder - we'll just log for now
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
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={true}
                attributionPosition="bottom-left"
              >
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="bg-background/60 p-2 rounded shadow backdrop-blur-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Nodes: {nodes.length} | Connections: {edges.length}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nodes.length > 0 && Object.entries(groupBy(nodes, 'data.category' as keyof Node)).map(([category, categoryNodes]) => (
                      <div key={category} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getCategoryColor(category) }}
                        ></div>
                        <span className="text-xs">{category}</span>
                      </div>
                    ))}
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