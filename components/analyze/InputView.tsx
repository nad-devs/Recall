"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getRemainingConversations, getUsageData } from "@/lib/usage-tracker"

interface InputViewProps {
  conversationText: string
  setConversationText: (text: string) => void
  handleAnalyze: () => void
  isAnalyzing: boolean
  usageData?: { conversationCount: number, hasCustomApiKey: boolean, lastReset: string }
  remainingConversations?: number
}

export function InputView({ 
  conversationText, 
  setConversationText, 
  handleAnalyze, 
  isAnalyzing,
  usageData: propUsageData,
  remainingConversations: propRemainingConversations
}: InputViewProps) {
  const [mounted, setMounted] = useState(false)
  const [usageData, setUsageData] = useState({ conversationCount: 0, hasCustomApiKey: false, lastReset: '' })
  const [remainingConversations, setRemainingConversations] = useState(25)

  useEffect(() => {
    setMounted(true)
    // Use prop data if provided, otherwise get from storage
    if (propUsageData) {
      setUsageData(propUsageData)
    } else {
      setUsageData(getUsageData())
    }
    
    if (propRemainingConversations !== undefined) {
      setRemainingConversations(propRemainingConversations)
    } else {
      setRemainingConversations(getRemainingConversations())
    }
  }, [propUsageData, propRemainingConversations])

  // Update local state when props change
  useEffect(() => {
    if (propUsageData) {
      setUsageData(propUsageData)
    }
    if (propRemainingConversations !== undefined) {
      setRemainingConversations(propRemainingConversations)
    }
  }, [propUsageData, propRemainingConversations])

  // Don't render usage info until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <motion.div
        key="input"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col items-center"
      >
        {/* Title and description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
            Analyze Content
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
            Paste your ChatGPT conversation, YouTube transcript, or document below to extract concepts and get detailed study notes.
          </p>
        </div>

        {/* Input card */}
        <div 
          className="w-full max-w-3xl bg-white dark:!bg-[#1a1a1a] rounded-xl border border-zinc-200 dark:!border-[#333] shadow-lg p-8 space-y-4"
          style={{
            backgroundColor: 'var(--card-bg, white)',
          }}
        >
          <div className="space-y-2">
            <label htmlFor="conversation" className="block text-base font-semibold text-zinc-800 dark:!text-white">
              Paste your content
            </label>
            <textarea
              id="conversation"
              placeholder="Paste your ChatGPT conversation, YouTube transcript, or document here..."
              className="w-full min-h-[300px] p-4 rounded-lg border border-zinc-300 dark:!border-[#444] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-zinc-900 placeholder:text-zinc-400 dark:!bg-[#2c2c2c] dark:!text-white dark:!placeholder-[#bbbbbb] shadow-sm"
              style={{
                backgroundColor: 'var(--textarea-bg, white)',
                color: 'var(--textarea-color, #18181b)',
              }}
              value={conversationText}
              onChange={(e) => setConversationText(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !conversationText.trim()}
              className="inline-flex items-center justify-center rounded-md bg-zinc-700 hover:bg-zinc-800 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none dark:!bg-[#1e90ff] dark:hover:!bg-[#63b3ed] dark:!text-white dark:font-bold dark:px-6 dark:py-2 shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4 animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                  Analyze Content
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center"
    >
      {/* Title and description */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
          Analyze Content
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
          Paste your ChatGPT conversation, YouTube transcript, or document below to extract concepts and get detailed study notes.
        </p>
        
        {/* Usage Counter */}
        <div className="mt-4">
          {usageData.hasCustomApiKey ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Unlimited conversations with your API key
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {remainingConversations} free conversations remaining
            </div>
          )}
        </div>
      </div>

      {/* Input card */}
      <div 
        className="w-full max-w-3xl bg-white dark:!bg-[#1a1a1a] rounded-xl border border-zinc-200 dark:!border-[#333] shadow-lg p-8 space-y-4"
        style={{
          backgroundColor: 'var(--card-bg, white)',
        }}
      >
        <div className="space-y-2">
          <label htmlFor="conversation" className="block text-base font-semibold text-zinc-800 dark:!text-white">
            Paste your content
          </label>
          <textarea
            id="conversation"
            placeholder="Paste your ChatGPT conversation, YouTube transcript, or document here..."
            className="w-full min-h-[300px] p-4 rounded-lg border border-zinc-300 dark:!border-[#444] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-zinc-900 placeholder:text-zinc-400 dark:!bg-[#2c2c2c] dark:!text-white dark:!placeholder-[#bbbbbb] shadow-sm"
            style={{
              backgroundColor: 'var(--textarea-bg, white)',
              color: 'var(--textarea-color, #18181b)',
            }}
            value={conversationText}
            onChange={(e) => setConversationText(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !conversationText.trim()}
            className="inline-flex items-center justify-center rounded-md bg-zinc-700 hover:bg-zinc-800 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none dark:!bg-[#1e90ff] dark:hover:!bg-[#63b3ed] dark:!text-white dark:font-bold dark:px-6 dark:py-2 shadow-md"
          >
            {isAnalyzing ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4 animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Analyze Content
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
} 