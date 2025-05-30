"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useGlobalLoading } from '@/hooks/useGlobalLoading'

// Define the context type
type LoadingContextType = {
  isLoading: boolean
  startLoading: (operationId: string, description?: string) => () => void
  stopLoading: (operationId: string) => void
  resetLoading: () => void
}

// Create the context with default values
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => () => {},
  stopLoading: () => {},
  resetLoading: () => {}
})

// Custom hook to use the loading context
export const useLoading = () => useContext(LoadingContext)

// The provider component
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading
  } = useGlobalLoading()
  
  // Add a global cursor style when loading
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isLoading) {
        document.body.style.cursor = 'wait'
        // Add a class to make all buttons and interactive elements show wait cursor too
        document.body.classList.add('loading-cursor')
      } else {
        document.body.style.cursor = ''
        document.body.classList.remove('loading-cursor')
      }
    }
    
    // Auto-reset loading state after 10 seconds as a safety measure
    let timeout: NodeJS.Timeout
    if (isLoading) {
      timeout = setTimeout(() => {
        console.warn('🚨 Auto-resetting loading state after timeout')
        resetLoading()
      }, 10000) // 10 seconds timeout
    }
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isLoading, resetLoading])
  
  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, resetLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}
