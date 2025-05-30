import { configureStore } from '@reduxjs/toolkit'
import categorySlice from './categorySlice'
import conceptSlice from './conceptSlice'

export const store = configureStore({
  reducer: {
    categories: categorySlice,
    concepts: conceptSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 