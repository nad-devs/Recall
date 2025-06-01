import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Link } from "lucide-react"

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
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            Concept Already Exists
          </DialogTitle>
          <DialogDescription className="text-base">
            <strong>"{currentMatch.existingConcept.title}"</strong> already exists in your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Simple Question */}
          <div className="text-center">
            <p className="text-lg font-medium">
              Do you want to update it with new information?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onDecision(0, true)}
              disabled={isProcessing}
              className="h-12"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update It
            </Button>
            
            <Button
              onClick={() => onDecision(0, false)}
              disabled={isProcessing}
              variant="outline"
              className="h-12"
            >
              <Link className="mr-2 h-4 w-4" />
              Just Link
            </Button>
          </div>
          
          {matches.length > 1 && (
            <div className="text-center pt-2">
              <span className="text-sm text-muted-foreground">
                {matches.length - 1} more to review
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 