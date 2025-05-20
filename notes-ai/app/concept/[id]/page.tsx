"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Code, 
  Calendar,
  Tag,
  Pencil,
  ExternalLink,
  ArrowRight
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
          <Link href="/">Return to Dashboard</Link>
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
            <Link href="/">
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

      {/* Concept Notes Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            <CardTitle>Concept Notes</CardTitle>
          </div>
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
                  <li key={index}>
                    {typeof point === 'string' ? point : JSON.stringify(point)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details && (
            <div>
              <h3 className="text-md font-semibold mb-2">Details:</h3>
              <div className="space-y-2">
                <p>{details}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Examples Section */}
      {codeSnippets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <Code className="mr-2 h-5 w-5" />
            <h2 className="text-xl font-semibold">Code Examples</h2>
          </div>
          
          <div className="space-y-6">
            {codeSnippets.map((snippet, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{snippet.language}</Badge>
                    {snippet.description && (
                      <span className="text-sm text-muted-foreground">{snippet.description}</span>
                    )}
                  </div>
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

      {/* Related Concepts Section */}
      {hasRelatedConcepts && (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <ExternalLink className="mr-2 h-5 w-5" />
            <h2 className="text-xl font-semibold">Related Concepts</h2>
          </div>
          
          {relatedConcepts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedConcepts.map((relatedConcept, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{relatedConcept.title}</CardTitle>
                      {relatedConcept.category && <Badge>{relatedConcept.category}</Badge>}
                    </div>
                    {relatedConcept.summary && (
                      <CardDescription className="line-clamp-2">{relatedConcept.summary}</CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="ml-auto" asChild>
                      <Link href={`/concept/${relatedConcept.id}`}>
                        View concept
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : conceptRelatedConcepts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">These concepts are related:</p>
              <div className="flex flex-wrap gap-2">
                {conceptRelatedConcepts.map((related, idx) => {
                  let displayTitle: string;
                  let conceptId: string | undefined;
                  
                  // Handle different formats of related concepts
                  if (typeof related === 'string') {
                    displayTitle = related;
                    conceptId = encodeURIComponent(related);
                  } else if (typeof related === 'object' && related !== null) {
                    displayTitle = related.title || (related.id ? 'Related concept' : 'Unknown');
                    conceptId = related.id || (related.title ? encodeURIComponent(related.title) : undefined);
                  } else {
                    displayTitle = 'Unknown concept';
                    conceptId = undefined;
                  }
                  
                  return (
                    <Badge key={idx} className="text-sm">
                      {conceptId ? (
                        <Link href={`/concept/${conceptId}`}>
                          {displayTitle}
                        </Link>
                      ) : (
                        <span>{displayTitle}</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No related concepts found.</p>
          )}
        </div>
      )}

      {/* Related Conversations Section */}
      {relatedConversations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Conversations where this concept was discussed</h2>
          </div>

          <div className="grid gap-4">
            {relatedConversations.map((conv) => (
              <Card key={conv.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{conv.title}</CardTitle>
                    <Badge variant="outline" className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(conv.date), "MM/dd/yyyy")}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{conv.summary}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button variant="ghost" size="sm" className="ml-auto" asChild>
                    <Link href={`/conversation/${conv.id}`}>
                      View conversation
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 