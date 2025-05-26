import React from 'react'
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
import { Save, SkipForward, CheckCircle } from "lucide-react"

interface ConversationSaveDialogProps {
  open: boolean
  updatedConceptsCount: number
  onSaveConversation: () => void
  onSkipSaving: () => void
  isProcessing: boolean
}

export function ConversationSaveDialog({ 
  open, 
  updatedConceptsCount,
  onSaveConversation,
  onSkipSaving,
  isProcessing
}: ConversationSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Concepts Updated Successfully!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {updatedConceptsCount} concept{updatedConceptsCount !== 1 ? 's have' : ' has'} been updated with new information. 
            Would you like to save this conversation for future reference?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Information Card */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">
                What happened:
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                  Concepts were successfully updated with new information
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                  Bidirectional relationships were established
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                  All changes have been saved to your knowledge base
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onSaveConversation}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
            >
              <Save className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex flex-col items-start">
                <span>Save Full Conversation</span>
                <span className="text-xs opacity-80">(Keep for reference)</span>
              </span>
            </Button>
            
            <Button
              onClick={onSkipSaving}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 min-h-[44px]"
            >
              <SkipForward className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex flex-col items-start">
                <span>Skip Saving</span>
                <span className="text-xs opacity-60">(Concepts updated only)</span>
              </span>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border dark:border-gray-700">
            <p className="font-medium mb-2 text-gray-800 dark:text-gray-200">Choose based on conversation value:</p>
            <ul className="space-y-1 text-xs">
              <li><strong className="text-gray-900 dark:text-gray-100">Save:</strong> If this conversation provides unique insights or examples worth revisiting</li>
              <li><strong className="text-gray-900 dark:text-gray-100">Skip:</strong> If this was mainly for concept updates without significant new learning content</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 