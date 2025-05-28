import { NextRequest, NextResponse } from 'next/server';

// Enhanced LeetCode problem detection and title extraction
function detectLeetCodeProblem(conversationText: string): { isLeetCode: boolean, problemName?: string, approach?: string } {
  const text = conversationText.toLowerCase();
  
  // Common LeetCode problem patterns
  const leetcodePatterns = [
    { pattern: /contains?\s+duplicate/i, name: "Contains Duplicate" },
    { pattern: /valid\s+anagram/i, name: "Valid Anagram" },
    { pattern: /two\s+sum/i, name: "Two Sum" },
    { pattern: /three\s+sum/i, name: "Three Sum" },
    { pattern: /reverse\s+linked\s+list/i, name: "Reverse Linked List" },
    { pattern: /merge\s+(?:two\s+)?sorted\s+(?:arrays?|lists?)/i, name: "Merge Two Sorted Lists" },
    { pattern: /palindrome\s+(?:string|number|linked\s+list)/i, name: "Valid Palindrome" },
    { pattern: /maximum\s+subarray/i, name: "Maximum Subarray" },
    { pattern: /climbing\s+stairs/i, name: "Climbing Stairs" },
    { pattern: /best\s+time\s+to\s+buy\s+and\s+sell/i, name: "Best Time to Buy and Sell Stock" },
    { pattern: /product\s+of\s+array\s+except\s+self/i, name: "Product of Array Except Self" },
    { pattern: /find\s+minimum\s+in\s+rotated\s+sorted\s+array/i, name: "Find Minimum in Rotated Sorted Array" },
    { pattern: /search\s+in\s+rotated\s+sorted\s+array/i, name: "Search in Rotated Sorted Array" },
    { pattern: /3sum/i, name: "3Sum" },
    { pattern: /container\s+with\s+most\s+water/i, name: "Container With Most Water" },
    { pattern: /longest\s+substring\s+without\s+repeating/i, name: "Longest Substring Without Repeating Characters" },
    { pattern: /group\s+anagrams/i, name: "Group Anagrams" },
    { pattern: /top\s+k\s+frequent\s+elements/i, name: "Top K Frequent Elements" },
    { pattern: /encode\s+and\s+decode\s+strings/i, name: "Encode and Decode Strings" },
    { pattern: /longest\s+consecutive\s+sequence/i, name: "Longest Consecutive Sequence" },
    { pattern: /number\s+of\s+islands/i, name: "Number of Islands" },
    { pattern: /clone\s+graph/i, name: "Clone Graph" },
    { pattern: /pacific\s+atlantic\s+water\s+flow/i, name: "Pacific Atlantic Water Flow" },
    { pattern: /course\s+schedule/i, name: "Course Schedule" },
    { pattern: /word\s+ladder/i, name: "Word Ladder" },
    { pattern: /binary\s+tree\s+(?:inorder|preorder|postorder)\s+traversal/i, name: "Binary Tree Traversal" },
    { pattern: /maximum\s+depth\s+of\s+binary\s+tree/i, name: "Maximum Depth of Binary Tree" },
    { pattern: /same\s+tree/i, name: "Same Tree" },
    { pattern: /invert\s+binary\s+tree/i, name: "Invert Binary Tree" },
    { pattern: /binary\s+tree\s+maximum\s+path\s+sum/i, name: "Binary Tree Maximum Path Sum" },
    { pattern: /serialize\s+and\s+deserialize\s+binary\s+tree/i, name: "Serialize and Deserialize Binary Tree" },
    { pattern: /subtree\s+of\s+another\s+tree/i, name: "Subtree of Another Tree" },
    { pattern: /lowest\s+common\s+ancestor/i, name: "Lowest Common Ancestor of a Binary Tree" },
    { pattern: /validate\s+binary\s+search\s+tree/i, name: "Validate Binary Search Tree" },
    { pattern: /kth\s+smallest\s+element\s+in\s+a\s+bst/i, name: "Kth Smallest Element in a BST" },
    { pattern: /implement\s+trie/i, name: "Implement Trie (Prefix Tree)" },
    { pattern: /word\s+search/i, name: "Word Search" },
    { pattern: /combination\s+sum/i, name: "Combination Sum" },
    { pattern: /permutations/i, name: "Permutations" },
    { pattern: /merge\s+intervals/i, name: "Merge Intervals" },
    { pattern: /insert\s+interval/i, name: "Insert Interval" },
    { pattern: /non[\-\s]?overlapping\s+intervals/i, name: "Non-overlapping Intervals" },
    { pattern: /meeting\s+rooms/i, name: "Meeting Rooms" },
    { pattern: /rotate\s+image/i, name: "Rotate Image" },
    { pattern: /spiral\s+matrix/i, name: "Spiral Matrix" },
    { pattern: /set\s+matrix\s+zeroes/i, name: "Set Matrix Zeroes" },
    { pattern: /word\s+break/i, name: "Word Break" },
    { pattern: /coin\s+change/i, name: "Coin Change" },
    { pattern: /house\s+robber/i, name: "House Robber" },
    { pattern: /decode\s+ways/i, name: "Decode Ways" },
    { pattern: /unique\s+paths/i, name: "Unique Paths" },
    { pattern: /jump\s+game/i, name: "Jump Game" },
    { pattern: /longest\s+increasing\s+subsequence/i, name: "Longest Increasing Subsequence" },
    { pattern: /palindromic\s+substrings/i, name: "Palindromic Substrings" },
    { pattern: /longest\s+common\s+subsequence/i, name: "Longest Common Subsequence" }
  ];
  
  // Check for exact LeetCode problem matches
  for (const { pattern, name } of leetcodePatterns) {
    if (pattern.test(text)) {
      // Try to detect solution approach
      let approach = "";
      if (text.includes("hash") && (text.includes("table") || text.includes("map") || text.includes("set"))) {
        approach = "Hash Table Solution";
      } else if (text.includes("two pointer") || text.includes("two-pointer")) {
        approach = "Two Pointers Approach";
      } else if (text.includes("sliding window")) {
        approach = "Sliding Window Technique";
      } else if (text.includes("dynamic programming") || text.includes("dp")) {
        approach = "Dynamic Programming Solution";
      } else if (text.includes("binary search")) {
        approach = "Binary Search Solution";
      } else if (text.includes("dfs") || text.includes("depth") || text.includes("recursion")) {
        approach = "DFS/Recursive Solution";
      } else if (text.includes("bfs") || text.includes("breadth") || text.includes("queue")) {
        approach = "BFS Solution";
      } else if (text.includes("greedy")) {
        approach = "Greedy Algorithm";
      } else if (text.includes("backtrack")) {
        approach = "Backtracking Solution";
      }
      
      return { 
        isLeetCode: true, 
        problemName: name,
        approach: approach
      };
    }
  }
  
  // Check for general problem indicators
  const problemIndicators = [
    "leetcode", "algorithm problem", "coding problem", "interview question",
    "find", "return", "given an array", "given a string", "implement"
  ];
  
  const isLeetCodeStyle = problemIndicators.some(indicator => text.includes(indicator)) &&
    (text.includes("time complexity") || text.includes("space complexity") || 
     text.includes("optimal") || text.includes("solution") || text.includes("approach"));
  
  return { isLeetCode: isLeetCodeStyle };
}

// Generate enhanced guidance for the backend based on conversation analysis
function generateLeetCodeGuidance(conversationText: string) {
  const detection = detectLeetCodeProblem(conversationText);
  
  if (!detection.isLeetCode) {
    return null;
  }
  
  let guidance = `This conversation is about a LeetCode-style algorithm problem. When generating the concept title:

1. Use the EXACT problem name if it's a known LeetCode problem (e.g., "Contains Duplicate", "Valid Anagram", "Two Sum", etc.)
2. If discussing a solution approach, format the title as: "[Problem Name]" or "[Problem Name] - [Approach]"
3. Focus on the core problem being solved, not just the technique being used
4. Avoid generic titles like "Algorithm" or "Hash Table" - be specific about the problem

`;

  if (detection.problemName) {
    guidance += `Detected Problem: "${detection.problemName}"
`;
    if (detection.approach) {
      guidance += `Detected Approach: "${detection.approach}"
Suggested Title Format: "${detection.problemName}" or "${detection.problemName} - ${detection.approach}"
`;
    } else {
      guidance += `Suggested Title: "${detection.problemName}"
`;
    }
  }
  
  guidance += `
Remember: The title should immediately tell someone what specific problem or concept is being discussed, not just the general technique or data structure used.`;

  return guidance;
}

// Fallback concept extraction for LeetCode problems
function extractLeetCodeConcepts(conversationText: string) {
  const text = conversationText.toLowerCase();
  const concepts = [];
  
  // Check for specific LeetCode problems - use EXACT problem names
  if (text.includes('contains duplicate') || (text.includes('duplicate') && (text.includes('array') || text.includes('list')))) {
    concepts.push({
      title: "Contains Duplicate",
      category: "LeetCode Problems",
      summary: "A problem that involves finding if an array contains any duplicate elements.",
      keyPoints: [
        "Use hash table for O(1) lookup time",
        "Time complexity: O(n) where n is array length", 
        "Space complexity: O(n) for storing seen elements",
        "Early termination when duplicate found",
        "Optimal approach compared to O(n²) nested loops"
      ],
      details: "The Contains Duplicate problem asks us to determine if an array contains any duplicate elements. The most efficient approach uses a hash table (dictionary) to track elements we've seen. As we iterate through the array, we check if each element already exists in our hash table. If it does, we've found a duplicate and return true. If we finish iterating without finding any duplicates, we return false. This approach achieves O(n) time complexity compared to the naive O(n²) nested loop approach, trading some space efficiency for significant time optimization.",
      codeSnippets: [
        {
          language: "Python",
          description: "Optimal hash table solution",
          code: "def containsDuplicate(nums):\n    seen = set()\n    for num in nums:\n        if num in seen:\n            return True\n        seen.add(num)\n    return False"
        }
      ],
      relatedConcepts: ["Hash Table", "Set Data Structure", "Time Complexity Analysis"],
      confidence_score: 0.95
    });
    
    // Add Hash Table concept if discussing the technique
    if (text.includes('hash table') || text.includes('hash map') || text.includes('set') || text.includes('dictionary')) {
      concepts.push({
        title: "Hash Table",
        category: "Data Structures",
        summary: "Data structure providing O(1) average lookup time for duplicate detection",
        keyPoints: [
          "Provides O(1) average time for lookups, insertions, deletions",
          "Uses hash function to map keys to array indices",
          "Ideal for duplicate detection and frequency counting",
          "Space complexity is O(n) for n unique elements",
          "Handles collisions through chaining or open addressing"
        ],
        details: "Hash tables work by using a hash function to convert keys into array indices. When we want to store or retrieve a value, we hash the key to get an index and access that position in the underlying array. This allows for constant-time operations in the average case. In the context of duplicate detection, hash tables excel because they can quickly determine if an element has been seen before without needing to search through all previously encountered elements.",
        codeSnippets: [
          {
            language: "Python",
            description: "Basic hash table usage for duplicate detection",
            code: "seen = set()  # Hash table implementation\nfor element in array:\n    if element in seen:\n        return True  # Duplicate found\n    seen.add(element)"
          }
        ],
        relatedConcepts: ["Contains Duplicate", "Hashing", "Collision Handling"],
        confidence_score: 0.9
      });
    }
  }
  
  // Check for Valid Anagram
  if (text.includes('valid anagram') || text.includes('anagram')) {
    concepts.push({
      title: "Valid Anagram",
      category: "LeetCode Problems",
      summary: "Algorithm problem to determine if two strings are anagrams using character frequency counting",
      keyPoints: [
        "Count character frequencies in both strings",
        "Compare frequency maps for equality",
        "Time complexity: O(n) where n is string length",
        "Space complexity: O(1) for fixed alphabet size"
      ],
      details: "The Valid Anagram problem asks us to determine if two strings are anagrams of each other. An anagram is a word formed by rearranging the letters of another word. The optimal solution involves counting the frequency of each character in both strings and comparing the frequency maps.",
      codeSnippets: [
        {
          language: "Python",
          description: "Character frequency solution",
          code: "def isAnagram(s, t):\n    if len(s) != len(t):\n        return False\n    \n    char_count = {}\n    for char in s:\n        char_count[char] = char_count.get(char, 0) + 1\n    \n    for char in t:\n        if char not in char_count:\n            return False\n        char_count[char] -= 1\n        if char_count[char] == 0:\n            del char_count[char]\n    \n    return len(char_count) == 0"
        }
      ],
      relatedConcepts: ["Hash Table", "String Manipulation", "Frequency Counting"],
      confidence_score: 0.9
    });
  }
  
  // Check for Two Sum
  if (text.includes('two sum') || text.includes('pair sum')) {
    concepts.push({
      title: "Two Sum",
      category: "LeetCode Problems",
      summary: "Algorithm problem to find two numbers in an array that add up to a target sum",
      keyPoints: [
        "Use hash table to store complements",
        "Single pass through the array",
        "Time complexity: O(n)",
        "Space complexity: O(n)"
      ],
      details: "The Two Sum problem asks us to find two numbers in an array that add up to a specific target. The optimal solution uses a hash table to store the complement of each number as we iterate through the array.",
      codeSnippets: [
        {
          language: "Python",
          description: "Hash table solution",
          code: "def twoSum(nums, target):\n    complement_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in complement_map:\n            return [complement_map[complement], i]\n        complement_map[num] = i\n    return []"
        }
      ],
      relatedConcepts: ["Hash Table", "Array Problems", "Complement Search"],
      confidence_score: 0.9
    });
  }
  
  return {
    concepts,
    conversation_summary: `Discussion about ${concepts.map(c => c.title).join(', ')} algorithm problem${concepts.length > 1 ? 's' : ''}`,
    metadata: {
      extraction_method: "leetcode_fallback",
      extraction_time: new Date().toISOString(),
      concept_count: concepts.length
    }
  };
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

    console.log("🔄 Proxying request to Render backend...");
    console.log("📝 Conversation preview:", conversation_text.substring(0, 200) + "...");
    console.log("🔑 Using custom API key:", !!customApiKey);

    // Detect LeetCode problems and generate guidance
    const leetcodeGuidance = generateLeetCodeGuidance(conversation_text);
    if (leetcodeGuidance) {
      console.log("🎯 LeetCode problem detected - sending guidance to backend");
    }

    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
    
    // First, wake up the service with a health check to avoid SSL cold start issues
    try {
      console.log("🔋 Warming up backend service...");
      await fetch(`${backendUrl}/api/v1/health`, { 
        method: 'GET',
        headers: {
          'User-Agent': 'Vercel-Frontend/1.0',
        },
        signal: AbortSignal.timeout(15000), // Increased timeout for health check
        keepalive: false,
      });
      console.log("✅ Backend service is awake");
      // Longer delay to ensure SSL is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (warmupError) {
      console.log("⚠️ Service warmup failed, proceeding anyway:", warmupError instanceof Error ? warmupError.message : 'Unknown error');
    }

    // TLS settings are configured in vercel.json for deployment
    const httpsUrl = backendUrl;
    const httpUrl = backendUrl.replace('https://', 'http://');
    
    // Enhanced fetch options
    const createFetchOptions = (url: string) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Frontend/1.0',
        'Connection': 'close',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ 
        conversation_text,
        ...(customApiKey && { custom_api_key: customApiKey }),
        context: null,
        category_guidance: leetcodeGuidance ? { guidance: leetcodeGuidance } : null
      }),
      keepalive: false,
    });
    
    let response;
    let backendSuccess = false;
    let lastError = null;
    
    // Strategy 1: Try HTTPS with aggressive SSL bypass (longer timeout)
    try {
      console.log("🔒 Attempting HTTPS with forced SSL bypass...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds
      
      response = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        ...createFetchOptions(httpsUrl),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log("✅ HTTPS connection successful with SSL bypass");
      backendSuccess = true;
    } catch (sslError) {
      lastError = sslError;
      console.log("🔄 HTTPS with SSL bypass failed, trying direct HTTP...", sslError instanceof Error ? sslError.message : 'Connection failed');
      
      // Strategy 2: Direct HTTP fallback (longer timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds
        
        response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          ...createFetchOptions(httpUrl),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("✅ HTTP connection successful");
        backendSuccess = true;
      } catch (httpError) {
        lastError = httpError;
        console.log("🔄 HTTP also failed, trying without timeout...", httpError instanceof Error ? httpError.message : 'Connection failed');
        
        // Strategy 3: Last resort - no timeout, basic fetch
        try {
          response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              conversation_text,
              ...(customApiKey && { custom_api_key: customApiKey }),
              context: null,
              category_guidance: leetcodeGuidance ? { guidance: leetcodeGuidance } : null
            }),
          });
          console.log("✅ Basic HTTP connection successful");
          backendSuccess = true;
        } catch (finalError) {
          lastError = finalError;
          console.log("❌ All backend connection attempts failed:", finalError instanceof Error ? finalError.message : 'Connection failed');
          backendSuccess = false;
        }
      }
    }
    
    // If backend failed completely, return a proper error (NO FALLBACK)
    if (!backendSuccess || !response) {
      console.log("❌ Backend completely failed - no fallback, returning error");
      return NextResponse.json(
        { 
          error: 'AI analysis service temporarily unavailable',
          details: 'The AI backend service is not responding. Please try again in a moment.',
          lastError: lastError instanceof Error ? lastError.message : 'Connection failed',
          suggestion: 'The service may be starting up. Please wait 30 seconds and try again.'
        },
        { status: 503 }
      );
    }

    console.log(`📊 Backend response status: ${response.status}`);
    console.log(`📊 Backend response headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log("📦 Received result from backend:", {
        concepts: result.concepts?.length || 0,
        summary: result.summary ? 'present' : 'missing',
        conceptTitles: result.concepts?.map((c: any) => c.title) || []
      });
      
      // Return the AI result directly - no fallback interference
      return NextResponse.json(result);
    } else {
      const errorText = await response.text();
      console.error("❌ Render backend error:", response.status, errorText);
      
      // Return backend error directly - no fallback
      return NextResponse.json(
        { 
          error: 'AI analysis service error',
          status: response.status,
          details: errorText,
          backendUrl: httpsUrl,
          suggestion: 'The AI service encountered an error. Please try again.'
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('💥 Error in extract-concepts proxy:', error);
    
    // Return error directly - no fallback
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again. If the problem persists, the AI service may be starting up.'
      },
      { status: 500 }
    );
  }
} 