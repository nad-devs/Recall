import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Types
interface Concept {
  id: string
  title: string
  summary?: string
  category: string
  isPlaceholder?: boolean
  needsReview?: boolean
}

interface CategoryState {
  // Data
  conceptsByCategory: Record<string, Concept[]>
  
  // Dialog states
  showAddSubcategoryDialog: boolean
  showTransferDialog: boolean
  showEditCategoryDialog: boolean
  showDragDropDialog: boolean
  
  // Form states
  selectedParentCategory: string
  newSubcategoryName: string
  editingCategoryPath: string
  newCategoryName: string
  transferConcepts: Concept[]
  selectedConceptsForTransfer: string[]
  
  // Loading states
  isCreatingCategory: boolean
  isMovingConcepts: boolean
  isRenamingCategory: boolean
  isResettingState: boolean
  
  // Drag and drop state
  dragDropData: {
    draggedCategoryPath: string
    targetCategoryPath: string | null
    targetCategoryName: string
  } | null
  
  // Error handling
  error: string | null
}

const initialState: CategoryState = {
  conceptsByCategory: {},
  showAddSubcategoryDialog: false,
  showTransferDialog: false,
  showEditCategoryDialog: false,
  showDragDropDialog: false,
  selectedParentCategory: '',
  newSubcategoryName: '',
  editingCategoryPath: '',
  newCategoryName: '',
  transferConcepts: [],
  selectedConceptsForTransfer: [],
  isCreatingCategory: false,
  isMovingConcepts: false,
  isRenamingCategory: false,
  isResettingState: false,
  dragDropData: null,
  error: null,
}

// ============ ASYNC OPERATIONS (These run in background!) ============

// Create category asynchronously
export const createCategoryAsync = createAsyncThunk(
  'categories/createCategory',
  async (params: { categoryPath: string; parentCategory?: string }) => {
    const { categoryPath, parentCategory } = params
    
    console.log('🔄 Redux: Creating category in background...', categoryPath)
    
    // Step 1: Create placeholder concept (ASYNC - doesn't block UI!)
    const response = await fetch('/api/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${categoryPath} Placeholder`,
        summary: `This is a placeholder concept for the ${categoryPath} category.`,
        category: categoryPath,
        isPlaceholder: true,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create category')
    }
    
    const newConcept = await response.json()
    console.log('✅ Redux: Category created successfully', newConcept)
    
    return { categoryPath, concept: newConcept }
  }
)

// Move concepts asynchronously
export const moveConceptsAsync = createAsyncThunk(
  'categories/moveConcepts',
  async (params: { conceptIds: string[]; targetCategory: string }) => {
    const { conceptIds, targetCategory } = params
    
    console.log('🔄 Redux: Moving concepts in background...', conceptIds.length, 'concepts to', targetCategory)
    
    // Move each concept (ASYNC - doesn't block UI!)
    const movePromises = conceptIds.map(async (conceptId) => {
      const response = await fetch(`/api/concepts/${conceptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: targetCategory }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to move concept ${conceptId}`)
      }
      
      return response.json()
    })
    
    const updatedConcepts = await Promise.all(movePromises)
    console.log('✅ Redux: Concepts moved successfully', updatedConcepts.length)
    
    return { conceptIds, targetCategory, updatedConcepts }
  }
)

// Rename category asynchronously
export const renameCategoryAsync = createAsyncThunk(
  'categories/renameCategory',
  async (params: { categoryPath: string[]; newName: string }) => {
    const { categoryPath, newName } = params
    
    console.log('🔄 Redux: Renaming category in background...', categoryPath, 'to', newName)
    
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'rename',
        categoryPath,
        newName
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to rename category')
    }
    
    console.log('✅ Redux: Category renamed successfully')
    return { oldPath: categoryPath.join(' > '), newName }
  }
)

// ============ REDUX SLICE (This manages state updates) ============

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    // Dialog management (INSTANT - no blocking!)
    openAddSubcategoryDialog: (state, action: PayloadAction<string>) => {
      state.showAddSubcategoryDialog = true
      state.selectedParentCategory = action.payload
      state.newSubcategoryName = ''
      // Close others
      state.showTransferDialog = false
      state.showEditCategoryDialog = false
      state.showDragDropDialog = false
    },
    
    openTransferDialog: (state, action: PayloadAction<Concept[]>) => {
      state.showTransferDialog = true
      state.transferConcepts = action.payload
      state.selectedConceptsForTransfer = action.payload.map(c => c.id)
      // Close others
      state.showAddSubcategoryDialog = false
      state.showEditCategoryDialog = false
      state.showDragDropDialog = false
    },
    
    closeAllDialogs: (state) => {
      state.showAddSubcategoryDialog = false
      state.showTransferDialog = false
      state.showEditCategoryDialog = false
      state.showDragDropDialog = false
    },
    
    // Form updates (INSTANT!)
    setNewSubcategoryName: (state, action: PayloadAction<string>) => {
      state.newSubcategoryName = action.payload
    },
    
    setSelectedConceptsForTransfer: (state, action: PayloadAction<string[]>) => {
      state.selectedConceptsForTransfer = action.payload
    },
    
    // Data updates
    updateConceptsByCategory: (state, action: PayloadAction<Record<string, Concept[]>>) => {
      state.conceptsByCategory = action.payload
    },
    
    // Reset everything
    resetAllState: (state) => {
      return { ...initialState, conceptsByCategory: state.conceptsByCategory }
    },
  },
  
  // Handle async operation states (AUTOMATIC - Redux does this for you!)
  extraReducers: (builder) => {
    // Create category
    builder
      .addCase(createCategoryAsync.pending, (state) => {
        state.isCreatingCategory = true
        state.error = null
        console.log('🔄 Redux: Category creation started')
      })
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        state.isCreatingCategory = false
        state.showAddSubcategoryDialog = false
        console.log('✅ Redux: Category creation completed')
      })
      .addCase(createCategoryAsync.rejected, (state, action) => {
        state.isCreatingCategory = false
        state.error = action.error.message || 'Failed to create category'
        console.log('❌ Redux: Category creation failed', action.error.message)
      })
    
    // Move concepts
    builder
      .addCase(moveConceptsAsync.pending, (state) => {
        state.isMovingConcepts = true
        state.error = null
        console.log('🔄 Redux: Concept moving started')
      })
      .addCase(moveConceptsAsync.fulfilled, (state, action) => {
        state.isMovingConcepts = false
        state.showTransferDialog = false
        console.log('✅ Redux: Concept moving completed')
      })
      .addCase(moveConceptsAsync.rejected, (state, action) => {
        state.isMovingConcepts = false
        state.error = action.error.message || 'Failed to move concepts'
        console.log('❌ Redux: Concept moving failed', action.error.message)
      })
    
    // Rename category
    builder
      .addCase(renameCategoryAsync.pending, (state) => {
        state.isRenamingCategory = true
        state.error = null
        console.log('🔄 Redux: Category renaming started')
      })
      .addCase(renameCategoryAsync.fulfilled, (state, action) => {
        state.isRenamingCategory = false
        state.showEditCategoryDialog = false
        console.log('✅ Redux: Category renaming completed')
      })
      .addCase(renameCategoryAsync.rejected, (state, action) => {
        state.isRenamingCategory = false
        state.error = action.error.message || 'Failed to rename category'
        console.log('❌ Redux: Category renaming failed', action.error.message)
      })
  },
})

export const {
  openAddSubcategoryDialog,
  openTransferDialog,
  closeAllDialogs,
  setNewSubcategoryName,
  setSelectedConceptsForTransfer,
  updateConceptsByCategory,
  resetAllState,
} = categorySlice.actions

export default categorySlice.reducer 