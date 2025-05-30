"use client"

import { useLoading } from "@/contexts/LoadingContext"
import { Loader2 } from "lucide-react"

/**
 * A global loading overlay that displays when operations are in progress
 */
export function LoadingOverlay() {
  const { isLoading } = useLoading()
  
  if (!isLoading) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center justify-center p-6 bg-background/80 rounded-lg shadow-lg backdrop-blur-sm
                       pointer-events-auto opacity-90 border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <div className="text-sm font-medium">Processing...</div>
      </div>
    </div>
  )
}
