"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, ArrowRight, Brain, Edit2, Check, X, LogOut } from "lucide-react"
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
    conceptsCount: 0,
    categoriesCount: 0,
    conceptsToReview: [] as any[],
    recentConcepts: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Simplified authentication check - trust the server
  useEffect(() => {
    if (status === 'loading') {
      return
    }

    // Check for email-based session first
    const userEmail = localStorage.getItem('userEmail')
    const userId = localStorage.getItem('userId')
    
    if (userEmail && userId) {
      // Email-based session is valid
      setAuthChecked(true)
      fetchDashboardData()
      return
    }
    
    // Check NextAuth session
    if (session?.user?.email) {
      // NextAuth session is valid
      setAuthChecked(true)
      setUserName(session.user.name || session.user.email || "User")
      setEditedName(session.user.name || session.user.email || "User")
      
      // Store session data in localStorage for API calls
      if (session.user.email) {
        localStorage.setItem('userEmail', session.user.email)
        localStorage.setItem('userName', session.user.name || session.user.email || "User")
        localStorage.setItem('userId', session.user.id || session.user.email)
        
        const initials = (session.user.name || session.user.email || "User")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
          .slice(0, 2)
        localStorage.setItem('userInitials', initials)
      }
      
      fetchDashboardData()
      return
    }
    
    // No valid session found
    if (!userEmail && !session) {
      router.push('/')
      return
    }
  }, [session, status, router])

  const handleEditName = () => {
    setIsEditingName(true)
    setEditedName(userName)
  }

  const handleSaveName = () => {
    setUserName(editedName)
    setIsEditingName(false)
    
    // Update localStorage
    localStorage.setItem('userName', editedName)
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

  // Fixed loading complete handler - only hide loading screen after data is actually loaded
  const handleLoadingComplete = () => {
    if (dataLoaded) {
      setShowLoadingScreen(false)
    } else {
      setTimeout(() => {
        setShowLoadingScreen(false)
      }, 3000)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setDataLoaded(false)
      
      // Prepare headers for both email-based and OAuth sessions
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      // For email-based sessions
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
      } 
      // For OAuth sessions, use session data
      else if (session?.user?.email) {
        headers['x-user-email'] = session.user.email
        headers['x-user-id'] = session.user.id || ''
      }
      
      // Fetch concepts
      const conceptsResponse = await fetch('/api/concepts', { headers })
      const conceptsData = await conceptsResponse.json()
      
      // Extract concepts array from the response object
      const concepts = conceptsData.concepts || conceptsData || []
      
      // Check if we got error responses and provide fallbacks
      if (!Array.isArray(concepts)) {
        if (concepts && typeof concepts === 'object' && concepts.error) {
          console.error('Concepts API error:', concepts.error)
        }
      }
      
      // Process data - use safe arrays
      const safeConcepts = Array.isArray(concepts) ? concepts : []
      
      const conceptsCount = safeConcepts.length
      
      // Count unique categories
      const uniqueCategories = [...new Set(safeConcepts.map((c: any) => c.category).filter(Boolean))]
      const categoriesCount = uniqueCategories.length
      
      // Get concepts that need review (lower confidence score)
      const conceptsToReview = safeConcepts
        .filter((c: any) => c.confidenceScore && c.confidenceScore < 0.7)
        .slice(0, 5)
      
      // Get recent concepts (sorted by creation date)
      const recentConcepts = safeConcepts
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5) // Show 5 recent concepts instead of 8
      
      setDashboardData({
        conceptsCount,
        categoriesCount,
        conceptsToReview,
        recentConcepts
      })
      
      // Mark data as loaded AFTER setting dashboard data
      setDataLoaded(true)
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Even on error, mark as loaded to prevent infinite loading
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // Effect to hide loading screen once data is loaded
  useEffect(() => {
    if (dataLoaded && !loading) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowLoadingScreen(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [dataLoaded, loading])

  // Show loading screen if still loading or if we haven't completed the loading animation
  return showLoadingScreen ? (
    <DashboardLoading onComplete={handleLoadingComplete} />
  ) : (
    <PageTransition>
      <div className="container mx-auto max-w-7xl py-6 space-y-8 relative">
        {/* Floating theme toggle in corner */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

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
              <Button 
                variant="ghost" 
              onClick={() => {
                // Clear localStorage for email-based sessions
                localStorage.removeItem('userName')
                localStorage.removeItem('userEmail')
                localStorage.removeItem('userId')
                localStorage.removeItem('userInitials')
                
                // Sign out from NextAuth (for OAuth sessions)
                signOut({ callbackUrl: "/" })
              }}
                className="shadow-sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
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
                You've learned about {dashboardData.conceptsCount} concepts across {dashboardData.categoriesCount} categories through conversation analysis.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="px-2 py-1">
                  <BookOpen className="mr-1 h-3 w-3" /> {dashboardData.conceptsCount} Concepts
                </Badge>
                <Badge variant="secondary" className="px-2 py-1">
                  <svg className="mr-1 h-3 w-3 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {dashboardData.categoriesCount} Categories
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
          {/* Recent Concepts - Now takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                Recent Concepts
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/concepts">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dashboardData.recentConcepts.length === 0 && !loading ? (
                <div>
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
                </div>
              ) : (
                dashboardData.recentConcepts.map((concept: any) => (
                  <ConceptCard key={concept.id} concept={concept} />
                ))
              )}
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

// Concept card component for displaying recent concepts with more details
function ConceptCard({ concept }: { concept: any }) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, [role="button"]');
    
    if (isInteractiveElement) {
      return; // Let the interactive element handle the click
    }
    
    // Navigate to concept view on normal click
    e.preventDefault();
    router.push(`/concept/${concept.id}`);
  }

  // Parse key points if they exist
  let keyPoints: string[] = []
  try {
    if (concept.keyPoints) {
      keyPoints = Array.isArray(concept.keyPoints) 
        ? concept.keyPoints 
        : JSON.parse(concept.keyPoints)
    }
  } catch {
    keyPoints = []
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{concept.title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {concept.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{concept.summary}</CardDescription>
      </CardHeader>
      {keyPoints.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Key Points:</p>
            <ul className="text-sm space-y-1">
              {keyPoints.slice(0, 2).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5 block w-1 h-1 rounded-full bg-current flex-shrink-0" />
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
              {keyPoints.length > 2 && (
                <li className="text-xs text-muted-foreground italic">
                  +{keyPoints.length - 2} more points...
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      )}
      <CardFooter className="pt-2">
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href={`/concept/${concept.id}`}>
            View Details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 