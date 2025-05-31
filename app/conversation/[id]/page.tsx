"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MessageSquare, Code, BookOpen, Book, Tag, Bug } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Import only what we need from the ConversationCard component
import { ConversationCard } from "@/components/conversation-card"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { DeleteConversationButton } from "@/components/delete-conversation-button"
import { PageTransition } from "@/components/page-transition"
import { use } from "react"
import { useState, useEffect } from "react"

interface ConversationData {
  id: string
  title?: string
  text?: string
  summary?: string
  createdAt: string | Date
  concepts: ConceptData[]
}

interface ConceptData {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  details?: string;
  keyPoints?: string[];
  examples?: string;
  relatedConcepts?: string[] | { id: string; title: string }[];
  relationships?: string;
  conversationId?: string;
  codeSnippets: CodeSnippetData[];
}

interface CodeSnippetData {
  id?: string;
  language?: string;
  code: string;
  description?: string;
  conceptTitle?: string;
  conceptId?: string;
}

interface DebugInfo {
  localStorage: {
    userEmail: string;
    userId: string;
    hasEmail: boolean;
    hasUserId: boolean;
  };
  conversationId: string;
  timestamp: string;
  response?: {
    status: number;
    statusText: string;
    ok: boolean;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params promise with React.use()
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        
        // Get authentication headers and store debug info
        const getAuthHeaders = (): HeadersInit => {
          const userEmail = localStorage.getItem('userEmail')
          const userId = localStorage.getItem('userId')
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          }
          
          // Store debug info for UI display
          setDebugInfo({
            localStorage: {
              userEmail: userEmail ? userEmail : 'missing',
              userId: userId ? userId : 'missing',
              hasEmail: !!userEmail,
              hasUserId: !!userId
            },
            conversationId: conversationId,
            timestamp: new Date().toISOString()
          });
          
          // For email-based sessions
          if (userEmail && userId) {
            headers['x-user-email'] = userEmail
            headers['x-user-id'] = userId
          }
          
          return headers
        }
        
        const response = await fetch(`/api/conversations/${conversationId}`, {
          headers: getAuthHeaders()
        });
        
        // Update debug info with response details
        setDebugInfo((prev: DebugInfo | null) => ({
          ...(prev || {} as DebugInfo),
          response: {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          }
        }));
        
        if (response.status === 401) {
          // Authentication error
          setError('🔐 Authentication Error: You need to be logged in to view this conversation');
          setShowDebug(true); // Auto-show debug for auth errors
        } else if (response.status === 404) {
          // Not found error
          setError('🚫 Access Denied: Conversation not found or you do not have access to it');
          setShowDebug(true); // Auto-show debug for access errors
        } else if (!response.ok) {
          // Generic error
          setError(`⚠️ Server Error: Failed to fetch conversation (Status: ${response.status})`);
          setShowDebug(true);
        } else {
          // Success
          const data = await response.json();
          setConversation(data);
          setError(null);
        }
      } catch (error) {
        setError('💥 Network Error: An error occurred while loading the conversation');
        setShowDebug(true);
        console.error('Error fetching conversation:', error);
        
        // Update debug info with error details
        setDebugInfo((prev: DebugInfo | null) => ({
          ...(prev || {} as DebugInfo),
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto py-6">
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // If error or conversation not found, show error state with debug info
  if (error || !conversation) {
    return (
      <PageTransition>
        <div className="container mx-auto py-6 space-y-4">
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            <div className="font-medium">{error || 'Conversation not found'}</div>
          </div>

          {/* Debug Panel */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Bug className="mr-2 h-5 w-5 text-orange-600" />
                  Debug Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </CardHeader>
            {showDebug && (
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Authentication Status:</h4>
                    <div className="space-y-1 font-mono text-xs">
                      <div>Email: <span className={debugInfo?.localStorage?.hasEmail ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo?.localStorage?.userEmail || 'Missing'}
                      </span></div>
                      <div>User ID: <span className={debugInfo?.localStorage?.hasUserId ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo?.localStorage?.userId || 'Missing'}
                      </span></div>
                      <div>Conversation ID: <span className="text-blue-600">{debugInfo?.conversationId}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Server Response:</h4>
                    <div className="space-y-1 font-mono text-xs">
                      <div>Status: <span className={debugInfo?.response?.ok ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo?.response?.status}
                      </span></div>
                      <div>Status Text: {debugInfo?.response?.statusText}</div>
                      <div>Time: {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'Unknown'}</div>
                    </div>
                  </div>
                </div>
                
                {debugInfo?.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-medium text-red-800 mb-1">Error Details:</h4>
                    <div className="text-xs font-mono text-red-700">{debugInfo.error.message}</div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">Troubleshooting:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Make sure you're logged in and have analyzed conversations</li>
                    <li>• Try refreshing the page or logging out and back in</li>
                    <li>• This conversation might belong to a different user account</li>
                    <li>• Check that the conversation ID is correct in the URL</li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/concepts">View Concepts</Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Extract all code snippets across all concepts
  const allCodeSnippets = conversation.concepts?.flatMap(concept => 
    concept.codeSnippets?.map(snippet => ({
      ...snippet,
      conceptTitle: concept.title,
    }))
  ) || [];

  // Use the LLM-generated title from the database, or generate a fallback
  let title = conversation.title || '';
  
  // If no title in database, generate a fallback
  if (!title || title.trim() === '') {
    const conversationSummary = conversation.summary || '';
    
    // Use concepts for the title if available
    if (conversation.concepts && conversation.concepts.length > 0) {
      if (conversation.concepts.length === 1) {
        title = `Discussion about ${conversation.concepts[0].title}`;
      } else if (conversation.concepts.length === 2) {
        title = `${conversation.concepts[0].title} and ${conversation.concepts[1].title} Discussion`;
      } else {
        title = `${conversation.concepts[0].title}, ${conversation.concepts[1].title} & More`;
      }
    } else {
      // For title: Use first sentence/phrase if it's not too long
      const firstSentence = conversationSummary.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
      
      // Add a prefix to differentiate from summary
      if (firstSentence && firstSentence.length < 60) {
        title = `Topic: ${firstSentence}`;
      } else if (firstSentence) {
        // For longer text, truncate more aggressively
        title = `${firstSentence.substring(0, 40)}...`;
      } else {
        title = 'Conversation ' + conversationId.substring(0, 8);
      }
    }
  }

  // Format date for display
  const formattedDate = (() => {
    try {
      const date = new Date(conversation.createdAt);
      return isNaN(date.getTime()) 
        ? "No date available" 
        : format(date, 'MMMM d, yyyy');
    } catch (error) {
      return "No date available";
    }
  })();

  return (
    <PageTransition>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" className="w-fit" asChild>
              <Link href="/conversation">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Conversations
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/concepts">View All Concepts</Link>
              </Button>
              <DeleteConversationButton conversationId={conversationId} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="concepts">
              Concepts ({conversation.concepts.length})
            </TabsTrigger>
            <TabsTrigger value="code">
              Code Snippets ({allCodeSnippets.length})
            </TabsTrigger>
            <TabsTrigger value="fullText">Full Text</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{conversation.summary || 'No summary available.'}</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {conversation.concepts.map((concept) => (
                    <Badge key={concept.id} variant="secondary" className="px-2 py-1">
                      <Tag className="mr-1 h-3 w-3" />
                      <Link href={`/concept/${concept.id}`}>{concept.title}</Link>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concepts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversation.concepts.map((concept) => (
                <div key={concept.id} className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold">{concept.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{concept.category || 'General'}</p>
                  <p className="mt-2">{concept.summary || 'No summary available.'}</p>
                  <div className="mt-4">
                    <Button size="sm" asChild>
                      <Link href={`/concept/${concept.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-6">
            {allCodeSnippets.length > 0 ? (
              <div className="space-y-6">
                {allCodeSnippets.map((snippet, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 py-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center">
                          <Code className="mr-2 h-4 w-4" />
                          {snippet.language || 'Code'} - {snippet.conceptTitle}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {snippet.language || 'unknown'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="font-mono text-sm bg-muted/30 p-4 overflow-x-auto">
                        <pre>{snippet.code}</pre>
                      </div>
                      {snippet.description && (
                        <div className="p-4 border-t text-sm">
                          {snippet.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-center">
                <div className="max-w-md">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No code snippets available</h3>
                  <p className="text-muted-foreground">
                    This conversation doesn't have any associated code snippets.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fullText" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-primary" />
                  Full Conversation Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">
                  {conversation.text || 'No conversation text available.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
} 