import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface SmartSuggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type: 'learning_path' | 'practice' | 'review' | 'prerequisite'
  confidence: number
}

interface LearningJourney {
  current_stage?: string
  mastery_level?: number
  total_concepts_learned: number
  knowledge_areas: Record<string, {
    count: number
    confidence_avg: number
    recent_concepts: string[]
  }>
  recent_activity: Array<{
    concept_title: string
    category: string
    date: string
    confidence: number
  }>
  learning_velocity: number
  personalization_level: number
  recommended_focus_areas: Array<{
    category: string
    reason: string
    suggested_action: string
  }>
  achievements: string[]
  // Legacy compatibility for existing UI
  knowledge_gaps?: string[]
  recommendations?: {
    immediate_next: string[]
    short_term_goals: string[]
    long_term_path: string[]
  }
  progress_indicators?: {
    concepts_mastered: number
    total_concepts: number
    learning_velocity: number
  }
}

interface QuickInsight {
  title: string
  description: string
  icon: string
  color: string
  actionable: boolean
}

export function useSmartLearning(userId: string) {
  const [learningJourney, setLearningJourney] = useState<LearningJourney | null>(null)
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [personalizationLevel, setPersonalizationLevel] = useState(0)
  const [currentStage, setCurrentStage] = useState('exploring')
  const [progressPercentage, setProgressPercentage] = useState(0)
  const { toast } = useToast()

  // Initialize smart learning data from existing concepts
  const initializeSmartLearning = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch user's concepts to derive learning journey
      const conceptsResponse = await fetch('/api/concepts')
      if (conceptsResponse.ok) {
        const conceptsData = await conceptsResponse.json()
        const concepts = conceptsData.concepts || []
        
        // Derive learning journey from concepts
        const totalConcepts = concepts.length
        const categories = [...new Set(concepts.map((c: any) => c.category).filter(Boolean))] as string[]
        const avgConfidence = concepts.length > 0 
          ? concepts.reduce((sum: number, c: any) => sum + (c.confidenceScore || 0.5), 0) / concepts.length 
          : 0
        
        // Create learning journey data
        const journeyData: LearningJourney = {
          current_stage: totalConcepts > 20 ? 'advanced' : totalConcepts > 5 ? 'intermediate' : 'exploring',
          mastery_level: avgConfidence,
          total_concepts_learned: totalConcepts,
          knowledge_areas: categories.reduce((acc: Record<string, any>, cat: string) => {
            const catConcepts = concepts.filter((c: any) => c.category === cat)
            acc[cat] = {
              count: catConcepts.length,
              confidence_avg: catConcepts.length > 0 ? catConcepts.reduce((sum: number, c: any) => sum + (c.confidenceScore || 0.5), 0) / catConcepts.length : 0,
              recent_concepts: catConcepts.slice(0, 3).map((c: any) => c.title)
            }
            return acc
          }, {}),
          recent_activity: concepts.slice(0, 5).map((c: any) => ({
            concept_title: c.title,
            category: c.category || 'General',
            date: c.createdAt,
            confidence: c.confidenceScore || 0.5
          })),
          learning_velocity: totalConcepts / Math.max(1, Math.ceil((Date.now() - new Date(concepts[0]?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))),
          personalization_level: Math.min(totalConcepts / 10, 1),
          recommended_focus_areas: categories.slice(0, 3).map((cat: string) => ({
            category: cat,
            reason: 'Active learning area',
            suggested_action: 'Continue exploring'
          })),
          achievements: totalConcepts > 10 ? ['Active Learner'] : [],
          recommendations: {
            immediate_next: ['Explore related concepts', 'Practice with examples', 'Connect to existing knowledge'],
            short_term_goals: ['Master current topics', 'Expand to new areas'],
            long_term_path: ['Build expertise', 'Apply knowledge']
          },
          progress_indicators: {
            concepts_mastered: Math.floor(totalConcepts * avgConfidence),
            total_concepts: totalConcepts,
            learning_velocity: totalConcepts / Math.max(1, 7) // concepts per week
          }
        }
        
        setLearningJourney(journeyData)
        setCurrentStage(journeyData.current_stage || 'exploring')
        setProgressPercentage(Math.round(journeyData.personalization_level * 100))
        setPersonalizationLevel(journeyData.personalization_level)
        
        // Generate quick insights
        const insights: QuickInsight[] = [
          {
            title: 'Learning Progress',
            description: `You've learned ${totalConcepts} concepts across ${categories.length} categories`,
            icon: '📚',
            color: 'blue',
            actionable: true
          },
          {
            title: 'Confidence Level',
            description: `Average confidence: ${Math.round(avgConfidence * 100)}%`,
            icon: '🎯',
            color: 'green',
            actionable: true
          }
        ]
        
        if (totalConcepts > 0) {
          insights.push({
            title: 'Recent Focus',
            description: `Most recent: ${concepts[0]?.category || 'General'}`,
            icon: '🔍',
            color: 'purple',
            actionable: true
          })
        }
        
        setQuickInsights(insights)
        
        // Generate basic suggestions
        const suggestions: SmartSuggestion[] = [
          {
            title: 'Review Low-Confidence Concepts',
            description: 'Strengthen understanding of concepts with lower confidence scores',
            priority: 'high',
            type: 'review',
            confidence: 0.8
          },
          {
            title: 'Explore Related Topics',
            description: 'Discover concepts related to your recent learning',
            priority: 'medium',
            type: 'learning_path',
            confidence: 0.7
          }
        ]
        
        setSmartSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Failed to initialize smart learning:', error)
      // Set empty states on error
      setLearningJourney(null)
      setQuickInsights([])
      setSmartSuggestions([])
      setPersonalizationLevel(0)
      setCurrentStage('exploring')
      setProgressPercentage(0)
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

  // Generate smart suggestions based on recent concepts
  const fetchSmartSuggestions = useCallback(async (recentConcepts: any[]) => {
    // Generate suggestions based on local data
    const suggestions: SmartSuggestion[] = [
      {
        title: 'Review Recent Concepts',
        description: 'Revisit your most recently learned concepts to reinforce understanding',
        priority: 'high',
        type: 'review',
        confidence: 0.9
      },
      {
        title: 'Explore Connected Topics',
        description: 'Discover concepts that build upon your existing knowledge',
        priority: 'medium',
        type: 'learning_path',
        confidence: 0.8
      },
      {
        title: 'Practice Applications',
        description: 'Apply your knowledge with practical exercises and examples',
        priority: 'medium',
        type: 'practice',
        confidence: 0.7
      }
    ]
    
    setSmartSuggestions(suggestions)
  }, [userId])

  // Refresh all smart learning data
  const refreshSmartData = useCallback(async () => {
    await initializeSmartLearning()
  }, [initializeSmartLearning])

  // Initialize on mount
  useEffect(() => {
    initializeSmartLearning()
  }, [initializeSmartLearning])

  return {
    learningJourney,
    quickInsights,
    smartSuggestions,
    isLoading,
    personalizationLevel,
    currentStage,
    progressPercentage,
    fetchSmartSuggestions,
    refreshSmartData
  }
} 