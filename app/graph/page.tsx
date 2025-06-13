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
        e.currentTarget.style.zIndex = '10'
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false)
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.zIndex = '1'
      }}
    >
      <div className="text-xs font-medium leading-tight break-words">{data.label}</div>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-background/95 border text-foreground p-3 rounded-lg w-64 z-50 mb-2 shadow-xl backdrop-blur-sm" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold mb-1">{data.label}</h3>
          <div className="text-xs text-blue-600 mb-1">📁 {data.fullCategory || data.category}</div>
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

// Category group background node
const GroupNode = ({ data }: { data: any }) => {
  return (
    <div className="w-full h-full flex items-start justify-center pt-4">
      <div 
        className="text-lg font-bold text-center px-4 py-2 rounded-lg"
        style={{
          color: data.color,
          backgroundColor: `${data.color}15`,
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
    group: GroupNode
  }), [])

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

  // Normalize categories - handle subcategories properly
  const normalizeCategories = (concepts: Concept[]) => {
    const categoryMap: Record<string, {
      concepts: Concept[],
      subCategories: Record<string, Concept[]>
    }> = {}
    
    concepts.forEach(concept => {
      const category = concept.category || 'General'
      let mainCategory: string, subCategory: string | null = null
      
      if (category.includes(' > ')) {
        [mainCategory, subCategory] = category.split(' > ')
      } else {
        mainCategory = category
      }
      
      if (!categoryMap[mainCategory]) {
        categoryMap[mainCategory] = {
          concepts: [],
          subCategories: {}
        }
      }
      
      if (subCategory) {
        if (!categoryMap[mainCategory].subCategories[subCategory]) {
          categoryMap[mainCategory].subCategories[subCategory] = []
        }
        categoryMap[mainCategory].subCategories[subCategory].push(concept)
      } else {
        categoryMap[mainCategory].concepts.push(concept)
      }
    })
    
    return categoryMap
  }

  // Create organized layout with fixed positions
  const createOrganizedLayout = (concepts: Concept[]) => {
    const nodes: Node[] = []
    const edges: any[] = []
    const categoryMap = normalizeCategories(concepts)
    const categories = Object.keys(categoryMap)
    
    // Define fixed positions for main categories in a clean grid
    const categoryLayouts: Record<string, { x: number, y: number }> = {
      'Machine Learning': { x: 300, y: 200 },
      'Data Engineering': { x: 700, y: 200 },
      'LeetCode Problems': { x: 1100, y: 200 },
      'Artificial Intelligence': { x: 300, y: 600 },
      'AI': { x: 300, y: 600 },
      'Cloud Engineering': { x: 700, y: 600 },
      'Backend Engineering': { x: 1100, y: 600 },
      'Backend': { x: 1100, y: 600 },
      'Frontend': { x: 500, y: 400 },
      'Database': { x: 900, y: 400 },
      'System Design': { x: 300, y: 1000 },
      'Algorithms': { x: 700, y: 1000 },
      'Data Structures': { x: 1100, y: 1000 },
      'General': { x: 500, y: 800 }
    }
    
    // Auto-arrange categories not in predefined list
    let gridIndex = 0
    const gridCols = 3
    const gridSpacing = 400
    
    categories.forEach(category => {
      if (!categoryLayouts[category]) {
        const row = Math.floor(gridIndex / gridCols)
        const col = gridIndex % gridCols
        categoryLayouts[category] = {
          x: 300 + col * gridSpacing,
          y: 1400 + row * gridSpacing
        }
        gridIndex++
      }
    })
    
    // Create nodes for each category
    Object.entries(categoryMap).forEach(([mainCategory, data]) => {
      const categoryCenter = categoryLayouts[mainCategory] || { x: 500, y: 400 }
      
      // Collect all concepts in this category
      const allConcepts = [...data.concepts]
      Object.entries(data.subCategories).forEach(([subCat, subConcepts]) => {
        allConcepts.push(...subConcepts)
      })
      
      // Add category background group node
      nodes.push({
        id: `group-${mainCategory}`,
        type: 'group',
        position: {
          x: categoryCenter.x - 180,
          y: categoryCenter.y - 180
        },
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          width: 360,
          height: 360,
          borderRadius: '20px',
          border: `2px dashed ${getCategoryColor(mainCategory)}40`,
          zIndex: -1
        },
        data: { 
          label: mainCategory,
          color: getCategoryColor(mainCategory),
          count: allConcepts.length
        },
        draggable: false,
        selectable: false
      })
      
      // Position concepts in a compact grid within category
      allConcepts.forEach((concept, index) => {
        const cols = 3
        const row = Math.floor(index / cols)
        const col = index % cols
        const spacing = 100
        const startX = categoryCenter.x - 100
        const startY = categoryCenter.y - 80
        
        // Special styling for subcategory concepts
        const isSubcategory = concept.category.includes(' > ')
        
        nodes.push({
          id: concept.id,
          type: 'concept',
          position: {
            x: startX + col * spacing,
            y: startY + row * spacing
          },
          parentNode: `group-${mainCategory}`,
          extent: 'parent',
          data: {
            label: concept.title,
            category: mainCategory,
            fullCategory: concept.category,
            summary: concept.summary?.substring(0, 150) || 'No summary available',
            conceptData: concept
          },
          style: {
            width: 90,
            height: 90,
            backgroundColor: getCategoryColor(mainCategory),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            padding: '6px',
            textAlign: 'center',
            cursor: 'pointer',
            border: isSubcategory ? '3px solid rgba(255,255,255,0.6)' : '2px solid transparent',
            transition: 'all 0.2s ease-in-out',
            zIndex: 1,
            fontWeight: isSubcategory ? '600' : '500'
          }
        })
      })
    })

    return { nodes, edges }
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

      // Generate organized layout
      const { nodes: graphNodes, edges: graphEdges } = createOrganizedLayout(concepts)
      setNodes(graphNodes)
      setEdges(graphEdges)
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [setNodes, setEdges])

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
                  padding: 0.1,
                  maxZoom: 1,
                  includeHiddenNodes: false 
                }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                minZoom={0.3}
                maxZoom={1.5}
                nodesDraggable={true}
                attributionPosition="bottom-left"
              >
                <Background gap={20} size={1} color="#333" />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.type === 'group') return 'rgba(255,255,255,0.1)'
                    return getCategoryColor(node.data?.category || 'default')
                  }}
                  maskColor="rgba(0, 0, 0, 0.2)"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                  }}
                />
                <Panel position="top-right" className="bg-background/60 p-2 rounded shadow backdrop-blur-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Concepts: {nodes.filter(n => n.type === 'concept').length} | Categories: {nodes.filter(n => n.type === 'group').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    💡 Hover for details • Click to explore • Subcategories have white borders
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