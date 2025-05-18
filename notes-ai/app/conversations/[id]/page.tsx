import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConceptCard } from "@/components/concept-card"
import { ArrowLeft, Calendar, MessageSquare, Code, BookOpen } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { dummyConversations, dummyConcepts } from "@/lib/dummy-data"

export const metadata: Metadata = {
  title: "Conversation Details | ChatMapper",
  description: "View details of your learning conversation",
}

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const conversation = dummyConversations.find((c) => c.id === params.id)

  if (!conversation) {
    notFound()
  }

  // Get the full concept objects for this conversation
  const conceptsInConversation = conversation.concepts
    .map((conceptRef) => {
      return dummyConcepts.find((c) => c.id === conceptRef.id)
    })
    .filter(Boolean)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/conversations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{conversation.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(conversation.date), "MMMM d, yyyy 'at' h:mm a")}</span>
            <span>({formatDistanceToNow(new Date(conversation.date), { addSuffix: true })})</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Conversation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{conversation.summary}</p>
        </CardContent>
      </Card>

      {conversation.codeSnippets && conversation.codeSnippets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5 text-primary" />
              Code Snippets
            </CardTitle>
            <CardDescription>Code examples discussed in this conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversation.codeSnippets.map((snippet, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{snippet.language}</Badge>
                  {snippet.conceptId && (
                    <Badge variant="secondary">
                      Related to: {dummyConcepts.find((c) => c.id === snippet.conceptId)?.title || "Unknown concept"}
                    </Badge>
                  )}
                </div>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Concepts Covered ({conceptsInConversation.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conceptsInConversation.map(
            (concept) => concept && <ConceptCard key={concept.id} concept={concept} showDescription={true} />,
          )}
        </div>
      </div>
    </div>
  )
}
