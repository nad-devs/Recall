from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
import re
from typing import Dict, List, Optional, Tuple
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import hashlib
from functools import lru_cache
import asyncio
import httpx
import logging
import traceback

# Configure comprehensive logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('concept_extraction.log')
    ]
)
logger = logging.getLogger(__name__)

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
    category_guidance: Optional[Dict] = None  # For hierarchical categories guidance


class Concept(BaseModel):
    title: str
    category: str
    categoryPath: Optional[List[str]] = None  # New: for hierarchical categories
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
        self.model = "gpt-4o"
        self.max_retries = 3
        self.retry_delay = 1
        self.cache = {}
        logger.info(f"ConceptExtractor initialized with model: {self.model}")

    def _generate_cache_key(self, text: str) -> str:
        """Generate a cache key for the conversation text."""
        cache_key = hashlib.md5(text.encode()).hexdigest()
        logger.debug(f"Generated cache key: {cache_key[:8]}... for text length: {len(text)}")
        return cache_key

    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available."""
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache HIT for key: {cache_key[:8]}...")
        else:
            logger.info(f"Cache MISS for key: {cache_key[:8]}...")
        return cached

    async def _fetch_categories(self) -> List[str]:
        """Fetch the list of categories from the Next.js API endpoint. Fallback to default if fails."""
        logger.info("Fetching categories from API...")
        default_categories = [
            # Core Computer Science
            "Data Structures and Algorithms",
            "Data Structures",
            "Algorithms",
            "Algorithm Technique",
            "LeetCode Problems",
            
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
            
            # Other
            "System Design",
            "Machine Learning",
            "General"
        ]
        try:
            async with httpx.AsyncClient() as client:
                # Use environment variable for frontend URL with fallback
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
                resp = await client.get(f"{frontend_url}/api/categories")
                if resp.status_code == 200:
                    data = resp.json()
                    categories = data.get("categories", [])
                    if categories:
                        logger.info(f"Successfully fetched {len(categories)} categories from API")
                        return categories
                    else:
                        logger.warning("API returned empty categories list")
                else:
                    logger.warning(f"API returned status code: {resp.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch categories from API: {e}")
        
        logger.info(f"Using default categories ({len(default_categories)} categories)")
        return default_categories

    async def _suggest_category_llm(self, title: str, summary: str) -> Optional[str]:
        """Ask the LLM to suggest the best category for a concept."""
        logger.debug(f"Requesting LLM category suggestion for: {title}")
        categories = await self._fetch_categories()
        prompt = (
            f"Given the following concept title and summary, suggest the most appropriate category from this list: {categories}.\n"
            f"Title: {title}\n"
            f"Summary: {summary}\n"
            "Respond with only the category name. If none of the categories fit well, respond with 'UNCATEGORIZED'."
        )
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=20
            )
            category = response.choices[0].message.content.strip()
            # Normalize and check if it's a valid category
            normalized_category = self._normalize_category(category, categories)
            logger.debug(f"LLM suggested category: {category} -> normalized: {normalized_category}")
            return normalized_category
        except Exception as e:
            logger.error(f"LLM category suggestion failed: {str(e)}")
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
            "coding challenge": "LeetCode Problems",
            "problem solving": "LeetCode Problems",
            
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
        
        for key, value in category_mapping.items():
            if key in suggested_lower and value in valid_categories:
                return value
                
        return "General"

    def _parse_structured_response(self, response_text: str) -> Dict:
        """Parse the structured response from the LLM with comprehensive error handling and logging."""
        logger.info("=== PARSING LLM RESPONSE ===")
        logger.info(f"Response length: {len(response_text)} characters")
        logger.debug(f"Raw response preview: {response_text[:500]}...")
        
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present - more robust cleaning
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            # Remove any remaining backticks at start/end
            cleaned_text = cleaned_text.strip('`').strip()
            
            # Parse JSON
            response_data = json.loads(cleaned_text)
            logger.info("✅ Successfully parsed JSON response")
            
            # Log the structure
            logger.info(f"Response contains: {list(response_data.keys())}")
            
            # Clean up the conversation summary if it has formatting tags
            if response_data.get("conversation_summary"):
                # Remove any [PROBLEM_SOLVING], [TECHNIQUE] or other bracketed prefixes
                summary = response_data["conversation_summary"]
                summary = re.sub(r'\[\w+(_\w+)*\]\s*', '', summary)
                summary = re.sub(r'\([^)]*\)', '', summary)  # Remove parenthetical phrases
                summary = re.sub(r'\s+:', ':', summary)      # Fix spacing before colons
                response_data["conversation_summary"] = summary.strip()
                response_data["summary"] = summary.strip()
                logger.debug(f"Cleaned summary: {summary}")
            
            # Validate and process concepts
            processed_concepts = []
            
            # Log the raw concepts structure
            logger.info("=== PROCESSING CONCEPTS ===")
            if "concepts" in response_data:
                logger.info(f"Number of raw concepts: {len(response_data['concepts'])}")
                for i, concept in enumerate(response_data['concepts']):
                    logger.debug(f"Concept {i+1} raw fields: {list(concept.keys())}")
            else:
                logger.warning("⚠️  No 'concepts' field in LLM response!")
                # Create an empty concepts array to prevent errors
                response_data["concepts"] = []
            
            for i, concept in enumerate(response_data.get("concepts", [])):
                try:
                    logger.debug(f"Processing concept {i+1}: {concept.get('title', 'UNTITLED')}")
                    
                    # --- Ensure categoryPath exists ---
                    if "categoryPath" not in concept:
                        # If not provided, create it from the category
                        if "category" in concept:
                            # Check if the category has hierarchical path separator
                            category = concept["category"]
                            if any(separator in category for separator in [" > ", ">"]):
                                # Parse the path from the category string
                                concept["categoryPath"] = [c.strip() for c in re.split(r'\s*>\s*', category)]
                            else:
                                # Use category as a single-element path
                                concept["categoryPath"] = [category]
                    
                    # Ensure key fields are present and valid
                    if "title" not in concept:
                        concept["title"] = "Untitled Concept"
                        logger.warning(f"Concept {i+1} missing title, using default")
                    
                    if "summary" not in concept:
                        concept["summary"] = response_data.get("conversation_summary", "")[:150]
                        logger.warning(f"Concept {i+1} missing summary, using truncated conversation summary")
                    
                    # Properly format details from implementation if available
                    if "implementation" in concept and "details" not in concept:
                        concept["details"] = concept["implementation"]
                    elif "details" not in concept:
                        concept["details"] = concept.get("summary", "")
                        logger.warning(f"Concept {i+1} missing details, using summary")
                    
                    # Process the concept into the expected format
                    processed_concept = {
                        "title": concept.get("title", "Untitled Concept"),
                        "category": concept.get("category", "General"),
                        "categoryPath": concept.get("categoryPath", [concept.get("category", "General")]),
                        "subcategories": concept.get("subcategories", []),
                        "summary": concept.get("summary", ""),
                        "keyPoints": concept.get("keyPoints", []),
                        "details": self._process_details(concept.get("details", concept.get("implementation", ""))),
                        "codeSnippets": self._process_code_examples(concept.get("codeSnippets", concept.get("code_examples", []))),
                        "notes": self._process_notes(concept.get("notes", {})),
                        "code_examples": self._process_code_examples(concept.get("codeSnippets", concept.get("code_examples", []))),
                        "learning_resources": self._process_learning_resources(
                            concept.get("learning_resources", concept.get("learningResources", {}))
                        ),
                        "relationships": self._process_relationships(
                            concept.get("relationships", concept.get("related_concepts", {}))
                        ),
                        "relatedConcepts": concept.get("relatedConcepts", []),
                        "confidence_score": concept.get("confidence_score", 0.8),
                        "last_updated": datetime.now().isoformat()
                    }
                    processed_concepts.append(processed_concept)
                    logger.debug(f"✅ Successfully processed concept: {processed_concept['title']}")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing concept {i+1}: {e}")
                    logger.error(f"Concept data: {concept}")
                    # Basic recovery - add the raw concept with minimal processing
                    try:
                        if "title" in concept:
                            minimal_concept = {
                                "title": concept.get("title", "Untitled Concept"),
                                "category": concept.get("category", "General"),
                                "summary": concept.get("summary", concept.get("details", "")[:100]),
                                "keyPoints": concept.get("keyPoints", []),
                                "details": {
                                    "implementation": concept.get("details", concept.get("implementation", "")),
                                    "complexity": {"time": "O(n)", "space": "O(n)"},
                                    "useCases": [],
                                    "edgeCases": [],
                                    "performance": ""
                                },
                                "relatedConcepts": concept.get("relatedConcepts", []),
                                "confidence_score": concept.get("confidence_score", 0.5),
                                "last_updated": datetime.now().isoformat()
                            }
                            processed_concepts.append(minimal_concept)
                            logger.info(f"🔧 Recovered concept with minimal processing: {minimal_concept['title']}")
                    except Exception as e2:
                        logger.error(f"❌ Failed to recover concept with minimal processing: {e2}")

            logger.info(f"✅ Successfully processed {len(processed_concepts)} concepts")
            
            # Use the processed concepts list    
            result = {
                "concepts": processed_concepts,
                "summary": response_data.get("conversation_summary", response_data.get("summary", "")),
                "conversation_summary": response_data.get("conversation_summary", response_data.get("summary", "")),
                "metadata": {
                    "extraction_time": datetime.now().isoformat(),
                    "model_used": self.model,
                    "concept_count": len(processed_concepts),
                    "raw_concept_count": len(response_data.get("concepts", [])),
                    "processing_success_rate": len(processed_concepts) / max(len(response_data.get("concepts", [])), 1)
                }
            }
            
            logger.info("=== PARSING COMPLETED SUCCESSFULLY ===")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {str(e)}")
            logger.error(f"Problematic text: {response_text[:1000]}...")
            return self._fallback_extraction(response_text)
        except Exception as e:
            logger.error(f"❌ Unexpected error in parsing: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, detail=f"Error parsing response: {str(e)}"
            )

    def _process_details(self, details) -> str:
        """Process and format the details field."""
        if isinstance(details, dict):
            # If details is a dict, extract the implementation or convert to string
            if "implementation" in details:
                return details["implementation"]
            else:
                # Convert dict to a readable string
                return json.dumps(details, indent=2)
        elif isinstance(details, str):
            return details
        else:
            return str(details)

    def _process_notes(self, notes: Dict) -> Dict:
        """Process and validate concept notes."""
        processed_notes = {
            "principles": notes.get("principles", []),
            "implementation": notes.get("implementation", ""),
            "complexity": notes.get("complexity", {}),
            "use_cases": notes.get("useCases", notes.get("use_cases", [])),
            "edge_cases": notes.get("edgeCases", notes.get("edge_cases", [])),
            "performance": notes.get("performance", "")
        }
        logger.debug(f"Processed notes with {len(processed_notes)} fields")
        return processed_notes

    def _process_code_examples(self, examples: List[Dict]) -> List[Dict]:
        """Process and validate code examples."""
        processed_examples = []
        for i, example in enumerate(examples):
            try:
                processed_example = {
                    "language": example.get("language", "text"),
                    "code": example.get("code", ""),
                    "explanation": example.get("explanation", example.get("description", "")),
                    "description": example.get("description", example.get("explanation", ""))
                }
                processed_examples.append(processed_example)
                logger.debug(f"Processed code example {i+1}: {processed_example['language']}")
            except Exception as e:
                logger.warning(f"Failed to process code example {i+1}: {e}")
        return processed_examples

    def _process_relationships(self, relationships: Dict) -> Dict:
        """Process and validate concept relationships."""
        processed_relationships = {
            "prerequisites": relationships.get("prerequisites", []),
            "related_concepts": relationships.get("related_concepts", relationships.get("relatedConcepts", [])),
            "applications": relationships.get("applications", []),
            "dataStructures": relationships.get("dataStructures", relationships.get("data_structures", [])),
            "algorithms": relationships.get("algorithms", [])
        }
        logger.debug(f"Processed relationships with {sum(len(v) if isinstance(v, list) else 0 for v in processed_relationships.values())} total items")
        return processed_relationships

    def _process_learning_resources(self, resources: Dict) -> Dict:
        """Process and validate learning resources."""
        processed_resources = {
            "documentation": resources.get("documentation", []),
            "tutorials": resources.get("tutorials", []),
            "practice_problems": resources.get("practice_problems", resources.get("practiceProblems", [])),
            "further_reading": resources.get("further_reading", resources.get("furtherReading", []))
        }
        logger.debug(f"Processed learning resources with {sum(len(v) if isinstance(v, list) else 0 for v in processed_resources.values())} total items")
        return processed_resources

    def _fallback_extraction(self, text: str) -> Dict:
        """Fallback extraction method using regex patterns."""
        logger.warning("🔧 Using fallback extraction method")
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
                        "summary": concept_text[:200] + "..." if len(concept_text) > 200 else concept_text,
                        "details": concept_text,
                        "keyPoints": [],
                        "relatedConcepts": [],
                        "confidence_score": 0.5,
                        "last_updated": datetime.now().isoformat()
                    })
        
        logger.info(f"Fallback extraction found {len(concepts)} concepts")
        return {
            "concepts": concepts,
            "summary": "Extracted from unstructured response",
            "conversation_summary": "Discussion about programming concepts",
            "metadata": {
                "extraction_time": datetime.now().isoformat(),
                "model_used": self.model,
                "concept_count": len(concepts),
                "extraction_method": "fallback"
            }
        }

    async def _segment_conversation(self, conversation_text: str) -> List[Tuple[str, str]]:
        """
        Segment the conversation into topical sections with comprehensive logging.
        Returns a list of (topic, segment_text) tuples.
        """
        logger.info("=== STARTING CONVERSATION SEGMENTATION ===")
        logger.info(f"Input text length: {len(conversation_text)} characters")
        logger.debug(f"Input preview: {conversation_text[:300]}...")
        
        try:
            # Build segmentation prompt in readable sections
            task_description = (
                "Your task is to analyze the following conversation and identify ONLY MAJOR topic changes:\n"
                "First, determine if this is:\n"
                "1. A PROBLEM-SOLVING conversation (discussing a specific algorithm or coding problem)\n"
                "2. An EXPLORATORY LEARNING conversation (learning about a technology or concept)\n\n"
            )
            
            problem_solving_rules = (
                "For PROBLEM-SOLVING conversations:\n"
                "- Use ONE segment for each distinct problem discussed\n"
                "- Do NOT create separate segments for different approaches to the same problem\n"
                "- When naming the topic, include the main technique used (e.g., 'Contains Duplicate Problem (Hash Table)')\n"
                "- Example: 'Contains Duplicate Problem (Hash Table)' or 'Valid Anagram (Frequency Counting)'\n\n"
            )
            
            exploratory_rules = (
                "For EXPLORATORY LEARNING conversations:\n"
                "- Segment by major topic changes (e.g., 'NLP Basics' to 'Database Systems')\n"
                "- Sub-topics within the same area should stay in the same segment\n"
                "- Example: Learning about 'Tokenization', 'Word Embeddings', and 'BERT' would be ONE segment about 'NLP'\n\n"
            )
            
            general_rules = (
                "General rules:\n"
                "1. Identify MAJOR distinct topics being discussed (not implementation details)\n"
                "2. Give each segment a descriptive title that includes the main techniques used (for problem-solving)\n"
                "3. Aim for 1-3 segments MAXIMUM for most conversations\n\n"
            )
            
            json_format = (
                "Respond in valid JSON format with this structure:\n"
                "{\n"
                '    "conversation_type": "PROBLEM_SOLVING" or "EXPLORATORY_LEARNING",\n'
                '    "segments": [\n'
                '        {\n'
                '            "topic": "Main Topic Title (with technique for problems)",\n'
                '            "main_technique": "Hash Table", // For problem-solving only\n'
                '            "content": "This portion of the conversation"\n'
                "        },\n"
                "        // More segments...\n"
                "    ]\n"
                "}\n\n"
            )
            
            conversation_text_section = f"Here's the conversation to segment:\n\"\"\"\n{conversation_text}\n\"\"\"\n"
            
            # Combine all sections
            segmentation_prompt = (
                task_description +
                problem_solving_rules +
                exploratory_rules +
                general_rules +
                json_format +
                conversation_text_section
            )

            logger.debug(f"Segmentation prompt length: {len(segmentation_prompt)} characters")
            logger.debug("Sending segmentation request to LLM...")

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": segmentation_prompt}],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content
            logger.debug(f"Segmentation response length: {len(response_text)} characters")
            logger.debug(f"Raw segmentation response: {response_text}")
            
            segmentation_data = json.loads(response_text)
            logger.info("✅ Successfully parsed segmentation response")
            
            segments = []
            conversation_type = segmentation_data.get("conversation_type", "UNKNOWN")
            logger.info(f"🔍 Detected conversation type: {conversation_type}")
            
            raw_segments = segmentation_data.get("segments", [])
            logger.info(f"📊 Found {len(raw_segments)} raw segments")
            
            for i, segment in enumerate(raw_segments):
                topic = segment.get("topic", "Uncategorized")
                content = segment.get("content", "")
                main_technique = segment.get("main_technique", "")
                
                logger.debug(f"Processing segment {i+1}: '{topic}' (length: {len(content)} chars)")
                if main_technique:
                    logger.debug(f"  Main technique: {main_technique}")
                
                if content:
                    # Add conversation type and technique to topic for better context in the analysis stage
                    if conversation_type == "PROBLEM_SOLVING" and main_technique:
                        tagged_topic = f"[{conversation_type}] {topic} [TECHNIQUE:{main_technique}]"
                    else:
                        tagged_topic = f"[{conversation_type}] {topic}"
                    segments.append((tagged_topic, content))
                    logger.debug(f"  ✅ Added segment: {tagged_topic}")
                else:
                    logger.warning(f"  ⚠️  Skipping segment {i+1} - no content")
            
            # If no segments or too many segments, just use the whole conversation
            if not segments:
                logger.warning("⚠️  No valid segments found, using full conversation")
                segments = [(f"[UNKNOWN] Full Conversation", conversation_text)]
            elif len(segments) > 5:
                logger.warning(f"⚠️  Too many segments ({len(segments)}), using full conversation")
                segments = [(f"[UNKNOWN] Full Conversation", conversation_text)]
                
            logger.info(f"✅ Conversation segmented into {len(segments)} final segments")
            for i, (topic, content) in enumerate(segments):
                logger.debug(f"  Segment {i+1}: {topic} ({len(content)} chars)")
            
            logger.info("=== SEGMENTATION COMPLETED ===")
            return segments
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error in segmentation: {str(e)}")
            logger.error(f"Problematic response: {response_text[:500]}...")
            logger.warning("🔧 Falling back to full conversation")
            return [("Full Conversation", conversation_text)]
        except Exception as e:
            logger.error(f"❌ Error segmenting conversation: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.warning("🔧 Falling back to full conversation")
            return [("Full Conversation", conversation_text)]

    async def _analyze_segment(
        self, topic: str, segment_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a single conversation segment with comprehensive logging and analysis.
        """
        logger.info("=== STARTING SEGMENT ANALYSIS ===")
        logger.info(f"📝 Topic: {topic}")
        logger.info(f"📊 Segment length: {len(segment_text)} characters")
        logger.debug(f"Segment preview: {segment_text[:200]}...")
        
        if context:
            logger.debug(f"Context provided: {list(context.keys())}")
        if category_guidance:
            logger.debug(f"Category guidance provided: {list(category_guidance.keys())}")

        # Determine segment type from topic tag
        segment_type = "EXPLORATORY_LEARNING"
        if topic.strip().upper().startswith("[PROBLEM_SOLVING]"):
            segment_type = "PROBLEM_SOLVING"
        
        logger.info(f"🔍 Detected segment type: {segment_type}")
            
        # Handle the hierarchical categories if provided
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
        categoryPath_example = ',\n            "categoryPath": ["Backend Engineering", "API Design"]'

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
   - Do NOT categorize LeetCode problems as just "Algorithm" or other generic categories

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
   - Use consistent category "LeetCode Problems" or "Algorithm" for the problem
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
}
"""

        if segment_type == "PROBLEM_SOLVING":
            # Build the problem-solving prompt in readable sections
            base_instructions = (
                "You are an expert technical knowledge extraction system. Your job is to "
                "analyze programming and computer science conversations and extract:\n"
                "- Extract the main problem as the primary concept (e.g., \"Contains Duplicate Problem\")\n"
                "- Clearly highlight the key technique/data structure used in the solution\n"
                "- Include it in the concept's 'summary' and 'keyPoints' fields\n"
                "- Add it to the 'relationships' and 'subcategories' fields\n"
                "- Include the solution approach and code if present\n"
                "- For common techniques like Hash Tables, Two-Pointer, Frequency counting, make sure they are prominently featured\n"
                "- Limit to 1-3 concepts maximum\n"
                "- NO duplicates or overlapping concepts\n"
                "- Make 'summary' a concise statement of what was learned\n"
                "- Make 'keyPoints' a list of the most important takeaways\n"
                "- Include only MAJOR topics as separate concepts\n"
                "- Implementation details and minor techniques should be included WITHIN the relevant concept\n\n"
            )
            
            concept_requirements = (
                "For EACH concept, provide:\n"
                "- A clear, specific title focusing on the concept (problem, data structure, algorithm, or topic).\n"
                "- A unique, concise 'summary' field (1-2 sentences) that gives a quick overview specific to this concept only.\n"
                "- A different, detailed 'implementation' field with in-depth technical explanation for this specific concept.\n"
                "- 2-5 key points summarizing the most important takeaways specific to this concept.\n"
                "- Related concepts if relevant.\n"
                "- Code examples if present in the conversation.\n"
            )
            
            quality_requirements = (
                "IMPORTANT: Each concept MUST have its own unique summary and details - do not copy or reuse content between concepts.\n"
                "CRITICAL: The 'details' field must be 3-5x longer than the 'summary' and contain comprehensive technical information.\n\n"
            )
            
            context_info = (
                f"SEGMENT INFORMATION:\nTopic: {topic}\n\n"
                f"CONTEXT INFORMATION:\n{json.dumps(context) if context else 'No additional context provided'}\n\n"
                "ANALYZE THIS CONVERSATION SEGMENT according to the problem-solving extraction approach above.\n\n"
            )
            
            json_format = (
                "Respond in this JSON format:\n"
                "{\n"
                '    "concepts": [\n'
                "        {\n"
                '            "title": "Main Problem or Technique",\n'
                '            "summary": "A unique, concise summary specific to this concept only.",\n'
                '            "details": "A comprehensive 3-6 paragraph technical deep-dive that goes far beyond the summary, including implementation details, methodologies, real-world applications, performance considerations, and advanced concepts.",\n'
                '            "keyPoints": ["Key point 1", "Key point 2"],\n'
                '            "relatedConcepts": ["Related Concept 1", "Related Concept 2"],\n'
                '            "codeSnippets": [\n'
                "                {\n"
                '                    "language": "Language name",\n'
                '                    "description": "Description of what this code demonstrates",\n'
                '                    "code": "Properly formatted and commented code example"\n'
                "                }\n"
                "            ],\n"
                '            "category": "LeetCode Problems"' + f"{categoryPath_example},\n" + 
                '            "subcategories": ["Hash Table"]\n' + 
                "        }\n" + 
                "    ],\n" + 
                '    "conversation_title": "A short, descriptive title for this conversation (different from the summary)",\n' + 
                '    "conversation_summary": "A 1-2 sentence summary of the main topics and insights from this conversation, suitable for display on a card."\n' + 
                '}\n\n' + 
                f"Conversation Segment:\n\"\"\"\n{segment_text}\n\"\"\"\n"
            )
            
            # Combine all sections
            structured_prompt = (
                base_instructions +
                leetcode_specific_instructions + "\n\n" +
                concept_requirements +
                detailsAndSnippets_examples + "\n" +
                category_instructions + "\n\n" +
                quality_requirements +
                context_info +
                json_format
            )
        else:
            # Build the exploratory/learning prompt in readable sections
            base_instructions = (
                "You are an expert technical knowledge extraction system. Your job is to "
                "analyze programming and computer science conversations and extract:\n"
                "- Extract a list of the main topics or concepts the user learned about\n"
                "- For each topic, provide a concise note-style explanation of what was learned (focus on new knowledge or insights gained)\n"
                "- Do NOT include the user's struggles, questions, or the learning process—just the final learning outcomes\n"
                "- For each topic, also extract 2-5 key points summarizing the most important takeaways\n"
                "- If relevant, include related concepts, but do not include Q&A, misconceptions, or learning journey\n"
                "- Limit to 1-7 concepts maximum\n"
                "- NO duplicates or overlapping concepts (normalize similar names, e.g., 'Frequency Count' and 'Frequency Counting')\n"
                "- Make 'summary' a concise statement of what was learned\n"
                "- Make 'keyPoints' a list of the most important takeaways\n"
                "- Include only MAJOR topics as separate concepts\n"
                "- Implementation details and minor techniques should be included WITHIN the relevant concept\n\n"
            )
            
            concept_requirements = (
                "For EACH concept, provide:\n"
                "- A clear, specific title focusing on the concept (problem, data structure, algorithm, or topic).\n"
                "- A unique, concise 'summary' field (1-2 sentences) that gives a quick overview specific to this concept only.\n"
                "- A different, detailed 'implementation' field with in-depth technical explanation for this specific concept.\n"
                "- 2-5 key points summarizing the most important takeaways specific to this concept.\n"
                "- Related concepts if relevant.\n"
                "- Code examples if present in the conversation.\n"
            )
            
            quality_requirements = (
                "IMPORTANT: Each concept MUST have its own unique summary and details - do not copy or reuse content between concepts.\n"
                "CRITICAL: The 'details' field must be 3-5x longer than the 'summary' and contain comprehensive technical information.\n\n"
            )
            
            context_info = (
                f"SEGMENT INFORMATION:\nTopic: {topic}\n\n"
                f"CONTEXT INFORMATION:\n{json.dumps(context) if context else 'No additional context provided'}\n\n"
                "ANALYZE THIS CONVERSATION SEGMENT according to the exploratory learning extraction approach above.\n\n"
            )
            
            json_format = (
                "Respond in this JSON format:\n"
                "{\n"
                '    "concepts": [\n'
                "        {\n"
                '            "title": "Main Concept or Topic",\n'
                '            "summary": "A unique, concise summary specific to this concept only.",\n'
                '            "implementation": "A comprehensive 3-6 paragraph technical deep-dive that goes far beyond the summary, including implementation details, methodologies, real-world applications, performance considerations, and advanced concepts.",\n'
                '            "keyPoints": ["Key point 1", "Key point 2"],\n'
                '            "relatedConcepts": ["Related Concept 1", "Related Concept 2"],\n'
                '            "codeSnippets": [\n'
                "                {\n"
                '                    "language": "Language name",\n'
                '                    "description": "Description of what this code demonstrates",\n'
                '                    "code": "Properly formatted and commented code example"\n'
                "                }\n"
                "            ],\n"
                '            "category": "Backend Engineering"' + f"{categoryPath_example},\n" + 
                '            "subcategories": ["Backend Engineering"]\n' + 
                "        }\n" + 
                "    ],\n" + 
                '    "conversation_title": "A short, descriptive title for this conversation (different from the summary)",\n' + 
                '    "conversation_summary": "A 1-2 sentence summary of the main topics and insights from this conversation, suitable for display on a card."\n' + 
                '}\n\n' + 
                f"Conversation Segment:\n\"\"\"\n{segment_text}\n\"\"\"\n"
            )
            
            # Combine all sections
            structured_prompt = (
                base_instructions +
                concept_requirements +
                detailsAndSnippets_examples + "\n" +
                category_instructions + "\n\n" +
                quality_requirements +
                context_info +
                json_format
            )

        # COMPREHENSIVE LOGGING
        logger.info("=== PREPARING LLM REQUEST ===")
        logger.info(f"🔧 Prompt length: {len(structured_prompt)} characters")
        logger.info(f"🎯 Temperature: 0.3, Max tokens: 4000")
        logger.debug("=== FULL LLM PROMPT ===")
        logger.debug(structured_prompt)
        logger.debug("=== SEGMENT CONTENT FOR ANALYSIS ===")
        logger.debug(segment_text)

        logger.info("📤 Sending request to LLM...")
        start_time = datetime.now()
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": structured_prompt}],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        response_text = response.choices[0].message.content
        
        # COMPREHENSIVE RESPONSE LOGGING
        logger.info("📥 Received LLM response")
        logger.info(f"⏱️  Response time: {response_time:.2f} seconds")
        logger.info(f"📊 Response length: {len(response_text)} characters")
        logger.debug("=== RAW LLM RESPONSE ===")
        logger.debug(response_text)
        
        logger.info("🔄 Parsing LLM response...")
        parsed_result = self._parse_structured_response(response_text)
        
        # Log parsing results
        if parsed_result.get("concepts"):
            logger.info(f"✅ Successfully extracted {len(parsed_result['concepts'])} concepts")
            for i, concept in enumerate(parsed_result["concepts"]):
                logger.debug(f"  Concept {i+1}: {concept.get('title', 'UNTITLED')} (category: {concept.get('category', 'UNKNOWN')})")
        else:
            logger.warning("⚠️  No concepts extracted from segment")
        
        if parsed_result.get("conversation_summary"):
            logger.debug(f"Summary: {parsed_result['conversation_summary']}")
        
        logger.info("=== SEGMENT ANALYSIS COMPLETED ===")
        return parsed_result

    async def analyze_conversation(self, req: ConversationRequest) -> Dict:
        """Analyze a conversation using comprehensive analysis with detailed logging and fallback strategies."""
        logger.info("🚀 === STARTING CONVERSATION ANALYSIS ===")
        logger.info(f"📝 Input length: {len(req.conversation_text)} characters")
        logger.info(f"📋 Context provided: {bool(req.context)}")
        logger.info(f"🏷️  Category guidance provided: {bool(req.category_guidance)}")
        logger.debug(f"Input preview: {req.conversation_text[:200]}...")
        
        try:
            # Check cache first
            cache_key = self._generate_cache_key(req.conversation_text)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                logger.info("✅ Returning cached response")
                return cached_response

            logger.info("🔍 Starting single-pass analysis...")

            # Single-pass: analyze the whole conversation with the improved prompt
            single_pass_result = await self._analyze_segment(
                "Full Conversation", req.conversation_text, req.context, req.category_guidance
            )

            # If we get at least one concept, return it
            if single_pass_result.get("concepts"):
                # Simple title-based deduplication (keep highest confidence)
                unique_concepts = {}
                for concept in single_pass_result.get("concepts", []):
                    # Use exact title for deduplication, not lowercase
                    title_key = concept["title"]
                    if (title_key not in unique_concepts or 
                            concept.get("confidence_score", 0) > unique_concepts[title_key].get("confidence_score", 0)):
                        unique_concepts[title_key] = concept
                
                # Use the deduplicated list
                concepts = list(unique_concepts.values())
                
                # Check if we need to create technique mini-concepts for related concepts
                # This helps techniques appear in the Related Concepts UI without too much granularity
                main_concepts = concepts.copy()
                techniques_to_add = []
                
                for concept in main_concepts:
                    # Check if this is a problem-solving concept
                    is_problem = (
                        "problem" in concept["title"].lower() or 
                        concept["category"].lower() in ["problem-solving", "algorithm", "leetcode", "coding challenge"]
                    )
                    
                    if is_problem:
                        # Check for technique references in various places
                        techniques = set()
                        
                        # From key points
                        for point in concept.get("keyPoints", []):
                            for tech in ["hash table", "dictionary", "frequency count", "frequency counting", "two pointer", 
                                      "sliding window", "binary search", "dynamic programming"]:
                                if tech in point.lower():
                                    # Normalize technique names
                                    if tech == "dictionary":
                                        techniques.add("Hash Table")
                                    elif tech in ["frequency count", "frequency counting"]:
                                        techniques.add("Frequency Count")
                                    else:
                                        techniques.add(tech.title())
                        
                        # From subcategories
                        for subcat in concept.get("subcategories", []):
                            for tech in ["hash table", "dictionary", "frequency count", "frequency counting", "two pointer", 
                                      "sliding window", "binary search", "dynamic programming"]:
                                if tech in subcat.lower():
                                    # Normalize technique names
                                    if tech == "dictionary":
                                        techniques.add("Hash Table")
                                    elif tech in ["frequency count", "frequency counting"]:
                                        techniques.add("Frequency Count")
                                    else:
                                        techniques.add(tech.title())
                        
                        # From related data structures
                        for ds in concept.get("relationships", {}).get("dataStructures", []):
                            if "dictionary" in ds.lower():
                                techniques.add("Hash Table")
                            elif ds not in ["Array", "List", "String", "Integer"]:  # Skip basic data structures
                                techniques.add(ds)
                        
                        # From related algorithms
                        for algo in concept.get("relationships", {}).get("algorithms", []):
                            # Normalize algorithm names
                            if algo.lower() in ["frequency count", "frequency counting"]:
                                techniques.add("Frequency Count")
                            elif algo not in ["Iteration", "Loop"]:  # Skip generic algorithms
                                techniques.add(algo)
                        
                        # Create mini-concepts for main techniques (without being too granular)
                        for technique in techniques:
                            # Skip if too generic
                            if technique.lower() in ["array", "list", "string", "integer", "iteration", "loop"]:
                                continue
                                
                            # Get technique description and key points based on the technique
                            tech_description, tech_key_points, tech_implementation = self._get_technique_info(technique, concept["title"])
                            
                            # Create a more substantial concept for this technique
                            tech_concept = {
                                "title": technique,
                                "category": "Data Structure" if technique.lower() in ["hash table", "dictionary", "array", "set"] 
                                           else "Algorithm Technique",
                                "subcategories": [concept["title"]],  # Link back to main problem
                                "summary": tech_description,
                                "details": {
                                    "implementation": tech_implementation,
                                    "complexity": {
                                        "time": self._get_technique_complexity(technique, "time"),
                                        "space": self._get_technique_complexity(technique, "space")
                                    },
                                    "useCases": [f"Solving {concept['title']}", "Efficient data retrieval", "Deduplication"],
                                },
                                "keyPoints": tech_key_points,
                                "confidence_score": 0.7,  # Lower than main concept
                                "last_updated": datetime.now().isoformat(),
                                "_is_technique": True,  # Mark as a technique concept
                                "relatedConcepts": [concept["title"]]  # Link back to the main problem
                            }
                            
                            # Only add if we don't already have this technique
                            if not any(t["title"].lower() == technique.lower() for t in techniques_to_add):
                                techniques_to_add.append(tech_concept)
                
                # Add technique mini-concepts without overwhelming
                if techniques_to_add:
                    # Limit to maximum 3 techniques
                    limited_techniques = techniques_to_add[:3]
                    concepts.extend(limited_techniques)
                
                # Ensure each concept's relatedConcepts array has no duplicates
                for concept in concepts:
                    if "relatedConcepts" in concept:
                        # Remove duplicates while preserving order
                        seen = set()
                        concept["relatedConcepts"] = [x for x in concept["relatedConcepts"] 
                                                    if not (x.lower() in seen or seen.add(x.lower()))]
                
                # Post-process to ensure LeetCode problems are correctly categorized
                for concept in concepts:
                    # Check if this looks like a LeetCode problem based on title but isn't categorized as such
                    title_lower = concept["title"].lower()
                    
                    # List of common LeetCode problem indicators
                    leetcode_indicators = [
                        "duplicate", "anagram", "two sum", "palindrome", "linked list", "binary tree",
                        "reverse", "merge", "sort", "search", "maximum subarray", "path sum",
                        "valid parentheses", "container", "water", "longest common", "rotate", 
                        "median of", "zigzag", "roman to", "integer to", "add two"
                    ]
                    
                    # If title contains indicators but isn't categorized as LeetCode
                    if any(indicator in title_lower for indicator in leetcode_indicators) and concept["category"] != "LeetCode Problems":
                        print(f"Fixing category: '{concept['title']}' detected as LeetCode problem")
                        concept["category"] = "LeetCode Problems"
                        
                        # If this concept has related technique concepts, make sure they're properly linked
                        if "relatedConcepts" in concept and concept["relatedConcepts"]:
                            for related_title in concept["relatedConcepts"]:
                                # Find the related concept
                                for related_concept in concepts:
                                    if related_concept["title"].lower() == related_title.lower():
                                        # Make sure it links back
                                        if "relatedConcepts" not in related_concept:
                                            related_concept["relatedConcepts"] = []
                                        if concept["title"] not in related_concept["relatedConcepts"]:
                                            related_concept["relatedConcepts"].append(concept["title"])
                
                single_pass_result["concepts"] = concepts
                self.cache[cache_key] = single_pass_result
                return single_pass_result
            else:
                # If no concepts were extracted but we have a summary, create a basic fallback
                # This is much simpler and doesn't try to be too specific
                summary = single_pass_result.get("conversation_summary", single_pass_result.get("summary", ""))
                
                if "contains duplicate" in summary.lower() or "hash table" in summary.lower():
                    # Simple fallback for common patterns without over-engineering
                    concepts = []
                    
                    # Add the problem concept
                    concepts.append({
                        "title": "Contains Duplicate",
                        "category": "LeetCode Problems",
                        "categoryPath": ["LeetCode Problems"],
                        "summary": "A problem that involves finding if an array contains any duplicate elements.",
                        "keyPoints": [
                            "Use a hash table to track previously seen elements",
                            "Time complexity is O(n) where n is the length of the array",
                            "Space complexity is also O(n) in the worst case",
                            "Early termination occurs as soon as the first duplicate is found"
                        ],
                        "details": {
                            "implementation": "The Contains Duplicate problem asks us to determine if an array contains any duplicate elements. The most efficient approach uses a hash table (dictionary) to track elements we've seen.\n\nAs we iterate through the array, we check if each element already exists in our hash table. If it does, we've found a duplicate and return true. If we finish iterating without finding any duplicates, we return false.\n\nThis approach achieves O(n) time complexity compared to the naive O(n²) nested loop approach, trading some space efficiency for significant time optimization.",
                            "complexity": {
                                "time": "O(n) where n is the length of the array",
                                "space": "O(n) in the worst case, as we might need to store all elements in the hash table"
                            },
                            "useCases": [
                                "Checking for duplicate elements in arrays",
                                "Data validation and integrity checks",
                                "Preprocessing steps for algorithms requiring unique elements"
                            ],
                            "edgeCases": [
                                "Empty arrays (return false, as there are no duplicates)",
                                "Arrays with a single element (return false, as there can be no duplicates)",
                                "Arrays with many duplicates (can return true early)"
                            ]
                        },
                        "codeSnippets": [
                            {
                                "language": "Python",
                                "description": "Hash table implementation",
                                "code": "def containsDuplicate(nums):\n    seen = {}  # Hash table to track elements\n    \n    for num in nums:\n        # If we've seen this number before, return True\n        if num in seen:\n            return True\n        # Otherwise, add it to our hash table\n        seen[num] = True\n    \n    # If we've checked all elements without finding duplicates\n    return False"
                            },
                            {
                                "language": "JavaScript",
                                "description": "Using Set for duplicate detection",
                                "code": "function containsDuplicate(nums) {\n    const seen = new Set();\n    \n    for (const num of nums) {\n        // If we've seen this number before, return true\n        if (seen.has(num)) {\n            return true;\n        }\n        // Otherwise, add it to our set\n        seen.add(num);\n    }\n    \n    // If we've checked all elements without finding duplicates\n    return false;\n}"
                            }
                        ],
                        "relatedConcepts": ["Hash Table"],
                        "confidence_score": 0.95,
                        "last_updated": datetime.now().isoformat()
                    })
                    
                    # Add the hash table concept
                    concepts.append({
                        "title": "Hash Table",
                        "category": "Data Structure",
                        "categoryPath": ["Data Structure"],
                        "summary": "A data structure that maps keys to values using a hash function, enabling efficient lookups.",
                        "keyPoints": [
                            "Provides O(1) average time complexity for lookups, insertions, and deletions",
                            "Maps keys to values using a hash function",
                            "Handles collisions through techniques like chaining or open addressing",
                            "Essential for problems requiring fast element lookup or counting"
                        ],
                        "details": {
                            "implementation": "Hash tables work by transforming a key into an array index using a hash function. This allows for direct access to values without needing to search through the entire data structure.\n\nWhen a collision occurs (two keys hash to the same index), it can be resolved using techniques like chaining (storing multiple values in linked lists at each index) or open addressing (finding an alternative slot in the array).\n\nIn problems like Contains Duplicate, hash tables enable O(1) lookups to quickly determine if an element has been seen before.",
                            "complexity": {
                                "time": "Average: O(1) for lookups, insertions, and deletions. Worst case: O(n) if many collisions occur.",
                                "space": "O(n) where n is the number of key-value pairs stored"
                            },
                            "useCases": [
                                "Implementing dictionaries and maps",
                                "Caching data for quick access",
                                "Finding duplicates or counting occurrences",
                                "Symbol tables in compilers and interpreters"
                            ]
                        },
                        "codeSnippets": [
                            {
                                "language": "Python",
                                "description": "Using dictionary as hash table",
                                "code": "# Create a hash table\nhash_table = {}\n\n# Insert a key-value pair\nhash_table[\"key1\"] = \"value1\"\n\n# Check if a key exists\nif \"key1\" in hash_table:\n    print(\"Key exists!\")\n\n# Get a value by key\nvalue = hash_table.get(\"key1\", \"default_value\")"
                            }
                        ],
                        "relatedConcepts": ["Contains Duplicate"],
                        "confidence_score": 0.9,
                        "last_updated": datetime.now().isoformat()
                    })
                    
                    result = {
                        "concepts": concepts,
                        "summary": summary,
                        "conversation_summary": summary,
                        "metadata": {
                            "extraction_time": datetime.now().isoformat(),
                            "model_used": self.model,
                            "concept_count": len(concepts),
                            "extraction_method": "simple_fallback"
                        }
                    }
                    
                    self.cache[cache_key] = result
                    return result
                
            # Fallback: try multi-pass (segmentation + per-segment analysis)
            print("Single-pass yielded no concepts. Trying multi-pass fallback...")
            segments = await self._segment_conversation(req.conversation_text)
            all_concepts = []
            segment_summaries = []
            for topic, segment_text in segments:
                segment_result = await self._analyze_segment(
                    topic, segment_text, req.context, req.category_guidance
                )
                for concept in segment_result.get("concepts", []):
                    concept["source_topic"] = topic
                    all_concepts.append(concept)
                segment_summaries.append(
                    f"{topic}: {segment_result.get('summary', '')}"
                )
            # Deduplicate concepts by title (case insensitive)
            unique_concepts = {}
            for concept in all_concepts:
                # Use exact title for deduplication, not lowercase
                title_key = concept["title"]
                if title_key in unique_concepts:
                    existing = unique_concepts[title_key]
                    if concept.get("confidence_score", 0) > existing.get("confidence_score", 0):
                        unique_concepts[title_key] = concept
                    elif (concept.get("confidence_score", 0) == existing.get("confidence_score", 0) and
                          len(concept.get("codeSnippets", [])) > len(existing.get("codeSnippets", []))):
                        unique_concepts[title_key] = concept
                else:
                    unique_concepts[title_key] = concept
            deduplicated_concepts = list(unique_concepts.values())
            result = {
                "concepts": deduplicated_concepts,
                "summary": " | ".join(segment_summaries),
                "metadata": {
                    "extraction_time": datetime.now().isoformat(),
                    "model_used": self.model,
                    "concept_count": len(deduplicated_concepts),
                    "segment_count": len(segments)
                }
            }
            self.cache[cache_key] = result
            return result
        except Exception as e:
            print(f"Error analyzing conversation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def _get_technique_info(self, technique: str, problem_title: str) -> Tuple[str, List[str], str]:
        """Get rich description and key points for a technique."""
        tech_lower = technique.lower()
        
        # Default description
        description = f"A key technique used in {problem_title}."
        key_points = [f"Used to solve {problem_title} efficiently"]
        implementation = f"This technique is commonly implemented in problems like {problem_title}."
        
        # Technique-specific content
        if "hash table" in tech_lower or "dictionary" in tech_lower:
            description = f"A data structure that maps keys to values using a hash function, allowing for efficient lookups with average O(1) time complexity."
            key_points = [
                "Provides O(1) average time complexity for lookups, insertions, and deletions",
                "Maps keys to values using a hash function",
                "Handles collisions through techniques like chaining or open addressing",
                "Essential for problems requiring fast element lookup or counting",
                "Implemented as Dictionary in Python, HashMap in Java, and similar constructs in other languages"
            ]
            implementation = (
                "Hash tables work by transforming a key into an array index using a hash function. "
                "This allows for direct access to values without needing to search through the entire data structure. "
                f"In problems like {problem_title}, hash tables enable efficient element tracking and duplicate detection."
            )
            
        elif "frequency count" in tech_lower:
            description = f"A technique that counts occurrences of elements in a collection, typically implemented using hash tables."
            key_points = [
                "Tracks the number of occurrences of each element",
                "Typically implemented using a hash table/dictionary",
                "Enables verification of character or element distribution",
                "Common in string manipulation, anagram detection, and duplicate finding",
                "Usually achieves O(n) time complexity where n is the input size"
            ]
            implementation = (
                "Frequency counting creates a map where keys are elements and values are their counts. "
                "By iterating through the collection once, we build this frequency map, which can then "
                "be used to solve various problems efficiently. "
                f"For {problem_title}, it helps track which elements have been seen before."
            )
            
        elif "two pointer" in tech_lower:
            description = f"An algorithm technique using two pointers to traverse a data structure, often reducing time complexity from O(n²) to O(n)."
            key_points = [
                "Uses two pointers that move through the data structure",
                "Often reduces time complexity from O(n²) to O(n)",
                "Commonly used for array, linked list, and string problems",
                "Effective for search, comparison, and subarray problems",
                "Can operate with pointers moving in the same or opposite directions"
            ]
            implementation = (
                "The two-pointer technique involves maintaining two reference points within a data structure. "
                "These pointers can move toward each other (for problems like finding pairs with a target sum), "
                "away from each other (for expanding around a center), or in the same direction (for sliding window problems). "
                f"While not typically used for {problem_title}, it's essential for many other algorithm challenges."
            )
            
        elif "sliding window" in tech_lower:
            description = f"A technique for processing sequential data elements using a window that slides through the data."
            key_points = [
                "Maintains a 'window' of elements that expands or contracts",
                "Avoids recomputation by tracking window state incrementally",
                "Typically reduces O(n²) or worse solutions to O(n)",
                "Ideal for subarray or substring problems with constraints",
                "Used for finding subarrays with specific properties"
            ]
            implementation = (
                "The sliding window approach works by maintaining a range of elements (the window) "
                "that meets certain criteria. As the window slides through the data, we incrementally "
                "update the state based on elements entering and leaving the window, avoiding redundant calculations. "
                "This achieves linear time complexity for problems that would otherwise require nested loops."
            )
            
        elif "binary search" in tech_lower:
            description = f"A divide-and-conquer search algorithm that finds elements in a sorted array in logarithmic time."
            key_points = [
                "Works on sorted data structures",
                "Achieves O(log n) time complexity",
                "Repeatedly divides the search space in half",
                "Can be applied to answer Yes/No questions on monotonic functions",
                "Effective for finding elements or boundaries in sorted collections"
            ]
            implementation = (
                "Binary search divides the search space in half at each step. "
                "Starting with the entire range, we compare the middle element with our target, then eliminate "
                "half of the remaining elements based on that comparison. This continues until the target is found "
                "or the search space is empty, resulting in O(log n) time complexity."
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


# Initialize the concept extractor
concept_extractor = ConceptExtractor()


@app.post("/api/v1/extract-concepts")
async def extract_concepts(req: ConversationRequest):
    """Extract technical concepts from a conversation with comprehensive analysis and logging."""
    request_start_time = datetime.now()
    logger.info("🌟 === NEW EXTRACTION REQUEST ===")
    logger.info(f"📊 Request size: {len(req.conversation_text)} characters")
    
    try:
        # Pass along any category_guidance to the analyzer
        logger.info("🔄 Starting concept extraction analysis...")
        result = await concept_extractor.analyze_conversation(req)
        
        # Standardize the response format to ensure consistency
        logger.info("🔧 Standardizing response format...")
        standardized_result = standardize_response_format(result)
        
        # COMPREHENSIVE RESPONSE LOGGING
        logger.info("=== 📋 FINAL RESPONSE ANALYSIS ===")
        logger.info(f"✅ Summary: {standardized_result.get('summary', 'NONE')}")
        logger.info(f"✅ Conversation Summary: {standardized_result.get('conversation_summary', 'NONE')}")
        logger.info(f"✅ Number of concepts: {len(standardized_result.get('concepts', []))}")
        
        # Log detailed concept analysis
        if standardized_result.get('concepts'):
            logger.info("📚 EXTRACTED CONCEPTS BREAKDOWN:")
            for i, concept in enumerate(standardized_result.get('concepts')):
                title = concept.get('title', 'UNTITLED')
                category = concept.get('category', 'UNKNOWN')
                summary_length = len(concept.get('summary', ''))
                details_length = len(str(concept.get('details', '')))
                code_snippets = len(concept.get('codeSnippets', []))
                key_points = len(concept.get('keyPoints', []))
                related_concepts = len(concept.get('relatedConcepts', []))
                confidence = concept.get('confidence_score', 0)
                
                logger.info(f"  📖 Concept {i+1}: '{title}'")
                logger.info(f"    🏷️  Category: {category}")
                logger.info(f"    📝 Summary: {summary_length} chars")
                logger.info(f"    📋 Details: {details_length} chars")
                logger.info(f"    💻 Code snippets: {code_snippets}")
                logger.info(f"    🔑 Key points: {key_points}")
                logger.info(f"    🔗 Related concepts: {related_concepts}")
                logger.info(f"    🎯 Confidence: {confidence:.2f}")
                logger.debug(f"    📄 All fields: {', '.join(concept.keys())}")
                
                # Log code snippets details
                if concept.get('codeSnippets'):
                    for j, snippet in enumerate(concept['codeSnippets']):
                        lang = snippet.get('language', 'unknown')
                        code_length = len(snippet.get('code', ''))
                        logger.debug(f"      💻 Code {j+1}: {lang} ({code_length} chars)")
        else:
            logger.warning("⚠️  WARNING: No concepts in final response!")
        
        # Log metadata
        metadata = standardized_result.get('metadata', {})
        logger.info("📊 METADATA:")
        logger.info(f"  ⏱️  Extraction time: {metadata.get('extraction_time', 'UNKNOWN')}")
        logger.info(f"  🤖 Model used: {metadata.get('model_used', 'UNKNOWN')}")
        logger.info(f"  📈 Concept count: {metadata.get('concept_count', 0)}")
        logger.info(f"  🔧 Processing success rate: {metadata.get('processing_success_rate', 'N/A')}")
        
        # Calculate total request time
        request_end_time = datetime.now()
        total_time = (request_end_time - request_start_time).total_seconds()
        logger.info(f"⏱️  TOTAL REQUEST TIME: {total_time:.2f} seconds")
        
        logger.info("🎉 === EXTRACTION COMPLETED SUCCESSFULLY ===")
        return standardized_result
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in extract_concepts: {str(e)}")
        logger.error(f"🔍 Error type: {type(e).__name__}")
        logger.error(f"📍 Traceback: {traceback.format_exc()}")
        
        # Create emergency fallback response in case of critical error
        logger.warning("🚨 Creating emergency fallback response...")
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
                "error": str(e),
                "error_type": type(e).__name__
            }
        }
        
        logger.info("🔧 Returning emergency fallback response")
        return emergency_fallback

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

@app.get("/api/v1/health")
async def health_check():
    """Check if the service is healthy."""
    return {
        "status": "ok",
        "api_key_configured": bool(OPENAI_API_KEY),
        "cache_size": len(concept_extractor.cache),
        "service": "Technical Concept Extractor"
    }