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
import { Check, Link as LinkIcon, X, Plus } from "lucide-react"

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
        concept.title.toLowerCase() === searchTerm.toLowerCase()
      )
      setWillCreateNew(!exactMatch && searchTerm.trim().length > 0)
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

  const createNewConcept = async (title: string) => {
    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          title,
          isManualCreation: true // Mark as manual creation so it gets lower confidence score
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        throw new Error('Failed to create concept')
      }

      const data = await response.json()
      return data.concept.id
    } catch (error) {
      console.error('Error creating concept:', error)
      throw error
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
      const newConceptId = await createNewConcept(searchTerm.trim())
      setSelectedConceptId(newConceptId)
      setSelectedConceptTitle(searchTerm.trim())
      setShowDropdown(false)
      setWillCreateNew(false)
      
      toast({
        title: "Success",
        description: `Created new concept: "${searchTerm.trim()}"`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new concept",
        variant: "destructive",
      })
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
      await onConnect(selectedConceptId)
      
      toast({
        title: "Success",
        description: `Successfully connected to "${selectedConceptTitle}"`,
      })
      
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error connecting concepts:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect concepts",
        variant: "destructive",
      })
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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Concepts
          </AlertDialogTitle>
          <AlertDialogDescription>
            Search for a concept to connect with <Badge variant="outline">{sourceConcept.title}</Badge>, or type a new concept name to create it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 relative">
          <Label htmlFor="concept-search">Search or create concept</Label>
          <Input
            ref={inputRef}
            id="concept-search"
            type="text"
            placeholder={availableConcepts.length === 0 ? "Type concept name to create..." : "Search concepts or type to create new..."}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchTerm && setShowDropdown(true)}
            disabled={isLoading}
            className="mt-2"
          />
          
          {/* Dropdown with search results */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredConcepts.length > 0 && (
                <>
                  {filteredConcepts.map((concept) => (
                    <button
                      key={concept.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                      onClick={() => handleSelectConcept(concept)}
                    >
                      <span>{concept.title}</span>
                      {selectedConceptId === concept.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                  {willCreateNew && <div className="border-t" />}
                </>
              )}
              
              {willCreateNew && (
                <button
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center text-primary"
                  onClick={handleCreateAndSelect}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create "{searchTerm}"
                </button>
              )}
              
              {filteredConcepts.length === 0 && !willCreateNew && searchTerm && (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  No concepts found
                </div>
              )}
            </div>
          )}
          
          {/* Status messages */}
          {availableConcepts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground mt-2">
              No existing concepts available. Type a concept name to create a new one.
            </p>
          )}
          
          {selectedConceptTitle && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {selectedConceptTitle}
            </p>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConnect}
            disabled={isLoading || !selectedConceptId}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-sm"
          >
            {isLoading ? "Connecting..." : "Connect Concepts"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 