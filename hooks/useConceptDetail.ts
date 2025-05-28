import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface ConceptData {
  id: string
  title: string
  category: string
  summary: string
  details: string
  keyPoints: string[] | string
  examples: string
  relatedConcepts: string[] | { id: string; title: string }[]
  relationships: string
  codeSnippets: {
    id: string
    language: string
    code: string
    description: string
  }[]
  conversation: {
    id: string
    title: string
    date: string
    summary: string
  }
  // Enhancement fields
  videoResources?: string
  commonMistakes?: string
  personalNotes?: string
}

interface RelatedConversation {
  id: string
  title: string
  date: string
  summary: string
}

export function useConceptDetail(id: string) {
  const [concept, setConcept] = useState<ConceptData | null>(null)
  const [relatedConversations, setRelatedConversations] = useState<RelatedConversation[]>([])
  const [relatedConcepts, setRelatedConcepts] = useState<ConceptData[]>([])
  const [conceptRelatedConcepts, setConceptRelatedConcepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchConcept = async () => {
      try {
        setLoading(true)
        
        // Get authentication headers
        const getAuthHeaders = (): HeadersInit => {
          const userEmail = localStorage.getItem('userEmail')
          const userId = localStorage.getItem('userId')
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          }
          
          // For email-based sessions
          if (userEmail && userId) {
            headers['x-user-email'] = userEmail
            headers['x-user-id'] = userId
          }
          
          return headers
        }
        
        // Check if the ID is a database ID format (UUID or CUID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        const isCUID = /^c[a-z0-9]{24}$/i.test(id) // CUID format: starts with 'c' followed by 24 alphanumeric chars
        const isDatabaseId = isUUID || isCUID
        
        let response: Response
        
        if (isDatabaseId) {
          // ID looks like a database ID (UUID or CUID), fetch directly
          response = await fetch(`/api/concepts/${id}`, { headers: getAuthHeaders() })
        } else {
          // ID is probably a concept title/name, try to look it up by title first
          const titleResponse = await fetch(`/api/concepts-by-title/${encodeURIComponent(id)}`, { headers: getAuthHeaders() })
          
          if (titleResponse.ok) {
            // Found existing concept by title, fetch the full concept data
            const titleData = await titleResponse.json()
            response = await fetch(`/api/concepts/${titleData.id}`, { headers: getAuthHeaders() })
          } else {
            // Concept doesn't exist, show creation dialog
            const shouldCreate = window.confirm(
              `Concept "${id}" doesn't exist yet. Do you want to create it?`
            )
            
            if (shouldCreate) {
              // Store link-back information
              // Check if we came from another concept page
              const referrer = document.referrer
              const referrerMatch = referrer.match(/\/concept\/([^/?#]+)/)
              
              if (referrerMatch) {
                // We came from another concept page, store that for linking
                localStorage.setItem('linkBackToConcept', JSON.stringify({
                  id: referrerMatch[1],
                  title: 'Original Concept', // We'll get the real title later
                  relatedConceptTitle: id
                }))
              } else {
                // No referring concept, just store minimal info
                localStorage.setItem('linkBackToConcept', JSON.stringify({
                  id: 'standalone',
                  title: 'Standalone Creation',
                  relatedConceptTitle: id
                }))
              }
              
              // Redirect to analyze page with concept parameter
              window.location.href = `/analyze?concept=${encodeURIComponent(id)}`
              return
            } else {
              // User chose not to create, show error
              setError(`Concept "${id}" not found`)
              return
            }
          }
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch concept')
        }
        const data = await response.json()
        
        setConcept(data.concept)
        setRelatedConversations(data.relatedConversations || [])
        
        // Set related concepts from API response
        if (data.relatedConcepts) {
          setRelatedConcepts(data.relatedConcepts)
        } else {
          setRelatedConcepts([])
        }
        
        // Set concept-level related concepts (from concept.relatedConcepts field)
        if (data.concept.relatedConcepts) {
          try {
            const parsedRelatedConcepts = typeof data.concept.relatedConcepts === 'string'
              ? JSON.parse(data.concept.relatedConcepts)
              : data.concept.relatedConcepts;
              
            setConceptRelatedConcepts(Array.isArray(parsedRelatedConcepts) 
              ? parsedRelatedConcepts 
              : []);
          } catch (e) {
            console.error("Error parsing concept related concepts:", e);
            setConceptRelatedConcepts([]);
          }
        } else {
          setConceptRelatedConcepts([]);
        }
      } catch (error) {
        setError('Failed to load concept')
        console.error('Error fetching concept:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcept()
  }, [id])

  // Delete code snippet handler
  const deleteCodeSnippet = useCallback(async (snippetId: string) => {
    try {
      if (!snippetId) {
        toast({
          title: "Error",
          description: "Cannot delete snippet: Invalid ID",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Get authentication headers
      const getAuthHeaders = (): HeadersInit => {
        const userEmail = localStorage.getItem('userEmail')
        const userId = localStorage.getItem('userId')
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        
        // For email-based sessions
        if (userEmail && userId) {
          headers['x-user-email'] = userEmail
          headers['x-user-id'] = userId
        }
        
        return headers
      }
      
      const response = await fetch(`/api/codeSnippets?id=${snippetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete code snippet')
      }
      
      // Update the UI by removing the deleted snippet
      setConcept(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          codeSnippets: prev.codeSnippets.filter(s => s.id !== snippetId)
        }
      })
      
      toast({
        title: "Success",
        description: "Code snippet deleted successfully",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error deleting code snippet:', error)
      toast({
        title: "Error",
        description: "Failed to delete code snippet",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [toast])

  // Refresh function to reload concept data
  const refreshConcept = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get authentication headers
      const getAuthHeaders = (): HeadersInit => {
        const userEmail = localStorage.getItem('userEmail')
        const userId = localStorage.getItem('userId')
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        
        // For email-based sessions
        if (userEmail && userId) {
          headers['x-user-email'] = userEmail
          headers['x-user-id'] = userId
        }
        
        return headers
      }
      
      const response = await fetch(`/api/concepts/${id}`, { headers: getAuthHeaders() })
      if (!response.ok) {
        throw new Error('Failed to refresh concept')
      }
      
      const data = await response.json()
      
      setConcept(data.concept)
      setRelatedConversations(data.relatedConversations || [])
      
      // Set related concepts from API response
      if (data.relatedConcepts) {
        setRelatedConcepts(data.relatedConcepts)
      } else {
        setRelatedConcepts([])
      }
      
      // Set concept-level related concepts (from concept.relatedConcepts field)
      if (data.concept.relatedConcepts) {
        try {
          const parsedRelatedConcepts = typeof data.concept.relatedConcepts === 'string'
            ? JSON.parse(data.concept.relatedConcepts)
            : data.concept.relatedConcepts;
            
          setConceptRelatedConcepts(Array.isArray(parsedRelatedConcepts) 
            ? parsedRelatedConcepts 
            : []);
        } catch (e) {
          console.error("Error parsing concept related concepts:", e);
          setConceptRelatedConcepts([]);
        }
      } else {
        setConceptRelatedConcepts([]);
      }
    } catch (error) {
      console.error('Error refreshing concept:', error)
      toast({
        title: "Error",
        description: "Failed to refresh concept data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  return {
    concept,
    setConcept,
    relatedConversations,
    relatedConcepts,
    setRelatedConcepts,
    conceptRelatedConcepts,
    setConceptRelatedConcepts,
    loading,
    error,
    deleteCodeSnippet,
    refreshConcept
  }
} 