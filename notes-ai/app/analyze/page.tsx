"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils" // Utility for conditionally joining class names
import { AddConceptCard } from "@/components/add-concept-card"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { formatRelatedConcepts } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// =============================================
// TYPES
// =============================================

// This type represents a code snippet in a concept
interface CodeSnippet {
  language: string
  description: string
  code: string
}

// This type represents a concept extracted from the conversation
interface Concept {
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
interface ConversationAnalysis {
  overallSummary: string
  conceptMap: string[]
  concepts: Concept[]
}

// Add this mapping function at the top, after the ConversationAnalysis type
type BackendConcept = {
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

type BackendCodeSnippet = {
  language: string;
  code: string;
  relatedConcept?: string;
};

type BackendResponse = {
  concepts: BackendConcept[];
  summary: string;
  conversation_summary?: string; // New field from the LLM
  metadata: {
    extraction_time: string;
    model_used: string;
    concept_count: number;
  };
};

function mapBackendResponseToAnalysis(data: BackendResponse): ConversationAnalysis {
  // Map backend concepts to frontend Concept type
  const concepts: Concept[] = data.concepts.map((concept, idx) => ({
    // Only use the ID if it's a real database ID (not a temporary one)
    id: concept.id && !concept.id.startsWith('concept-') ? concept.id : `temp-${Date.now()}-${idx}`,
    title: concept.title,
    category: concept.category,
    // If categoryPath exists, use it, otherwise create a single-element path from category
    categoryPath: concept.categoryPath || [concept.category],
    summary: concept.summary ?? '',
    details: concept.details ?? {
      implementation: '',
      complexity: {},
      useCases: [],
      edgeCases: [],
      performance: '',
      interviewQuestions: [],
      practiceProblems: [],
      furtherReading: [],
    },
    keyPoints: concept.keyPoints ?? [],
    examples: concept.examples ?? [],
    codeSnippets: concept.codeSnippets ?? [],
    relatedConcepts: concept.relatedConcepts ?? [],
    relationships: concept.relationships,
  }));

  // Build a concept map from relationships
  const conceptMap = concepts.map(concept => {
    const relationships = concept.relationships || {};
    const related = [
      ...(relationships.data_structures ?? []),
      ...(relationships.algorithms ?? []),
      ...(relationships.patterns ?? [])
    ];
    return related.length > 0 
      ? `${concept.title} → ${related.join(', ')}`
      : concept.title;
  });

  return {
    // Use conversation_summary if available, otherwise fall back to summary
    overallSummary: data.conversation_summary || data.summary,
    conceptMap,
    concepts,
  };
}

// Add this type and helper function near the top, after your other types

// Define a type for tree nodes
interface CategoryNode {
  name: string;
  children: Record<string, CategoryNode>;
  concepts: Concept[];
}

// Helper to build a category tree from concepts
function buildCategoryTree(concepts: Concept[]): CategoryNode {
  const root: CategoryNode = { name: 'root', children: {}, concepts: [] };
  
  concepts.forEach(concept => {
    // Use categoryPath if available, otherwise use category as a single-element path
    const path = concept.categoryPath || [concept.category];
    
    let currentNode = root;
    
    // Build the path in the tree
    path.forEach((category, index) => {
      if (!currentNode.children[category]) {
        currentNode.children[category] = { 
          name: category, 
          children: {}, 
          concepts: [] 
        };
      }
      
      currentNode = currentNode.children[category];
      
      // If we're at the leaf category, add the concept
      if (index === path.length - 1) {
        currentNode.concepts.push(concept);
      }
    });
  });
  
  return root;
}

// =============================================
// MOCK DATA - In a real app, this would come from an API
// =============================================

// Mock data for demonstration purposes
const mockLargeConversationAnalysis: ConversationAnalysis = {
  overallSummary:
    "This conversation covers multiple topics including SQL database optimization, NLP techniques, React frontend development, and machine learning model deployment. The discussion includes code examples, best practices, and implementation details for each area.",

  conceptMap: [
    "SQL Optimization → Indexing → Query Performance",
    "NLP → Text Classification → Sentiment Analysis",
    "React → Hooks → Custom Hooks → Performance",
    "Machine Learning → Model Deployment → API Integration",
    "SQL ↔ Backend API ↔ React Frontend",
    "NLP ↔ Machine Learning Models",
    "Data Analysis → Visualization → Dashboard",
  ],

  concepts: [
    {
      id: "concept-1",
      title: "SQL Query Optimization",
      category: "Database",
      summary:
        "Discussion of SQL query optimization techniques focusing on proper indexing, query structure, and database design to improve performance for large datasets.",
      details: {
        implementation: "SQL query optimization is critical for applications dealing with large datasets. The conversation covered several key optimization techniques including proper index selection, query restructuring to avoid full table scans, and understanding execution plans.\n\nThe discussion emphasized how composite indexes should be created based on query patterns, and how the order of columns in these indexes matters significantly for performance. It also covered the importance of avoiding functions on indexed columns in WHERE clauses, as they prevent index usage.",
        complexity: {},
        useCases: ["For a query that filters by user_id and status, a composite index on (user_id, status) would be more efficient than separate indexes.", "Changing WHERE YEAR(created_at) = 2023 to WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31' allows index usage."],
        edgeCases: [],
        performance: "",
        interviewQuestions: [],
        practiceProblems: [],
        furtherReading: [],
      },
      keyPoints: [
        "Create indexes based on common query patterns",
        "Order of columns in composite indexes matters",
        "Avoid functions on indexed columns in WHERE clauses",
        "Use EXPLAIN to analyze query execution plans",
        "Consider denormalization for read-heavy workloads",
      ],
      examples: [
        "For a query that filters by user_id and status, a composite index on (user_id, status) would be more efficient than separate indexes.",
        "Changing WHERE YEAR(created_at) = 2023 to WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31' allows index usage.",
      ],
      codeSnippets: [
        {
          language: "SQL",
          description: "Creating an efficient composite index",
          code: "CREATE INDEX idx_users_status_created ON users(status, created_at);\n\n-- This query can now use the index efficiently\nSELECT * FROM users\nWHERE status = 'active'\nAND created_at > '2023-01-01';",
        },
        {
          language: "SQL",
          description: "Query optimization example",
          code: "-- Before optimization\nSELECT * FROM orders\nWHERE MONTH(order_date) = 6;\n\n-- After optimization\nSELECT * FROM orders\nWHERE order_date >= '2023-06-01' AND order_date < '2023-07-01';",
        },
      ],
      relatedConcepts: ["Database Indexing", "API Data Fetching"],
    },
    {
      id: "concept-2",
      title: "Database Indexing",
      category: "Database",
      summary:
        "Detailed exploration of database indexing strategies, including B-tree indexes, covering indexes, and partial indexes for optimizing different query patterns.",
      details: {
        implementation: "Database indexing is a technique used to improve the speed of data retrieval operations on a database table. The conversation covered different types of indexes including B-tree indexes (the most common), hash indexes, covering indexes, and partial indexes.",
        complexity: {},
        useCases: ["A covering index for a query that selects user_id and email would include both columns in the index.", "A partial index might only index active users, improving performance for queries that only need active users."],
        edgeCases: [],
        performance: "",
        interviewQuestions: [],
        practiceProblems: [],
        furtherReading: [],
      },
      keyPoints: [
        "B-tree indexes are best for range queries and sorting",
        "Hash indexes are faster for equality comparisons but don't support range queries",
        "Covering indexes can dramatically improve read performance",
        "Partial indexes reduce index size by only indexing a subset of rows",
      ],
      examples: [
        "A covering index for a query that selects user_id and email would include both columns in the index.",
        "A partial index might only index active users, improving performance for queries that only need active users.",
      ],
      codeSnippets: [
        {
          language: "SQL",
          description: "Creating a covering index",
          code: "-- This index covers queries that only need user_id and email\nCREATE INDEX idx_users_id_email ON users(id, email);\n\n-- This query can now be satisfied using only the index\nSELECT user_id, email FROM users WHERE user_id = 123;",
        },
      ],
      relatedConcepts: ["SQL Query Optimization"],
    },
    {
      id: "concept-3",
      title: "Text Classification with NLP",
      category: "Machine Learning",
      summary:
        "Overview of text classification techniques in Natural Language Processing, including preprocessing steps, feature extraction methods, and model selection for tasks like sentiment analysis and topic categorization.",
      details: {
        implementation: "Text classification is a fundamental NLP task that involves assigning predefined categories to text documents. The conversation covered the complete pipeline for text classification, from preprocessing to model deployment.",
        complexity: {},
        useCases: [],
        edgeCases: [],
        performance: "",
        interviewQuestions: [],
        practiceProblems: [],
        furtherReading: [],
      },
      keyPoints: [
        "Text preprocessing is crucial for good classification performance",
        "TF-IDF often outperforms simple bag-of-words for feature extraction",
        "Pre-trained word embeddings can improve performance with limited data",
        "Transformer models like BERT represent state-of-the-art for many text classification tasks",
      ],
      examples: [
        "For sentiment analysis of product reviews, a fine-tuned BERT model achieved 92% accuracy compared to 84% with a TF-IDF + SVM approach.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Text preprocessing with NLTK",
          code: "import nltk\nfrom nltk.corpus import stopwords\nfrom nltk.stem import PorterStemmer\nfrom nltk.tokenize import word_tokenize\n\nstop_words = set(stopwords.words('english'))\nstemmer = PorterStemmer()\n\ndef preprocess_text(text):\n    # Tokenize\n    tokens = word_tokenize(text.lower())\n    \n    # Remove stopwords and stem\n    filtered_tokens = [stemmer.stem(w) for w in tokens if w not in stop_words]\n    \n    return filtered_tokens",
        },
      ],
      relatedConcepts: ["Sentiment Analysis", "Machine Learning Model Deployment"],
    },
  ],
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function AnalyzePage() {
  const router = useRouter()
  const [conversationText, setConversationText] = useState("")
  const [analysisResult, setAnalysisResult] = useState<ConversationAnalysis | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editCategoryValue, setEditCategoryValue] = useState("")
  
  // Add state for adding concepts
  const [isAddingConcept, setIsAddingConcept] = useState(false)
  const [showAddConceptCard, setShowAddConceptCard] = useState(false)

  // State for animation control
  const [showAnimation, setShowAnimation] = useState(false)
  
  // Add state for tab selection
  const [selectedTab, setSelectedTab] = useState("summary")

  // Add state for save functionality
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Add state for delete operation
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  function normalizeCategory(input: string) {
    // Capitalize each word, trim spaces
    return input
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Update to handle category paths
  function handleCategoryUpdate(rawValue: string) {
    const newCategory = normalizeCategory(rawValue);
    
    if (!selectedConcept) return;
    
    // Extract potential path components from the input (split by '>' or '/')
    const pathComponents = newCategory.split(/[>\/]/).map(c => c.trim()).filter(Boolean);
    
    const updatedConcept = {
      ...selectedConcept,
      category: pathComponents.length > 0 ? pathComponents[pathComponents.length - 1] : newCategory,
      categoryPath: pathComponents.length > 0 ? pathComponents : [newCategory]
    };
    
    setSelectedConcept(updatedConcept);
    
    if (analysisResult) {
      const updatedConcepts = analysisResult.concepts.map(concept =>
        concept.id === selectedConcept.id
          ? updatedConcept
          : concept
      );
      
      setAnalysisResult({
        ...analysisResult,
        concepts: updatedConcepts
      });
    }
    
    setIsEditingCategory(false);
  }

  // Add save handler
  const handleSaveConversation = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/saveConversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_text: conversationText,
          analysis: analysisResult, // This will include any category updates made by the user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      const data = await response.json();
      
      if (data.success) {
        // Show a success toast
        toast({
          title: "Success",
          description: data.message || "Conversation saved successfully",
          duration: 3000,
        });
        
        // Use the redirect URL from the API response
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          // Fallback to concepts page
          window.location.href = '/concepts';
        }
      } else {
        // Handle partial success or failure
        setSaveError(data.error || 'Failed to save conversation properly.');
        console.error('Save response indicates failure:', data);
      }
    } catch (error) {
      setSaveError('Failed to save conversation. Please try again.');
      console.error('Error saving conversation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for analyze button click
  const handleAnalyze = async () => {
    if (!conversationText.trim()) return;

    setIsAnalyzing(true);
    setShowAnimation(true);

    try {
      // Use our internal API endpoint which handles categories and proxies to the extraction service
      const response = await fetch('/api/extract-concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text: conversationText 
          // The backend will handle fetching categories and sending the proper guidance
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze conversation');
      }

      const data = await response.json();
      const analysis = mapBackendResponseToAnalysis(data);
      setAnalysisResult(analysis);
      if (analysis.concepts.length > 0) {
        setSelectedConcept(analysis.concepts[0]);
      }
    } catch (error) {
      alert('Error analyzing conversation. Please make sure the backend is running.');
      setAnalysisResult(null);
      setSelectedConcept(null);
    } finally {
      setIsAnalyzing(false);
      setShowAnimation(false);
    }
  };
  
  // Add handler for adding a new concept
  const handleAddConcept = async (title: string) => {
    try {
      setIsAddingConcept(true)
      
      // Create a conversation first if we don't have one yet
      let conversationId = null;
      
      if (analysisResult) {
        // Try to save the conversation first to get an ID
        const saveResponse = await fetch('/api/saveConversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_text: conversationText,
            analysis: {
              ...analysisResult,
              learningSummary: analysisResult.overallSummary,
              // Pass the concise summary for display on cards
              conversation_summary: analysisResult.overallSummary 
                ? analysisResult.overallSummary.split('. ').slice(0, 2).join('. ') 
                : undefined
            }
          }),
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          if (saveData.success && saveData.conversationId) {
            conversationId = saveData.conversationId;
            console.log("Created/retrieved conversation ID:", conversationId);
          }
        }
      }
      
      // Now create the concept with the conversation ID
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title,
          // Pass the conversation text for context to improve AI generation
          context: conversationText,
          // Pass the conversation ID if we have one
          conversationId: conversationId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create concept')
      }

      const data = await response.json()
      
      // Create a concept object from the response to add to our UI
      const newConcept: Concept = {
        id: data.concept.id,
        title: data.concept.title,
        category: data.concept.category || "Uncategorized",
        summary: data.concept.summary || "",
        details: data.concept.details ? 
          (typeof data.concept.details === 'string' ? 
            JSON.parse(data.concept.details) : 
            data.concept.details) : 
          {
            implementation: "",
            complexity: {},
            useCases: [],
            edgeCases: [],
            performance: "",
            interviewQuestions: [],
            practiceProblems: [],
            furtherReading: []
          },
        keyPoints: data.concept.keyPoints ? 
          (typeof data.concept.keyPoints === 'string' ? 
            JSON.parse(data.concept.keyPoints) : 
            data.concept.keyPoints) : 
          [],
        examples: data.concept.examples ? 
          (typeof data.concept.examples === 'string' ? 
            JSON.parse(data.concept.examples) : 
            data.concept.examples) : 
          [],
        codeSnippets: data.concept.codeSnippets || [],
        relatedConcepts: data.concept.relatedConcepts ? 
          (typeof data.concept.relatedConcepts === 'string' ? 
            JSON.parse(data.concept.relatedConcepts) : 
            data.concept.relatedConcepts) : 
          []
      }
      
      // Add the new concept to our analysis result
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          concepts: [...analysisResult.concepts, newConcept]
        })
      }
      
      // Select the new concept to display it
      setSelectedConcept(newConcept)
      
      // Hide the add concept card
      setShowAddConceptCard(false)
      
      // Show success toast
      toast({
        title: "Concept created",
        description: `Successfully created and linked "${title}" to the current conversation`,
      })
    } catch (error) {
      console.error('Error adding concept:', error)
      toast({
        title: "Error",
        description: "Failed to create concept. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingConcept(false)
    }
  }

  // Filter concepts based on search query
  const filteredConcepts =
    analysisResult?.concepts.filter(
      (concept) =>
        searchQuery === "" ||
        concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.summary.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  // Update the handleDeleteConcept function
  const handleDeleteConcept = async (conceptId: string) => {
    if (!conceptId) return;

    // If this is a temporary ID (not a real database ID), just remove from UI state
    if (conceptId.startsWith('temp-') || conceptId.startsWith('concept-')) {
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.filter(c => c.id !== conceptId);
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        });
        if (selectedConcept && selectedConcept.id === conceptId) {
          if (updatedConcepts.length > 0) {
            setSelectedConcept(updatedConcepts[0]);
          } else {
            setSelectedConcept(null);
          }
        }
      }
      return;
    }

    // Confirm deletion for saved concepts
    if (!window.confirm('Are you sure you want to delete this concept? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/concepts/${conceptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Concept not found in database');
        }
        throw new Error('Failed to delete concept');
      }

      // Remove the concept from our analysis result
      if (analysisResult) {
        const updatedConcepts = analysisResult.concepts.filter(c => c.id !== conceptId);
        setAnalysisResult({
          ...analysisResult,
          concepts: updatedConcepts
        });
        
        // If the deleted concept was selected, select another or set to null
        if (selectedConcept && selectedConcept.id === conceptId) {
          if (updatedConcepts.length > 0) {
            setSelectedConcept(updatedConcepts[0]);
          } else {
            setSelectedConcept(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting concept:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete concept');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 min-h-screen flex flex-col">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center text-sm font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="relative">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-black"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 10h2M6 14h2M16 10h2M16 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="absolute -top-1 -right-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-yellow-400"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main content with AnimatePresence for transitions */}
      <AnimatePresence mode="wait">
        {/* ANIMATION VIEW - Shows during analysis */}
        {showAnimation ? (
          <motion.div
            key="animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            {/* Brain animation */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                times: [0, 0.5, 1],
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 0.2,
              }}
              className="relative mb-8"
            >
              {/* Brain SVG */}
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Thinking animation - pulsing circles */}
              <motion.div
                className="absolute -top-4 -right-2"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <div className="h-3 w-3 rounded-full bg-blue-400" />
              </motion.div>

              <motion.div
                className="absolute -top-1 -right-4"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.3,
                }}
              >
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </motion.div>

              <motion.div
                className="absolute top-0 -left-3"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.5,
                }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              </motion.div>

              <motion.div
                className="absolute -top-3 -left-1"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 0.7,
                }}
              >
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
              </motion.div>
            </motion.div>

            {/* Conversation text animation container */}
            <motion.div
              initial={{ width: "100%", height: "100px" }}
              animate={{
                width: "100%",
                height: "300px",
                transition: { delay: 1, duration: 1 },
              }}
              className="relative w-full max-w-2xl mx-auto bg-muted/30 rounded-lg overflow-hidden"
            >
              {/* Conversation text that fades away */}
              <motion.div
                initial={{ y: 0 }}
                animate={{
                  y: [0, -10, -20, -30, -40],
                  opacity: [1, 0.9, 0.8, 0.7, 0],
                }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute inset-0 p-4 font-mono text-xs"
              >
                {conversationText.substring(0, 300)}
                {conversationText.length > 300 && "..."}
              </motion.div>

              {/* Analysis visualization */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center flex-col"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1],
                  transition: { delay: 1.5, duration: 0.5 },
                }}
              >
                {/* Topic categories */}
                <div className="flex space-x-2 mb-4">
                  {["Database", "Frontend", "Machine Learning", "Backend"].map((category, i) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: 1.5 + i * 0.1 },
                      }}
                    >
                      <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background/80 border">
                        {category}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress indicator */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: "70%",
                    transition: { delay: 1.8, duration: 0.7 },
                  }}
                  className="h-0.5 bg-primary/50 mb-4"
                />

                {/* Neural network animation */}
                <motion.div
                  className="relative h-20 w-40 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.5 }}
                >
                  {/* Neural network nodes and connections */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {/* Input layer */}
                    <div className="flex justify-around">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={`input-${i}`}
                          className="h-3 w-3 rounded-full bg-blue-500"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>

                    {/* Hidden layer */}
                    <div className="flex justify-around">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={`hidden-${i}`}
                          className="h-3 w-3 rounded-full bg-purple-500"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            delay: 0.3 + i * 0.2,
                          }}
                        />
                      ))}
                    </div>

                    {/* Output layer */}
                    <div className="flex justify-around">
                      {[0, 1].map((i) => (
                        <motion.div
                          key={`output-${i}`}
                          className="h-3 w-3 rounded-full bg-green-500"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            delay: 0.6 + i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Processing text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { delay: 2.2, duration: 0.5 },
                  }}
                  className="mt-4 text-sm text-muted-foreground"
                >
                  Extracting concepts and relationships...
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : !analysisResult ? (
          // INPUT VIEW - Shows when no analysis has been performed
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center"
          >
            {/* Title and description */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-4">Analyze Conversation</h1>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Paste your ChatGPT conversation below to extract topics, analyze code, and get study notes.
              </p>
            </div>

            {/* Input card */}
            <div className="w-full max-w-3xl bg-white rounded-lg border shadow-sm p-6">
              <div className="mb-4">
                <label htmlFor="conversation" className="block text-sm font-medium text-gray-700 mb-1">
                  Paste your ChatGPT conversation
                </label>
                <textarea
                  id="conversation"
                  placeholder="Paste your ChatGPT conversation here..."
                  className="w-full min-h-[300px] p-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !conversationText.trim()}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-700 text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isAnalyzing ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 animate-spin"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                      >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                      Analyze Conversation
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          // RESULTS VIEW - Shows after analysis is complete
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1"
          >
            {/* Sidebar with concept list */}
            <motion.div
              className="lg:col-span-1 space-y-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Search input */}
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search concepts..."
                  className="w-full pl-8 pr-4 py-2 text-sm rounded-md border border-input bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Concepts list */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="py-3 px-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 text-primary"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Identified Concepts
                  </h3>
                </div>
                <div className="p-0">
                  <div className="h-[calc(100vh-300px)] overflow-auto">
                    <div className="space-y-1 p-2">
                      {filteredConcepts.map((concept, index) => (
                        <motion.div
                          key={concept.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        >
                          <button
                            className={cn(
                              "w-full justify-start text-left font-normal py-2 px-3 rounded-md hover:bg-muted",
                              selectedConcept?.id === concept.id && "bg-muted font-medium",
                            )}
                            onClick={() => setSelectedConcept(concept)}
                          >
                            <div className="flex items-start">
                              <div className="mr-2 mt-0.5">
                                {concept.category === "Backend" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-blue-500"
                                  >
                                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                  </svg>
                                )}
                                {concept.category === "Database" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-green-500"
                                  >
                                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                  </svg>
                                )}
                                {concept.category === "Frontend" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-purple-500"
                                  >
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="m10 13-2 2 2 2" />
                                    <path d="m14 17 2-2-2-2" />
                                  </svg>
                                )}
                                {concept.category === "Machine Learning" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-red-500"
                                  >
                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                    <rect x="9" y="9" width="6" height="6" />
                                    <path d="M15 2v2" />
                                    <path d="M15 20v2" />
                                    <path d="M2 15h2" />
                                    <path d="M2 9h2" />
                                    <path d="M20 15h2" />
                                    <path d="M20 9h2" />
                                    <path d="M9 2v2" />
                                    <path d="M9 20v2" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{concept.title}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {concept.summary?.substring(0, 60) || ""}...
                                </div>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}

                      {filteredConcepts.length === 0 && (
                        <div className="px-3 py-6 text-center text-muted-foreground">No concepts match your search</div>
                      )}

                      {/* Add this button at the end of the concept list */}
                      <div className="border-t mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowAddConceptCard(true);
                            // If there's a selected concept, keep it displayed but note we're adding a new one
                            if (!selectedConcept && analysisResult && analysisResult.concepts.length > 0) {
                              setSelectedConcept(analysisResult.concepts[0]);
                            }
                          }}
                          className="w-full justify-start text-left font-normal py-2 px-3 rounded-md hover:bg-muted text-primary"
                        >
                          <div className="flex items-center">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            <span>Add Missing Concept</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Concept map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="py-3 px-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <rect x="16" y="16" width="6" height="6" rx="1" />
                        <rect x="2" y="16" width="6" height="6" rx="1" />
                        <rect x="9" y="2" width="6" height="6" rx="1" />
                        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                        <path d="M12 12V8" />
                      </svg>
                      Concept Map
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-muted-foreground">
                      <ul className="space-y-2">
                        {analysisResult.conceptMap.map((item, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 mr-1 mt-0.5 text-primary"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Main content area */}
            <motion.div
              className="lg:col-span-3 space-y-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Add save button at the top of the results view */}
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-end mb-4"
                >
                  <button
                    onClick={handleSaveConversation}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSaving ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4 animate-spin"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Save Conversation
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4"
                >
                  {saveError}
                </motion.div>
              )}

              {showAddConceptCard ? (
                // Add Concept Card in the main content area
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6">
                    <p className="text-muted-foreground mb-4">
                      Add a concept that wasn't identified in the conversation.
                    </p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const inputEl = e.currentTarget.querySelector('input') as HTMLInputElement;
                      if (inputEl.value.trim()) {
                        handleAddConcept(inputEl.value.trim());
                      }
                    }} className="space-y-6">
                      <div>
                        <input 
                          type="text"
                          placeholder="Enter concept title..."
                          className="w-full p-3 text-xl font-semibold border-0 border-b bg-background focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
                          autoFocus
                          disabled={isAddingConcept}
                        />
                        <div className="text-center text-muted-foreground mt-6">
                          AI will generate content automatically.
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => setShowAddConceptCard(false)}
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                          disabled={isAddingConcept}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90"
                          disabled={isAddingConcept}
                        >
                          {isAddingConcept ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2 h-4 w-4 animate-spin"
                              >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              Creating...
                            </>
                          ) : "Create Concept"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : selectedConcept ? (
                // Original selected concept details
                <>
                  {/* Selected concept details */}
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-semibold">{selectedConcept.title}</h2>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5 mr-1"
                            >
                              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                              <path d="M7 7h.01" />
                            </svg>
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                              {selectedConcept.categoryPath ? (
                                <span>
                                  {selectedConcept.categoryPath.join(' > ')}
                                </span>
                              ) : (
                                selectedConcept.category
                              )}
                              <button 
                                className="ml-1 text-muted-foreground" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Pre-fill with the current category path if it exists
                                  setEditCategoryValue(selectedConcept.categoryPath ? 
                                    selectedConcept.categoryPath.join(' > ') : 
                                    selectedConcept.category);
                                  setIsEditingCategory(true);
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                              </button>
                            </div>
                            {isEditingCategory && (
                              <div className="relative ml-2">
                                <input
                                  type="text"
                                  value={editCategoryValue}
                                  onChange={e => setEditCategoryValue(e.target.value)}
                                  onBlur={() => {
                                    handleCategoryUpdate(editCategoryValue);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleCategoryUpdate(editCategoryValue);
                                    }
                                  }}
                                  className="block w-80 rounded-md border border-input bg-background px-2 py-1 text-xs"
                                  placeholder="Enter category or path (e.g. Cloud > Google Cloud)"
                                  autoFocus
                                />
                              </div>
                            )}
                            {selectedConcept.relatedConcepts.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                Related to: {formatRelatedConcepts(selectedConcept.relatedConcepts)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Add Delete button */}
                        <button
                          onClick={() => handleDeleteConcept(selectedConcept.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center justify-center text-destructive rounded-md hover:bg-destructive/10 px-2 py-1 text-sm"
                          aria-label="Delete concept"
                          title="Delete concept"
                        >
                          {isDeleting ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 animate-spin"
                            >
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      {/* Tabs for concept details */}
                      <div className="w-full">
                        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
                          <button 
                            onClick={() => setSelectedTab("summary")}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "summary" ? "bg-background text-foreground shadow-sm" : ""}`}
                          >
                            Summary
                          </button>
                          <button 
                            onClick={() => setSelectedTab("details")}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "details" ? "bg-background text-foreground shadow-sm" : ""}`}
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => setSelectedTab("code")}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${selectedTab === "code" ? "bg-background text-foreground shadow-sm" : ""}`}
                          >
                            Code Snippets
                          </button>
                        </div>

                        {/* Content based on selected tab */}
                        {selectedTab === "summary" && (
                          <div className="space-y-4">
                            <div className="prose dark:prose-invert max-w-none">
                              <p className="whitespace-pre-line">{selectedConcept.summary}</p>
                            </div>

                            {selectedConcept.keyPoints?.length > 0 && (
                              <div className="mt-6">
                                <h3 className="text-lg font-medium mb-2">Key Points</h3>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                  {selectedConcept.keyPoints.map((point, index) => (
                                    <motion.li
                                      key={index}
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: 0.1 * index }}
                                    >
                                      {point}
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Details Tab Content */}
                        {selectedTab === "details" && (
                          <div className="space-y-4">
                            <div className="prose dark:prose-invert max-w-none">
                              <p className="whitespace-pre-line">{selectedConcept.details.implementation}</p>
                              
                              {selectedConcept.details.complexity && Object.keys(selectedConcept.details.complexity).length > 0 && (
                                <div className="mt-4">
                                  <h3 className="text-lg font-medium mb-2">Complexity</h3>
                                  <ul className="space-y-1 list-disc list-inside text-sm">
                                    {selectedConcept.details.complexity.time && (
                                      <li><strong>Time:</strong> {selectedConcept.details.complexity.time}</li>
                                    )}
                                    {selectedConcept.details.complexity.space && (
                                      <li><strong>Space:</strong> {selectedConcept.details.complexity.space}</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedConcept.details.useCases && selectedConcept.details.useCases.length > 0 && (
                                <div className="mt-4">
                                  <h3 className="text-lg font-medium mb-2">Use Cases</h3>
                                  <ul className="space-y-1 list-disc list-inside text-sm">
                                    {selectedConcept.details.useCases.map((useCase, index) => (
                                      <li key={index}>{useCase}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedConcept.details.edgeCases && selectedConcept.details.edgeCases.length > 0 && (
                                <div className="mt-4">
                                  <h3 className="text-lg font-medium mb-2">Edge Cases</h3>
                                  <ul className="space-y-1 list-disc list-inside text-sm">
                                    {selectedConcept.details.edgeCases.map((edgeCase, index) => (
                                      <li key={index}>{edgeCase}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedConcept.details.performance && (
                                <div className="mt-4">
                                  <h3 className="text-lg font-medium mb-2">Performance</h3>
                                  <p>{selectedConcept.details.performance}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Code Snippets Tab Content */}
                        {selectedTab === "code" && (
                          <div className="space-y-4">
                            {selectedConcept.codeSnippets && selectedConcept.codeSnippets.length > 0 ? (
                              <div className="space-y-6">
                                {selectedConcept.codeSnippets.map((snippet, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                        {snippet.language}
                                      </div>
                                      {snippet.description && (
                                        <div className="text-xs text-muted-foreground">{snippet.description}</div>
                                      )}
                                    </div>
                                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                                      <code>{snippet.code}</code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No code snippets available for this concept
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Related concepts section */}
                  {selectedConcept.relatedConcepts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="py-4 px-6">
                          <h3 className="text-lg font-semibold flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2 h-4 w-4 text-primary"
                            >
                              <rect x="16" y="16" width="6" height="6" rx="1" />
                              <rect x="2" y="16" width="6" height="6" rx="1" />
                              <rect x="9" y="2" width="6" height="6" rx="1" />
                              <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                              <path d="M12 12V8" />
                            </svg>
                            Related Concepts
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="flex flex-wrap gap-2">
                            {selectedConcept.relatedConcepts.map((relatedTitle, index) => {
                              const relatedConcept = analysisResult.concepts.find((c) => c.title === relatedTitle)
                              if (!relatedConcept) return null

                              return (
                                <motion.div
                                  key={relatedConcept.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                                >
                                  <button
                                    onClick={() => setSelectedConcept(relatedConcept)}
                                    className="inline-flex items-center justify-center rounded-md border bg-background text-sm font-medium shadow-sm h-9 px-3"
                                  >
                                    {relatedConcept.category === "Backend" && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 mr-1 text-blue-500"
                                      >
                                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                      </svg>
                                    )}
                                    {relatedConcept.category === "Database" && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 mr-1 text-green-500"
                                      >
                                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                      </svg>
                                    )}
                                    {relatedConcept.category === "Frontend" && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 mr-1 text-purple-500"
                                      >
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="m10 13-2 2 2 2" />
                                        <path d="m14 17 2-2-2-2" />
                                      </svg>
                                    )}
                                    {relatedConcept.category === "Machine Learning" && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 mr-1 text-red-500"
                                      >
                                        <rect x="4" y="4" width="16" height="16" rx="2" />
                                        <rect x="9" y="9" width="6" height="6" />
                                        <path d="M15 2v2" />
                                        <path d="M15 20v2" />
                                        <path d="M2 15h2" />
                                        <path d="M2 9h2" />
                                        <path d="M20 15h2" />
                                        <path d="M20 9h2" />
                                        <path d="M9 2v2" />
                                        <path d="M9 20v2" />
                                      </svg>
                                    )}
                                    {relatedTitle}
                                  </button>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                // Empty state when no concept is selected
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-12 w-12 text-muted-foreground mx-auto mb-4"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <h3 className="text-lg font-medium">Select a concept</h3>
                    <p className="text-muted-foreground">Choose a concept from the sidebar to view details</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
