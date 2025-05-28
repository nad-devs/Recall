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
  generateTitleFromConcepts,
  normalizeCategory 
} from '@/lib/utils/conversation'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { getAuthHeaders, makeAuthenticatedRequest } from '@/lib/auth-utils'

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
      
      // Log auth headers (without revealing sensitive info)
      const headers = getAuthHeaders()
      console.log('🔍 Using auth headers:', Object.keys(headers).join(', '))
      
      const response = await makeAuthenticatedRequest('/api/concepts/check-existing', {
        method: 'POST',
        body: JSON.stringify({ 
          concepts: concepts.map(c => ({
            title: c.title,
            summary: c.summary,
            category: c.category
          }))
        }),
      }, false) // Set enforceAuth to false to prevent redirects for auth failures

      console.log(`🔍 API response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('🔍 Authentication failed for concept checking - user may not be logged in')
          return []
        }
        console.error('🔍 Failed to check existing concepts:', response.status, response.statusText)
        // Try to get error details from response
        try {
          const errorData = await response.text()
          console.error('🔍 Error details:', errorData)
        } catch (e) {
          console.error('🔍 Could not read error details')
        }
        return []
      }

      const data = await response.json()
      console.log('🔍 Check Existing Concepts - API response:', data)
      console.log('🔍 Found matches:', data.matches?.length || 0)
      return data.matches || []
    } catch (error) {
      console.error('🔍 Error checking existing concepts:', error)
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
        const updateResponse = await makeAuthenticatedRequest(`/api/concepts/${match.existingConcept.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...match.newConcept,
            // Preserve existing enhancements and other fields
            preserveEnhancements: true
          }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update existing concept')
        }

        toast({
          title: "Concept Updated",
          description: `"${match.existingConcept.title}" has been updated with new information`,
          duration: 4000,
        })
      } else {
        toast({
          title: "Concept Linked",
          description: `"${match.existingConcept.title}" will be linked to this conversation`,
          duration: 4000,
        })
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
    setUpdatedConceptsCount(processedCount)
    setConceptMatches([])

    // Show the conversation save dialog
    setShowConversationSaveDialog(true)

    console.log("Concept matching completed, showing save dialog")
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
    const newCategory = normalizeCategory(rawValue)
    
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

    setIsAnalyzing(true)
    setShowAnimation(true)
    
    // Clear any previous discovered concepts and set initial stage
    setDiscoveredConcepts([])
    setAnalysisStage("Initializing analysis...")

    try {
      console.log("Sending conversation to extraction service...")
      
      // Get custom API key if user has one
      const currentUsageData = getUsageData()
      
      const response = await makeAuthenticatedRequest('/api/extract-concepts', {
        method: 'POST',
        body: JSON.stringify({ 
          conversation_text: conversationText,
          customApiKey: currentUsageData.customApiKey
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
      
      // Proceed normally - concept matching will happen during save
      setAnalysisResult(analysis)
      setDiscoveredConcepts(analysis.concepts.map((c: any) => c.title))
      
      if (analysis.concepts.length > 0) {
        setSelectedConcept(analysis.concepts[0])
        setSelectedTab("summary")
      }

      console.log("Analysis completed successfully")
      setTimeout(() => {
        setShowAnimation(false)
        setIsAnalyzing(false)
        setDiscoveredConcepts([])
        setAnalysisStage("Initializing...")
      }, 1000)
    } catch (error) {
      console.error('Error during analysis:', error)
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

    // Remove the authentication requirement - allow saving without sign-in
    // Users can now save conversations with just their name and email
    // if (!canMakeConversation()) {
    //   setShowApiKeyModal(true)
    //   return
    // }

    setIsSaving(true)
    setSaveError(null)

    try {
      // First, check for existing concepts before saving
      console.log("💾 Checking for existing concepts before saving...")
      console.log(`💾 Number of concepts to check: ${analysisResult.concepts.length}`)
      
      // Log concept titles we're checking
      const conceptTitles = analysisResult.concepts.map(c => c.title).join(', ')
      console.log(`💾 Concepts being checked: ${conceptTitles}`)
      
      const matches = await checkForExistingConcepts(analysisResult.concepts)
      
      console.log(`💾 Check complete - Found ${matches.length} concept matches`)
      
      if (matches.length > 0) {
        // Found matches - show confirmation dialog
        console.log(`💾 Found ${matches.length} concept matches, showing dialog`)
        console.log(`💾 Match details: ${matches.map(m => `${m.newConcept.title} → ${m.existingConcept.title}`).join(', ')}`)
        setConceptMatches(matches)
        setShowConceptMatchDialog(true)
        setIsSaving(false)
        return
      }

      // No matches found, proceed with normal save
      console.log("💾 No concept matches found, proceeding with save")
      await performSaveConversation()
    } catch (error) {
      console.error('💾 Error during save process:', error)
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
      // Get user info from localStorage if available (for non-authenticated users)
      const userName = localStorage.getItem('userName')
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      const response = await makeAuthenticatedRequest('/api/saveConversation', {
        method: 'POST',
        body: JSON.stringify({
          conversation_text: conversationText,
          analysis: {
            ...analysisResult,
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
      
      if (data.requiresConfirmation) {
        setExistingConcepts(data.existingConcepts)
        setOriginalSaveData(data.originalData)
        setShowConceptConfirmation(true)
        setIsSaving(false)
        return
      }
      
      if (data.success) {
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
        relatedConcepts: generatedConcept.relatedConcepts || []
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
      
      let conversationId = null
      
      if (analysisResult) {
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
            console.log("Created/retrieved conversation ID:", conversationId)
          }
        } else {
          console.error("Failed to save conversation:", saveResponse.status, saveResponse.statusText);
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
      
      console.log("Making API call to create concept with auth headers:", getAuthHeaders());
      
      const response = await makeAuthenticatedRequest('/api/concepts', {
        method: 'POST',
        body: JSON.stringify({ 
          title,
          context: conversationText,
          conversationId: conversationId
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
      
      const newConcept: Concept = {
        id: data.concept.id,
        title: data.concept.title,
        category: data.concept.category || "Uncategorized",
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
            data.concept.relatedConcepts) : []
      }
      
      // Add to current analysis
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          concepts: [...analysisResult.concepts, newConcept]
        })
      }
      
      setSelectedConcept(newConcept)
      setShowAddConceptCard(false)
      
      toast({
        title: "Concept Created",
        description: `"${newConcept.title}" has been created and added to your knowledge base`,
        duration: 4000,
      })
      
      // Auto-refresh concepts after creation
      setTimeout(() => {
        console.log('🔄 Auto-refreshing concepts after concept creation...')
        window.dispatchEvent(new CustomEvent('refreshConcepts'))
      }, 500)
      
      return newConcept
    } catch (error) {
      console.error('Error adding concept:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create concept. Please check your authentication and try again.",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    } finally {
      setIsAddingConcept(false)
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
  }
} 