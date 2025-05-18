"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, HelpCircle, ArrowRight } from "lucide-react"
import type { QuizTopic } from "@/ai/flows/generate-quiz-topics"

interface QuizDisplayProps {
  topics: QuizTopic[]
  onComplete: (remembered: QuizTopic[], review: QuizTopic[]) => void
}

export function QuizDisplay({ topics, onComplete }: QuizDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remembered, setRemembered] = useState<QuizTopic[]>([])
  const [review, setReview] = useState<QuizTopic[]>([])
  const [showAnswer, setShowAnswer] = useState(false)

  const currentTopic = topics[currentIndex]
  const isLastQuestion = currentIndex === topics.length - 1

  const handleRemembered = () => {
    setRemembered([...remembered, currentTopic])
    moveToNext()
  }

  const handleNeedsReview = () => {
    setReview([...review, currentTopic])
    moveToNext()
  }

  const moveToNext = () => {
    setShowAnswer(false)

    if (isLastQuestion) {
      onComplete(remembered, review)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const toggleShowAnswer = () => {
    setShowAnswer(!showAnswer)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {topics.length}
        </div>
        <div className="flex space-x-1">
          {topics.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-primary/70 animate-pulse" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Card className="border-2 border-muted">
        <CardContent className="pt-6">
          <h3 className="text-xl font-medium mb-4">{currentTopic.topic}</h3>

          {!showAnswer ? (
            <div className="flex justify-center my-8">
              <Button variant="outline" onClick={toggleShowAnswer} className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Show Answer
              </Button>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-md my-4">
              <p className="whitespace-pre-wrap">{currentTopic.context}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        {showAnswer ? (
          <>
            <Button
              variant="outline"
              onClick={handleNeedsReview}
              className="flex-1 mr-2 border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Need to Review
            </Button>
            <Button
              variant="outline"
              onClick={handleRemembered}
              className="flex-1 ml-2 border-green-500/50 hover:bg-green-500/10 text-green-600 dark:text-green-400"
            >
              <CheckCircle className="mr-2 h-4 w-4" />I Remember This
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={toggleShowAnswer} className="ml-auto">
            Skip to Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
