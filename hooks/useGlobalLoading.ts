import { useState, useCallback, useEffect } from 'react'

// Define a type for the loading operation
export interface LoadingOperation {
  id: string
  description: string
  startTime: number
}

/**
 * Custom hook for managing global loading state across components
 */
export const useGlobalLoading = () => {
  // Track all active loading operations
  const [operations, setOperations] = useState<LoadingOperation[]>([])
  // Global loading state
  const [isLoading, setIsLoading] = useState(false)
  // For debugging - lets us see if an operation was started but never finished
  const [operationHistory, setOperationHistory] = useState<string[]>([])

  // Start a new loading operation
  const startLoading = useCallback((operationId: string, description: string = 'Loading...') => {
    console.log(`🔄 [GlobalLoading] Starting operation: ${operationId} (${description})`)
    
    setOperations(prev => [
      ...prev,
      {
        id: operationId,
        description,
        startTime: Date.now()
      }
    ])
    
    setOperationHistory(prev => [...prev, `START: ${operationId} at ${new Date().toISOString()}`])
    
    // Set global loading to true
    setIsLoading(true)
    
    // Return a function to stop this specific loading operation
    return () => stopLoading(operationId)
  }, [])

  // Stop a specific loading operation by ID
  const stopLoading = useCallback((operationId: string) => {
    console.log(`✅ [GlobalLoading] Stopping operation: ${operationId}`)
    
    setOperations(prev => prev.filter(op => op.id !== operationId))
    setOperationHistory(prev => [...prev, `STOP: ${operationId} at ${new Date().toISOString()}`])
  }, [])

  // Reset all loading states (emergency recovery)
  const resetLoading = useCallback(() => {
    console.log('🚨 [GlobalLoading] Emergency reset of all loading states')
    
    setOperations([])
    setIsLoading(false)
    setOperationHistory(prev => [...prev, `RESET: All operations at ${new Date().toISOString()}`])
  }, [])

  // Get details about current loading operations for debugging
  const getLoadingStatus = useCallback(() => {
    return {
      isLoading,
      activeOperations: operations,
      history: operationHistory
    }
  }, [isLoading, operations, operationHistory])

  // Update global loading state when operations change
  useEffect(() => {
    const hasOperations = operations.length > 0
    
    // Check for stuck operations (running for more than 10 seconds)
    const stuckOperations = operations.filter(op => {
      const runningTime = Date.now() - op.startTime
      return runningTime > 10000 // 10 seconds
    })
    
    if (stuckOperations.length > 0) {
      console.warn('⚠️ [GlobalLoading] Detected potentially stuck operations:', stuckOperations)
    }
    
    // Update the global loading state
    setIsLoading(hasOperations)
  }, [operations])

  return {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading,
    getLoadingStatus,
    activeOperations: operations
  }
}

// Create a single instance for global use
let globalLoadingInstance: ReturnType<typeof useGlobalLoading> | null = null

// Function to initialize the global instance (call this in _app.tsx or similar)
export const initGlobalLoading = (instance: ReturnType<typeof useGlobalLoading>) => {
  globalLoadingInstance = instance
}

// Helper to access the global instance from anywhere
export const getGlobalLoading = () => {
  if (!globalLoadingInstance) {
    console.error('Global loading not initialized! Call initGlobalLoading first.')
    // Return a dummy implementation to prevent crashes
    return {
      isLoading: false,
      startLoading: () => () => {},
      stopLoading: () => {},
      resetLoading: () => {},
      getLoadingStatus: () => ({ isLoading: false, activeOperations: [], history: [] }),
      activeOperations: []
    }
  }
  return globalLoadingInstance
}
