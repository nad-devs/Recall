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

  // Initialize smart learning data
  const initializeSmartLearning = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use your Render backend URL
      const BACKEND_URL = 'https://recall-p3vg.onrender.com'
      
      // Fetch learning journey from backend
      const journeyResponse = await fetch(`${BACKEND_URL}/api/v1/smart-learning-journey/${userId}`)
      if (journeyResponse.ok) {
        const journeyData = await journeyResponse.json()
        setLearningJourney(journeyData.journey)
        setCurrentStage(journeyData.journey?.current_stage || 'exploring')
        setProgressPercentage(Math.round((journeyData.journey?.personalization_level || 0) * 100))
      }

      // Fetch quick insights
      const insightsResponse = await fetch(`${BACKEND_URL}/api/v1/quick-insights/${userId}`)
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setQuickInsights(insightsData.insights || [])
      }

      // Fetch learning profile for personalization level
      const profileResponse = await fetch(`${BACKEND_URL}/api/v1/user-profile/${userId}`)
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setPersonalizationLevel(profileData.personalization_confidence || 0)
      }

    } catch (error) {
      console.error('Failed to initialize smart learning:', error)
      toast({
        title: 'Smart Learning Unavailable',
        description: 'Backend connection failed. Please check if the extraction service is running.',
        variant: 'destructive'
      })
      
      // Set empty states instead of mock data
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

  // Fetch smart suggestions based on recent concepts
  const fetchSmartSuggestions = useCallback(async (recentConcepts: any[]) => {
    try {
      const BACKEND_URL = 'https://recall-p3vg.onrender.com'
      const response = await fetch(`${BACKEND_URL}/api/v1/smart-suggestions/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recent_concepts: recentConcepts
        })
      })

      if (response.ok) {
        const data = await response.json()
        const suggestions = data.suggestions?.map((suggestion: any) => ({
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority || 'medium',
          type: suggestion.type || 'learning_path',
          confidence: suggestion.confidence || 0.5
        })) || []
        
        setSmartSuggestions(suggestions)
      } else {
        console.warn('Smart suggestions API returned non-OK status:', response.status)
        setSmartSuggestions([])
      }
    } catch (error) {
      console.error('Failed to fetch smart suggestions:', error)
      setSmartSuggestions([])
    }
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