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
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # Fallback parsing if no JSON found
                return self._fallback_extraction(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            return self._fallback_extraction(response_text)

    def _fallback_extraction(self, text: str) -> Dict:
        """Fallback extraction method when structured parsing fails."""
        # Simple fallback that creates a basic concept
        return {
            "concepts": [
                {
                    "title": "Programming Concept",
                    "category": "General",
                    "summary": "Programming concepts discussed in the conversation",
                    "keyPoints": ["Extracted from conversation"],
                    "details": text[:500] + "..." if len(text) > 500 else text,
                    "relatedConcepts": [],
                    "confidence_score": 0.5
                }
            ],
            "conversation_summary": "Discussion about programming topics",
            "metadata": {
                "extraction_method": "fallback",
                "extraction_time": datetime.now().isoformat()
            }
        }

    def _segment_conversation(self, conversation_text: str) -> List[Tuple[str, str]]:
        """Segment the conversation into logical parts."""
        # Advanced segmentation logic
        segments = []
        
        # Split by common conversation markers
        parts = re.split(r'\n\s*(?:User:|Assistant:|Human:|AI:|\d+\.|\*\*|\#\#)', conversation_text)
        
        current_segment = ""
        current_topic = "General Discussion"
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            # Detect if this looks like a problem-solving segment
            if any(keyword in part.lower() for keyword in ['problem', 'algorithm', 'leetcode', 'solution', 'implement']):
                if current_segment:
                    segments.append((current_topic, current_segment))
                current_topic = "[PROBLEM_SOLVING] " + part[:50] + "..."
                current_segment = part
            else:
                current_segment += "\n" + part
                
        # Add the final segment
        if current_segment:
            segments.append((current_topic, current_segment))
            
        return segments if segments else [("General Discussion", conversation_text)]

    def _analyze_segment(self, topic: str, segment_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None) -> Dict:
        """Analyze a single conversation segment with sophisticated prompting."""
        print(f"Analyzing segment: {topic[:50]}...")

        # Determine segment type from topic tag
        segment_type = "EXPLORATORY_LEARNING"
        if topic.strip().upper().startswith("[PROBLEM_SOLVING]"):
            segment_type = "PROBLEM_SOLVING"

        # Enhanced structure for improved details and code snippets format
        detailsAndSnippets_examples = """
DETAILS AND CODE SNIPPETS FORMAT:
For each concept, provide rich, educational content across three sections:

1. SUMMARY: A concise 1-3 sentence overview of what the concept is.

2. DETAILS/IMPLEMENTATION: A comprehensive, in-depth explanation (3-6 paragraphs) that MUST be 
   substantially different from the summary. Include:
   - Detailed technical explanation and step-by-step breakdown
   - Specific implementation approaches and methodologies
   - Why this approach works and its technical advantages
   - Real-world applications and practical considerations
   - Performance implications and optimization strategies
   - Common pitfalls and how to avoid them
   - Advanced concepts and edge cases

3. CODE SNIPPETS: Provide 2-3 practical code examples with:
   - Appropriate language tag (e.g., "language": "Python", "SQL", "JavaScript")
   - Brief description of what the snippet demonstrates
   - Well-formatted, commented code showing implementation

CRITICAL RULE: The 'details'/'implementation' field must ALWAYS be substantially longer and more 
technical than the 'summary' field."""

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
   - Link related data structures or techniques"""

        if segment_type == "PROBLEM_SOLVING":
            # Build the problem-solving prompt
            prompt = f"""You are an expert technical knowledge extraction system. Your job is to analyze programming and computer science conversations and extract meaningful concepts.

{leetcode_specific_instructions}

{detailsAndSnippets_examples}

CONVERSATION SEGMENT TO ANALYZE:
{segment_text}

Extract concepts from this conversation and return them in the following JSON format:
{{
    "concepts": [
        {{
            "title": "Exact Problem Name (e.g., Contains Duplicate)",
            "category": "LeetCode Problems",
            "summary": "Brief 1-3 sentence description",
            "keyPoints": ["Key insight 1", "Key insight 2", "Key insight 3"],
            "details": "Comprehensive technical explanation (much longer than summary)",
            "codeSnippets": [
                {{
                    "language": "Python",
                    "description": "Main solution approach",
                    "code": "def solution():\\n    # Implementation here"
                }}
            ],
            "relatedConcepts": ["Hash Table", "Time Complexity"],
            "confidence_score": 0.9
        }}
    ],
    "conversation_summary": "Brief summary of what was discussed",
    "metadata": {{
        "extraction_time": "{datetime.now().isoformat()}",
        "segment_type": "{segment_type}"
    }}
}}

CRITICAL REQUIREMENTS:
1. For LeetCode problems, use the standard problem name as the title
2. Always categorize algorithm problems as "LeetCode Problems"
3. Include working code solutions with proper formatting
4. Make details section much more comprehensive than summary
5. Include time/space complexity analysis in keyPoints
6. Return valid JSON only"""

        else:
            # Exploratory learning prompt
            prompt = f"""You are an expert technical knowledge extraction system. Analyze this programming conversation and extract meaningful concepts.

{detailsAndSnippets_examples}

CONVERSATION SEGMENT TO ANALYZE:
{segment_text}

Extract concepts and return them in this JSON format:
{{
    "concepts": [
        {{
            "title": "Concept Name",
            "category": "Appropriate Category",
            "summary": "Brief 1-3 sentence description",
            "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
            "details": "Comprehensive technical explanation (much longer than summary)",
            "codeSnippets": [
                {{
                    "language": "Language",
                    "description": "What this code demonstrates",
                    "code": "// Code example here"
                }}
            ],
            "relatedConcepts": ["Related concept 1", "Related concept 2"],
            "confidence_score": 0.8
        }}
    ],
    "conversation_summary": "Brief summary of the discussion",
    "metadata": {{
        "extraction_time": "{datetime.now().isoformat()}",
        "segment_type": "{segment_type}"
    }}
}}

Return valid JSON only."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000
            )
            
            response_text = response.choices[0].message.content.strip()
            return self._parse_structured_response(response_text)
            
        except Exception as e:
            print(f"Error in segment analysis: {str(e)}")
            return self._fallback_extraction(segment_text)

    def analyze_conversation(self, conversation_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None) -> Dict:
        """Main method to analyze the entire conversation."""
        # Check cache first
        cache_key = self._generate_cache_key(conversation_text)
        cached_response = self._get_cached_response(cache_key)
        if cached_response:
            print("Returning cached response")
            return cached_response

        try:
            # Segment the conversation
            segments = self._segment_conversation(conversation_text)
            
            all_concepts = []
            all_summaries = []
            
            # Analyze each segment
            for topic, segment_text in segments:
                segment_result = self._analyze_segment(topic, segment_text, context, category_guidance)
                
                if segment_result.get('concepts'):
                    all_concepts.extend(segment_result['concepts'])
                
                if segment_result.get('conversation_summary'):
                    all_summaries.append(segment_result['conversation_summary'])
            
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
            
            # Cache the result
            self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            print(f"Error in conversation analysis: {str(e)}")
            return self._fallback_extraction(conversation_text)

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
    
    # Process each concept to ensure required fields
    for i, concept in enumerate(standardized["concepts"]):
        # Ensure required fields
        required_fields = {
            "title": concept.get("title", f"Concept {i+1}"),
            "category": concept.get("category", "General"),
            "summary": concept.get("summary", ""),
            "keyPoints": concept.get("keyPoints", []),
            "details": concept.get("details", concept.get("implementation", "")),
            "relatedConcepts": concept.get("relatedConcepts", []),
            "confidence_score": concept.get("confidence_score", 0.8),
        }
        
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
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Get the request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}
        conversation_text = body.get('conversation_text', '')
        context = body.get('context', None)
        category_guidance = body.get('category_guidance', None)
        
        if not conversation_text:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'conversation_text is required'})
            }
        
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'OpenAI API key not configured'})
            }
        
        client = OpenAI(api_key=api_key)
        
        # Use the sophisticated concept extractor
        extractor = ConceptExtractor(client)
        result = extractor.analyze_conversation(conversation_text, context, category_guidance)
        
        # Standardize the response format
        standardized_result = standardize_response_format(result)
        
        # Add detailed logging of the response structure
        print("=== RESPONSE TO FRONTEND ===")
        print(f"Summary: {standardized_result.get('summary', 'NONE')}")
        print(f"Conversation Summary: {standardized_result.get('conversation_summary', 'NONE')}")
        print(f"Number of concepts: {len(standardized_result.get('concepts', []))}")
        
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
        print(f"Error: {str(e)}")
        # Emergency fallback response
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
                "extraction_method": "fallback"
            }
        }
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