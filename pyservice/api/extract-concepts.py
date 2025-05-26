from http.server import BaseHTTPRequestHandler
import json
import os
import re
from typing import Dict, List, Optional, Tuple
from openai import OpenAI
from datetime import datetime
import hashlib
from functools import lru_cache
import asyncio
import httpx

# Get API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

class ConceptExtractor:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model = "gpt-4o"
        self.max_retries = 3
        self.retry_delay = 1
        self.cache = {}

    def _generate_cache_key(self, text: str) -> str:
        """Generate a cache key for the conversation text."""
        return hashlib.md5(text.encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available."""
        return self.cache.get(cache_key)

    async def _fetch_categories(self) -> List[str]:
        """Fetch the list of categories from the Next.js API endpoint. Fallback to default if fails."""
        default_categories = [
            "Data Structures and Algorithms",
            "Backend Engineering",
            "Frontend Engineering", 
            "Cloud Engineering",
            "DevOps",
            "JavaScript",
            "TypeScript",
            "Python",
            "System Design",
            "Machine Learning",
            "General"
        ]
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://your-app-domain.vercel.app/api/categories")
                if resp.status_code == 200:
                    data = resp.json()
                    categories = data.get("categories", [])
                    if categories:
                        return categories
        except Exception as e:
            print(f"Failed to fetch categories from API: {e}")
        return default_categories

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
            "dsa": "Data Structures and Algorithms",
            "data structure": "Data Structures", 
            "algorithm": "Algorithms",
            "backend": "Backend Engineering",
            "api": "Backend Engineering",
            "frontend": "Frontend Engineering",
            "react": "Frontend Engineering",
            "cloud": "Cloud Engineering",
            "aws": "Cloud Engineering",
            "devops": "DevOps",
            "js": "JavaScript",
            "typescript": "TypeScript",
            "python": "Python",
            "system": "System Design",
            "ml": "Machine Learning",
            "ai": "Machine Learning"
        }
        
        for key, value in category_mapping.items():
            if key in suggested_lower and value in valid_categories:
                return value
                
        return "General"

    async def analyze_conversation(self, conversation_text: str, custom_api_key: Optional[str] = None) -> Dict:
        """Main method to analyze conversation and extract concepts."""
        
        # Use custom API key if provided
        client = OpenAI(api_key=custom_api_key) if custom_api_key else self.client
        
        try:
            # Get existing categories
            categories = await self._fetch_categories()
            
            # Segment conversation
            segments = await self._segment_conversation(conversation_text, client)
            
            # Extract concepts from each segment
            all_concepts = []
            for segment in segments:
                concepts = await self._analyze_segment(
                    segment["topic"], 
                    segment["content"], 
                    categories,
                    client
                )
                all_concepts.extend(concepts)
            
            # Generate summary
            summary = await self._generate_summary(conversation_text, client)
            
            # Deduplicate and enhance concepts
            final_concepts = self._deduplicate_concepts(all_concepts)
            
            return {
                "concepts": final_concepts,
                "conversation_summary": summary,
                "metadata": {
                    "segments_analyzed": len(segments),
                    "total_concepts": len(final_concepts),
                    "extraction_timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as error:
            print(f"Error in concept extraction: {error}")
            return {
                "concepts": self._generate_fallback_concepts(conversation_text),
                "conversation_summary": "Discussion about programming concepts",
                "metadata": {
                    "error": str(error),
                    "fallback_used": True
                }
            }

    async def _segment_conversation(self, conversation_text: str, client) -> List[Dict]:
        """Break conversation into segments."""
        prompt = f"""
Analyze this conversation and break it down into distinct technical topics or concepts being discussed.
For each topic, provide a brief title and the relevant text content.

Conversation:
{conversation_text}

Please respond with a JSON array of objects with this format:
[
  {{
    "topic": "Brief topic title",
    "content": "Relevant text content for this topic"
  }}
]

Focus on technical concepts, programming topics, algorithms, tools, or methodologies discussed.
"""

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            if not content:
                raise Exception("No response content")
                
            segments = json.loads(content)
            return segments if isinstance(segments, list) else [{"topic": "General Discussion", "content": conversation_text}]
            
        except Exception as error:
            print(f"Error segmenting conversation: {error}")
            return [{"topic": "General Discussion", "content": conversation_text}]

    async def _analyze_segment(self, topic: str, content: str, categories: List[str], client) -> List[Dict]:
        """Analyze a conversation segment and extract concepts."""
        prompt = f"""
You are an expert technical concept extractor. Analyze this conversation segment and extract key programming/technical concepts.

Topic: {topic}
Content: {content}

Available Categories: {', '.join(categories)}

For each concept found, provide a detailed JSON object with this exact structure:
{{
  "title": "Clear, specific concept name",
  "category": "Most appropriate category from the available list",
  "summary": "2-3 sentence summary of the concept",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "details": {{
    "implementation": "How this concept is implemented or used",
    "complexity": {{
      "time": "Time complexity (if applicable)",
      "space": "Space complexity (if applicable)"
    }},
    "useCases": ["Use case 1", "Use case 2"],
    "edgeCases": ["Edge case 1", "Edge case 2"],
    "performance": "Performance considerations",
    "interviewQuestions": ["Common interview question 1", "Common interview question 2"],
    "practiceProblems": ["Practice problem 1", "Practice problem 2"],
    "furtherReading": ["Resource 1", "Resource 2"]
  }},
  "codeSnippets": [
    {{
      "language": "javascript",
      "code": "// Example code",
      "explanation": "What this code demonstrates"
    }}
  ],
  "relatedConcepts": ["Related concept 1", "Related concept 2"],
  "confidence_score": 0.95
}}

Respond with a JSON array of concept objects. Extract 1-3 concepts maximum per segment.
Focus on substantial, learnable concepts rather than minor details.
"""

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=3000
            )
            
            content = response.choices[0].message.content
            if not content:
                return []
                
            concepts = json.loads(content)
            return concepts if isinstance(concepts, list) else []
            
        except Exception as error:
            print(f"Error analyzing segment: {error}")
            return []

    async def _generate_summary(self, conversation_text: str, client) -> str:
        """Generate a conversation summary."""
        prompt = f"""
Provide a concise 2-3 sentence summary of this technical conversation, focusing on the main topics and concepts discussed:

{conversation_text}

Summary:"""

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200
            )
            
            return response.choices[0].message.content.strip() if response.choices[0].message.content else "Discussion about programming concepts"
            
        except Exception as error:
            print(f"Error generating summary: {error}")
            return "Discussion about programming concepts"

    def _deduplicate_concepts(self, concepts: List[Dict]) -> List[Dict]:
        """Remove duplicate concepts and ensure required fields."""
        unique_concepts = []
        
        for concept in concepts:
            # Check for duplicates
            is_duplicate = any(
                self._calculate_similarity(concept.get("title", ""), existing.get("title", "")) > 0.8
                for existing in unique_concepts
            )
            
            if not is_duplicate:
                # Ensure required fields
                concept["keyPoints"] = concept.get("keyPoints", [])
                concept["details"] = concept.get("details", {})
                concept["codeSnippets"] = concept.get("codeSnippets", [])
                concept["relatedConcepts"] = concept.get("relatedConcepts", [])
                concept["confidence_score"] = concept.get("confidence_score", 0.8)
                concept["last_updated"] = datetime.now().isoformat()
                
                unique_concepts.append(concept)
        
        return unique_concepts

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings."""
        words1 = str1.lower().split()
        words2 = str2.lower().split()
        intersection = set(words1) & set(words2)
        union = set(words1) | set(words2)
        return len(intersection) / len(union) if union else 0

    def _generate_fallback_concepts(self, conversation_text: str) -> List[Dict]:
        """Generate fallback concepts when extraction fails."""
        return [{
            "title": "Programming Discussion",
            "category": "General",
            "summary": "General programming concepts discussed in the conversation",
            "keyPoints": ["Key concepts from conversation"],
            "details": {
                "implementation": "Various programming concepts were discussed",
                "complexity": {"time": "N/A", "space": "N/A"},
                "useCases": ["General programming"],
                "edgeCases": [],
                "performance": "N/A",
                "interviewQuestions": [],
                "practiceProblems": [],
                "furtherReading": []
            },
            "codeSnippets": [],
            "relatedConcepts": [],
            "confidence_score": 0.5,
            "last_updated": datetime.now().isoformat()
        }]

# Vercel serverless function handler
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            conversation_text = request_data.get('conversation_text', '')
            custom_api_key = request_data.get('custom_api_key')
            
            if not conversation_text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "conversation_text is required"}).encode())
                return
            
            # Create extractor and analyze
            extractor = ConceptExtractor()
            
            # Run async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                extractor.analyze_conversation(conversation_text, custom_api_key)
            )
            loop.close()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 