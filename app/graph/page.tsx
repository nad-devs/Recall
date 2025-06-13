"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
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
  Node
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

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      // Group concepts by category
      const grouped = groupBy(concepts, 'category')

      // Define category positions
      const categoryPositions: Record<string, { x: number, y: number }> = {
        'Frontend': { x: 200, y: 200 },
        'Backend': { x: 600, y: 200 },
        'Database': { x: 200, y: 500 },
        'AI': { x: 600, y: 500 },
        'Algorithms': { x: 1000, y: 200 },
        'Data Structures': { x: 1000, y: 500 },
        'System Design': { x: 200, y: 800 },
        'LeetCode Problems': { x: 600, y: 800 },
        'Backend Engineering': { x: 1000, y: 800 },
        'Frontend Engineering': { x: 200, y: 1100 },
        'Data Structures and Algorithms': { x: 600, y: 1100 },
      }

      // Create nodes
      const graphNodes: Node[] = []
      
      // Create nodes for each concept
      Object.entries(grouped).forEach(([category, items]) => {
        // Use defined position or fallback to center
        const basePos = categoryPositions[category] || { x: 500, y: 500 }
        
        items.forEach((concept, index) => {
          // Calculate angle and position in a circle around the category center
          const angle = (index / items.length) * 2 * Math.PI
          const radius = 150  // Radius of the circle
          
          graphNodes.push({
            id: concept.id,
            type: 'default',
            position: {
              x: basePos.x + radius * Math.cos(angle),
              y: basePos.y + radius * Math.sin(angle)
            },
            data: { 
              label: concept.title,
              category: concept.category
            },
            style: {
              background: getCategoryColor(concept.category),
              color: 'white',
              border: '1px solid #222',
              borderRadius: '50%',
              width: 120,
              height: 120,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '10px'
            }
          })
        })
      })

      setNodes(graphNodes)
      setLoading(false)
    } catch (err) {
      console.error('Error loading concepts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load concepts')
      setLoading(false)
    }
  }, [setNodes])

  useEffect(() => {
    loadConcepts()
  }, [loadConcepts])

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
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={true}
                attributionPosition="bottom-left"
              >
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="bg-white/60 dark:bg-gray-800/60 p-2 rounded shadow backdrop-blur-sm">
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
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 