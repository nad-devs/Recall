import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Concept {
  id: string
  title: string
  summary?: string
  category: string
  isPlaceholder?: boolean
  needsReview?: boolean
}

interface ConceptState {
  concepts: Concept[]
  selectedConcept: Concept | null
  isLoading: boolean
}

const initialState: ConceptState = {
  concepts: [],
  selectedConcept: null,
  isLoading: false,
}

const conceptSlice = createSlice({
  name: 'concepts',
  initialState,
  reducers: {
    setConcepts: (state, action: PayloadAction<Concept[]>) => {
      state.concepts = action.payload
    },
    setSelectedConcept: (state, action: PayloadAction<Concept | null>) => {
      state.selectedConcept = action.payload
    },
  },
})

export const { setConcepts, setSelectedConcept } = conceptSlice.actions
export default conceptSlice.reducer 