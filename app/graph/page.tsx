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
  Lightbulb,
  Star,
  Clock,
  TrendingUp
} from "lucide-react"
import { LaneKnowledgeGraph } from './components/LaneKnowledgeGraph'
import { PageTransition } from "@/components/page-transition"
import { AuthGuard } from "@/components/auth-guard"
import { getAuthHeaders } from "@/lib/auth-utils"
import featureFlags from '@/lib/feature-flags'
import { EnhancedConcept, SimpleConcept, processEnhancedConcept } from './types'

// Use the enhanced type but with fallback for compatibility
interface Concept extends Partial<EnhancedConcept> {
  // Ensure basic fields are always present
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

  // Handle concept selection for SVG graph
  const handleConceptClick = (concept: Concept) => {
    setSelectedConcept(concept)
  }

  // Load concepts with enhanced data inspection
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

              // ✨ LOG RICH DATA INSPECTION - Let's see what we already have!
        if (conceptsData.length > 0) {
          const sampleConcept = conceptsData[0]
          console.log('🔍 RICH DATA INSPECTION:', {
            title: sampleConcept.title,
            hasLearningProgress: sampleConcept.learningProgress !== undefined,
            hasMasteryLevel: sampleConcept.masteryLevel !== undefined,
            hasPersonalNotes: sampleConcept.personalNotes !== undefined,
            hasVideoResources: sampleConcept.videoResources !== undefined,
            hasRealWorldExamples: sampleConcept.realWorldExamples !== undefined,
            hasPracticeCount: sampleConcept.practiceCount !== undefined,
            hasBookmarked: sampleConcept.bookmarked !== undefined,
            allFieldsCount: Object.keys(sampleConcept).length
          })

          // Process enhanced concepts to see parsed data
          try {
            const processedSample = processEnhancedConcept(sampleConcept as EnhancedConcept)
            console.log('🎯 PROCESSED RICH DATA:', {
              videoResourcesCount: processedSample.videoResourcesParsed?.length || 0,
              realWorldExamplesCount: processedSample.realWorldExamplesParsed?.length || 0,
              learningTipsCount: processedSample.learningTipsParsed?.length || 0,
              tagsCount: processedSample.tagsParsed?.length || 0
            })
          } catch (error) {
            console.log('🔧 Error processing rich data:', error)
          }
        }

      setConcepts(conceptsData)
      
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



  // Enhanced Concept Modal Component with Rich Data Display
  const ConceptModal = memo(({ concept, onClose }: { concept: Concept | null, onClose: () => void }) => {
    if (!concept) return null
    
    // Process enhanced concept data safely
    const enhanced = processEnhancedConcept(concept as EnhancedConcept)
    
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto border border-slate-600 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{concept.title}</h2>
              <div className="flex items-center gap-3">
                <span className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                  📁 {concept.category}
                </span>
                {concept.masteryLevel && (
                  <span className="inline-block bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm">
                    🎯 {concept.masteryLevel}
                  </span>
                )}
                {concept.bookmarked && (
                  <span className="inline-block bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full text-sm">
                    ⭐ Bookmarked
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Summary */}
              {concept.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Understanding
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{concept.summary}</p>
                  
                  {/* Learning Progress Bar (if available) */}
                  {concept.learningProgress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Understanding Strength</span>
                        <span className="text-blue-400">{concept.learningProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${concept.learningProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Notes */}
              {concept.personalNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Personal Notes
                  </h3>
                  <p className="text-slate-300 bg-slate-700/50 p-3 rounded-lg leading-relaxed">
                    {concept.personalNotes}
                  </p>
                </div>
              )}

              {/* Learning Sources (if available) */}
              {(enhanced.documentationLinksParsed?.length > 0 || enhanced.videoResourcesParsed?.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Learning Sources
                  </h3>
                  <div className="space-y-2">
                    {enhanced.documentationLinksParsed?.map((link: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                        <span className="text-green-400">📄</span>
                        <span className="text-slate-300 text-sm">{link}</span>
                      </div>
                    ))}
                    {enhanced.videoResourcesParsed?.map((video: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                        <span className="text-red-400">🎥</span>
                        <span className="text-slate-300 text-sm">{video}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Connected Concepts */}
              {enhanced.relatedConceptsParsed?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Connected Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                                         {enhanced.relatedConceptsParsed.map((relatedId: string, idx: number) => {
                       const relatedConcept = concepts.find(c => c.id === relatedId)
                       const displayText = relatedConcept?.title || String(relatedId)
                       return (
                         <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-sm">
                           {displayText}
                         </span>
                       )
                     })}
                  </div>
                </div>
              )}

              {/* Learning Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Learning Journey
                </h3>
                <div className="space-y-2">
                  {concept.practiceCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Practice Sessions</span>
                      <span className="text-blue-400">{concept.practiceCount}</span>
                    </div>
                  )}
                  {concept.reviewCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Times Reviewed</span>
                      <span className="text-green-400">{concept.reviewCount}</span>
                    </div>
                  )}
                  {concept.occurrences && concept.occurrences.length > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">First Learned</span>
                        <span className="text-slate-300">{new Date(concept.occurrences[0].createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Appearances</span>
                        <span className="text-purple-400">{concept.occurrences.length} conversations</span>
                      </div>
                    </>
                  )}
                </div>
          </div>
          
              {/* Real World Examples */}
              {enhanced.realWorldExamplesParsed?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Real World Applications
                  </h3>
                  <div className="space-y-1">
                                         {enhanced.realWorldExamplesParsed.map((example: string, idx: number) => (
                       <div key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                         <span className="text-yellow-400 mt-0.5">•</span>
                         <span>{String(example)}</span>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {enhanced.tagsParsed?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                                         {enhanced.tagsParsed.map((tag: string, idx: number) => (
                       <span key={idx} className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
                         #{String(tag)}
                       </span>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={() => setShowReflectionPanel(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              Add to Reflection
            </button>
            
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
                <LaneKnowledgeGraph 
                  concepts={concepts as EnhancedConcept[]}
                  onConceptClick={handleConceptClick}
                  interviewMode={interviewMode}
                  className="bg-slate-900"
                />

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