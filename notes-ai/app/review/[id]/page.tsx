"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle, LockIcon } from "lucide-react"
import { dummyConcepts, quizQuestions } from "@/lib/dummy-data"
import { ConceptQuiz } from "@/components/concept-quiz"

export default function ConceptReviewPage({ params }) {
  const [concept, setConcept] = useState(null)
  const [questions, setQuestions] = useState([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  useEffect(() => {
    if (params?.id) {
      const foundConcept = dummyConcepts.find((c) => c.id === params.id)
      if (foundConcept) {
        setConcept(foundConcept)
        // Get questions for this concept
        const conceptQuestions = quizQuestions.filter((q) => q.conceptId === params.id)
        setQuestions(conceptQuestions)
        setTotalQuestions(conceptQuestions.length)
      }
    }
  }, [params?.id])

  const handleQuizComplete = (score) => {
    setQuizCompleted(true)
    setQuizScore(score)
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
                <Link href={`/concepts/${concept.id}`}>
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
              You scored {quizScore} out of {totalQuestions} ({Math.round((quizScore / totalQuestions) * 100)}%)
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
              <Link href="/">Return to Dashboard</Link>
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
            <p className="whitespace-pre-line">{concept.notes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
