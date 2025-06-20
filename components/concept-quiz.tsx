"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, BookOpen, InfoIcon } from "lucide-react"
import { QuizQuestion } from "@/ai/flows/generate-quiz-topics"
import React from "react"

interface ConceptQuizProps {
  concept: any
  questions: QuizQuestion[]
  onComplete: (score: number) => void
}

export function ConceptQuiz({ concept, questions, onComplete }: ConceptQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)

  // Validate questions before rendering - ensure consistent validation
  const validQuestions = React.useMemo(() => {
    if (!Array.isArray(questions)) {
      console.log('🔧 Quiz - Questions is not an array:', questions);
      return [];
    }

    return questions.filter(q => {
      if (!q) return false;
      
      const hasQuestion = typeof q.question === 'string' && q.question.trim() !== '';
      const hasAnswer = typeof q.answer === 'string' && q.answer.trim() !== '';
      const hasOptions = Array.isArray(q.options) && q.options.length > 0;
      const answerInOptions = hasOptions && hasAnswer && q.options.includes(q.answer);
      
      const isValid = hasQuestion && hasAnswer && hasOptions && answerInOptions;
      
      if (!isValid) {
        console.log('🔧 Quiz - Invalid question filtered out:', {
          hasQuestion,
          hasAnswer,
          hasOptions,
          answerInOptions,
          question: q
        });
      }
      
      return isValid;
    });
  }, [questions]);

  // Reset state when questions change
  React.useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
  }, [validQuestions]);

  if (!concept) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Concept data not available.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (validQuestions.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Quiz: {concept.title || 'Unknown Concept'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to generate valid quiz questions for this concept. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = validQuestions[currentIndex]
  const isLastQuestion = currentIndex === validQuestions.length - 1

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return // Prevent multiple selections
    
    setSelectedAnswer(answer)
    
    // Normalize strings for comparison - trim whitespace and handle case sensitivity
    const normalizeString = (str: string) => str.trim().replace(/\s+/g, ' ');
    const normalizedSelected = normalizeString(answer);
    const normalizedCorrect = normalizeString(currentQuestion.answer);
    
    // Use case-insensitive comparison for better matching
    const correct = normalizedSelected.toLowerCase() === normalizedCorrect.toLowerCase();
    setIsCorrect(correct)
    
    if (correct) {
      const newScore = score + 1
      setScore(newScore)
      console.log(`🔧 Quiz - Question ${currentIndex + 1}: CORRECT! Score updated from ${score} to ${newScore}`)
    } else {
      console.log(`🔧 Quiz - Question ${currentIndex + 1}: INCORRECT. Score remains ${score}`)
    }
    
    console.log(`🔧 Quiz - Question: "${currentQuestion.question}"`)
    console.log(`🔧 Quiz - Selected: "${answer}" (normalized: "${normalizedSelected}")`)
    console.log(`🔧 Quiz - Correct Answer: "${currentQuestion.answer}" (normalized: "${normalizedCorrect}")`)
    console.log(`🔧 Quiz - Normalized match check: "${normalizedSelected.toLowerCase()}" === "${normalizedCorrect.toLowerCase()}"`)
    console.log(`🔧 Quiz - Is Correct: ${correct}`)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      // The score state already includes all correct answers up to and including the current question
      // because handleAnswerSelect updates score immediately when an answer is selected
      console.log(`🔧 Quiz - Final score: ${score} out of ${validQuestions.length}`)
      onComplete(score)
    } else {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Quiz: {concept.title}
          </CardTitle>
          <Badge variant="outline">
            Question {currentIndex + 1} of {validQuestions.length}
          </Badge>
        </div>
        <CardDescription>Test your knowledge of this concept</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-medium">{currentQuestion.question}</div>

        {currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === option
                    ? isCorrect
                      ? "outline"
                      : "destructive"
                    : selectedAnswer && option === currentQuestion.answer
                      ? "outline"
                      : "secondary"
                }
                className={`w-full justify-start text-left ${
                  selectedAnswer === option && isCorrect
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : ""
                } ${
                  selectedAnswer && option === currentQuestion.answer && selectedAnswer !== option
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : ""
                }`}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswerSelect(option)}
              >
                {selectedAnswer === option && isCorrect && (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />
                )}
                {selectedAnswer === option && !isCorrect && <XCircle className="mr-2 h-4 w-4" />}
                {selectedAnswer && option === currentQuestion.answer && selectedAnswer !== option && (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />
                )}
                {!selectedAnswer || (selectedAnswer !== option && option !== currentQuestion.answer) ? (
                  <div className="w-4 h-4 mr-2 rounded-full border border-current inline-flex items-center justify-center" />
                ) : null}
                {option}
              </Button>
            ))}
          </div>
        )}

        {selectedAnswer && (
          <div
            className={`p-4 rounded-md ${
              isCorrect
                ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
            }`}
          >
            <div className="font-medium flex items-center">
              {isCorrect ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Correct!
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Incorrect
                </>
              )}
            </div>
            <p className="mt-1 text-sm">
              {isCorrect ? "Great job! You got it right." : `The correct answer is: ${currentQuestion.answer}`}
            </p>
            
            {/* Show explanation if available */}
            {currentQuestion.explanation && (
              <div className="mt-2 text-sm flex items-start">
                <InfoIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{currentQuestion.explanation}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
        <div className="text-sm text-muted-foreground">
          Score: {score}/{currentIndex + (selectedAnswer ? 1 : 0)} correct
        </div>
        <Button onClick={handleNext} disabled={selectedAnswer === null}>
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </Button>
      </CardFooter>
    </Card>
  )
}
