import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: Request) {
  try {
    const { conversation_text, customApiKey } = await request.json();

    if (!conversation_text || conversation_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      );
    }

    // Fetch existing categories and build enhanced category guidance
    let existingCategories: string[][] = [];
    let categoryKeywords: { [key: string]: string[] } = {};
    
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      });
      
      // Build keyword mapping from existing concepts first
      categoryKeywords = await buildCategoryKeywordMapping();
      
      // Convert to paths (now with access to categoryKeywords)
      existingCategories = buildCategoryPaths(categories, categoryKeywords);
      
      // DEBUG: Log what we found
      console.log("=== CATEGORY LEARNING DEBUG ===");
      console.log("Existing category paths:", existingCategories);
      console.log("Category keywords:", categoryKeywords);
      console.log("===============================");
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Continue without categories if fetch fails
    }

    // Call the Python extraction service (deployed as Vercel function)
    const extractionServiceUrl = process.env.EXTRACTION_SERVICE_URL || '/api/v1/extract-concepts';
    console.log("Connecting to extraction service at:", extractionServiceUrl);

    try {
      // Log the request to help with debugging
      console.log(`Sending request to extraction service with ${conversation_text.length} characters of text`);
      
      // Build full URL for the request
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.NODE_ENV === 'production' ? 'https://recall-henna.vercel.app' : 'http://localhost:3000');
      
      const fullUrl = extractionServiceUrl.startsWith('http') 
        ? extractionServiceUrl 
        : `${baseUrl}${extractionServiceUrl}`;
      
      console.log("Full extraction service URL:", fullUrl);
      
      const extractionResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_text,
          custom_api_key: customApiKey, // Pass custom API key to Python service
          category_guidance: {
            use_hierarchical_categories: true,
            existing_categories: existingCategories || [],
            category_keywords: categoryKeywords,
            instructions: `
SMART CATEGORIZATION RULES:
1. PREFER SPECIFIC SUBCATEGORIES: If content matches keywords for a specific subcategory, use that instead of the parent category
2. USE EXISTING HIERARCHY: Only use categories that already exist in the system - don't create new ones
3. MATCH BY CONTENT: Look for technical terms, service names, and concepts that match existing category patterns
4. FALLBACK TO PARENT: If no specific subcategory matches, use the most appropriate parent category

Examples of good categorization:
- "AWS Lambda functions" → ["Cloud Computing", "AWS"] (if AWS subcategory exists)
- "React hooks discussion" → ["Frontend Engineering", "React"] (if React subcategory exists)  
- "Database indexing" → ["Backend Engineering", "Databases"] (if Databases subcategory exists)
- "General programming" → ["Programming"] (fallback to parent if no specific match)

CRITICAL: Only use categories that exist in the existing_categories list provided.`
          }
        }),
      });

      if (!extractionResponse.ok) {
        const errorText = await extractionResponse.text();
        console.error(`Extraction service error (${extractionResponse.status}):`, errorText);
        throw new Error(`Extraction service returned ${extractionResponse.status}: ${errorText}`);
      }

      const extractionData = await extractionResponse.json();

      console.log("Received response from concept extractor");
      
      // Validate the response format
      console.log("Validating extraction response format");
      
      // Ensure extractionData has concepts array
      if (!extractionData.concepts || !Array.isArray(extractionData.concepts)) {
        console.error("Invalid response format - missing concepts array:", extractionData);
        extractionData.concepts = [];
      }
      
      // ENHANCED: Post-process concepts to upgrade categories using our learning system
      if (extractionData.concepts && extractionData.concepts.length > 0) {
        extractionData.concepts = await enhanceCategoriesWithLearning(
          extractionData.concepts, 
          existingCategories, 
          categoryKeywords
        );
      }

      // Check if we got an empty concepts array but have a summary
      if ((!extractionData.concepts || extractionData.concepts.length === 0) && extractionData.conversation_summary) {
        console.log("Received empty concepts array with summary - creating fallback concepts");
        
        // Create fallback concepts based on the summary and conversation text
        extractionData.concepts = generateFallbackConcepts(conversation_text, extractionData.conversation_summary);
      }
      
      // Ensure each concept has required fields
      extractionData.concepts = extractionData.concepts.map((concept: any) => {
        // Make sure required fields are present
        return {
          title: concept.title || "Untitled Concept",
          category: concept.category || "General",
          summary: concept.summary || extractionData.conversation_summary || "",
          keyPoints: Array.isArray(concept.keyPoints) ? concept.keyPoints : [],
          // Ensure details has the correct structure expected by the frontend
          details: typeof concept.details === 'object' ? concept.details : {
            implementation: concept.details || concept.implementation || concept.summary || "",
            complexity: concept.complexity || { time: "O(n)", space: "O(n)" },
            useCases: concept.useCases || [],
            edgeCases: concept.edgeCases || [],
            performance: concept.performance || "",
            interviewQuestions: [],
            practiceProblems: [],
            furtherReading: []
          },
          relatedConcepts: Array.isArray(concept.relatedConcepts) ? concept.relatedConcepts : [],
          ...concept
        };
      });

      // Transform the data to ensure it contains conversation_summary
      const transformedData = {
        ...extractionData,
        // Ensure we have a clean conversation_summary without formatting tags
        conversation_summary: extractionData.conversation_summary 
          ? extractionData.conversation_summary.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim()
          : "Conversation about programming concepts"
      };

      // Extract the category from detected concepts to enhance display
      if (transformedData.concepts && transformedData.concepts.length > 0) {
        console.log(`Successfully processed ${transformedData.concepts.length} concepts`);
        
        // Ensure the concepts have proper fields by rechecking
        transformedData.concepts = transformedData.concepts.map((concept: any) => {
          return {
            title: concept.title || "Untitled Concept",
            category: concept.category || "General",
            summary: concept.summary || transformedData.conversation_summary || "",
            keyPoints: Array.isArray(concept.keyPoints) && concept.keyPoints.length > 0 
              ? concept.keyPoints 
              : ["Extracted from conversation"],
            details: typeof concept.details === 'object' ? concept.details : {
              implementation: concept.details || concept.implementation || concept.summary || "",
              complexity: { time: "N/A", space: "N/A" },
              useCases: [],
              edgeCases: [],
              performance: "",
              interviewQuestions: [],
              practiceProblems: [],
              furtherReading: []
            },
            relatedConcepts: Array.isArray(concept.relatedConcepts) ? concept.relatedConcepts : [],
            codeSnippets: Array.isArray(concept.codeSnippets) ? concept.codeSnippets : []
          };
        });
      } else {
        console.log("No concepts found in response - creating fallback");
        
        // Create a simple fallback concept based on the summary
        const summaryText = transformedData.conversation_summary || "Discussion about programming topics";
        transformedData.concepts = [
          {
            title: summaryText.length > 40 ? summaryText.substring(0, 40) + "..." : summaryText,
            category: "General",
            summary: summaryText,
            keyPoints: ["Key points extracted from conversation"],
            details: {
              implementation: "This concept covers the main topics discussed in the conversation.",
              complexity: { time: "N/A", space: "N/A" },
              useCases: [],
              edgeCases: [],
              performance: "",
              interviewQuestions: [],
              practiceProblems: [],
              furtherReading: []
            },
            relatedConcepts: []
          }
        ];
      }

      // Return the transformed data
      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Error calling extraction service:", error);
      
      // Create a basic response with proper format to avoid frontend errors
      const fallbackResponse = {
        concepts: [
          {
            title: "Programming Concept",
            category: "General",
            summary: "Programming concepts discussed in the conversation",
            keyPoints: ["Extracted from conversation"],
            details: {
              implementation: "This concept was extracted from the conversation",
              complexity: { time: "N/A", space: "N/A" },
              useCases: [],
              edgeCases: [],
              performance: "",
              interviewQuestions: [],
              practiceProblems: [],
              furtherReading: []
            },
            relatedConcepts: [],
          }
        ],
        conversation_summary: "Discussion about programming topics",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
      
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Error extracting concepts:', error);
    return NextResponse.json(
      { error: 'Failed to extract concepts' },
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