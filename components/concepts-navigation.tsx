import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  BookOpen, 
  Brain,
  Code,
  Database,
  Globe,
  Layers,
  AlertTriangle,
  Clock,
  Star,
  Plus,
  FolderPlus,
  MoreHorizontal,
  ArrowRight,
  Edit,
  Check,
  X,
  GripVertical
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDrag, useDrop } from 'react-dnd'

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
  isPlaceholder?: boolean
}

/**
 * Interface defining the properties for the ConceptsNavigation component.
 * This component handles the display and management of concepts organized by categories.
 */
interface ConceptsNavigationProps {
  /** Array of all concepts to be displayed */
  concepts: Concept[]
  /** Object mapping category names to arrays of concepts */
  conceptsByCategory: Record<string, Concept[]>
  /** Array of category names in sorted order */
  sortedCategories: string[]
  /** Current search query string */
  searchQuery: string
  /** Callback function when search query changes */
  onSearchChange: (query: string) => void
  /** Callback function when a category is selected */
  onCategorySelect: (category: string | null) => void
  /** Currently selected category */
  selectedCategory: string | null
  /** Whether to show concepts that need review */
  showNeedsReview: boolean
  /** Callback function to toggle needs review filter */
  onNeedsReviewToggle: () => void
  /** Optional callback for moving concepts between categories */
  onConceptsMove?: (conceptIds: string[], newCategory: string) => void
  /** Optional callback to refresh data */
  onDataRefresh?: () => Promise<void>
  /** Optional CSS class name for styling */
  className?: string
}

interface CategoryNode {
  name: string
  fullPath: string
  concepts: Concept[]
  subcategories: Record<string, CategoryNode>
  conceptCount: number
}

// Dynamic hierarchy builder - parses actual category strings into tree structure
const buildCategoryHierarchy = (conceptsByCategory: Record<string, Concept[]>) => {
  const root: CategoryNode = {
    name: 'root',
    fullPath: '',
    concepts: [],
    subcategories: {},
    conceptCount: 0
  }

  // Process each category
  Object.entries(conceptsByCategory).forEach(([categoryPath, concepts]) => {
    const parts = categoryPath.split(' > ').map(part => part.trim())
    let currentNode = root

    // Build the path in the tree
    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1
      const fullPath = parts.slice(0, index + 1).join(' > ')

      if (!currentNode.subcategories[part]) {
        currentNode.subcategories[part] = {
          name: part,
          fullPath: fullPath,
          concepts: [],
          subcategories: {},
          conceptCount: 0
        }
      }

      currentNode = currentNode.subcategories[part]

      // If this is the exact category, add the concepts here
      if (isLastPart) {
        currentNode.concepts = concepts
      }
    })
  })

  // Calculate concept counts - only direct concepts, not subcategories
  const calculateDirectCounts = (node: CategoryNode): void => {
    node.conceptCount = node.concepts.length
    Object.values(node.subcategories).forEach(calculateDirectCounts)
  }

  Object.values(root.subcategories).forEach(calculateDirectCounts)

  // Simple duplicate elimination: Remove top-level categories that also exist as subcategories
  const topLevelNames = Object.keys(root.subcategories)
  const subcategoryNames = new Set<string>()
  
  // Collect all subcategory names
  Object.values(root.subcategories).forEach(node => {
    Object.keys(node.subcategories).forEach(subName => {
      subcategoryNames.add(subName)
    })
  })
  
  // Filter out top-level categories that are also subcategories (unless they have direct concepts)
  const filteredHierarchy: Record<string, CategoryNode> = {}
  
  Object.entries(root.subcategories).forEach(([name, node]) => {
    const isAlsoSubcategory = subcategoryNames.has(name)
    const hasDirectConcepts = node.concepts.length > 0
    
    if (!isAlsoSubcategory || hasDirectConcepts) {
      filteredHierarchy[name] = node
    }
  })
  
  return filteredHierarchy
}

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase()
  if (lower.includes('algorithm') || lower.includes('data structures')) return Code
  if (lower.includes('backend') || lower.includes('database')) return Database
  if (lower.includes('frontend') || lower.includes('react')) return Layers
  if (lower.includes('cloud') || lower.includes('aws')) return Globe
  if (lower.includes('machine learning') || lower.includes('ai') || lower.includes('deep learning')) return Brain
  return BookOpen
}

/**
 * ConceptsNavigation Component
 * 
 * A navigation component that displays and manages concepts organized by categories.
 * Features include:
 * - Category-based organization
 * - Search functionality
 * - Drag and drop concept management
 * - Category creation and editing
 * - Needs review filtering
 * 
 * @param props - ConceptsNavigationProps object containing component configuration
 * @returns React component for concept navigation
 */
export function ConceptsNavigation({ 
  concepts, 
  conceptsByCategory, 
  sortedCategories, 
  searchQuery, 
  onSearchChange, 
  onCategorySelect, 
  selectedCategory,
  showNeedsReview,
  onNeedsReviewToggle,
  onConceptsMove,
  onDataRefresh,
  className = ""
}: ConceptsNavigationProps) {
  const { toast } = useToast()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Backend Engineering', 'Data Structures', 'Computer Science'])
  )
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false)
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferConcepts, setTransferConcepts] = useState<Concept[]>([])
  const [selectedConceptsForTransfer, setSelectedConceptsForTransfer] = useState<Set<string>>(new Set())
  
  // Category editing state
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [editingCategoryPath, setEditingCategoryPath] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // Loading states to prevent page freezing
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isMovingConcepts, setIsMovingConcepts] = useState(false)
  const [isRenamingCategory, setIsRenamingCategory] = useState(false)
  
  // Drag and drop state
  const [isDraggingCategory, setIsDraggingCategory] = useState(false)
  const [isDraggingAny, setIsDraggingAny] = useState(false)
  const [expandedBeforeDrag, setExpandedBeforeDrag] = useState<Set<string>>(new Set())
  
  // Inline editing state
  const [inlineEditingCategory, setInlineEditingCategory] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState('')
  
  // Drag and drop confirmation dialog state
  const [showDragDropDialog, setShowDragDropDialog] = useState(false)
  const [dragDropData, setDragDropData] = useState<{
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null>(null)
  

  
  // Build dynamic hierarchy from actual categories
  const categoryHierarchy = useMemo(() => buildCategoryHierarchy(conceptsByCategory), [conceptsByCategory])

  // Calculate stats
  const totalConcepts = concepts.length
  const needsReviewCount = concepts.filter(c => c.needsReview).length

  // Simple drag handlers - expand all on drag start, restore on drag end
  const handleDragStart = useCallback(() => {
    console.log('🚀 Drag started - expanding all categories')
    setIsDraggingAny(true)
    // Save current expanded state
    setExpandedBeforeDrag(new Set(expandedCategories))
    // Expand all categories that have subcategories
    const allCategoriesWithSubs = new Set<string>()
    Object.values(categoryHierarchy).forEach(node => {
      const addCategoriesWithSubs = (n: CategoryNode) => {
        if (Object.keys(n.subcategories).length > 0) {
          allCategoriesWithSubs.add(n.fullPath)
        }
        Object.values(n.subcategories).forEach(addCategoriesWithSubs)
      }
      addCategoriesWithSubs(node)
    })
    setExpandedCategories(allCategoriesWithSubs)
  }, [expandedCategories, categoryHierarchy])

  const handleDragEnd = useCallback(() => {
    console.log('🏁 Drag ended - restoring original expanded state')
    setIsDraggingAny(false)
    // Restore original expanded state
    setExpandedCategories(expandedBeforeDrag)
    setExpandedBeforeDrag(new Set())
  }, [expandedBeforeDrag])



  const toggleCategory = useCallback((categoryPath: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryPath)) {
      newExpanded.delete(categoryPath)
    } else {
      newExpanded.add(categoryPath)
    }
    setExpandedCategories(newExpanded)
  }, [expandedCategories])

  const handleAddSubcategory = useCallback((parentCategory: string) => {
    // Prevent opening dialog if already processing
    if (isCreatingCategory || isMovingConcepts) {
      return
    }
    
    setSelectedParentCategory(parentCategory)
    setNewSubcategoryName('')
    setShowAddSubcategoryDialog(true)
  }, [isCreatingCategory, isMovingConcepts])

  const handleAddTopLevelCategory = useCallback(() => {
    // Prevent opening dialog if already processing
    if (isCreatingCategory || isMovingConcepts) {
      return
    }
    
    setSelectedParentCategory('') // Empty string for top-level categories
    setNewSubcategoryName('')
    setShowAddSubcategoryDialog(true)
  }, [isCreatingCategory, isMovingConcepts])

  // Centralized function to reset all dialog-related state
  const resetDialogState = useCallback(() => {
    setShowAddSubcategoryDialog(false)
    setShowTransferDialog(false)
    setShowEditCategoryDialog(false)
    setShowDragDropDialog(false)
    setSelectedParentCategory('')
    setNewSubcategoryName('')
    setEditingCategoryPath('')
    setNewCategoryName('')
    setTransferConcepts([])
    setSelectedConceptsForTransfer(new Set())
    setDragDropData(null)
    // Reset loading states
    setIsCreatingCategory(false)
    setIsMovingConcepts(false)
    setIsRenamingCategory(false)
  }, [])

  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      console.log('🔧 Environment check:')
      console.log('🔧 - window.location.origin:', window.location.origin)
      console.log('🔧 - window.location.href:', window.location.href)
      console.log('🔧 - process.env.NODE_ENV:', process.env.NODE_ENV)
      console.log('🔧 - process.env.NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL)
      console.log('🔧 Auth check - userEmail:', userEmail ? 'present' : 'missing')
      console.log('🔧 Auth check - userId:', userId ? 'present' : 'missing')
      
      // For email-based sessions
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
        console.log('🔧 Added email-based auth headers')
      } else {
        console.warn('🔧 No authentication data found in localStorage')
      }
    } else {
      console.log('🔧 Server-side environment, no localStorage available')
    }
    
    return headers
  }

  // Robust API call utility that works in both dev and production
  const makeApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const fullUrl = `${baseUrl}${endpoint}`
    
    // Add cache-busting parameter to prevent cached redirects
    const separator = endpoint.includes('?') ? '&' : '?'
    const cacheBustEndpoint = `${endpoint}${separator}_t=${Date.now()}`
    const cacheBustFullUrl = `${fullUrl}${separator}_t=${Date.now()}`
    
    console.log('🔧 Making API call to:', endpoint)
    console.log('🔧 Cache-bust endpoint:', cacheBustEndpoint)
    console.log('🔧 Full URL:', fullUrl)
    console.log('🔧 Options:', options)
    
    // Ensure headers include cache control
    const enhancedOptions = {
      ...options,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers
      }
    }
    
    try {
      // First try with relative path (preferred)
      const response = await fetch(cacheBustEndpoint, enhancedOptions)
      console.log('🔧 Response status:', response.status)
      console.log('🔧 Response URL:', response.url)
      
      if (response.ok) {
        return response
      }
      
      // If relative path fails and we get a redirect or error, try with full URL
      if (response.status === 401 || response.status === 404) {
        console.log('🔧 Relative path failed, trying full URL...')
        const fullResponse = await fetch(cacheBustFullUrl, enhancedOptions)
        console.log('🔧 Full URL response status:', fullResponse.status)
        return fullResponse
      }
      
      return response
    } catch (error) {
      console.error('🔧 API call error:', error)
      // If fetch fails completely, try with full URL as fallback
      console.log('🔧 Fetch failed, trying full URL as fallback...')
      return await fetch(cacheBustFullUrl, enhancedOptions)
    }
  }, [])

  // Test API connectivity
  const testApiConnectivity = useCallback(async () => {
    try {
      console.log('🔧 Testing API connectivity...')
      const response = await fetch('/api/concepts', {
        method: 'GET',
        headers: getAuthHeaders()
      })
      console.log('🔧 API test response status:', response.status)
      console.log('🔧 API test response URL:', response.url)
      return response.ok
    } catch (error) {
      console.error('🔧 API connectivity test failed:', error)
      return false
    }
  }, [])

  // Enhanced createPlaceholderConcept with connectivity test
  const createPlaceholderConcept = useCallback(async (category: string) => {
    try {
      // First test API connectivity
      const isConnected = await testApiConnectivity()
      if (!isConnected) {
        console.warn('🔧 API connectivity test failed, but proceeding anyway...')
      }
      
      const headers = getAuthHeaders()
      console.log('🔧 Creating placeholder concept for category:', category)
      console.log('🔧 Using headers:', headers)
      console.log('🔧 Current window location:', typeof window !== 'undefined' ? window.location.href : 'server-side')
      
      const response = await makeApiCall('/api/concepts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: "📌 Add Concepts Here",
          category: category,
          summary: "This is a placeholder concept. It will be automatically removed when you add your first real concept to this category.",
          details: "Click 'Add Concept' or move concepts from other categories to get started. This placeholder will disappear once you have real content.",
          isPlaceholder: true
        })
      })
      
      console.log('🔧 Response status:', response.status)
      console.log('🔧 Response URL:', response.url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔧 Error response:', errorData)
        
        // If we get a 401, it might be an auth issue - let's provide more helpful error
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please refresh the page and try again. Your session may have expired.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Authentication failed. Please refresh the page and try again.')
        } else if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Rate limited')
        }
        
        throw new Error(errorData.error || 'Failed to create placeholder concept')
      }
      
      const data = await response.json()
      console.log('🔧 Success response:', data)
      
      // Refresh the data to show the new placeholder concept
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error creating placeholder concept:', error)
      throw error // Re-throw to be handled by calling function
    }
  }, [onDataRefresh, makeApiCall, testApiConnectivity])

  const handleCreateSubcategory = useCallback(async () => {
    // Prevent multiple concurrent operations
    if (isCreatingCategory || isMovingConcepts) {
      return
    }
    
    // Robust validation to prevent empty names
    if (!newSubcategoryName || !newSubcategoryName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    const trimmedName = newSubcategoryName.trim()
    
    // Additional validation for special characters or length
    if (trimmedName.length < 1) {
      toast({
        title: "Invalid Name",
        description: "Category name must contain at least one character.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    try {
      setIsCreatingCategory(true)
      
      // For top-level categories, use the name directly. For subcategories, use the full path
      const newCategoryPath = selectedParentCategory 
        ? `${selectedParentCategory} > ${trimmedName}`
        : trimmedName
      
      // Check if category already exists
      if (conceptsByCategory[newCategoryPath]) {
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }
      
      // Check if parent category has concepts (only applies to subcategories)
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          // Ask user if they want to move concepts or create empty subcategory
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          return
        }
      }
      
      // Show loading feedback
      toast({
        title: "Creating Category",
        description: `Creating "${newCategoryPath}"...`,
        duration: 2000,
      })
      
      // Create empty category/subcategory with a placeholder concept
      await createPlaceholderConcept(newCategoryPath)
      
      // Select the new category to show it was created
      onCategorySelect(newCategoryPath)
      
      // Success feedback
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 3000,
      })
      
      // Reset state and close dialog
      resetDialogState()
      
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }, [isCreatingCategory, isMovingConcepts, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, resetDialogState])

  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts) {
      return
    }
    
    try {
      setIsMovingConcepts(true)
      
      toast({
        title: "Moving Concepts",
        description: `Moving ${conceptsToMove.length} concept(s) to "${targetCategory}"...`,
        duration: 2000,
      })
      
      if (onConceptsMove) {
        const conceptIds = conceptsToMove.map(c => c.id)
        await onConceptsMove(conceptIds, targetCategory)
      }
      
      toast({
        title: "Concepts Moved",
        description: `Successfully moved ${conceptsToMove.length} concept(s) to "${targetCategory}"`,
        duration: 3000,
      })
      
      // Select the target category to show the result
      onCategorySelect(targetCategory)
      
      resetDialogState()
      
    } catch (error) {
      console.error('Error moving concepts:', error)
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsMovingConcepts(false)
    }
  }, [isMovingConcepts, toast, onConceptsMove, onCategorySelect, resetDialogState])

  const handleEditCategory = useCallback((categoryPath: string) => {
    // Prevent opening dialog if already processing
    if (isRenamingCategory || isCreatingCategory || isMovingConcepts) {
      return
    }
    
    setEditingCategoryPath(categoryPath)
    // Extract just the category name (last part after the last " > ")
    const categoryName = categoryPath.includes(' > ') 
      ? categoryPath.split(' > ').pop() || '' 
      : categoryPath
    setNewCategoryName(categoryName)
    setShowEditCategoryDialog(true)
  }, [isRenamingCategory, isCreatingCategory, isMovingConcepts])

  const handleRenameCategoryConfirm = useCallback(async () => {
    if (isRenamingCategory) {
      return
    }
    
    // Validate the new name
    if (!newCategoryName || !newCategoryName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const trimmedName = newCategoryName.trim()
    
    if (trimmedName.length < 1) {
      toast({
        title: "Invalid Name",
        description: "Category name must contain at least one character.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      setIsRenamingCategory(true)
      
      // Construct the new category path
      const oldPath = editingCategoryPath
      const pathParts = oldPath.split(' > ')
      pathParts[pathParts.length - 1] = trimmedName
      const newPath = pathParts.join(' > ')

      // Check if new path already exists
      if (conceptsByCategory[newPath] && newPath !== oldPath) {
        toast({
          title: "Category Exists",
          description: `Category "${newPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Get all concepts in this category
      const conceptsToUpdate = conceptsByCategory[oldPath] || []
      
      if (conceptsToUpdate.length === 0) {
        toast({
          title: "No Concepts Found",
          description: "This category has no concepts to update.",
          variant: "destructive",
          duration: 3000,
        })
        resetDialogState()
        return
      }

      toast({
        title: "Renaming Category",
        description: `Renaming "${oldPath}" to "${newPath}"...`,
        duration: 2000,
      })

      // Update each concept's category
      const updatePromises = conceptsToUpdate.map(concept => 
        fetch(`/api/concepts/${concept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...concept,
            category: newPath
          })
        })
      )

      await Promise.all(updatePromises)

      // Refresh data
      if (onDataRefresh) {
        await onDataRefresh()
      }

      // Select the new category
      onCategorySelect(newPath)

      toast({
        title: "Category Renamed",
        description: `Successfully renamed "${oldPath}" to "${newPath}"`,
        duration: 3000,
      })

      resetDialogState()
    } catch (error) {
      console.error('Error renaming category:', error)
      toast({
        title: "Error",
        description: "Failed to rename category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRenamingCategory(false)
    }
  }, [isRenamingCategory, newCategoryName, editingCategoryPath, conceptsByCategory, toast, resetDialogState, onDataRefresh, onCategorySelect])

  // Inline editing handlers
  const startInlineEdit = useCallback((categoryPath: string) => {
    const categoryName = categoryPath.includes(' > ') 
      ? categoryPath.split(' > ').pop() || '' 
      : categoryPath;
    setInlineEditingCategory(categoryPath);
    setInlineEditValue(categoryName);
  }, []);

  const cancelInlineEdit = useCallback(() => {
    setInlineEditingCategory(null);
    setInlineEditValue('');
  }, []);

  const saveInlineEdit = useCallback(async () => {
    if (!inlineEditingCategory || !inlineEditValue.trim()) {
      cancelInlineEdit();
      return;
    }
    
    const trimmedName = inlineEditValue.trim();
    const oldPath = inlineEditingCategory;
    const pathParts = oldPath.split(' > ');
    pathParts[pathParts.length - 1] = trimmedName;
    const newPath = pathParts.join(' > ');
    
    if (newPath === oldPath) {
      cancelInlineEdit();
      return;
    }
    
    // Check if new path already exists
    if (conceptsByCategory[newPath]) {
      toast({
        title: "Category Exists",
        description: `Category "${newPath}" already exists.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsRenamingCategory(true);
      
      // Call the API to rename the category
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          categoryPath: oldPath.split(' > '),
          newName: trimmedName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename category');
      }
      
      // Refresh data
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      // Select the new category
      onCategorySelect(newPath);
      
      toast({
        title: "Category Renamed",
        description: `Successfully renamed "${oldPath}" to "${newPath}"`,
        duration: 3000,
      });
      
      cancelInlineEdit();
      
    } catch (error) {
      console.error('Error renaming category:', error);
      toast({
        title: "Error",
        description: "Failed to rename category. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRenamingCategory(false);
    }
  }, [inlineEditingCategory, inlineEditValue, conceptsByCategory, toast, onDataRefresh, onCategorySelect, cancelInlineEdit]);

  // Drag and drop handlers
  const handleCategoryDrop = useCallback(async (draggedCategoryPath: string, targetCategoryPath: string | null) => {
    if (draggedCategoryPath === targetCategoryPath) return;
    
    // Prevent dropping a category into itself or its descendants
    if (targetCategoryPath && targetCategoryPath.startsWith(draggedCategoryPath + ' > ')) {
      toast({
        title: "Invalid Move",
        description: "Cannot move a category into its own subcategory.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Show confirmation dialog with different options based on target
    const targetName = targetCategoryPath 
      ? targetCategoryPath.split(' > ').pop() || 'Unknown'
      : 'Root Level';
    
    setDragDropData({
      draggedCategoryPath,
      targetCategoryPath,
      targetCategoryName: targetName
    });
    setShowDragDropDialog(true);
  }, [toast]);

  const executeCategoryMove = useCallback(async (draggedCategoryPath: string, targetCategoryPath: string | null) => {
    try {
      setIsDraggingCategory(true);
      
      // Parse the dragged category path
      const draggedPathParts = draggedCategoryPath.split(' > ');
      const targetPathParts = targetCategoryPath ? targetCategoryPath.split(' > ') : [];
      
      toast({
        title: "Moving Category",
        description: `Moving "${draggedCategoryPath}" to ${targetCategoryPath || 'root level'}...`,
        duration: 2000,
      });
      
      // Call the API to move the category
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          categoryPath: draggedPathParts,
          newParentPath: targetPathParts.length > 0 ? targetPathParts : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to move category');
      }
      
      // Refresh data
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      toast({
        title: "Category Moved",
        description: `Successfully moved "${draggedCategoryPath}" to ${targetCategoryPath || 'root level'}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error moving category:', error);
      toast({
        title: "Error",
        description: "Failed to move category. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDraggingCategory(false);
    }
  }, [toast, onDataRefresh]);

  // Move concepts from one category to another (without renaming target)
  const moveConceptsToCategory = useCallback(async (sourceCategoryPath: string, targetCategoryPath: string) => {
    try {
      setIsDraggingCategory(true);
      
      // Get concepts from the source category
      const sourceConcepts = conceptsByCategory[sourceCategoryPath] || [];
      
      if (sourceConcepts.length === 0) {
        toast({
          title: "No Concepts Found",
          description: `No concepts found in "${sourceCategoryPath}" to move.`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      toast({
        title: "Moving Concepts",
        description: `Moving ${sourceConcepts.length} concept(s) from "${sourceCategoryPath}" to "${targetCategoryPath}"...`,
        duration: 2000,
      });
      
      // Move concepts using the existing onConceptsMove function
      if (onConceptsMove) {
        const conceptIds = sourceConcepts.map(c => c.id);
        await onConceptsMove(conceptIds, targetCategoryPath);
      }
      
      // Refresh data
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      toast({
        title: "Concepts Moved",
        description: `Successfully moved ${sourceConcepts.length} concept(s) to "${targetCategoryPath}"`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error moving concepts:', error);
      toast({
        title: "Error",
        description: "Failed to move concepts. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDraggingCategory(false);
    }
  }, [conceptsByCategory, toast, onConceptsMove, onDataRefresh]);

  // Drop zone for empty space (root level drops)
  const [{ isOverEmptySpace }, dropEmptySpace] = useDrop(() => ({
    accept: 'CATEGORY',
    drop: (item: { categoryPath: string }, monitor) => {
      // Only handle if not dropped on a specific category
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
      handleCategoryDrop(item.categoryPath, null)
    },
    collect: (monitor) => ({
      isOverEmptySpace: !!monitor.isOver({ shallow: true }),
    }),
  }), [handleCategoryDrop])

  // Separate memoized component for category nodes to handle drag and drop properly
  const CategoryNodeComponent = React.memo(({ 
    node, 
    depth, 
    isExpanded, 
    isSelected, 
    isInlineEditing,
    onToggleCategory,
    onCategorySelect,
    onAddSubcategory,
    onStartInlineEdit,
    onSaveInlineEdit,
    onCancelInlineEdit,
    onSetTransferConcepts,
    onShowTransferDialog,
    inlineEditValue,
    onSetInlineEditValue,
    isCreatingCategory,
    isMovingConcepts,
    isRenamingCategory,
    handleCategoryDrop,
    onDragStart,
    onDragEnd,
    isDraggingAny
  }: {
    node: CategoryNode
    depth: number
    isExpanded: boolean
    isSelected: boolean
    isInlineEditing: boolean
    onToggleCategory: (path: string) => void
    onCategorySelect: (path: string) => void
    onAddSubcategory: (path: string) => void
    onStartInlineEdit: (path: string) => void
    onSaveInlineEdit: () => void
    onCancelInlineEdit: () => void
    onSetTransferConcepts: (concepts: Concept[]) => void
    onShowTransferDialog: (show: boolean) => void
    inlineEditValue: string
    onSetInlineEditValue: (value: string) => void
    isCreatingCategory: boolean
    isMovingConcepts: boolean
    isRenamingCategory: boolean
    handleCategoryDrop: (draggedPath: string, targetPath: string | null) => void
    onDragStart: () => void
    onDragEnd: () => void
    isDraggingAny: boolean
  }) => {
    const hasSubcategories = Object.keys(node.subcategories).length > 0
    const hasDirectConcepts = node.concepts.length > 0
    const Icon = getCategoryIcon(node.name)

    // Drag source setup
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'CATEGORY',
      item: () => {
        // Call onDragStart when drag begins
        if (!isDraggingAny) {
          onDragStart()
        }
        return { categoryPath: node.fullPath }
      },
      end: () => {
        // Call onDragEnd when drag ends
        if (isDraggingAny) {
          onDragEnd()
        }
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: !isCreatingCategory && !isMovingConcepts && !isRenamingCategory && !isInlineEditing,
    }), [node.fullPath, isCreatingCategory, isMovingConcepts, isRenamingCategory, isInlineEditing, isDraggingAny, onDragStart, onDragEnd])



    // Drop target setup
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'CATEGORY',
      drop: (item: { categoryPath: string }, monitor) => {
        // Only handle if this is the most specific drop target
        if (monitor.isOver({ shallow: true })) {
          handleCategoryDrop(item.categoryPath, node.fullPath)
        }
      },
      canDrop: (item: { categoryPath: string }) => {
        // Prevent dropping on itself or its descendants
        return item.categoryPath !== node.fullPath && 
               !node.fullPath.startsWith(item.categoryPath + ' > ')
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }), [node.fullPath, handleCategoryDrop])

    const CategoryContent = () => {
      if (isInlineEditing) {
        return (
          <div className="flex items-center flex-1" style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
            <GripVertical className="mr-1 h-4 w-4 text-muted-foreground" />
            <Icon className="mr-2 h-4 w-4" />
            <Input
              value={inlineEditValue}
              onChange={(e) => onSetInlineEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveInlineEdit()
                } else if (e.key === 'Escape') {
                  onCancelInlineEdit()
                }
              }}
              onBlur={onSaveInlineEdit}
              className="h-6 text-sm flex-1 mr-2"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onSaveInlineEdit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onCancelInlineEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }

      if (hasSubcategories) {
        // Has subcategories - make whole row clickable for viewing direct concepts
        return (
          <div className="flex items-center flex-1" style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
            <GripVertical className="mr-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Dropdown arrow for expand/collapse */}
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="p-1 h-6 w-6 hover:bg-muted/50 mr-1"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            {/* Clickable category name for viewing direct concepts */}
            <Button
              variant={isSelected ? "secondary" : "ghost"}
              className={`flex-1 justify-start h-auto hover:bg-muted/30 ${
                depth === 0 ? 'font-medium p-2' : 'font-normal text-sm p-1.5'
              } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-primary/10' : ''}`}
              onClick={() => {
                onCategorySelect(node.fullPath)
                // Auto-expand when viewing concepts to show subcategories too
                if (hasSubcategories && !isExpanded) {
                  onToggleCategory(node.fullPath)
                }
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="truncate">{node.name}</span>
              <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs">
                {node.concepts.length}
              </Badge>
            </Button>
          </div>
        )
      } else {
        // No subcategories - clickable category (same as before)
        return (
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            className={`flex-1 justify-start h-auto hover:bg-muted/30 ${
              depth === 0 ? 'font-medium p-2' : 'font-normal text-sm p-1.5'
            } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-primary/10' : ''}`}
            style={{ paddingLeft: `${(depth * 16) + 8}px` }}
            onClick={() => onCategorySelect(node.fullPath)}
          >
            <GripVertical className="mr-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="mr-2 h-4 w-4" />
            <span className="truncate">{node.name}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {node.conceptCount}
            </Badge>
          </Button>
        )
      }
    }

    return (
      <div ref={(el) => {
        drag(el)
        drop(el)
      }}>
        <Collapsible open={isExpanded} onOpenChange={() => onToggleCategory(node.fullPath)}>
          <div className={`flex items-center group ${isOver && canDrop ? 'bg-primary/5' : ''}`}>
            <CategoryContent />
            
            {/* Category Actions Menu */}
            {!isInlineEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory || isDragging}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onAddSubcategory(node.fullPath)}
                    disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStartInlineEdit(node.fullPath)}
                    disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Name
                  </DropdownMenuItem>
                  {hasDirectConcepts && (
                    <DropdownMenuItem 
                      onClick={() => {
                        onSetTransferConcepts(node.concepts)
                        onShowTransferDialog(true)
                      }}
                      disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Move Concepts
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {hasSubcategories && (
            <CollapsibleContent>
              {/* Render subcategories */}
              {Object.values(node.subcategories)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(subNode => (
                  <CategoryNodeComponent
                    key={subNode.fullPath}
                    node={subNode}
                    depth={depth + 1}
                    isExpanded={expandedCategories.has(subNode.fullPath)}
                    isSelected={selectedCategory === subNode.fullPath}
                    isInlineEditing={inlineEditingCategory === subNode.fullPath}
                    onToggleCategory={onToggleCategory}
                    onCategorySelect={onCategorySelect}
                    onAddSubcategory={onAddSubcategory}
                    onStartInlineEdit={onStartInlineEdit}
                    onSaveInlineEdit={onSaveInlineEdit}
                    onCancelInlineEdit={onCancelInlineEdit}
                    onSetTransferConcepts={onSetTransferConcepts}
                    onShowTransferDialog={onShowTransferDialog}
                    inlineEditValue={inlineEditValue}
                    onSetInlineEditValue={onSetInlineEditValue}
                    isCreatingCategory={isCreatingCategory}
                    isMovingConcepts={isMovingConcepts}
                    isRenamingCategory={isRenamingCategory}
                    handleCategoryDrop={handleCategoryDrop}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    isDraggingAny={isDraggingAny}
                  />
                ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    )
  })

  const renderCategoryNode = useCallback((node: CategoryNode, depth: number = 0) => {
    // Don't render if no concepts
    if (node.conceptCount === 0) return null

    return (
      <CategoryNodeComponent
        key={node.fullPath}
        node={node}
        depth={depth}
        isExpanded={expandedCategories.has(node.fullPath)}
        isSelected={selectedCategory === node.fullPath}
        isInlineEditing={inlineEditingCategory === node.fullPath}
        onToggleCategory={toggleCategory}
        onCategorySelect={onCategorySelect}
        onAddSubcategory={handleAddSubcategory}
        onStartInlineEdit={startInlineEdit}
        onSaveInlineEdit={saveInlineEdit}
        onCancelInlineEdit={cancelInlineEdit}
        onSetTransferConcepts={setTransferConcepts}
        onShowTransferDialog={setShowTransferDialog}
        inlineEditValue={inlineEditValue}
        onSetInlineEditValue={setInlineEditValue}
        isCreatingCategory={isCreatingCategory}
        isMovingConcepts={isMovingConcepts}
        isRenamingCategory={isRenamingCategory}
        handleCategoryDrop={handleCategoryDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        isDraggingAny={isDraggingAny}
      />
    )
  }, [expandedCategories, selectedCategory, inlineEditingCategory, inlineEditValue, toggleCategory, onCategorySelect, handleAddSubcategory, startInlineEdit, saveInlineEdit, cancelInlineEdit, setTransferConcepts, setShowTransferDialog, setInlineEditValue, isCreatingCategory, isMovingConcepts, isRenamingCategory, handleCategoryDrop, handleDragStart, handleDragEnd, isDraggingAny])

  return (
    <div className={`w-80 bg-card border-r border-border h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Navigate Concepts
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{totalConcepts}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{Object.keys(conceptsByCategory).length}</div>
            <div className="text-muted-foreground">Categories</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Quick Filters</h3>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null && !showNeedsReview ? "secondary" : "ghost"}
            className="w-full justify-start text-sm h-8"
            onClick={() => {
              onCategorySelect(null)
              if (showNeedsReview) onNeedsReviewToggle()
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            All Concepts
            <Badge variant="secondary" className="ml-auto">
              {totalConcepts}
            </Badge>
          </Button>
          
          <Button
            variant={showNeedsReview ? "secondary" : "ghost"}
            className="w-full justify-start text-sm h-8"
            onClick={onNeedsReviewToggle}
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
            Needs Review
            <Badge variant="secondary" className="ml-auto">
              {needsReviewCount}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Dynamic Categories */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        ref={(el) => {
          dropEmptySpace(el)
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={handleAddTopLevelCategory}
            disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
            title={isCreatingCategory || isMovingConcepts || isRenamingCategory ? "Please wait for current operation to complete" : "Add new category"}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className={`space-y-1 min-h-32 ${isOverEmptySpace ? 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg p-2' : ''}`}>
          {Object.values(categoryHierarchy).length > 0 ? (
            Object.values(categoryHierarchy)
              .sort((a, b) => a.name.localeCompare(b.name))
              .filter(node => node.conceptCount > 0) // Only show categories with concepts
              .map(node => renderCategoryNode(node, 0)) // Only render top-level (depth 0)
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FolderPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm mb-1">No categories yet</p>
              <p className="text-xs">Click the + button above to create your first category</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subcategory Dialog */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={(open) => {
        if (!open && !isCreatingCategory) {
          resetDialogState()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedParentCategory ? 'Add Subcategory' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedParentCategory 
                ? `Create a new subcategory under "${selectedParentCategory}"`
                : 'Create a new top-level category'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={selectedParentCategory ? "Enter subcategory name..." : "Enter category name..."}
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isCreatingCategory && handleCreateSubcategory()}
              disabled={isCreatingCategory}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Will create: "{selectedParentCategory ? `${selectedParentCategory} > ${newSubcategoryName}` : newSubcategoryName}"
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetDialogState}
              disabled={isCreatingCategory}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubcategory} 
              disabled={!newSubcategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                selectedParentCategory ? 'Create Subcategory' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Concepts Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={(open) => {
        if (!open && !isMovingConcepts) {
          resetDialogState()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
            <DialogDescription>
              You're creating "{selectedParentCategory} {newSubcategoryName ? `> ${newSubcategoryName}` : ''}". What would you like to do with the {transferConcepts.length} existing concept(s) in "{transferConcepts[0]?.category}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Existing concepts in {transferConcepts[0]?.category}:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isMovingConcepts || isCreatingCategory}
                  onClick={() => {
                    const allSelected = selectedConceptsForTransfer.size === transferConcepts.length
                    if (allSelected) {
                      setSelectedConceptsForTransfer(new Set())
                    } else {
                      setSelectedConceptsForTransfer(new Set(transferConcepts.map(c => c.id)))
                    }
                  }}
                >
                  {selectedConceptsForTransfer.size === transferConcepts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              {transferConcepts.map(concept => (
                <div 
                  key={concept.id} 
                  className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                    selectedConceptsForTransfer.has(concept.id) 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'hover:bg-muted/50'
                  } ${isMovingConcepts || isCreatingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isMovingConcepts || isCreatingCategory) return
                    
                    const newSelected = new Set(selectedConceptsForTransfer)
                    if (newSelected.has(concept.id)) {
                      newSelected.delete(concept.id)
                    } else {
                      newSelected.add(concept.id)
                    }
                    setSelectedConceptsForTransfer(newSelected)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedConceptsForTransfer.has(concept.id)}
                      onChange={() => {}} // Handled by parent onClick
                      className="w-4 h-4"
                      disabled={isMovingConcepts || isCreatingCategory}
                    />
                    <span className="font-medium">{concept.title}</span>
                  </div>
                  <Badge variant="outline">{concept.category}</Badge>
                </div>
              ))}
              {transferConcepts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedConceptsForTransfer.size} of {transferConcepts.length} concepts selected
                </p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose an option:</h4>
              
              {/* Create empty subcategory */}
              <div className="p-3 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <Button
                  variant="default"
                  className="w-full justify-start text-sm h-10 bg-green-600 hover:bg-green-700"
                  disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                  onClick={async () => {
                    // Validate name before proceeding
                    if (!newSubcategoryName || !newSubcategoryName.trim()) {
                      toast({
                        title: "Invalid Name",
                        description: "Category name cannot be empty. Please enter a valid name.",
                        variant: "destructive",
                        duration: 3000,
                      })
                      return
                    }
                    
                    setIsCreatingCategory(true)
                    try {
                      const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                      await createPlaceholderConcept(newCategory)
                      // Select the new category to show it was created
                      onCategorySelect(newCategory)
                      
                      toast({
                        title: "Category Created",
                        description: `Successfully created "${newCategory}"`,
                        duration: 3000,
                      })
                      
                      // Reset all state and close dialogs
                      resetDialogState()
                    } catch (error) {
                      console.error('Error creating empty subcategory:', error)
                      toast({
                        title: "Error",
                        description: "Failed to create category. Please try again.",
                        variant: "destructive",
                        duration: 3000,
                      })
                    } finally {
                      setIsCreatingCategory(false)
                    }
                  }}
                >
                  {isCreatingCategory ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create Empty Subcategory
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Create the subcategory with a placeholder concept. You can add real concepts later and the placeholder will be automatically removed.
                </p>
              </div>
              
              {/* Move selected concepts to new subcategory */}
              {selectedConceptsForTransfer.size > 0 && (
                <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-10 border-purple-300 hover:bg-purple-100"
                    disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                    onClick={async () => {
                      // Validate name before proceeding
                      if (!newSubcategoryName || !newSubcategoryName.trim()) {
                        toast({
                          title: "Invalid Name",
                          description: "Category name cannot be empty. Please enter a valid name.",
                          variant: "destructive",
                          duration: 3000,
                        })
                        return
                      }
                      
                      setIsCreatingCategory(true)
                      setIsMovingConcepts(true)
                      try {
                        const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                        // First create the subcategory with placeholder
                        await createPlaceholderConcept(newCategory)
                        // Then move selected concepts to it (this will remove the placeholder)
                        const selectedConcepts = transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
                        await handleTransferConcepts(selectedConcepts, newCategory)
                      } catch (error) {
                        console.error('Error creating subcategory with selected concepts:', error)
                        toast({
                          title: "Error",
                          description: "Failed to create category and move concepts. Please try again.",
                          variant: "destructive",
                          duration: 3000,
                        })
                      } finally {
                        setIsCreatingCategory(false)
                        setIsMovingConcepts(false)
                      }
                    }}
                  >
                    {(isCreatingCategory || isMovingConcepts) ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Move Selected Concepts to New Subcategory ({selectedConceptsForTransfer.size})
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Move only the {selectedConceptsForTransfer.size} selected concept(s) to the new subcategory
                  </p>
                </div>
              )}
              
              {/* Move concepts to new subcategory */}
              <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm h-10 border-blue-300 hover:bg-blue-100"
                  disabled={isCreatingCategory || isMovingConcepts || !newSubcategoryName.trim()}
                  onClick={async () => {
                    // Validate name before proceeding
                    if (!newSubcategoryName || !newSubcategoryName.trim()) {
                      toast({
                        title: "Invalid Name",
                        description: "Category name cannot be empty. Please enter a valid name.",
                        variant: "destructive",
                        duration: 3000,
                      })
                      return
                    }
                    
                    setIsCreatingCategory(true)
                    setIsMovingConcepts(true)
                    try {
                      const newCategory = `${selectedParentCategory} > ${newSubcategoryName.trim()}`
                      // First create the subcategory with placeholder
                      await createPlaceholderConcept(newCategory)
                      // Then move all concepts to it (this will remove the placeholder)
                      await handleTransferConcepts(transferConcepts, newCategory)
                    } catch (error) {
                      console.error('Error creating subcategory with all concepts:', error)
                      toast({
                        title: "Error",
                        description: "Failed to create category and move concepts. Please try again.",
                        variant: "destructive",
                        duration: 3000,
                      })
                    } finally {
                      setIsCreatingCategory(false)
                      setIsMovingConcepts(false)
                    }
                  }}
                >
                  {(isCreatingCategory || isMovingConcepts) ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Move All Concepts to New Subcategory
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Move all {transferConcepts.length} concepts to the new subcategory
                </p>
              </div>
              
              {/* Move to other existing categories */}
              <details className={`border rounded-lg ${isCreatingCategory || isMovingConcepts ? 'opacity-50' : ''}`}>
                <summary className="p-3 cursor-pointer text-sm font-medium">
                  {selectedConceptsForTransfer.size > 0 
                    ? `Move selected concepts (${selectedConceptsForTransfer.size}) to existing category`
                    : 'Or move concepts to existing category'
                  }
                </summary>
                <div className="px-3 pb-3 space-y-1 max-h-32 overflow-y-auto">
                  {Object.keys(conceptsByCategory)
                    .filter(category => category !== (transferConcepts[0]?.category))
                    .map(category => (
                      <Button
                        key={category}
                        variant="ghost"
                        className="w-full justify-start text-sm h-8"
                        disabled={isCreatingCategory || isMovingConcepts}
                        onClick={() => {
                          const conceptsToMove = selectedConceptsForTransfer.size > 0 
                            ? transferConcepts.filter(c => selectedConceptsForTransfer.has(c.id))
                            : transferConcepts
                          handleTransferConcepts(conceptsToMove, category)
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                </div>
              </details>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetDialogState}
              disabled={isCreatingCategory || isMovingConcepts}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={(open) => {
        if (!open && !isRenamingCategory) {
          resetDialogState()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Name</DialogTitle>
            <DialogDescription>
              Rename "{editingCategoryPath}" to a new name. This will update all concepts in this category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isRenamingCategory && handleRenameCategoryConfirm()}
              disabled={isRenamingCategory}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {editingCategoryPath.includes(' > ') ? (
                <>Will rename to: "{editingCategoryPath.split(' > ').slice(0, -1).join(' > ')} {newCategoryName ? `> ${newCategoryName}` : ''}"</>
              ) : (
                <>Will rename to: "{newCategoryName}"</>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetDialogState}
              disabled={isRenamingCategory}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameCategoryConfirm} 
              disabled={!newCategoryName.trim() || isRenamingCategory}
            >
              {isRenamingCategory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Renaming...
                </>
              ) : (
                'Rename Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag and Drop Confirmation Dialog */}
      <Dialog open={showDragDropDialog} onOpenChange={(open) => {
        if (!open && !isDraggingCategory) {
          resetDialogState()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Category</DialogTitle>
            <DialogDescription>
              {dragDropData && (
                <>
                  You're moving "<strong>{dragDropData.draggedCategoryPath}</strong>" 
                  {dragDropData.targetCategoryPath 
                    ? ` to "${dragDropData.targetCategoryPath}"`
                    : " to the root level"
                  }. 
                  Where would you like to place the concepts?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {dragDropData && (
              <>
                {/* When dropping on an EXISTING category - show two options */}
                {dragDropData.targetCategoryPath ? (
                  <>
                    {/* Option 1: Move concepts INTO the existing target category */}
                    <div className="p-3 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                      <Button
                        variant="default"
                        className="w-full justify-start text-sm h-10 bg-green-600 hover:bg-green-700"
                        disabled={isDraggingCategory}
                        onClick={async () => {
                          // Move concepts to the existing target category (don't rename it)
                          await moveConceptsToCategory(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath!);
                          resetDialogState();
                        }}
                      >
                        {isDraggingCategory ? (
                          <>
                            <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Moving...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Put in "{dragDropData.targetCategoryName}"
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        All concepts will be moved into the existing "{dragDropData.targetCategoryPath}" category
                      </p>
                    </div>
                    
                    {/* Option 2: Create subcategory UNDER the target */}
                    <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm h-10 border-blue-300 hover:bg-blue-100"
                        disabled={isDraggingCategory}
                        onClick={async () => {
                          await executeCategoryMove(dragDropData.draggedCategoryPath, dragDropData.targetCategoryPath);
                          resetDialogState();
                        }}
                      >
                        {isDraggingCategory ? (
                          <>
                            <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Moving...
                          </>
                        ) : (
                          <>
                            <Layers className="mr-2 h-4 w-4" />
                            Put as "{dragDropData.targetCategoryName} {'>'}  {dragDropData.draggedCategoryPath.split(' > ').pop()}"
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        This will create: "{dragDropData.targetCategoryPath} {'>'}  {dragDropData.draggedCategoryPath.split(' > ').pop()}"
                      </p>
                    </div>
                  </>
                ) : (
                  /* When dropping on EMPTY SPACE - only show create root option */
                  <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                    <Button
                      variant="default"
                      className="w-full justify-start text-sm h-10 bg-purple-600 hover:bg-purple-700"
                      disabled={isDraggingCategory}
                      onClick={async () => {
                        await executeCategoryMove(dragDropData.draggedCategoryPath, null);
                        resetDialogState();
                      }}
                    >
                      {isDraggingCategory ? (
                        <>
                          <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Moving...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Create new root category "{dragDropData.draggedCategoryPath.split(' > ').pop()}"
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      This will create "{dragDropData.draggedCategoryPath.split(' > ').pop()}" as a top-level category
                    </p>
                  </div>
                )}
                
                {/* Show current structure for context */}
                <div className="p-3 border rounded-lg bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Current structure:</h4>
                  <p className="text-sm text-muted-foreground">
                    Moving: <code className="bg-muted px-1 rounded">{dragDropData.draggedCategoryPath}</code>
                  </p>
                  {dragDropData.targetCategoryPath && (
                    <p className="text-sm text-muted-foreground">
                      Target: <code className="bg-muted px-1 rounded">{dragDropData.targetCategoryPath}</code>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetDialogState}
              disabled={isDraggingCategory}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 