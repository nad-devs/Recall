import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight } from "lucide-react"

interface ConceptMatch {
  newConcept: {
    title: string
    summary: string
    category: string
    keyPoints: string[]
    details: any
    examples: any[]
    codeSnippets: any[]
    relatedConcepts: string[]
  }
  existingConcept: {
    id: string
    title: string
    summary: string
    category: string
    lastUpdated: string
  }
}

interface ConceptMatchDialogProps {
  open: boolean
  matches: ConceptMatch[]
  isProcessing: boolean
  onDecision: (matchIndex: number, shouldUpdate: boolean) => void
}

export function ConceptMatchDialog({ 
  open, 
  matches, 
  isProcessing, 
  onDecision 
}: ConceptMatchDialogProps) {

  // Add debug logging to track when dialog is rendered with its state
  useEffect(() => {
    console.log('📋 ConceptMatchDialog - Render state:', { open, matchesCount: matches.length, isProcessing })
  }, [open, matches, isProcessing])

  // If we have no matches, don't render anything
  if (!matches || matches.length === 0) {
    console.log('📋 ConceptMatchDialog - No matches, not rendering')
    return null
  }

  // Get the current match (the first one in the array)
  const currentMatch = matches[0]
  console.log('📋 ConceptMatchDialog - Current match:', currentMatch.newConcept.title, '→', currentMatch.existingConcept.title)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {
      console.log('📋 ConceptMatchDialog - Dialog open state change attempted - this is forced open')
      // We don't allow closing via ESC or clicking outside
      // Only via the buttons
    }}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            Existing Concept Found
            <Badge variant="secondary">{matches.length} remaining</Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We found a similar concept that already exists. Would you like to update it with new information or just link it to this conversation?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comparison View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Existing Concept */}
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                  Existing Concept
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Last updated: {formatDate(currentMatch.existingConcept.lastUpdated)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    maxHeight: '3rem'
                  }}>
                    {currentMatch.existingConcept.title}
                  </h4>
                  <Badge variant="outline" className="mt-1">
                    {currentMatch.existingConcept.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    maxHeight: '4.5rem'
                  }}>
                    {currentMatch.existingConcept.summary || "No summary available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* New Concept */}
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  New Analysis
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  From current conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    maxHeight: '3rem'
                  }}>
                    {currentMatch.newConcept.title}
                  </h4>
                  <Badge variant="outline" className="mt-1">
                    {currentMatch.newConcept.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    maxHeight: '4.5rem'
                  }}>
                    {currentMatch.newConcept.summary}
                  </p>
                </div>
                {currentMatch.newConcept.keyPoints.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-800 dark:text-green-200 mb-1">Key Points:</h5>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      {currentMatch.newConcept.keyPoints.slice(0, 2).map((point, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0">•</span>
                          <span className="overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            maxHeight: '3rem'
                          }}>{point}</span>
                        </li>
                      ))}
                      {currentMatch.newConcept.keyPoints.length > 2 && (
                        <li className="text-green-600 dark:text-green-400 italic text-xs">
                          +{currentMatch.newConcept.keyPoints.length - 2} more points...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
            <Button
              onClick={() => onDecision(0, true)}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
            >
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex flex-col items-start">
                <span>Update Existing Concept</span>
                <span className="text-xs opacity-80">(Merge new information)</span>
              </span>
            </Button>
            
            <Button
              onClick={() => onDecision(0, false)}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 min-h-[44px]"
            >
              <span className="flex flex-col items-start">
                <span>Just Link to Conversation</span>
                <span className="text-xs opacity-60">(Keep existing as-is)</span>
              </span>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border dark:border-gray-700">
            <p className="font-medium mb-2 text-gray-800 dark:text-gray-200">What happens with each choice:</p>
            <ul className="space-y-1 text-xs">
              <li><strong className="text-gray-900 dark:text-gray-100">Update:</strong> Existing concept gets enriched with new information while preserving enhancements</li>
              <li><strong className="text-gray-900 dark:text-gray-100">Link only:</strong> Existing concept stays unchanged but gets connected to this conversation</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 