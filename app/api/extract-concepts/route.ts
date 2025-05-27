import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// Add this function to ensure consistent categorization of concepts before displaying them
// function ensureConsistentCategories(responseData: any) {
//   if (responseData && responseData.concepts && Array.isArray(responseData.concepts)) {
//     responseData.concepts = responseData.concepts.map((concept: any) => {
//       // Apply the same categorization logic used when saving
//       const categoryInfo = determineCategory({
//         title: concept.title,
//         summary: concept.summary || '',
//         keyPoints: concept.keyPoints || []
//       });
//       
//       // Update the category and categoryPath to be consistent with what would happen on save
//       concept.category = categoryInfo.category;
//       concept.categoryPath = concept.categoryPath || [categoryInfo.category];
//       
//       // Add subcategory if available
//       if (categoryInfo.subcategory) {
//         concept.subcategories = concept.subcategories || [];
//         if (!concept.subcategories.includes(categoryInfo.subcategory)) {
//           concept.subcategories.push(categoryInfo.subcategory);
//         }
//       }
//       
//       return concept;
//     });
//   }
//   return responseData;
// }

async function extractConceptsWithOpenAI(conversation_text: string, customApiKey?: string, existingCategories: string[][] = []) {
  const openai = new OpenAI({
    apiKey: customApiKey || process.env.OPENAI_API_KEY,
  });

  if (!customApiKey && !process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
You are an ELITE technical knowledge extraction system. Your job is to analyze programming conversations and extract SPECIFIC, VALUABLE concepts:

🎯 CONCEPT IDENTIFICATION RULES:
1. SPECIFIC PROBLEMS: Extract the exact problem being solved (e.g., 'Contains Duplicate', 'Valid Anagram', 'Two Sum')
2. ALGORITHMIC TECHNIQUES: Extract the specific approach used (e.g., 'Hash Table for Duplicate Detection', 'Two Pointer Technique')
3. DATA STRUCTURES: Only extract if they're the main focus, not just mentioned in passing
4. DESIGN PATTERNS: Extract architectural or coding patterns being discussed
5. OPTIMIZATION STRATEGIES: Extract performance improvement techniques

🚫 AVOID THESE GENERIC CONCEPTS:
- 'Iteration', 'Loop', 'Variables', 'Programming', 'Coding'
- 'Hash Table', 'Dictionary', 'Array', 'String' (unless they're the main focus with specific techniques)
- 'Function', 'Method' (unless discussing specific patterns)
- 'Looping and Iteration', 'Hash Table (Dictionary)'

✅ QUALITY STANDARDS:
- Each concept must be IMMEDIATELY USEFUL for future reference
- Focus on concepts someone would want to review before an interview
- Include the WHY behind each technique, not just the HOW
- Limit to 1-3 HIGH-VALUE concepts maximum
- NO overlapping or duplicate concepts

IMPORTANT - LEETCODE PROBLEM DETECTION:
When detecting LeetCode-style algorithm problems:

1. MAINTAIN STANDARD PROBLEM NAMES AS THE MAIN CONCEPT TITLE:
   - ALWAYS use "Contains Duplicate" as the primary concept title, 
     NOT "Hash Table for Duplicate Detection"
   - Other standard names: "Valid Anagram", "Two Sum", "Reverse Linked List"
   - The technique (Hash Table, Two Pointer, etc.) should NEVER be in the main problem title

2. ALWAYS IDENTIFY AND CATEGORIZE LEETCODE PROBLEMS CORRECTLY:
   - ANY problem that resembles a LeetCode-style coding challenge MUST be categorized as 
     "LeetCode Problems"
   - Common indicators: array manipulation problems, string problems with specific constraints, 
     graph traversals, etc.
   - If you recognize the problem as a standard algorithm challenge, ALWAYS categorize it as 
     "LeetCode Problems"

Conversation:
${conversation_text}

For each concept found, provide a detailed JSON object with this structure:
{
  "title": "Specific problem name or technique (e.g., 'Contains Duplicate', NOT 'Hash Table')",
  "category": "LeetCode Problems (for coding problems) or appropriate category",
  "summary": "2-3 sentence summary explaining what this concept is and why it's important",
  "keyPoints": ["Specific, actionable key points about this concept"],
  "details": {
    "implementation": "Comprehensive 3-6 paragraph technical deep-dive explaining how this works, why it's effective, implementation details, and real-world applications",
    "complexity": {
      "time": "Time complexity with explanation",
      "space": "Space complexity with explanation"
    },
    "useCases": ["Specific use cases where this concept applies"],
    "edgeCases": ["Important edge cases to consider"],
    "performance": "Performance considerations and optimizations"
  },
  "codeSnippets": [
    {
      "language": "python",
      "code": "# Complete, executable code example with comments",
      "explanation": "What this code demonstrates and why it works"
    }
  ],
  "relatedConcepts": ["Related concepts that build on or connect to this one"]
}

Respond with this JSON format:
{
  "concepts": [array of concept objects],
  "conversation_summary": "Brief summary of the main topics and insights from this conversation"
}

CRITICAL: Extract 1-3 HIGH-VALUE concepts maximum. Focus on specific problems, techniques, or insights that would be valuable for interview preparation or future reference.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert technical concept extractor. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const result = JSON.parse(content);
    
    return {
      concepts: result.concepts || [],
      conversation_summary: result.conversation_summary || "Discussion about programming concepts"
    };
  } catch (error) {
    console.error('Error with OpenAI extraction:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_text, customApiKey } = body;

    if (!conversation_text) {
      return NextResponse.json(
        { error: 'Missing conversation text' },
        { status: 400 }
      );
    }

    console.log("Server: Proxying request to Render backend...");

    // Proxy to Render backend with fallback mechanism
    const httpsUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
    const httpUrl = httpsUrl.replace('https://', 'http://');

    let response;
    let lastError;

    // Try HTTPS first
    try {
      console.log("Server: Attempting HTTPS connection to Render...");
      response = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text,
          customApiKey 
        }),
      });

      if (response.ok) {
        console.log("Server: HTTPS connection successful");
        const result = await response.json();
        return NextResponse.json(result);
      } else {
        throw new Error(`HTTPS request failed with status: ${response.status}`);
      }
    } catch (httpsError) {
      console.log("Server: HTTPS failed:", httpsError instanceof Error ? httpsError.message : 'Unknown HTTPS error');
      lastError = httpsError;
    }

    // Try HTTP fallback
    try {
      console.log("Server: Attempting HTTP fallback to Render...");
      response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text,
          customApiKey 
        }),
      });

      if (response.ok) {
        console.log("Server: HTTP fallback successful");
        const result = await response.json();
        return NextResponse.json(result);
      } else {
        throw new Error(`HTTP request failed with status: ${response.status}`);
      }
    } catch (httpError) {
      console.log("Server: HTTP fallback also failed:", httpError instanceof Error ? httpError.message : 'Unknown HTTP error');
      lastError = httpError;
    }

    // If both HTTPS and HTTP failed, return error
    console.error("Server: Both HTTPS and HTTP requests to Render failed");
    return NextResponse.json(
      { 
        error: 'Backend service unavailable',
        details: lastError instanceof Error ? lastError.message : 'Unknown error',
        httpsUrl,
        httpUrl
      },
      { status: 503 }
    );

  } catch (error) {
    console.error('Error in extract-concepts proxy:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to build category paths from flat list
function buildCategoryPaths(categories: { id: string, name: string, parentId: string | null }[], categoryKeywords: { [key: string]: string[] }): string[][] {
  // Create a map of id -> category for easy lookup
  const categoryMap = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, category);
  });
  
  // Function to build path for a category
  function getCategoryPath(categoryId: string): string[] {
    const category = categoryMap.get(categoryId);
    if (!category) return [];
    
    // If it has a parent, recursively get the parent path and append this category
    if (category.parentId) {
      const parentPath = getCategoryPath(category.parentId);
      return [...parentPath, category.name];
    }
    
    // If no parent, this is a root category
    return [category.name];
  }
  
  // Build paths for all categories
  const paths: string[][] = [];
  categories.forEach(category => {
    const path = getCategoryPath(category.id);
    if (path.length > 0) {
      paths.push(path);
    }
  });
  
  // ENHANCED: Also extract hierarchical categories from existing concept categories
  // This handles cases where categories exist in concepts but not in the category table
  const conceptCategories = Object.keys(categoryKeywords || {});
  conceptCategories.forEach(category => {
    if (category.includes(' > ')) {
      const path = category.split(' > ').map(part => part.trim());
      // Only add if not already in paths
      const pathString = path.join(' > ');
      const existsInPaths = paths.some(existingPath => existingPath.join(' > ') === pathString);
      if (!existsInPaths) {
        paths.push(path);
      }
    }
  });
  
  console.log(`Built ${paths.length} category paths:`, paths);
  return paths;
}

// NEW: Build keyword mapping from existing concepts to learn categorization patterns
async function buildCategoryKeywordMapping(): Promise<{ [key: string]: string[] }> {
  try {
    // Fetch existing concepts with their categories
    const concepts = await prisma.concept.findMany({
      select: {
        title: true,
        category: true,
        summary: true,
        keyPoints: true,
      },
      take: 1000, // Limit to avoid performance issues
    });

    const categoryKeywords: { [key: string]: string[] } = {};

    concepts.forEach(concept => {
      const category = concept.category;
      if (!category) return;

      // Initialize category keywords array if it doesn't exist
      if (!categoryKeywords[category]) {
        categoryKeywords[category] = [];
      }

      // Extract keywords from title, summary, and keyPoints
      const allText = [
        concept.title,
        concept.summary,
        ...(concept.keyPoints ? JSON.parse(concept.keyPoints) : [])
      ].join(' ').toLowerCase();

      // Extract meaningful keywords (filter out common words)
      const keywords = extractMeaningfulKeywords(allText);
      
      // Add unique keywords to the category
      keywords.forEach(keyword => {
        if (!categoryKeywords[category].includes(keyword)) {
          categoryKeywords[category].push(keyword);
        }
      });

      // ENHANCED: Also learn from the category name itself
      // Extract keywords from the category path (e.g., "Artificial Intelligence > NLP")
      const categoryWords = category.split(' > ').join(' ').toLowerCase();
      const categoryKeywords_extracted = extractMeaningfulKeywords(categoryWords);
      
      categoryKeywords_extracted.forEach(keyword => {
        if (!categoryKeywords[category].includes(keyword)) {
          categoryKeywords[category].push(keyword);
        }
      });
    });

    // Limit keywords per category to avoid overwhelming the LLM
    Object.keys(categoryKeywords).forEach(category => {
      categoryKeywords[category] = categoryKeywords[category].slice(0, 20);
    });

    console.log(`Built keyword mapping for ${Object.keys(categoryKeywords).length} categories`);
    return categoryKeywords;

  } catch (error) {
    console.error('Error building category keyword mapping:', error);
    return {};
  }
}

// Helper function to extract meaningful keywords from text
function extractMeaningfulKeywords(text: string): string[] {
  // Common words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'use', 'used', 'using', 'how', 'what', 'when', 'where',
    'why', 'which', 'who', 'if', 'then', 'than', 'so', 'very', 'just', 'now', 'here', 'there'
  ]);

  // Extract words and filter
  const words = text
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .map(word => word.toLowerCase().trim())
    .filter(word => 
      word.length > 2 && 
      !stopWords.has(word) && 
      !/^\d+$/.test(word) // Remove pure numbers
    );

  // Count frequency and return most common meaningful words
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Return words sorted by frequency, limited to top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// NEW: Enhanced category learning system
async function enhanceCategoriesWithLearning(
  concepts: any[], 
  existingCategories: string[][], 
  categoryKeywords: { [key: string]: string[] }
): Promise<any[]> {
  
  // Process concepts one by one to allow for async LLM calls
  const enhancedConcepts = [];
  
  for (const concept of concepts) {
    const originalCategory = concept.category;
    const conceptText = `${concept.title} ${concept.summary || ''}`.toLowerCase();
    
    // FIRST: Check for obvious NLP/ML concepts that should never be miscategorized
    const nlpKeywords = ['nlp', 'natural language processing', 'tokenization', 'text processing', 'language model', 'sentiment analysis', 'text classification'];
    const mlKeywords = ['machine learning', 'neural network', 'deep learning', 'model training', 'algorithm'];
    
    const hasNLPContent = nlpKeywords.some(keyword => conceptText.includes(keyword));
    const hasMLContent = mlKeywords.some(keyword => conceptText.includes(keyword));
    
    if (hasNLPContent) {
      console.log(`🎯 Direct NLP detection: "${concept.title}" → Machine Learning`);
      concept.category = "Machine Learning";
      enhancedConcepts.push(concept);
      continue;
    }
    
    if (hasMLContent && !hasNLPContent) {
      console.log(`🎯 Direct ML detection: "${concept.title}" → Machine Learning`);
      concept.category = "Machine Learning";
      enhancedConcepts.push(concept);
      continue;
    }
    
    // SECOND: Try LLM-based categorization for better accuracy
    const llmCategory = await determineCategoryWithLLM(concept, existingCategories);
    
    if (llmCategory && llmCategory !== originalCategory) {
      console.log(`🤖 LLM categorization: "${concept.title}" ${originalCategory} → ${llmCategory}`);
      concept.category = llmCategory;
      
      // Update categoryPath to match the hierarchical structure
      const matchingPath = existingCategories.find(path => 
        path.join(' > ') === llmCategory || path[path.length - 1] === llmCategory
      );
      
      if (matchingPath) {
        concept.categoryPath = matchingPath;
      }
      
      enhancedConcepts.push(concept);
      continue;
    }
    
    // THIRD: Fall back to the existing learning system for other concepts
    const bestMatch = findBestCategoryMatch(conceptText, existingCategories, categoryKeywords);
    
    if (bestMatch && bestMatch !== originalCategory) {
      console.log(`📚 Keyword-based categorization: "${concept.title}" ${originalCategory} → ${bestMatch}`);
      
      // Update the concept with the better category
      concept.category = bestMatch;
      
      // Update categoryPath to match the hierarchical structure
      const matchingPath = existingCategories.find(path => 
        path.join(' > ') === bestMatch || path[path.length - 1] === bestMatch
      );
      
      if (matchingPath) {
        concept.categoryPath = matchingPath;
      }
    }
    
    enhancedConcepts.push(concept);
  }
  
  return enhancedConcepts;
}

// LLM-based categorization function for analysis phase
async function determineCategoryWithLLM(concept: any, existingCategories: string[][]): Promise<string | null> {
  try {
    // Get flat list of existing categories
    const flatCategories = existingCategories.map(path => path.join(' > '));
    
    if (flatCategories.length === 0) {
      return null; // No existing categories to work with
    }
    
    // Prepare concept text for LLM analysis
    const conceptText = `
Title: ${concept.title}
Summary: ${concept.summary || 'No summary provided'}
Key Points: ${Array.isArray(concept.keyPoints) ? concept.keyPoints.join(', ') : concept.keyPoints || 'None'}
    `.trim();
    
    // Step 1: Ask LLM to choose from existing categories
    const categorySelectionPrompt = `
You are a concept categorization expert. Given the following concept, choose the MOST APPROPRIATE category from the existing categories list.

CONCEPT:
${conceptText}

EXISTING CATEGORIES:
${flatCategories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

INSTRUCTIONS:
- Choose the category that BEST fits this concept
- If the concept is a comparison (like "Arrays vs Linked Lists"), choose "Data Structures" NOT "LeetCode Problems"
- If the concept is educational/theoretical, avoid "LeetCode Problems" unless it's specifically a coding problem
- Respond with ONLY the exact category name from the list above
- If NONE of the categories are a good fit, respond with "CREATE_NEW"

Your response:`;

    // Make the LLM call for category selection
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: categorySelectionPrompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 50
        }
      })
    });
    
    if (!response.ok) {
      console.log('LLM categorization failed during analysis phase');
      return null;
    }
    
    const result = await response.json();
    const selectedCategory = result.response?.trim();
    
    // If LLM selected an existing category, use it
    if (selectedCategory && selectedCategory !== "CREATE_NEW" && flatCategories.includes(selectedCategory)) {
      console.log(`✅ LLM selected existing category: "${selectedCategory}" for "${concept.title}"`);
      return selectedCategory;
    }
    
    // Step 2: If no good fit, ask LLM to create a new category
    if (selectedCategory === "CREATE_NEW") {
      const newCategoryPrompt = `
You are a concept categorization expert. The concept below doesn't fit well into any existing categories.

CONCEPT:
${conceptText}

EXISTING CATEGORIES (for reference):
${flatCategories.join(', ')}

INSTRUCTIONS:
- Create a NEW category name that would be perfect for this concept
- The category should be general enough to accommodate similar concepts in the future
- Use clear, professional naming (e.g., "Data Structures", "Algorithm Techniques", "System Design")
- If this is a comparison concept, create an appropriate category (e.g., "Data Structure Comparisons")
- Respond with ONLY the new category name (no explanations)

New category name:`;

      const newCategoryResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: newCategoryPrompt,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 30
          }
        })
      });
      
      if (newCategoryResponse.ok) {
        const newResult = await newCategoryResponse.json();
        const newCategory = newResult.response?.trim();
        
        if (newCategory && newCategory.length > 0 && newCategory.length < 100) {
          console.log(`🆕 LLM created new category: "${newCategory}" for "${concept.title}"`);
          
          // Store the new category by creating it via the API
          try {
            await fetch('http://localhost:3000/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newCategory,
                parentPath: []
              })
            });
            console.log(`📁 Successfully created new category: "${newCategory}"`);
          } catch (error) {
            console.log(`⚠️ Failed to create new category "${newCategory}":`, error);
          }
          
          return newCategory;
        }
      }
    }
    
    return null; // LLM couldn't help, fall back to keyword matching
    
  } catch (error) {
    console.log('Error in LLM categorization during analysis:', error);
    return null;
  }
}

// Find the best category match using semantic analysis and keyword matching
function findBestCategoryMatch(
  conceptText: string, 
  existingCategories: string[][], 
  categoryKeywords: { [key: string]: string[] }
): string | null {
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  let bestSpecificity = 0; // Prefer more specific categories

  console.log(`🔍 Finding best category for: "${conceptText.substring(0, 100)}..."`);

  // FIRST: Check hierarchical categories from existingCategories
  existingCategories.forEach(categoryPath => {
    const fullCategoryPath = categoryPath.join(' > ');
    const leafCategory = categoryPath[categoryPath.length - 1];
    
    // Calculate match score based on keywords
    let score = 0;
    const keywords = categoryKeywords[fullCategoryPath] || categoryKeywords[leafCategory] || [];
    
    console.log(`  Checking hierarchical category: ${fullCategoryPath}, keywords: [${keywords.join(', ')}]`);
    
    keywords.forEach(keyword => {
      if (conceptText.includes(keyword)) {
        score += 1;
        console.log(`    ✓ Keyword match: "${keyword}" (+1)`);
      }
    });
    
    // Bonus for exact service/technology matches
    const exactMatches = getExactMatches(conceptText, categoryPath);
    score += exactMatches * 3; // Weight exact matches heavily
    
    if (exactMatches > 0) {
      console.log(`    ✓ Exact matches: ${exactMatches} (+${exactMatches * 3})`);
    }
    
    // Prefer more specific categories (longer paths) when scores are equal
    const specificity = categoryPath.length;
    
    console.log(`    Score: ${score}, Specificity: ${specificity}`);
    
    if (score > bestScore || (score === bestScore && specificity > bestSpecificity)) {
      bestMatch = fullCategoryPath;
      bestScore = score;
      bestSpecificity = specificity;
      console.log(`    🎯 New best match: ${bestMatch} (score: ${bestScore})`);
    }
  });

  // SECOND: Check flat categories from existing concepts (only if no good hierarchical match)
  if (bestScore < 2) { // Lowered threshold to allow more flexible matching
    const flatCategories = Object.keys(categoryKeywords);
    flatCategories.forEach(category => {
      if (category.includes(' > ')) return; // Skip hierarchical ones, we already checked them
      
      const keywords = categoryKeywords[category] || [];
      let score = 0;
      
      console.log(`  Checking flat category: ${category}, keywords: [${keywords.join(', ')}]`);
      
      keywords.forEach(keyword => {
        if (conceptText.includes(keyword)) {
          score += 1;
          console.log(`    ✓ Keyword match: "${keyword}" (+1)`);
        }
      });
      
      // Check for technology upgrades (e.g., "Cloud" → "Cloud > AWS")
      const upgradeMatch = findCategoryUpgrade(conceptText, category, existingCategories);
      if (upgradeMatch) {
        score += 5; // High bonus for upgrade matches
        console.log(`    🚀 Upgrade available: ${category} → ${upgradeMatch} (+5)`);
        
        if (score > bestScore) {
          bestMatch = upgradeMatch;
          bestScore = score;
          bestSpecificity = upgradeMatch.split(' > ').length;
          console.log(`    🎯 New best match (upgrade): ${bestMatch} (score: ${bestScore})`);
        }
      } else if (score > bestScore) {
        bestMatch = category;
        bestScore = score;
        bestSpecificity = 1;
        console.log(`    🎯 New best match (flat): ${bestMatch} (score: ${bestScore})`);
      }
    });
  }

  console.log(`🏆 Final best match: ${bestMatch} (score: ${bestScore})`);
  return bestMatch;
}

// Check for exact technology/service name matches
function getExactMatches(conceptText: string, categoryPath: string[]): number {
  let matches = 0;
  
  // Technology and service mappings
  const techMappings: { [key: string]: string[] } = {
    'aws': ['aws', 'amazon web services', 'lambda', 'ec2', 's3', 'iam', 'cloudformation', 'sagemaker', 'rekognition'],
    'react': ['react', 'jsx', 'hooks', 'component', 'props', 'state'],
    'node': ['node', 'nodejs', 'express', 'npm'],
    'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
    'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'query', 'index'],
    'frontend': ['html', 'css', 'javascript', 'dom', 'browser'],
    'backend': ['api', 'server', 'endpoint', 'microservice'],
    'cloud': ['cloud', 'deployment', 'scaling', 'infrastructure'],
    'machine learning': ['ml', 'ai', 'model', 'training', 'neural', 'algorithm', 'nlp', 'natural language processing', 'tokenization', 'text processing', 'classification', 'sentiment analysis', 'embeddings', 'transformer', 'bert', 'gpt', 'language model'],
    'nlp': ['nlp', 'natural language processing', 'tokenization', 'text processing', 'text analysis', 'language model', 'sentiment', 'classification', 'embeddings', 'transformer', 'bert', 'gpt', 'spacy', 'nltk'],
    'data science': ['data science', 'data analysis', 'statistics', 'visualization', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'jupyter', 'notebook'],
  };

  categoryPath.forEach(categoryName => {
    const categoryLower = categoryName.toLowerCase();
    
    // Check if any tech mapping keywords appear in the concept text
    Object.entries(techMappings).forEach(([tech, keywords]) => {
      if (categoryLower.includes(tech)) {
        keywords.forEach(keyword => {
          if (conceptText.includes(keyword)) {
            matches++;
          }
        });
      }
    });
    
    // Direct category name match
    if (conceptText.includes(categoryLower)) {
      matches++;
    }
  });

  return matches;
}

// Helper function to generate fallback concepts
function generateFallbackConcepts(text: string, summary: string): any[] {
  // Extract potential topics from the first few sentences
  const firstSentences = text.split(/[.!?]/).slice(0, 5).join('. ');
  
  // Create a basic concept from the summary
  const mainConcept = {
    title: summary.length > 50 ? summary.substring(0, 50) + '...' : summary,
    category: "General",
    summary: summary,
    keyPoints: ["Extracted from conversation summary"],
    details: "This concept covers the main topics discussed in the conversation.",
    relatedConcepts: []
  };
  
  // Look for common programming terms to create additional concepts
  const programmingTerms = [
    "React", "JavaScript", "Python", "API", "Database", 
    "Algorithm", "Data Structure", "Frontend", "Backend",
    "Machine Learning", "NLP", "Natural Language Processing", "Tokenization"
  ];
  
  const additionalConcepts: any[] = [];
  
  // For each term, check if it appears in the text
  programmingTerms.forEach(term => {
    const regExp = new RegExp(`\\b${term}\\b`, 'i');
    if (regExp.test(text)) {
      additionalConcepts.push({
        title: term,
        category: getCategoryForTerm(term),
        summary: `Discussion related to ${term}`,
        keyPoints: [`${term} was mentioned in the conversation`],
        details: `This concept relates to ${term} as discussed in the conversation.`,
        relatedConcepts: []
      });
    }
  });
  
  // Return the main concept plus any additional concepts found
  return [mainConcept, ...additionalConcepts];
}

// Helper function to determine category for common programming terms
function getCategoryForTerm(term: string): string {
  const termMap: {[key: string]: string} = {
    "React": "Frontend",
    "JavaScript": "Frontend",
    "Python": "Backend",
    "API": "Backend",
    "Database": "Backend",
    "Algorithm": "Computer Science",
    "Data Structure": "Computer Science",
    "Frontend": "Frontend",
    "Backend": "Backend",
    "Machine Learning": "Machine Learning",
    "NLP": "Machine Learning",
    "Natural Language Processing": "Machine Learning",
    "Tokenization": "Machine Learning"
  };
  
  return termMap[term] || "General";
}

// NEW: Find if a flat category can be upgraded to a more specific hierarchical one
function findCategoryUpgrade(
  conceptText: string, 
  flatCategory: string, 
  existingCategories: string[][]
): string | null {
  
  // Technology upgrade mappings
  const upgradeRules: { [key: string]: { keywords: string[], targetCategory: string }[] } = {
    'Cloud': [
      { keywords: ['aws', 'lambda', 'ec2', 's3', 'iam', 'amazon'], targetCategory: 'Cloud > AWS' },
      { keywords: ['iam', 'policies', 'roles', 'access', 'control'], targetCategory: 'Cloud > AWS > IAM' },
      { keywords: ['azure', 'microsoft'], targetCategory: 'Cloud > Azure' },
      { keywords: ['gcp', 'google cloud'], targetCategory: 'Cloud > Google Cloud' },
    ],
    'Frontend': [
      { keywords: ['react', 'jsx', 'hooks', 'component'], targetCategory: 'Frontend Engineering > React' },
      { keywords: ['vue', 'vuejs'], targetCategory: 'Frontend Engineering > Vue' },
      { keywords: ['angular'], targetCategory: 'Frontend Engineering > Angular' },
    ],
    'Backend': [
      { keywords: ['node', 'nodejs', 'express'], targetCategory: 'Backend Engineering > Node.js' },
      { keywords: ['python', 'django', 'flask'], targetCategory: 'Backend Engineering > Python' },
      { keywords: ['java', 'spring'], targetCategory: 'Backend Engineering > Java' },
      { keywords: ['sql', 'mysql', 'postgresql'], targetCategory: 'Backend Engineering > SQL' },
    ],
    'Database': [
      { keywords: ['mysql', 'postgresql'], targetCategory: 'Backend Engineering > Databases > SQL' },
      { keywords: ['mongodb', 'nosql'], targetCategory: 'Backend Engineering > Databases > NoSQL' },
    ],
    'Machine Learning': [
      { keywords: ['nlp', 'natural language processing', 'tokenization', 'text processing', 'language model'], targetCategory: 'Machine Learning > NLP' },
      { keywords: ['computer vision', 'image processing', 'opencv', 'cnn'], targetCategory: 'Machine Learning > Computer Vision' },
      { keywords: ['deep learning', 'neural network', 'tensorflow', 'pytorch'], targetCategory: 'Machine Learning > Deep Learning' },
    ],
    'Data Science': [
      { keywords: ['machine learning', 'ml', 'model', 'training'], targetCategory: 'Data Science > Machine Learning' },
      { keywords: ['visualization', 'matplotlib', 'seaborn', 'plotly'], targetCategory: 'Data Science > Visualization' },
      { keywords: ['statistics', 'statistical analysis'], targetCategory: 'Data Science > Statistics' },
    ]
  };

  const rules = upgradeRules[flatCategory];
  if (!rules) return null;

  // Check each upgrade rule
  for (const rule of rules) {
    const matchCount = rule.keywords.filter(keyword => 
      conceptText.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      // Check if the target category actually exists in our hierarchy
      const targetExists = existingCategories.some(path => 
        path.join(' > ') === rule.targetCategory
      );
      
      if (targetExists) {
        console.log(`    🔄 Upgrade rule matched: ${flatCategory} → ${rule.targetCategory} (${matchCount} keywords)`);
        return rule.targetCategory;
      }
    }
  }

  return null;
} 