import { useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { ConversationAnalysis } from '@/lib/types/conversation'
import { mapBackendResponseToAnalysis } from '@/lib/utils/conversation'

interface UseAutoAnalysisProps {
  setConversationText: (text: string) => void
  setIsAnalyzing: (analyzing: boolean) => void
  setShowAnimation: (show: boolean) => void
  setAnalysisResult: (result: ConversationAnalysis) => void
  setSelectedConcept: (concept: any) => void
  setSelectedTab: (tab: string) => void
  setDiscoveredConcepts: (concepts: string[]) => void
  setAnalysisStage: (stage: string) => void
  analysisResult: ConversationAnalysis | null
}

export function useAutoAnalysis({
  setConversationText,
  setIsAnalyzing,
  setShowAnimation,
  setAnalysisResult,
  setSelectedConcept,
  setSelectedTab,
  setDiscoveredConcepts,
  setAnalysisStage,
  analysisResult
}: UseAutoAnalysisProps) {
  const { toast } = useToast()

  // Function to start auto analysis with provided text
  const startAutoAnalysis = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return
    
    setIsAnalyzing(true)
    setShowAnimation(true)
    
    // Clear any previous discovered concepts and set initial stage
    setDiscoveredConcepts([])
    setAnalysisStage("Initializing analysis...")
    
    try {
      console.log("Auto-starting analysis for concept creation...")
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://recall.p3vg.onrender.com'
      const response = await fetch(`${backendUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_text: textToAnalyze
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || 'Something went wrong during analysis'
        toast({
          title: "Analysis failed",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("Analysis failed:", errorMessage)
        setIsAnalyzing(false)
        setShowAnimation(false)
        setDiscoveredConcepts([])
        setAnalysisStage("Initializing...")
        return
      }
      
      console.log("Received analysis results:", data)
      
      const normalizedData = {
        ...data,
        concepts: data.concepts.map((concept: any) => ({
          ...concept,
          keyPoints: Array.isArray(concept.keyPoints)
            ? concept.keyPoints
            : (concept.keyPoints ? [concept.keyPoints] : ["Extracted from conversation"]),
          summary: concept.summary || data.conversation_summary || "",
          category: concept.category || "General",
          id: concept.id || `temp-${Math.random().toString(36).substring(2, 9)}`
        }))
      }
      
      const analysis = mapBackendResponseToAnalysis(normalizedData)
      setAnalysisResult(analysis)
      setDiscoveredConcepts(analysis.concepts.map((c: any) => c.title))
      
      if (analysis.concepts.length > 0) {
        setSelectedConcept(analysis.concepts[0])
        setSelectedTab("summary")
      }
      
      console.log("Auto-analysis completed successfully")
      setTimeout(() => {
        setShowAnimation(false)
        setIsAnalyzing(false)
        setDiscoveredConcepts([])
        setAnalysisStage("Initializing...")
      }, 1000)
    } catch (error) {
      console.error('Error during auto-analysis:', error)
      toast({
        title: "Analysis failed",
        description: "An error occurred while analyzing the conversation. Please try again.",
        variant: "destructive",
      })
      setIsAnalyzing(false)
      setShowAnimation(false)
      setDiscoveredConcepts([])
      setAnalysisStage("Initializing...")
    }
  }, [setIsAnalyzing, setShowAnimation, toast, setAnalysisResult, setDiscoveredConcepts, setSelectedConcept, setSelectedTab, setAnalysisStage])

  // Function to link concepts after analysis
  const linkConceptsAfterAnalysis = useCallback(async (originalConceptId: string, originalConceptTitle: string, newConceptId: string, newConceptTitle: string) => {
    try {
      // Call API to create bidirectional relationship
      const response = await fetch('/api/concepts/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conceptId1: originalConceptId,
          conceptId2: newConceptId
        })
      })
      
      if (response.ok) {
        toast({
          title: "Concepts linked!",
          description: `"${newConceptTitle}" has been linked to "${originalConceptTitle}"`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error linking concepts:', error)
    }
  }, [toast])

  // Initialize with URL parameters and link-back data
  useEffect(() => {
    // Check URL for concept parameter
    const urlParams = new URLSearchParams(window.location.search)
    const conceptParam = urlParams.get('concept')
    
    if (conceptParam) {
      // Decode the concept name properly
      const decodedConcept = decodeURIComponent(conceptParam)
      
      // Pre-fill the conversation text with a prompt about the concept
      const conceptPrompt = `Please explain and provide details about the concept: ${decodedConcept}

Include:
- What it is and how it works
- Key principles and components
- Implementation details and examples
- Use cases and applications
- Related concepts and technologies
- Code examples if applicable`
      
      setConversationText(conceptPrompt)
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/analyze')
      
      // Automatically start analysis after a brief delay to ensure state is set
      setTimeout(() => {
        startAutoAnalysis(conceptPrompt)
      }, 500)
    }
  }, [setConversationText, startAutoAnalysis])

  // Auto-link concepts after successful analysis
  useEffect(() => {
    if (analysisResult && analysisResult.concepts.length > 0) {
      // Check if we need to link back to an original concept
      const linkBackData = localStorage.getItem('linkBackToConcept')
      if (linkBackData) {
        try {
          const { id: originalConceptId, title: originalConceptTitle, relatedConceptTitle } = JSON.parse(linkBackData)
          
          // Find the newly created concept that matches the related concept title
          const newConcept = analysisResult.concepts.find(c => 
            c.title.toLowerCase().includes(relatedConceptTitle.toLowerCase()) ||
            relatedConceptTitle.toLowerCase().includes(c.title.toLowerCase())
          )
          
          if (newConcept) {
            // Auto-link the concepts
            linkConceptsAfterAnalysis(originalConceptId, originalConceptTitle, newConcept.id, newConcept.title)
          }
          
          // Clear the stored data
          localStorage.removeItem('linkBackToConcept')
        } catch (error) {
          console.error('Error processing link-back data:', error)
          localStorage.removeItem('linkBackToConcept')
        }
      }
    }
  }, [analysisResult, linkConceptsAfterAnalysis])

  return {
    startAutoAnalysis,
    linkConceptsAfterAnalysis,
  }
} 