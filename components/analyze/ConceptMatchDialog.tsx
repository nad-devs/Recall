import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Link } from "lucide-react"

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
    createdAt?: string
    lastUpdated: string
    confidenceScore?: number
  }
  similarityScore?: number
  similarityReasons?: string[]
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

  // Debug logging
  console.log("🔧 ConceptMatchDialog render:", {
    open,
    matchesLength: matches?.length || 0,
    isProcessing,
    hasOnDecision: !!onDecision
  })

  // Effect to track when dialog should be opening
  useEffect(() => {
    if (open && matches?.length > 0) {
      console.log("🔧 ConceptMatchDialog: Dialog should be opening now!", {
        open,
        matchesLength: matches.length,
        firstMatch: matches[0]
      })
    }
  }, [open, matches])

  // If we have no matches, don't render anything
  if (!matches || matches.length === 0) {
    console.log("🔧 ConceptMatchDialog: No matches, returning null")
    return null
  }

  // Get the current match (the first one in the array)
  const currentMatch = matches[0]

  console.log("🔧 ConceptMatchDialog: About to render dialog", {
    currentMatchTitle: currentMatch?.newConcept?.title,
    existingConceptTitle: currentMatch?.existingConcept?.title,
    open
  })

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log("🔧 ConceptMatchDialog: onOpenChange called with:", newOpen)
      // Don't allow closing the dialog by clicking outside or escape
      // The user must make a decision using the buttons
    }}>
      <DialogContent className="max-w-2xl w-[90vw]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">
            Existing Concept Found
          </DialogTitle>
          <DialogDescription className="text-base">
            We found a similar concept that already exists. Would you like to update it with new information or just link it to this conversation?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Concept Comparison */}
          <div className="space-y-4">
            {/* New Concept */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-semibold text-green-800">New from Conversation</h3>
              </div>
              <h4 className="font-medium text-lg text-green-900 mb-2">
                {currentMatch.newConcept.title}
              </h4>
              <Badge variant="outline" className="text-green-700 border-green-300 mb-2">
                {currentMatch.newConcept.category}
              </Badge>
              <p className="text-green-800 text-sm leading-relaxed">
                {currentMatch.newConcept.summary}
              </p>
            </div>

            {/* VS Separator */}
            <div className="flex items-center justify-center">
              <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium text-muted-foreground">
                VS
              </div>
            </div>

            {/* Existing Concept */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold text-blue-800">Existing in Database</h3>
              </div>
              <h4 className="font-medium text-lg text-blue-900 mb-2">
                {currentMatch.existingConcept.title}
              </h4>
              <Badge variant="outline" className="text-blue-700 border-blue-300 mb-2">
                {currentMatch.existingConcept.category}
              </Badge>
              {currentMatch.existingConcept.summary && (
                <p className="text-blue-800 text-sm leading-relaxed">
                  {currentMatch.existingConcept.summary}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
            <Button
              onClick={() => onDecision(0, true)}
              disabled={isProcessing}
              className="h-12 text-left justify-start bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="mr-2 h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Update Existing</span>
                <span className="text-xs opacity-90">Merge new information</span>
              </div>
            </Button>
            
            <Button
              onClick={() => onDecision(0, false)}
              disabled={isProcessing}
              variant="outline"
              className="h-12 text-left justify-start border-2"
            >
              <Link className="mr-2 h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Just Link</span>
                <span className="text-xs text-muted-foreground">Keep existing as-is</span>
              </div>
            </Button>
          </div>
          
          {matches.length > 1 && (
            <div className="text-center pt-2">
              <span className="text-sm text-muted-foreground">
                {matches.length - 1} more concept{matches.length - 1 !== 1 ? 's' : ''} to review after this
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 