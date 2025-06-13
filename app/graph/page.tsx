"use client"

import React, { useState, useEffect, memo } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Network,
  BookOpen,
  X,
  ExternalLink,
  Brain,
  Target,
  Lightbulb
} from "lucide-react"
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { PageTransition } from "@/components/page-transition"
import { AuthGuard } from "@/components/auth-guard"
import { getAuthHeaders } from "@/lib/auth-utils"
import featureFlags from '@/lib/feature-flags'

// Simplified types
interface Concept {
  id: string
  title: string
  category: string
  summary?: string
  occurrences?: Array<{
    id: string
    conversationId: string
    createdAt: string
  }>
}

export default function GraphPage() {
  // Check feature flag
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
  const [mounted, setMounted] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [showReflectionPanel, setShowReflectionPanel] = useState(false)
  const [interviewMode, setInterviewMode] = useState(false)

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get concept color
  const getConceptColor = (concept: Concept) => {
    const colors: Record<string, string> = {
      'Machine Learning': '#6366f1',
      'LeetCode Problems': '#f59e0b',
      'System Design': '#ec4899',
      'Algorithms': '#f97316',
      'Data Structures': '#14b8a6',
      'Frontend': '#3b82f6',
      'Backend': '#ef4444',
      'Database': '#06b6d4',
      'Cloud Engineering': '#84cc16',
      'default': '#6b7280'
    }
    
    const category = concept.category?.split(' > ')[0] || 'default'
    return colors[category] || colors.default
  }

  // Simple layout creation
  const createSimpleLayout = (conceptsData: Concept[]) => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Create a simple grid layout
    const cols = Math.ceil(Math.sqrt(conceptsData.length))
    
    conceptsData.forEach((concept, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      nodes.push({
        id: concept.id,
        type: 'default',
        position: { 
          x: col * 200 + 100, 
          y: row * 150 + 100 
        },
        data: {
          label: concept.title
        },
        style: {
          backgroundColor: getConceptColor(concept),
          color: 'white',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '8px',
          padding: '10px',
          width: 150,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          textAlign: 'center'
        }
      })
    })

    // Add simple connections between concepts in same category
    conceptsData.forEach((concept, index) => {
      conceptsData.forEach((otherConcept, otherIndex) => {
        if (index < otherIndex && 
            concept.category === otherConcept.category && 
            Math.random() > 0.7) { // Random connections for demo
          edges.push({
            id: `${concept.id}-${otherConcept.id}`,
            source: concept.id,
            target: otherConcept.id,
            type: 'smoothstep',
            style: { 
              stroke: '#6b7280', 
              strokeWidth: 2,
              opacity: 0.6 
            }
          })
        }
      })
    })

    return { nodes, edges }
  }

  // Load concepts
  const loadConcepts = async () => {
    if (!mounted) return
    
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
      
      if (conceptsData.length > 0) {
        const layout = createSimpleLayout(conceptsData)
        setNodes(layout.nodes)
        setEdges(layout.edges)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => {
    if (mounted) {
      loadConcepts()
    }
  }, [mounted])

  // Node click handler
  const onNodeClick = (event: any, node: any) => {
    const concept = concepts.find(c => c.id === node.id)
    if (concept) {
      setSelectedConcept(concept)
    }
  }

  // Concept Modal Component
  const ConceptModal = memo(({ concept, onClose }: { concept: Concept | null, onClose: () => void }) => {
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
            <div className="mb-4">
              <p className="text-slate-300 leading-relaxed">{concept.summary}</p>
            </div>
          )}

          {concept.occurrences && concept.occurrences.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Learning History</h3>
              <div className="text-sm text-slate-400">
                First learned: {new Date(concept.occurrences[0].createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-slate-400">
                Appearances: {concept.occurrences.length} conversation{concept.occurrences.length !== 1 ? 's' : ''}
              </div>
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
              View Details
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

  // Early return for unmounted state
  if (!mounted) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="flex flex-col h-screen bg-slate-900">
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <PageTransition>
        <div className="flex flex-col h-screen bg-slate-900">
          {/* Header */}
          <header className="border-b border-slate-700 bg-slate-800/95 backdrop-blur z-10">
            <div className="container flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-700">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-400" />
                  <h1 className="text-xl font-semibold text-white">Knowledge Graph</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={interviewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInterviewMode(!interviewMode)}
                  className={interviewMode ? "bg-red-600 hover:bg-red-700" : "text-white border-slate-600 hover:bg-slate-700"}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Interview Mode
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReflectionPanel(!showReflectionPanel)}
                  className="text-white border-slate-600 hover:bg-slate-700"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Insights
                </Button>
                
                <Button variant="outline" size="sm" asChild className="text-white border-slate-600 hover:bg-slate-700">
                  <Link href="/concepts">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Instructions */}
          <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-slate-300 text-sm">
                🧠 <strong>Knowledge Graph:</strong> Visual representation of your concepts • Click nodes for details • Colors represent categories
              </div>
              <div className="text-slate-400 text-xs">
                {concepts.length} concepts loaded
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <p className="text-slate-300">Loading your knowledge graph...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-900/20 text-red-400 px-6 py-4 rounded-lg border border-red-800">
                  {error}
                </div>
              </div>
            ) : (
              <>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  fitView
                  fitViewOptions={{ 
                    padding: 0.1,
                    maxZoom: 1.2 
                  }}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                  minZoom={0.3}
                  maxZoom={2}
                  className="bg-slate-900"
                  proOptions={{ hideAttribution: true }}
                >
                  <Background 
                    gap={20} 
                    size={1} 
                    color="rgba(148, 163, 184, 0.1)" 
                  />
                  <Controls className="bg-slate-800 border-slate-600 text-white" />
                  <MiniMap 
                    nodeColor="#3b82f6"
                    maskColor="rgba(15, 23, 42, 0.8)"
                    className="bg-slate-800 border-slate-600"
                  />
                </ReactFlow>

                {/* Simple Insight Panel */}
                {showReflectionPanel && (
                  <div className="absolute top-0 right-0 w-80 h-full bg-slate-800/95 backdrop-blur border-l border-slate-700 z-20 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Insights</h2>
                        <button
                          onClick={() => setShowReflectionPanel(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <h3 className="text-sm font-medium text-white mb-2">Total Concepts</h3>
                          <p className="text-2xl font-bold text-blue-400">{concepts.length}</p>
                        </div>
                        
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <h3 className="text-sm font-medium text-white mb-2">Categories</h3>
                          <p className="text-2xl font-bold text-green-400">
                            {new Set(concepts.map(c => c.category?.split(' > ')[0])).size}
                          </p>
                        </div>
                        
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <h3 className="text-sm font-medium text-white mb-2">Recent Learning</h3>
                          <p className="text-xs text-slate-300">
                            Click on concepts to see learning details
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Concept Modal */}
            <ConceptModal 
              concept={selectedConcept} 
              onClose={() => setSelectedConcept(null)} 
            />
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 