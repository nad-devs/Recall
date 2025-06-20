"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { MessageSquare, ArrowRight, BookOpen, ExternalLink, Edit, Check, X, Loader2, Trash2, Link as LinkIcon, Tag, Plus, Video, AlertTriangle, FileText } from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDrag } from 'react-dnd'
import { ConceptConnectionDialog } from "@/components/concept-connection-dialog"
import { connectConcepts, disconnectConcepts } from "@/lib/concept-utils"
import React, { createContext, useContext } from "react"

// Get authentication headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    console.log('🔧 Concept Card - Auth headers:', { userEmail, userId });
    
    if (userEmail && userId) {
      headers['x-user-email'] = userEmail;
      headers['x-user-id'] = userId;
    }
  }
  
  return headers;
}

// Enhanced category interface for hierarchical display
interface CategoryOption {
  value: string;
  label: string;
  isHierarchical: boolean;
  depth: number;
  isLearned?: boolean; // Indicates if this category was learned from user patterns
}

interface ConceptCardProps {
  concept: any
  showDescription?: boolean
  showRelatedConcepts?: boolean
  onCategoryUpdate?: (id: string, newCategory: string) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  enableRightClickLinking?: boolean
}

// Create a context for linking state
const LinkingContext = createContext<{
  selected: { id: string; title: string } | null;
  setSelected: (concept: { id: string; title: string } | null) => void;
}>({
  selected: null,
  setSelected: () => {},
});

export function LinkingProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);
  
  return (
    <LinkingContext.Provider value={{ selected, setSelected }}>
      {children}
    </LinkingContext.Provider>
  );
}

function useLinking() {
  return useContext(LinkingContext);
}

export const ConceptCard = React.memo(function ConceptCard({ 
  concept, 
  showDescription = false, 
  showRelatedConcepts = false,
  onCategoryUpdate,
  onDelete,
  isLoading = false,
  isSelected = false,
  onSelect,
  enableRightClickLinking = false
}: ConceptCardProps) {
  const { id, title, category, notes, discussedInConversations, needsReview, isPlaceholder } = concept
  const [parsedRelatedConcepts, setParsedRelatedConcepts] = useState<Array<string | {id?: string, title?: string}>>([])
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(category || "General")
  const [editedTitle, setEditedTitle] = useState(title || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)
  
  // New state to track if this card is the source for linking
  const [isSourceForLinking, setIsSourceForLinking] = useState(false)
  
  const { selected: selectedSourceConceptForLinking, setSelected: setSelectedSourceConceptForLinking } = useLinking();
  
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      // Fetch existing categories from the database
      const response = await fetch('/api/categories', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const categoryPaths = data.categories || [];
        
        // Also get categories from existing concepts to show learned patterns
        const conceptsResponse = await fetch('/api/concepts', {
          headers: getAuthHeaders()
        });
        const conceptsData = conceptsResponse.ok ? await conceptsResponse.json() : { concepts: [] };
        const existingCategories = new Set<string>(conceptsData.concepts?.map((c: any) => c.category).filter(Boolean) || []);
        
        // Convert to CategoryOption format
        const categoryOptions: CategoryOption[] = [];
        const addedCategories = new Set<string>();
        
        // Add hierarchical categories from database
        categoryPaths.forEach((path: string[]) => {
          const fullPath = path.join(' > ');
          if (!addedCategories.has(fullPath)) {
            categoryOptions.push({
              value: fullPath,
              label: fullPath,
              isHierarchical: path.length > 1,
              depth: path.length - 1,
              isLearned: false
            });
            addedCategories.add(fullPath);
          }
        });
        
        // Add categories from existing concepts that aren't in the hierarchy
        for (const cat of existingCategories) {
          if (!addedCategories.has(cat)) {
            categoryOptions.push({
              value: cat,
              label: cat,
              isHierarchical: cat.includes(' > '),
              depth: cat.includes(' > ') ? cat.split(' > ').length - 1 : 0,
              isLearned: true // Mark as learned from existing concepts
            });
            addedCategories.add(cat);
          }
        }
        
        // Add some common fallback categories if none exist
        if (categoryOptions.length === 0) {
          const fallbackCategories = [
            "General",
            "Programming",
            "Data Structures and Algorithms",
            "Frontend Engineering",
            "Backend Engineering",
            "Cloud Computing",
            "Machine Learning"
          ];
          
          fallbackCategories.forEach(cat => {
            categoryOptions.push({
              value: cat,
              label: cat,
              isHierarchical: false,
              depth: 0,
              isLearned: false
            });
          });
        }
        
        // Sort categories: hierarchical first, then by depth, then alphabetically
        categoryOptions.sort((a, b) => {
          if (a.isHierarchical !== b.isHierarchical) {
            return b.isHierarchical ? 1 : -1; // Hierarchical first
          }
          if (a.depth !== b.depth) {
            return a.depth - b.depth; // Shallower first
          }
          return a.label.localeCompare(b.label); // Alphabetical
        });
        
        setAvailableCategories(categoryOptions);
      } else {
        // Fallback categories if API fails
        const fallbackCategories = [
          "General",
          "Programming", 
          "Data Structures and Algorithms",
          "Frontend Engineering",
          "Backend Engineering",
          "Cloud Computing",
          "Machine Learning"
        ].map(cat => ({
          value: cat,
          label: cat,
          isHierarchical: false,
          depth: 0,
          isLearned: false
        }));
        
        setAvailableCategories(fallbackCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use fallback categories
      const fallbackCategories = [
        "General",
        "Programming",
        "Data Structures and Algorithms"
      ].map(cat => ({
        value: cat,
        label: cat,
        isHierarchical: false,
        depth: 0,
        isLearned: false
      }));
      
      setAvailableCategories(fallbackCategories);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Setup drag and drop
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CONCEPT_CARD',
    item: { id, title, category, isSelected },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    // Disable dragging when card is loading
    canDrag: !isLoading && !isSaving && !isDeleting,
  }))

  // Connect the drag ref to our card ref
  useEffect(() => {
    if (cardRef.current) {
      drag(cardRef)
    }
  }, [drag, cardRef])

  // Extract key points from either the keyPoints array or notes object
  const [keyPoints, setKeyPoints] = useState<string[]>([])

  useEffect(() => {
    // Handle different keyPoints structures
    if (concept.keyPoints) {
      if (Array.isArray(concept.keyPoints)) {
        setKeyPoints(concept.keyPoints);
      } else if (typeof concept.keyPoints === 'string') {
        try {
          const parsed = JSON.parse(concept.keyPoints);
          setKeyPoints(Array.isArray(parsed) ? parsed : [concept.keyPoints]);
        } catch (e) {
          // If not valid JSON, use as a single string
          setKeyPoints([concept.keyPoints]);
        }
      }
    } else if (concept.notes && concept.notes.principles && Array.isArray(concept.notes.principles)) {
      setKeyPoints(concept.notes.principles);
    } else {
      setKeyPoints(['Extracted from conversation']);
    }
  }, [concept]);

  useEffect(() => {
    // Parse the related concepts safely
    if (concept.relatedConcepts) {
      try {
        // Handle both array and JSON string formats
        let rawRelatedConcepts = [];
        if (typeof concept.relatedConcepts === 'string') {
          const parsed = JSON.parse(concept.relatedConcepts);
          rawRelatedConcepts = Array.isArray(parsed) ? parsed : [];
        } else if (Array.isArray(concept.relatedConcepts)) {
          rawRelatedConcepts = concept.relatedConcepts;
        }
        
        // Filter out broken references - be more lenient with the filtering
        const validRelatedConcepts = rawRelatedConcepts.filter((related: string | {id?: string, title?: string}) => {
          // Accept any non-empty string
          if (typeof related === 'string' && related.trim().length > 0) {
            return true;
          }
          // Accept any object that has either an id OR a title (not both required)
          if (typeof related === 'object' && related !== null) {
            return !!(related.id || related.title);
          }
          // Reject null, undefined, empty strings, or invalid objects
          return false;
        });
        
        setParsedRelatedConcepts(validRelatedConcepts);
      } catch (e) {
        console.error("Error parsing related concepts:", e);
        setParsedRelatedConcepts([]);
      }
    } else {
      setParsedRelatedConcepts([]);
    }
  }, [concept.relatedConcepts]);

  // Function to get the notes/summary text to display
  const getDescriptionText = () => {
    if (concept.summary) {
      return concept.summary;
    } else if (typeof notes === 'string') {
      return notes;
    } else if (notes && notes.implementation) {
      return notes.implementation;
    } else if (concept.details) {
      return concept.details;
    }
    return "No description available";
  };

  // Function to get display title and link for related concept
  const getRelatedConceptInfo = (related: string | {id?: string, title?: string}) => {
    if (typeof related === 'string') {
      return {
        displayTitle: related,
        linkPath: `/concept/${encodeURIComponent(related)}`
      };
    } else if (typeof related === 'object' && related !== null) {
      // If we have an ID but no title, this is likely a broken reference
      const displayTitle = related.title || 
        (related.id ? `[Missing Concept: ${related.id.substring(0, 8)}...]` : 'Unknown Concept');
      const linkPath = related.id 
        ? `/concept/${related.id}` 
        : (related.title ? `/concept/${encodeURIComponent(related.title)}` : '#');
      
      return { displayTitle, linkPath };
    } else {
      return {
        displayTitle: 'Unknown Concept',
        linkPath: '#'
      };
    }
  };

  // Handle updating the category
  const handleCategoryUpdate = async () => {
    if (selectedCategory === category) {
      setIsEditingCategory(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category: selectedCategory,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        throw new Error('Failed to update category')
      }

      // Call the callback if provided
      if (onCategoryUpdate) {
        onCategoryUpdate(id, selectedCategory)
      }

      toast({
        title: "Category Updated",
        description: `Category changed to ${selectedCategory}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
      setIsEditingCategory(false)
    }
  }

  // Handle title update
  const handleTitleUpdate = async () => {
    if (editedTitle.trim() === title) {
      setIsEditingTitle(false)
      return
    }

    if (!editedTitle.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: editedTitle.trim() }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        throw new Error('Failed to update title')
      }

      toast({
        title: "Title updated",
        description: `Concept title changed to "${editedTitle.trim()}"`,
      })

      setIsEditingTitle(false)
      // Refresh the page to show updated title
      window.location.reload()
    } catch (error) {
      console.error('Error updating title:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update title. Please try again.",
        variant: "destructive",
      })
      setEditedTitle(title || "") // Reset to original
    } finally {
      setIsSaving(false)
    }
  }

  // Handle concept deletion
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      console.log(`🗑️ Starting deletion of concept: ${id} - "${title}"`);
      
      // Just call the callback - let the parent handle the API call
      if (onDelete) {
        console.log(`🔄 Using parent onDelete callback for concept: ${id}`);
        await onDelete(id);
        console.log(`✅ Parent onDelete completed for concept: ${id}`);
      } else {
        // Fallback: only if no onDelete prop is provided, make the API call directly
        console.log(`🌐 Making direct API call to delete concept: ${id}`);
        
        const response = await fetch(`/api/concepts/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        console.log(`📡 Delete API response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ Delete API error:`, errorData);
          
          if (response.status === 401) {
            throw new Error('Authentication failed - please make sure you are logged in')
          }
          if (response.status === 404) {
            throw new Error('Concept not found - it may have already been deleted')
          }
          throw new Error(errorData.error || `Failed to delete concept (${response.status})`);
        }
        
        const result = await response.json();
        console.log(`✅ Delete API result:`, result);

        // Check if the conversation was also deleted due to having no concepts
        if (result.conversationDeleted) {
          toast({
            title: "✓ Concept & Conversation Deleted",
            description: `"${title}" and its conversation were deleted because it was the last concept`,
            duration: 4000,
            className: "border-orange-200 bg-orange-50 text-orange-900",
          });
          
          // If we're on a conversation page, redirect to the conversations list
          if (window.location.pathname.includes('/conversation/')) {
            console.log(`🔄 Redirecting to conversations list after deleting last concept`);
            setTimeout(() => {
              window.location.href = '/conversation';
            }, 1000);
          }
        } else {
          toast({
            title: "✓ Concept Deleted",
            description: `"${title}" has been deleted`,
            duration: 3000,
            className: "border-green-200 bg-green-50 text-green-900",
          });
        }
        
        // Trigger a page refresh or navigation after successful deletion
        console.log(`🔄 Triggering refresh after successful deletion`);
        setTimeout(() => {
          if (window.location.pathname.includes('/concept/')) {
            // If we're on the concept page itself, go back to concepts list
            window.location.href = '/concepts';
          } else {
            // Otherwise, just refresh the current page
            window.location.reload();
          }
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error deleting concept:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete concept. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
      console.log(`🏁 Deletion process completed for concept: ${id}`);
    }
  };

  // Handle concept connection
  const handleConnectConcept = async (targetConceptId: string) => {
    try {
      // First, get the target concept data to add to our local state
      const targetResponse = await fetch(`/api/concepts/${targetConceptId}`, {
        headers: getAuthHeaders()
      });
      if (!targetResponse.ok) {
        if (targetResponse.status === 401) {
          throw new Error('Authentication failed - please make sure you are logged in')
        }
        throw new Error('Failed to fetch target concept');
      }
      const targetData = await targetResponse.json();
      const targetConcept = targetData.concept;
      
      // Perform the connection
      await connectConcepts(id, targetConceptId);
      
      // Update local state immediately for instant feedback
      const updatedRelated = [...parsedRelatedConcepts, { 
        id: targetConcept.id, 
        title: targetConcept.title 
      }];
      setParsedRelatedConcepts(updatedRelated);
      
      // Show success message
      toast({
        title: "Success",
        description: `Connected to "${targetConcept.title}"`,
      });
      
      // Fetch fresh data to ensure UI is consistent
      fetch(`/api/concepts/${id}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data.relatedConcepts) {
            try {
              const updatedRelatedConcepts = typeof data.relatedConcepts === 'string'
                ? JSON.parse(data.relatedConcepts)
                : data.relatedConcepts;
              
              setParsedRelatedConcepts(Array.isArray(updatedRelatedConcepts) 
                ? updatedRelatedConcepts 
                : []);
            } catch (e) {
              console.error("Error updating related concepts:", e);
            }
          }
        })
        .catch(err => console.error("Error fetching updated concept:", err));
        
    } catch (error) {
      console.error('Error connecting concepts:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to establish concept relationship",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle concept disconnection (removing relationship)
  const handleDisconnectConcept = async (targetConceptId: string) => {
    try {
      // Perform the disconnection
      await disconnectConcepts(id, targetConceptId);
      
      // Update local state immediately by filtering out the disconnected concept
      const updatedRelated = parsedRelatedConcepts.filter(related => {
        if (typeof related === 'string') {
          return related !== targetConceptId;
        } else if (typeof related === 'object' && related !== null) {
          return related.id !== targetConceptId;
        }
        return true;
      });
      setParsedRelatedConcepts(updatedRelated);
      
      // Show success message
      toast({
        title: "Success",
        description: "Concept relationship removed",
      });
      
      // Fetch fresh data to ensure UI is consistent
      fetch(`/api/concepts/${id}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data.relatedConcepts) {
            try {
              const updatedRelatedConcepts = typeof data.relatedConcepts === 'string'
                ? JSON.parse(data.relatedConcepts)
                : data.relatedConcepts;
              
              setParsedRelatedConcepts(Array.isArray(updatedRelatedConcepts) 
                ? updatedRelatedConcepts 
                : []);
            } catch (e) {
              console.error("Error updating related concepts:", e);
              setParsedRelatedConcepts([]);
            }
          } else {
            setParsedRelatedConcepts([]);
          }
        })
        .catch(err => console.error("Error fetching updated concept:", err));
        
    } catch (error) {
      console.error('Error disconnecting concepts:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove concept relationship",
        variant: "destructive",
      });
    }
  };

  // Handle click for selection and navigation
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, input, select, [role="button"], [type="checkbox"]');
    
    if (isInteractiveElement) {
      return; // Let the interactive element handle the click
    }

    // Handle Ctrl+Click for selection
    if (onSelect && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSelect(id);
      return;
    }

    // Navigate to concept view on normal click
    if (!isLoading && !isDragging) {
      e.preventDefault();
      // Use Next.js router for client-side navigation
      router.push(`/concept/${id}`);
    }
  };

  // Simple right-click handler for the two-step linking process
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableRightClickLinking || isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    if (!selectedSourceConceptForLinking) {
      setSelectedSourceConceptForLinking({ id, title });
      setIsSourceForLinking(true);
      
      console.log(`🎯 Selected "${title}" as source for linking`);
      console.log("📋 Current concept's related concepts:", parsedRelatedConcepts);
      
      toast({
        title: "Concept Selected",
        description: `Right-click another concept to link with "${title}"`,
        duration: 5000,
      });
    } else if (selectedSourceConceptForLinking.id === id) {
      setSelectedSourceConceptForLinking(null);
      setIsSourceForLinking(false);
      
      console.log(`❌ Canceled selection of "${title}"`);
      
      toast({
        title: "Selection Canceled",
        description: "Concept linking canceled",
        duration: 3000,
      });
    } else {
      const sourceId = selectedSourceConceptForLinking.id;
      const sourceTitle = selectedSourceConceptForLinking.title;
      
      console.log(`🔗 Attempting to link "${sourceTitle}" → "${title}"`);
      
      toast({
        title: "Connecting...",
        description: `Linking "${sourceTitle}" to "${title}"`,
      });
      
      connectConcepts(sourceId, id)
        .then(() => {
          // Update related concepts arrays in both cards
          const updatedRelated = [...parsedRelatedConcepts, { id: sourceId, title: sourceTitle }];
          setParsedRelatedConcepts(updatedRelated);
          
          // Keep the source concept selected to show the green highlight
          toast({
            title: "Concepts Linked!",
            description: "Connection created successfully",
          });
          
          // Trigger storage event to notify other tabs/pages
          localStorage.setItem('conceptLinked', JSON.stringify({
            sourceId: sourceId,
            targetId: id,
            timestamp: Date.now()
          }));
          
          // Refresh the page to show updated connections
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        })
        .catch((error) => {
          console.error("Error connecting concepts:", error);
          toast({
            title: "Error",
            description: "Failed to connect concepts. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  // Helper: is this card linked to the selected source?
  const isLinkedToSource = useCallback(() => {
    if (!selectedSourceConceptForLinking) return false;
    
    // Don't show green highlight on the source concept itself
    if (selectedSourceConceptForLinking.id === id) return false;
    
    // Check if current concept has the source in its related concepts (one direction)
    const currentHasSource = parsedRelatedConcepts.some(rel => {
      if (typeof rel === 'object' && rel !== null) {
        return rel.id === selectedSourceConceptForLinking.id || 
               rel.title === selectedSourceConceptForLinking.title;
      }
      return rel === selectedSourceConceptForLinking.id || 
             rel === selectedSourceConceptForLinking.title;
    });
    
    // Debug logging when there's a selected source
    if (selectedSourceConceptForLinking) {
      console.log(`🔍 Checking if "${title}" is linked to source "${selectedSourceConceptForLinking.title}"`);
      console.log(`📋 "${title}" related concepts:`, parsedRelatedConcepts.map(rel => 
        typeof rel === 'object' ? `${rel.title} (${rel.id})` : rel
      ));
      console.log(`✅ Is linked:`, currentHasSource);
    }
    
    if (currentHasSource) return true;
    
    // For extra robustness, we could also check the reverse direction
    // by looking at the source concept's relationships, but since relationships
    // should be bidirectional, the above check should be sufficient.
    // If needed, we could fetch the source concept's data and check if it contains this concept.
    
    return false;
  }, [selectedSourceConceptForLinking, parsedRelatedConcepts, id, title]);

  // Unlink handler
  const handleUnlink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any navigation
    
    if (!selectedSourceConceptForLinking) return;
    
    try {
      setIsUnlinking(true);
      console.log("Unlinking concepts:", selectedSourceConceptForLinking.id, id);
      
      // Log the related concepts before
      console.log("Before unlinking, related concepts:", parsedRelatedConcepts);
      
      // Only disconnect the relationship, don't delete the concept
      await disconnectConcepts(selectedSourceConceptForLinking.id, id);
      
      // Clear the related concepts completely for immediate visual feedback
      setParsedRelatedConcepts([]);
      
      // Immediately clear the selected source to remove any green highlights
      setSelectedSourceConceptForLinking(null);
      
      toast({ 
        title: "Unlinked!", 
        description: "Concepts are no longer connected." 
      });
      
      // Force a refresh of the concept data
      const refreshData = async () => {
        try {
          const response = await fetch(`/api/concepts/${id}`, {
            headers: getAuthHeaders()
          });
          if (!response.ok) throw new Error("Failed to fetch updated concept");
          
          const data = await response.json();
          console.log("After unlinking, updated concept data:", data);
          
          // Update the parsed related concepts with fresh data
          if (data.relatedConcepts) {
            try {
              const updatedRelatedConcepts = typeof data.relatedConcepts === 'string'
                ? JSON.parse(data.relatedConcepts)
                : data.relatedConcepts;
              
              console.log("Updated related concepts:", updatedRelatedConcepts);
              setParsedRelatedConcepts(Array.isArray(updatedRelatedConcepts) 
                ? updatedRelatedConcepts 
                : []);
            } catch (e) {
              console.error("Error parsing updated related concepts:", e);
              setParsedRelatedConcepts([]);
            }
          } else {
            setParsedRelatedConcepts([]);
          }
        } catch (err) {
          console.error("Error refreshing concept data:", err);
        } finally {
          setIsUnlinking(false);
        }
      };
      
      refreshData();
    } catch (err) {
      console.error("Error unlinking concepts:", err);
      setIsUnlinking(false);
      toast({ 
        title: "Error", 
        description: "Failed to unlink concepts. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <>
      <Card 
        ref={cardRef}
        className={`group cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col overflow-hidden ${
          isSelected ? "ring-2 ring-primary shadow-lg" : ""
        } ${
          isDragging ? "rotate-3 scale-105 shadow-xl z-20" : ""
        } ${
          isDropTarget ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20" : ""
        } ${
          isPlaceholder ? "border-dashed border-2 border-muted-foreground/30 bg-muted/20 opacity-75" : ""
        } ${
          needsReview ? "border-2 border-amber-400 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20" : ""
        } ${
          onSelect ? "hover:ring-1 hover:ring-muted-foreground/20" : ""
        }`}
        style={{ cursor: isLoading ? 'wait' : (isDragging ? 'grabbing' : 'pointer') }}
        onClick={handleClick}
        onContextMenu={enableRightClickLinking ? handleContextMenu : undefined}
        title={onSelect ? (isSelected ? "Selected (Ctrl+Click to deselect)" : "Ctrl+Click to select for bulk operations") : "Click to view concept"}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {/* Source for linking indicator */}
        {isSourceForLinking && (
          <div className="absolute top-0 left-0 right-0 p-1 bg-blue-500 text-white text-xs text-center rounded-t-md z-30">
            Selected for linking. Right-click another concept to connect.
          </div>
        )}
        
        {/* Linked to source indicator and unlink button */}
        {isLinkedToSource() && selectedSourceConceptForLinking && !isSourceForLinking && (
          <button
            className="absolute top-0 right-0 m-2 bg-background/90 hover:bg-destructive/10 text-destructive border border-destructive/30 rounded-full p-1 z-30 shadow-md backdrop-blur-sm"
            title={`Unlink from ${selectedSourceConceptForLinking.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUnlink(e);
            }}
            disabled={isUnlinking}
          >
            {isUnlinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
        
        {/* Right-click to link indicator */}
        {enableRightClickLinking && !isSourceForLinking && selectedSourceConceptForLinking && (
          <div className="absolute top-0 right-0 p-1.5 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-bl-md border border-blue-200 dark:border-blue-700 z-20">
            <span className="flex items-center">
              <span className="mr-1">Right-click to link</span>
              <LinkIcon className="h-3 w-3" />
            </span>
          </div>
        )}
        
        {/* Fixed header with action buttons - always visible */}
        <CardHeader className="pb-4 flex-shrink-0 relative z-10">
          <div className="flex justify-between items-start gap-2 mb-3">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleUpdate()
                    } else if (e.key === 'Escape') {
                      setEditedTitle(title || "")
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-lg font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 flex-1 focus:ring-2 focus:ring-primary focus:border-primary"
                  autoFocus
                  disabled={isSaving}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleTitleUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => {
                    setEditedTitle(title || "")
                    setIsEditingTitle(false)
                  }}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <CardTitle className="text-lg truncate flex-1 min-w-0 leading-tight">{title}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                  onClick={() => setIsEditingTitle(true)}
                  title="Edit title"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Delete button - fixed position, always visible */}
            <div className="flex items-center flex-shrink-0 z-20">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete concept"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {/* Badges and category section */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status badges */}
            {isPlaceholder && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700"
              >
                📌 Placeholder
              </Badge>
            )}
            
            {needsReview && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
              >
                Needs Review
              </Badge>
            )}
            
            {/* Category section */}
            {isEditingCategory ? (
              <div className="flex items-center space-x-1">
                {isLoadingCategories ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading categories...</span>
                  </div>
                ) : (
                  <Select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isSaving || isLoadingCategories}
                    className="text-xs min-w-[120px] max-w-[200px] h-8"
                  >
                    {availableCategories.map((cat) => (
                      <SelectOption 
                        key={cat.value} 
                        value={cat.value}
                        style={{ 
                          paddingLeft: `${cat.depth * 12 + 8}px`,
                          fontWeight: cat.isHierarchical ? 'normal' : 'bold'
                        }}
                      >
                        {cat.depth > 0 ? '└ ' : ''}{cat.label}
                        {cat.isLearned ? ' 🧠' : ''}
                      </SelectOption>
                    ))}
                  </Select>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={handleCategoryUpdate}
                  disabled={isSaving || isLoadingCategories}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => {
                    setSelectedCategory(category || "General")
                    setIsEditingCategory(false)
                  }}
                  disabled={isSaving || isLoadingCategories}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Badge 
                  className="hover:bg-primary/20 transition-colors"
                  title="Category - click edit button to change"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {category || "General"}
                  {/* Show learning indicator if this category was learned */}
                  {availableCategories.some(cat => cat.value === category && cat.isLearned) && (
                    <span className="ml-1" title="This category was learned from your usage patterns">🧠</span>
                  )}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    fetchCategories();
                    setIsEditingCategory(true);
                  }}
                  title="Edit category"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {showDescription && getDescriptionText() && (
            <CardDescription className="line-clamp-3 break-words mt-3 text-sm leading-relaxed">
              {getDescriptionText()}
            </CardDescription>
          )}
        </CardHeader>
        
        {/* Content area with scroll if needed */}
        <CardContent className="pb-4 space-y-4 flex-1 overflow-y-auto max-h-96">
          {/* Show enhancements if they exist */}
          {(concept.videoResources || concept.commonMistakes || concept.personalNotes) && (
            <div className="space-y-3 pt-3 border-t">
              {/* Video Resources */}
              {concept.videoResources && (() => {
                try {
                  const videos = JSON.parse(concept.videoResources);
                  return videos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Video className="mr-2 h-4 w-4" />
                        Video Resources ({videos.length})
                      </div>
                      <div className="space-y-1">
                        {videos.slice(0, 2).map((url: string, index: number) => (
                          <a 
                            key={index}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline truncate"
                            onClick={(e) => e.stopPropagation()}
                            title={url}
                          >
                            {url}
                          </a>
                        ))}
                        {videos.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{videos.length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
              
              {/* Common Mistakes */}
              {concept.commonMistakes && (() => {
                try {
                  const mistakes = JSON.parse(concept.commonMistakes);
                  return mistakes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Common Mistakes ({mistakes.length})
                      </div>
                      <div className="space-y-1">
                        {mistakes.slice(0, 2).map((mistake: string, index: number) => (
                          <div key={index} className="text-xs text-amber-700 dark:text-amber-300 break-words">
                            • {mistake}
                          </div>
                        ))}
                        {mistakes.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{mistakes.length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
              
              {/* Additional Notes */}
              {concept.personalNotes && (
                <div className="space-y-2">
                  <div className="flex items-center text-xs font-medium text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    Additional Notes
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                    {concept.personalNotes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {showRelatedConcepts && parsedRelatedConcepts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium">
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Related Concepts
              </div>
              <div className="flex flex-wrap gap-1">
                {parsedRelatedConcepts.map((related, i) => {
                  const { displayTitle, linkPath } = getRelatedConceptInfo(related);
                  const relatedId = typeof related === 'object' && related ? related.id : null;
                  
                  return (
                    <Badge key={i} variant="outline" className={`text-xs group relative pr-6 truncate ${
                      // Style broken references differently
                      (typeof related === 'object' && related?.id && !related?.title) 
                        ? 'border-destructive/30 bg-destructive/5 text-destructive' 
                        : ''
                    }`}>
                      {linkPath !== '#' ? (
                        <Link href={linkPath} className="truncate">
                          {displayTitle}
                        </Link>
                      ) : (
                        <span className="truncate">{displayTitle}</span>
                      )}
                      
                      {/* Delete relationship button - show for all related concepts */}
                      {(relatedId || (typeof related === 'string')) && (
                        <button 
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center text-destructive"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Show confirmation toast instead of dialog
                            toast({
                              title: "Remove Relationship?",
                              description: `Click confirm to remove relationship with "${displayTitle}"`,
                              action: (
                                <div className="flex gap-2">
                                  <button
                                    className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground text-xs font-medium h-8 px-3 hover:bg-destructive/90"
                                    onClick={async () => {
                                      try {
                                        let actualConceptId = relatedId;
                                        
                                        // If we have a string-based related concept, try to get its ID
                                        if (typeof related === 'string' && !relatedId) {
                                          try {
                                            const titleResponse = await fetch(`/api/concepts-by-title/${encodeURIComponent(related)}`, {
                                              headers: getAuthHeaders()
                                            });
                                            if (titleResponse.ok) {
                                              const conceptData = await titleResponse.json();
                                              if (conceptData && conceptData.id) {
                                                actualConceptId = conceptData.id;
                                              }
                                            }
                                          } catch (e) {
                                            // If we can't find the concept by title, use the title as ID
                                            actualConceptId = related;
                                          }
                                        }
                                        
                                        if (actualConceptId) {
                                          await handleDisconnectConcept(actualConceptId);
                                        } else {
                                          throw new Error('Could not determine concept ID for disconnection');
                                        }
                                      } catch (error) {
                                        console.error('Error removing relationship:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to remove relationship. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md border border-input bg-background text-xs font-medium h-8 px-3 hover:bg-accent"
                                    onClick={() => {
                                      // Toast will auto-dismiss
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ),
                              duration: 5000,
                            });
                          }}
                          title={`Remove relationship with ${displayTitle}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 flex justify-between border-t bg-muted/20 flex-shrink-0">
          {isPlaceholder ? (
            <div className="flex space-x-2">
              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Real Concept
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/review/${id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Review
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsConnectionDialogOpen(true);
                }}
                title="Connect to another concept"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/concept/${id}/enhance`);
                }}
                title="Add more details to this concept"
              >
                <Plus className="mr-2 h-4 w-4" />
                Enhance
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      <ConceptConnectionDialog
        isOpen={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        sourceConcept={{ id, title }}
        onConnect={handleConnectConcept}
      />
    </>
  )
})
