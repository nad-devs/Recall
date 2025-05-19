"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MessageSquare, Code, BookOpen, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptCard } from "@/components/concept-card"

interface ConversationData {
  id: string
  title: string
  date: string
  summary: string
  concepts: {
    id: string
    title: string
  }[]
  codeSnippets: {
    language: string
    code: string
    description: string
    conceptId: string
  }[]
}

interface ConceptData {
  id: string;
  title: string;
  category: string;
  summary: string;
  details: string;
  keyPoints: string[];
  examples: string;
  relatedConcepts: string[] | { id: string; title: string }[];
  relationships: string;
  conversationId?: string;
  codeSnippets: {
    id: string;
    language: string;
    code: string;
    description: string;
  }[];
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const id = unwrappedParams.id

  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [concepts, setConcepts] = useState<ConceptData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})

  const toggleDetails = (conceptId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }))
  }

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/conversations/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch conversation')
        }
        const data = await response.json()
        setConversation(data.conversation)
        setConcepts(data.concepts)
      } catch (error) {
        setError('Failed to load conversation')
        console.error('Error fetching conversation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [id])

  if (loading) {
    return <div className="container mx-auto py-12 flex justify-center">Loading conversation...</div>
  }

  if (error || !conversation) {
    return (
      <div className="container mx-auto py-12">
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error || 'Conversation not found'}
        </div>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  // Get the main concept (first one) and any related concepts
  const mainConcept = concepts.length > 0 ? concepts[0] : null;
  const relatedConceptTitles = mainConcept?.relatedConcepts || [];
  
  // Get related concept objects that match the related concept titles
  const relatedConcepts = concepts.slice(1);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{conversation.title}</h1>
      </div>
      
      <div className="flex items-center text-muted-foreground mb-6">
        <Calendar className="mr-1 h-4 w-4" />
        <span>{format(new Date(conversation.date), "MMMM d, yyyy 'at' h:mm a")}</span>
        <span className="text-sm text-muted-foreground ml-1">
          ({new Date(conversation.date).getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000 
            ? `about ${Math.floor((Date.now() - new Date(conversation.date).getTime()) / (365 * 24 * 60 * 60 * 1000))} years ago`
            : `${Math.floor((Date.now() - new Date(conversation.date).getTime()) / (24 * 60 * 60 * 1000))} days ago`})
        </span>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="concepts" className="space-y-6">
        <TabsList>
          {/* Hidden summary tab */}
          {/* <TabsTrigger value="summary">Summary</TabsTrigger> */}
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          {conversation.codeSnippets && conversation.codeSnippets.length > 0 && (
            <TabsTrigger value="code">Code Examples</TabsTrigger>
          )}
        </TabsList>

        {/* Conversation Summary Tab - Hidden but keeping content for reference */}
        {/* <TabsContent value="summary">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                <CardTitle>Conversation Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">{conversation.summary}</div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Concepts Tab */}
        <TabsContent value="concepts">
          <div className="flex items-center mb-4">
            <BookOpen className="mr-2 h-5 w-5" />
            <h2 className="text-2xl font-semibold">Concepts Covered</h2>
          </div>
          
          {/* Main concept */}
          {mainConcept && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <CardTitle className="text-xl">{mainConcept.title}</CardTitle>
                    <div className="flex items-center mt-1">
                      <Link href={`/concepts/${mainConcept.id}`} className="text-sm text-primary flex items-center">
                        View concept page <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                  {mainConcept.category && (
                    <Badge>{mainConcept.category}</Badge>
                  )}
                </div>
                <CardDescription className="text-base mt-2">{mainConcept.summary}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Points */}
                {Array.isArray(mainConcept.keyPoints) && mainConcept.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Key Points:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {mainConcept.keyPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Details Section */}
                {mainConcept.details && (
                  <div>
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleDetails(mainConcept.id)}
                      className="flex items-center px-0 text-lg font-medium"
                    >
                      Details 
                      {expandedDetails[mainConcept.id] ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedDetails[mainConcept.id] && (
                      <div className="text-muted-foreground whitespace-pre-line mt-2">
                        {(() => {
                          try {
                            const parsed = JSON.parse(mainConcept.details);
                            // If it's an object, stringify it with indentation
                            if (parsed && typeof parsed === 'object') {
                              return Object.entries(parsed).map(([key, value]) => (
                                <div key={key} className="mb-2">
                                  <strong className="font-medium">{key}:</strong>{' '}
                                  {typeof value === 'string' 
                                    ? value 
                                    : JSON.stringify(value, null, 2)}
                                </div>
                              ));
                            }
                            // If it's a string, return it directly
                            return parsed;
                          } catch {
                            return mainConcept.details;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Related Concepts Section */}
          {relatedConcepts.length > 0 && (
            <div>
              <h3 className="flex items-center text-lg font-medium mb-4">
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Related Concepts
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedConcepts.map((concept, idx) => (
                  <ConceptCard 
                    key={idx} 
                    concept={concept} 
                    showDescription={true}
                    showRelatedConcepts={false}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Code Examples Tab */}
        {conversation.codeSnippets && conversation.codeSnippets.length > 0 && (
          <TabsContent value="code">
            <div className="flex items-center mb-4">
              <Code className="mr-2 h-5 w-5" />
              <h2 className="text-2xl font-semibold">Code Examples</h2>
            </div>
            
            <div className="space-y-6">
              {conversation.codeSnippets.map((snippet, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge>{snippet.language}</Badge>
                        {snippet.conceptId && concepts.find(c => c.id === snippet.conceptId) && (
                          <Badge variant="outline">
                            <Link href={`/concepts/${snippet.conceptId}`}>
                              {concepts.find(c => c.id === snippet.conceptId)?.title}
                            </Link>
                          </Badge>
                        )}
                      </div>
                    </div>
                    {snippet.description && (
                      <CardDescription>{snippet.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 