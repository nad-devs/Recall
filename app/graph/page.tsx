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
  TreePine,
  GitBranch,
  Zap,
  Target,
  BookOpen as PatternIcon,
  Brain,
  TrendingUp,
  Calendar,
  Lightbulb,
  ChevronRight
} from "lucide-react"
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  Position
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import { PageTransition } from "@/components/page-transition"
import { AuthGuard } from "@/components/auth-guard"
import { getAuthHeaders } from "@/lib/auth-utils"
import featureFlags from '@/lib/feature-flags'

// Define types for intelligent concept system
interface Concept {
  id: string
  title: string
  category: string
  summary?: string
  details?: string
  relatedConcepts?: string[]
  createdAt?: string
  updatedAt?: string
  occurrences?: Array<{
    id: string
    conversationId: string
    notes?: string
    createdAt: string
  }>
  [key: string]: any
}

interface SmartRelation {
  source: string
  target: string
  type: 'prerequisite' | 'builds-on' | 'applies-to' | 'similar' | 'co-occurs'
  strength: number
  discoveredFrom: 'ai-analysis' | 'co-occurrence' | 'temporal' | 'content-similarity'
  context?: string
}

interface LearningInsight {
  conceptId: string
  insight: string
  type: 'pattern-recognition' | 'gap-identification' | 'next-step' | 'interview-prep'
  relevance: number
  date: string
}

interface DailyReflection {
  date: string
  conceptsLearned: string[]
  keyInsights: string[]
  nextSteps: string[]
  interviewRelevance: string
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
  const [mounted, setMounted] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [smartRelations, setSmartRelations] = useState<SmartRelation[]>([])
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([])
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([])
  const [showReflectionPanel, setShowReflectionPanel] = useState(true)
  const [interviewMode, setInterviewMode] = useState(false)

  // Prevent hydration mismatch by ensuring component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Early return to prevent hydration issues
  if (!mounted) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="flex flex-col h-screen bg-slate-900">
            <header className="border-b border-slate-700 bg-slate-800/95 backdrop-blur supports-[backdrop-filter]:bg-slate-800/60 z-10">
              <div className="container flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-700">
                    <Link href="/dashboard">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-400" />
                    <h1 className="text-xl font-semibold text-white">Intelligent Learning Graph</h1>
                  </div>
                </div>
              </div>
            </header>
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    )
  }

  // Intelligent concept color based on learning stage and interview relevance
  const getIntelligentConceptColor = useCallback((concept: Concept) => {
    // Interview-critical concepts
    const interviewKeywords = ['algorithm', 'data structure', 'system design', 'leetcode', 'sql', 'api']
    const isInterviewCritical = interviewKeywords.some(keyword => 
      concept.title.toLowerCase().includes(keyword) || 
      concept.category?.toLowerCase().includes(keyword)
    )
    
    // Recently learned (based on occurrences)
    const recentlyLearned = concept.occurrences && concept.occurrences.length > 0 && 
      new Date(concept.occurrences[0].createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Well-connected concepts (core knowledge)
    const connectionCount = smartRelations.filter(r => 
      r.source === concept.id || r.target === concept.id
    ).length
    
    if (isInterviewCritical) return '#ef4444' // Red for interview-critical
    if (recentlyLearned) return '#10b981' // Green for recently learned
    if (connectionCount > 3) return '#8b5cf6' // Purple for well-connected
    
    // Default category colors
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
  }, [smartRelations])

  // AI-powered relationship discovery
  const discoverSmartRelations = useCallback(async (conceptsData: Concept[]) => {
    const relations: SmartRelation[] = []
    
    // 1. Co-occurrence analysis - concepts that appear together in conversations
    const conceptPairs = new Map<string, { count: number, contexts: string[] }>()
    
    conceptsData.forEach(concept => {
      if (concept.occurrences) {
        concept.occurrences.forEach(occurrence => {
          // Find other concepts in the same conversation
          const relatedConcepts = conceptsData.filter(otherConcept => 
            otherConcept.id !== concept.id &&
            otherConcept.occurrences?.some(occ => occ.conversationId === occurrence.conversationId)
          )
          
          relatedConcepts.forEach(relatedConcept => {
            const pairKey = [concept.id, relatedConcept.id].sort().join('|')
            if (!conceptPairs.has(pairKey)) {
              conceptPairs.set(pairKey, { count: 0, contexts: [] })
            }
            const pair = conceptPairs.get(pairKey)!
            pair.count++
            if (occurrence.notes) {
              pair.contexts.push(occurrence.notes)
            }
          })
        })
      }
    })
    
    // Convert co-occurrences to relations
    conceptPairs.forEach((data, pairKey) => {
      if (data.count >= 2) { // Only consider pairs that co-occur multiple times
        const [sourceId, targetId] = pairKey.split('|')
        relations.push({
          source: sourceId,
          target: targetId,
          type: 'co-occurs',
          strength: Math.min(0.9, data.count * 0.2),
          discoveredFrom: 'co-occurrence',
          context: data.contexts.slice(0, 2).join('; ')
        })
      }
    })
    
    // 2. Content similarity analysis
    conceptsData.forEach(concept => {
      conceptsData.forEach(otherConcept => {
        if (concept.id !== otherConcept.id) {
          const titleSimilarity = calculateContentSimilarity(concept.title, otherConcept.title)
          const summarySimilarity = concept.summary && otherConcept.summary ? 
            calculateContentSimilarity(concept.summary, otherConcept.summary) : 0
          
          const overallSimilarity = (titleSimilarity + summarySimilarity) / 2
          
          if (overallSimilarity > 0.4) {
            relations.push({
              source: concept.id,
              target: otherConcept.id,
              type: 'similar',
              strength: overallSimilarity,
              discoveredFrom: 'content-similarity'
            })
          }
        }
      })
    })
    
    // 3. Temporal learning patterns - concepts learned in sequence
    const sortedConcepts = conceptsData
      .filter(c => c.occurrences && c.occurrences.length > 0)
      .sort((a, b) => {
        const aDate = new Date(a.occurrences![0].createdAt)
        const bDate = new Date(b.occurrences![0].createdAt)
        return aDate.getTime() - bDate.getTime()
      })
    
    for (let i = 0; i < sortedConcepts.length - 1; i++) {
      const current = sortedConcepts[i]
      const next = sortedConcepts[i + 1]
             const timeDiff = new Date(next.occurrences![0].createdAt).getTime() - 
                       new Date(current.occurrences![0].createdAt).getTime()
      
      // If learned within 3 days, likely a learning progression
      if (timeDiff < 3 * 24 * 60 * 60 * 1000) {
        relations.push({
          source: current.id,
          target: next.id,
          type: 'builds-on',
          strength: 0.6,
          discoveredFrom: 'temporal'
        })
      }
    }
    
    return relations
  }, [])

  // Calculate content similarity using word overlap
  const calculateContentSimilarity = useCallback((text1: string, text2: string) => {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }, [])

  // Generate learning insights using AI analysis
  const generateLearningInsights = useCallback(async (conceptsData: Concept[], relations: SmartRelation[]) => {
    const insights: LearningInsight[] = []
    
    conceptsData.forEach(concept => {
      const connections = relations.filter(r => r.source === concept.id || r.target === concept.id)
      
      // Pattern recognition insights
      if (connections.length > 3) {
        insights.push({
          conceptId: concept.id,
          insight: `This is a central concept in your learning - connected to ${connections.length} other topics. Consider deepening your understanding here.`,
          type: 'pattern-recognition',
          relevance: 0.8,
          date: new Date().toISOString()
        })
      }
      
      // Gap identification
      const prerequisiteRelations = relations.filter(r => r.target === concept.id && r.type === 'builds-on')
      if (prerequisiteRelations.length > 0 && concept.occurrences?.length === 1) {
        insights.push({
          conceptId: concept.id,
          insight: `You might benefit from reviewing prerequisites before diving deeper into this topic.`,
          type: 'gap-identification',
          relevance: 0.7,
          date: new Date().toISOString()
        })
      }
      
      // Interview preparation insights
      const interviewKeywords = ['algorithm', 'leetcode', 'system design', 'database', 'api']
      if (interviewKeywords.some(keyword => concept.title.toLowerCase().includes(keyword))) {
        insights.push({
          conceptId: concept.id,
          insight: `High interview relevance! Practice implementing this concept and explaining it clearly.`,
          type: 'interview-prep',
          relevance: 0.9,
          date: new Date().toISOString()
        })
      }
    })
    
    return insights
  }, [])

  // Create intelligent graph layout
  const createIntelligentLayout = useCallback((conceptsData: Concept[], relations: SmartRelation[]) => {
    if (!mounted) return { nodes: [], edges: [] }
    
    // Use force-directed layout that respects relationship strength
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ 
      rankdir: interviewMode ? 'LR' : 'TB', // Left-right for interview mode
      nodesep: 80,
      ranksep: 120,
      marginx: 50,
      marginy: 50
    })
    
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Create nodes with intelligent sizing based on importance
    conceptsData.forEach(concept => {
      const connections = relations.filter(r => r.source === concept.id || r.target === concept.id)
      const importance = Math.min(2, 1 + connections.length * 0.1)
      const isRecentlyLearned = concept.occurrences && concept.occurrences.length > 0 && 
        new Date(concept.occurrences[0].createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      nodes.push({
        id: concept.id,
        type: 'intelligentConcept',
        position: { x: 0, y: 0 },
        data: {
          label: concept.title,
          concept: concept,
          connections: connections.length,
          importance: importance,
          isRecentlyLearned: isRecentlyLearned,
          insights: learningInsights.filter(i => i.conceptId === concept.id),
          interviewRelevant: ['algorithm', 'leetcode', 'system design'].some(keyword => 
            concept.title.toLowerCase().includes(keyword)
          )
        }
      })
      
      dagreGraph.setNode(concept.id, { 
        width: 100 * importance, 
        height: 60 * importance 
      })
    })
    
    // Create edges based on discovered relations
    relations.forEach(relation => {
      if (relation.strength > 0.3) { // Only show strong relationships
        const edgeId = `${relation.source}-${relation.target}`
        const isPrerequisite = relation.type === 'builds-on'
        
        edges.push({
          id: edgeId,
          source: relation.source,
          target: relation.target,
          type: 'smoothstep',
          animated: isPrerequisite,
          style: { 
            stroke: getRelationColor(relation.type),
            strokeWidth: Math.max(1, relation.strength * 4),
            opacity: relation.strength
          },
          label: interviewMode ? relation.type : undefined,
          labelStyle: { fontSize: 10, fill: '#666' }
        })
        
        dagreGraph.setEdge(relation.source, relation.target)
      }
    })
    
    // Calculate layout
    dagre.layout(dagreGraph)
    
    // Update positions
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
  }, [mounted, interviewMode, learningInsights])

  // Get relation color based on type
  const getRelationColor = useCallback((type: SmartRelation['type']) => {
    const colors = {
      'prerequisite': '#ef4444',
      'builds-on': '#f59e0b',
      'applies-to': '#10b981',
      'similar': '#3b82f6',
      'co-occurs': '#8b5cf6'
    }
    return colors[type] || '#6b7280'
  }, [])

  // Intelligent Concept Node Component
  const IntelligentConceptNode = memo(({ data }: { data: any }) => {
    
    const concept = data.concept
    const nodeColor = getIntelligentConceptColor(concept)
    const size = 60 + (data.connections * 5)
    
    return (
      <div
        onClick={() => setSelectedConcept(concept)}
        className="cursor-pointer transition-all duration-300 rounded-lg shadow-lg border-2 relative"
        style={{
          width: size,
          height: size,
          backgroundColor: nodeColor,
          borderColor: data.isRecentlyLearned ? '#10b981' : 'rgba(255,255,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          transform: `scale(${data.importance})`,
          boxShadow: data.interviewRelevant ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `scale(${data.importance * 1.1})`
          e.currentTarget.style.zIndex = '10'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `scale(${data.importance})`
          e.currentTarget.style.zIndex = '1'
        }}
      >
        <div className="font-semibold text-xs text-center leading-tight px-1">
          {data.label}
        </div>
        
        {/* Connection count indicator */}
        {data.connections > 0 && (
          <div className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {data.connections}
          </div>
        )}
        
        {/* Recently learned indicator */}
        {data.isRecentlyLearned && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        )}
        
        {/* Interview relevance indicator */}
        {data.interviewRelevant && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
            🎯
          </div>
        )}
        
        {/* Insights indicator */}
        {data.insights && data.insights.length > 0 && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
        )}
      </div>
    )
  })

  // Daily Reflection Panel Component
  const DailyReflectionPanel = memo(() => {
    if (!showReflectionPanel) return null
    
    const today = new Date().toISOString().split('T')[0]
    const recentConcepts = concepts
      .filter(c => c.occurrences && c.occurrences.some(occ => 
        new Date(occ.createdAt).toISOString().split('T')[0] === today
      ))
      .slice(0, 5)
    
    const todaysInsights = learningInsights
      .filter(i => i.date.split('T')[0] === today)
      .slice(0, 3)
    
    return (
      <div className="absolute top-0 right-0 w-80 h-full bg-slate-800/95 backdrop-blur border-l border-slate-700 z-20 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Daily Reflection
            </h2>
            <button
              onClick={() => setShowReflectionPanel(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Today's Learning */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Today's Learning
            </h3>
            {recentConcepts.length > 0 ? (
              <div className="space-y-2">
                {recentConcepts.map(concept => (
                  <div
                    key={concept.id}
                    className="p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700"
                    onClick={() => setSelectedConcept(concept)}
                  >
                    <div className="text-sm text-white font-medium">{concept.title}</div>
                    <div className="text-xs text-slate-400">{concept.category}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">No new concepts learned today</div>
            )}
          </div>
          
          {/* Key Insights */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Key Insights
            </h3>
            {todaysInsights.length > 0 ? (
              <div className="space-y-2">
                {todaysInsights.map((insight, index) => (
                  <div key={index} className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="text-xs text-slate-300">{insight.insight}</div>
                    <div className="text-xs text-slate-500 mt-1 capitalize">{insight.type.replace('-', ' ')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">Keep learning to generate insights!</div>
            )}
          </div>
          
          {/* Next Steps */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Suggested Next Steps
            </h3>
            <div className="space-y-2">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <div className="text-xs text-blue-300">Review concepts with fewer connections</div>
              </div>
              <div className="p-2 bg-green-900/30 rounded-lg">
                <div className="text-xs text-green-300">Practice interview explanations</div>
              </div>
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <div className="text-xs text-purple-300">Explore related concepts</div>
              </div>
            </div>
          </div>
          
          {/* Interview Prep Focus */}
          {interviewMode && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Target className="h-4 w-4" />
                Interview Focus
              </h3>
              <div className="space-y-2">
                {concepts
                  .filter(c => ['algorithm', 'leetcode', 'system design'].some(keyword => 
                    c.title.toLowerCase().includes(keyword)
                  ))
                  .slice(0, 3)
                  .map(concept => (
                    <div
                      key={concept.id}
                      className="p-2 bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-900/50"
                      onClick={() => setSelectedConcept(concept)}
                    >
                      <div className="text-xs text-red-300 font-medium">{concept.title}</div>
                      <div className="text-xs text-red-400 mt-1">High interview priority</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  })

  // Enhanced Concept Detail Modal
  const EnhancedConceptModal = memo(({ concept, onClose }: { concept: Concept | null, onClose: () => void }) => {
    if (!concept) return null
    
    const relatedConcepts = smartRelations.filter(r => 
      r.source === concept.id || r.target === concept.id
    ).map(r => {
      const relatedId = r.source === concept.id ? r.target : r.source
      return {
        concept: concepts.find(c => c.id === relatedId),
        relation: r
      }
    }).filter(r => r.concept)
    
    const conceptInsights = learningInsights.filter(i => i.conceptId === concept.id)
    
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-xl p-6 max-w-3xl max-h-[80vh] overflow-auto border border-slate-600 shadow-2xl"
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

          {/* AI-Generated Insights */}
          {conceptInsights.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                AI Insights
              </h3>
              <div className="space-y-2">
                {conceptInsights.map((insight, index) => (
                  <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-slate-300">{insight.insight}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="capitalize">{insight.type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>{Math.round(insight.relevance * 100)}% relevance</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Relationships */}
          {relatedConcepts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-400" />
                Smart Connections
              </h3>
              <div className="space-y-2">
                {relatedConcepts.map((related, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                    <div className="text-xs px-2 py-1 rounded text-white" style={{
                      backgroundColor: getRelationColor(related.relation.type)
                    }}>
                      {related.relation.type}
                    </div>
                    <span className="text-slate-300 flex-1">{related.concept?.title}</span>
                    <div className="text-xs text-slate-400">
                      {Math.round(related.relation.strength * 100)}% • {related.relation.discoveredFrom}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
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

  // Define node types
  const nodeTypes = useMemo(() => ({ 
    intelligentConcept: IntelligentConceptNode
  }), [])

  // Load and process all data intelligently
  const loadIntelligentGraph = useCallback(async () => {
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
      
      // AI-powered relationship discovery
      const discoveredRelations = await discoverSmartRelations(conceptsData)
      setSmartRelations(discoveredRelations)
      
      // Generate learning insights
      const insights = await generateLearningInsights(conceptsData, discoveredRelations)
      setLearningInsights(insights)
      
      // Create intelligent layout
      const layout = createIntelligentLayout(conceptsData, discoveredRelations)
      setNodes(layout.nodes)
      setEdges(layout.edges)
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading intelligent graph:', err)
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph')
      setLoading(false)
    }
  }, [mounted, discoverSmartRelations, generateLearningInsights, createIntelligentLayout])

  // Load data on mount
  useEffect(() => {
    if (mounted) {
      loadIntelligentGraph()
    }
  }, [loadIntelligentGraph, mounted])

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
                  <Brain className="h-5 w-5 mr-2 text-purple-400" />
                  <h1 className="text-xl font-semibold text-white">Intelligent Learning Graph</h1>
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
                  Reflections
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
                🧠 <strong>AI-Powered Connections:</strong> Relationships discovered automatically • 
                Larger nodes = More connected • 
                🎯 Red glow = Interview critical • 
                Green dot = Recently learned
              </div>
              <div className="text-slate-400 text-xs">
                {concepts.length} concepts • {smartRelations.length} smart connections • {learningInsights.length} insights
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                  <p className="text-slate-300">Discovering intelligent connections...</p>
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
                  maxZoom: 1.2,
                  includeHiddenNodes: false 
                }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-left"
                className="bg-slate-900"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: false
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background 
                  gap={20} 
                  size={1} 
                  color="rgba(148, 163, 184, 0.1)" 
                  className="bg-slate-900"
                />
                <Controls className="bg-slate-800 border-slate-600 text-white" />
                <MiniMap 
                  nodeColor={(node) => getIntelligentConceptColor(node.data?.concept || { category: '' } as Concept)}
                  maskColor="rgba(15, 23, 42, 0.8)"
                  className="bg-slate-800 border-slate-600"
                />
              </ReactFlow>
            )}

            {/* Daily Reflection Panel */}
            <DailyReflectionPanel />

            {/* Enhanced Concept Detail Modal */}
            {selectedConcept && (
              <EnhancedConceptModal 
                concept={selectedConcept} 
                onClose={() => setSelectedConcept(null)} 
              />
            )}
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 