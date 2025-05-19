import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationCard } from "@/components/conversation-card"
import { BookOpen, Search, ArrowLeft, Calendar, MessageSquare } from "lucide-react"
import { dummyConversations } from "@/lib/dummy-data"

export const metadata: Metadata = {
  title: "All Conversations | ChatMapper",
  description: "Browse all your learning conversations",
}

export default function ConversationsPage() {
  // Group conversations by month
  const conversationsByMonth: Record<string, typeof dummyConversations> = {}

  dummyConversations.forEach((conversation) => {
    const date = new Date(conversation.date)
    const monthYear = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`

    if (!conversationsByMonth[monthYear]) {
      conversationsByMonth[monthYear] = []
    }

    conversationsByMonth[monthYear].push(conversation)
  })

  // Sort conversations within each month by date (newest first)
  Object.keys(conversationsByMonth).forEach((month) => {
    conversationsByMonth[month].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Get sorted months (newest first)
  const sortedMonths = Object.keys(conversationsByMonth).sort((a, b) => {
    const dateA = new Date(conversationsByMonth[a][0].date)
    const dateB = new Date(conversationsByMonth[b][0].date)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Conversations</h1>
            <p className="text-muted-foreground">Browse your learning history</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-8" />
        </div>
      </div>

      <Tabs defaultValue="byDate" className="w-full">
        <TabsList>
          <TabsTrigger value="byDate" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            By Date
          </TabsTrigger>
          <TabsTrigger value="byTopic" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            By Topic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="byDate" className="space-y-6 mt-6">
          {sortedMonths.map((month) => (
            <div key={month} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                {month}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversationsByMonth[month].map((conversation) => (
                  <ConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="byTopic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Topic View Coming Soon
              </CardTitle>
              <CardDescription>
                We're working on a way to organize your conversations by topic for easier browsing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                In the meantime, you can use the search function to find conversations by keyword.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 