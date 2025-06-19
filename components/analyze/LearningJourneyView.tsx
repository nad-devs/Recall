"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, Target, TrendingUp, BookOpen, Lightbulb, Sparkles } from "lucide-react"

// Define the shape of the analysis data we expect
interface ConceptAnalysis {
  conceptTitle: string;
  isLearningNewTopic: boolean;
  masteredPrerequisites: string[];
  suggestedNextSteps: string[];
  learningProgress: number;
}

interface LearningJourneyProps {
  analysis: {
    summary?: string;
    analyses?: ConceptAnalysis[];
  } | null;
  isAnalyzing: boolean;
}

export function LearningJourneyView({ analysis, isAnalyzing }: LearningJourneyProps) {
  if (isAnalyzing) {
    return (
      <Card className="w-full bg-slate-800/30 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            Generating Smart Insights...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
                <Skeleton className="h-5 w-3/4 bg-slate-700" />
                <Skeleton className="h-4 w-1/2 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle cases where analysis might be null or empty
  if (!analysis || !analysis.analyses || analysis.analyses.length === 0) {
    return null; // Don't render anything if there's no journey data
  }

  const { analyses, summary } = analysis;

  return (
    <Card className="w-full bg-slate-900/50 border border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Brain className="h-6 w-6 text-blue-400" />
          <span className="text-xl">Your Learning Journey</span>
        </CardTitle>
        {summary && (
          <p className="text-slate-400 pt-2">{summary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {analyses && analyses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((conceptAnalysis, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 flex flex-col">
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-200 truncate">{conceptAnalysis.conceptTitle}</h4>
                      {conceptAnalysis.isLearningNewTopic && (
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          New Topic
                        </Badge>
                      )}
                    </div>

                    {conceptAnalysis.masteredPrerequisites && conceptAnalysis.masteredPrerequisites.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-400">
                          <Target className="h-4 w-4" />
                          <span>You Know This</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {conceptAnalysis.masteredPrerequisites.map((prereq, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-green-900/30 text-green-300 border-green-700/50">
                              {prereq}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {conceptAnalysis.suggestedNextSteps && conceptAnalysis.suggestedNextSteps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-purple-400">
                          <TrendingUp className="h-4 w-4" />
                          <span>Suggested Next Steps</span>
                        </div>
                        <div className="space-y-2">
                          {conceptAnalysis.suggestedNextSteps.map((step, i) => (
                            <div key={i} className="text-xs text-slate-300 bg-slate-700/50 p-2 rounded-md border border-slate-600">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {typeof conceptAnalysis.learningProgress === 'number' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-400">Topic Progress</span>
                        <span className="text-xs text-slate-300">
                          {Math.round(conceptAnalysis.learningProgress * 100)}%
                        </span>
                      </div>
                      <Progress value={conceptAnalysis.learningProgress * 100} className="h-2 [&>div]:bg-purple-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 