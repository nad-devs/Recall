"use client"

import React, { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Code, 
  ExternalLink,
  ArrowRight,
  Trash2,
  X,
  Video,
  AlertTriangle,
  StickyNote,
  Edit,
  Check,
  Link as LinkIcon
} from "lucide-react"
import { ConversationCard } from "@/components/conversation-card"
import { useConceptDetail } from "@/hooks/useConceptDetail"
import { formatDetailsText } from "@/lib/utils/text-formatting"
import { useToast } from "@/hooks/use-toast"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { PageTransition } from "@/components/page-transition"
import { disconnectConcepts, connectConcepts } from "@/lib/concept-utils"
import { ConceptConnectionDialog } from "@/components/concept-connection-dialog"

export default function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const { toast } = useToast()
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")

  const {
    concept,
    setConcept,
    relatedConversations,
    relatedConcepts,
    setRelatedConcepts,
    conceptRelatedConcepts,
    setConceptRelatedConcepts,
    loading,
    error,
    deleteCodeSnippet,
    refreshConcept
  } = useConceptDetail(id)

  // Listen for page visibility changes to refresh data when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && concept) {
        // Page became visible, refresh concept data
        refreshConcept();
      }
    };

    // Listen for storage events to detect when connections are made from other tabs/pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'conceptLinked' && concept) {
        // A concept was linked, refresh our data
        refreshConcept();
        // Clear the storage event
        localStorage.removeItem('conceptLinked');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [concept, refreshConcept]);

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

  // Extract concept properties with defaults
  const keyPoints = Array.isArray(concept?.keyPoints) ? concept?.keyPoints : 
                    (concept?.keyPoints ? [concept.keyPoints] : [])
  
  // Deduplicate related concepts by id or normalized title (case-insensitive, trim)
  const uniqueRelatedConcepts = [];
  const seen = new Set();
  if (conceptRelatedConcepts && Array.isArray(conceptRelatedConcepts)) {
    for (const related of conceptRelatedConcepts) {
      let key = '';
      let isValid = false;
      
      if (typeof related === 'object' && related !== null) {
        // Check if this is a valid reference with either an ID or a title
        if (related.id || related.title) {
          key = (related.id ? String(related.id).toLowerCase().trim() : '') ||
                (related.title ? related.title.toLowerCase().trim() : '');
          isValid = true;
        }
      } else if (typeof related === 'string' && related.trim().length > 0) {
        key = related.toLowerCase().trim();
        isValid = true;
      }
      
      // Only add valid, unique references
      if (key && isValid && !seen.has(key)) {
        seen.add(key);
        uniqueRelatedConcepts.push(related);
      }
    }
  }
  
  // Filter out any references that might be broken (objects with no title and no valid ID)
  const validRelatedConcepts = uniqueRelatedConcepts.filter(related => {
    if (typeof related === 'string') return true;
    if (typeof related === 'object' && related !== null) {
      // Must have either a valid title or be in the relatedConcepts array (fetched from DB)
      return related.title || (related.id && relatedConcepts && relatedConcepts.some(r => r.id === related.id));
    }
    return false;
  });
  
  // Check if there are any related concepts (using cleaned and deduplicated list)
  const hasRelatedConcepts = (validRelatedConcepts && validRelatedConcepts.length > 0) || 
                             (relatedConcepts && relatedConcepts.length > 0);

  // Handle concept connection
  const handleConnectConcept = async (targetConceptId: string) => {
    try {
      await connectConcepts(id, targetConceptId);
      
      toast({
        title: "Success",
        description: "Concepts successfully connected",
      });
      
      // Refresh the concept data to show new connections
      await refreshConcept();
      
    } catch (error) {
      console.error('Error connecting concepts:', error);
      toast({
        title: "Error",
        description: "Failed to connect concepts",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle title update
  const handleTitleUpdate = async () => {
    if (!editedTitle.trim() || editedTitle.trim() === concept.title) {
      setIsEditingTitle(false)
      return
    }

    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editedTitle.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update title')
      }

      const result = await response.json()
      setConcept(result.concept)
      
      toast({
        title: "Title Updated",
        description: "Concept title has been updated successfully.",
        duration: 3000,
      })
      
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
      toast({
        title: "Error", 
        description: "Failed to update title. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Start editing title
  const startEditingTitle = () => {
    setEditedTitle(concept.title)
    setIsEditingTitle(true)
  }

  // Cancel editing title
  const cancelEditingTitle = () => {
    setIsEditingTitle(false)
    setEditedTitle("")
  }

  return (
    <PageTransition>
      <DndProvider backend={HTML5Backend}>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/concepts">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2 flex-1 min-w-0 relative z-10">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-3xl font-bold h-auto py-2 px-3 border-2 border-primary min-w-0 flex-1 bg-white shadow-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTitleUpdate()
                        } else if (e.key === 'Escape') {
                          cancelEditingTitle()
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleTitleUpdate}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEditingTitle}
                      className="text-gray-500 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <h1 className="text-3xl font-bold truncate">{concept.title}</h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startEditingTitle}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex-shrink-0"
                      title="Edit title"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {concept.category}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button 
                variant="outline"
                onClick={() => setIsConnectionDialogOpen(true)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect
              </Button>
              <Button asChild variant="outline">
                <Link href={`/review/${concept.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Review & Practice
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!window.confirm(`Are you sure you want to delete "${concept.title}"? This action cannot be undone.`)) {
                    return;
                  }
                  
                  try {
                    const response = await fetch(`/api/concepts/${concept.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-user-email': localStorage.getItem('userEmail') || '',
                        'x-user-id': localStorage.getItem('userId') || '',
                      },
                    });

                    if (!response.ok) {
                      throw new Error('Failed to delete concept');
                    }
                    
                    const result = await response.json();

                    toast({
                      title: "Concept Deleted",
                      description: `"${concept.title}" has been deleted`,
                      duration: 3000,
                    });

                    // Navigate back to concepts page
                    window.location.href = '/concepts';
                  } catch (error) {
                    console.error('Error deleting concept:', error);
                    toast({
                      title: "Error",
                      description: "Failed to delete concept. Please try again.",
                      variant: "destructive",
                      duration: 3000,
                    });
                  }
                }}
                title="Delete this concept"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Two-Column Layout: 65% Left, 30% Right, 5% Gap */}
          <div className="grid grid-cols-1 lg:grid-cols-[65%_30%] gap-[5%]">
            {/* Left Column - Concept Notes (65% width) */}
            <div className="space-y-6">
              {/* Concept Notes Card - LIMITED HEIGHT */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    <CardTitle>Concept Notes</CardTitle>
                  </div>
                  <CardDescription>Your consolidated understanding of this concept</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[500px] overflow-y-auto">
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
                  {concept.details && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-primary">Detailed Information</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {formatDetailsText(concept.details)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Code Examples Section - LIMITED HEIGHT */}
              {concept.codeSnippets && concept.codeSnippets.length > 0 && (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center mb-4">
                    <Code className="mr-2 h-5 w-5" />
                    <h2 className="text-xl font-semibold">Code Examples</h2>
                  </div>
                  {concept.codeSnippets.map((snippet: any) => (
                    <Card key={snippet.id} className="group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{snippet.description}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{snippet.language}</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                              onClick={() => deleteCodeSnippet(snippet.id)}
                              title="Delete code snippet"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm max-h-[200px] overflow-y-auto">
                          <code>{snippet.code}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Quick Actions & Enhancement (30% width) */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/review/${concept.id}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Review & Practice
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsConnectionDialogOpen(true)}
                    className="w-full"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect to Concept
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/concept/${concept.id}/enhance`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Enhance Concept
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Concepts Section - Simple List Below Main Content */}
          {hasRelatedConcepts && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ExternalLink className="mr-2 h-5 w-5" />
                Related Concepts
              </h2>
              
              <div className="space-y-4">
                {/* Database-linked concepts */}
                {relatedConcepts && relatedConcepts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      🔗 Connected Concepts
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-300">
                        {relatedConcepts.length} linked
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatedConcepts.map((relatedConcept) => (
                        <div key={relatedConcept.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{relatedConcept.title}</h4>
                            <div className="flex gap-1 items-center">
                              {relatedConcept.category && <Badge variant="outline" className="text-xs">{relatedConcept.category}</Badge>}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    await disconnectConcepts(concept.id, relatedConcept.id);
                                    toast({
                                      title: "Relationship Removed",
                                      description: `Removed relationship with "${relatedConcept.title}"`,
                                    });
                                    await refreshConcept();
                                  } catch (error) {
                                    console.error('Error removing relationship:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove relationship",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {relatedConcept.summary && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{relatedConcept.summary.substring(0, 100)}...</p>
                          )}
                          <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                            <Link href={`/concept/${relatedConcept.id}`}>
                              View concept
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name-only references */}
                {validRelatedConcepts && validRelatedConcepts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      📝 Referenced Concepts
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300">
                        {validRelatedConcepts.length} mentioned
                      </Badge>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {validRelatedConcepts.map((related, idx) => {
                        let displayTitle: string;
                        let conceptId: string | undefined;
                        
                        if (typeof related === 'string') {
                          displayTitle = related;
                          conceptId = related;
                        } else if (typeof related === 'object' && related !== null) {
                          displayTitle = related.title || `[Missing Concept: ${related.id.substring(0, 8)}...]`;
                          conceptId = related.id || related.title;
                        } else {
                          displayTitle = 'Unknown Concept';
                          conceptId = undefined;
                        }
                        
                        return (
                          <Badge key={idx} className="text-sm group relative pr-8">
                            {conceptId ? (
                              <button
                                onClick={async () => {
                                  // Navigate to concept or show creation dialog
                                  try {
                                    let conceptExists = false;
                                    let realConceptId = conceptId;
                                    
                                    if (conceptId && conceptId.length > 10 && conceptId.includes('-')) {
                                      try {
                                        const directResponse = await fetch(`/api/concepts/${conceptId}`);
                                        if (directResponse.ok) {
                                          conceptExists = true;
                                        }
                                      } catch (e) {
                                        // Continue to title-based lookup
                                      }
                                    }
                                    
                                    if (!conceptExists) {
                                      try {
                                        const titleResponse = await fetch(`/api/concepts-by-title/${encodeURIComponent(displayTitle)}`);
                                        if (titleResponse.ok) {
                                          const conceptData = await titleResponse.json();
                                          if (conceptData && conceptData.id) {
                                            conceptExists = true;
                                            realConceptId = conceptData.id;
                                          }
                                        }
                                      } catch (e) {
                                        // Concept doesn't exist
                                      }
                                    }
                                    
                                    if (conceptExists && realConceptId) {
                                      window.location.href = `/concept/${realConceptId}`;
                                    } else {
                                      toast({
                                        title: "Concept Not Found",
                                        description: `"${displayTitle}" doesn't exist yet.`,
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error checking concept:', error);
                                  }
                                }}
                                className="hover:underline"
                              >
                                {displayTitle}
                              </button>
                            ) : (
                              <span>{displayTitle}</span>
                            )}
                            
                            {conceptId && (
                              <button 
                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center text-destructive"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  try {
                                    let actualConceptId = conceptId;
                                    
                                    if (typeof related === 'string' || (typeof related === 'object' && !related?.id)) {
                                      try {
                                        const titleResponse = await fetch(`/api/concepts-by-title/${encodeURIComponent(displayTitle)}`);
                                        if (titleResponse.ok) {
                                          const conceptData = await titleResponse.json();
                                          if (conceptData && conceptData.id) {
                                            actualConceptId = conceptData.id;
                                          }
                                        }
                                      } catch (e) {
                                        // Use the original conceptId
                                      }
                                    } else if (typeof related === 'object' && related?.id) {
                                      actualConceptId = related.id;
                                    }
                                    
                                    await disconnectConcepts(concept.id, actualConceptId);
                                    
                                    toast({
                                      title: "Relationship Removed",
                                      description: `Removed relationship with "${displayTitle}"`,
                                    });
                                    
                                    await refreshConcept();
                                  } catch (error) {
                                    console.error('Error removing relationship:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove relationship",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Conversations Section - At the Bottom */}
          {relatedConversations && relatedConversations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Related Conversations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedConversations.map((conv) => (
                  <ConversationCard 
                    key={conv.id} 
                    conversation={{
                      id: conv.id,
                      title: conv.title,
                      summary: conv.summary,
                      date: conv.date,
                      concepts: [],
                      conceptMap: [],
                      keyPoints: []
                    }} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DndProvider>
      
      <ConceptConnectionDialog
        isOpen={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        sourceConcept={{ id: concept.id, title: concept.title }}
        onConnect={handleConnectConcept}
      />
    </PageTransition>
  )
} 