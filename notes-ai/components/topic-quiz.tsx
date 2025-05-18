"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { CheckCircle, XCircle, ArrowRight, Brain } from "lucide-react"
import { motion } from "framer-motion"

export interface QuizQuestion {
  topic: string
  question: string
  answer: string
  options: string[]
}

interface TopicQuizProps {
  topic: string
  questions: QuizQuestion[]
  onComplete: (topic: string, remembered: boolean) => void
}

export function TopicQuiz({ topic, questions, onComplete }: TopicQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.answer
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount(correctCount + 1)
    }
  }

  const moveToNext = () => {
    setSelectedAnswer(null)
    setIsCorrect(null)

    if (isLastQuestion) {
      // Consider the topic remembered if at least 70% of questions were answered correctly
      const remembered = correctCount / questions.length >= 0.7
      onComplete(topic, remembered)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" /> Quiz: {topic}
        </CardTitle>
        <CardDescription>
          Question {currentIndex + 1} of {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-primary/70 animate-pulse" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedAnswer === option
                      ? isCorrect
                        ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800"
                      : "hover:bg-muted/50 border-transparent"
                  }`}
                >
                  <div className="flex items-center">
                    {selectedAnswer === option && isCorrect && (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                    {selectedAnswer === option && !isCorrect && (
                      <XCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span>{option}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {selectedAnswer && (
          <div
            className={`p-4 rounded-md ${
              isCorrect
                ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            <div className="flex items-start">
              {isCorrect ? (
                <CheckCircle className="mr-2 h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="mr-2 h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="font-medium">{isCorrect ? "Correct!" : "Incorrect"}</p>
                <p className="text-sm mt-1">
                  {isCorrect ? "Great job! You got it right." : `The correct answer is: ${currentQuestion.answer}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {selectedAnswer ? (
          <Button onClick={moveToNext}>
            {isLastQuestion ? "Complete Quiz" : "Next Question"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Select an answer
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
