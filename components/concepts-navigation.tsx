import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
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

  // Calculate concept counts - include both direct concepts and subcategory concepts
  const calculateDirectCounts = (node: CategoryNode): number => {
    // Count direct concepts
    let totalCount = node.concepts.length
    
    // Add counts from all subcategories
    Object.values(node.subcategories).forEach(subNode => {
      totalCount += calculateDirectCounts(subNode)
    })
    
    // Set the total count for this node
    node.conceptCount = totalCount
    
    return totalCount
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
  
  // Flag to track when an operation is starting (to prevent race conditions)
  const [operationStarting, setOperationStarting] = useState(false)
  
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
    console.log('🔧 Resetting dialog state...')
    
    try {
      // Use flushSync to batch updates and prevent render loops
      flushSync(() => {
        // Reset all dialog visibility states
        setShowAddSubcategoryDialog(false)
        setShowTransferDialog(false)
        setShowEditCategoryDialog(false)
        setShowDragDropDialog(false)
        
        // Reset all form states
        setSelectedParentCategory('')
        setNewSubcategoryName('')
        setEditingCategoryPath('')
        setNewCategoryName('')
        setTransferConcepts([])
        setSelectedConceptsForTransfer(new Set())
        setDragDropData(null)
        
        // Reset loading states - this is crucial to prevent freezing
        setIsCreatingCategory(false)
        setIsMovingConcepts(false)
        setIsRenamingCategory(false)
        setIsDraggingCategory(false)
        setOperationStarting(false)
        
        // Reset inline editing state
        setInlineEditingCategory(null)
        setInlineEditValue('')
      })
      
      console.log('🔧 Dialog state reset complete')
    } catch (error) {
      console.error('🔧 Error resetting dialog state:', error)
      // Emergency fallback
      setShowAddSubcategoryDialog(false)
      setShowTransferDialog(false)
      setShowEditCategoryDialog(false)
      setShowDragDropDialog(false)
    }
  }, []) // Empty dependency array to prevent recreation

  // Enhanced emergency reset function that forces all dialogs closed and resets all states
  const forceResetAllStates = useCallback(() => {
    const resetStartTime = Date.now()
    console.log('🔧 [DEBUG] forceResetAllStates ENTRY - Emergency state cleanup started...', new Date().toISOString())
    
    console.log('🔧 [DEBUG] Step 1: About to cancel network requests...')
    // Cancel any ongoing operations immediately
    if (abortControllerRef.current) {
      try {
        console.log('🔧 [DEBUG] Aborting network requests...')
        abortControllerRef.current.abort()
      } catch (e) {
        console.warn('🔧 [DEBUG] Error aborting controller:', e)
      }
      abortControllerRef.current = null
      console.log('🔧 [DEBUG] ✅ Abort controller cleared')
    } else {
      console.log('🔧 [DEBUG] No abort controller to clear')
    }
    
    console.log('🔧 [DEBUG] Step 2: About to start flushSync batch...')
    // Use React's flushSync to batch all state updates and prevent render loops
    try {
      console.log('🔧 [DEBUG] Entering flushSync block...')
      
      // Batch all state resets in a single synchronous update
      flushSync(() => {
        console.log('🔧 [DEBUG] Inside flushSync - setting dialog states...')
        // Reset all dialog visibility states
        setShowAddSubcategoryDialog(false)
        setShowTransferDialog(false)
        setShowEditCategoryDialog(false)
        setShowDragDropDialog(false)
        
        console.log('🔧 [DEBUG] Inside flushSync - setting loading states...')
        // Reset all loading states - CRITICAL to prevent freezing
        setIsCreatingCategory(false)
        setIsMovingConcepts(false)
        setIsRenamingCategory(false)
        setIsDraggingCategory(false)
        setOperationStarting(false)
        
        console.log('🔧 [DEBUG] Inside flushSync - setting form states...')
        // Reset all form states
        setSelectedParentCategory('')
        setNewSubcategoryName('')
        setEditingCategoryPath('')
        setNewCategoryName('')
        setInlineEditingCategory(null)
        setInlineEditValue('')
        
        console.log('🔧 [DEBUG] Inside flushSync - setting complex states...')
        // Reset complex states
        setTransferConcepts([])
        setSelectedConceptsForTransfer(new Set())
        setDragDropData(null)
        
        console.log('🔧 [DEBUG] Inside flushSync - setting drag states...')
        // Reset drag and drop states
        setIsDraggingAny(false)
        setExpandedBeforeDrag(new Set())
        
        console.log('🔧 [DEBUG] flushSync block completed')
      })
      
      console.log('🔧 [DEBUG] flushSync completed successfully')
      console.log('🔧 [DEBUG] ✅ All states reset in batch')
      
      const totalTime = Date.now() - resetStartTime
      console.log('🔧 [DEBUG] ✅ FORCE RESET complete - all states cleared', `(${totalTime}ms)`)
      
    } catch (error) {
      console.error('🔧 [DEBUG] ❌ CRITICAL ERROR during force reset:', error)
      console.log('🔧 [DEBUG] Error occurred at:', Date.now() - resetStartTime, 'ms')
      
      // Emergency fallback - manually reset only critical states
      try {
        console.log('🔧 [DEBUG] Emergency fallback - clearing only critical loading states...')
        setIsCreatingCategory(false)
        setIsMovingConcepts(false)
        setIsRenamingCategory(false)
        setIsDraggingCategory(false)
        setOperationStarting(false)
        setShowAddSubcategoryDialog(false)
        setShowTransferDialog(false)
        setShowEditCategoryDialog(false)
        setShowDragDropDialog(false)
        console.log('🔧 [DEBUG] ✅ Emergency fallback complete')
      } catch (fallbackError) {
        console.error('🔧 [DEBUG] ❌ CRITICAL: Even emergency fallback failed:', fallbackError)
        // Last resort - reload the page
        console.log('🔧 [DEBUG] Last resort - reloading page...')
        setTimeout(() => window.location.reload(), 1000)
      }
    }
    
    console.log('🔧 [DEBUG] forceResetAllStates EXIT - function completed')
  }, []) // Empty dependency array to prevent recreation and potential loops

  // Enhanced dialog close handler with proper cleanup
  const handleDialogClose = useCallback((dialogType: string, force = false) => {
    console.log(`🔧 Closing ${dialogType} dialog...`, force ? '(FORCED)' : '')
    
    // Always cancel ongoing operations first
    if (abortControllerRef.current) {
      console.log('🔧 Cancelling ongoing operations during dialog close...')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    if (force) {
      // Force close - immediately reset everything with flushSync
      forceResetAllStates()
      return true
    }
    
    // Normal close - reset states properly
    resetDialogState()
    return true
  }, [resetDialogState, forceResetAllStates])

  // Simple cancel handler - just close the dialog, nothing complex
  const handleCancelCategoryCreation = useCallback(() => {
    console.log('🔧 Simple cancel - just closing dialog...')
    
    // Just close the dialog - that's it!
    setShowAddSubcategoryDialog(false)
    setShowTransferDialog(false)
    setShowEditCategoryDialog(false)
    setShowDragDropDialog(false)
    
    // Reset form fields
    setNewSubcategoryName('')
    setSelectedParentCategory('')
    
    console.log('🔧 ✅ Cancel completed - dialog closed')
  }, [])

  // New: Proper dialog open change handler that always allows closing
  const handleDialogOpenChange = useCallback((open: boolean, dialogType: string) => {
    console.log(`🔧 ${dialogType} dialog open state changing to:`, open)
    
    if (!open) {
      // Dialog is being closed - always allow this and reset states
      console.log(`🔧 ${dialogType} dialog closing - resetting all states`)
      handleDialogClose(dialogType, true) // Force close
      return true
    }
    
    // Dialog is being opened - check if we're already in a loading state
    if (isCreatingCategory || isMovingConcepts || isRenamingCategory) {
      console.log(`🔧 Preventing ${dialogType} dialog open - operation in progress`)
      toast({
        title: "Operation in Progress",
        description: "Please wait for the current operation to complete, or press Escape twice to force cancel.",
        duration: 4000,
      })
      return false
    }
    
    return true
  }, [isCreatingCategory, isMovingConcepts, isRenamingCategory, toast, handleDialogClose])

  // Safety mechanism: Auto-recovery from stuck states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    // If any loading state has been active for more than 30 seconds, force reset
    if (isCreatingCategory || isMovingConcepts || isRenamingCategory) {
      console.log('🔧 Loading state detected, setting safety timeout...')
      
      timeoutId = setTimeout(() => {
        console.warn('🔧 Safety timeout triggered - loading state stuck for 30 seconds')
        toast({
          title: "Operation Timeout",
          description: "The operation took too long and was automatically cancelled. You can try again.",
          variant: "destructive",
          duration: 5000,
        })
        forceResetAllStates()
      }, 30000) // 30 second safety timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isCreatingCategory, isMovingConcepts, isRenamingCategory, forceResetAllStates, toast])

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

  // Enhanced API call wrapper with abort support and error handling
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    // Create a new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const defaultOptions: RequestInit = {
        signal: abortController.signal,
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {})
        }
      }
      
      console.log(`🔧 Making API call to ${url}`, defaultOptions)
      
      const response = await fetch(url, defaultOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`🔧 API call to ${url} successful`, data)
      
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`🔧 API call to ${url} was aborted`)
        throw new Error('Operation was cancelled')
      }
      
      console.error(`🔧 API call to ${url} failed:`, error)
      throw error
    } finally {
      // Clear the abort controller if it's the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [getAuthHeaders])

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

  // Add refs to track ongoing operations and cancel them if needed
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Cancel any ongoing async operations
  const cancelOngoingOperations = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('🔧 Cancelling ongoing async operations...')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Enhanced createPlaceholderConcept with abort controller
  const createPlaceholderConcept = useCallback(async (category: string) => {
    const operationStartTime = Date.now()
    let currentStep = 'starting'
    
    console.log('🔧 CLIENT: createPlaceholderConcept started for category:', category, new Date().toISOString())
    
    // Cancel any previous operation
    if (abortControllerRef.current) {
      console.log('🔧 CLIENT: Cancelling previous operation before creating placeholder...')
      abortControllerRef.current.abort()
      console.log('🔧 CLIENT: ✅ Previous operation cancelled')
    }
    
    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    console.log('🔧 CLIENT: ✅ New abort controller created')
    
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      currentStep = 'setting timeout'
      console.log(`🔧 CLIENT: Step 1 - Setting operation timeout... (${Date.now() - operationStartTime}ms)`)
      
      // Set a timeout for this operation
      timeoutId = setTimeout(() => {
        console.warn('🔧 CLIENT: ❌ CreatePlaceholder timeout - aborting operation after 15s');
        if (abortController && !abortController.signal.aborted) {
          console.log('🔧 CLIENT: Triggering abort due to timeout...')
          abortController.abort()
        }
      }, 15000); // 15 second timeout for creation
      
      currentStep = 'testing connectivity'
      console.log(`🔧 CLIENT: Step 2 - Testing API connectivity... (${Date.now() - operationStartTime}ms)`)
      
      // Test connectivity first
      const connectivityOk = await testApiConnectivity()
      console.log(`🔧 CLIENT: ✅ API connectivity test result:`, connectivityOk, `(${Date.now() - operationStartTime}ms)`)
      
      currentStep = 'making API call'
      console.log(`🔧 CLIENT: Step 3 - Making API call to create placeholder... (${Date.now() - operationStartTime}ms)`)
      
      const requestBody = {
        title: `[Category: ${category}]`,
        category: category,
        summary: 'This is a placeholder concept created to organize your knowledge. You can delete this once you have real concepts in this category.',
        notes: '',
        isPlaceholder: true
      }
      
      console.log('🔧 CLIENT: Request body:', requestBody)
      
      // Use the new makeApiCall wrapper
      const data = await makeApiCall('/api/concepts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      currentStep = 'processing response'
      console.log(`🔧 CLIENT: ✅ API call successful, processing response... (${Date.now() - operationStartTime}ms)`)
      console.log('🔧 CLIENT: Response data:', data)
      
      currentStep = 'refreshing data'
      console.log(`🔧 CLIENT: Step 4 - Refreshing component data... (${Date.now() - operationStartTime}ms)`)
      
      // Refresh data to show the new category
      if (onDataRefresh) {
        await onDataRefresh()
        console.log(`🔧 CLIENT: ✅ Data refresh complete (${Date.now() - operationStartTime}ms)`)
      }
      
      const totalTime = Date.now() - operationStartTime
      console.log(`🔧 CLIENT: ✅ createPlaceholderConcept COMPLETE for "${category}" (TOTAL: ${totalTime}ms)`)
      
      return data
      
    } catch (error: any) {
      const totalTime = Date.now() - operationStartTime
      console.error(`🔧 CLIENT: ❌ Error in createPlaceholderConcept at step "${currentStep}":`, error, `(${totalTime}ms)`)
      
      if (error.message === 'Operation was cancelled') {
        console.log('🔧 CLIENT: Placeholder creation was cancelled')
        throw error
      }
      
      // Enhanced error handling
      let errorMessage = 'Failed to create category. Please try again.'
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Operation timed out. Please try again.'
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.'
      }
      
      console.error('🔧 CLIENT: Final error message:', errorMessage)
      throw new Error(errorMessage)
      
    } finally {
      const totalTime = Date.now() - operationStartTime
      console.log(`🔧 CLIENT: createPlaceholderConcept finally block - cleaning up... (${totalTime}ms)`)
      
      // Clear the timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log('🔧 CLIENT: ✅ Timeout cleared')
      }
      
      // Clear the abort controller
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
        console.log('🔧 CLIENT: ✅ Abort controller cleared')
      }
      
      console.log(`🔧 CLIENT: createPlaceholderConcept cleanup complete (${totalTime}ms)`)
    }
  }, [testApiConnectivity, makeApiCall, onDataRefresh])

  const handleCreateSubcategory = useCallback(async () => {
    // Prevent multiple concurrent operations
    if (isCreatingCategory || isMovingConcepts || operationStarting) {
      console.log('🔧 CLIENT: Operation already in progress, ignoring request')
      return
    }
    
    // Robust validation to prevent empty names
    if (!newSubcategoryName || !newSubcategoryName.trim()) {
      console.log('🔧 CLIENT: Validation failed - empty name')
      toast({
        title: "Invalid Name",
        description: "Category name cannot be empty. Please enter a valid name.",
        variant: "destructive",
        duration: 3000,
      })
      return // Don't reset isCreatingCategory here - just return
    }
    
    const trimmedName = newSubcategoryName.trim()
    
    // Additional validation for special characters or length
    if (trimmedName.length < 1) {
      console.log('🔧 CLIENT: Validation failed - name too short')
      toast({
        title: "Invalid Name",
        description: "Category name must contain at least one character.",
        variant: "destructive",
        duration: 3000,
      })
      return // Don't reset isCreatingCategory here - just return
    }
    
    console.log('🔧 CLIENT: Starting subcategory creation process...', {
      trimmedName,
      selectedParentCategory,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Set operation starting flag first to prevent dialog from closing
      console.log('🔧 CLIENT: Setting operationStarting to true...')
      setOperationStarting(true)
      
      // Small delay to ensure the flag is set before any dialog events
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Set loading state FIRST and log it
      console.log('🔧 CLIENT: Setting isCreatingCategory to true...')
      setIsCreatingCategory(true)
      
      // Clear the starting flag since main operation flag is now set
      setOperationStarting(false)
      
      // For top-level categories, use the name directly. For subcategories, use the full path
      const newCategoryPath = selectedParentCategory 
        ? `${selectedParentCategory} > ${trimmedName}`
        : trimmedName
      
      console.log('🔧 CLIENT: New category path will be:', newCategoryPath)
      
      // Check if category already exists
      if (conceptsByCategory[newCategoryPath]) {
        console.log('🔧 CLIENT: Category already exists, showing error')
        toast({
          title: "Category Exists",
          description: `Category "${newCategoryPath}" already exists.`,
          variant: "destructive",
          duration: 3000,
        })
        return // Will be handled in finally block
      }
      
      // Check if parent category has concepts (only applies to subcategories)
      if (selectedParentCategory) {
        const parentConcepts = conceptsByCategory[selectedParentCategory] || []
        
        if (parentConcepts.length > 0) {
          console.log('🔧 CLIENT: Parent has concepts, transitioning to transfer dialog...')
          // Ask user if they want to move concepts or create empty subcategory
          setTransferConcepts(parentConcepts)
          setShowTransferDialog(true)
          setShowAddSubcategoryDialog(false) // Close the current dialog
          return // Will be handled in finally block
        }
      }
      
      // Show loading feedback
      console.log('🔧 CLIENT: Showing loading toast...')
      toast({
        title: "Creating Category",
        description: `Creating "${newCategoryPath}"...`,
        duration: 2000,
      })
      
      // Create empty category/subcategory with a placeholder concept
      console.log('🔧 CLIENT: About to call createPlaceholderConcept...')
      await createPlaceholderConcept(newCategoryPath)
      console.log('🔧 CLIENT: createPlaceholderConcept completed successfully')
      
      // Select the new category to show it was created
      onCategorySelect(newCategoryPath)
      
      // Success feedback
      toast({
        title: "Category Created",
        description: `Successfully created "${newCategoryPath}"`,
        duration: 3000,
      })
      
      // Reset state and close dialog ONLY on success
      console.log('🔧 CLIENT: Resetting dialog state after successful creation...')
      resetDialogState()
      
    } catch (error) {
      console.error('🔧 CLIENT: Error in handleCreateSubcategory:', error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      // Don't call resetDialogState on error - keep dialog open so user can retry
    } finally {
      console.log('🔧 CLIENT: Finally block - resetting operation flags')
      setOperationStarting(false)
      setIsCreatingCategory(false)
    }
  }, [isCreatingCategory, isMovingConcepts, operationStarting, newSubcategoryName, selectedParentCategory, conceptsByCategory, toast, createPlaceholderConcept, onCategorySelect, resetDialogState])

  const handleTransferConcepts = useCallback(async (conceptsToMove: Concept[], targetCategory: string) => {
    if (isMovingConcepts) {
      return
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      setIsMovingConcepts(true)
      
      // Set a timeout to prevent indefinite loading states
      timeoutId = setTimeout(() => {
        console.warn('🔧 TransferConcepts timeout - resetting states');
        setIsCreatingCategory(false);
        setIsMovingConcepts(false);
        setIsRenamingCategory(false);
        toast({
          title: "Operation Timeout",
          description: "The concept move operation took too long and was cancelled. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }, 20000); // 20 second timeout for moves
      
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
      
    } catch (error: any) {
      console.error('Error moving concepts:', error)
      
      // Ensure we don't leave loading states active
      setIsCreatingCategory(false);
      setIsMovingConcepts(false);
      setIsRenamingCategory(false);
      
      let errorMessage = 'Failed to move concepts. Please try again.'
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Operation timed out. Please try again.'
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsMovingConcepts(false)
      
      // Clear the timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
              {/* Show total count when collapsed, hide when expanded (since subcategories will show individual counts) */}
              {!isExpanded && node.conceptCount > 0 && (
                <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs">
                  {node.conceptCount}
                </Badge>
              )}
            </Button>
          </div>
        )
      } else {
        // No subcategories - clickable category (same as before but hide 0 counts)
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
            {/* Only show count if greater than 0 */}
            {node.conceptCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {node.conceptCount}
              </Badge>
            )}
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

  // Simple escape key handler - just close dialogs
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔧 Escape pressed - closing dialogs')
        
        // Just close dialogs - simple!
        setShowAddSubcategoryDialog(false)
        setShowTransferDialog(false)
        setShowEditCategoryDialog(false)
        setShowDragDropDialog(false)
        
        // Reset form fields
        setNewSubcategoryName('')
        setSelectedParentCategory('')
        
        event.preventDefault()
        event.stopPropagation()
        
        console.log('🔧 ✅ Escape handled')
      }
    }

    // Only add listener when dialogs are open
    if (showAddSubcategoryDialog || showTransferDialog || showEditCategoryDialog || showDragDropDialog) {
      document.addEventListener('keydown', handleEscapeKey, true)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true)
    }
  }, [showAddSubcategoryDialog, showTransferDialog, showEditCategoryDialog, showDragDropDialog])

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      console.log('🔧 Component unmounting - cleaning up...')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  // Add global error handler to catch freezing issues
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🔧 Global error caught:', event.error)
      if (event.error?.message?.includes('freeze') || event.error?.message?.includes('hang')) {
        console.log('🔧 Potential freeze detected - force resetting states')
        forceResetAllStates()
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔧 Unhandled promise rejection:', event.reason)
      if (event.reason?.message?.includes('freeze') || event.reason?.name === 'AbortError') {
        console.log('🔧 Potential freeze from promise rejection - force resetting states')
        forceResetAllStates()
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [forceResetAllStates])

  // Simplified state monitoring - only log when things get stuck for too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    // Only monitor if there's actually a loading state active
    if (isCreatingCategory || isMovingConcepts || isRenamingCategory) {
      console.log('🔧 Operation started, setting safety timeout...')
      
      // Just set a simple timeout - no complex monitoring
      timeoutId = setTimeout(() => {
        console.warn('🔧 Operation taking too long (>10s) - might be stuck')
        // Don't auto-reset, just warn
      }, 10000) // 10 seconds
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isCreatingCategory, isMovingConcepts, isRenamingCategory])

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
          {/* Emergency Reset Button - Show when operations are taking too long */}
          {(isCreatingCategory || isMovingConcepts || isRenamingCategory) && (
            <Button
              variant="destructive"
              className="w-full justify-start text-sm h-8 mb-2"
              onClick={() => {
                console.log('🔧 Emergency reset button clicked')
                forceResetAllStates()
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Reset
            </Button>
          )}
          
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
      <Dialog 
        open={showAddSubcategoryDialog} 
        onOpenChange={(open) => {
          console.log('🔧 [SIMPLE] Dialog onOpenChange called with:', open)
          
          // Super simple - just allow the dialog to close
          if (!open) {
            console.log('🔧 [SIMPLE] Closing dialog - no complex logic')
            setShowAddSubcategoryDialog(false)
            setNewSubcategoryName('')
            setSelectedParentCategory('')
            console.log('🔧 [SIMPLE] Dialog closed successfully')
          }
        }}
      >
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
              onClick={handleCancelCategoryCreation}
              disabled={false} // Always allow cancellation
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
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      <Dialog 
        open={showTransferDialog} 
        onOpenChange={(open) => {
          console.log('🔧 [SIMPLE] Transfer Dialog onOpenChange:', open)
          if (!open) {
            setShowTransferDialog(false)
            setTransferConcepts([])
            setSelectedConceptsForTransfer(new Set())
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
            <DialogDescription>
              You're creating "{selectedParentCategory} {newSubcategoryName ? `> ${newSubcategoryName}` : '> [Enter name below]'}". What would you like to do with the {transferConcepts.length} existing concept(s) in "{transferConcepts[0]?.category}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Add the missing subcategory name input */}
            <div className="mb-4">
              <label className="text-sm font-medium">Subcategory Name:</label>
              <Input
                placeholder="Enter subcategory name..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                disabled={isCreatingCategory || isMovingConcepts}
                className="mt-1"
              />
              {newSubcategoryName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will create: "{selectedParentCategory} {'>'}  {newSubcategoryName}"
                </p>
              )}
            </div>
            
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
              onClick={handleCancelCategoryCreation}
              disabled={false} // Always allow cancellation
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog 
        open={showEditCategoryDialog} 
        onOpenChange={(open) => {
          console.log('🔧 [SIMPLE] Edit Dialog onOpenChange:', open)
          if (!open) {
            setShowEditCategoryDialog(false)
            setEditingCategoryPath('')
            setNewCategoryName('')
          }
        }}
      >
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
              onClick={handleCancelCategoryCreation}
              disabled={false} // Always allow cancellation
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
      <Dialog 
        open={showDragDropDialog} 
        onOpenChange={(open) => {
          console.log('🔧 [SIMPLE] DragDrop Dialog onOpenChange:', open)
          if (!open) {
            setShowDragDropDialog(false)
            setDragDropData(null)
          }
        }}
      >
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
              onClick={handleCancelCategoryCreation}
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