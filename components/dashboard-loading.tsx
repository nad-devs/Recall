"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, BookOpen, BarChart3, TrendingUp, Users, Calendar, Target, Zap } from "lucide-react"

interface DashboardLoadingProps {
  onComplete?: () => void
}

export function DashboardLoading({ onComplete }: DashboardLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [dataLoaded, setDataLoaded] = useState({
    conversations: false,
    concepts: false,
    categories: false,
    dashboard: false
  })

  const steps = [
    { icon: Brain, text: "Initializing your dashboard..." },
    { icon: BookOpen, text: "Loading conversations..." },
    { icon: Target, text: "Fetching concepts..." },
    { icon: Users, text: "Organizing your data..." },
    { icon: TrendingUp, text: "Preparing dashboard..." },
    { icon: Zap, text: "Almost ready..." },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setTimeout(() => onComplete?.(), 500)
          return 100
        }
        return prev + 1.2
      })
    }, 45)

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 1100)

    // Simulate data loading steps
    const dataTimer = setInterval(() => {
      setDataLoaded(prev => {
        const keys = Object.keys(prev) as (keyof typeof prev)[]
        const unloadedKeys = keys.filter(key => !prev[key])
        if (unloadedKeys.length > 0) {
          const randomKey = unloadedKeys[Math.floor(Math.random() * unloadedKeys.length)]
          return { ...prev, [randomKey]: true }
        }
        return prev
      })
    }, 800)

    return () => {
      clearInterval(timer)
      clearInterval(stepTimer)
      clearInterval(dataTimer)
    }
  }, [onComplete, steps.length])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(var(--primary), 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--primary), 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating data visualization elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`chart-${i}`}
            className="absolute"
            animate={{
              y: [0, -40, 0],
              x: [0, Math.sin(i) * 30, 0],
              rotate: [0, 360],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${15 + Math.sin(i * 1.5) * 40}%`,
            }}
          >
            <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                {i % 4 === 0 && <BarChart3 className="w-5 h-5 text-primary/30" />}
                {i % 4 === 1 && <TrendingUp className="w-5 h-5 text-primary/30" />}
                {i % 4 === 2 && <Target className="w-5 h-5 text-primary/30" />}
                {i % 4 === 3 && <Calendar className="w-5 h-5 text-primary/30" />}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated chart bars */}
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="flex items-end space-x-2">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`bar-${i}`}
              className="w-4 bg-primary/40 rounded-t"
              animate={{
                height: [20, 40 + Math.random() * 40, 20],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Animated progress rings */}
      <div className="absolute top-10 right-10 opacity-20">
        <div className="relative w-20 h-20">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute inset-0 border-2 border-primary/30 rounded-full"
              style={{ 
                width: `${60 + i * 20}px`, 
                height: `${60 + i * 20}px`,
                left: `${-i * 10}px`,
                top: `${-i * 10}px`
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-center z-10 relative max-w-2xl mx-auto px-6">
        {/* Main dashboard icon with pulsing effect */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="w-32 h-32 border-4 border-muted rounded-2xl mx-auto relative bg-card shadow-lg flex items-center justify-center"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(var(--primary), 0.3)",
                "0 0 0 20px rgba(var(--primary), 0)",
                "0 0 0 0 rgba(var(--primary), 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {/* Center icon with step animation */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              key={currentStep}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
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
                    return <IconComponent className="w-12 h-12 text-primary" />
                  })()}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Loading text */}
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
              Setting up your knowledge base overview
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Data loading indicators */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { label: "Conversations", key: "conversations" as keyof typeof dataLoaded, icon: Users, color: "text-blue-500" },
            { label: "Concepts", key: "concepts" as keyof typeof dataLoaded, icon: BookOpen, color: "text-green-500" },
            { label: "Categories", key: "categories" as keyof typeof dataLoaded, icon: Target, color: "text-purple-500" },
            { label: "Dashboard", key: "dashboard" as keyof typeof dataLoaded, icon: TrendingUp, color: "text-orange-500" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className={`bg-card/50 backdrop-blur-sm border rounded-lg p-4 text-center transition-colors duration-500 ${
                dataLoaded[item.key] ? "border-primary/50 bg-primary/5" : "border-border/50"
              }`}
              animate={{ 
                scale: dataLoaded[item.key] ? [1, 1.05, 1] : 1,
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              <motion.div
                animate={{ scale: dataLoaded[item.key] ? [1, 1.2, 1] : 1 }}
                transition={{ scale: { duration: 0.5 } }}
                className="relative w-10 h-10 mx-auto mb-2 flex items-center justify-center"
              >
                {/* Animated progress ring while loading */}
                {!dataLoaded[item.key] && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/60"
                    style={{ borderTopColor: 'var(--tw-prose-bold)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                  />
                )}
                <item.icon className={`w-6 h-6 ${item.color} z-10`} />
              </motion.div>
              <div className={`text-sm font-medium transition-colors duration-500 ${
                dataLoaded[item.key] ? "text-primary" : "text-muted-foreground"
              }`}>
                {dataLoaded[item.key] ? "✓ Loaded" : "Loading..."}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced progress bar */}
        <motion.div 
          className="w-full max-w-md mx-auto mb-6"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span className="font-medium">Setting up dashboard</span>
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
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
                scale: index === currentStep ? [1, 1.4, 1] : 1,
                opacity: index === currentStep ? [0.7, 1, 0.7] : index < currentStep ? 0.8 : 0.4,
              }}
              transition={{ 
                duration: index === currentStep ? 1 : 0.3,
                repeat: index === currentStep ? Number.POSITIVE_INFINITY : 0,
              }}
            />
          ))}
        </div>

        {/* Floating keywords */}
        <div className="absolute inset-0 pointer-events-none">
          {["Dashboard", "Conversations", "Concepts", "Categories", "Knowledge", "Overview"].map((keyword, i) => (
            <motion.div
              key={keyword}
              className="absolute text-xs font-medium text-primary/20 bg-primary/5 px-3 py-1 rounded-full border border-primary/10"
              animate={{
                y: [0, -25, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
              style={{
                left: `${5 + (i * 18)}%`,
                top: `${70 + Math.sin(i * 1.2) * 15}%`,
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