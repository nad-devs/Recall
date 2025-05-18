"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, BookOpen, MessageSquare, ArrowRight, Brain, AlertTriangle } from "lucide-react"
import { ConversationCard } from "@/components/conversation-card"
import { ConceptCard } from "@/components/concept-card"
import { dummyConversations, conceptsToReview } from "@/lib/dummy-data"

export default function Dashboard() {
  // Get the 5 most recent conversations
  const recentConversations = [...dummyConversations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your learning journey and explore your knowledge base</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/analyze">
                <Brain className="mr-2 h-4 w-4" />
                Analyze Conversation
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/concepts">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Concepts
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">Welcome back!</h2>
                <p className="text-muted-foreground mb-4">
                  You've analyzed 12 conversations and learned about 47 concepts across 8 categories.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-2 py-1">
                    <BookOpen className="mr-1 h-3 w-3" /> 47 Concepts
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-1">
                    <MessageSquare className="mr-1 h-3 w-3" /> 12 Conversations
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-1">
                    <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" /> {conceptsToReview.length} concepts need
                    review
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              Recent Conversations
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/conversations">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentConversations.map((conversation) => (
              <ConversationCard key={conversation.id} conversation={conversation} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Concepts to Review
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/concepts">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {conceptsToReview.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
