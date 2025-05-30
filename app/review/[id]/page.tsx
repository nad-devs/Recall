"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle, LockIcon, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react"
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
        
        // Check for authentication first
        const userEmail = localStorage.getItem('userEmail');
        const userId = localStorage.getItem('userId');
        
        if (!userEmail || !userId) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to review concepts and generate quizzes.",
            variant: "destructive",
            duration: 5000,
          });
          setLoading(false);
          return;
        }

        // Fetch the concept data
        const conceptResponse = await fetch(`/api/concepts/${conceptId}`, {
          headers: getAuthHeaders()
        });

        if (!conceptResponse.ok) {
          if (conceptResponse.status === 401) {
            toast({
              title: "Authentication Error",
              description: "Please sign in to view concepts and generate quizzes.",
              variant: "destructive",
              duration: 5000,
            });
            setLoading(false);
            return;
          }
          throw new Error("Failed to load concept data");
        }

        const conceptObj = await conceptResponse.json();
        setConcept(conceptObj.concept);

        // Generate quiz based on the concept
        console.log('🔧 Generating quiz for concept:', conceptObj.concept.title);
        console.log('🔧 Auth headers:', getAuthHeaders());

        // Parse key points if they're stored as a string
        let keyPoints = [];
        try {
          if (conceptObj.concept.keyPoints) {
            if (typeof conceptObj.concept.keyPoints === 'string') {
              keyPoints = JSON.parse(conceptObj.concept.keyPoints);
            } else if (Array.isArray(conceptObj.concept.keyPoints)) {
              keyPoints = conceptObj.concept.keyPoints;
            }
          }
        } catch (e) {
          console.error('Error parsing key points:', e);
        }

        const quizResponse = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            concept: {
              title: conceptObj.concept.title,
              summary: conceptObj.concept.summary,
              details: conceptObj.concept.details || "",
              keyPoints: JSON.stringify(keyPoints),
              id: conceptObj.concept.id
            }
          })
        });

        console.log('🔧 Quiz generation response status:', quizResponse.status);

        if (!quizResponse.ok) {
          if (quizResponse.status === 401) {
            toast({
              title: "Authentication Error",
              description: "Please sign in to generate quizzes. Your session may have expired.",
              variant: "destructive",
              duration: 5000,
            });
            throw new Error('Authentication failed for quiz generation. Please refresh and sign in again.');
          }
          throw new Error("Failed to generate quiz questions");
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

  // Function to generate appropriate feedback based on score
  const getScoreFeedback = (score: number, total: number) => {
    const percentage = (score / total) * 100
    
    if (percentage === 100) {
      return {
        message: "Perfect score! Outstanding work!",
        suggestion: "You've mastered this concept completely.",
        color: "green",
        variant: "default" as const
      }
    } else if (percentage >= 80) {
      return {
        message: "Excellent work!",
        suggestion: "You have a strong understanding of this concept.",
        color: "green",
        variant: "default" as const
      }
    } else if (percentage >= 70) {
      return {
        message: "Good job!",
        suggestion: "You're on the right track. Review the areas you missed.",
        color: "blue",
        variant: "default" as const
      }
    } else if (percentage >= 60) {
      return {
        message: "Not bad, but room for improvement.",
        suggestion: "Consider reviewing this concept more thoroughly.",
        color: "yellow",
        variant: "default" as const
      }
    } else if (percentage >= 40) {
      return {
        message: "Needs more study.",
        suggestion: "This concept requires additional review and practice.",
        color: "orange",
        variant: "destructive" as const
      }
    } else {
      return {
        message: "Keep studying!",
        suggestion: "This concept needs significant review. Don't give up!",
        color: "red",
        variant: "destructive" as const
      }
    }
  }

  const handleQuizComplete = async (score: number) => {
    setQuizCompleted(true)
    setQuizScore(score)
    
    const conceptId = resolvedParams.id
    if (!conceptId) return
    
    const feedback = getScoreFeedback(score, totalQuestions)
    
    // Try to update review stats in database, but don't show errors to user
    try {
      console.log('🔧 Updating review stats for concept:', conceptId)
      const response = await fetch(`/api/concepts/${conceptId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score, totalQuestions })
      })
      
      console.log('🔧 Review update response status:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('🔧 Review update successful:', responseData)
        
        // Show success toast with appropriate feedback
        toast({
          title: "Quiz Completed!",
          description: `You scored ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%). ${feedback.message} Your progress has been saved.`,
          variant: feedback.variant,
          duration: 5000,
        })
      } else {
        // Log the error but don't show it to the user
        console.warn('🔧 Review update failed:', response.status, response.statusText)
        
        // Show completion message with appropriate feedback
        toast({
          title: "Quiz Completed!",
          description: `You scored ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%). ${feedback.message}`,
          variant: feedback.variant,
          duration: 5000,
        })
      }
    } catch (error) {
      // Log the error but don't show it to the user
      console.warn("🔧 Error updating review stats (non-critical):", error)
      
      // Show completion message with appropriate feedback
      toast({
        title: "Quiz Completed!",
        description: `You scored ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%). ${feedback.message}`,
        variant: feedback.variant,
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
        (() => {
          const feedback = getScoreFeedback(quizScore, totalQuestions)
          const percentage = Math.round((quizScore / totalQuestions) * 100)
          
          return (
            <Card className={`border-2 ${
              feedback.color === 'green' ? 'border-green-200 dark:border-green-800' :
              feedback.color === 'blue' ? 'border-blue-200 dark:border-blue-800' :
              feedback.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800' :
              feedback.color === 'orange' ? 'border-orange-200 dark:border-orange-800' :
              'border-red-200 dark:border-red-800'
            }`}>
              <CardHeader className={`${
                feedback.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                feedback.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                feedback.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                feedback.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20' :
                'bg-red-50 dark:bg-red-900/20'
              }`}>
                <CardTitle className={`flex items-center ${
                  feedback.color === 'green' ? 'text-green-700 dark:text-green-300' :
                  feedback.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                  feedback.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
                  feedback.color === 'orange' ? 'text-orange-700 dark:text-orange-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Quiz Completed!
                </CardTitle>
                <CardDescription>
                  You scored {quizScore > totalQuestions ? totalQuestions : quizScore} out of {totalQuestions} ({percentage}%)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {percentage >= 80 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : percentage >= 60 ? (
                      <Minus className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-medium">{feedback.message}</p>
                  </div>
                  <p className="text-muted-foreground">{feedback.suggestion}</p>
                  {percentage < 70 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Tip: Review the concept notes below and consider retaking the quiz to improve your understanding.
                      </p>
                    </div>
                  )}
                  <p className="text-sm">Continue exploring other concepts or return to the dashboard.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/concepts">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Concepts
                    </Link>
                  </Button>
                  {percentage < 70 && (
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setQuizCompleted(false)
                        setQuizScore(0)
                        // Re-shuffle questions for variety
                        window.location.reload()
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Retake Quiz
                    </Button>
                  )}
                </div>
                <Button asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })()
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
