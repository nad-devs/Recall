"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Concept, ConversationAnalysis } from "@/lib/types/conversation"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

export function useAnalyzePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Core State
  const [conversationText, setConversationText] = useState("")
  const [analysisResult, setAnalysisResult] =
    useState<ConversationAnalysis | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)

  // UI/Loading State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [analysisStage, setAnalysisStage] = useState("")
  const [discoveredConcepts, setDiscoveredConcepts] = useState<any[]>([])
  const [loadingConcepts, setLoadingConcepts] = useState<string[]>([])

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("")

  // Modals and Dialogs
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [showYouTubeLinkPrompt, setShowYouTubeLinkPrompt] = useState(false)

  // Concept Editing State (Simplified for now)
  const [editConceptMode, setEditConceptMode] = useState(false) // boolean instead of string
  const [showAddConceptCard, setShowAddConceptCard] = useState(false)

  // Usage and API Key
  const [usageData, setUsageData] = useState({
    conversationCount: 0,
    maxConversations: 25,
    hasCustomApiKey: false,
    lastReset: "",
  })
  const [customApiKey, setCustomApiKey] = useState<string | null>(null)

  useEffect(() => {
    const key = localStorage.getItem("custom-api-key")
    if (key) {
      setCustomApiKey(key)
      setUsageData(prev => ({ ...prev, hasCustomApiKey: true }))
    }
  }, [])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSelectedConcept(null)
    setAnalysisStage("Analyzing conversation and extracting concepts...")

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_text: conversationText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const data = await response.json()
      console.log("Analysis response:", data)

      // The API returns both concepts and learning_journey data
      const concepts = data.concepts || []
      const learningJourney = data.learning_journey || {}

      // Transform the concepts to match our ConversationAnalysis interface
      const result: ConversationAnalysis = {
        conversationTitle: concepts[0]?.title || learningJourney.title || "Analysis Results",
        overallSummary: learningJourney.summary || concepts.map((c: any) => c.summary).join("\n\n"),
        conceptMap: concepts.map((c: any) => c.id || c.title),
        concepts: concepts.map((concept: any) => ({
          id: concept.id || concept.title?.replace(/\s+/g, '-').toLowerCase(),
          title: concept.title,
          category: concept.category || "General",
          summary: concept.summary || "",
          details: concept.details || {
            implementation: concept.implementation || "",
            complexity: concept.complexity || {},
            useCases: concept.use_cases || [],
            edgeCases: concept.edge_cases || [],
            performance: concept.performance || "",
            interviewQuestions: concept.interview_questions || [],
            practiceProblems: concept.practice_problems || [],
            furtherReading: concept.further_reading || [],
          },
          keyPoints: concept.key_points || concept.keyPoints || [],
          examples: concept.examples || [],
          codeSnippets: concept.code_snippets || concept.codeSnippets || [],
          relatedConcepts: concept.related_concepts || concept.relatedConcepts || [],
          relationships: concept.relationships || {},
          // New fields for practical summary mode
          keyTakeaway: concept.key_takeaway || concept.keyTakeaway,
          analogy: concept.analogy,
          practicalTips: concept.practical_tips || concept.practicalTips || [],
          // Additional learning data from journey analysis
          personalNotes: learningJourney.personal_insights?.[0]?.content,
          learningTips: learningJourney.learning_tips || [],
          commonMistakes: learningJourney.common_mistakes || [],
        })),
        // Store the learning journey metadata
        personalLearning: learningJourney,
      }

      setAnalysisResult(result)
      if (result.concepts.length > 0) {
        setSelectedConcept(result.concepts[0])
      }

      toast({
        title: "Analysis Complete!",
        description: `Found ${result.concepts.length} concept${result.concepts.length === 1 ? '' : 's'} in your conversation.`,
      })
    } catch (error: any) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisStage("")
    }
  }

  const handleSaveConversation = async () => {
    if (!analysisResult) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch("/api/saveConversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_text: conversationText,
          analysis: analysisResult,
          customApiKey: customApiKey,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to save conversation.")
      }

      toast({
        title: "Success!",
        description: "Your analysis has been saved.",
      })
      router.push(`/conversation/${data.conversationId}`)
    } catch (error: any) {
      setSaveError(error.message)
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleApiKeySet = () => {
    const key = localStorage.getItem("custom-api-key")
    setCustomApiKey(key)
    setUsageData(prev => ({ ...prev, hasCustomApiKey: true }))
    setShowApiKeyModal(false)
    toast({
      title: "API Key Verified",
      description: "Your OpenAI API key has been set.",
    })
  }

  const filteredConcepts =
    analysisResult?.concepts.filter(concept =>
      concept.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  // Mocked functions that were part of the original but are not implemented here for simplicity
  const handleCategoryUpdate = () => {}
  const handleAddConcept = () => {}
  const handleDeleteConcept = () => {}
  const handleDeleteCodeSnippet = () => {}
  const handleConfirmConceptUpdates = () => {}
  const handleCancelConceptUpdates = () => {}
  const addConceptToCurrentAnalysis = () => {}
  const handleConceptMatchDecision = () => {}
  const finalizeSaveWithMatches = () => {}
  const handleSaveConversationDecision = () => {}
  const handleSkipSavingDecision = () => {}
  const handleApiKeyModalClose = () => setShowApiKeyModal(false)
  const getRemainingConversations = () =>
    usageData.maxConversations - usageData.conversationCount
  const handleUserInfoProvided = () => {}
  const handleUserInfoModalClose = () => setShowUserInfoModal(false)
  const handleYouTubeLinkAdd = (link: string) => {}
  const handleYouTubeLinkSkip = () => setShowYouTubeLinkPrompt(false)

  return {
    // State
    conversationText,
    analysisResult,
    selectedConcept,
    isAnalyzing,
    searchQuery,
    isSaving,
    saveError,
    editConceptMode,
    showAddConceptCard,
    discoveredConcepts,
    analysisStage,
    filteredConcepts,
    showApiKeyModal,
    usageData,
    showUserInfoModal,
    showYouTubeLinkPrompt,
    loadingConcepts,
    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setShowAddConceptCard,
    setEditConceptMode,
    setAnalysisResult,
    // Handlers
    handleAnalyze,
    handleSaveConversation,
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,
    handleUserInfoProvided,
    handleUserInfoModalClose,
    handleYouTubeLinkAdd,
    handleYouTubeLinkSkip,
    // Unused handlers from previous version (can be removed or implemented)
    handleCategoryUpdate,
    handleAddConcept,
    handleDeleteConcept,
    handleDeleteCodeSnippet,
    handleConfirmConceptUpdates,
    handleCancelConceptUpdates,
    addConceptToCurrentAnalysis,
    handleConceptMatchDecision,
    finalizeSaveWithMatches,
    handleSaveConversationDecision,
    handleSkipSavingDecision,
  }
} 