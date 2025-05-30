import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Processing...", 
  className = "" 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <div className="font-medium">Please wait</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Performance monitoring component for debugging
export function PerformanceMonitor({ 
  operationName, 
  onComplete 
}: { 
  operationName: string
  onComplete?: (duration: number) => void 
}) {
  React.useEffect(() => {
    const startTime = performance.now()
    console.log(`🚀 Operation started: ${operationName}`)
    
    return () => {
      const duration = performance.now() - startTime
      console.log(`✅ Operation completed: ${operationName} (${duration.toFixed(2)}ms)`)
      onComplete?.(duration)
    }
  }, [operationName, onComplete])
  
  return null
} 