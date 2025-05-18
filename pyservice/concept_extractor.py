from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
import re
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import hashlib
from functools import lru_cache

app = FastAPI(title="Technical Concept Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

class ConversationRequest(BaseModel):
    conversation_text: str
    context: Optional[Dict] = None  # Additional context for better extraction

class Concept(BaseModel):
    title: str
    category: str
    subcategories: Optional[List[str]] = None
    notes: Dict
    code_examples: Optional[List[Dict]] = None
    relationships: Optional[Dict] = None
    learning_resources: Optional[Dict] = None
    confidence_score: float
    last_updated: datetime

class ExtractionResponse(BaseModel):
    concepts: List[Concept]
    summary: str
    metadata: Dict

class ConceptExtractor:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.model = "gpt-4-turbo-preview"
        self.max_retries = 3
        self.retry_delay = 1
        self.cache = {}

    def _generate_cache_key(self, text: str) -> str:
        """Generate a cache key for the conversation text."""
        return hashlib.md5(text.encode()).hexdigest()

    @lru_cache(maxsize=100)
    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available."""
        return self.cache.get(cache_key)

    def _parse_structured_response(self, response_text: str) -> Dict:
        """Parse the structured response from the model with improved error handling."""
        try:
            response_data = json.loads(response_text)
            
            # Validate and process concepts
            concepts = []
            for concept in response_data.get("concepts", []):
                try:
                    # Ensure required fields are present
                    if not all(k in concept for k in ["title", "category", "notes"]):
                        continue

                    # Process and validate concept data
                    # --- Handle both codeExamples and code_examples ---
                    code_examples = self._process_code_examples(
                        concept.get("codeExamples", []) + concept.get("code_examples", [])
                    )
                    # --- Handle both relationships and related_concepts ---
                    relationships = self._process_relationships(
                        concept.get("relationships", concept.get("related_concepts", {}))
                    )

                    notes = self._process_notes(concept.get("notes", {}))
                    learning_resources = self._process_learning_resources(concept.get("learningResources", {}))

                    # --- Transform to flat structure for frontend ---
                    processed_concept = {
                        "title": concept["title"],
                        "category": concept["category"],
                        "subcategories": concept.get("subcategories", []),
                        "summary": concept.get("summary", notes.get("implementation", "")[:300]),
                        "details": {
                            "implementation": notes.get("implementation", ""),
                            "complexity": notes.get("complexity", {}),
                            "useCases": notes.get("use_cases", []),
                            "edgeCases": notes.get("edge_cases", []),
                            "performance": notes.get("performance", ""),
                            "interviewQuestions": learning_resources.get("interview_questions", []),
                            "practiceProblems": learning_resources.get("practice_problems", []),
                            "furtherReading": learning_resources.get("further_reading", []),
                        },
                        "keyPoints": notes.get("principles", []),
                        "examples": notes.get("use_cases", []),
                        "codeSnippets": [
                            {
                                "language": ex["language"],
                                "description": ex.get("explanation", ""),
                                "code": ex["code"]
                            }
                            for ex in code_examples
                        ],
                        "relationships": relationships,
                        "relatedConcepts": relationships.get("data_structures", []) + relationships.get("algorithms", []) + relationships.get("patterns", []) + relationships.get("applications", []),
                        "confidence_score": concept.get("confidence_score", 0.8),
                        "last_updated": datetime.now().isoformat()
                    }
                    concepts.append(processed_concept)
                except Exception as e:
                    print(f"Error processing concept: {str(e)}")
                    continue

            return {
                "concepts": concepts,
                "summary": response_data.get("summary", ""),
                "metadata": {
                    "extraction_time": datetime.now().isoformat(),
                    "model_used": self.model,
                    "concept_count": len(concepts)
                }
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            return self._fallback_extraction(response_text)
        except Exception as e:
            print(f"Unexpected error in parsing: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error parsing response: {str(e)}")

    def _process_notes(self, notes: Dict) -> Dict:
        """Process and validate concept notes."""
        return {
            "principles": notes.get("principles", []),
            "implementation": notes.get("implementation", ""),
            "complexity": notes.get("complexity", {}),
            "use_cases": notes.get("useCases", []),
            "edge_cases": notes.get("edgeCases", []),
            "performance": notes.get("performance", "")
        }

    def _process_code_examples(self, examples: List[Dict]) -> List[Dict]:
        """Process and validate code examples from both codeExamples and code_examples."""
        processed_examples = []
        for example in examples:
            if all(k in example for k in ["language", "code"]):
                processed_examples.append({
                    "language": example["language"],
                    "code": example["code"],
                    "explanation": example.get("explanation", "")
                })
        return processed_examples

    def _process_relationships(self, relationships: Dict) -> Dict:
        """Process and validate concept relationships."""
        return {
            "data_structures": relationships.get("dataStructures", []),
            "algorithms": relationships.get("algorithms", []),
            "patterns": relationships.get("patterns", []),
            "applications": relationships.get("applications", [])
        }

    def _process_learning_resources(self, resources: Dict) -> Dict:
        """Process and validate learning resources."""
        return {
            "key_points": resources.get("keyPoints", []),
            "interview_questions": resources.get("interviewQuestions", []),
            "practice_problems": resources.get("practiceProblems", []),
            "further_reading": resources.get("furtherReading", [])
        }

    def _fallback_extraction(self, text: str) -> Dict:
        """Fallback extraction method using regex patterns."""
        concepts = []
        concept_pattern = r"Title:\s*(.*?)(?=Title:|$)"
        matches = re.finditer(concept_pattern, text, re.DOTALL)
        
        for match in matches:
            concept_text = match.group(1).strip()
            if concept_text:
                title_match = re.search(r"Title:\s*(.*?)(?:\n|$)", concept_text)
                if title_match:
                    concepts.append({
                        "title": title_match.group(1).strip(),
                        "category": "Uncategorized",
                        "notes": {"principles": [], "implementation": concept_text},
                        "confidence_score": 0.5,
                        "last_updated": datetime.now().isoformat()
                    })
        
        return {
            "concepts": concepts,
            "summary": "Extracted from unstructured response",
            "metadata": {
                "extraction_time": datetime.now().isoformat(),
                "model_used": self.model,
                "concept_count": len(concepts),
                "extraction_method": "fallback"
            }
        }

    async def analyze_conversation(self, req: ConversationRequest) -> Dict:
        """Analyze a conversation and extract concepts with improved context handling."""
        try:
            # Check cache first
            cache_key = self._generate_cache_key(req.conversation_text)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                return cached_response

            print(f"Analyzing conversation: {req.conversation_text[:100]}...")
            
            # Enhanced prompt with context awareness
            structured_prompt = f'''
You are an expert technical knowledge extraction system. Your job is to analyze programming and computer science conversations and extract:
- The main problem as the primary concept (e.g., "Contains Duplicate Problem").
- For each important supporting topic (such as hash tables, for-loops, time complexity, edge cases, etc.), if it is discussed in detail, extract it as a related concept with its own notes and code, and link it to the main problem using the relationships field.
- If a supporting topic is only briefly mentioned, include it as a subcategory, note, or related concept, but do not extract it as a full concept unless there is enough detail.

**IMPORTANT:**
- The main problem should always be present as the primary concept.
- Related concepts should have their own notes, code, and details if discussed in the conversation, and should be linked to the main problem using the relationships field (e.g., dataStructures, algorithms, patterns, applications).
- Use the relationships field to link concepts to each other (e.g., the main problem's relationships.dataStructures should include "Hash Table" if that's a related concept, and the "Hash Table" concept's relationships.applications should include the main problem).
- Always include code examples if code is present in the conversation.
- Use the exact JSON structure below. Use plural keys (e.g., "codeExamples").

For EACH concept, provide:
- A clear, specific title and primary category.
- Related subcategories (if any).
- A confidence score (0.0 to 1.0).
- A concise, high-level 'summary' field (1-2 sentences) that gives a quick overview of the concept and what was learned about it in the conversation. This should NOT be a copy of the details or implementation, but a true summary.
- DETAILED notes, including:
    - Core principles and theory
    - Implementation details and best practices
    - Time and space complexity
    - Use cases, edge cases, and performance
    - Common pitfalls and solutions
- AT LEAST ONE code example (with language, code, and explanation) if any code is present in the conversation.
- Relationships to other concepts, data structures, algorithms, patterns, and real-world applications.
- Learning resources (key points, interview questions, practice problems, further reading).

CONTEXT INFORMATION:
{json.dumps(req.context) if req.context else "No additional context provided"}

ANALYZE THIS CONVERSATION and extract ALL technical concepts, organizing them into clear categories with comprehensive notes.

Respond in this JSON format:
{{
    "concepts": [
        {{
            "title": "Concept Name",
            "category": "Primary Category",
            "subcategories": ["Subcategory1", "Subcategory2"],
            "summary": "A concise, high-level summary of the concept and what was learned.",
            "confidence_score": 0.95,
            "notes": {{
                "principles": ["Key principle 1", "Key principle 2"],
                "implementation": "Detailed implementation notes",
                "complexity": {{
                    "time": "Time complexity analysis",
                    "space": "Space complexity analysis"
                }},
                "useCases": ["Use case 1", "Use case 2"],
                "edgeCases": ["Edge case 1", "Edge case 2"],
                "performance": "Performance characteristics"
            }},
            "codeExamples": [
                {{
                    "language": "Language name",
                    "code": "Code with comments",
                    "explanation": "Explanation of the code"
                }}
            ],
            "relationships": {{
                "dataStructures": ["Related DS 1", "Related DS 2"],
                "algorithms": ["Related algo 1", "Related algo 2"],
                "patterns": ["Related pattern 1", "Related pattern 2"],
                "applications": ["Application 1", "Application 2"]
            }},
            "learningResources": {{
                "keyPoints": ["Point 1", "Point 2"],
                "interviewQuestions": ["Question 1", "Question 2"],
                "practiceProblems": ["Problem 1", "Problem 2"],
                "furtherReading": ["Resource 1", "Resource 2"]
            }}
        }}
    ],
    "summary": "Overall summary of the conversation's technical content"
}}

Conversation:
"""
{req.conversation_text}
"""
'''
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": structured_prompt}],
                temperature=0.7,
                max_tokens=4000,
                response_format={ "type": "json_object" }
            )
            
            response_text = response.choices[0].message.content
            result = self._parse_structured_response(response_text)
            
            # Cache the result
            self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            print(f"Error analyzing conversation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Initialize the concept extractor
concept_extractor = ConceptExtractor()

@app.post("/api/v1/extract-concepts")
async def extract_concepts(req: ConversationRequest):
    """Extract technical concepts from a conversation."""
    try:
        result = await concept_extractor.analyze_conversation(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/health")
async def health_check():
    """Check if the service is healthy."""
    return {
        "status": "ok",
        "api_key_configured": bool(OPENAI_API_KEY),
        "cache_size": len(concept_extractor.cache),
        "service": "Technical Concept Extractor"
    } 