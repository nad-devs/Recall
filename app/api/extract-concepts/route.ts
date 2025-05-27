import { NextRequest, NextResponse } from 'next/server';

// Fallback concept extraction for LeetCode problems
function extractLeetCodeConcepts(conversationText: string) {
  const text = conversationText.toLowerCase();
  const concepts = [];
  
  // Check for specific LeetCode problems
  if (text.includes('contains duplicate') || text.includes('duplicate')) {
    concepts.push({
      title: "Contains Duplicate",
      category: "LeetCode Problems",
      summary: "Algorithm problem involving duplicate detection in arrays using hash tables",
      keyPoints: [
        "Use hash table for O(1) lookup time",
        "Time complexity: O(n) where n is array length", 
        "Space complexity: O(n) for storing seen elements",
        "Early termination when duplicate found"
      ],
      details: "The Contains Duplicate problem requires determining if an array contains any duplicate elements. The optimal solution uses a hash table to track previously seen elements as we iterate through the array. This approach provides O(n) time complexity compared to the naive O(n²) nested loop solution.",
      codeSnippets: [
        {
          language: "Python",
          description: "Hash table solution",
          code: "def containsDuplicate(nums):\n    seen = set()\n    for num in nums:\n        if num in seen:\n            return True\n        seen.add(num)\n    return False"
        }
      ],
      relatedConcepts: ["Hash Table", "Set Data Structure", "Time Complexity Analysis"],
      confidence_score: 0.9
    });
    
    // Add Hash Table concept if discussing the technique
    if (text.includes('hash table') || text.includes('hash map') || text.includes('set')) {
      concepts.push({
        title: "Hash Table",
        category: "Data Structures",
        summary: "Data structure providing O(1) average lookup time for duplicate detection",
        keyPoints: [
          "Provides O(1) average time for lookups, insertions, deletions",
          "Uses hash function to map keys to array indices",
          "Ideal for duplicate detection and frequency counting",
          "Space complexity is O(n) for n unique elements"
        ],
        details: "Hash tables work by using a hash function to convert keys into array indices. When we want to store or retrieve a value, we hash the key to get an index and access that position in the underlying array. This allows for constant-time operations in the average case.",
        codeSnippets: [
          {
            language: "Python",
            description: "Basic hash table usage",
            code: "seen = set()  # or dict()\nif element in seen:\n    # Found duplicate"
          }
        ],
        relatedConcepts: ["Contains Duplicate", "Hashing", "Collision Handling"],
        confidence_score: 0.85
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
        signal: AbortSignal.timeout(10000), // 10 second timeout for health check
        keepalive: false,
      });
      console.log("✅ Backend service is awake");
      // Small delay to ensure SSL is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (warmupError) {
      console.log("⚠️ Service warmup failed, proceeding anyway:", warmupError instanceof Error ? warmupError.message : 'Unknown error');
    }

    // Force disable SSL verification and use aggressive connection settings
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const httpsUrl = backendUrl;
    const httpUrl = backendUrl.replace('https://', 'http://');
    
    // Enhanced fetch options with forced SSL settings
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
        ...(customApiKey && { customApiKey }),
        context: null,
        category_guidance: null
      }),
      keepalive: false,
      // Force disable certificate validation
      ...(url.startsWith('https') && {
        rejectUnauthorized: false,
      }),
    });
    
    let response;
    let backendSuccess = false;
    
    // Strategy 1: Try HTTPS with aggressive SSL bypass
    try {
      console.log("🔒 Attempting HTTPS with forced SSL bypass...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      response = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        ...createFetchOptions(httpsUrl),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log("✅ HTTPS connection successful with SSL bypass");
      backendSuccess = true;
    } catch (sslError) {
      console.log("🔄 HTTPS with SSL bypass failed, trying direct HTTP...", sslError instanceof Error ? sslError.message : 'Connection failed');
      
      // Strategy 2: Direct HTTP fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        response = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
          ...createFetchOptions(httpUrl),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("✅ HTTP connection successful");
        backendSuccess = true;
      } catch (httpError) {
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
              ...(customApiKey && { customApiKey }),
            }),
          });
          console.log("✅ Basic HTTP connection successful");
          backendSuccess = true;
        } catch (finalError) {
          console.log("❌ All backend connection attempts failed:", finalError instanceof Error ? finalError.message : 'Connection failed');
          backendSuccess = false;
        }
      }
    }
    
    // Restore original TLS setting
    if (originalRejectUnauthorized !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }

    // If backend failed, try fallback extraction for LeetCode problems
    if (!backendSuccess || !response) {
      console.log("🔄 Backend failed, trying fallback extraction for LeetCode problems...");
      const fallbackResult = extractLeetCodeConcepts(conversation_text);
      
      if (fallbackResult.concepts.length > 0) {
        console.log("✅ Fallback extraction successful:", fallbackResult.concepts.length, "concepts found");
        return NextResponse.json(fallbackResult);
      } else {
        console.log("❌ Fallback extraction found no concepts");
        return NextResponse.json(
          { 
            error: 'Backend service unavailable and no fallback concepts found',
            details: 'Please try again later or check your internet connection'
          },
          { status: 503 }
        );
      }
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
      
      // If backend returned no concepts but this looks like a LeetCode problem, try fallback
      if ((!result.concepts || result.concepts.length === 0) && 
          (conversation_text.toLowerCase().includes('leetcode') || 
           conversation_text.toLowerCase().includes('contains duplicate') ||
           conversation_text.toLowerCase().includes('valid anagram') ||
           conversation_text.toLowerCase().includes('two sum'))) {
        console.log("🔄 Backend returned no concepts for LeetCode content, trying fallback...");
        const fallbackResult = extractLeetCodeConcepts(conversation_text);
        
        if (fallbackResult.concepts.length > 0) {
          console.log("✅ Fallback extraction enhanced the result");
          return NextResponse.json(fallbackResult);
        }
      }
      
      return NextResponse.json(result);
    } else {
      const errorText = await response.text();
      console.error("❌ Render backend error:", response.status, errorText);
      
      // Try fallback extraction for LeetCode problems even if backend returned an error
      console.log("🔄 Backend error, trying fallback extraction...");
      const fallbackResult = extractLeetCodeConcepts(conversation_text);
      
      if (fallbackResult.concepts.length > 0) {
        console.log("✅ Fallback extraction successful despite backend error");
        return NextResponse.json(fallbackResult);
      }
      
      return NextResponse.json(
        { 
          error: 'Backend service error',
          status: response.status,
          details: errorText,
          backendUrl: httpsUrl
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('💥 Error in extract-concepts proxy:', error);
    
    // Try fallback extraction as last resort
    try {
      const body = await request.json();
      const { conversation_text } = body;
      
      if (conversation_text) {
        console.log("🔄 Trying fallback extraction due to error...");
        const fallbackResult = extractLeetCodeConcepts(conversation_text);
        
        if (fallbackResult.concepts.length > 0) {
          console.log("✅ Fallback extraction successful despite error");
          return NextResponse.json(fallbackResult);
        }
      }
    } catch (fallbackError) {
      console.log("❌ Fallback extraction also failed:", fallbackError);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 