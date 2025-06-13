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
  X,
  ExternalLink
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
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [showCollapseAll, setShowCollapseAll] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)

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
        onClick={() => toggleCategory(id, data)}
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
        <div className="text-white/60 text-center mb-1" style={{ fontSize: '10px' }}>
          {data.subcategoryCount} subcategor{data.subcategoryCount !== 1 ? 'ies' : 'y'}
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

  // Custom Subcategory Node Component
  const SubcategoryNode = ({ data, id }: { data: any, id: string }) => {
    const isExpanded = expandedSubcategories.has(id)
    const parentCategory = data.parentCategory.split('-')[1]
    
    return (
      <div
        onClick={() => toggleSubcategory(id, data)}
        className="cursor-pointer transition-all duration-300 ease-in-out"
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: `3px solid ${getCategoryColor(parentCategory)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isExpanded ? `0 0 20px ${getCategoryColor(parentCategory)}40` : '0 2px 10px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <div className="text-white font-semibold text-center leading-tight mb-1" style={{ fontSize: '12px' }}>
          {data.label}
        </div>
        <div className="text-white/70 text-center mb-1" style={{ fontSize: '10px' }}>
          {data.conceptCount} concept{data.conceptCount !== 1 ? 's' : ''}
        </div>
        <div className="text-white/50 text-center" style={{ fontSize: '8px' }}>
          {isExpanded ? '🔽 Collapse' : '🔼 Expand'}
        </div>
      </div>
    )
  }

  // Custom Concept Node Component
  const ConceptNode = ({ data }: { data: any }) => {
    return (
      <div
        onClick={() => setSelectedConcept(data.concept)}
        className="cursor-pointer transition-all duration-200 ease-in-out"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white',
          textAlign: 'center',
          padding: '6px',
          backdropFilter: 'blur(5px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.border = '2px solid rgba(255,255,255,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.border = '2px solid rgba(255,255,255,0.3)'
        }}
      >
        <div className="font-medium leading-tight break-words">
          {data.label}
        </div>
      </div>
    )
  }

  // Concept Detail Modal Component
  const ConceptDetailModal = ({ concept, onClose }: { concept: Concept | null, onClose: () => void }) => {
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
  }

  // Define node types for custom rendering
  const nodeTypes = useMemo(() => ({ 
    category: CategoryNode,
    subcategory: SubcategoryNode,
    concept: ConceptNode
  }), [expandedCategories, expandedSubcategories])

  // Initialize with just category nodes - build proper hierarchy
  const initializeCategoryNodes = useCallback((conceptsData: Concept[]) => {
    const categoryStructure: Record<string, {
      concepts: Concept[],
      subcategories: Record<string, Concept[]>
    }> = {}
    
    // Build proper hierarchy
    conceptsData.forEach(concept => {
      const parts = concept.category?.split(' > ') || ['General']
      const mainCategory = parts[0]
      const subCategory = parts[1] || 'General' // Default subcategory if none
      
      if (!categoryStructure[mainCategory]) {
        categoryStructure[mainCategory] = {
          concepts: [],
          subcategories: {}
        }
      }
      
      if (!categoryStructure[mainCategory].subcategories[subCategory]) {
        categoryStructure[mainCategory].subcategories[subCategory] = []
      }
      
      categoryStructure[mainCategory].subcategories[subCategory].push(concept)
      categoryStructure[mainCategory].concepts.push(concept) // Keep total count
    })

    // Create category nodes in a circle
    const categoryNodes: Node[] = []
    const categoryNames = Object.keys(categoryStructure)
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
          conceptCount: categoryStructure[category].concepts.length,
          subcategoryCount: Object.keys(categoryStructure[category].subcategories).length,
          structure: categoryStructure[category]
        },
        draggable: false
      })
    })

    setNodes(categoryNodes)
    setEdges([])
  }, [setNodes, setEdges])

  // Toggle category to show subcategories (not concepts directly)
  const toggleCategory = useCallback((categoryId: string, categoryData: any) => {
    const newExpanded = new Set(expandedCategories)
    
    if (newExpanded.has(categoryId)) {
      // Collapse: remove subcategories and their concepts
      newExpanded.delete(categoryId)
      collapseCategory(categoryId)
    } else {
      // Expand to show subcategories
      newExpanded.add(categoryId)
      expandToSubcategories(categoryId, categoryData.structure)
    }
    
    setExpandedCategories(newExpanded)
    setShowCollapseAll(newExpanded.size > 0 || expandedSubcategories.size > 0)
  }, [expandedCategories, expandedSubcategories])

  // Collapse category and all its subcategories
  const collapseCategory = useCallback((categoryId: string) => {
    setNodes(current => 
      current.filter(node => 
        node.type === 'category' || 
        (!node.id.startsWith(`subcategory-${categoryId}`) && !node.id.startsWith(`concept-${categoryId}`))
      )
    )
    setEdges(current => 
      current.filter(edge => !edge.id.startsWith(`edge-${categoryId}`))
    )
    
    // Also clear any expanded subcategories for this category
    setExpandedSubcategories(current => {
      const newSet = new Set(current)
      Array.from(current).forEach(subId => {
        if (subId.startsWith(`subcategory-${categoryId}`)) {
          newSet.delete(subId)
        }
      })
      return newSet
    })
  }, [setNodes, setEdges])

  // Show subcategories when category is expanded
  const expandToSubcategories = useCallback((categoryId: string, structure: any) => {
    const categoryNode = nodes.find(n => n.id === categoryId)
    if (!categoryNode) return

    const subcategoryNodes: Node[] = []
    const newEdges: Edge[] = []
    const centerX = categoryNode.position.x + 80
    const centerY = categoryNode.position.y + 80
    const subcategoryRadius = 200

    const subcategories = Object.entries(structure.subcategories)

    subcategories.forEach(([subName, concepts], index) => {
      const angle = (index / subcategories.length) * 2 * Math.PI
      const nodeId = `subcategory-${categoryId}-${subName}`
      
      subcategoryNodes.push({
        id: nodeId,
        type: 'subcategory',
        position: {
          x: centerX + subcategoryRadius * Math.cos(angle) - 60,
          y: centerY + subcategoryRadius * Math.sin(angle) - 60
        },
        data: {
          label: subName,
          parentCategory: categoryId,
          concepts: concepts,
          conceptCount: (concepts as Concept[]).length
        },
        draggable: true
      })
      
      // Edge from category to subcategory
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

    setNodes(current => [...current, ...subcategoryNodes])
    setEdges(current => [...current, ...newEdges])
  }, [nodes, setNodes, setEdges])

  // Toggle subcategory to show concepts
  const toggleSubcategory = useCallback((subcategoryId: string, subcategoryData: any) => {
    const newExpanded = new Set(expandedSubcategories)
    
    if (newExpanded.has(subcategoryId)) {
      // Collapse concepts
      newExpanded.delete(subcategoryId)
      setNodes(current => 
        current.filter(node => !node.id.startsWith(`concept-${subcategoryId}`))
      )
      setEdges(current =>
        current.filter(edge => !edge.id.includes(`concept-${subcategoryId}`))
      )
    } else {
      // Expand concepts
      newExpanded.add(subcategoryId)
      showConceptsForSubcategory(subcategoryId, subcategoryData)
    }
    
    setExpandedSubcategories(newExpanded)
    setShowCollapseAll(expandedCategories.size > 0 || newExpanded.size > 0)
  }, [expandedSubcategories, expandedCategories, setNodes, setEdges])

  // Show concepts when subcategory is expanded
  const showConceptsForSubcategory = useCallback((subcategoryId: string, subcategoryData: any) => {
    const subcategoryNode = nodes.find(n => n.id === subcategoryId)
    if (!subcategoryNode) return

    const conceptNodes: Node[] = []
    const newEdges: Edge[] = []
    const centerX = subcategoryNode.position.x + 60
    const centerY = subcategoryNode.position.y + 60
    const conceptRadius = 120

    subcategoryData.concepts.forEach((concept: Concept, index: number) => {
      const angle = (index / subcategoryData.concepts.length) * 2 * Math.PI
      const nodeId = `concept-${subcategoryId}-${concept.id}`
      
      conceptNodes.push({
        id: nodeId,
        type: 'concept',
        position: {
          x: centerX + conceptRadius * Math.cos(angle) - 40,
          y: centerY + conceptRadius * Math.sin(angle) - 40
        },
        data: {
          label: concept.title,
          concept: concept
        },
        draggable: true
      })

      // Edge from subcategory to concept
      newEdges.push({
        id: `edge-${subcategoryId}-${nodeId}`,
        source: subcategoryId,
        target: nodeId,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'rgba(255,255,255,0.2)',
          strokeWidth: 1
        }
      })
    })

    setNodes(current => [...current, ...conceptNodes])
    setEdges(current => [...current, ...newEdges])
  }, [nodes, setNodes, setEdges])

  // Collapse all categories and subcategories
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set())
    setExpandedSubcategories(new Set())
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
                💡 <strong>Categories</strong> → <strong>Subcategories</strong> → <strong>Concepts</strong> • Click to expand each level • Click concepts for details
              </div>
              <div className="text-slate-400 text-xs">
                Categories: {nodes.filter(n => n.type === 'category').length} | 
                Subcategories: {nodes.filter(n => n.type === 'subcategory').length} | 
                Concepts: {nodes.filter(n => n.type === 'concept').length}
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
                    if (node.type === 'subcategory') {
                      const parentCategory = node.data?.parentCategory?.split('-')[1] || 'default'
                      return getCategoryColor(parentCategory)
                    }
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