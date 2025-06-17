"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Target, TrendingUp, Users, Zap, BookOpen, Clock } from 'lucide-react'
import { useSmartLearning } from '@/hooks/useSmartLearning'

interface SmartLearningDashboardProps {
  userId: string
  onSuggestionClick?: (suggestion: any) => void
  compact?: boolean
}

export function SmartLearningDashboard({ 
  userId, 
  onSuggestionClick, 
  compact = false 
}: SmartLearningDashboardProps) {
  const {
    learningJourney,
    quickInsights,
    smartSuggestions,
    isLoading,
    personalizationLevel,
    currentStage,
    progressPercentage,
    refreshSmartData
  } = useSmartLearning(userId)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-600" />
            Smart Learning
            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700">
              {Math.round(personalizationLevel * 100)}% personalized
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Stage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-800">
                {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
              </span>
            </div>
            <span className="text-xs text-indigo-600">{progressPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-indigo-100 rounded-full h-1.5">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Quick Stats */}
          {learningJourney && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-white/70 rounded border border-indigo-100">
                <div className="font-bold text-indigo-700">
                  {learningJourney.total_concepts_learned || 0}
                </div>
                <div className="text-indigo-600">Concepts</div>
              </div>
              <div className="text-center p-2 bg-white/70 rounded border border-indigo-100">
                <div className="font-bold text-indigo-700">
                  {Object.keys(learningJourney.knowledge_areas || {}).length}
                </div>
                <div className="text-indigo-600">Categories</div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center pt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-indigo-600 hover:text-indigo-700 h-6"
              onClick={() => refreshSmartData()}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Refresh Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full dashboard view (for dedicated smart learning page)
  return (
    <div className="space-y-4">
      {/* Learning Journey Overview */}
      {learningJourney && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Learning Journey
            </CardTitle>
            <CardDescription>
              Your personalized learning path and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {Math.round((learningJourney.mastery_level || learningJourney.personalization_level || 0) * 100)}%
                </div>
                <div className="text-sm text-green-600">Overall Mastery</div>
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
              </Badge>
            </div>

            <div className="w-full bg-green-100 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-700">
                  {learningJourney.progress_indicators?.concepts_mastered || learningJourney.total_concepts_learned || 0}
                </div>
                <div className="text-xs text-gray-500">Concepts Learned</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700">
                  {Object.keys(learningJourney.knowledge_areas || {}).length || 0}
                </div>
                <div className="text-xs text-gray-500">Categories</div>
              </div>
                              <div>
                  <div className="text-lg font-semibold text-gray-700">
                    {Number(learningJourney.progress_indicators?.learning_velocity || learningJourney.learning_velocity || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Learning Velocity</div>
                </div>
            </div>

            {/* Immediate Recommendations */}
            {learningJourney.recommendations?.immediate_next && learningJourney.recommendations.immediate_next.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Next Steps
                </h4>
                <div className="space-y-1">
                  {learningJourney.recommendations.immediate_next.slice(0, 3).map((step, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered recommendations based on your learning pattern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {smartSuggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-50 rounded-lg border hover:border-purple-200 transition-colors cursor-pointer"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{suggestion.title}</h4>
                  <Badge 
                    variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              Quick Insights
            </CardTitle>
            <CardDescription>
              Recent patterns and achievements in your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                {React.createElement(
                  insight.icon === 'Code' ? BookOpen : 
                  insight.icon === 'TrendingUp' ? TrendingUp : 
                  insight.icon === 'Users' ? Users : Clock, 
                  { className: `h-4 w-4 text-${insight.color}-500 mt-0.5` }
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-700">{insight.title}</h4>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
                {insight.actionable && (
                  <Badge variant="outline" className="text-xs">
                    Actionable
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 