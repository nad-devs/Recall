"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"

interface ChatInputFormProps {
  onProcessingStart: () => void
  onProcessingComplete: (results: any) => void
  isProcessing: boolean
  initialText: string
}

export function ChatInputForm({
  onProcessingStart,
  onProcessingComplete,
  isProcessing,
  initialText,
}: ChatInputFormProps) {
  const [conversationText, setConversationText] = useState(initialText || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conversationText.trim()) {
      return
    }

    onProcessingStart()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="conversation" className="block text-sm font-medium text-foreground">
          Paste your ChatGPT conversation
        </label>
        <Textarea
          id="conversation"
          placeholder="Paste your ChatGPT conversation here..."
          value={conversationText}
          onChange={(e) => setConversationText(e.target.value)}
          className="min-h-[200px] resize-y"
          disabled={isProcessing}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isProcessing || !conversationText.trim()}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Analyze Conversation
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
