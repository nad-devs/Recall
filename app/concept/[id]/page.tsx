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
  Link as LinkIcon,
  FileText
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
import { AuthGuard } from "@/components/auth-guard"
import { getAuthHeaders } from "@/lib/auth-utils"
import { useSmartLearning } from "@/hooks/useSmartLearning"
import { SmartLearningDashboard } from "@/components/smart-learning/SmartLearningDashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Brain, Sparkles, Target, TrendingUp, Users } from "lucide-react"

export default function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const { toast } = useToast()
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")

  // Smart Learning Integration
  const {
    learningJourney,
    quickInsights,
    smartSuggestions,
    isLoading: smartLoading,
    personalizationLevel,
    currentStage,
    progressPercentage,
    fetchSmartSuggestions,
    refreshSmartData
  } = useSmartLearning("default") // In production, use actual user ID

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

  // Fetch smart suggestions when concept loads
  useEffect(() => {
    if (concept) {
      // Fetch suggestions based on current concept
      fetchSmartSuggestions([{
        title: concept.title,
        category: concept.category,
        summary: concept.summary,
        confidence_score: 0.8
      }])
    }
  }, [concept, fetchSmartSuggestions])

  // Listen for page visibility changes to refresh data when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && concept) {
        // Page became visible, refresh concept data
        refreshConcept();
        refreshSmartData(); // Also refresh smart learning data
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

  // DEBUG: Log the received concept data
  if (concept) {
    console.log("CONCEPT DATA RECEIVED BY COMPONENT:", JSON.stringify(concept, null, 2));
  }

  // Safely parse JSON string fields
  const safeParse = (jsonString: string | any, defaultValue: any[] = []) => {
    if (typeof jsonString !== 'string') return jsonString || defaultValue;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return defaultValue;
    }
  };

  const keyPoints = safeParse(concept.keyPoints);
  const practicalTips = safeParse(concept.practicalTips);
  const examples = safeParse(concept.examples);

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
  
  // Check if there are any related concepts (only database-linked concepts now)
  const hasRelatedConcepts = relatedConcepts && relatedConcepts.length > 0;

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
        headers: getAuthHeaders(),
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
    <AuthGuard>
      <PageTransition>
        <div className="container mx-auto p-6 max-w-7xl">
          <DndProvider backend={HTML5Backend}>
            <div className="space-y-6">
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
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <Badge variant="outline">
                      {concept.category}
                    </Badge>
                    {personalizationLevel >= 50 && (
                      <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Enhanced
                      </Badge>
                    )}
                    {currentStage && (
                      <Badge variant="outline" className="border-green-700 text-green-300">
                        <Target className="h-3 w-3 mr-1" />
                        {currentStage} Level
                      </Badge>
                    )}
                    {smartSuggestions.length > 0 && (
                      <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">
                        <Brain className="h-3 w-3 mr-1" />
                        {smartSuggestions.length} Smart Insights
                      </Badge>
                    )}
                  </div>
                  {/* Smart Learning Progress */}
                  {personalizationLevel > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <span>Personalization:</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${personalizationLevel}%` }}
                        />
                      </div>
                      <span className="text-xs">{Math.round(personalizationLevel)}%</span>
                    </div>
                  )}
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
                          headers: getAuthHeaders(),
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

              {/* Three-Column Layout: 50% Left, 30% Middle, 20% Right */}
              <div className="grid grid-cols-1 lg:grid-cols-[50%_30%_20%] gap-4">
                {/* Left Column - Concept Details (Tabs) */}
                <div className="space-y-8">
                  <Tabs defaultValue="quick-recall" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="quick-recall">
                        <Sparkles className="mr-2 h-4 w-4" /> Quick Recall
                      </TabsTrigger>
                      <TabsTrigger value="deep-dive">
                        <BookOpen className="mr-2 h-4 w-4" /> Deep Dive
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Quick Recall Content */}
                    <TabsContent value="quick-recall" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Quick Recall</CardTitle>
                          <CardDescription>The essential information for a quick review.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {concept.keyTakeaway && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2 text-primary">Key Takeaway</h3>
                              <p className="text-base leading-relaxed">{concept.keyTakeaway}</p>
                            </div>
                          )}
                          {concept.analogy && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2 text-primary">Analogy</h3>
                              <p className="text-base italic leading-relaxed">"{concept.analogy}"</p>
                            </div>
                          )}
                          {concept.summary && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Summary</h3>
                              <div className="text-base leading-relaxed">{concept.summary}</div>
                            </div>
                          )}
                          {practicalTips.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Practical Tips</h3>
                              <ul className="space-y-3 list-disc pl-6">
                                {practicalTips.map((tip: string, index: number) => (
                                  <li key={index} className="leading-relaxed">
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Deep Dive Content */}
                    <TabsContent value="deep-dive" className="mt-4">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Deep Dive</CardTitle>
                            <CardDescription>The comprehensive details for in-depth study.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-8">
                            {keyPoints.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Key Points</h3>
                                <ul className="space-y-3 list-disc pl-6">
                                  {keyPoints.map((point: string, index: number) => (
                                    <li key={index} className="leading-relaxed">
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {concept.details && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">Detailed Information</h3>
                                <div className="space-y-4 leading-relaxed">
                                  {formatDetailsText(concept.details)}
                                </div>
                              </div>
                            )}
                             {examples.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Examples</h3>
                                <ul className="space-y-3 list-disc pl-6">
                                  {examples.map((example: string, index: number) => (
                                    <li key={index} className="leading-relaxed">
                                      {example}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                         {/* Code Examples Section */}
                        {concept.codeSnippets && concept.codeSnippets.length > 0 && (
                          <div className="space-y-6">
                            <div className="flex items-center mb-4">
                              <Code className="mr-2 h-5 w-5" />
                              <h2 className="text-xl font-semibold">Code Examples</h2>
                            </div>
                            {concept.codeSnippets.map((snippet: any) => (
                              <Card key={snippet.id} className="group">
                                <CardHeader className="pb-3">
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
                                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                                    <code>{snippet.code}</code>
                                  </pre>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Middle Column - Enhanced Concepts (30% width) */}
                <div className="space-y-6">
                  {/* Enhanced Concepts Card */}
                  {(concept.videoResources || (concept.commonMistakes && JSON.parse(concept.commonMistakes).length > 0) || concept.personalNotes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Enhanced Resources</CardTitle>
                        <CardDescription>Additional materials and notes</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Video Resources */}
                        {concept.videoResources && (() => {
                          try {
                            const videos = JSON.parse(concept.videoResources);
                            return videos.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <Video className="mr-2 h-4 w-4" />
                                  Video Resources ({videos.length})
                                </div>
                                <div className="space-y-2">
                                  {videos.map((url: string, index: number) => (
                                    <a 
                                      key={index}
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="block text-sm text-blue-600 hover:underline break-words"
                                      onClick={(e) => e.stopPropagation()}
                                      title={url}
                                    >
                                      {url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                        
                        {/* Common Mistakes */}
                        {concept.commonMistakes && (() => {
                          try {
                            const mistakes = JSON.parse(concept.commonMistakes);
                            if (!Array.isArray(mistakes) || mistakes.length === 0) return null;
                            return (
                              <div className="space-y-3">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Common Mistakes ({mistakes.length})
                                </div>
                                <div className="space-y-2">
                                  {mistakes.map((mistake: string, index: number) => (
                                    <div key={index} className="text-sm text-amber-700 dark:text-amber-300 break-words">
                                      • {mistake}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                        
                        {/* Personal Notes */}
                        {concept.personalNotes && (
                          <div className="space-y-3">
                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                              <FileText className="mr-2 h-4 w-4" />
                              Additional Notes
                            </div>
                            <div className="text-sm text-muted-foreground break-words">
                              {concept.personalNotes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-3 border-t">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/concept/${concept.id}/enhance`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Resources
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                  
                  {/* Show edit button even if no enhancements exist */}
                  {!(concept.videoResources || (concept.commonMistakes && JSON.parse(concept.commonMistakes).length > 0) || concept.personalNotes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Enhanced Resources</CardTitle>
                        <CardDescription>Add resources and notes to enhance this concept</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/concept/${concept.id}/enhance`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Add Resources
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Smart Learning Sidebar (20% width) */}
                <div className="space-y-4">
                  {/* Smart Learning Dashboard - Only show if backend is available */}
                  {!smartLoading && (learningJourney || quickInsights.length > 0 || smartSuggestions.length > 0) ? (
                    <SmartLearningDashboard 
                      userId={localStorage.getItem('userId') || 'default'}
                      onSuggestionClick={(suggestion) => {
                        toast({
                          title: "Smart Suggestion",
                          description: suggestion.title,
                          duration: 5000,
                        })
                      }}
                      compact={true}
                    />
                  ) : smartLoading ? (
                    <Card className="animate-pulse bg-gray-50">
                      <CardHeader className="pb-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4 text-gray-500" />
                          Smart Learning
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-gray-600">
                          Smart learning features require the extraction service to be running.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => refreshSmartData()}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Retry Connection
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Smart Insights for Current Concept */}
                  {smartSuggestions.length > 0 && (
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          Concept Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {smartSuggestions.slice(0, 2).map((suggestion, index) => (
                          <div key={index} className="p-2 bg-white/70 rounded-lg border border-purple-100">
                            <h4 className="text-xs font-medium text-purple-800">{suggestion.title}</h4>
                            <p className="text-xs text-purple-600 mt-1">{suggestion.description.substring(0, 80)}...</p>
                            <Badge variant="outline" className="text-xs mt-1 border-purple-300 text-purple-700">
                              {suggestion.priority} priority
                            </Badge>
                          </div>
                        ))}
                        {smartSuggestions.length > 2 && (
                          <div className="text-center pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-purple-600 hover:text-purple-700"
                              onClick={() => refreshSmartData()}
                            >
                              View {smartSuggestions.length - 2} more insights
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Learning Journey Progress */}
                  {learningJourney && (
                    <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Learning Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">{progressPercentage}%</div>
                          <div className="text-xs text-green-600">Overall Progress</div>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        {learningJourney.recommendations?.immediate_next && learningJourney.recommendations.immediate_next.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-green-800 mb-1">Next Steps:</div>
                            {learningJourney.recommendations.immediate_next.slice(0, 2).map((step, index) => (
                              <div key={index} className="text-xs text-green-600 mb-1">• {step}</div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Insights */}
                  {quickInsights.length > 0 && (
                    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-600" />
                          Quick Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {quickInsights.slice(0, 2).map((insight, index) => (
                          <div key={index} className="p-2 bg-white/70 rounded-lg border border-yellow-100">
                            <div className="flex items-center gap-1 mb-1">
                              {React.createElement(
                                insight.icon === 'Code' ? Code : 
                                insight.icon === 'TrendingUp' ? TrendingUp : 
                                insight.icon === 'Users' ? Users : Brain, 
                                { className: `h-3 w-3 text-${insight.color}-500` }
                              )}
                              <span className="text-xs font-medium text-yellow-800">{insight.title}</span>
                            </div>
                            <p className="text-xs text-yellow-600">{insight.description.substring(0, 60)}...</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Related Concepts Section - Improved Grid Layout */}
              {hasRelatedConcepts && (
                <div className="mt-8 px-2">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Related Concepts
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Database-linked concepts */}
                    {relatedConcepts && relatedConcepts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-muted-foreground mb-4 flex items-center gap-2">
                          🔗 Connected Concepts
                          <Badge variant="secondary" className="text-sm">
                            {relatedConcepts.length} linked
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {relatedConcepts.map((relatedConcept) => (
                            <Card key={relatedConcept.id} className="hover:shadow-lg transition-shadow group">
                              <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                  <CardTitle className="text-lg font-semibold">{relatedConcept.title}</CardTitle>
                                  <div className="flex gap-2 items-center">
                                    {relatedConcept.category && <Badge variant="outline" className="text-xs">{relatedConcept.category}</Badge>}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
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
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {relatedConcept.summary && (
                                  <CardDescription className="line-clamp-3 text-sm">
                                    {relatedConcept.summary.substring(0, 150)}...
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardFooter className="pt-0">
                                <Button variant="outline" size="sm" asChild className="w-full">
                                  <Link href={`/concept/${relatedConcept.id}`}>
                                    View Concept
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto-Discovered Relationships Section - Temporarily Disabled */}
              {/* TODO: Re-enable when AutoRelationships component is available */}

              {/* Related Conversations Section - At the Bottom */}
              {relatedConversations && relatedConversations.length > 0 && (
                <div className="mt-8 px-2">
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
        </div>
      </PageTransition>
    </AuthGuard>
  )
} 