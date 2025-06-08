import { 
  ConversationAnalysis, 
  Concept, 
  BackendResponse, 
  CategoryNode 
} from '@/lib/types/conversation'

// Helper function to generate a title from concepts
export function generateTitleFromConcepts(concepts: Concept[]): string {
  if (!concepts || concepts.length === 0) {
    return "Programming Discussion";
  }
  
  if (concepts.length === 1) {
    return `Discussion about ${concepts[0].title}`;
  } else if (concepts.length === 2) {
    return `${concepts[0].title} and ${concepts[1].title} Discussion`;
  } else {
    return `${concepts[0].title}, ${concepts[1].title} & More`;
  }
}

// Map backend response to frontend analysis format
export function mapBackendResponseToAnalysis(data: BackendResponse): ConversationAnalysis {
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
    // Include conversation_title from the backend, or generate one from concepts
    conversationTitle: data.conversation_title || generateTitleFromConcepts(concepts),
    // Only use conversation_summary
    overallSummary: data.conversation_summary || '',
    conceptMap,
    concepts,
  };
}

// Helper to build a category tree from concepts
export function buildCategoryTree(concepts: Concept[]): CategoryNode {
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

// Normalize category names
export function normalizeCategory(input: string): string {
  // Handle special cases first
  const trimmed = input.trim();
  
  // Special case for LeetCode - preserve the exact casing
  if (trimmed.toLowerCase() === 'leetcode problems') {
    return 'LeetCode Problems';
  }
  
  // For other categories, capitalize each word
  return trimmed
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 