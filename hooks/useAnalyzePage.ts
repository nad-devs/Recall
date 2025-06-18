import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { 
  canMakeConversation, 
  needsApiKey, 
  incrementConversationCount, 
  getUsageData,
  getRemainingConversations 
} from "@/lib/usage-tracker"
import { 
  ConversationAnalysis, 
  Concept 
} from '@/lib/types/conversation'
import { 
  mapBackendResponseToAnalysis, 
  generateTitleFromConcepts
} from '@/lib/utils/conversation'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { getAuthHeaders, makeAuthenticatedRequest } from '@/lib/auth-utils'
import { isYouTubeTranscript } from '@/lib/utils/youtube-detector'

// Add interface for concept matching
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

export function useAnalyzePage() {
  const [conversationText, setConversationText] = useState("")
  const [analysisResult, setAnalysisResult] = useState<ConversationAnalysis | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editCategoryValue, setEditCategoryValue] = useState("")
  const [isAddingConcept, setIsAddingConcept] = useState(false)
  const [showAddConceptCard, setShowAddConceptCard] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [selectedTab, setSelectedTab] = useState("summary")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editConceptMode, setEditConceptMode] = useState(false)
  const [editConceptTitle, setEditConceptTitle] = useState("")
  const [editConceptCategory, setEditConceptCategory] = useState("")
  const [existingConcepts, setExistingConcepts] = useState<any[]>([])
  const [showConceptConfirmation, setShowConceptConfirmation] = useState(false)
  const [originalSaveData, setOriginalSaveData] = useState<any>(null)
  const [discoveredConcepts, setDiscoveredConcepts] = useState<string[]>([])
  const [analysisStage, setAnalysisStage] = useState<string>("Initializing...")
  const [loadingConcepts, setLoadingConcepts] = useState<string[]>([])

  // Add new state for concept matching feature
  const [conceptMatches, setConceptMatches] = useState<ConceptMatch[]>([])
  const [showConceptMatchDialog, setShowConceptMatchDialog] = useState(false)
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<ConversationAnalysis | null>(null)
  const [isProcessingMatches, setIsProcessingMatches] = useState(false)
  
  // Add new state for conversation save dialog
  const [showConversationSaveDialog, setShowConversationSaveDialog] = useState(false)
  const [updatedConceptsCount, setUpdatedConceptsCount] = useState(0)

  // Add state for API key modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [usageData, setUsageData] = useState(getUsageData())

  // Add state for user info modal
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  
  // Add state to track the last updated concept for navigation
  const [lastUpdatedConceptId, setLastUpdatedConceptId] = useState<string | null>(null)

  // Add YouTube transcript detection state
  const [showYouTubeLinkPrompt, setShowYouTubeLinkPrompt] = useState(false)
  const [youtubeLink, setYoutubeLink] = useState<string>("")

  const { toast } = useToast()

  // Update usage data when component mounts
  useEffect(() => {
    setUsageData(getUsageData())
  }, [])

  // Function to check for existing concepts
  const checkForExistingConcepts = async (concepts: Concept[]): Promise<ConceptMatch[]> => {
    try {
      console.log('🔍 checkForExistingConcepts - Starting check')
      console.log(`🔍 Number of concepts to check: ${concepts.length}`)
      
      // Log the concepts we're checking
      concepts.forEach((concept, index) => {
        console.log(`🔍 Concept ${index+1}: "${concept.title}" (category: ${concept.category || 'unknown'})`)
      })
      
      // Try to make the request - use regular fetch instead of makeAuthenticatedRequest
      // since this should work for all users (authenticated or not)
      const response = await fetch('/api/concepts/check-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth headers if available, but don't require them
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          concepts: concepts.map(c => ({
            title: c.title,
            summary: c.summary,
            category: c.category,
            keyPoints: c.keyPoints,
            details: c.details,
            examples: c.examples,
            codeSnippets: c.codeSnippets,
            relatedConcepts: c.relatedConcepts
          }))
        }),
      })

      console.log(`🔍 API response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        console.error('🔍 Failed to check existing concepts:', response.status, response.statusText)
        // Try to get error details from response
        try {
          const errorData = await response.text()
          console.error('🔍 Error details:', errorData)
        } catch (e) {
          console.error('🔍 Could not read error details')
        }
        // Return empty array instead of throwing - this allows the save to continue
        return []
      }

      const data = await response.json()
      console.log('🔍 Check Existing Concepts - API response:', data)
      console.log('🔍 Found matches:', data.matches?.length || 0)
      
      if (data.matches && data.matches.length > 0) {
        // Print details about each match
        data.matches.forEach((match: ConceptMatch, index: number) => {
          console.log(`🔍 Match ${index+1}: "${match.newConcept.title}" → "${match.existingConcept.title}" (${match.existingConcept.id})`)
        })
        
        // Filter matches to only show ones that haven't been overused
        // Skip dialog if the concept has been linked to more than 3 conversations recently
        const filteredMatches = await Promise.all(
          data.matches.map(async (match: ConceptMatch) => {
            try {
              // Check how many conversations this concept is linked to
              const conversationCheckResponse = await fetch(`/api/concepts/${match.existingConcept.id}/conversations`, {
                headers: getAuthHeaders()
              })
              
              if (conversationCheckResponse.ok) {
                const conversationData = await conversationCheckResponse.json()
                const conversationCount = conversationData.conversations?.length || 0
                
                console.log(`🔍 Concept "${match.existingConcept.title}" linked to ${conversationCount} conversations`)
                
                // Only show dialog for concepts linked to 2 or fewer conversations
                // This prevents spam for commonly discussed topics
                if (conversationCount <= 2) {
                  return match
                } else {
                  console.log(`🔍 Skipping dialog for "${match.existingConcept.title}" - too many conversations (${conversationCount})`)
                  return null
                }
              }
              
              // If we can't check, default to showing the dialog
              return match
            } catch (error) {
              console.error(`🔍 Error checking conversations for concept ${match.existingConcept.id}:`, error)
              // Default to showing dialog if check fails
              return match
            }
          })
        )
        
        // Remove null values
        const validMatches = filteredMatches.filter(Boolean) as ConceptMatch[]
        
        console.log(`🔍 After filtering: ${validMatches.length} matches will show dialog`)
        
        return validMatches
      } else {
        console.log('🔍 No matches found in API response')
      }
      
      return data.matches || []
    } catch (error) {
      console.error('🔍 Error checking existing concepts:', error)
      // Return empty array to allow save to continue even if check fails
      return []
    }
  }

  // Handle concept match decisions
  const handleConceptMatchDecision = async (matchIndex: number, shouldUpdate: boolean) => {
    if (!conceptMatches[matchIndex]) return

    setIsProcessingMatches(true)

    try {
      const match = conceptMatches[matchIndex]
      
      if (shouldUpdate) {
        // Update the existing concept with new information
        console.log("🔄 About to update existing concept:", match.existingConcept.id)
        console.log("🔄 New concept data being sent:", {
          title: match.newConcept.title,
          summary: match.newConcept.summary,
          category: match.newConcept.category,
          keyPoints: match.newConcept.keyPoints,
          details: match.newConcept.details,
          examples: match.newConcept.examples,
          codeSnippets: match.newConcept.codeSnippets,
          relatedConcepts: match.newConcept.relatedConcepts,
        })
        
        const updatePayload = {
          title: match.newConcept.title,
          summary: match.newConcept.summary,
          category: match.newConcept.category,
          // Convert arrays and objects to JSON strings as API expects
          keyPoints: Array.isArray(match.newConcept.keyPoints) 
            ? JSON.stringify(match.newConcept.keyPoints) 
            : match.newConcept.keyPoints,
          details: typeof match.newConcept.details === 'object' 
            ? JSON.stringify(match.newConcept.details) 
            : match.newConcept.details,
          examples: Array.isArray(match.newConcept.examples) 
            ? JSON.stringify(match.newConcept.examples) 
            : match.newConcept.examples,
          codeSnippets: Array.isArray(match.newConcept.codeSnippets) 
            ? JSON.stringify(match.newConcept.codeSnippets) 
            : match.newConcept.codeSnippets,
          relatedConcepts: Array.isArray(match.newConcept.relatedConcepts) 
            ? JSON.stringify(match.newConcept.relatedConcepts) 
            : match.newConcept.relatedConcepts,
          // Ensure we don't preserve enhancements - we want full update
          preserveEnhancements: false
        }
        
        console.log("🔄 Updating existing concept with ALL fields (JSON stringified):")
        console.log("🔄 - Title:", updatePayload.title)
        console.log("🔄 - Summary:", updatePayload.summary)
        console.log("🔄 - Category:", updatePayload.category)
        console.log("🔄 - KeyPoints (JSON):", typeof updatePayload.keyPoints, updatePayload.keyPoints?.length || 0, "chars")
        console.log("🔄 - Details (JSON):", typeof updatePayload.details, updatePayload.details ? "✅ Present" : "❌ Missing")
        console.log("🔄 - Examples (JSON):", typeof updatePayload.examples, updatePayload.examples?.length || 0, "chars")
        console.log("🔄 - CodeSnippets (JSON):", typeof updatePayload.codeSnippets, updatePayload.codeSnippets?.length || 0, "chars")
        console.log("🔄 - RelatedConcepts (JSON):", typeof updatePayload.relatedConcepts, updatePayload.relatedConcepts?.length || 0, "chars")
        
        const updateResponse = await makeAuthenticatedRequest(`/api/concepts/${match.existingConcept.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        })

        console.log("🔄 Update response status:", updateResponse.status)
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error("🔄 Update failed with error:", errorText)
          throw new Error('Failed to update existing concept')
        }
        
        const updateResult = await updateResponse.json()
        console.log("🔄 Update result:", updateResult)

        toast({
          title: "Concept Updated",
          description: `"${match.existingConcept.title}" has been updated with new information`,
          duration: 4000,
        })
        
        // Track the updated concept ID for navigation
        setLastUpdatedConceptId(match.existingConcept.id)
      } else {
        toast({
          title: "Concept Linked",
          description: `"${match.existingConcept.title}" will be linked to this conversation`,
          duration: 4000,
        })
        
        // Track the concept ID for navigation (even when keeping as is)
        setLastUpdatedConceptId(match.existingConcept.id)
      }

      // Link the existing concept to the current conversation regardless of update decision
      await linkExistingConceptToConversation(match.existingConcept.id)

      // Update the new concept in our analysis result to include bidirectional relationship
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.map(concept => {
          if (concept.title === match.newConcept.title) {
            // Add the existing concept to the new concept's related concepts if not already there
            const existingRelatedConcepts = concept.relatedConcepts || []
            const existingConceptTitle = match.existingConcept.title
            
            if (!existingRelatedConcepts.includes(existingConceptTitle)) {
              return {
                ...concept,
                relatedConcepts: [...existingRelatedConcepts, existingConceptTitle]
              }
            }
          }
          return concept
        })
        
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        })
      }

      // Remove this match from the list
      const updatedMatches = conceptMatches.filter((_, index) => index !== matchIndex)
      setConceptMatches(updatedMatches)

      // If no more matches, proceed with saving the conversation
      if (updatedMatches.length === 0) {
        await finalizeSaveWithMatches()
      }
    } catch (error) {
      console.error('Error processing concept match:', error)
      toast({
        title: "Error",
        description: "Failed to process concept match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingMatches(false)
    }
  }

  // Link existing concept to current conversation
  const linkExistingConceptToConversation = async (conceptId: string) => {
    // This will be handled when we save the conversation
    // For now, we'll store the concept ID to link later
    console.log(`Will link concept ${conceptId} to conversation when saved`)
  }

  // Finalize save after processing all matches
  const finalizeSaveWithMatches = async () => {
    // Clean up the concept match dialog
    setShowConceptMatchDialog(false)
    
    // Count how many concepts were processed
    const processedCount = conceptMatches.length
    setConceptMatches([])

    // Show success message and go directly to concepts page
    toast({
      title: "Concepts Updated Successfully!",
      description: `${processedCount} concept${processedCount !== 1 ? 's have' : ' has'} been updated with new information`,
      duration: 4000,
    })

    // Auto-refresh concepts before redirecting
    console.log('🔄 Auto-refreshing concepts before redirect...')
    window.dispatchEvent(new CustomEvent('refreshConcepts'))
    
    // Redirect to concepts page after a short delay to allow refresh
    setTimeout(() => {
      // If we have an updated concept ID, go to that specific concept
      if (lastUpdatedConceptId) {
        window.location.href = `/concept/${lastUpdatedConceptId}`
      } else {
        window.location.href = '/concepts'
      }
    }, 1000)
  }

  // Handle conversation save decision
  const handleSaveConversationDecision = async () => {
    setShowConversationSaveDialog(false)
    await performSaveConversation()
    
    // Auto-refresh concepts after saving
    setTimeout(() => {
      console.log('🔄 Auto-refreshing concepts after save...')
      window.dispatchEvent(new CustomEvent('refreshConcepts'))
    }, 1000)
  }

  // Handle skip saving decision
  const handleSkipSavingDecision = () => {
    setShowConversationSaveDialog(false)
    
    toast({
      title: "Concepts Updated",
      description: `${updatedConceptsCount} concept${updatedConceptsCount !== 1 ? 's have' : ' has'} been updated successfully!`,
      duration: 4000,
    })

    // Auto-refresh concepts before redirecting
    console.log('🔄 Auto-refreshing concepts before redirect...')
    window.dispatchEvent(new CustomEvent('refreshConcepts'))
    
    // Redirect to concepts page after a short delay to allow refresh
    setTimeout(() => {
      window.location.href = '/concepts'
    }, 500)
  }

  // Use auto-analysis hook
  const { startAutoAnalysis, linkConceptsAfterAnalysis } = useAutoAnalysis({
    setConversationText,
    setIsAnalyzing,
    setShowAnimation,
    setAnalysisResult,
    setSelectedConcept,
    setSelectedTab,
    setDiscoveredConcepts,
    setAnalysisStage,
    analysisResult
  })

  // Initialize edit form when edit mode is activated
  useEffect(() => {
    if (selectedConcept && editConceptMode) {
      setEditConceptTitle(selectedConcept.title)
      setEditConceptCategory(selectedConcept.category)
    }
  }, [selectedConcept, editConceptMode])

  // Filter concepts based on search query
  const filteredConcepts =
    analysisResult?.concepts.filter(
      (concept) =>
        searchQuery === "" ||
        concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.summary.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  // Handle category updates
  const handleCategoryUpdate = async (rawValue: string) => {
    const newCategory = rawValue.trim()
    
    if (!selectedConcept) return
    
    try {
      setIsSaving(true)
      
      // Check authentication before proceeding
      const userEmail = localStorage.getItem('userEmail');
      const userId = localStorage.getItem('userId');
      
      if (!userEmail || !userId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update categories. Your information will be saved in the browser.",
          variant: "destructive",
          duration: 5000,
        });
        
        setShowUserInfoModal(true);
        setIsSaving(false);
        return;
      }
      
      // Update local state immediately for UI responsiveness
      const updatedConcept = {
        ...selectedConcept,
        category: newCategory
      }
      
      setSelectedConcept(updatedConcept)
      
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.map(concept =>
          concept.id === selectedConcept.id
            ? updatedConcept
            : concept
        )
        
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        })
      }
      
      // If this is a temporary concept (starts with 'temp-'), just update local state
      if (selectedConcept.id.startsWith('temp-')) {
        setIsEditingCategory(false)
        toast({
          title: "Category Updated",
          description: `Category changed to "${newCategory}" (will be saved when conversation is saved)`,
          duration: 2000,
        })
        setIsSaving(false);
        return
      }
      
      // For real concepts, save to database immediately
      console.log(`Updating category for concept ${selectedConcept.id} to "${newCategory}"`);
      
      const response = await makeAuthenticatedRequest(`/api/concepts/${selectedConcept.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          category: newCategory
        })
      })
      
      if (!response.ok) {
        // Check for specific error types
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to update categories.",
            variant: "destructive",
            duration: 5000,
          });
          
          setShowUserInfoModal(true);
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      // Update was successful
      setIsEditingCategory(false)
      
      // Show success toast
      toast({
        title: "Category Updated",
        description: `Category changed to "${newCategory}" and saved to database`,
        duration: 2000,
      })
    } catch (error) {
      console.error('Error updating category:', error)
      
      // Revert local state on error
      if (analysisResult) {
        const revertedConcepts = analysisResult.concepts.map(concept =>
          concept.id === selectedConcept.id
            ? selectedConcept // Revert to original
            : concept
        )
        
        setAnalysisResult({
          ...analysisResult,
          concepts: revertedConcepts
        })
        
        // Also revert selected concept
        setSelectedConcept(selectedConcept);
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
      setIsEditingCategory(false)
    }
  }

  // Handle analysis
  const handleAnalyze = async () => {
    if (!conversationText.trim()) return

    // Check if user can make a conversation before starting analysis
    if (!canMakeConversation()) {
      console.log("🚫 User has reached free conversation limit, showing API key modal")
      setShowApiKeyModal(true)
      return
    }

    setIsAnalyzing(true)
    setShowAnimation(true)
    
    // Clear any previous analysis results and discovered concepts
    setAnalysisResult(null)
    setSelectedConcept(null)
    setDiscoveredConcepts([])
    setAnalysisStage("Initializing analysis...")

    try {
      console.log("Sending conversation to extraction service...")
      
      // Get custom API key if user has one
      const currentUsageData = getUsageData()
      
      // Get user ID for personalized analysis
      const userId = localStorage.getItem('userId')
      
      const response = await makeAuthenticatedRequest('/api/extract-concepts', {
        method: 'POST',
        body: JSON.stringify({ 
          conversation_text: conversationText,
          customApiKey: currentUsageData.customApiKey,
          user_id: userId // Add user ID for personalized insights
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if this is a usage limit error
        if (response.status === 403 && data.requiresApiKey) {
          console.log("🚫 Server-side usage limit reached, showing API key modal")
          setShowApiKeyModal(true)
          setIsAnalyzing(false)
          setShowAnimation(false)
          setAnalysisResult(null)
          setSelectedConcept(null)
          setDiscoveredConcepts([])
          setAnalysisStage("Initializing...")
          return
        }
        
        // Check for authentication errors
        if (response.status === 401) {
          console.log("🚫 Authentication failed during analysis")
          
          // Check if user has OAuth session but localStorage might not be ready
          const userEmail = localStorage.getItem('userEmail')
          const userId = localStorage.getItem('userId')
          
          if (userEmail && userId) {
            // User has auth data, this might be a temporary server-side issue
            toast({
              title: "Authentication Issue",
              description: "There was a temporary authentication issue. Please try again in a moment.",
              variant: "destructive",
              duration: 5000,
            })
          } else {
            // No auth data, user needs to sign in
            toast({
              title: "Authentication Required",
              description: "Please sign in to analyze conversations. Redirecting to sign in page...",
              variant: "destructive",
              duration: 5000,
            })
            
            // Only redirect if there's truly no auth data
            setTimeout(() => {
              window.location.href = '/'
            }, 3000)
          }
          
          setIsAnalyzing(false)
          setShowAnimation(false)
          setAnalysisResult(null)
          setSelectedConcept(null)
          setDiscoveredConcepts([])
          setAnalysisStage("Initializing...")
          return
        }
        
        const errorMessage = data.error || 'Something went wrong during analysis'
        toast({
          title: "Analysis failed",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("Analysis failed:", errorMessage)
        setIsAnalyzing(false)
        setShowAnimation(false)
        setAnalysisResult(null)
        setSelectedConcept(null)
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
      
      // Proceed normally - concept matching will happen during save
      setAnalysisResult(analysis)
      
      // NEW: Analyze relationships using embeddings right after extraction
      if (analysis.concepts.length > 0) {
        try {
          console.log("🔗 Starting embedding-based relationship analysis...")
          setAnalysisStage("Analyzing concept relationships...")
          
          const relationshipResponse = await fetch('/api/concepts/analyze-relationships', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              concepts: analysis.concepts.map(concept => ({
                title: concept.title,
                summary: concept.summary,
                details: concept.details,
                keyPoints: concept.keyPoints,
                category: concept.category
              }))
            })
          })
          
          if (relationshipResponse.ok) {
            const relationshipData = await relationshipResponse.json()
            console.log("🔗 Relationship analysis completed:", relationshipData)
            
            // Enhance the analysis result with relationship data
            const enhancedAnalysis = {
              ...analysis,
              concepts: analysis.concepts.map((concept, index) => ({
                ...concept,
                // Add the relationship data from our embedding analysis
                embeddingData: relationshipData.results?.[index] || null
              }))
            }
            
            setAnalysisResult(enhancedAnalysis)
            console.log("🔗 Enhanced analysis with relationship data")
          } else {
            console.warn("🔗 Relationship analysis failed, continuing without enhancement")
          }
        } catch (error) {
          console.error("🔗 Error during relationship analysis:", error)
          // Continue without relationship data if this fails
        }
        
        setSelectedConcept(analysis.concepts[0])
        setSelectedTab("summary")
        setDiscoveredConcepts(analysis.concepts.map((c: any) => c.title))
      }

      // Check if this was a YouTube transcript and show prompt after analysis
      if (isYouTubeTranscript(conversationText)) {
        console.log("🎥 YouTube transcript detected, showing link prompt")
        setShowYouTubeLinkPrompt(true)
      }

      console.log("Analysis completed successfully")
      // Set analysis states for smooth transition - but keep discovered concepts
      setIsAnalyzing(false)
      setShowAnimation(false)
      // Don't clear discoveredConcepts here - they should show the final results
      setAnalysisStage("Analysis complete")
    } catch (error) {
      console.error('Error during analysis:', error)
      toast({
        title: "Analysis failed",
        description: "An error occurred while analyzing the conversation. Please try again.",
        variant: "destructive",
      })
      // Reset to initial state when analysis fails
      setIsAnalyzing(false)
      setShowAnimation(false)
      setAnalysisResult(null)
      setSelectedConcept(null)
      setDiscoveredConcepts([])
      setAnalysisStage("Initializing...")
    }
  }

  // Handle save conversation
  const handleSaveConversation = async () => {
    if (!analysisResult) return

    // Check if we have user info in localStorage
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')
    
    console.log("💾 handleSaveConversation - Starting save process")
    console.log(`💾 User info check - userName: ${userName ? 'present' : 'missing'}, userEmail: ${userEmail ? 'present' : 'missing'}`)
    
    // If no user info, show the user info modal first
    if (!userName || !userEmail) {
      console.log("💾 User info missing - showing modal")
      setShowUserInfoModal(true)
      return
    }

    // Check if user can make a conversation before saving
    if (!canMakeConversation()) {
      console.log("🚫 User has reached free conversation limit, showing API key modal")
      setShowApiKeyModal(true)
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // First, check for existing concepts before saving
      console.log("💾 Checking for existing concepts before saving...")
      console.log(`💾 Number of concepts to check: ${analysisResult.concepts.length}`)
      
      // Log concept titles we're checking
      const conceptTitles = analysisResult.concepts.map(c => c.title).join(', ')
      console.log(`💾 Concepts being checked: ${conceptTitles}`)
      
      // If concept contains "anagram", force a test match check
      const hasAnagramConcept = analysisResult.concepts.some(c => 
        c.title.toLowerCase().includes('anagram')
      )
      
      if (hasAnagramConcept) {
        console.log("💾 DEBUG: Found anagram concept, will check for potential matches")
      }
      
      const matches = await checkForExistingConcepts(analysisResult.concepts)
      
      console.log(`💾 Check complete - Found ${matches.length} concept matches`)
      
      if (matches.length > 0) {
        // Found matches - show confirmation dialog
        console.log(`💾 Found ${matches.length} concept matches, showing dialog`)
        console.log(`💾 Match details: ${matches.map(m => `${m.newConcept.title} → ${m.existingConcept.title}`).join(', ')}`)
        console.log("💾 Setting conceptMatches state:", matches)
        setConceptMatches(matches)
        console.log("💾 Setting showConceptMatchDialog to true")
        setShowConceptMatchDialog(true)
        console.log("💾 Setting isSaving to false")
        setIsSaving(false)
        return
      } else {
        console.log(`💾 No concept matches found, proceeding to save`)
      }
      
      // If no matches, proceed with saving
      await performSaveConversation()
    } catch (error) {
      console.error('Error saving conversation:', error)
      setSaveError('Failed to save conversation. Please try again.')
      setIsSaving(false)
    }
  }

  // Handle user info provided
  const handleUserInfoProvided = async (userInfo: { name: string; email: string }) => {
    setShowUserInfoModal(false)
    
    toast({
      title: "User Info Saved",
      description: "Now saving your conversation...",
      duration: 2000,
    })
    
    // Now proceed with saving the conversation
    await handleSaveConversation()
  }

  // Handle user info modal close
  const handleUserInfoModalClose = () => {
    setShowUserInfoModal(false)
  }

  // Perform the actual save operation
  const performSaveConversation = async () => {
    if (!analysisResult) return
    
    try {
      console.log("💾 performSaveConversation - Starting API call")
      
      // Get user info from localStorage if available (for non-authenticated users)
      const userName = localStorage.getItem('userName')
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      // Add YouTube link to concepts if available
      const conceptsWithYouTubeLink = youtubeLink ? analysisResult.concepts.map(concept => ({
        ...concept,
        videoResources: youtubeLink
      })) : analysisResult.concepts
      
      const response = await makeAuthenticatedRequest('/api/saveConversation', {
        method: 'POST',
        body: JSON.stringify({
          conversation_text: conversationText,
          analysis: {
            ...analysisResult,
            concepts: conceptsWithYouTubeLink,
            conversation_title: analysisResult.conversationTitle || generateTitleFromConcepts(analysisResult.concepts),
            conversation_summary: analysisResult.overallSummary
          },
          customApiKey: getUsageData().customApiKey,
          // Include user info for non-authenticated saves
          userInfo: userName && userEmail ? {
            name: userName,
            email: userEmail,
            id: userId
          } : null
        }),
      })

      const data = await response.json()
      console.log("💾 saveConversation API response:", data)
      
      if (data.requiresConfirmation) {
        console.log("💾 API found duplicate concepts, showing confirmation dialog")
        console.log(`💾 Found ${data.existingConcepts?.length || 0} existing concepts from API`)
        
        if (data.existingConcepts && data.existingConcepts.length > 0) {
          setConceptMatches(data.existingConcepts)
          setShowConceptMatchDialog(true)
          setOriginalSaveData(data.originalData)
          setIsSaving(false)
          return
        }
      }
      
      if (data.success) {
        console.log("💾 Save successful")
        // Only increment conversation count if user has usage tracking
        if (canMakeConversation() || getUsageData().hasCustomApiKey) {
          const updatedUsageData = incrementConversationCount()
          setUsageData(updatedUsageData)
        }
        
        toast({
          title: "Success",
          description: data.message || "Conversation saved successfully",
          duration: 3000,
        })
        
        if (data.redirectTo) {
          window.location.href = data.redirectTo
        } else {
          window.location.href = '/concepts'
        }
      } else {
        setSaveError(data.error || 'Failed to save conversation properly.')
        console.error('Save response indicates failure:', data)
      }
    } catch (error) {
      setSaveError('Failed to save conversation. Please try again.')
      console.error('Error saving conversation:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle add concept to current analysis (without creating new conversation)
  const addConceptToCurrentAnalysis = async (title: string, originalConcept?: Concept) => {
    try {
      setIsAddingConcept(true)
      setLoadingConcepts(prev => [...prev, title])
      
      // Check authentication before proceeding
      const userEmail = localStorage.getItem('userEmail');
      const userId = localStorage.getItem('userId');
      
      if (!userEmail || !userId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add concepts. Your information will be saved in the browser.",
          variant: "destructive",
          duration: 5000,
        });
        
        setShowUserInfoModal(true);
        setIsAddingConcept(false);
        setLoadingConcepts(prev => prev.filter(t => t !== title));
        throw new Error('Authentication required');
      }
      
      console.log("Making authenticated request to extract concept:", title);
      console.log("Auth headers:", getAuthHeaders());
      
      // Generate AI content for the concept
      const response = await makeAuthenticatedRequest('/api/extract-concepts', {
        method: 'POST',
        body: JSON.stringify({ 
          conversation_text: `Please explain and provide details about the concept: ${title}\n\nInclude:\n- What it is and how it works\n- Key principles and components\n- Implementation details and examples\n- Use cases and applications\n- Related concepts and technologies\n- Code examples if applicable`
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to add concepts. Your information will be saved in the browser.",
            variant: "destructive",
            duration: 5000,
          });
          
          setShowUserInfoModal(true);
          throw new Error('Authentication required');
        }
        throw new Error('Failed to generate concept content')
      }

      const data = await response.json()
      
      // Extract the concept from the response
      const generatedConcept = data.concepts?.[0]
      if (!generatedConcept) {
        throw new Error('No concept generated')
      }
      
      const newConcept: Concept = {
        id: `temp-${Math.random().toString(36).substring(2, 9)}`,
        title: generatedConcept.title || title,
        category: generatedConcept.category || "General",
        summary: generatedConcept.summary || `Generated concept for ${title}`,
        details: generatedConcept.details || {
          implementation: `Details about ${title}`,
          complexity: {},
          useCases: [],
          edgeCases: [],
          performance: "",
          interviewQuestions: [],
          practiceProblems: [],
          furtherReading: []
        },
        keyPoints: generatedConcept.keyPoints || [`Key concepts related to ${title}`],
        examples: generatedConcept.examples || [],
        codeSnippets: generatedConcept.codeSnippets || [],
        relatedConcepts: generatedConcept.relatedConcepts || [],
        // Add needsReview field for concepts created via Connect feature
        needsReview: true,
        confidenceScore: 0.5 // Low confidence score to indicate it needs review
      }
      
      // If we have an original concept, create bidirectional relationship
      if (originalConcept) {
        // Add the original concept to the new concept's related concepts if not already there
        if (!newConcept.relatedConcepts.includes(originalConcept.title)) {
          newConcept.relatedConcepts.push(originalConcept.title)
        }
        
        // Add the new concept to the original concept's related concepts if not already there
        if (!originalConcept.relatedConcepts.includes(newConcept.title)) {
          originalConcept.relatedConcepts.push(newConcept.title)
        }
      }
      
      // Add to current analysis
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.map(c => 
          c.id === originalConcept?.id ? originalConcept : c
        )
        
        setAnalysisResult({
          ...analysisResult,
          concepts: [...updatedConcepts, newConcept]
        })
      }
      
      setSelectedConcept(newConcept)
      setShowAddConceptCard(false)
      
      // Show success toast with linking information
      if (originalConcept) {
        toast({
          title: "Concept Added & Linked",
          description: `"${newConcept.title}" has been added and linked to "${originalConcept.title}"`,
          duration: 4000,
        })
      } else {
        toast({
          title: "Concept Added",
          description: `"${newConcept.title}" has been added to your analysis`,
          duration: 4000,
        })
      }
      
      // Auto-refresh concepts after creation
      setTimeout(() => {
        console.log('🔄 Auto-refreshing concepts after concept creation...')
        window.dispatchEvent(new CustomEvent('refreshConcepts'))
      }, 500)
      
      return newConcept
    } catch (error) {
      console.error('Error adding concept to analysis:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add concept. Please check your authentication and try again.",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    } finally {
      setIsAddingConcept(false)
      setLoadingConcepts(prev => prev.filter(t => t !== title))
    }
  }

  // Handle add concept (original function - creates new conversation)
  const handleAddConcept = async (title: string) => {
    try {
      setIsAddingConcept(true)
      
      // Check authentication
      const userEmail = localStorage.getItem('userEmail');
      const userId = localStorage.getItem('userId');
      
      if (!userEmail || !userId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add concepts. Your information will be saved in the browser.",
          variant: "destructive",
          duration: 5000,
        });
        
        setShowUserInfoModal(true);
        return;
      }
      
      // Add the concept title to loading state immediately for UI feedback
      setLoadingConcepts(prev => [...prev, title])
      
      // Step 1: Use the backend extraction API to generate a proper concept with auto-categorization
      console.log("🤖 Generating concept content using backend extraction API...")
      
      // Create a conversation-like text for the extraction API
      const extractionPrompt = conversationText 
        ? `Context from conversation:\n\n${conversationText}\n\nPlease explain the concept: ${title} in detail. Include implementation details, use cases, complexity analysis, and code examples if applicable.`
        : `Please explain the concept: ${title} in detail. Include implementation details, use cases, complexity analysis, and code examples if applicable.`
      
      // Call the extraction API to generate proper concept content
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://recall-p3vg.onrender.com'
      let extractionResponse
      
      try {
        console.log("🌐 Attempting HTTPS connection to extraction API...")
        extractionResponse = await fetch(`${backendUrl}/api/v1/extract-concepts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            conversation_text: extractionPrompt,
            context: {
              source: 'manual_concept_creation',
              title: title,
              existingConversation: conversationText || null
            }
          }),
        })
      } catch (sslError) {
        console.log("🔄 HTTPS failed, trying HTTP fallback...", sslError instanceof Error ? sslError.message : 'SSL connection failed')
        const httpUrl = backendUrl.replace('https://', 'http://')
        extractionResponse = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            conversation_text: extractionPrompt,
            context: {
              source: 'manual_concept_creation',
              title: title,
              existingConversation: conversationText || null
            }
          }),
        })
      }
      
      if (!extractionResponse.ok) {
        throw new Error(`Backend extraction failed: ${extractionResponse.status} ${extractionResponse.statusText}`)
      }
      
      const extractionData = await extractionResponse.json()
      console.log("✅ Backend extraction completed:", extractionData)
      
      // Get the generated concept (prefer the one matching our title, or use the first one)
      let generatedConcept = null
      if (extractionData.concepts && extractionData.concepts.length > 0) {
        // Try to find a concept with matching or similar title
        generatedConcept = extractionData.concepts.find((c: any) => 
          c.title.toLowerCase().includes(title.toLowerCase()) || 
          title.toLowerCase().includes(c.title.toLowerCase())
        ) || extractionData.concepts[0]
      }
      
      if (!generatedConcept) {
        throw new Error("Backend extraction didn't generate any concepts")
      }
      
      console.log("🎯 Using generated concept:", generatedConcept.title, "with category:", generatedConcept.category)
      
      // Step 2: Save/create conversation if we have analysis results
      let conversationId = null
      
      if (analysisResult) {
        console.log("💾 Saving conversation for concept context...")
        const saveResponse = await makeAuthenticatedRequest('/api/saveConversation', {
          method: 'POST',
          body: JSON.stringify({
            conversation_text: conversationText,
            analysis: {
              ...analysisResult,
              conversation_title: analysisResult.conversationTitle || generateTitleFromConcepts(analysisResult.concepts),
              conversation_summary: analysisResult.overallSummary
            }
          }),
        })
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json()
          if (saveData.success && saveData.conversationId) {
            conversationId = saveData.conversationId
            console.log("✅ Created/retrieved conversation ID:", conversationId)
          }
        } else {
          console.error("❌ Failed to save conversation:", saveResponse.status, saveResponse.statusText);
          if (saveResponse.status === 401) {
            toast({
              title: "Authentication Error", 
              description: "Please sign in to add concepts.",
              variant: "destructive",
              duration: 5000,
            });
            setShowUserInfoModal(true);
            return;
          }
        }
      }
      
      // Step 3: Create the concept in the database with the generated content
      console.log("💾 Creating concept in database with generated content...")
      
      const response = await makeAuthenticatedRequest('/api/concepts', {
        method: 'POST',
        body: JSON.stringify({ 
          title: generatedConcept.title, // Use the title from generated concept (might be refined)
          summary: generatedConcept.summary || "",
          details: generatedConcept.details || "",
          keyPoints: generatedConcept.keyPoints || [],
          category: generatedConcept.category || "General",
          examples: generatedConcept.examples || [],
          codeSnippets: generatedConcept.codeSnippets || [],
          relatedConcepts: generatedConcept.relatedConcepts || [],
          context: conversationText,
          conversationId: conversationId,
          isAIGenerated: true, // Flag to indicate this was generated by AI
          bypassSimilarityCheck: true // Since we already have complete content, don't re-generate
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to add concepts. Your information will be saved in the browser.",
            variant: "destructive",
            duration: 5000,
          });
          
          setShowUserInfoModal(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to create concept')
      }

      const data = await response.json()
      console.log("✅ Concept created successfully:", data.concept.id)
      
      // Step 4: Create the concept object for the UI
      const newConcept: Concept = {
        id: data.concept.id,
        title: data.concept.title,
        category: data.concept.category || "General",
        summary: data.concept.summary || "",
        details: data.concept.details ? 
          (typeof data.concept.details === 'string' ? 
            JSON.parse(data.concept.details) : 
            data.concept.details) : 
          {
            implementation: "",
            complexity: {},
            useCases: [],
            edgeCases: [],
            performance: "",
            interviewQuestions: [],
            practiceProblems: [],
            furtherReading: []
          },
        keyPoints: data.concept.keyPoints ? 
          (typeof data.concept.keyPoints === 'string' ? 
            JSON.parse(data.concept.keyPoints) : 
            data.concept.keyPoints) : [],
        examples: data.concept.examples || [],
        codeSnippets: data.concept.codeSnippets || [],
        relatedConcepts: data.concept.relatedConcepts ? 
          (typeof data.concept.relatedConcepts === 'string' ? 
            JSON.parse(data.concept.relatedConcepts) : 
            data.concept.relatedConcepts) : [],
        confidenceScore: 0.9 // High confidence since it was AI-generated
      }
      
      // Step 5: Add to current analysis and update UI
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          concepts: [...analysisResult.concepts, newConcept]
        })
      }
      
      setSelectedConcept(newConcept)
      setShowAddConceptCard(false)
      
      toast({
        title: "Concept Created Successfully",
        description: `"${newConcept.title}" has been generated with AI and added to your knowledge base`,
        duration: 4000,
      })
      
      // Auto-refresh concepts after creation
      setTimeout(() => {
        console.log('🔄 Auto-refreshing concepts after AI concept creation...')
        window.dispatchEvent(new CustomEvent('refreshConcepts'))
      }, 500)
      
      return newConcept
    } catch (error) {
      console.error('❌ Error adding concept:', error)
      toast({
        title: "Error Creating Concept",
        description: error instanceof Error ? error.message : "Failed to create concept. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      })
      throw error
    } finally {
      setIsAddingConcept(false)
      // Remove from loading state
      setLoadingConcepts(prev => prev.filter(loadingTitle => loadingTitle !== title))
    }
  }

  // Handle delete concept
  const handleDeleteConcept = async (conceptId: string) => {
    if (!conceptId) return

    if (conceptId.startsWith('temp-') || conceptId.startsWith('concept-')) {
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.filter(c => c.id !== conceptId)
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        })
        if (selectedConcept && selectedConcept.id === conceptId) {
          if (updatedConcepts.length > 0) {
            setSelectedConcept(updatedConcepts[0])
          } else {
            setSelectedConcept(null)
          }
        }
      }
      return
    }

    if (!window.confirm('Are you sure you want to delete this concept? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsDeleting(true)
      
      const response = await makeAuthenticatedRequest(`/api/concepts/${conceptId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Concept not found in database')
        }
        throw new Error('Failed to delete concept')
      }

      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.filter(c => c.id !== conceptId)
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        })
        
        if (selectedConcept && selectedConcept.id === conceptId) {
          if (updatedConcepts.length > 0) {
            setSelectedConcept(updatedConcepts[0])
          } else {
            setSelectedConcept(null)
          }
        }
      }
    } catch (error) {
      console.error('Error deleting concept:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete concept')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle delete code snippet
  const handleDeleteCodeSnippet = (conceptId: string, snippetIndex: number) => {
    setAnalysisResult(prevAnalysis => {
      if (!prevAnalysis) return prevAnalysis
      
      const updatedConcepts = prevAnalysis.concepts.map(concept => {
        if (concept.id === conceptId) {
          const updatedSnippets = concept.codeSnippets.filter((_, index) => index !== snippetIndex)
          return {
            ...concept,
            codeSnippets: updatedSnippets
          }
        }
        return concept
      })
      
      return {
        ...prevAnalysis,
        concepts: updatedConcepts
      }
    })
    
    if (selectedConcept?.id === conceptId) {
      setSelectedConcept(prev => {
        if (!prev) return prev
        
        const updatedSnippets = prev.codeSnippets.filter((_, index) => index !== snippetIndex)
        return {
          ...prev,
          codeSnippets: updatedSnippets
        }
      })
    }
  }

  // Handle confirm concept updates
  const handleConfirmConceptUpdates = async () => {
    if (!originalSaveData) return
    
    setIsSaving(true)
    setSaveError(null)
    
    try {
      const response = await makeAuthenticatedRequest('/api/saveConversation', {
        method: 'POST',
        body: JSON.stringify({
          ...originalSaveData,
          confirmUpdate: true,
          customApiKey: getUsageData().customApiKey
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Increment conversation count only on successful save
        const updatedUsageData = incrementConversationCount()
        setUsageData(updatedUsageData)
        
        toast({
          title: "Success",
          description: data.message || "Conversation saved successfully",
          duration: 3000,
        })
        
        if (data.redirectTo) {
          window.location.href = data.redirectTo
        } else {
          window.location.href = '/concepts'
        }
      } else {
        setSaveError(data.error || 'Failed to save conversation properly.')
        console.error('Save response indicates failure:', data)
      }
    } catch (error) {
      setSaveError('Failed to save conversation. Please try again.')
      console.error('Error saving conversation:', error)
    } finally {
      setIsSaving(false)
      setShowConceptConfirmation(false)
    }
  }

  // Handle cancel concept updates
  const handleCancelConceptUpdates = () => {
    setShowConceptConfirmation(false)
    setExistingConcepts([])
    setOriginalSaveData(null)
  }

  // Handle API key modal
  const handleApiKeySet = () => {
    const updatedUsageData = getUsageData()
    setUsageData(updatedUsageData)
    setShowApiKeyModal(false)
    
    toast({
      title: "API Key Added",
      description: "You can now use Recall unlimited!",
      duration: 3000,
    })
  }

  const handleApiKeyModalClose = () => {
    setShowApiKeyModal(false)
  }

  // Handle YouTube link functionality
  const handleYouTubeLinkAdd = (link: string) => {
    setYoutubeLink(link)
    setShowYouTubeLinkPrompt(false)
    
    toast({
      title: "YouTube Link Added",
      description: "The video link will be added to all concepts when you save.",
      duration: 3000,
    })
  }

  const handleYouTubeLinkSkip = () => {
    setShowYouTubeLinkPrompt(false)
    setYoutubeLink("")
  }

  return {
    // State
    conversationText,
    analysisResult,
    selectedConcept,
    isAnalyzing,
    searchQuery,
    isEditingCategory,
    editCategoryValue,
    isAddingConcept,
    showAddConceptCard,
    showAnimation,
    selectedTab,
    isSaving,
    saveError,
    isDeleting,
    editConceptMode,
    editConceptTitle,
    editConceptCategory,
    existingConcepts,
    showConceptConfirmation,
    originalSaveData,
    discoveredConcepts,
    analysisStage,
    filteredConcepts,
    loadingConcepts,
    conceptMatches,
    showConceptMatchDialog,
    pendingAnalysisResult,
    isProcessingMatches,
    showConversationSaveDialog,
    updatedConceptsCount,
    showApiKeyModal,
    usageData,
    showUserInfoModal,
    lastUpdatedConceptId,
    showYouTubeLinkPrompt,
    youtubeLink,

    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setEditCategoryValue,
    setShowAddConceptCard,
    setSelectedTab,
    setIsEditingCategory,
    setEditConceptMode,
    setEditConceptTitle,
    setEditConceptCategory,
    setAnalysisResult,

    // Handlers
    handleAnalyze,
    handleCategoryUpdate,
    handleSaveConversation,
    handleAddConcept,
    handleDeleteConcept,
    handleDeleteCodeSnippet,
    handleConfirmConceptUpdates,
    handleCancelConceptUpdates,
    
    // Auto-analysis functions
    startAutoAnalysis,
    linkConceptsAfterAnalysis,
    addConceptToCurrentAnalysis,
    
    // Concept matching functions
    handleConceptMatchDecision,
    finalizeSaveWithMatches,
    
    // Conversation save functions
    handleSaveConversationDecision,
    handleSkipSavingDecision,
    
    // API key modal functions
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,

    // User info modal functions
    handleUserInfoProvided,
    handleUserInfoModalClose,

    // YouTube link functions
    handleYouTubeLinkAdd,
    handleYouTubeLinkSkip,
  }
} 