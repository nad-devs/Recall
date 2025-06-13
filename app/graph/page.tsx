"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Network,
  BookOpen,
  Minimize2,
  X,
  ExternalLink,
  TreePine
} from "lucide-react"
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes
} from 'reactflow'
import dagre from 'dagre'
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

interface CategoryStructure {
  concepts: Concept[]
  subcategories: Record<string, Concept[]>
  directConcepts: Concept[]
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [categoryStructure, setCategoryStructure] = useState<Record<string, CategoryStructure>>({})

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

  // Build hierarchy from concepts
  const buildHierarchy = useCallback((conceptsData: Concept[]) => {
    const structure: Record<string, CategoryStructure> = {}
    
    conceptsData.forEach(concept => {
      const parts = concept.category?.split(' > ') || ['General']
      const mainCategory = parts[0]
      const subCategory = parts[1] // Can be undefined
      
      if (!structure[mainCategory]) {
        structure[mainCategory] = {
          concepts: [],
          subcategories: {},
          directConcepts: []
        }
      }
      
      structure[mainCategory].concepts.push(concept)
      
      if (subCategory) {
        // Has subcategory
        if (!structure[mainCategory].subcategories[subCategory]) {
          structure[mainCategory].subcategories[subCategory] = []
        }
        structure[mainCategory].subcategories[subCategory].push(concept)
      } else {
        // Direct concept under category
        structure[mainCategory].directConcepts.push(concept)
      }
    })
    
    return structure
  }, [])

  // Create tree layout using dagre
  const createTreeLayout = useCallback((conceptsData: Concept[]) => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ 
      rankdir: 'TB', // Top to Bottom
      nodesep: 120,
      ranksep: 100,
      marginx: 50,
      marginy: 50
    })
    
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Create root node
    const rootNode: Node = {
      id: 'root',
      type: 'root',
      data: { 
        label: 'My Knowledge',
        totalConcepts: conceptsData.length,
        totalCategories: Object.keys(categoryStructure).length
      },
      position: { x: 0, y: 0 }
    }
    nodes.push(rootNode)
    dagreGraph.setNode('root', { width: 200, height: 80 })
    
    // Build hierarchy
    const structure = buildHierarchy(conceptsData)
    setCategoryStructure(structure)
    
    // Add category nodes
    Object.entries(structure).forEach(([category, data]) => {
      const categoryId = `category-${category}`
      
      const categoryNode: Node = {
        id: categoryId,
        type: 'category',
        data: {
          label: category,
          conceptCount: data.concepts.length,
          hasSubcategories: Object.keys(data.subcategories).length > 0,
          directConcepts: data.directConcepts,
          subcategories: data.subcategories
        },
        position: { x: 0, y: 0 } // Will be calculated by dagre
      }
      nodes.push(categoryNode)
      
      const edge: Edge = {
        id: `root-${categoryId}`,
        source: 'root',
        target: categoryId,
        type: 'smoothstep',
        animated: false
      }
      edges.push(edge)
      
      dagreGraph.setNode(categoryId, { width: 180, height: 100 })
      dagreGraph.setEdge('root', categoryId)
    })
    
    // Calculate positions
    dagre.layout(dagreGraph)
    
    // Update node positions from dagre
    nodes.forEach(node => {
      const nodeWithPosition = dagreGraph.node(node.id)
      if (nodeWithPosition) {
        node.position = {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2
        }
      }
    })
    
    return { nodes, edges }
  }, [buildHierarchy, categoryStructure])

  // Root Node Component
  const RootNode = memo(({ data }: { data: any }) => {
    return (
      <div
        className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg border-2 border-white/20"
        style={{
          width: 200,
          height: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TreePine className="h-5 w-5" />
          <div className="font-bold text-lg">{data.label}</div>
        </div>
        <div className="text-sm opacity-90">
          {data.totalConcepts} concepts • {data.totalCategories} categories
        </div>
      </div>
    )
  })

  // Category Node Component - Optimized
  const CategoryNode = memo(({ data, id }: { data: any, id: string }) => {
    const isExpanded = expandedNodes.has(id)
    
    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      
      if (isExpanded) {
        collapseNode(id)
      } else {
        expandNode(id, data)
      }
    }, [isExpanded, id, data])
    
    return (
      <div
        onClick={handleClick}
        className="cursor-pointer transition-all duration-200 ease-in-out rounded-lg shadow-md"
        style={{
          width: 180,
          height: 100,
          backgroundColor: getCategoryColor(data.label),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: isExpanded ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
          transform: isExpanded ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        <div className="font-bold text-white text-center mb-1" style={{ fontSize: '14px' }}>
          {data.label}
        </div>
        <div className="text-white/80 text-center text-xs mb-1">
          {data.conceptCount} concept{data.conceptCount !== 1 ? 's' : ''}
        </div>
        {data.hasSubcategories && (
          <div className="text-white/60 text-center text-xs mb-1">
            {Object.keys(data.subcategories).length} subcategor{Object.keys(data.subcategories).length !== 1 ? 'ies' : 'y'}
          </div>
        )}
        {data.directConcepts.length > 0 && (
          <div className="text-white/60 text-center text-xs">
            {data.directConcepts.length} direct
          </div>
        )}
        <div className="text-white/50 text-center text-xs mt-1">
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </div>
      </div>
    )
  })

  // Subcategory Node Component
  const SubcategoryNode = memo(({ data, id }: { data: any, id: string }) => {
    const isExpanded = expandedNodes.has(id)
    
    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      
      if (isExpanded) {
        collapseNode(id)
      } else {
        expandSubcategory(id, data)
      }
    }, [isExpanded, id, data])
    
    return (
      <div
        onClick={handleClick}
        className="cursor-pointer transition-all duration-200 ease-in-out rounded-lg shadow-sm"
        style={{
          width: 140,
          height: 80,
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: `2px solid ${getCategoryColor(data.parentCategory)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        <div className="font-semibold text-white text-center mb-1" style={{ fontSize: '12px' }}>
          {data.label}
        </div>
        <div className="text-white/70 text-center text-xs mb-1">
          {data.concepts.length} concept{data.concepts.length !== 1 ? 's' : ''}
        </div>
        <div className="text-white/50 text-center text-xs">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
    )
  })

  // Concept Node Component
  const ConceptNode = memo(({ data }: { data: any }) => {
    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedConcept(data.concept)
    }, [data.concept])
    
    return (
      <div
        onClick={handleClick}
        className="cursor-pointer transition-all duration-200 ease-in-out rounded-md shadow-sm"
        style={{
          width: 120,
          height: 60,
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'white',
          textAlign: 'center',
          padding: '4px',
          backdropFilter: 'blur(5px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <div className="font-medium leading-tight break-words">
          {data.label}
        </div>
      </div>
    )
  })

  // Concept Detail Modal Component
  const ConceptDetailModal = memo(({ concept, onClose }: { concept: Concept | null, onClose: () => void }) => {
    if (!concept) return null
    
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-auto border border-slate-600 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">{concept.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-4">
            <span className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm">
              📁 {concept.category}
            </span>
          </div>
          
          {concept.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
              <p className="text-slate-300 leading-relaxed">{concept.summary}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                router.push(`/concept/${concept.id}`)
                onClose()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details
            </button>
            
            <button
              onClick={onClose}
              className="bg-transparent border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  })

  // Define node types for custom rendering
  const nodeTypes = useMemo(() => ({ 
    root: RootNode,
    category: CategoryNode,
    subcategory: SubcategoryNode,
    concept: ConceptNode
  }), [])

  // Optimized node expansion - no delays
  const expandNode = useCallback((nodeId: string, nodeData: any) => {
    const newExpanded = new Set(expandedNodes)
    newExpanded.add(nodeId)
    setExpandedNodes(newExpanded)
    
    const currentNode = nodes.find(n => n.id === nodeId)
    if (!currentNode) return
    
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    
    let yOffset = 0
    const baseX = currentNode.position.x
    const baseY = currentNode.position.y + 150
    
    // Add subcategories if they exist
    if (nodeData.hasSubcategories) {
      Object.entries(nodeData.subcategories).forEach(([subName, concepts], index) => {
        const subId = `sub-${nodeId}-${subName}`
        
        newNodes.push({
          id: subId,
          type: 'subcategory',
          position: {
            x: baseX + (index % 3) * 160 - 160,
            y: baseY + Math.floor(index / 3) * 100
          },
          data: {
            label: subName,
            concepts: concepts,
            parentCategory: nodeData.label,
            parentId: nodeId
          }
        })
        
        newEdges.push({
          id: `edge-${nodeId}-${subId}`,
          source: nodeId,
          target: subId,
          type: 'smoothstep',
          animated: false
        })
        
        yOffset = Math.max(yOffset, Math.floor(index / 3) * 100 + 100)
      })
    }
    
    // Add direct concepts
    nodeData.directConcepts.forEach((concept: Concept, index: number) => {
      const conceptId = `concept-${concept.id}`
      
      newNodes.push({
        id: conceptId,
        type: 'concept',
        position: {
          x: baseX + (index % 4) * 140 - 210,
          y: baseY + yOffset + Math.floor(index / 4) * 80
        },
        data: {
          label: concept.title,
          concept: concept
        }
      })
      
      newEdges.push({
        id: `edge-${nodeId}-${conceptId}`,
        source: nodeId,
        target: conceptId,
        type: 'smoothstep',
        animated: false
      })
    })
    
    setNodes(current => [...current, ...newNodes])
    setEdges(current => [...current, ...newEdges])
  }, [expandedNodes, nodes])

  // Expand subcategory
  const expandSubcategory = useCallback((subId: string, subData: any) => {
    const newExpanded = new Set(expandedNodes)
    newExpanded.add(subId)
    setExpandedNodes(newExpanded)
    
    const currentNode = nodes.find(n => n.id === subId)
    if (!currentNode) return
    
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    
    subData.concepts.forEach((concept: Concept, index: number) => {
      const conceptId = `concept-${subId}-${concept.id}`
      
      newNodes.push({
        id: conceptId,
        type: 'concept',
        position: {
          x: currentNode.position.x + (index % 3) * 140 - 140,
          y: currentNode.position.y + 100 + Math.floor(index / 3) * 80
        },
        data: {
          label: concept.title,
          concept: concept
        }
      })
      
      newEdges.push({
        id: `edge-${subId}-${conceptId}`,
        source: subId,
        target: conceptId,
        type: 'smoothstep',
        animated: false
      })
    })
    
    setNodes(current => [...current, ...newNodes])
    setEdges(current => [...current, ...newEdges])
  }, [expandedNodes, nodes])

  // Collapse node and all children
  const collapseNode = useCallback((nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    
    // Remove this node and all its children from expanded set
    Array.from(expandedNodes).forEach(id => {
      if (id === nodeId || id.startsWith(`sub-${nodeId}`) || id.startsWith(`concept-${nodeId}`)) {
        newExpanded.delete(id)
      }
    })
    
    setExpandedNodes(newExpanded)
    
    // Remove child nodes
    setNodes(current => 
      current.filter(node => 
        !node.id.startsWith(`sub-${nodeId}`) && 
        !node.id.startsWith(`concept-${nodeId}`) &&
        !node.id.includes(`-${nodeId}-`)
      )
    )
    
    // Remove child edges
    setEdges(current => 
      current.filter(edge => 
        !edge.id.includes(nodeId) || edge.source === 'root'
      )
    )
  }, [expandedNodes])

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
    
    // Keep only root and category nodes
    setNodes(current => 
      current.filter(node => node.type === 'root' || node.type === 'category')
    )
    
    // Keep only root-to-category edges
    setEdges(current => 
      current.filter(edge => edge.source === 'root')
    )
  }, [])

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
      
      const { nodes: treeNodes, edges: treeEdges } = createTreeLayout(conceptsData)
      setNodes(treeNodes)
      setEdges(treeEdges)
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [createTreeLayout])

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
                  <h1 className="text-xl font-semibold text-white">Knowledge Tree</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedNodes.size > 0 && (
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
                🌳 <strong>Tree Structure:</strong> Root → Categories → Subcategories → Concepts • <strong>Single click</strong> to expand/collapse • <strong>Click concepts</strong> for details
              </div>
              <div className="text-slate-400 text-xs">
                Expanded: {expandedNodes.size} | 
                Total Nodes: {nodes.length} | 
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
                  <p className="text-slate-300">Building knowledge tree...</p>
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
                  padding: 0.1,
                  maxZoom: 1,
                  includeHiddenNodes: false 
                }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-left"
                className="bg-slate-900"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: false
                }}
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
                    if (node.type === 'root') return '#3b82f6'
                    if (node.type === 'category') return getCategoryColor(node.data?.label || 'default')
                    if (node.type === 'subcategory') return getCategoryColor(node.data?.parentCategory || 'default')
                    return 'rgba(255,255,255,0.3)'
                  }}
                  maskColor="rgba(15, 23, 42, 0.8)"
                  className="bg-slate-800 border-slate-600"
                />
              </ReactFlow>
            )}
          </div>

          {/* Concept Detail Modal */}
          <ConceptDetailModal 
            concept={selectedConcept} 
            onClose={() => setSelectedConcept(null)} 
          />
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 