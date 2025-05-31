"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface AnalyzingViewProps {
  conversationText: string
  discoveredConcepts: string[]
  analysisStage: string
}

export function AnalyzingView({ 
  conversationText, 
  discoveredConcepts, 
  analysisStage 
}: AnalyzingViewProps) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  
  const analysisStages = [
    { name: "Initializing analysis...", progress: 0 },
    { name: "Processing conversation text...", progress: 15 },
    { name: "Identifying key concepts...", progress: 35 },
    { name: "Analyzing relationships...", progress: 55 },
    { name: "Categorizing concepts...", progress: 75 },
    { name: "Generating insights...", progress: 90 },
    { name: "Finalizing analysis...", progress: 100 }
  ]
  
  // Simulate realistic progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const targetProgress = analysisStages[currentStage]?.progress || 0
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress)
        }
        return prev
      })
    }, 100)
    
    const stageTimer = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < analysisStages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 3000) // Change stage every 3 seconds
    
    return () => {
      clearInterval(timer)
      clearInterval(stageTimer)
    }
  }, [currentStage, analysisStages.length])

  return (
    <motion.div 
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[60vh] flex flex-col items-center justify-center py-8"
    >
      {/* Main analyzing container */}
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Analysis progress section */}
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          {/* Conversation preview that fades out */}
          <motion.div
            initial={{ opacity: 1, height: "auto" }}
            animate={{ 
              opacity: [1, 0.5, 0],
              height: ["auto", "auto", "0px"]
            }}
            transition={{ duration: 2, times: [0, 0.7, 1] }}
            className="bg-muted/30 rounded-lg p-4 overflow-hidden"
          >
            <div className="font-mono text-xs text-left">
              {conversationText.substring(0, 300)}
              {conversationText.length > 300 && "..."}
            </div>
          </motion.div>

          {/* Main brain animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="relative flex justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="relative"
            >
              {/* Brain SVG */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Thinking dots around the brain */}
              <motion.div
                className="absolute -top-2 -right-1 h-2 w-2 rounded-full bg-blue-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
              <motion.div
                className="absolute -top-1 -right-3 h-1.5 w-1.5 rounded-full bg-green-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.3,
                }}
              />
              <motion.div
                className="absolute top-0 -left-2 h-1.5 w-1.5 rounded-full bg-purple-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.5,
                }}
              />
              <motion.div
                className="absolute -top-2 -left-1 h-1.5 w-1.5 rounded-full bg-yellow-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.7,
                }}
              />
            </motion.div>
          </motion.div>

          {/* Enhanced Progress bar with percentage */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
          
          {/* Progress percentage */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span className="font-medium">Analysis Progress</span>
            <motion.span
              key={Math.round(progress)}
              initial={{ scale: 1.2, color: "rgb(var(--primary))" }}
              animate={{ scale: 1, color: "rgb(var(--muted-foreground))" }}
              className="font-bold"
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Analysis status section - enhanced with stage indicators */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analysis in Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7] 
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse"
                    }}
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentStage}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {analysisStages[currentStage]?.name || analysisStage}
                    </motion.span>
                  </AnimatePresence>
                </div>
                
                {/* Stage indicators */}
                <div className="flex justify-between items-center">
                  {analysisStages.map((stage, index) => (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      <motion.div
                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                          index <= currentStage 
                            ? "bg-primary shadow-lg shadow-primary/50" 
                            : "bg-muted"
                        }`}
                        animate={{
                          scale: index === currentStage ? [1, 1.3, 1] : 1,
                        }}
                        transition={{ 
                          duration: index === currentStage ? 1.5 : 0.3,
                          repeat: index === currentStage ? Number.POSITIVE_INFINITY : 0,
                        }}
                      />
                      <div className="text-xs text-muted-foreground text-center max-w-16">
                        {stage.name.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">
                    We're analyzing your conversation to identify key concepts, relationships, and insights.
                    This may take a few moments...
                  </p>
                </div>
                
                {/* Show discovered concepts as they come in */}
                {discoveredConcepts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20"
                  >
                    <div className="text-sm font-medium text-primary mb-2">
                      Concepts Found: {discoveredConcepts.length}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {discoveredConcepts.slice(0, 8).map((concept, index) => (
                        <motion.span
                          key={concept}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        >
                          {concept}
                        </motion.span>
                      ))}
                      {discoveredConcepts.length > 8 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{discoveredConcepts.length - 8} more...
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 