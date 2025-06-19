"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, Target, TrendingUp, BookOpen, Lightbulb } from "lucide-react"

interface LearningJourneyViewProps {
  analysis: any
  isAnalyzing: boolean
}

export function LearningJourneyView({ analysis, isAnalyzing }: LearningJourneyViewProps) {
  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analyzing Learning Journey...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis || !analysis.success) {
    return null
  }

  const { analyses, summary } = analysis

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          Learning Journey Analysis
        </CardTitle>
        {summary && (
          <p className="text-sm text-muted-foreground">{summary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {analyses && analyses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((conceptAnalysis: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{conceptAnalysis.conceptTitle}</h4>
                      {conceptAnalysis.isLearningNewTopic && (
                        <Badge variant="secondary" className="text-xs">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </div>

                    {conceptAnalysis.masteredPrerequisites && conceptAnalysis.masteredPrerequisites.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700">
                            Prerequisites Mastered ({conceptAnalysis.masteredPrerequisites.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {conceptAnalysis.masteredPrerequisites.slice(0, 3).map((prereq: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {prereq}
                            </Badge>
                          ))}
                          {conceptAnalysis.masteredPrerequisites.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{conceptAnalysis.masteredPrerequisites.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {conceptAnalysis.suggestedNextSteps && conceptAnalysis.suggestedNextSteps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">Next Steps</span>
                        </div>
                        <div className="space-y-1">
                          {conceptAnalysis.suggestedNextSteps.slice(0, 2).map((step: string, i: number) => (
                            <div key={i} className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conceptAnalysis.learningProgress && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Learning Progress</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(conceptAnalysis.learningProgress * 100)}%
                          </span>
                        </div>
                        <Progress value={conceptAnalysis.learningProgress * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {analysis.overallInsights && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Overall Learning Insights</h4>
              </div>
              <p className="text-sm text-blue-800">{analysis.overallInsights}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
} 