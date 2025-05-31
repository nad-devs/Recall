"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Loader2, Brain, Lightbulb, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { connectConcepts } from "@/lib/concept-utils"

interface SuggestedConcept {
  title: string
  reason: string
  relevanceScore: number
}

interface SuggestedRelatedConceptsProps {
  currentConcept: {
    id: string
    title: string
    category: string
    summary?: string
    details?: string
  }
  existingRelatedIds: Set<string>
  onConceptCreated: () => Promise<void>
}

// Get authentication headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    if (userEmail && userId) {
      headers['x-user-email'] = userEmail;
      headers['x-user-id'] = userId;
    }
  }
  
  return headers;
}

export function SuggestedRelatedConcepts({ 
  currentConcept, 
  existingRelatedIds, 
  onConceptCreated 
}: SuggestedRelatedConceptsProps) {
  const [suggestedConcepts, setSuggestedConcepts] = useState<SuggestedConcept[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [creatingConcept, setCreatingConcept] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    conceptTitle: string
    reason: string
  }>({
    isOpen: false,
    conceptTitle: '',
    reason: ''
  })
  const { toast } = useToast()

  // Fetch suggestions from backend
  const fetchSuggestions = async () => {
    console.log('🔍 [SuggestedConcepts] Fetching suggestions from backend for:', currentConcept.title)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/concepts/suggestions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conceptId: currentConcept.id,
          conceptTitle: currentConcept.title,
          conceptCategory: currentConcept.category,
          conceptSummary: currentConcept.summary,
          conceptDetails: currentConcept.details
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      
      const data = await response.json()
      console.log('✅ [SuggestedConcepts] Received suggestions:', data.suggestions)
      setSuggestedConcepts(data.suggestions || [])
      
    } catch (error) {
      console.error('❌ [SuggestedConcepts] Error fetching suggestions:', error)
      toast({
        title: "Error",
        description: "Failed to load concept suggestions. Please try again.",
        variant: "destructive",
      })
      setSuggestedConcepts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 [SuggestedConcepts] Component mounted/updated, fetching suggestions...')
    fetchSuggestions()
  }, [currentConcept.id])

  const handleSuggestionClick = (title: string, reason: string) => {
    console.log('💭 [SuggestedConcepts] Opening confirmation dialog for:', title)
    setConfirmDialog({
      isOpen: true,
      conceptTitle: title,
      reason: reason
    })
  }

  const handleConfirmCreate = async () => {
    const { conceptTitle } = confirmDialog
    console.log('🔨 [SuggestedConcepts] User confirmed creation of:', conceptTitle)
    
    setConfirmDialog({ isOpen: false, conceptTitle: '', reason: '' })
    setCreatingConcept(conceptTitle)
    
    try {
      console.log('📡 [SuggestedConcepts] Calling generate API...')
      // Generate the concept using AI
      const generateResponse = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conceptName: conceptTitle,
          context: `Generate a comprehensive concept for "${conceptTitle}" that relates to "${currentConcept.title}" in the "${currentConcept.category}" category. 
          
Context about the source concept: ${currentConcept.summary || currentConcept.details || 'No additional context'}

Make this concept practical and detailed, focusing on real-world applications and implementation details.`,
          sourceConcept: {
            id: currentConcept.id,
            title: currentConcept.title,
            category: currentConcept.category
          }
        }),
      })
      
      console.log('📊 [SuggestedConcepts] Generate API response status:', generateResponse.status)
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        console.error('❌ [SuggestedConcepts] Generate API error:', errorData)
        throw new Error(errorData.error || 'Failed to generate concept')
      }
      
      const newConcept = await generateResponse.json()
      console.log('✅ [SuggestedConcepts] Generated concept:', newConcept)
      
      if (!newConcept.concept || !newConcept.concept.id) {
        console.error('❌ [SuggestedConcepts] Invalid response structure:', newConcept)
        throw new Error('Invalid response from concept generation')
      }
      
      console.log('🔗 [SuggestedConcepts] Linking concepts:', currentConcept.id, '←→', newConcept.concept.id)
      // Link the new concept to the current concept
      await connectConcepts(currentConcept.id, newConcept.concept.id)
      
      toast({
        title: "✨ Concept Created & Linked!",
        description: `"${conceptTitle}" has been created with AI and linked to "${currentConcept.title}"`,
        duration: 4000,
      })
      
      // Remove the suggestion from the list
      setSuggestedConcepts(prev => prev.filter(s => s.title !== conceptTitle))
      console.log('🧹 [SuggestedConcepts] Removed suggestion from list')
      
      // Refresh the parent component
      console.log('🔄 [SuggestedConcepts] Refreshing parent component...')
      await onConceptCreated()
      
    } catch (error) {
      console.error('❌ [SuggestedConcepts] Error creating concept:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create concept. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setCreatingConcept(null)
    }
  }

  const handleCancelCreate = () => {
    console.log('❌ [SuggestedConcepts] User cancelled concept creation')
    setConfirmDialog({ isOpen: false, conceptTitle: '', reason: '' })
  }

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4 border-t border-dashed border-primary/30">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary animate-pulse" />
          <h4 className="text-sm font-medium text-muted-foreground">🤖 AI is analyzing related concepts...</h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (suggestedConcepts.length === 0) {
    console.log('🤷 [SuggestedConcepts] No suggestions to display')
    return null
  }

  return (
    <>
      <div className="space-y-3 pt-4 border-t border-dashed border-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-medium text-muted-foreground">🤖 AI Suggested Related Concepts</h4>
          <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
            ✨ AI Powered
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3">
          💡 AI analyzed "{currentConcept.title}" and suggests these related concepts you can create:
        </div>
        
        <div className="space-y-2">
          {suggestedConcepts.map((suggestion, index) => (
            <Card key={index} className="group hover:shadow-md transition-all duration-200 border-dashed border-primary/40 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium truncate">{suggestion.title}</h5>
                      <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">💭 {suggestion.reason}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 h-7 px-2 text-xs border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => handleSuggestionClick(suggestion.title, suggestion.reason)}
                    disabled={creatingConcept !== null}
                    title={`Ask to create "${suggestion.title}" with AI`}
                  >
                    {creatingConcept === suggestion.title ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Create
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-dashed border-amber-300/50">
          🚀 Click "Create" to generate any concept with AI and automatically link it to "{currentConcept.title}"
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelCreate()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create AI Concept?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div>
                Do you want to create the concept <strong>"{confirmDialog.conceptTitle}"</strong> using AI?
              </div>
              <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded border-l-2 border-blue-500">
                💡 <strong>Why this suggestion:</strong> {confirmDialog.reason}
              </div>
              <div className="text-xs text-muted-foreground">
                🤖 AI will generate comprehensive content for this concept and automatically link it to "{currentConcept.title}".
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelCreate}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate} className="bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-2" />
              Create with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 