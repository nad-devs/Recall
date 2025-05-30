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
    <div className="global-loading-overlay">
      <div className="flex flex-col items-center justify-center p-6 bg-background/80 rounded-lg shadow-lg backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <div className="text-sm font-medium">Please wait...</div>
      </div>
    </div>
  )
}
