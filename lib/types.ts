export interface Concept {
  id: string
  title: string
  category: string
  notes: string
  discussedInConversations: string[] // Array of conversation IDs
}

export interface ConceptReference {
  id: string
  title: string
}

export interface CodeSnippet {
  language: string
  code: string
  conceptId?: string // Optional reference to a concept
}

export interface Conversation {
  id: string
  title: string
  date: string
  summary: string
  concepts: ConceptReference[] // Array of concept references
  codeSnippets?: CodeSnippet[] // Optional array of code snippets
}
