import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationCard } from "@/components/conversation-card"
import { ArrowLeft, BookOpen, Tag, MessageSquare, Code, Edit } from "lucide-react"
import { dummyConcepts, dummyConversations } from "@/lib/dummy-data"

export const metadata: Metadata = {
  title: "Concept Details | ChatMapper",
  description: "View details of a learning concept",
}

export default function ConceptDetailPage({ params }: { params: { id: string } }) {
  const concept = dummyConcepts.find((c) => c.id === params.id)

  if (!concept) {
    notFound()
  }

  // Get the full conversation objects for this concept
  const relatedConversations = concept.discussedInConversations
    .map((convId) => {
      return dummyConversations.find((c) => c.id === convId)
    })
    .filter(Boolean)

  // Get code snippets related to this concept
  const relatedCodeSnippets = dummyConversations.flatMap((conv) =>
    (conv.codeSnippets || [])
      .filter((snippet) => snippet.conceptId === concept.id)
      .map((snippet) => ({
        ...snippet,
        conversationId: conv.id,
        conversationTitle: conv.title,
      })),
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/concepts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{concept.title}</h1>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Concept
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4" />
            <Badge>{concept.category}</Badge>
            <span>•</span>
            <MessageSquare className="h-4 w-4" />
            <span>
              Discussed in {relatedConversations.length} conversation{relatedConversations.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Concept Notes
          </CardTitle>
          <CardDescription>Your consolidated understanding of this concept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">{concept.notes}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList>
          <TabsTrigger value="conversations" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Related Conversations
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center">
            <Code className="mr-2 h-4 w-4" />
            Code Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold">Conversations where this concept was discussed</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedConversations.map(
              (conversation) => conversation && <ConversationCard key={conversation.id} conversation={conversation} />,
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold">Code examples related to this concept</h2>

          {relatedCodeSnippets.length > 0 ? (
            <div className="space-y-6">
              {relatedCodeSnippets.map((snippet, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      {snippet.language} Example
                    </CardTitle>
                    <CardDescription>
                      From conversation:{" "}
                      <Link href={`/conversations/${snippet.conversationId}`} className="text-primary hover:underline">
                        {snippet.conversationTitle}
                      </Link>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No code examples found for this concept.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
