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
  // Add fields for review tracking
  needsReview?: boolean
  confidenceScore?: number
  // Add embedding analysis data
  embeddingData?: {
    concept: any
    relationships: Array<{
      id: string
      title: string
      category: string
      summary: string
      similarity: number
    }>
    potentialDuplicates: Array<{
      id: string
      title: string
      category: string
      summary: string
      similarity: number
    }>
    embedding: number[]
  }
}

// Personal Learning Insights - New intelligence layer
export interface PersonalLearningInsights {
  personalInsights?: {
    type: string;
    title: string;
    content: string;
    confidence: number;
    helpful: boolean | null;
  }[];
  practicalApplications?: {
    type: string;
    title: string;
    content: string;
    confidence: number;
    helpful: boolean | null;
  }[];
  learningAlignment?: {
    type: string;
    title: string;
    content: string;
    confidence: number;
    helpful: boolean | null;
  }[];
  nextSteps?: {
    type: string;
    title: string;
    content: string;
    confidence: number;
    helpful: boolean | null;
  }[];
  reinforcement?: {
    message: string;
    learning_value: string;
    recommendation: string;
  };
  adaptiveInsights?: any;
}

// Vector Knowledge Metadata - Intelligence about learning state
export interface VectorMetadata {
  embeddings_stored?: number;
  total_concepts?: number;
  knowledge_analysis?: {
    status: string;
    should_extract: boolean;
    extraction_focus: string;
    similar_concepts: any[];
    max_similarity: number;
    recommendation: string;
  };
  error?: string;
}

// This type represents the complete analysis result
export interface ConversationAnalysis {
  conversationTitle: string
  overallSummary: string
  conceptMap: string[]
  concepts: Concept[]
  // New intelligent features
  personalLearning?: PersonalLearningInsights;
  vectorMetadata?: VectorMetadata;
  metadata?: {
    extraction_time: string;
    model_used: string;
    concept_count: number;
    extraction_method?: string;
    processing_time_saved?: string;
    knowledge_status?: string;
    similar_concepts_found?: number;
    max_similarity?: number;
  };
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
    extraction_method?: string;
    processing_time_saved?: string;
    knowledge_status?: string;
    similar_concepts_found?: number;
    max_similarity?: number;
  };
  conversation_title?: string; // New field from the LLM
  // New intelligent features
  personalLearning?: PersonalLearningInsights;
  vectorMetadata?: VectorMetadata;
};

// Define a type for tree nodes
export interface CategoryNode {
  name: string;
  children: Record<string, CategoryNode>;
  concepts: Concept[];
} 