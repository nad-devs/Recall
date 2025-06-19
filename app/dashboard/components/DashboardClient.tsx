"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, ArrowRight, Brain, Edit2, Check, X, LogOut, MessageSquare, Network } from "lucide-react"
import { DashboardConceptCard } from "@/components/dashboard-concept-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { PageTransition } from "@/components/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DashboardLoading } from "@/components/dashboard-loading"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import featureFlags from '@/lib/feature-flags'
import { SmartLearningDashboard } from "@/components/smart-learning/SmartLearningDashboard"

interface DashboardData {
  conceptsCount: number;
  categoriesCount: number;
  conceptsToReview: any[];
  recentConcepts: any[];
}

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [dashboardData, setDashboardData] = useState(initialData)
  const [loading, setLoading] = useState(false) // No longer fetching on client, so default to false
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)

  // Set user name and handle auth redirection
  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (session?.user) {
      const name = session.user.name || session.user.email || "User";
      setUserName(name);
      setEditedName(name);
    } else {
      // If there's no session and status is not loading, redirect
      router.push('/');
    }
  }, [session, status, router]);

  const handleEditName = () => {
    setIsEditingName(true)
    setEditedName(userName)
  }

  const handleSaveName = async () => {
    setUserName(editedName)
    setIsEditingName(false)
    localStorage.setItem('userName', editedName)
    // Here you would also make an API call to save the user's name to the database
    // await fetch('/api/user/update-name', { method: 'POST', body: JSON.stringify({ name: editedName }) });
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowLoadingScreen(false), 500); // Simple delay for loading animation
    return () => clearTimeout(timer);
  }, []);


  if (showLoadingScreen) {
    return <DashboardLoading onComplete={() => setShowLoadingScreen(false)} />;
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-7xl py-6 space-y-8 relative">
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Dashboard</h1>
            <p className="text-muted-foreground">Track your learning journey and explore your knowledge base</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" asChild className="shadow-sm">
              <Link href="/analyze">
                <Brain className="mr-2 h-4 w-4" />
                Analyze Content
              </Link>
            </Button>
            <Button variant="outline" asChild className="shadow-sm">
              <Link href="/concepts">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Concepts
              </Link>
            </Button>
            {featureFlags.enableKnowledgeGraph && (
              <Button variant="outline" asChild className="shadow-sm">
                <Link href="/graph">
                  <Network className="mr-2 h-4 w-4" />
                  Knowledge Graph
                </Link>
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => {
                localStorage.clear();
                signOut({ callbackUrl: '/' });
              }}
              className="text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.conceptsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.categoriesCount}</div>
            </CardContent>
          </Card>
          {/* Smart Learning compact widget */}
          {session?.user?.id && (
            <div className="sm:col-span-2">
              <SmartLearningDashboard 
                userId={session.user.id}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* Full Smart Learning Dashboard */}
        {session?.user?.id && (
          <div className="space-y-6">
            <SmartLearningDashboard 
              userId={session.user.id}
              compact={false}
            />
          </div>
        )}
        
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Concepts</CardTitle>
              <CardDescription>Your most recently analyzed and saved topics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.recentConcepts.length > 0 ? (
                dashboardData.recentConcepts.map(concept => (
                  <DashboardConceptCard key={concept.id} concept={concept} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent concepts. Analyze some content to get started!</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Concepts to Review</CardTitle>
              <CardDescription>Topics you might want to revisit to strengthen your knowledge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.conceptsToReview.length > 0 ? (
                dashboardData.conceptsToReview.map(concept => (
                  <DashboardConceptCard key={concept.id} concept={concept} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">You're on top of everything! No concepts need review right now.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
} 