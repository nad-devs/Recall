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
          <Link href="/">Return to Dashboard</Link>
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
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{
          // Generate a more meaningful title from the first sentence of the summary
          conversation.summary?.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || conversation.title
        }</h1>
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

      {/* Conversation Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            <CardTitle>Conversation Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line">
            {/* Format the summary for better readability */}
            {conversation.summary?.split(/\n+/).map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? "mt-4" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Snippets Section */}
      {conversation.codeSnippets && conversation.codeSnippets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <Code className="mr-2 h-5 w-5" />
            <h2 className="text-xl font-semibold">Code Snippets</h2>
          </div>
          
          <div className="space-y-6">
            {conversation.codeSnippets.map((snippet, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge>{snippet.language}</Badge>
                      {snippet.conceptId && concepts.find(c => c.id === snippet.conceptId) && (
                        <Badge variant="outline">
                          <Link href={`/concept/${snippet.conceptId}`}>
                            {concepts.find(c => c.id === snippet.conceptId)?.title}
                          </Link>
                        </Badge>
                      )}
                    </div>
                  </div>
                  {snippet.description && (
                    <CardDescription className="mt-1">{snippet.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 overflow-x-auto">
                    <code>{snippet.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Concepts Covered Section */}
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <BookOpen className="mr-2 h-5 w-5" />
          <h2 className="text-xl font-semibold">Concepts Covered ({concepts.length})</h2>
        </div>
        
        <div className="grid gap-4">
          {concepts.map((concept, idx) => (
            <Card key={idx} className="border-l-4" style={{ borderLeftColor: concept === mainConcept ? 'var(--primary)' : 'transparent' }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{concept.title}</CardTitle>
                    {concept.category && (
                      <div className="mt-1">
                        <Badge>{concept.category}</Badge>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/concept/${concept.id}`} className="flex items-center text-sm text-primary">
                      View concept
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">{concept.summary}</div>
                
                {Array.isArray(concept.keyPoints) && concept.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mt-2 mb-1">Key Points:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {concept.keyPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx} className="text-sm">{point}</li>
                      ))}
                      {concept.keyPoints.length > 3 && (
                        <li className="text-sm text-muted-foreground italic">+ {concept.keyPoints.length - 3} more points</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 