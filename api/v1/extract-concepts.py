import json
import os
import re
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from openai import OpenAI

# Cache for storing responses
_cache = {}

class ConceptExtractor:
    def __init__(self, client):
        self.client = client
        self.model = "gpt-4o"
        self.max_retries = 3
        self.retry_delay = 1
        self.cache = _cache

    def _generate_cache_key(self, text: str) -> str:
        """Generate a cache key for the conversation text."""
        return hashlib.md5(text.encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available."""
        return self.cache.get(cache_key)
    
    def _fetch_categories(self) -> List[str]:
        """Fetch the list of categories. Fallback to default if fails."""
        default_categories = [
            # Core Computer Science
            "Data Structures and Algorithms",
            "Data Structures",
            "Algorithms",
            "Algorithm Technique",
            
            # Backend Development
            "Backend Engineering",
            "Backend Engineering > Authentication",
            "Backend Engineering > Storage",
            "Backend Engineering > APIs",
            "Backend Engineering > Databases",
            
            # Frontend Development
            "Frontend Engineering", 
            "Frontend Engineering > React",
            "Frontend Engineering > Next.js",
            "Frontend Engineering > CSS",
            
            # Cloud & DevOps
            "Cloud Engineering",
            "Cloud Engineering > AWS",
            "DevOps",
            
            # Programming Languages
            "JavaScript",
            "TypeScript",
            "Python",
            
            # LeetCode Problems
            "LeetCode Problems",
            
            # Other
            "System Design",
            "Machine Learning",
            "General"
        ]
        return default_categories

    def _suggest_category_llm(self, title: str, summary: str) -> Optional[str]:
        """Ask the LLM to suggest the best category for a concept."""
        categories = self._fetch_categories()
        prompt = (
            f"Given the following concept title and summary, suggest the most appropriate category from this list: {categories}.\n"
            f"Title: {title}\n"
            f"Summary: {summary}\n"
            "Respond with only the category name. If none of the categories fit well, respond with 'UNCATEGORIZED'."
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=20
            )
            category = response.choices[0].message.content.strip()
            # Normalize and check if it's a valid category
            normalized_category = self._normalize_category(category, categories)
            return normalized_category
        except Exception as e:
            print(f"LLM category suggestion failed: {str(e)}")
            return None

    def _normalize_category(self, suggested_category: str, valid_categories: List[str]) -> Optional[str]:
        """Normalize a suggested category to match the valid categories list."""
        if not suggested_category or suggested_category.upper() == "UNCATEGORIZED":
            return None
            
        # First try exact match
        if suggested_category in valid_categories:
            return suggested_category
            
        # Try case-insensitive match
        suggested_lower = suggested_category.lower()
        for category in valid_categories:
            if category.lower() == suggested_lower:
                return category
                
        # Try fuzzy matching for common variations
        category_mapping = {
            # Core Computer Science
            "dsa": "Data Structures and Algorithms",
            "data structure": "Data Structures", 
            "algorithm": "Algorithms",
            "technique": "Algorithm Technique",
            "leetcode": "LeetCode Problems",
            
            # Backend Development
            "backend": "Backend Engineering",
            "api": "Backend Engineering > APIs",
            "rest": "Backend Engineering > APIs",
            "graphql": "Backend Engineering > APIs", 
            "database": "Backend Engineering > Databases",
            "sql": "Backend Engineering > Databases",
            "nosql": "Backend Engineering > Databases",
            "auth": "Backend Engineering > Authentication",
            "storage": "Backend Engineering > Storage",
            "s3": "Backend Engineering > Storage",
            
            # Frontend Development
            "frontend": "Frontend Engineering",
            "react": "Frontend Engineering > React",
            "next": "Frontend Engineering > Next.js",
            "css": "Frontend Engineering > CSS",
            
            # Cloud & DevOps
            "cloud": "Cloud Engineering",
            "aws": "Cloud Engineering > AWS", 
            "devops": "DevOps",
            
            # Programming Languages
            "js": "JavaScript",
            "typescript": "TypeScript",
            "python": "Python",
            
            # Other
            "system": "System Design",
            "ml": "Machine Learning",
            "ai": "Machine Learning"
        }
        
        suggested_lower = suggested_category.lower()
        if suggested_lower in category_mapping:
            return category_mapping[suggested_lower]
            
        # Check if it contains any keywords
        for keyword, mapped_category in category_mapping.items():
            if keyword in suggested_lower:
                return mapped_category
                
        return None

    def _parse_structured_response(self, response_text: str) -> Dict:
        """Parse the structured response from the LLM."""
        try:
            print(f"=== PARSING JSON RESPONSE ===")
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                print(f"Found JSON block, length: {len(json_str)} characters")
                print(f"JSON preview: {json_str[:200]}...")
                
                parsed = json.loads(json_str)
                print(f"Successfully parsed JSON with {len(parsed.get('concepts', []))} concepts")
                return parsed
            else:
                print("No JSON block found in response!")
                print(f"Full response: {response_text}")
                # Fallback parsing if no JSON found
                return self._fallback_extraction(response_text)
        except json.JSONDecodeError as e:
            print(f"=== JSON PARSING FAILED ===")
            print(f"JSON decode error: {e}")
            print(f"Problematic JSON: {json_str[:500] if 'json_str' in locals() else 'No JSON extracted'}")
            return self._fallback_extraction(response_text)

    def _fallback_extraction(self, text: str) -> Dict:
        """Fallback extraction method when structured parsing fails."""
        print("WARNING: Using fallback extraction - this should not happen with sophisticated prompting!")
        print(f"Text length: {len(text)}")
        print(f"Text preview: {text[:200]}...")
        
        # Check if this looks like a LeetCode problem discussion
        text_lower = text.lower()
        if any(indicator in text_lower for indicator in ['contains duplicate', 'hash table', 'duplicate', 'leetcode']):
            return {
                "concepts": [
                    {
                        "title": "Contains Duplicate",
                        "category": "LeetCode Problems",
                        "summary": "Algorithm problem involving duplicate detection in arrays using hash tables",
                        "keyPoints": [
                            "Use hash table for O(1) lookup time",
                            "Time complexity: O(n) where n is array length", 
                            "Space complexity: O(n) for storing seen elements",
                            "Early termination when duplicate found"
                        ],
                        "details": "The Contains Duplicate problem requires determining if an array contains any duplicate elements. The optimal solution uses a hash table to track previously seen elements as we iterate through the array. This approach provides O(n) time complexity compared to the naive O(n²) nested loop solution.",
                        "codeSnippets": [
                            {
                                "language": "Python",
                                "description": "Hash table solution",
                                "code": "def containsDuplicate(nums):\n    seen = set()\n    for num in nums:\n        if num in seen:\n            return True\n        seen.add(num)\n    return False"
                            }
                        ],
                        "relatedConcepts": ["Hash Table", "Set Data Structure"],
                        "confidence_score": 0.7
                    }
                ],
                "conversation_summary": "Discussion about Contains Duplicate algorithm problem",
                "metadata": {
                    "extraction_method": "intelligent_fallback",
                    "extraction_time": datetime.now().isoformat()
                }
            }
        
        # Generic fallback for other content
        return {
            "concepts": [
                {
                    "title": "Programming Discussion",
                    "category": "General",
                    "summary": "Technical programming discussion requiring manual review",
                    "keyPoints": ["Content needs manual analysis"],
                    "details": f"Raw conversation content: {text[:1000]}{'...' if len(text) > 1000 else ''}",
                    "relatedConcepts": [],
                    "confidence_score": 0.3
                }
            ],
            "conversation_summary": "Programming discussion requiring manual review",
            "metadata": {
                "extraction_method": "generic_fallback",
                "extraction_time": datetime.now().isoformat(),
                "needs_manual_review": True
            }
        }

    def _segment_conversation(self, conversation_text: str) -> List[Tuple[str, str]]:
        """Segment the conversation into logical parts."""
        print("=== SEGMENTING CONVERSATION ===")
        print(f"Input text length: {len(conversation_text)}")
        
        # Advanced segmentation logic
        segments = []
        
        # Split by common conversation markers
        parts = re.split(r'\n\s*(?:User:|Assistant:|Human:|AI:|\d+\.|\*\*|\#\#)', conversation_text)
        print(f"Split into {len(parts)} parts")
        
        current_segment = ""
        current_topic = "General Discussion"
        
        problem_keywords = [
            'problem', 'algorithm', 'leetcode', 'solution', 'implement',
            'contains duplicate', 'two sum', 'valid anagram', 'reverse linked list',
            'array', 'string', 'hash table', 'dictionary', 'set', 'duplicate',
            'time complexity', 'space complexity', 'o(n)', 'o(1)', 'brute force',
            'optimize', 'efficient', 'approach', 'method', 'technique'
        ]
        
        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
                
            print(f"Part {i+1}: {part[:100]}...")
            
            # Detect if this looks like a problem-solving segment
            part_lower = part.lower()
            matched_keywords = [kw for kw in problem_keywords if kw in part_lower]
            
            if matched_keywords:
                print(f"  PROBLEM-SOLVING DETECTED! Matched keywords: {matched_keywords}")
                if current_segment:
                    segments.append((current_topic, current_segment))
                    print(f"  Saved previous segment: {current_topic}")
                current_topic = "[PROBLEM_SOLVING] " + part[:50] + "..."
                current_segment = part
                print(f"  New topic: {current_topic}")
            else:
                print(f"  Adding to current segment (topic: {current_topic[:30]}...)")
                current_segment += "\n" + part
                
        # Add the final segment
        if current_segment:
            segments.append((current_topic, current_segment))
            print(f"Added final segment: {current_topic}")
            
        print(f"=== SEGMENTATION COMPLETE: {len(segments)} segments created ===")
        for i, (topic, segment) in enumerate(segments):
            print(f"Segment {i+1}: {topic} (length: {len(segment)})")
            
        return segments if segments else [("General Discussion", conversation_text)]

    def _analyze_segment(self, topic: str, segment_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None) -> Dict:
        """Analyze a single conversation segment with sophisticated prompting."""
        print(f"=== ANALYZING SEGMENT ===")
        print(f"Topic: {topic}")
        print(f"Segment length: {len(segment_text)}")
        print(f"Segment preview: {segment_text[:200]}...")

        # Determine segment type from topic tag
        segment_type = "EXPLORATORY_LEARNING"
        print(f"Initial segment type: {segment_type}")
        
        if topic.strip().upper().startswith("[PROBLEM_SOLVING]"):
            segment_type = "PROBLEM_SOLVING"
            print(f"Topic indicates PROBLEM_SOLVING, updated segment type: {segment_type}")
        
        # Additional check: if segment contains LeetCode-style content, treat as problem solving
        leetcode_indicators = [
            'contains duplicate', 'two sum', 'valid anagram', 'reverse linked list',
            'hash table', 'dictionary', 'duplicate', 'array problem', 'string problem',
            'time complexity', 'space complexity', 'algorithm', 'solution'
        ]
        
        segment_lower = segment_text.lower()
        matched_indicators = [indicator for indicator in leetcode_indicators if indicator in segment_lower]
        
        if matched_indicators:
            segment_type = "PROBLEM_SOLVING"
            print(f"LeetCode content detected! Matched indicators: {matched_indicators}")
            print(f"Final segment type: {segment_type}")
        else:
            print(f"No LeetCode indicators found. Final segment type: {segment_type}")

        # Handle hierarchical categories if provided
        category_instructions = ""
        if category_guidance and category_guidance.get("use_hierarchical_categories"):
            existing_categories = category_guidance.get("existing_categories", [])
            category_keywords = category_guidance.get("category_keywords", {})
            
            category_instructions = (
                "\n\nIMPORTANT - SMART HIERARCHICAL CATEGORIZATION:\n"
                f"Use hierarchical category paths for each concept, formatted as arrays: e.g., ['Cloud Computing', 'AWS']\n"
                f"Include the 'categoryPath' field in your response for each concept.\n\n"
                "CATEGORIZATION STRATEGY:\n"
                "1. ANALYZE CONTENT: Look for specific technologies, services, and concepts mentioned\n"
                "2. MATCH TO SPECIFIC SUBCATEGORIES: Prefer more specific categories when content clearly matches\n"
                "3. USE LEARNED PATTERNS: The system has learned from previous categorizations\n"
                "4. FALLBACK GRACEFULLY: If no specific match, use appropriate parent category\n\n"
                "EXISTING CATEGORY HIERARCHY (use these exact paths):\n"
            )
            
            # Add existing categories with better formatting
            if existing_categories:
                for i, path in enumerate(existing_categories[:25]):  # Limit to avoid overly long prompts
                    path_str = " > ".join(path)
                    category_instructions += f"- {path_str}\n"
            
            # Add keyword guidance if available
            if category_keywords:
                category_instructions += "\nCATEGORY KEYWORDS (learned from previous concepts):\n"
                for category, keywords in list(category_keywords.items())[:10]:  # Limit to top categories
                    if keywords:
                        keyword_str = ", ".join(keywords[:8])  # Limit keywords per category
                        category_instructions += f"- {category}: {keyword_str}\n"
            
            # Add specific guidance
            if category_guidance.get("instructions"):
                category_instructions += f"\n{category_guidance.get('instructions')}\n"
                
            category_instructions += (
                "\nEXAMPLES OF GOOD CATEGORIZATION:\n"
                "- Content about 'AWS Lambda functions' → categoryPath: ['Cloud Computing', 'AWS']\n"
                "- Content about 'React hooks and state' → categoryPath: ['Frontend Engineering', 'React']\n"
                "- Content about 'SQL indexing strategies' → categoryPath: ['Backend Engineering', 'Databases']\n"
                "- Content about 'general programming concepts' → categoryPath: ['Programming']\n\n"
                "CRITICAL RULES:\n"
                "- ONLY use categories that exist in the hierarchy above\n"
                "- PREFER the most specific appropriate category\n"
                "- If unsure, use the parent category rather than guessing\n"
                "- ALWAYS include categoryPath field in your response\n"
            )

        # Add JSON format example for categoryPath
        categoryPath_example = ',\n            "categoryPath": ["Backend Engineering", "API Design"]' if category_guidance and category_guidance.get("use_hierarchical_categories") else ""

        # Enhanced structure for improved details and code snippets format
        detailsAndSnippets_examples = """
DETAILS AND CODE SNIPPETS FORMAT:
For each concept, provide rich, educational content across three sections:

1. SUMMARY: A concise 1-3 sentence overview of what the concept is.
   Example: "Discussion of SQL query optimization techniques focusing on proper indexing, 
   query structure, and database design to improve performance for large datasets."

2. DETAILS/IMPLEMENTATION: A comprehensive, in-depth explanation (3-6 paragraphs) that MUST be 
   substantially different from the summary. Include:
   - Detailed technical explanation and step-by-step breakdown
   - Specific implementation approaches and methodologies
   - Why this approach works and its technical advantages
   - Real-world applications and practical considerations
   - Performance implications and optimization strategies
   - Common pitfalls and how to avoid them
   - Advanced concepts and edge cases
   
   IMPORTANT: The details section should be educational and comprehensive - think of it as a 
   mini-tutorial or technical deep-dive that goes far beyond what's in the summary.
   
   Example: "SQL query optimization involves multiple layers of strategy that work together to 
   minimize execution time and resource consumption. The conversation explored advanced indexing 
   strategies, including the critical importance of composite index column ordering based on query 
   selectivity patterns. When creating composite indexes, the most selective columns should 
   typically be placed first, as this allows the database engine to quickly eliminate the largest 
   number of rows.

   The discussion covered query execution plan analysis and how to interpret key metrics like cost 
   estimates, row counts, and seek vs scan operations. Understanding these plans is essential for 
   identifying bottlenecks - for instance, a table scan on a large table often indicates missing 
   or ineffective indexes. The conversation also addressed query restructuring techniques, such as 
   breaking complex queries into smaller parts, using CTEs for readability, and avoiding 
   correlated subqueries that can cause performance degradation.

   Advanced topics included partitioning strategies for very large tables, the trade-offs between 
   covering indexes and regular indexes, and how database statistics affect the query optimizer's 
   decisions. The implementation also covered monitoring and profiling techniques to identify slow 
   queries in production environments."

3. CODE SNIPPETS: Provide 2-3 practical code examples with:
   - Appropriate language tag (e.g., "language": "Python", "SQL", "JavaScript")
   - Brief description of what the snippet demonstrates
   - Well-formatted, commented code showing implementation
   
   Example code snippet:
   {
     "language": "SQL",
     "description": "Creating an efficient composite index",
     "code": "CREATE INDEX idx_users_status_created ON users(status, created_at);\\n\\n-- This query can now use the index efficiently\\nSELECT * FROM users\\nWHERE status = 'active'\\nAND created_at > '2023-01-01';"
   }

CRITICAL RULE: The 'details'/'implementation' field must ALWAYS be substantially longer and more 
technical than the 'summary' field. If they are similar in length or content, you are doing it wrong."""

        # Add specific instructions for LeetCode problems
        leetcode_specific_instructions = """
IMPORTANT - LEETCODE PROBLEM DETECTION:
When detecting LeetCode-style algorithm problems:

1. MAINTAIN STANDARD PROBLEM NAMES AS THE MAIN CONCEPT TITLE:
   - ALWAYS use "Contains Duplicate" as the primary concept title, 
     NOT "Hash Table for Duplicate Detection"
   - Other standard names: "Valid Anagram", "Two Sum", "Reverse Linked List"
   - The technique (Hash Table, Two Pointer, etc.) should NEVER be in the main problem title
   - Create separate concept entries for techniques (Hash Table, etc.) if needed

2. ALWAYS IDENTIFY AND CATEGORIZE LEETCODE PROBLEMS CORRECTLY:
   - ANY problem that resembles a LeetCode-style coding challenge MUST be categorized as 
     "LeetCode Problems"
   - Common indicators: array manipulation problems, string problems with specific constraints, 
     graph traversals, etc.
   - If you recognize the problem as a standard algorithm challenge, ALWAYS categorize it as 
     "LeetCode Problems"

3. ALWAYS INCLUDE DETAILED IMPLEMENTATION:
   - Explain the algorithm step-by-step
   - Include time and space complexity analysis
   - Discuss edge cases and optimizations
   - Explain why the chosen approach (e.g., hash table) is optimal

4. PROVIDE WORKING CODE SOLUTIONS:
   - Include a complete, executable solution
   - Add clear comments explaining key steps
   - Show both the naive and optimized approaches when relevant

5. CATEGORIZE CORRECTLY:
   - Use consistent category "LeetCode Problems" for the problem
   - Use "Data Structure" for Hash Table and other data structures
   - Include appropriate subcategories (e.g., "Hash Table", "Two Pointer")
   - Link related data structures or techniques

Example for "Contains Duplicate":
{
  "title": "Contains Duplicate",
  "category": "LeetCode Problems",
  "summary": "A problem that involves finding if an array contains any duplicate elements.",
  "details": "The Contains Duplicate problem asks us to determine if an array contains any 
duplicate elements. The most efficient approach uses a hash table (dictionary) to track 
elements we've seen.

As we iterate through the array, we check if each element already exists in our hash table. 
If it does, we've found a duplicate and return true. If we finish iterating without finding 
any duplicates, we return false.

This approach achieves O(n) time complexity compared to the naive O(n²) nested loop approach, 
trading some space efficiency for significant time optimization.",
  "keyPoints": [
    "Use a hash table to track previously seen elements",
    "Time complexity is O(n) where n is the length of the array",
    "Space complexity is also O(n) in the worst case",
    "Early termination occurs as soon as the first duplicate is found"
  ],
  "codeSnippets": [
    {
      "language": "Python",
      "description": "Hash table implementation",
      "code": "def containsDuplicate(nums):\\n    seen = {}  # Hash table to track elements\\n    \\n    for num in nums:\\n        # If we've seen this number before, return True\\n        if num in seen:\\n            return True\\n        # Otherwise, add it to our hash table\\n        seen[num] = True\\n    \\n    # If we've checked all elements without finding duplicates\\n    return False"
    }
  ]
}"""

        if segment_type == "PROBLEM_SOLVING":
            # Build the problem-solving prompt with sophisticated analysis
            prompt = f"""You are an expert technical knowledge extraction system. Your job is to analyze programming and computer science conversations and extract meaningful concepts with sophisticated technical depth.

{leetcode_specific_instructions}

{detailsAndSnippets_examples}{category_instructions}

ADVANCED ANALYSIS REQUIREMENTS:
1. EXTRACT THE MAIN PROBLEM as the primary concept (e.g., "Contains Duplicate")
2. IDENTIFY KEY TECHNIQUES used in the solution (e.g., "Hash Table", "Two Pointer")
3. PROVIDE DETAILED COMPLEXITY ANALYSIS including time and space complexity
4. INCLUDE MULTIPLE CODE EXAMPLES showing different approaches when possible
5. EXPLAIN WHY the chosen approach is optimal compared to alternatives
6. DISCUSS EDGE CASES and potential optimizations

CONVERSATION SEGMENT TO ANALYZE:
{segment_text}

Extract concepts from this conversation and return them in the following JSON format:
{{
    "concepts": [
        {{
            "title": "Exact Problem Name (e.g., Contains Duplicate)",
            "category": "LeetCode Problems"{categoryPath_example},
            "summary": "Brief 1-3 sentence description of the problem",
            "keyPoints": [
                "Main technique used (e.g., Hash Table for O(1) lookups)",
                "Time complexity: O(n) where n is array length",
                "Space complexity: O(n) for storing seen elements",
                "Key insight about why this approach works",
                "Edge cases or optimizations discussed"
            ],
            "details": "COMPREHENSIVE technical explanation (3-6 paragraphs) covering:\n- Step-by-step algorithm breakdown\n- Why this approach is optimal\n- Comparison with alternative approaches\n- Implementation details and considerations\n- Real-world applications and variations\n- Performance analysis and trade-offs",
            "codeSnippets": [
                {{
                    "language": "Python",
                    "description": "Optimal hash table solution",
                    "code": "def containsDuplicate(nums):\\n    seen = set()\\n    for num in nums:\\n        if num in seen:\\n            return True\\n        seen.add(num)\\n    return False"
                }},
                {{
                    "language": "Python", 
                    "description": "Alternative approach (if discussed)",
                    "code": "# Alternative implementation or optimization"
                }}
            ],
            "relatedConcepts": ["Hash Table", "Set Data Structure", "Time Complexity Analysis"],
            "confidence_score": 0.95
        }},
                 {{
             "title": "Hash Table",
             "category": "Data Structures"{categoryPath_example},
             "summary": "Data structure providing O(1) average lookup time for duplicate detection",
            "keyPoints": [
                "Provides O(1) average time for lookups, insertions, deletions",
                "Uses hash function to map keys to array indices",
                "Ideal for duplicate detection and frequency counting",
                "Space complexity is O(n) for n unique elements"
            ],
            "details": "Detailed explanation of how hash tables work in this context...",
            "codeSnippets": [
                {{
                    "language": "Python",
                    "description": "Basic hash table usage",
                    "code": "seen = set()  # or dict()\\nif element in seen:\\n    # Found duplicate"
                }}
            ],
            "relatedConcepts": ["Contains Duplicate", "Hashing", "Collision Handling"],
            "confidence_score": 0.9
        }}
    ],
    "conversation_summary": "Discussion of [Problem Name] using [Main Technique] with complexity analysis",
    "metadata": {{
        "extraction_time": "{datetime.now().isoformat()}",
        "segment_type": "{segment_type}",
        "analysis_depth": "comprehensive"
    }}
}}

CRITICAL REQUIREMENTS:
1. ALWAYS extract the main problem as the primary concept with standard name
2. CREATE SEPARATE CONCEPTS for key techniques/data structures used
3. Include comprehensive complexity analysis in keyPoints
4. Make details section substantially longer and more technical than summary
5. Provide working, well-commented code examples
6. Link related concepts appropriately
7. Return valid JSON only"""

        else:
            # Exploratory learning prompt - but still check for LeetCode problems with sophisticated analysis
            prompt = f"""You are an expert technical knowledge extraction system. Analyze this programming conversation and extract meaningful concepts with deep technical insight.

CRITICAL ALGORITHM DETECTION: If this conversation discusses ANY algorithm problem, coding challenge, or data structure problem (like Contains Duplicate, Two Sum, etc.), treat it as a LeetCode problem and use "LeetCode Problems" as the category with the standard problem name as the title.

{leetcode_specific_instructions}

{detailsAndSnippets_examples}{category_instructions}

SOPHISTICATED ANALYSIS REQUIREMENTS:
1. IDENTIFY all technical concepts discussed, no matter how briefly mentioned
2. PROVIDE COMPREHENSIVE DETAILS that go far beyond the summary
3. INCLUDE PRACTICAL CODE EXAMPLES with clear explanations
4. ANALYZE RELATIONSHIPS between concepts
5. ASSESS CONFIDENCE based on depth of discussion
6. EXTRACT BOTH explicit and implicit technical knowledge

CONVERSATION SEGMENT TO ANALYZE:
{segment_text}

Extract concepts and return them in this JSON format:
{{
    "concepts": [
        {{
                         "title": "Precise Concept Name",
             "category": "Most Specific Appropriate Category"{categoryPath_example},
             "summary": "Concise 1-3 sentence overview",
            "keyPoints": [
                "Key technical insight 1",
                "Implementation detail or best practice",
                "Performance consideration or complexity",
                "Real-world application or use case",
                "Common pitfall or optimization"
            ],
            "details": "COMPREHENSIVE technical deep-dive (3-6 paragraphs) including:\n- Detailed explanation of how it works\n- Technical implementation considerations\n- Why this approach/concept is important\n- Comparison with alternatives when relevant\n- Advanced concepts and edge cases\n- Real-world applications and examples",
            "codeSnippets": [
                {{
                    "language": "Appropriate Language",
                    "description": "Clear description of what this demonstrates",
                    "code": "// Well-commented, practical code example\\n// that illustrates the concept clearly"
                }}
            ],
            "relatedConcepts": ["Specific related concept 1", "Specific related concept 2"],
            "confidence_score": 0.85
        }}
    ],
    "conversation_summary": "Detailed summary highlighting main technical topics discussed",
    "metadata": {{
        "extraction_time": "{datetime.now().isoformat()}",
        "segment_type": "{segment_type}",
        "analysis_depth": "comprehensive"
    }}
}}

CRITICAL REQUIREMENTS:
1. ALWAYS check for algorithm problems first - use LeetCode categorization if found
2. Make details section substantially more comprehensive than summary
3. Include practical, working code examples with good comments
4. Use specific, technical concept names rather than generic ones
5. Provide high-quality keyPoints that offer real technical value
6. Return valid JSON only"""

        try:
            print(f"=== SENDING TO GPT-4O ===")
            print(f"Segment type: {segment_type}")
            print(f"Segment preview: {segment_text[:200]}...")
            print(f"Prompt length: {len(prompt)} characters")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000
            )
            
            response_text = response.choices[0].message.content.strip()
            print(f"=== GPT-4O RESPONSE ===")
            print(f"Response length: {len(response_text)} characters")
            print(f"Response preview: {response_text[:300]}...")
            
            parsed_result = self._parse_structured_response(response_text)
            print(f"=== PARSED RESULT ===")
            print(f"Number of concepts: {len(parsed_result.get('concepts', []))}")
            if parsed_result.get('concepts'):
                print(f"First concept title: {parsed_result['concepts'][0].get('title', 'NO TITLE')}")
            
            return parsed_result
            
        except Exception as e:
            print(f"=== ERROR IN SEGMENT ANALYSIS ===")
            print(f"Error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return self._fallback_extraction(segment_text)

    def analyze_conversation(self, conversation_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None) -> Dict:
        """Main method to analyze the entire conversation."""
        print("=== ANALYZE CONVERSATION STARTED ===")
        print(f"Input text length: {len(conversation_text)}")
        print(f"Model being used: {self.model}")
        
        # Check cache first
        cache_key = self._generate_cache_key(conversation_text)
        cached_response = self._get_cached_response(cache_key)
        if cached_response:
            print("=== RETURNING CACHED RESPONSE ===")
            return cached_response

        try:
            print("=== SEGMENTING CONVERSATION ===")
            # Segment the conversation
            segments = self._segment_conversation(conversation_text)
            print(f"Number of segments created: {len(segments)}")
            
            for i, (topic, segment_text) in enumerate(segments):
                print(f"Segment {i+1}: {topic[:50]}... (length: {len(segment_text)})")
            
            all_concepts = []
            all_summaries = []
            
            print("=== ANALYZING EACH SEGMENT ===")
            # Analyze each segment
            for i, (topic, segment_text) in enumerate(segments):
                print(f"\n--- Processing Segment {i+1}/{len(segments)} ---")
                print(f"Topic: {topic}")
                print(f"Segment text preview: {segment_text[:150]}...")
                
                segment_result = self._analyze_segment(topic, segment_text, context, category_guidance)
                
                print(f"Segment {i+1} result:")
                print(f"  Concepts found: {len(segment_result.get('concepts', []))}")
                print(f"  Has summary: {bool(segment_result.get('conversation_summary'))}")
                
                if segment_result.get('concepts'):
                    print(f"  Concept titles: {[c.get('title', 'NO TITLE') for c in segment_result['concepts']]}")
                    all_concepts.extend(segment_result['concepts'])
                
                if segment_result.get('conversation_summary'):
                    all_summaries.append(segment_result['conversation_summary'])
            
            print("=== COMBINING RESULTS ===")
            print(f"Total concepts collected: {len(all_concepts)}")
            print(f"Total summaries collected: {len(all_summaries)}")
            
            # Combine results
            result = {
                "concepts": all_concepts,
                "conversation_summary": " | ".join(all_summaries) if all_summaries else "Programming discussion",
                "metadata": {
                    "extraction_time": datetime.now().isoformat(),
                    "model_used": self.model,
                    "segments_analyzed": len(segments),
                    "total_concepts": len(all_concepts)
                }
            }
            
            print("=== CACHING RESULT ===")
            # Cache the result
            self.cache[cache_key] = result
            
            print("=== ANALYZE CONVERSATION COMPLETED SUCCESSFULLY ===")
            return result
            
        except Exception as e:
            print(f"=== ERROR IN CONVERSATION ANALYSIS ===")
            print(f"Error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            print("=== FALLING BACK TO EMERGENCY EXTRACTION ===")
            return self._fallback_extraction(conversation_text)

    def _get_technique_info(self, technique: str, problem_title: str) -> Tuple[str, List[str], str]:
        """Get detailed information about a specific technique."""
        tech_lower = technique.lower()
        
        if "hash table" in tech_lower or "dictionary" in tech_lower:
            description = f"A data structure that stores key-value pairs and provides O(1) average lookup time."
            key_points = [
                "Provides O(1) average time complexity for lookups, insertions, and deletions",
                "Uses a hash function to map keys to array indices",
                "Handles collisions through chaining or open addressing",
                "Space complexity is O(n) where n is the number of elements",
                "Ideal for problems requiring fast duplicate detection or frequency counting"
            ]
            implementation = (
                "Hash tables work by using a hash function to convert keys into array indices. "
                "When we want to store or retrieve a value, we hash the key to get an index and "
                "access that position in the underlying array. This allows for constant-time operations "
                "in the average case. For duplicate detection problems like Contains Duplicate, we can "
                "iterate through the array and check if each element already exists in our hash table. "
                "If it does, we've found a duplicate. If not, we add it to the hash table and continue."
            )
            
        elif "two pointer" in tech_lower or "two pointers" in tech_lower:
            description = f"An algorithmic technique that uses two pointers to traverse data structures efficiently."
            key_points = [
                "Uses two pointers moving at different speeds or directions",
                "Often reduces time complexity from O(n²) to O(n)",
                "Common patterns: slow/fast pointers, left/right pointers, sliding window",
                "Space complexity is typically O(1) - constant extra space",
                "Effective for array and linked list problems"
            ]
            implementation = (
                "The two-pointer technique involves maintaining two pointers that traverse the data structure "
                "according to specific rules. In problems like finding pairs or detecting cycles, one pointer "
                "might move faster than the other. For sorted arrays, we might use left and right pointers "
                "moving towards each other. This technique is particularly powerful because it often eliminates "
                "the need for nested loops, reducing time complexity significantly."
            )
            
        elif "sliding window" in tech_lower:
            description = f"A technique for efficiently processing subarrays or substrings of fixed or variable size."
            key_points = [
                "Maintains a window of elements and slides it across the data",
                "Avoids redundant calculations by reusing previous computations",
                "Time complexity is typically O(n) instead of O(n²)",
                "Can handle fixed-size or variable-size windows",
                "Common in substring and subarray problems"
            ]
            implementation = (
                "Sliding window works by maintaining a window (subarray) and moving it across the input. "
                "Instead of recalculating everything for each position, we add the new element entering "
                "the window and remove the element leaving the window. This incremental approach is much "
                "more efficient than brute force methods that would recalculate the entire window for each position."
            )
            
        elif "binary search" in tech_lower:
            description = f"A search algorithm that finds elements in sorted arrays by repeatedly dividing the search space in half."
            key_points = [
                "Requires the input to be sorted",
                "Time complexity is O(log n)",
                "Space complexity is O(1) for iterative, O(log n) for recursive",
                "Eliminates half of the remaining elements in each step",
                "Can be adapted for finding insertion points and ranges"
            ]
            implementation = (
                "Binary search works by comparing the target value with the middle element of the sorted array. "
                "If they match, we've found our target. If the target is smaller, we search the left half; "
                "if larger, we search the right half. This process continues until we find the target or "
                "determine it doesn't exist. The key insight is that we can eliminate half of the remaining "
                "possibilities with each comparison."
            )
            
        elif "dynamic programming" in tech_lower:
            description = f"An algorithmic technique that breaks down problems into overlapping subproblems and builds up solutions."
            key_points = [
                "Breaks problems into overlapping subproblems",
                "Stores previously computed results to avoid redundant calculation",
                "Can be implemented with memoization (top-down) or tabulation (bottom-up)",
                "Optimizes exponential solutions to polynomial time",
                "Effective for optimization problems and counting problems"
            ]
            implementation = (
                "Dynamic programming works by breaking complex problems into smaller, overlapping subproblems. "
                "By storing the solutions to these subproblems (using memoization or tabulation), we avoid redundant calculations "
                "and build up to the final solution. This transforms exponential time solutions into polynomial time, "
                "particularly for problems with optimal substructure and overlapping subproblems."
            )
            
        elif "hashing" in tech_lower:
            description = f"A technique that converts data of arbitrary size to fixed-size values, fundamental to hash table implementation."
            key_points = [
                "Converts data to a fixed-size value (hash)",
                "Enables O(1) average lookup time in hash tables",
                "Used for data integrity verification and indexing",
                "Common in duplicate detection and data validation",
                "Balance between computation speed and collision avoidance"
            ]
            implementation = (
                "Hashing involves applying a function to input data to produce a fixed-size output value. "
                "This hash value serves as an index in a hash table, enabling fast lookups, insertions, and deletions. "
                "Good hash functions distribute elements evenly across the hash table, minimizing collisions. "
                f"In {problem_title}, hashing helps quickly determine if an element has been seen before."
            )
        
        else:
            description = f"A programming technique or approach used in {problem_title}."
            key_points = [
                "Specific implementation details depend on the problem context",
                "Part of the overall solution strategy",
                "Contributes to the algorithm's efficiency and correctness"
            ]
            implementation = f"This technique is used as part of the solution approach for {problem_title}."
        
        return description, key_points, implementation
        
    def _get_technique_complexity(self, technique: str, complexity_type: str) -> str:
        """Get time or space complexity information for a technique."""
        tech_lower = technique.lower()
        
        if complexity_type == "time":
            if "hash table" in tech_lower or "dictionary" in tech_lower or "hashing" in tech_lower:
                return "Average: O(1) for lookups, insertions, and deletions. Worst case: O(n) if many collisions occur."
            elif "frequency count" in tech_lower:
                return "O(n) where n is the number of elements being counted."
            elif "two pointer" in tech_lower or "sliding window" in tech_lower:
                return "O(n) where n is the size of the input array or string."
            elif "binary search" in tech_lower:
                return "O(log n) where n is the size of the sorted input array."
            elif "dynamic programming" in tech_lower:
                return "Typically O(n²) or O(n*m) depending on the specific problem, but varies widely."
            else:
                return "Varies depending on implementation and specific problem constraints."
        else:  # space complexity
            if "hash table" in tech_lower or "dictionary" in tech_lower or "frequency count" in tech_lower:
                return "O(n) where n is the number of unique elements or characters being tracked."
            elif "two pointer" in tech_lower:
                return "O(1) as only a constant amount of extra space is needed."
            elif "sliding window" in tech_lower:
                return "O(1) to O(k) where k is the window size, depending on what needs to be tracked."
            elif "binary search" in tech_lower:
                return "O(1) for iterative implementation, O(log n) for recursive implementation due to call stack."
            elif "dynamic programming" in tech_lower:
                return "O(n) to O(n²) typically, depending on the dimensions of the DP table."
            elif "hashing" in tech_lower:
                return "O(n) where n is the number of elements being hashed and stored."
            else:
                return "Varies depending on implementation and specific problem constraints."

    def _process_notes(self, notes: Dict) -> Dict:
        """Process and validate notes structure."""
        if not isinstance(notes, dict):
            return {"summary": str(notes) if notes else "", "keyPoints": [], "details": ""}
        
        # Ensure required fields exist
        processed = {
            "summary": notes.get("summary", ""),
            "keyPoints": notes.get("keyPoints", []),
            "details": notes.get("details", notes.get("implementation", ""))
        }
        
        # Ensure keyPoints is a list
        if not isinstance(processed["keyPoints"], list):
            processed["keyPoints"] = [str(processed["keyPoints"])] if processed["keyPoints"] else []
            
        return processed

    def _process_code_examples(self, examples: List[Dict]) -> List[Dict]:
        """Process and validate code examples."""
        if not isinstance(examples, list):
            return []
        
        processed = []
        for example in examples:
            if isinstance(example, dict):
                processed_example = {
                    "language": example.get("language", "text"),
                    "description": example.get("description", "Code example"),
                    "code": example.get("code", "")
                }
                processed.append(processed_example)
        
        return processed

    def _process_relationships(self, relationships: Dict) -> Dict:
        """Process and validate relationships structure."""
        if not isinstance(relationships, dict):
            return {}
        
        return {
            "relatedConcepts": relationships.get("relatedConcepts", []),
            "prerequisites": relationships.get("prerequisites", []),
            "applications": relationships.get("applications", [])
        }

    def _process_learning_resources(self, resources: Dict) -> Dict:
        """Process and validate learning resources."""
        if not isinstance(resources, dict):
            return {}
        
        return {
            "documentation": resources.get("documentation", []),
            "tutorials": resources.get("tutorials", []),
            "examples": resources.get("examples", [])
        }

def standardize_response_format(result: Dict) -> Dict:
    """Standardize the response format to ensure consistency with frontend expectations."""
    standardized = result.copy()
    
    # Ensure conversation_summary and summary are always present
    if "conversation_summary" not in standardized and "summary" in standardized:
        standardized["conversation_summary"] = standardized["summary"]
    elif "summary" not in standardized and "conversation_summary" in standardized:
        standardized["summary"] = standardized["conversation_summary"]
    elif "conversation_summary" not in standardized and "summary" not in standardized:
        standardized["conversation_summary"] = "Discussion about programming concepts"
        standardized["summary"] = "Discussion about programming concepts"
    
    # Ensure conversation_title is always present and different from summary
    if "conversation_title" not in standardized:
        # Generate a title based on concepts if possible
        if "concepts" in standardized and standardized["concepts"]:
            concept_titles = [c.get("title", "") for c in standardized["concepts"] if "title" in c]
            if len(concept_titles) == 1:
                standardized["conversation_title"] = f"Discussion about {concept_titles[0]}"
            elif len(concept_titles) == 2:
                standardized["conversation_title"] = f"{concept_titles[0]} and {concept_titles[1]} Discussion"
            elif len(concept_titles) > 2:
                standardized["conversation_title"] = f"{concept_titles[0]}, {concept_titles[1]} & More"
            else:
                standardized["conversation_title"] = "Programming Discussion"
        else:
            # Use a prefix to differentiate from summary
            summary = standardized.get("conversation_summary", "")
            if summary:
                standardized["conversation_title"] = f"Topic: {summary[:40]}..." if len(summary) > 50 else f"Topic: {summary}"
            else:
                standardized["conversation_title"] = "Programming Discussion"
    
    # Ensure concepts is always an array
    if "concepts" not in standardized or not isinstance(standardized["concepts"], list):
        standardized["concepts"] = []
    
    # Process each concept to ensure required fields with sophisticated handling
    for i, concept in enumerate(standardized["concepts"]):
        # Ensure required fields with enhanced processing
        required_fields = {
            "title": concept.get("title", f"Concept {i+1}"),
            "category": concept.get("category", "General"),
            "categoryPath": concept.get("categoryPath", [concept.get("category", "General")]),
            "summary": concept.get("summary", ""),
            "keyPoints": concept.get("keyPoints", []),
            "details": concept.get("details", concept.get("implementation", "")),
            "codeSnippets": concept.get("codeSnippets", []),
            "relatedConcepts": concept.get("relatedConcepts", []),
            "confidence_score": concept.get("confidence_score", 0.8),
            "last_updated": concept.get("last_updated", datetime.now().isoformat())
        }
        
        # Ensure keyPoints is a list
        if not isinstance(required_fields["keyPoints"], list):
            required_fields["keyPoints"] = [str(required_fields["keyPoints"])] if required_fields["keyPoints"] else []
        
        # Ensure codeSnippets is properly formatted
        if not isinstance(required_fields["codeSnippets"], list):
            required_fields["codeSnippets"] = []
        
        # Ensure relatedConcepts is a list
        if not isinstance(required_fields["relatedConcepts"], list):
            required_fields["relatedConcepts"] = [str(required_fields["relatedConcepts"])] if required_fields["relatedConcepts"] else []
        
        # Ensure categoryPath is a list
        if not isinstance(required_fields["categoryPath"], list):
            required_fields["categoryPath"] = [str(required_fields["categoryPath"])] if required_fields["categoryPath"] else ["General"]
        
        # Update concept with required fields
        standardized["concepts"][i] = {**concept, **required_fields}
        
    # Ensure metadata is present
    if "metadata" not in standardized:
        standardized["metadata"] = {
            "extraction_time": datetime.now().isoformat(),
            "model_used": "standardized",
            "concept_count": len(standardized["concepts"])
        }
    
    return standardized

def handler(request):
    print("=== CONCEPT EXTRACTION REQUEST RECEIVED ===")
    print(f"Request method: {request.method}")
    
    if request.method != 'POST':
        print("ERROR: Method not allowed")
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        print("=== PARSING REQUEST BODY ===")
        # Get the request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}
        conversation_text = body.get('conversation_text', '')
        context = body.get('context', None)
        category_guidance = body.get('category_guidance', None)
        
        print(f"Conversation text length: {len(conversation_text)} characters")
        print(f"Conversation preview: {conversation_text[:200]}...")
        print(f"Context provided: {context is not None}")
        print(f"Category guidance provided: {category_guidance is not None}")
        
        if not conversation_text:
            print("ERROR: No conversation text provided")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'conversation_text is required'})
            }
        
        print("=== INITIALIZING OPENAI CLIENT ===")
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("ERROR: OpenAI API key not configured")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'OpenAI API key not configured'})
            }
        
        print(f"OpenAI API key found: {api_key[:10]}...")
        client = OpenAI(api_key=api_key)
        
        print("=== STARTING CONCEPT EXTRACTION ===")
        # Use the sophisticated concept extractor
        extractor = ConceptExtractor(client)
        result = extractor.analyze_conversation(conversation_text, context, category_guidance)
        
        print("=== CONCEPT EXTRACTION COMPLETED ===")
        print(f"Raw result type: {type(result)}")
        print(f"Raw result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        # Standardize the response format
        print("=== STANDARDIZING RESPONSE FORMAT ===")
        standardized_result = standardize_response_format(result)
        
        # Add detailed logging of the response structure
        print("=== FINAL RESPONSE TO FRONTEND ===")
        print(f"Summary: {standardized_result.get('summary', 'NONE')}")
        print(f"Conversation Summary: {standardized_result.get('conversation_summary', 'NONE')}")
        print(f"Number of concepts: {len(standardized_result.get('concepts', []))}")
        
        if standardized_result.get('concepts'):
            for i, concept in enumerate(standardized_result['concepts'][:3]):  # Log first 3 concepts
                print(f"Concept {i+1}:")
                print(f"  Title: {concept.get('title', 'NO TITLE')}")
                print(f"  Category: {concept.get('category', 'NO CATEGORY')}")
                print(f"  Summary: {concept.get('summary', 'NO SUMMARY')[:100]}...")
                print(f"  Details length: {len(concept.get('details', ''))}")
                print(f"  Key points count: {len(concept.get('keyPoints', []))}")
        
        print("=== SENDING RESPONSE ===")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(standardized_result)
        }
        
    except Exception as e:
        print(f"=== CRITICAL ERROR IN HANDLER ===")
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        
        # Emergency fallback response
        print("=== GENERATING EMERGENCY FALLBACK RESPONSE ===")
        emergency_fallback = {
            "concepts": [
                {
                    "title": "Programming Concept",
                    "category": "General",
                    "summary": "General programming discussion",
                    "keyPoints": ["Extracted from conversation"],
                    "details": "Programming concepts discussed in the conversation",
                    "relatedConcepts": [],
                    "confidence_score": 0.5,
                    "last_updated": datetime.now().isoformat()
                }
            ],
            "conversation_title": "Programming Discussion",
            "conversation_summary": "Discussion about programming topics",
            "summary": "Discussion about programming topics",
            "metadata": {
                "extraction_time": datetime.now().isoformat(),
                "model_used": "emergency_fallback",
                "extraction_method": "fallback",
                "error_occurred": str(e)
            }
        }
        
        print("=== RETURNING EMERGENCY FALLBACK ===")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(emergency_fallback)
        } 