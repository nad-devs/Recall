"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RefreshCw, PlusCircle } from "lucide-react"
import { ConversationCard } from "@/components/conversation-card"

interface Conversation {
  id: string
  title: string
  summary: string
  conceptMap: string[]
  keyPoints: string[]
  metadata: {
    extractionTime: string
    conceptCount: number
  }
  createdAt: string
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations')
        if (!response.ok) {
          throw new Error('Failed to fetch conversations')
        }
        const data = await response.json()
        setConversations(data)
      } catch (error) {
        setError('Failed to load conversations')
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Learning Dashboard</h1>
        <div className="flex-grow"></div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
          // Show a popup with restart instructions
          alert(
            "To restart the application:\n\n" +
            "1. Press Ctrl+C in your terminal\n" +
            "2. Run 'npm run dev' to restart\n" +
            "3. Refresh this page in your browser"
          );
        }}>
          <RefreshCw className="h-4 w-4" />
          Restart App
        </Button>
        <Button size="sm" className="gap-2" asChild>
          <Link href="/analyze">
            <PlusCircle className="h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Recent Conversations */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Recent Conversations</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
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
              className="h-8 w-8 animate-spin text-muted-foreground"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No conversations yet. Start by analyzing a conversation!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ConversationCard conversation={conversation} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 