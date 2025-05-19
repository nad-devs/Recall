import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationCard } from "@/components/conversation-card"
import { ArrowLeft, BookOpen, Tag, MessageSquare, Code, Edit, ExternalLink, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"

// Define interfaces to match the expected types
interface Concept {
  id: string
  title: string
  category: string
  summary: string
  details: string
  keyPoints: string
  examples: string
  relatedConcepts: string
  relationships: string
  confidenceScore: number
  lastUpdated: Date
  conversationId: string
  occurrences: {
    id: string
    conversationId: string
    conceptId: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }[]
  codeSnippets: {
    id: string
    language: string
    description: string
    code: string
    conceptId: string
  }[]
}

export default async function ConceptDetailPage({ params }: { params: { id: string } }) {
  // Fetch the concept from the database
  const concept = await prisma.concept.findUnique({
    where: {
      id: params.id,
    },
    include: {
      occurrences: true,
      codeSnippets: true,
    },
  });

  if (!concept) {
    notFound();
  }

  // Get the related conversations
  const relatedConversationIds = concept.occurrences.map(o => o.conversationId);
  const relatedConversations = await prisma.conversation.findMany({
    where: {
      id: {
        in: relatedConversationIds,
      },
    },
    include: {
      concepts: true,
    },
  });

  // Format for ConversationCard
  const formattedConversations = relatedConversations.map(conv => ({
    id: conv.id,
    title: conv.summary.split('\n')[0] || 'Untitled Conversation',
    summary: conv.summary,
    conceptMap: conv.concepts.map(c => c.title),
    createdAt: conv.createdAt.toISOString(),
    metadata: {
      conceptCount: conv.concepts.length,
    },
  }));

  // Parse related concepts JSON string
  let relatedConceptsData = [];
  try {
    relatedConceptsData = JSON.parse(concept.relatedConcepts);
  } catch (e) {
    console.error("Error parsing relatedConcepts JSON:", e);
  }

  // If there are related concept IDs, fetch them
  const relatedConceptIds = relatedConceptsData
    .filter((rc: any) => rc && rc.id)
    .map((rc: any) => rc.id);

  let relatedConcepts: Concept[] = [];
  if (relatedConceptIds.length > 0) {
    relatedConcepts = await prisma.concept.findMany({
      where: {
        id: {
          in: relatedConceptIds,
        },
      },
      include: {
        occurrences: true,
        codeSnippets: true,
      },
    });
  }

  // Parse keyPoints
  let keyPoints = [];
  try {
    keyPoints = JSON.parse(concept.keyPoints);
  } catch (e) {
    console.error("Error parsing keyPoints JSON:", e);
  }

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
              Discussed in {concept.occurrences.length} conversation{concept.occurrences.length !== 1 ? "s" : ""}
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
            <p className="whitespace-pre-line">{concept.summary}</p>
            
            {keyPoints.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium">Key Points</h3>
                <ul className="list-disc pl-5 mt-2">
                  {keyPoints.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList>
          <TabsTrigger value="conversations" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Related Conversations
          </TabsTrigger>
          {concept.codeSnippets.length > 0 && (
            <TabsTrigger value="code" className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              Code Examples
            </TabsTrigger>
          )}
          {relatedConcepts.length > 0 && (
            <TabsTrigger value="related" className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              Related Concepts
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="conversations" className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold">Conversations where this concept was discussed</h2>

          {formattedConversations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formattedConversations.map(
                (conversation) => <ConversationCard key={conversation.id} conversation={conversation} />,
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No related conversations found.</p>
          )}
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold">Code examples related to this concept</h2>

          {concept.codeSnippets.length > 0 ? (
            <div className="space-y-6">
              {concept.codeSnippets.map((snippet, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      {snippet.language} Example
                    </CardTitle>
                    <CardDescription>
                      {snippet.description}
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
        
        {relatedConcepts.length > 0 && (
          <TabsContent value="related" className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">Related Concepts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedConcepts.map((relatedConcept) => (
                <Card key={relatedConcept.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{relatedConcept.title}</CardTitle>
                      {relatedConcept.category && <Badge>{relatedConcept.category}</Badge>}
                    </div>
                    {relatedConcept.summary && (
                      <CardDescription className="line-clamp-2">{relatedConcept.summary.substring(0, 120)}...</CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" asChild className="ml-auto">
                      <Link href={`/concepts/${relatedConcept.id}`}>
                        View concept
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
