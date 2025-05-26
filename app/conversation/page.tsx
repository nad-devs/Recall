"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationCard } from "@/components/conversation-card"
import { BookOpen, Search, ArrowLeft, Calendar, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/page-transition"

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Group conversations by month
  const conversationsByMonth: Record<string, any[]> = {}

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.title.toLowerCase().includes(searchLower) ||
      conv.summary.toLowerCase().includes(searchLower) ||
      conv.concepts.some((c: any) => c.title.toLowerCase().includes(searchLower))
    );
  });

  // Process and group filtered conversations
  filteredConversations.forEach((conversation) => {
    const dateString = conversation.date || conversation.createdAt;
    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime());
    const monthYear = isValid
      ? `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`
      : "Unknown Date";

    if (!conversationsByMonth[monthYear]) {
      conversationsByMonth[monthYear] = [];
    }

    conversationsByMonth[monthYear].push(conversation);
  })

  // Sort conversations within each month by date (newest first)
  Object.keys(conversationsByMonth).forEach((month) => {
    conversationsByMonth[month].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Get sorted months (newest first)
  const sortedMonths = Object.keys(conversationsByMonth).sort((a, b) => {
    if (conversationsByMonth[a].length === 0 || conversationsByMonth[b].length === 0) return 0;
    const dateA = new Date(conversationsByMonth[a][0].date)
    const dateB = new Date(conversationsByMonth[b][0].date)
    return dateB.getTime() - dateA.getTime()
  })

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/conversations');
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, []);

  // Handle conversation deletion
  const handleDeleteConversation = (id: string) => {
    setConversations(prevConversations => prevConversations.filter(conv => conv.id !== id));
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">All Conversations</h1>
              <p className="text-muted-foreground">Browse your learning history</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/concepts">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Concepts
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="byDate" className="w-full">
          <TabsList>
            <TabsTrigger value="byDate" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              By Date
            </TabsTrigger>
          </TabsList>

          <TabsContent value="byDate" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : sortedMonths.length > 0 ? (
              sortedMonths.map((month) => (
                <div key={month} className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    {month}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conversationsByMonth[month].map((conversation) => (
                      <ConversationCard 
                        key={conversation.id} 
                        conversation={conversation}
                        onDelete={handleDeleteConversation}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No conversations found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery ? 
                    "No conversations match your search query. Try broadening your search." :
                    "Your analyzed conversations will appear here. Start by analyzing a conversation from the dashboard."}
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
} 