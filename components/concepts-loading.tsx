"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Brain, Search, Zap, Tag, Lightbulb } from "lucide-react"

interface ConceptsLoadingProps {
  onComplete?: () => void
}

export function ConceptsLoading({ onComplete }: ConceptsLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Brain, text: "Analyzing your knowledge base..." },
    { icon: Search, text: "Fetching concepts..." },
    { icon: Tag, text: "Organizing by categories..." },
    { icon: BookOpen, text: "Preparing concept cards..." },
    { icon: Lightbulb, text: "Connecting related ideas..." },
    { icon: Zap, text: "Almost ready..." },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setTimeout(() => onComplete?.(), 500)
          return 100
        }
        return prev + 5
      })
    }, 80)

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 300)

    return () => {
      clearInterval(timer)
      clearInterval(stepTimer)
    }
  }, [onComplete, steps.length])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background animated particles */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            animate={{
              x: [0, (i % 5) * 20 - 40],
              y: [0, (i % 4) * 20 - 30],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: (i % 2) * 0.5,
            }}
            style={{
              left: `${(i * 4) % 100}%`,
              top: `${(i * 3.5) % 100}%`,
            }}
          />
        ))}
      </div>

      {/* Floating concept bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`bubble-${i}`}
            className="absolute w-16 h-16 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center"
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 20, 0],
              rotate: [0, 360],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
            style={{
              left: `${15 + (i * 12)}%`,
              top: `${20 + Math.sin(i * 2) * 30}%`,
            }}
          >
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {i % 4 === 0 && <BookOpen className="w-6 h-6 text-primary/30" />}
              {i % 4 === 1 && <Brain className="w-6 h-6 text-primary/30" />}
              {i % 4 === 2 && <Tag className="w-6 h-6 text-primary/30" />}
              {i % 4 === 3 && <Lightbulb className="w-6 h-6 text-primary/30" />}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="text-center z-10 relative">
        {/* Main loading spinner */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="w-28 h-28 border-4 border-muted rounded-full mx-auto relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-3 border-transparent border-t-primary/60 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 border-2 border-transparent border-t-primary/40 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </motion.div>

          {/* Center icon with pulse effect */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            key={currentStep}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
              }}
              transition={{ 
                duration: 2, 
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            >
              {steps[currentStep]?.icon &&
                (() => {
                  const IconComponent = steps[currentStep].icon
                  return <IconComponent className="w-10 h-10 text-primary" />
                })()}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Loading text with typewriter effect */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8"
          >
            <motion.h2 
              className="text-3xl font-bold text-foreground mb-3"
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            >
              {steps[currentStep]?.text}
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Building your personalized knowledge experience
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced progress bar */}
        <motion.div 
          className="w-96 mx-auto mb-6"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span className="font-medium">Loading concepts</span>
            <motion.span
              key={Math.round(progress)}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-bold text-primary"
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Step indicators */}
        <div className="flex justify-center space-x-3 mb-8">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentStep 
                  ? "bg-primary shadow-lg shadow-primary/50" 
                  : index < currentStep 
                    ? "bg-primary/60" 
                    : "bg-muted"
              }`}
              animate={{
                scale: index === currentStep ? [1, 1.3, 1] : 1,
                opacity: index === currentStep ? [0.7, 1, 0.7] : index < currentStep ? 0.8 : 0.4,
              }}
              transition={{ 
                duration: index === currentStep ? 1 : 0.3,
                repeat: index === currentStep ? Number.POSITIVE_INFINITY : 0,
              }}
            />
          ))}
        </div>

        {/* Floating concept keywords */}
        <div className="absolute inset-0 pointer-events-none">
          {["Machine Learning", "Data Structures", "Algorithms", "React", "TypeScript", "Design Patterns"].map((keyword, i) => (
            <motion.div
              key={keyword}
              className="absolute text-xs font-medium text-primary/20 bg-primary/5 px-2 py-1 rounded-full border border-primary/10"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.7, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: i * 1.2,
              }}
              style={{
                left: `${10 + (i * 15)}%`,
                top: `${60 + Math.sin(i) * 20}%`,
              }}
            >
              {keyword}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 