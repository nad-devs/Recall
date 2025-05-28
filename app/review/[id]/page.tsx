"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle, LockIcon } from "lucide-react"
import { ConceptQuiz } from "@/components/concept-quiz"
import { useToast } from "@/hooks/use-toast"

interface Concept {
  id: string
  title: string
  category: string
  summary: string
  details?: string
  keyPoints: string[] | string
  notes?: string
}

interface PageParams {
  id: string
}

export default function ConceptReviewPage({ params }: { params: Promise<PageParams> }) {
  const [concept, setConcept] = useState<Concept | null>(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const { toast } = useToast()

  // Unwrap params using React.use()
  const resolvedParams = use(params)

  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail')
      const userId = localStorage.getItem('userId')
      
      console.log('🔧 Review page auth check - userEmail:', userEmail ? 'present' : 'missing')
      console.log('🔧 Review page auth check - userId:', userId ? 'present' : 'missing')
      
      // For email-based sessions
      if (userEmail && userId) {
        headers['x-user-email'] = userEmail
        headers['x-user-id'] = userId
        console.log('🔧 Added email-based auth headers to review page')
      } else {
        console.warn('🔧 No authentication data found in localStorage for review page')
      }
    } else {
      console.log('🔧 Server-side environment, no localStorage available')
    }
    
    return headers
  }

  useEffect(() => {
    const conceptId = resolvedParams.id
    if (!conceptId) return

    async function fetchConceptAndGenerateQuiz() {
      try {
        setLoading(true)
        
        // Fetch concept from database with authentication headers
        console.log('🔧 Fetching concept with ID:', conceptId)
        const conceptRes = await fetch(`/api/concepts/${conceptId}`, {
          headers: getAuthHeaders()
        })
        
        console.log('🔧 Concept fetch response status:', conceptRes.status)
        
        if (!conceptRes.ok) {
          if (conceptRes.status === 401) {
            toast({
              title: "Authentication Error",
              description: "Please refresh the page and try again. Your session may have expired.",
              variant: "destructive",
              duration: 5000,
            })
            throw new Error('Authentication failed. Please refresh the page and try again.')
          }
          throw new Error("Failed to fetch concept")
        }
        
        const conceptData = await conceptRes.json()
        console.log('🔧 Concept data received:', conceptData)
        
        const conceptObj = conceptData.concept
        setConcept(conceptObj)
        
        // Parse keyPoints if needed
        let keyPoints: string[] = []
        if (typeof conceptObj.keyPoints === 'string') {
          try {
            const parsed = JSON.parse(conceptObj.keyPoints)
            keyPoints = Array.isArray(parsed) ? parsed : [conceptObj.keyPoints]
          } catch {
            keyPoints = [conceptObj.keyPoints]
          }
        } else if (Array.isArray(conceptObj.keyPoints)) {
          keyPoints = conceptObj.keyPoints
        }
        
        // Generate quiz questions via API route with authentication headers
        console.log('🔧 Generating quiz questions...')
        const quizResponse = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            concept: {
              title: conceptObj.title,
              summary: conceptObj.summary,
              details: conceptObj.details || "",
              keyPoints: JSON.stringify(keyPoints),
              id: conceptObj.id
            }
          })
        });

        console.log('🔧 Quiz generation response status:', quizResponse.status)

        if (!quizResponse.ok) {
          if (quizResponse.status === 401) {
            toast({
              title: "Authentication Error",
              description: "Please refresh the page and try again. Your session may have expired.",
              variant: "destructive",
              duration: 5000,
            })
            throw new Error('Authentication failed for quiz generation. Please refresh the page and try again.')
          }
          throw new Error("Failed to generate quiz questions")
        }

        const generatedQuestionsObj = await quizResponse.json();
        const generatedQuestions = generatedQuestionsObj.questions || [];
        console.log('🔧 Generated questions:', generatedQuestions.length)
        setQuestions(generatedQuestions)
        setTotalQuestions(generatedQuestions.length)
      } catch (error) {
        console.error("Error loading concept:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load concept or generate quiz",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchConceptAndGenerateQuiz()
  }, [resolvedParams.id, toast])

  const handleQuizComplete = async (score: number) => {
    setQuizCompleted(true)
    setQuizScore(score)
    
    const conceptId = resolvedParams.id
    if (!conceptId) return
    
    // Update review stats in database with authentication headers
    try {
      console.log('🔧 Updating review stats for concept:', conceptId)
      const response = await fetch(`/api/concepts/${conceptId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score, totalQuestions })
      })
      
      console.log('🔧 Review update response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please refresh the page and try again. Your session may have expired.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Authentication failed for review update. Please refresh the page and try again.')
        } else if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
            duration: 5000,
          })
          throw new Error('Rate limited')
        }
        throw new Error("Failed to update review stats")
      }
      
      const responseData = await response.json()
      console.log('🔧 Review update successful:', responseData)
      
      toast({
        title: "Review Completed",
        description: "Your progress has been saved",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error updating review stats:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save review progress",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded max-w-md mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!concept) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Concept not found</h1>
        <Button asChild>
          <Link href="/concepts">Back to Concepts</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/concepts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review: {concept.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Badge>{concept.category}</Badge>
          </div>
        </div>
      </div>

      {!quizCompleted ? (
        questions.length > 0 ? (
          <ConceptQuiz concept={concept} questions={questions} onComplete={handleQuizComplete} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Quiz Questions Available</CardTitle>
              <CardDescription>We don't have any quiz questions for this concept yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Try reviewing the concept notes instead.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/concept/${concept.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Concept Notes
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      ) : (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="mr-2 h-5 w-5" />
              Quiz Completed!
            </CardTitle>
            <CardDescription>
              You scored {quizScore > totalQuestions ? totalQuestions : quizScore} out of {totalQuestions} ({Math.round(((quizScore > totalQuestions ? totalQuestions : quizScore) / totalQuestions) * 100)}%)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p>Great job reviewing {concept.title}! Continue exploring other concepts or return to the dashboard.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/concepts">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Concepts
              </Link>
            </Button>
            <Button asChild>
                              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Concept Notes Card - Blurred until quiz is completed */}
      <Card className={!quizCompleted ? "relative" : ""}>
        {!quizCompleted && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-md">
            <LockIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground font-medium">Complete the quiz to unlock concept notes</p>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Concept Notes
          </CardTitle>
          <CardDescription>Review these notes to refresh your understanding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <p className="text-muted-foreground">{concept.summary}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Key Points</h3>
              <ul className="list-disc pl-5 space-y-1">
                {(() => {
                  try {
                    const keyPoints = typeof concept.keyPoints === 'string' 
                      ? JSON.parse(concept.keyPoints || '[]')
                      : concept.keyPoints;
                    return Array.isArray(keyPoints) ? keyPoints.map((point, idx) => (
                      <li key={idx} className="text-muted-foreground">{point}</li>
                    )) : <li className="text-muted-foreground">{keyPoints}</li>;
                  } catch {
                    return <li className="text-muted-foreground">{typeof concept.keyPoints === 'string' ? concept.keyPoints : concept.notes}</li>;
                  }
                })()}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
