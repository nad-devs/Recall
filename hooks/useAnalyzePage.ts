"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Concept, ConversationAnalysis } from "@/lib/types/conversation"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store/store"
import { moveConceptsAsync } from "@/store/categorySlice"
import { getStructuredCategories } from "@/lib/categories"

export function useAnalyzePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const dispatch = useDispatch<AppDispatch>()

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
  const [analysisMode, setAnalysisMode] = useState<"deepdive" | "recall">("recall")

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("")

  // Modals and Dialogs
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [showYouTubeLinkPrompt, setShowYouTubeLinkPrompt] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null)

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

  // YouTube Link State
  const [youtubeLink, setYoutubeLink] = useState<string>("")
  const [learningJourneyAnalysis, setLearningJourneyAnalysis] = useState<any>(null)
  const [isAnalyzingLearningJourney, setIsAnalyzingLearningJourney] = useState(false)

  // Category Editing
  const [structuredCategories, setStructuredCategories] = useState<{ [key: string]: string[] }>({})

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

    console.log("--- STARTING ANALYSIS ---");
    console.log("Conversation Text to be sent to backend:", conversationText);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          conversation_text: conversationText
        }),
        credentials: "include",
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
        concepts: concepts.map((concept: any) => {
          console.log("Processing concept from backend:", concept.title, "with fields:", Object.keys(concept))
          return {
            // Keep ALL properties from backend, ensuring no data loss
            ...concept,
            // Ensure required fields have defaults
            id: concept.id || concept.title?.replace(/\s+/g, '-').toLowerCase(),
            title: concept.title,
            category: concept.category || "General",
            summary: concept.summary || "",
            details: concept.details || {
              implementation: "",
              complexity: {},
              useCases: [],
              edgeCases: [],
              performance: "",
              interviewQuestions: [],
              practiceProblems: [],
              furtherReading: []
            },
            keyPoints: concept.keyPoints || [],
            examples: concept.examples || [],
            codeSnippets: concept.codeSnippets || [],
            relatedConcepts: concept.relatedConcepts || [],
            // Preserve quick recall fields from backend
            keyTakeaway: concept.keyTakeaway,
            analogy: concept.analogy,
            practicalTips: concept.practicalTips,
            // Add learning journey data
            personalNotes: learningJourney.personal_insights?.[0]?.content,
            learningTips: learningJourney.learning_tips || [],
            commonMistakes: learningJourney.common_mistakes || [],
          }
        }),
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

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return
    setIsSaving(true)
    setSaveError(null)

    try {
      // First, check for existing concepts before saving
      console.log("💾 Checking for existing concepts before saving...")
      console.log(`💾 Number of concepts to check: ${analysisResult.concepts.length}`)
      
      // Log concept titles we're checking
      const conceptTitles = analysisResult.concepts.map(c => c.title).join(', ')
      console.log(`💾 Concepts being checked: ${conceptTitles}`)
      
      // OLD CONCEPT MATCHING SYSTEM DISABLED - Now using embedding-based relationship detection
      // The new system handles duplicate detection during analysis phase with vector embeddings
      // and shows visual indicators (orange/blue) in the UI instead of blocking save dialogs
      console.log("💾 Using new embedding-based concept relationships - proceeding to save")
      
      // Proceed directly with saving - no more blocking concept match dialogs
      await performSaveAnalysis()
    } catch (error) {
      console.error('Error saving analysis:', error)
      setSaveError('Failed to save analysis. Please try again.')
      setIsSaving(false)
    }
  }

  // Perform the actual save operation

  // Function to analyze learning journey for newly created concepts (simplified)
  const analyzeLearningJourney = async (conceptIds: string[]) => {
    // TODO: Implement when backend service is ready
    console.log("🧠 Learning journey analysis placeholder for concepts:", conceptIds)
  }

  const performSaveAnalysis = async () => {
    if (!analysisResult) return
    
    try {
      console.log("💾 performSaveAnalysis - Starting API call")
      
      // Get user info from localStorage if available (for non-authenticated users)
      const userName = localStorage.getItem('userName')
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      // Add YouTube link to concepts if available
      const conceptsWithYouTubeLink = youtubeLink ? analysisResult.concepts.map(concept => ({
        ...concept,
        videoResources: youtubeLink
      })) : analysisResult.concepts
      
      const response = await fetch("/api/saveAnalysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: { ...analysisResult, concepts: conceptsWithYouTubeLink },
          customApiKey: customApiKey,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to save analysis.")
      }

      toast({
        title: "Success!",
        description: "Your analysis has been saved.",
      })
      
      // Simple redirect to concepts page
      window.location.href = '/concepts'
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

  const handleCategoryUpdate = async (conceptId: string, newCategory: string) => {
    if (!analysisResult) return;

    const conceptToUpdate = analysisResult.concepts.find(c => c.id === conceptId);
    if (!conceptToUpdate) return;

    // UI-only Update: This is an unsaved analysis, so we just update the local state.
    // The correct category will be saved when the user clicks "Save Analysis".
    const updatedConcepts = analysisResult.concepts.map(c =>
      c.id === conceptId ? { ...c, category: newCategory } : c
    );
    setAnalysisResult({ ...analysisResult, concepts: updatedConcepts });

    toast({
      title: "Category Updated (Locally)",
      description: `Moved "${conceptToUpdate.title}" to ${newCategory}. This will be saved when you save the analysis.`,
    });
  };

  const handleAddConcept = () => {}
  const handleDeleteConcept = (conceptId: string) => {
    if (!analysisResult) return;

    const updatedConcepts = analysisResult.concepts.filter(c => c.id !== conceptId);
    
    setAnalysisResult({
      ...analysisResult,
      concepts: updatedConcepts,
    });

    // If the deleted concept was the selected one, deselect it
    if (selectedConcept?.id === conceptId) {
      setSelectedConcept(null);
    }

    toast({
      title: "Concept Removed",
      description: "The concept has been removed from this analysis session.",
    });
  };
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
  const handleYouTubeLinkAdd = (link: string) => {
    setYoutubeLink(link)
    setShowYouTubeLinkPrompt(false)
    toast({
      title: "YouTube Link Added",
      description: "Video resource will be included with your concepts.",
    })
  }
  const handleYouTubeLinkSkip = () => setShowYouTubeLinkPrompt(false)

  const handleCategoryEdit = (concept: Concept) => {
    // Now gets categories directly from local file
    const categories = getStructuredCategories();
    setStructuredCategories(categories);
    setEditingConcept(concept)
    setShowCategoryDialog(true)
  }

  const handleCategoryDialogClose = async () => {
    setShowCategoryDialog(false)
    setEditingConcept(null)
  }

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
    youtubeLink,
    learningJourneyAnalysis,
    isAnalyzingLearningJourney,
    analysisMode,
    showCategoryDialog,
    editingConcept,
    structuredCategories,
    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setShowAddConceptCard,
    setEditConceptMode,
    setAnalysisResult,
    setAnalysisMode,
    // Handlers
    handleAnalyze,
    handleSaveAnalysis,
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,
    handleUserInfoProvided,
    handleUserInfoModalClose,
    handleYouTubeLinkAdd,
    handleYouTubeLinkSkip,
    handleCategoryEdit,
    handleCategoryDialogClose,
    handleCategoryUpdate,
    handleDeleteConcept,
    // Unused handlers from previous version (can be removed or implemented)
    handleAddConcept,
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