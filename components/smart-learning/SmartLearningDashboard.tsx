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
      <Card className="bg-background/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Smart Learning
            <Badge variant="outline" className="text-xs">
              {Math.round(personalizationLevel * 100)}% personalized
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Stage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-primary/80" />
              <span className="text-xs font-medium text-foreground/80">
                {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{progressPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-primary/10 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Quick Stats */}
          {learningJourney && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-background/70 rounded-md border">
                <div className="font-bold text-foreground">
                  {learningJourney.total_concepts_learned || 0}
                </div>
                <div className="text-muted-foreground">Concepts</div>
              </div>
              <div className="text-center p-2 bg-background/70 rounded-md border">
                <div className="font-bold text-foreground">
                  {Object.keys(learningJourney.knowledge_areas || {}).length}
                </div>
                <div className="text-muted-foreground">Categories</div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-6"
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
              <TrendingUp className="h-5 w-5 text-primary" />
              Learning Journey
            </CardTitle>
            <CardDescription>
              Your personalized learning path and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round((learningJourney.mastery_level || learningJourney.personalization_level || 0) * 100)}%
                </div>
                <div className="text-sm text-primary/80">Overall Mastery</div>
              </div>
              <Badge variant="outline">
                {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
              </Badge>
            </div>

            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {learningJourney.progress_indicators?.concepts_mastered || learningJourney.total_concepts_learned || 0}
                </div>
                <div className="text-xs text-muted-foreground">Concepts Learned</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {Object.keys(learningJourney.knowledge_areas || {}).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
                              <div>
                  <div className="text-lg font-semibold text-foreground">
                    {Number(learningJourney.progress_indicators?.learning_velocity || learningJourney.learning_velocity || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Learning Velocity</div>
                </div>
            </div>

            {/* Immediate Recommendations */}
            {learningJourney.recommendations?.immediate_next && learningJourney.recommendations.immediate_next.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Next Steps
                </h4>
                <div className="space-y-1">
                  {learningJourney.recommendations.immediate_next.slice(0, 3).map((step, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
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
              <Brain className="h-5 w-5 text-primary" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered recommendations based on your learning pattern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smartSuggestions.map((suggestion, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <h4 className="font-semibold text-card-foreground">{suggestion.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${suggestion.confidence * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-foreground ml-4">{Math.round(suggestion.confidence * 100)}% confidence</span>
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
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Insights
            </CardTitle>
            <CardDescription>
              Recent patterns and achievements in your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    {insight.type === 'progress' && <TrendingUp className="h-5 w-5 text-primary" />}
                    {insight.type === 'confidence' && <Sparkles className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
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