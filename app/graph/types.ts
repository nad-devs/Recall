// Enhanced Types for Knowledge Graph
// This matches the full Prisma schema to unlock rich metadata

export interface EnhancedConcept {
  // Basic fields (currently used)
  id: string
  title: string
  category: string
  summary: string
  details: string // JSON string
  keyPoints: string // JSON string
  examples: string // JSON string
  relatedConcepts: string // JSON string
  relationships: string // JSON string
  confidenceScore: number
  lastUpdated: string
  isPlaceholder: boolean
  
  // User isolation
  userId: string
  
  // Review-related fields
  reviewCount: number
  lastReviewed: string | null
  nextReviewDate: string | null
  conversationId: string
  
  // Enhanced learning and content fields
  masteryLevel: string | null // "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"
  learningProgress: number // 0-100%
  practiceCount: number
  lastPracticed: string | null
  difficultyRating: number | null // 1-5 stars
  timeToMaster: number | null // estimated hours
  
  // Rich content (stored as JSON strings)
  videoResources: string // URLs to tutorial videos
  documentationLinks: string // Official docs, articles
  practiceExercises: string // Links to coding challenges
  realWorldExamples: string // Industry use cases
  prerequisites: string // Concept IDs that should be learned first
  
  // Personal learning data
  personalNotes: string | null // Private notes and insights
  mnemonics: string | null // Memory aids
  commonMistakes: string // Things to watch out for
  personalExamples: string // User's own examples
  learningTips: string
  
  // Usage context
  useCases: string // When to use this concept
  industries: string // Where it's commonly used
  tools: string // Related tools/frameworks
  projectsUsedIn: string // Personal projects where applied
  
  // User interaction
  tags: string // User-defined tags
  bookmarked: boolean
  personalRating: number | null // Personal rating 1-5
  
  createdAt: string
  
  // Relations
  occurrences?: Array<{
    id: string
    conversationId: string
    createdAt: string
    notes?: string
  }>
  
  codeSnippets?: Array<{
    id: string
    language: string
    description: string
    code: string
  }>
}

// Simplified current interface for backwards compatibility
export interface SimpleConcept {
  id: string
  title: string
  category: string
  summary?: string
  occurrences?: Array<{
    id: string
    conversationId: string
    createdAt: string
  }>
}

// Helper functions to safely parse JSON fields
export const parseJsonField = (field: string, fallback: any = []): any => {
  try {
    return JSON.parse(field || '[]')
  } catch {
    return fallback
  }
}

// Helper to convert enhanced concept to display-ready format
export const processEnhancedConcept = (concept: EnhancedConcept) => {
  return {
    ...concept,
    // Parse JSON fields safely
    keyPointsParsed: parseJsonField(concept.keyPoints, []),
    examplesParsed: parseJsonField(concept.examples, []),
    relatedConceptsParsed: parseJsonField(concept.relatedConcepts, []),
    relationshipsParsed: parseJsonField(concept.relationships, {}),
    videoResourcesParsed: parseJsonField(concept.videoResources, []),
    documentationLinksParsed: parseJsonField(concept.documentationLinks, []),
    practiceExercisesParsed: parseJsonField(concept.practiceExercises, []),
    realWorldExamplesParsed: parseJsonField(concept.realWorldExamples, []),
    prerequisitesParsed: parseJsonField(concept.prerequisites, []),
    commonMistakesParsed: parseJsonField(concept.commonMistakes, []),
    personalExamplesParsed: parseJsonField(concept.personalExamples, []),
    learningTipsParsed: parseJsonField(concept.learningTips, []),
    useCasesParsed: parseJsonField(concept.useCases, []),
    industriesParsed: parseJsonField(concept.industries, []),
    toolsParsed: parseJsonField(concept.tools, []),
    projectsUsedInParsed: parseJsonField(concept.projectsUsedIn, []),
    tagsParsed: parseJsonField(concept.tags, [])
  }
} 