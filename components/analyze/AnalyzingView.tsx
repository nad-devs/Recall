"use client"

import { motion } from "framer-motion"

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

          {/* Progress bar */}
          <motion.div className="w-full max-w-md mx-auto">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              transition={{ delay: 2, duration: 1, ease: "easeInOut" }}
              className="h-1 bg-primary/50 rounded-full"
            />
          </motion.div>
        </div>

        {/* Analysis status section - simplified without fake concepts */}
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
                  <span>{analysisStage}</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">
                    We're analyzing your conversation to identify key concepts, relationships, and insights.
                    This may take a few moments...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 