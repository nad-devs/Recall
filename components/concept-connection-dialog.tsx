"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Check, Link as LinkIcon, X, Plus, Brain } from "lucide-react"

interface ConceptConnectionDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  sourceConcept: {
    id: string
    title: string
  }
  onConnect: (targetConceptId: string) => Promise<void>
}

// Get authentication headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    console.log('🔧 Concept Connection Dialog - Auth headers:', { userEmail, userId });
    
    if (userEmail && userId) {
      headers['x-user-email'] = userEmail;
      headers['x-user-id'] = userId;
    }
  }
  
  return headers;
}

export function ConceptConnectionDialog({
  isOpen,
  onOpenChange,
  sourceConcept,
  onConnect
}: ConceptConnectionDialogProps) {
  const [availableConcepts, setAvailableConcepts] = useState<Array<{ id: string; title: string }>>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedConceptId, setSelectedConceptId] = useState<string>("")
  const [selectedConceptTitle, setSelectedConceptTitle] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [filteredConcepts, setFilteredConcepts] = useState<Array<{ id: string; title: string }>>([])
  const [willCreateNew, setWillCreateNew] = useState<boolean>(false)
  const [isGeneratingConcept, setIsGeneratingConcept] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Fetch available concepts when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableConcepts()
      setSearchTerm("")
      setSelectedConceptId("")
      setSelectedConceptTitle("")
      setShowDropdown(false)
      setWillCreateNew(false)
      setIsGeneratingConcept(false)
    }
  }, [isOpen])

  // Filter concepts based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredConcepts(availableConcepts)
      setShowDropdown(false)
      setWillCreateNew(false)
    } else {
      const filtered = availableConcepts.filter(concept =>
        concept.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredConcepts(filtered)
      setShowDropdown(true)
      
      // Check if we should show "create new" option
      const exactMatch = filtered.some(concept => 
        concept.title.toLowerCase().trim() === searchTerm.toLowerCase().trim()
      )
      const shouldCreateNew = !exactMatch && searchTerm.trim().length > 0
      
      console.log(`🔍 Connect Dialog Search: "${searchTerm}" - filtered: ${filtered.length}, exactMatch: ${exactMatch}, shouldCreateNew: ${shouldCreateNew}`)
      
      setWillCreateNew(shouldCreateNew)
    }
  }, [searchTerm, availableConcepts])
  
  const fetchAvailableConcepts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/concepts', {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        throw new Error('Failed to fetch concepts')
      }
      
      const data = await response.json()
      // Filter out the source concept and already related concepts
      const filteredConcepts = data.concepts.filter((concept: any) => 
        concept.id !== sourceConcept.id
      )
      
      setAvailableConcepts(filteredConcepts)
    } catch (error) {
      console.error('Error fetching concepts:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load available concepts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateAndCreateConcept = async (title: string) => {
    try {
      setIsGeneratingConcept(true)
      
      console.log(`🤖 Starting AI concept generation for: "${title}"`)
      
      // First, generate the concept using AI
      const generateResponse = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          conceptName: title,
          context: `Generate a concept that could be related to "${sourceConcept.title}"`
        }),
      })

      console.log(`🔧 Generate API response status: ${generateResponse.status}`)

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        console.error('❌ Generate API error:', errorData)
        throw new Error(errorData.error || `Failed to generate concept content (${generateResponse.status})`)
      }

      const generateData = await generateResponse.json()
      
      console.log('✅ Generated concept data:', generateData)
      
      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate concept')
      }

      // Now create the concept with the AI-generated content
      const createPayload = {
        title: generateData.concept.title || title,
        category: generateData.concept.category || 'General',
        summary: generateData.concept.summary || '',
        details: generateData.concept.details || '',
        keyPoints: JSON.stringify(generateData.concept.keyPoints || []),  // Stringify array
        examples: JSON.stringify(generateData.concept.examples || []),    // Stringify array
        relatedConcepts: JSON.stringify(generateData.concept.relatedConcepts || []), // Stringify array
        needsReview: true,      // Mark AI-generated concepts for review
        confidenceScore: 0.7,   // Set confidence score for AI-generated concepts
        isAIGenerated: true,
        bypassSimilarityCheck: true  // Skip similarity checking for connect dialog concepts
      }
      
      console.log('🔧 Creating concept with payload:', createPayload)
      
      const createResponse = await fetch('/api/concepts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createPayload),
      })

      console.log(`🔧 Create API response status: ${createResponse.status}`)

      if (!createResponse.ok) {
        if (createResponse.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        const errorData = await createResponse.json().catch(() => ({}))
        console.error('❌ Create API error:', errorData)
        throw new Error(errorData.error || `Failed to create concept (${createResponse.status})`)
      }

      const createData = await createResponse.json()
      
      console.log('✅ Created concept data:', createData)
      
      if (!createData.concept || !createData.concept.id) {
        throw new Error('Invalid response from concept creation API')
      }
      
      console.log(`🎉 Successfully created concept with ID: ${createData.concept.id}`)
      
      return createData.concept.id
    } catch (error) {
      console.error('❌ Error generating and creating concept:', error)
      throw error
    } finally {
      setIsGeneratingConcept(false)
    }
  }

  const handleSelectConcept = (concept: { id: string; title: string }) => {
    setSelectedConceptId(concept.id)
    setSelectedConceptTitle(concept.title)
    setSearchTerm(concept.title)
    setShowDropdown(false)
    setWillCreateNew(false)
  }

  const handleCreateAndSelect = async () => {
    if (!searchTerm.trim()) return
    
    try {
      setIsLoading(true)
      
      toast({
        title: "Generating concept...",
        description: `AI is creating and analyzing "${searchTerm.trim()}"`,
        variant: "default"
      })
      
      const newConceptId = await generateAndCreateConcept(searchTerm.trim())
      
      if (!newConceptId) {
        throw new Error('Failed to get valid concept ID from creation')
      }
      
      setSelectedConceptId(newConceptId)
      setSelectedConceptTitle(searchTerm.trim())
      setShowDropdown(false)
      setWillCreateNew(false)
      
      toast({
        title: "Success",
        description: `AI generated concept: "${searchTerm.trim()}" with proper category and details`,
        variant: "success"
      })
    } catch (error) {
      console.error('Error in handleCreateAndSelect:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate new concept",
        variant: "destructive",
      })
      
      // Reset states on error
      setSelectedConceptId("")
      setSelectedConceptTitle("")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleConnect = async () => {
    if (!selectedConceptId) {
      toast({
        title: "Error",
        description: "Please select or create a concept to connect",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    try {
      console.log(`Attempting to connect ${sourceConcept.id} to ${selectedConceptId}`)
      
      await onConnect(selectedConceptId)
      
      toast({
        title: "Success",
        description: `Successfully connected "${sourceConcept.title}" to "${selectedConceptTitle}"`,
        variant: "success"
      })
      
      // Trigger refresh of concepts page if this was a newly created concept
      // This ensures the new concept appears in browse concepts
      console.log('🔄 Triggering concepts page refresh after successful connection')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshConcepts'))
      }, 300)
      
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error connecting concepts:', error)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect concepts. Please try again.",
        variant: "destructive",
      })
      // Don't close dialog on error so user can retry
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Clear selection if user is typing something different
    if (value !== selectedConceptTitle) {
      setSelectedConceptId("")
      setSelectedConceptTitle("")
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-sm border-2">
        <AlertDialogHeader className="bg-muted/30 p-4 rounded-lg">
          <AlertDialogTitle className="flex items-center text-foreground">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Concepts
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground bg-background/60 p-2 rounded">
            Search for a concept to connect with <Badge variant="outline" className="bg-primary/10">{sourceConcept.title}</Badge>, or type a new concept name to have AI create it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 relative bg-muted/20 p-4 rounded-lg">
          <Label htmlFor="concept-search" className="text-foreground font-medium">Search or create concept</Label>
          <Input
            ref={inputRef}
            id="concept-search"
            type="text"
            placeholder={availableConcepts.length === 0 ? "Type concept name for AI to create..." : "Search concepts or type to create new..."}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchTerm && setShowDropdown(true)}
            disabled={isLoading || isGeneratingConcept}
            className="mt-2 bg-background/80 border-2"
          />
          
          {/* Dropdown with search results */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-sm border-2 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredConcepts.length > 0 && (
                <>
                  {filteredConcepts.map((concept) => (
                    <button
                      key={concept.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted/60 flex items-center justify-between border-b border-muted/30"
                      onClick={() => handleSelectConcept(concept)}
                    >
                      <span className="text-foreground">{concept.title}</span>
                      {selectedConceptId === concept.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                  {willCreateNew && <div className="border-t-2 border-muted/50" />}
                </>
              )}
              
              {willCreateNew && (
                <button
                  className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center text-primary font-medium"
                  onClick={handleCreateAndSelect}
                  disabled={isLoading || isGeneratingConcept}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Generate "{searchTerm}"
                  {isGeneratingConcept && <span className="ml-2 text-xs">(Generating...)</span>}
                </button>
              )}
              
              {filteredConcepts.length === 0 && !willCreateNew && searchTerm && (
                <div className="px-3 py-2 text-muted-foreground text-sm bg-muted/30">
                  No concepts found
                </div>
              )}
            </div>
          )}
          
          {/* Status messages */}
          {availableConcepts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground mt-2 bg-background/60 p-2 rounded">
              No existing concepts available. Type a concept name for AI to create a new one.
            </p>
          )}
          
          {selectedConceptTitle && (
            <p className="text-sm text-green-600 mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded font-medium">
              Selected: {selectedConceptTitle}
            </p>
          )}
          
          {isGeneratingConcept && (
            <div className="text-sm text-blue-600 mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 font-medium flex items-center">
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              AI is generating concept content...
            </div>
          )}
        </div>
        
        <AlertDialogFooter className="bg-muted/20 p-4 rounded-lg">
          <AlertDialogCancel disabled={isLoading || isGeneratingConcept}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConnect}
            disabled={isLoading || isGeneratingConcept || !selectedConceptId}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </div>
            ) : (
              "Connect Concepts"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 