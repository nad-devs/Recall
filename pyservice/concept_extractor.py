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

    def _parse_structured_response(self, response_text: str) -> Dict:
        """Parse the structured response from the model with improved error handling."""
        try:
            response_data = json.loads(response_text)
            
            # Validate and process concepts
            concepts = []
            for concept in response_data.get("concepts", []):
                try:
                    if "summary" in concept and "category" not in concept:
                        title_lower = concept["title"].lower()
                        if "problem" in concept["title"]:
                            concept["category"] = "Problem-Solving"
                        elif any(term in title_lower for term in ["backend", "server", "database", "api", "http", "rest", "web service", "microservice"]):
                            concept["category"] = "Backend Engineering"
                        elif any(term in title_lower for term in ["frontend", "ui", "react", "vue", "angular", "dom", "html", "css"]):
                            concept["category"] = "Frontend Engineering"
                        elif any(term in title_lower for term in ["mobile", "ios", "android", "app", "flutter", "react native"]):
                            concept["category"] = "Mobile Development"
                        elif any(term in title_lower for term in ["devops", "ci/cd", "deployment", "container", "docker", "kubernetes"]):
                            concept["category"] = "DevOps"
                        elif any(term in title_lower for term in ["machine learning", "ai", "deep learning", "neural", "nlp"]):
                            concept["category"] = "Machine Learning"
                        else:
                            concept["category"] = "Algorithm Technique"
                    
                    # Ensure summary is short and concise (just 1-2 sentences)
                    if "summary" in concept and len(concept["summary"]) > 150:
                        # Truncate and ensure proper ending
                        concept["summary"] = concept["summary"][:147] + "..."
                    
                    if "keyPoints" in concept and "notes" not in concept:
                        # Create more meaningful notes structure based on content
                        keypoints = concept.get("keyPoints", [])
                        
                        # Use the provided implementation if available, or generate one from summary
                        if "implementation" in concept:
                            detailed_implementation = concept["implementation"]
                        else:
                            # Generate a more detailed implementation from keypoints
                            # This ensures details section is different from summary
                            original_summary = concept.get("summary", "")
                            # Create a more detailed description for the implementation
                            detailed_implementation = original_summary + "\n\n"
                        
                        # Add additional rich context based on the concept type for details section
                        if "server" in concept["title"].lower() or "client" in concept["title"].lower():
                            detailed_implementation += "This model is a fundamental architectural pattern in distributed systems and network applications. "
                            detailed_implementation += "It enables separation of concerns, allowing the presentation layer to be independent from the business logic and data management.\n\n"
                            detailed_implementation += "In a typical client-server setup, multiple clients connect to a central server, which provides resources, services, or application functionality. "
                            detailed_implementation += "This architecture supports scalability as servers can be upgraded to handle increased load, and it centralizes data storage and business logic.\n\n"
                        elif "database" in concept["title"].lower() or "sql" in concept["title"].lower():
                            detailed_implementation += "Database management and optimization are critical aspects of backend engineering. "
                            detailed_implementation += "Proper database design can significantly impact application performance and scalability.\n\n"
                            detailed_implementation += "Effective database implementation requires understanding normalization, indexing strategies, query optimization, and transaction management. "
                            detailed_implementation += "Modern applications often employ a mix of SQL and NoSQL databases to leverage the strengths of each paradigm.\n\n"
                        elif "machine learning" in concept["title"].lower() or "ai" in concept["title"].lower():
                            detailed_implementation += "Machine learning systems involve multiple components from data preparation to model deployment. "
                            detailed_implementation += "Understanding these fundamental concepts is essential for building effective ML applications.\n\n"
                            detailed_implementation += "A complete machine learning pipeline typically includes data collection, cleaning, feature engineering, model selection, training, evaluation, and deployment. "
                            detailed_implementation += "Each stage requires different skills and considerations to ensure the final model performs well in production environments.\n\n"
                        elif "http" in concept["title"].lower() or "api" in concept["title"].lower():
                            detailed_implementation += "HTTP and RESTful APIs are the backbone of modern web communications. "
                            detailed_implementation += "Understanding how requests and responses work is fundamental to web development.\n\n"
                            detailed_implementation += "Modern applications often use JSON as the data format for API communications, and follow REST principles for resource-oriented design. "
                            detailed_implementation += "Authentication, rate limiting, and proper error handling are critical aspects of robust API design.\n\n"
                        
                        # Add key points as paragraphs to create a richer details section
                        if keypoints:
                            detailed_implementation += "The discussion covered several important aspects:\n\n"
                            for point in keypoints:
                                # Expand each point into a paragraph
                                expanded_point = point
                                if len(point) < 100:
                                    # Add more detail for short points to make the details richer
                                    if "supervised" in point.lower():
                                        expanded_point += ". Supervised learning involves training models on labeled data to make predictions."
                                    elif "unsupervised" in point.lower():
                                        expanded_point += ". Unsupervised learning discovers patterns in unlabeled data without predefined outputs."
                                    elif "reinforcement" in point.lower():
                                        expanded_point += ". Reinforcement learning trains agents to make decisions through trial and error with rewards."
                                    elif "classification" in point.lower():
                                        expanded_point += ". Classification models predict discrete categories or classes for input data."
                                    elif "regression" in point.lower():
                                        expanded_point += ". Regression models predict continuous values rather than discrete categories."
                                detailed_implementation += f"• {expanded_point}\n\n"
                        
                        # Add detailed implementation content from keyPoints
                        concept["notes"] = {
                            "principles": keypoints,
                            "implementation": detailed_implementation,
                            "use_cases": [],
                            "edge_cases": [],
                            "performance": ""
                        }
                        
                        # Only add complexity if this is an algorithm or data structure
                        if ("algorithm" in concept.get("title", "").lower() or 
                            "data structure" in concept.get("title", "").lower() or
                            "problem" in concept.get("title", "").lower() or
                            any(tech in concept.get("title", "").lower() for tech in 
                                ["hash table", "dictionary", "frequency", "pointer", "search"])):
                            concept["notes"]["complexity"] = {"time": "O(n)", "space": "O(n)"}
                            
                        # For UI display - preserve keyPoints as a top-level field
                        concept["keyPoints"] = concept.get("keyPoints", [])
                        
                    if "relatedConcepts" in concept and "relationships" not in concept:
                        concept["relationships"] = {
                            "algorithms": [],
                            "data_structures": concept.get("relatedConcepts", [])
                        }
                        
                    # Ensure required fields are present
                    if not all(k in concept for k in ["title", "category", "notes"]):
                        continue

                    # Process and validate concept data
                    # --- Handle both codeExamples, code_examples, and codeSnippets ---
                    code_examples = self._process_code_examples(
                        concept.get("codeExamples", []) + concept.get("code_examples", []) + concept.get("codeSnippets", [])
                    )
                    # --- Handle both relationships and related_concepts ---
                    relationships = self._process_relationships(
                        concept.get("relationships", concept.get("related_concepts", {}))
                    )

                    notes = self._process_notes(concept.get("notes", {}))
                    learning_resources = self._process_learning_resources(
                        concept.get("learningResources", {})
                    )

                    # Ensure key techniques are prominently featured in problem-solving concepts
                    key_techniques = []
                    
                    # Check if this is a problem-solving concept
                    is_problem = (
                        "problem" in concept["title"].lower() or 
                        concept["category"].lower() in ["problem-solving", "algorithm", "leetcode", "coding challenge"]
                    )
                    
                    if is_problem:
                        # Extract key techniques from various fields
                        for ds in relationships.get("data_structures", []):
                            if ds not in key_techniques:
                                key_techniques.append(ds)
                                
                        for algo in relationships.get("algorithms", []):
                            if algo not in key_techniques:
                                key_techniques.append(algo)
                                
                        # Look for key techniques in titles, categories, and principles
                        for technique in ["hash table", "frequency count", "two pointer", "sliding window", 
                                         "dynamic programming", "depth-first search", "breadth-first search"]:
                            # If technique is mentioned in title, category, or principles, add it
                            if (technique in concept["title"].lower() or 
                                technique in concept.get("category", "").lower() or
                                any(technique in p.lower() for p in notes.get("principles", []))):
                                if technique.title() not in key_techniques:
                                    key_techniques.append(technique.title())
                        
                        # Add key techniques to principles if not already there
                        for technique in key_techniques:
                            principle = f"Uses {technique} to solve the problem efficiently"
                            if principle not in notes.get("principles", []):
                                notes.setdefault("principles", []).append(principle)
                    
                    # --- Transform to flat structure for frontend ---
                    processed_concept = {
                        "title": concept["title"],
                        "category": concept["category"],
                        "subcategories": concept.get("subcategories", []) + key_techniques,
                        # Keep summary concise for Summary tab view
                        "summary": concept.get("summary", notes.get("implementation", "")[:150]),
                        # Keep keyPoints for Key Points section
                        "keyPoints": concept.get("keyPoints", notes.get("principles", [])),
                        "details": {
                            "implementation": notes.get("implementation", ""),
                            "complexity": notes.get("complexity", {}),
                            "useCases": notes.get("use_cases", []),
                            "edgeCases": notes.get("edge_cases", []),
                            "performance": notes.get("performance", ""),
                            "interviewQuestions": learning_resources.get(
                                "interview_questions", []
                            ),
                            "practiceProblems": learning_resources.get(
                                "practice_problems", []
                            ),
                            "furtherReading": learning_resources.get(
                                "further_reading", []
                            ),
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
                        "relatedConcepts": (
                            relationships.get("data_structures", []) +
                            relationships.get("algorithms", []) +
                            relationships.get("patterns", []) +
                            relationships.get("applications", []) +
                            key_techniques  # Add key techniques to related concepts
                        ),
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
            raise HTTPException(
                status_code=500, detail=f"Error parsing response: {str(e)}"
            )

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

    async def _segment_conversation(self, conversation_text: str) -> List[Tuple[str, str]]:
        """
        Segment the conversation into topical sections.
        Returns a list of (topic, segment_text) tuples.
        """
        try:
            print("Segmenting conversation...")
            segmentation_prompt = (
                "Your task is to analyze the following conversation and identify ONLY MAJOR topic changes:\n"
                "First, determine if this is:\n"
                "1. A PROBLEM-SOLVING conversation (discussing a specific algorithm or coding problem)\n"
                "2. An EXPLORATORY LEARNING conversation (learning about a technology or concept)\n\n"
                "For PROBLEM-SOLVING conversations:\n"
                "- Use ONE segment for each distinct problem discussed\n"
                "- Do NOT create separate segments for different approaches to the same problem\n"
                "- When naming the topic, include the main technique used (e.g., 'Contains Duplicate Problem (Hash Table)')\n"
                "- Example: 'Contains Duplicate Problem (Hash Table)' or 'Valid Anagram (Frequency Counting)'\n\n"
                "For EXPLORATORY LEARNING conversations:\n"
                "- Segment by major topic changes (e.g., 'NLP Basics' to 'Database Systems')\n"
                "- Sub-topics within the same area should stay in the same segment\n"
                "- Example: Learning about 'Tokenization', 'Word Embeddings', and 'BERT' would be ONE segment about 'NLP'\n\n"
                "General rules:\n"
                "1. Identify MAJOR distinct topics being discussed (not implementation details)\n"
                "2. Give each segment a descriptive title that includes the main techniques used (for problem-solving)\n"
                "3. Aim for 1-3 segments MAXIMUM for most conversations\n\n"
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
                "Here's the conversation to segment:\n"
                f"\"\"\"\n{conversation_text}\n\"\"\"\n"
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": segmentation_prompt}],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content
            segmentation_data = json.loads(response_text)
            
            segments = []
            conversation_type = segmentation_data.get("conversation_type", "UNKNOWN")
            print(f"Detected conversation type: {conversation_type}")
            
            for segment in segmentation_data.get("segments", []):
                topic = segment.get("topic", "Uncategorized")
                content = segment.get("content", "")
                main_technique = segment.get("main_technique", "")
                
                if content:
                    # Add conversation type and technique to topic for better context in the analysis stage
                    if conversation_type == "PROBLEM_SOLVING" and main_technique:
                        tagged_topic = f"[{conversation_type}] {topic} [TECHNIQUE:{main_technique}]"
                    else:
                        tagged_topic = f"[{conversation_type}] {topic}"
                    segments.append((tagged_topic, content))
            
            # If no segments or too many segments, just use the whole conversation
            if not segments or len(segments) > 5:
                segments = [(f"[UNKNOWN] Full Conversation", conversation_text)]
                
            print(f"Conversation segmented into {len(segments)} topics")
            return segments
            
        except Exception as e:
            print(f"Error segmenting conversation: {str(e)}")
            return [("Full Conversation", conversation_text)]

    async def _analyze_segment(
        self, topic: str, segment_text: str, context: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a single conversation segment.
        """
        print(f"Analyzing segment: {topic[:50]}...")

        # Determine segment type from topic tag
        segment_type = "EXPLORATORY_LEARNING"
        if topic.strip().upper().startswith("[PROBLEM_SOLVING]"):
            segment_type = "PROBLEM_SOLVING"

        if segment_type == "PROBLEM_SOLVING":
            structured_prompt = (
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
                "For EACH concept, provide:\n"
                "- A clear, specific title focusing on the concept (problem, data structure, algorithm, or topic).\n"
                "- A unique, concise 'summary' field (1-2 sentences) that gives a quick overview specific to this concept only.\n"
                "- A different, detailed 'implementation' field with in-depth technical explanation for this specific concept.\n"
                "- 2-5 key points summarizing the most important takeaways specific to this concept.\n"
                "- Related concepts if relevant.\n"
                "- (Optional) code example if present in the conversation.\n\n"
                "IMPORTANT: Each concept MUST have its own unique summary and details - do not copy or reuse content between concepts.\n\n"
                f"SEGMENT INFORMATION:\nTopic: {topic}\n\n"
                f"CONTEXT INFORMATION:\n{json.dumps(context) if context else 'No additional context provided'}\n\n"
                "ANALYZE THIS CONVERSATION SEGMENT according to the problem-solving extraction approach above.\n\n"
                "Respond in this JSON format:\n"
                "{\n"
                '    "concepts": [\n'
                "        {\n"
                '            "title": "Main Problem or Technique",\n'
                '            "summary": "A unique, concise summary specific to this concept only.",\n'
                '            "implementation": "Detailed technical explanation specific to this concept only.",\n'
                '            "keyPoints": ["Key point 1", "Key point 2"],\n'
                '            "relatedConcepts": ["Related Concept 1", "Related Concept 2"],\n'
                '            "codeSnippets": [\n'
                "                {\n"
                '                    "language": "Language name",\n'
                '                    "code": "Code with comments",\n'
                '                    "explanation": "Explanation of the code"\n'
                "                }\n"
                "            ],\n"
                '            "category": "Backend Engineering",\n'
                '            "subcategories": ["Backend Engineering"]\n'
                "        }\n"
                "    ]\n"
                '}\n\n'
                f"Conversation Segment:\n\"\"\"\n{segment_text}\n\"\"\"\n"
            )
        else:
            # Exploratory/learning prompt
            structured_prompt = (
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
                "For EACH concept, provide:\n"
                "- A clear, specific title focusing on the concept (problem, data structure, algorithm, or topic).\n"
                "- A unique, concise 'summary' field (1-2 sentences) that gives a quick overview specific to this concept only.\n"
                "- A different, detailed 'implementation' field with in-depth technical explanation for this specific concept.\n"
                "- 2-5 key points summarizing the most important takeaways specific to this concept.\n"
                "- Related concepts if relevant.\n"
                "- (Optional) code example if present in the conversation.\n\n"
                "IMPORTANT: Each concept MUST have its own unique summary and details - do not copy or reuse content between concepts.\n\n"
                f"SEGMENT INFORMATION:\nTopic: {topic}\n\n"
                f"CONTEXT INFORMATION:\n{json.dumps(context) if context else 'No additional context provided'}\n\n"
                "ANALYZE THIS CONVERSATION SEGMENT according to the exploratory learning extraction approach above.\n\n"
                "Respond in this JSON format:\n"
                "{\n"
                '    "concepts": [\n'
                "        {\n"
                '            "title": "Main Concept or Topic",\n'
                '            "summary": "A unique, concise summary specific to this concept only.",\n'
                '            "implementation": "Detailed technical explanation specific to this concept only.",\n'
                '            "keyPoints": ["Key point 1", "Key point 2"],\n'
                '            "relatedConcepts": ["Related Concept 1", "Related Concept 2"],\n'
                '            "codeSnippets": [\n'
                "                {\n"
                '                    "language": "Language name",\n'
                '                    "code": "Code with comments",\n'
                '                    "explanation": "Explanation of the code"\n'
                "                }\n"
                "            ],\n"
                '            "category": "Backend Engineering",\n'
                '            "subcategories": ["Backend Engineering"]\n'
                "        }\n"
                "    ]\n"
                '}\n\n'
                f"Conversation Segment:\n\"\"\"\n{segment_text}\n\"\"\"\n"
            )

        # DEBUG LOGGING
        print("=== LLM PROMPT ===")
        print(structured_prompt)
        print("=== SEGMENT CONTENT ===")
        print(segment_text)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": structured_prompt}],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        response_text = response.choices[0].message.content
        # DEBUG LOGGING
        print("=== RAW LLM RESPONSE ===")
        print(response_text)
        return self._parse_structured_response(response_text)

    async def analyze_conversation(self, req: ConversationRequest) -> Dict:
        """Analyze a conversation using a single-pass approach by default for speed. Use multi-pass only as fallback."""
        try:
            # Check cache first
            cache_key = self._generate_cache_key(req.conversation_text)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                return cached_response

            print(f"Analyzing conversation (single-pass): {req.conversation_text[:100]}...")

            # Single-pass: analyze the whole conversation with the improved prompt
            single_pass_result = await self._analyze_segment(
                "Full Conversation", req.conversation_text, req.context
            )

            # If we get at least one concept, return it
            if single_pass_result.get("concepts"):
                # Simple title-based deduplication (keep highest confidence)
                unique_concepts = {}
                for concept in single_pass_result.get("concepts", []):
                    title_lower = concept["title"].lower()
                    if (title_lower not in unique_concepts or 
                            concept.get("confidence_score", 0) > unique_concepts[title_lower].get("confidence_score", 0)):
                        unique_concepts[title_lower] = concept
                
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
                
                single_pass_result["concepts"] = concepts
                self.cache[cache_key] = single_pass_result
                return single_pass_result

            # Fallback: try multi-pass (segmentation + per-segment analysis)
            print("Single-pass yielded no concepts. Trying multi-pass fallback...")
            segments = await self._segment_conversation(req.conversation_text)
            all_concepts = []
            segment_summaries = []
            for topic, segment_text in segments:
                segment_result = await self._analyze_segment(
                    topic, segment_text, req.context
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
                title_lower = concept["title"].lower()
                if title_lower in unique_concepts:
                    existing = unique_concepts[title_lower]
                    if concept.get("confidence_score", 0) > existing.get("confidence_score", 0):
                        unique_concepts[title_lower] = concept
                    elif (concept.get("confidence_score", 0) == existing.get("confidence_score", 0) and
                          len(concept.get("codeSnippets", [])) > len(existing.get("codeSnippets", []))):
                        unique_concepts[title_lower] = concept
                else:
                    unique_concepts[title_lower] = concept
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