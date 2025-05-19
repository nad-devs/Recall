"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Code, 
  Calendar,
  Tag,
  Pencil,
  ExternalLink
} from "lucide-react"
import { format } from "date-fns"
import { ConceptCard } from "@/components/concept-card"

interface ConceptData {
  id: string
  title: string
  category: string
  summary: string
  details: string
  keyPoints: string[] | string
  examples: string
  relatedConcepts: string[] | { id: string; title: string }[]
  relationships: string
  codeSnippets: {
    id: string
    language: string
    code: string
    description: string
  }[]
  conversation: {
    id: string
    title: string
    date: string
    summary: string
  }
}

interface RelatedConversation {
  id: string
  title: string
  date: string
  summary: string
}

export default function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const id = unwrappedParams.id

  const [concept, setConcept] = useState<ConceptData | null>(null)
  const [relatedConversations, setRelatedConversations] = useState<RelatedConversation[]>([])
  const [relatedConcepts, setRelatedConcepts] = useState<ConceptData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'code' | 'related'>('notes')

  useEffect(() => {
    const fetchConcept = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/concepts/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch concept')
        }
        const data = await response.json()
        setConcept(data.concept)
        setRelatedConversations(data.relatedConversations || [])
        
        // If related concepts are available, set them
        if (data.relatedConcepts) {
          setRelatedConcepts(data.relatedConcepts)
        } else if (data.concept.relatedConcepts && data.concept.relatedConcepts.length > 0) {
          // For now, we'll leave this to just display the titles
          // In a real implementation, you'd fetch the full related concept data
          setRelatedConcepts([])
        }
      } catch (error) {
        setError('Failed to load concept')
        console.error('Error fetching concept:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcept()
  }, [id])

  if (loading) {
    return <div className="container mx-auto py-12 flex justify-center">Loading concept...</div>
  }

  if (error || !concept) {
    return (
      <div className="container mx-auto py-12">
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error || 'Concept not found'}
        </div>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  // Parse arrays if needed
  const keyPoints = Array.isArray(concept.keyPoints) ? concept.keyPoints : [];
  const details = typeof concept.details === 'string' ? concept.details : '';
  const codeSnippets = Array.isArray(concept.codeSnippets) ? concept.codeSnippets : [];
  const conceptRelatedConcepts = Array.isArray(concept.relatedConcepts) ? concept.relatedConcepts : [];
  
  // Check if we have related concepts to show
  const hasRelatedConcepts = conceptRelatedConcepts.length > 0 || relatedConcepts.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{concept.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {concept.category && <Badge>{concept.category}</Badge>}
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                Discussed in {relatedConversations.length} conversation{relatedConversations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="h-4 w-4" />
          Edit Concept
        </Button>
      </div>

      <div className="flex gap-4 border-b pb-2">
        <Button 
          variant={activeTab === 'notes' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('notes')}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Concept Notes
        </Button>
        {codeSnippets.length > 0 && (
          <Button 
            variant={activeTab === 'code' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('code')}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            Code Examples
          </Button>
        )}
        {hasRelatedConcepts && (
          <Button 
            variant={activeTab === 'related' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('related')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Related Concepts
          </Button>
        )}
      </div>

      {activeTab === 'notes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Concept Notes</CardTitle>
            <CardDescription>Your consolidated understanding of this concept</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {concept.summary && (
              <div className="text-base">{concept.summary}</div>
            )}
            {keyPoints.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2">Key Points:</h3>
                <ul className="space-y-1 list-disc pl-5">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="text-sm">
                      {typeof point === 'string' ? point : JSON.stringify(point)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {details && (
              <div>
                <h3 className="text-md font-semibold mb-2">Details:</h3>
                <div className="space-y-2 text-sm">
                  <p>{details}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'code' && codeSnippets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Code Examples</CardTitle>
            <CardDescription>Code snippets related to this concept</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeSnippets.map((snippet, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{snippet.language}</Badge>
                  {snippet.description && (
                    <span className="text-sm text-muted-foreground">{snippet.description}</span>
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

      {activeTab === 'related' && hasRelatedConcepts && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Related Concepts</CardTitle>
              <CardDescription>Other concepts that relate to {concept.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedConcepts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedConcepts.map((relatedConcept, idx) => (
                    <ConceptCard 
                      key={idx} 
                      concept={relatedConcept} 
                      showDescription={true}
                    />
                  ))}
                </div>
              ) : conceptRelatedConcepts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">These concepts are related but haven't been fully loaded:</p>
                  <div className="flex flex-wrap gap-2">
                    {conceptRelatedConcepts.map((related, idx) => (
                      <Badge key={idx} className="text-sm">
                        <Link href={`/concept/${typeof related === 'string' ? 
                          encodeURIComponent(related) : related.id}`}>
                          {typeof related === 'string' ? related : related.title}
                        </Link>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No related concepts found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {relatedConversations.length > 0 && (
        <div className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Conversations where this concept was discussed
          </h2>

          {relatedConversations.map((conv) => (
            <Link href={`/conversation/${conv.id}`} key={conv.id}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{conv.title}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(conv.date), "MM/dd/yyyy")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2">{conv.summary}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 