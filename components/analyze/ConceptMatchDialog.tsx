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
    category: string
    summary: string
    details: string
    keyPoints: string[]
    examples: string[]
    relatedConcepts: string[]
  }
  existingConcept: {
    id: string
    title: string
    category: string
    summary?: string
    details?: string
    createdAt: string
    lastUpdated: string
    confidenceScore: number
  }
  similarityScore: number
  similarityReasons: string[]
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

  // If we have no matches, don't render anything
  if (!matches || matches.length === 0) {
    return null
  }

  // Get the current match (the first one in the array)
  const currentMatch = matches[0]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Concept (Left) */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                New Concept
              </CardTitle>
              <CardDescription className="text-green-700">
                Extracted from current conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-800">{currentMatch.newConcept.title}</h4>
                <Badge variant="outline" className="text-xs mt-1 border-green-300 text-green-700">
                  {currentMatch.newConcept.category}
                </Badge>
              </div>

              <div>
                <h5 className="font-medium text-green-800 mb-2">Summary</h5>
                <p className="text-sm text-green-700 leading-relaxed">
                  {currentMatch.newConcept.summary}
                </p>
              </div>

              {currentMatch.newConcept.keyPoints.length > 0 && (
                <div>
                  <h5 className="font-medium text-green-800 mb-2">Key Points</h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    {currentMatch.newConcept.keyPoints.slice(0, 3).map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                    {currentMatch.newConcept.keyPoints.length > 3 && (
                      <li className="text-xs text-green-600 italic">
                        +{currentMatch.newConcept.keyPoints.length - 3} more points
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Concept (Right) */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                Existing Concept
              </CardTitle>
              <CardDescription className="text-blue-700 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Created {formatDate(currentMatch.existingConcept.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-800">{currentMatch.existingConcept.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {currentMatch.existingConcept.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {Math.round(currentMatch.existingConcept.confidenceScore * 100)}% confidence
                  </Badge>
                </div>
              </div>

              {currentMatch.existingConcept.summary && (
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Current Summary</h5>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {currentMatch.existingConcept.summary}
                  </p>
                </div>
              )}

              <div>
                <h5 className="font-medium text-blue-800 mb-2">Why This Matches</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  {currentMatch.similarityReasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="inline-block w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {Math.round(currentMatch.similarityScore * 100)}% similar
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
            <Button
              onClick={() => onDecision(0, true)}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Update Existing Concept
              <span className="ml-2 text-xs opacity-90">
                Merge new information
              </span>
            </Button>
            
            <Button
              onClick={() => onDecision(0, false)}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 min-h-[44px]"
            >
              Just Link to Conversation
              <span className="ml-2 text-xs opacity-70">
                Keep existing as-is
              </span>
            </Button>
          </div>
          
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={isProcessing}
            >
              Skip All Remaining ({matches.length - 1})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 