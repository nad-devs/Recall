"use server"

import { revalidatePath } from "next/cache"

// Define the types for the processed conversation result
export interface ProcessedConversationResult {
  learningSummary: string | null
  keyTopics: string[] | null
  category: string | null
  conceptsMap: string | null
  codeAnalysis: string | null
  studyNotes: string | null
  error: string | null
  originalConversationText: string
}

// Define the type for quiz generation result
export interface GenerateQuizResult {
  quizTopics: QuizTopic[] | null
  error: string | null
}

// Import the QuizTopic type and function from the AI flow
import type { QuizTopic } from "@/ai/flows/generate-quiz-topics"
import { generateQuizTopics } from "@/ai/flows/generate-quiz-topics"

// Function for generating quiz topics
export async function generateQuizTopicsAction(formData: FormData): Promise<GenerateQuizResult> {
  try {
    const conversationText = formData.get("conversationText") as string

    if (!conversationText) {
      return {
        quizTopics: null,
        error: "No content provided",
      }
    }

    // Use our generateQuizTopics function to get quiz topics
    const quizTopics = await generateQuizTopics(conversationText)

    return {
      quizTopics,
      error: null,
    }
  } catch (error) {
    console.error("Error generating quiz topics:", error)
    return {
      quizTopics: null,
      error: error instanceof Error ? error.message : "Failed to generate quiz topics",
    }
  }
}

// Mock API route for analyzing content (conversation, article, or video)
export async function analyzeContent(content: string, contentType: string): Promise<ProcessedConversationResult> {
  try {
    // In a real implementation, this would call your AI service
    // For now, we'll return mock data
    const result = {
      learningSummary: "This is a mock learning summary for testing purposes.",
      keyTopics: ["Sample Topic 1", "Sample Topic 2", "Sample Topic 3"],
      category: "General",
      conceptsMap: JSON.stringify([
        {
          name: "Sample Concept",
          description: "A sample concept extracted from the conversation",
          category: "General",
          confidence: 0.95
        }
      ]),
      codeAnalysis: "No code snippets found in this conversation.",
      studyNotes: "Key points to remember from this conversation.",
      error: null,
      originalConversationText: content,
    }

    // Simulate a delay to mimic processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return result
  } catch (error) {
    console.error("Error analyzing content:", error)
    return {
      learningSummary: null,
      keyTopics: null,
      category: null,
      conceptsMap: null,
      codeAnalysis: null,
      studyNotes: null,
      error: error instanceof Error ? error.message : "Failed to analyze content",
      originalConversationText: content,
    }
  }
}

// API route handler for the analyze-content endpoint
export async function POST(request: Request) {
  try {
    const { content, contentType } = await request.json()
    const result = await analyzeContent(content, contentType)

    // Revalidate the home page to reflect the new data
    revalidatePath("/")

    return Response.json(result)
  } catch (error) {
    console.error("API route error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
