// This type represents a code snippet in a concept
export interface CodeSnippet {
  language: string
  description: string
  code: string
}

// This type represents a concept extracted from the conversation
export interface Concept {
  id: string
  title: string
  category: string  // Keep for backward compatibility
  categoryPath?: string[]  // New: Array path for hierarchical categories (e.g. ["Cloud", "Google Cloud"])
  summary: string
  details: {
    implementation: string
    complexity: {
      time?: string
      space?: string
    }
    useCases: string[]
    edgeCases: string[]
    performance: string
    interviewQuestions: string[]
    practiceProblems: string[]
    furtherReading: string[]
  }
  keyPoints: string[]
  examples: string[]
  codeSnippets: CodeSnippet[]
  relatedConcepts: string[]
  relationships?: {
    data_structures?: string[]
    algorithms?: string[]
    patterns?: string[]
    applications?: string[]
  }
}

// This type represents the complete analysis result
export interface ConversationAnalysis {
  conversationTitle: string
  overallSummary: string
  conceptMap: string[]
  concepts: Concept[]
}

// Backend API types
export type BackendConcept = {
  id?: string;
  title: string;
  category: string;  // Keep for backward compatibility
  categoryPath?: string[];  // New: Array path for hierarchical categories
  subcategories?: string[];
  summary?: string;
  details?: {
    implementation: string;
    complexity: {
      time?: string;
      space?: string;
    };
    useCases: string[];
    edgeCases: string[];
    performance: string;
    interviewQuestions: string[];
    practiceProblems: string[];
    furtherReading: string[];
  };
  keyPoints?: string[];
  examples?: string[];
  codeSnippets?: Array<{ language: string; description: string; code: string }>;
  relatedConcepts?: string[];
  relationships?: {
    data_structures?: string[];
    algorithms?: string[];
    patterns?: string[];
    applications?: string[];
  };
  confidence_score: number;
  last_updated: string;
};

export type BackendCodeSnippet = {
  language: string;
  code: string;
  relatedConcept?: string;
};

export type BackendResponse = {
  concepts: BackendConcept[];
  summary: string;
  conversation_summary?: string; // New field from the LLM
  metadata: {
    extraction_time: string;
    model_used: string;
    concept_count: number;
  };
  conversation_title?: string; // New field from the LLM
};

// Define a type for tree nodes
export interface CategoryNode {
  name: string;
  children: Record<string, CategoryNode>;
  concepts: Concept[];
} 