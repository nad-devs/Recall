"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, ArrowRight, Brain, Edit2, Check, X, LogOut } from "lucide-react"
import { ConversationCard } from "@/components/conversation-card"
import { DashboardConceptCard } from "@/components/dashboard-concept-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { PageTransition } from "@/components/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DashboardLoading } from "@/components/dashboard-loading"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [dashboardData, setDashboardData] = useState({
    conversationsCount: 0,
    conceptsCount: 0,
    categoriesCount: 0,
    conceptsToReview: [] as any[],
    recentConversations: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Check for demo mode or authentication
  useEffect(() => {
    if (status === "loading") return // Still loading
    
    const demoMode = localStorage.getItem('demoMode')
    const demoUser = localStorage.getItem('demoUser')
    
    if (demoMode === 'true' && demoUser) {
      // Demo mode
      setIsDemoMode(true)
      const user = JSON.parse(demoUser)
      setUserName(user.name)
      setEditedName(user.name)
      fetchDemoData()
      
      // Show upgrade prompt after 2 minutes of usage
      setTimeout(() => setShowUpgradePrompt(true), 2 * 60 * 1000)
    } else if (status === "unauthenticated") {
      // Not authenticated and not in demo mode
      router.push("/auth/signin")
      return
    } else if (session?.user) {
      // Authenticated user
      setUserName(session.user.name || session.user.email || "User")
      setEditedName(session.user.name || session.user.email || "User")
      fetchDashboardData()
    }
  }, [status, session, router])

  const fetchDemoData = () => {
    // Load demo data from localStorage
    const conversations = JSON.parse(localStorage.getItem('demoConversations') || '[]')
    const concepts = JSON.parse(localStorage.getItem('demoConcepts') || '[]')
    
    setDashboardData({
      conversationsCount: conversations.length,
      conceptsCount: concepts.length,
      categoriesCount: new Set(concepts.map((c: any) => c.category)).size,
      conceptsToReview: concepts.filter((c: any) => c.needsReview).slice(0, 3),
      recentConversations: conversations.slice(-3).reverse()
    })
    setLoading(false)
    setTimeout(() => setShowLoadingScreen(false), 1500)
  }

  const handleUpgradeAccount = () => {
    // Store current demo data for migration
    localStorage.setItem('pendingMigration', 'true')
    router.push('/auth/signin')
  }

  const handleEditName = () => {
    setIsEditingName(true)
    setEditedName(userName)
  }

  const handleSaveName = () => {
    if (editedName.trim()) {
      const trimmedName = editedName.trim()
      setUserName(trimmedName)
      localStorage.setItem('userName', trimmedName)
      
      // Update initials as well
      const initials = trimmedName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2)
      localStorage.setItem('userInitials', initials)
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setEditedName(userName)
    setIsEditingName(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch conversations
      const conversationsResponse = await fetch('/api/conversations')
      const conversations = await conversationsResponse.json()
      console.log('Dashboard: Fetched conversations:', conversations.length, conversations)
      
      // Fetch concepts
      const conceptsResponse = await fetch('/api/concepts')
      console.log('Dashboard: Concepts response status:', conceptsResponse.status)
      const conceptsData = await conceptsResponse.json()
      console.log('Dashboard: Fetched concepts raw response:', conceptsData)
      
      // Extract concepts array from the response object
      const concepts = conceptsData.concepts || conceptsData || []
      console.log('Dashboard: Extracted concepts array:', concepts)
      
      // Check if we got error responses and provide fallbacks
      if (!Array.isArray(conversations)) {
        console.warn('Conversations response is not an array, using empty fallback:', conversations)
        if (conversations && typeof conversations === 'object' && conversations.error) {
          console.error('Conversations API error:', conversations.error)
        }
      }
      
      if (!Array.isArray(concepts)) {
        console.warn('Concepts response is not an array, using empty fallback:', concepts)
        if (concepts && typeof concepts === 'object' && concepts.error) {
          console.error('Concepts API error:', concepts.error)
        }
      }
      
      // Process data - use safe arrays
      const safeConversations = Array.isArray(conversations) ? conversations : []
      const safeConcepts = Array.isArray(concepts) ? concepts : []
      
      const conversationsCount = safeConversations.length
      const conceptsCount = safeConcepts.length
      
      // Count unique categories
      const uniqueCategories = [...new Set(safeConcepts.map((c: any) => c.category).filter(Boolean))]
      const categoriesCount = uniqueCategories.length
      
      // Get concepts that need review (lower confidence score)
      const conceptsToReview = safeConcepts
        .filter((c: any) => c.confidenceScore && c.confidenceScore < 0.7)
        .slice(0, 3)
      
      // Get recent conversations (already sorted by API)
      const recentConversations = safeConversations.slice(0, 5)
      
      console.log('Dashboard: Processed data:', {
        conversationsCount,
        conceptsCount,
        categoriesCount,
        conceptsToReview: conceptsToReview.length,
        recentConversations: recentConversations.length
      })
      
      setDashboardData({
        conversationsCount,
        conceptsCount,
        categoriesCount,
        conceptsToReview,
        recentConversations
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading screen if still loading or if we haven't completed the loading animation
  if (showLoadingScreen) {
    return <DashboardLoading onComplete={handleLoadingComplete} />
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-7xl py-6 space-y-8 relative">
        {/* Floating theme toggle in corner */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Upgrade Prompt Banner */}
        {isDemoMode && showUpgradePrompt && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Loving the demo? Save your progress!</h3>
                  <p className="text-sm text-gray-600">
                    Create a free account to save your data permanently and sync across devices.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleUpgradeAccount}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Create Account
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowUpgradePrompt(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header with title and action buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Dashboard</h1>
            <p className="text-muted-foreground">Track your learning journey and explore your knowledge base</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" asChild className="shadow-sm">
              <Link href="/analyze">
                <Brain className="mr-2 h-4 w-4" />
                Analyze Conversation
              </Link>
            </Button>
            <Button variant="outline" asChild className="shadow-sm">
              <Link href="/concepts">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Concepts
              </Link>
            </Button>
            <Button variant="outline" asChild className="shadow-sm">
              <Link href="/conversations">
                <ArrowRight className="mr-2 h-4 w-4" />
                Conversations
              </Link>
            </Button>
            {isDemoMode ? (
              <Button 
                variant="outline" 
                onClick={handleUpgradeAccount}
                className="shadow-sm bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:from-green-100 hover:to-blue-100"
              >
                <Brain className="mr-2 h-4 w-4" />
                Upgrade Account
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="shadow-sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Welcome card */}
        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold">Welcome back,</h2>
                    <div className="flex items-center gap-1">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="text-2xl font-semibold h-auto py-1 px-2 border-2 border-blue-300 focus:border-blue-500"
                        placeholder="Enter your name"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveName}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-2xl font-semibold">!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      Welcome back{userName ? `, ${userName}` : ''}!
                    </h2>
                    {userName && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditName}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit your name"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mb-4">
                You've analyzed {dashboardData.conversationsCount} conversations and learned about {dashboardData.conceptsCount} concepts across {dashboardData.categoriesCount} categories.
                {isDemoMode && (
                  <span className="block mt-2 text-sm text-amber-600 font-medium">
                    🚀 Demo Mode - Data stored locally. Create an account to save permanently!
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="px-2 py-1">
                  <BookOpen className="mr-1 h-3 w-3" /> {dashboardData.conceptsCount} Concepts
                </Badge>
                <Badge variant="secondary" className="px-2 py-1">
                  <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 9h8m-8 4h6m-6 4h4M5 7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {dashboardData.conversationsCount} Conversations
                </Badge>
                <Badge variant="secondary" className="px-2 py-1">
                  <svg className="mr-1 h-3 w-3 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9v4m0 4h.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {dashboardData.conceptsToReview.length} concepts need review
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-muted/50 flex items-center justify-center">
                <Brain className="h-14 w-14 md:h-16 md:w-16 text-foreground/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Conversations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="mr-2 h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Recent Conversations
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/conversations">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {dashboardData.recentConversations.length === 0 && !loading ? (
                <Card className="bg-card border-border">
                  <CardContent className="py-8 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Brain className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to start learning?</h3>
                        <p className="text-muted-foreground mb-4">
                          You haven't analyzed any conversations yet. Upload your first conversation to extract concepts and build your knowledge base!
                        </p>
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Link href="/analyze">
                            <Brain className="mr-2 h-4 w-4" />
                            Analyze Your First Conversation
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                dashboardData.recentConversations.map((conversation: any) => {
                // Use the title directly from the API (which now includes LLM-generated titles)
                const title = conversation.title || 'Untitled Conversation';
                const summary = conversation.summary || '';
                
                // Format conversation data for ConversationCard
                const conversationData = {
                  id: conversation.id,
                  title: title,
                  summary: summary,
                  date: conversation.createdAt,
                  concepts: conversation.concepts?.map((concept: any) => ({
                    id: concept.id,
                    title: concept.title
                  })) || []
                };
                
                return (
                  <ConversationCard key={conversation.id} conversation={conversationData} />
                );
              }))}
            </div>
          </div>

          {/* Concepts to Review */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="mr-2 h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v4m0 4h.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Concepts to Review
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/concepts">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {dashboardData.conceptsToReview.map((concept: any) => (
                <DashboardConceptCard 
                  key={concept.id} 
                  concept={{
                    id: concept.id,
                    title: concept.title,
                    summary: concept.summary,
                    category: concept.category
                  }} 
                />
              ))}
              {dashboardData.conceptsToReview.length === 0 && dashboardData.conceptsCount === 0 && !loading && (
                <Card className="bg-card border-border">
                  <CardContent className="py-6 text-center">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">No concepts yet</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Start by analyzing a conversation to extract your first concepts!
                        </p>
                        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                          <Link href="/analyze">
                            <Brain className="mr-1 h-3 w-3" />
                            Analyze Conversation
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {dashboardData.conceptsToReview.length === 0 && dashboardData.conceptsCount > 0 && !loading && (
                <Card className="bg-card border-border">
                  <CardContent className="py-6 text-center">
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground">No concepts need review at this time.</p>
                      <p className="text-sm text-muted-foreground">All your concepts are well understood!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 