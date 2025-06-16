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
    custom_api_key: Optional[str] = None  # User's custom OpenAI API key


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


class CategoryLearning:
    """
    CATEGORY LEARNING AND MAPPING SYSTEM
    Handles manual category updates and learning for improved categorization.
    """
    def __init__(self, learning_file_path: str = "category_learning.json"):
        self.learning_file_path = learning_file_path
        self.learned_mappings = self._load_learned_mappings()
        logger.info(f"📚 CategoryLearning initialized with {len(self.learned_mappings)} learned mappings")
    
    def _load_learned_mappings(self) -> Dict[str, Dict]:
        """Load learned category mappings from file."""
        try:
            if os.path.exists(self.learning_file_path):
                with open(self.learning_file_path, 'r') as f:
                    data = json.load(f)
                    logger.debug(f"Loaded {len(data)} learned mappings from {self.learning_file_path}")
                    return data
        except Exception as e:
            logger.warning(f"Failed to load learned mappings: {e}")
        return {}
    
    def _save_learned_mappings(self):
        """Save learned category mappings to file."""
        try:
            with open(self.learning_file_path, 'w') as f:
                json.dump(self.learned_mappings, f, indent=2)
            logger.debug(f"Saved {len(self.learned_mappings)} learned mappings to {self.learning_file_path}")
        except Exception as e:
            logger.error(f"Failed to save learned mappings: {e}")
    
    def record_manual_update(self, content_snippet: str, old_category: str, new_category: str):
        """
        Record a manual category update for future learning.
        
        Args:
            content_snippet: Representative text from the concept
            old_category: Category that was automatically assigned
            new_category: Category manually updated by user
        """
        # Create a simple hash key from content snippet
        content_key = hashlib.md5(content_snippet.lower().encode()).hexdigest()[:16]
        
        mapping_entry = {
            "content_preview": content_snippet[:100],  # For debugging
            "old_category": old_category,
            "new_category": new_category,
            "updated_at": datetime.now().isoformat(),
            "confidence": 1.0  # User manual updates have high confidence
        }
        
        self.learned_mappings[content_key] = mapping_entry
        self._save_learned_mappings()
        
        logger.info(f"📝 Recorded manual category update: '{old_category}' → '{new_category}'")
    
    def suggest_category_from_learning(self, content: str) -> Optional[str]:
        """
        Suggest a category based on learned mappings.
        
        Args:
            content: Text content to analyze
            
        Returns:
            Suggested category if found, None otherwise
        """
        content_lower = content.lower()
        
        # Simple keyword matching with learned content
        for mapping_data in self.learned_mappings.values():
            content_preview = mapping_data.get("content_preview", "").lower()
            
            # Check for keyword overlap (simple approach)
            if content_preview and len(content_preview) > 20:
                # Extract key words from learned content
                learned_words = set(re.findall(r'\b\w{4,}\b', content_preview))
                current_words = set(re.findall(r'\b\w{4,}\b', content_lower))
                
                # If there's significant word overlap, suggest the learned category
                overlap = len(learned_words.intersection(current_words))
                if overlap >= 2:  # At least 2 key words in common
                    suggestion = mapping_data.get("new_category")
                    logger.debug(f"🎯 Found learned category suggestion: '{suggestion}' (overlap: {overlap} words)")
                    return suggestion
        
        return None
    
    def get_learning_stats(self) -> Dict:
        """Get statistics about learned mappings."""
        if not self.learned_mappings:
            return {"total_mappings": 0, "categories": []}
        
        categories = [mapping["new_category"] for mapping in self.learned_mappings.values()]
        category_counts = {}
        for cat in categories:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        return {
            "total_mappings": len(self.learned_mappings),
            "categories": category_counts,
            "last_update": max(mapping.get("updated_at", "") for mapping in self.learned_mappings.values())
        }


class ConceptExtractor:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.model = "gpt-4o"
        self.max_retries = 3
        self.retry_delay = 1
        self.cache = {}
        # CATEGORY LEARNING SYSTEM - Initialize category learning for manual updates
        self.category_learning = CategoryLearning()
        logger.info(f"ConceptExtractor initialized with model: {self.model}")
        logger.info(f"📚 Category learning system ready with {len(self.category_learning.learned_mappings)} learned mappings")
    
    def _get_client(self, custom_api_key: Optional[str] = None) -> AsyncOpenAI:
        """Get OpenAI client - either custom user's client or default server client."""
        if custom_api_key:
            logger.info(f"🔑 Using custom API key: {custom_api_key[:10]}...")
            return AsyncOpenAI(api_key=custom_api_key)
        else:
            logger.info("🔑 Using server's API key")
            return self.client

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
            # Core Computer Science (PRESERVE EXISTING TECHNICAL CATEGORIES)
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
            
            # Technical (preserve existing)
            "System Design",
            "Machine Learning",
            
            # NON-TECHNICAL DOMAIN SUPPORT - Add support for non-technical categories
            "General",  # Fallback category
            "Finance",
            "Finance > Investment",
            "Finance > Personal Finance", 
            "Finance > Business Finance",
            "Finance > Stock Analysis",
            "Psychology",
            "Psychology > Behavioral",
            "Psychology > Cognitive",
            "Business",
            "Business > Strategy",
            "Business > Management",
            "Business > Marketing",
            "Health",
            "Health > Nutrition",
            "Health > Fitness",
            "Education",
            "Education > Learning Methods",
            "Science",
            "Science > Physics",
            "Science > Biology",
            "Philosophy",
            "History",
            "Politics",
            "Economics",
            "Arts",
            "Literature",
            "Travel",
            "Lifestyle",
            "Miscellaneous"  # Final fallback
        ]
        try:
            async with httpx.AsyncClient() as client:
                # Get frontend URL from environment variable
                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
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

    async def _suggest_category_llm(self, title: str, summary: str, custom_api_key: Optional[str] = None) -> Optional[str]:
        """Ask the LLM to suggest the best category for a concept."""
        logger.debug(f"Requesting LLM category suggestion for: {title}")
        categories = await self._fetch_categories()
        
        # ENHANCED CATEGORIZATION PROMPT - Comprehensive rules for better classification
        prompt = f"""You are an expert content categorizer. Analyze the concept and choose the MOST SPECIFIC and APPROPRIATE category.

CATEGORIZATION RULES & PRIORITY ORDER:

🔹 PROGRAMMING LANGUAGES (Highest Priority for Language-Specific Content):
- "Python" → Python sets, lists, dictionaries, syntax, language features
- "JavaScript" → JS arrays, objects, ES6 features, language specifics  
- "TypeScript" → TS types, interfaces, language features
- Use language categories for data structures, syntax, and language-specific features

🔹 CORE COMPUTER SCIENCE:
- "Data Structures" → Arrays, linked lists, trees, graphs, hash tables
- "Algorithms" → Sorting, searching, graph algorithms, dynamic programming
- "Data Structures and Algorithms" → Combined DSA topics
- "LeetCode Problems" → Specific coding challenges and problem-solving

🔹 DEVELOPMENT DOMAINS:
- "Backend Engineering" → Server architecture, system design, scalability
- "Frontend Engineering" → UI/UX, user interfaces, client-side architecture
- "Backend Engineering > APIs" → REST, GraphQL, API design patterns
- "Backend Engineering > Databases" → Database design, SQL optimization, schemas

🔹 NON-TECHNICAL DOMAINS (Equal Priority):
- "Finance" → Money management, investing, economic concepts
- "Psychology" → Mental health, behavior, cognitive concepts
- "Business" → Strategy, management, entrepreneurship
- "Health" → Nutrition, fitness, medical topics
- "Education" → Learning methods, teaching, academic concepts

EXAMPLES:
✅ "Sets in Python" → "Python" (language-specific data structure)
✅ "React useState Hook" → "Frontend Engineering > React" (framework feature)
✅ "Binary Search Algorithm" → "Algorithms" (algorithm technique)
✅ "Investment Portfolio Diversification" → "Finance > Investment" (financial concept)
✅ "Cognitive Bias in Decision Making" → "Psychology > Cognitive" (psychological concept)
✅ "Team Leadership Strategies" → "Business > Management" (business concept)

DECISION CRITERIA:
1. Is it language-specific? → Use the programming language category
2. Is it a core CS concept? → Use Data Structures/Algorithms
3. Is it about system architecture? → Use engineering domain categories  
4. Is it non-technical? → Use appropriate domain category
5. When unsure → Choose the MOST SPECIFIC category available

Available Categories: {categories}

Concept to Categorize:
Title: {title}
Summary: {summary}

Respond with ONLY the exact category name from the list above. If no perfect match exists, choose the closest/most general appropriate category."""

        try:
            client = self._get_client(custom_api_key)
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,  # Slightly higher for better reasoning
                max_tokens=50  # Allow for longer category names
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
        """
        ENHANCED CATEGORY NORMALIZATION with Non-Technical Support
        Normalize a suggested category to match the valid categories list.
        """
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
                
        # EXTENDED CATEGORY MAPPING - Enhanced with non-technical keywords
        category_mapping = {
            # Core Computer Science (PRESERVE EXISTING MAPPINGS)
            "dsa": "Data Structures and Algorithms",
            "data structure": "Data Structures", 
            "algorithm": "Algorithms",
            "technique": "Algorithm Technique",
            "leetcode": "LeetCode Problems",
            "coding challenge": "LeetCode Problems",
            "problem solving": "LeetCode Problems",
            
            # ENHANCED PROGRAMMING LANGUAGE MAPPING - More specific detection
            # Python-specific
            "python": "Python",
            "sets in python": "Python",
            "python set": "Python", 
            "python list": "Python",
            "python dict": "Python",
            "python string": "Python",
            "python tuple": "Python",
            "python class": "Python",
            "python function": "Python",
            "python module": "Python",
            "python package": "Python",
            "python syntax": "Python",
            "python feature": "Python",
            "python data structure": "Python",
            "python collection": "Python",
            "python standard library": "Python",
            "python built-in": "Python",
            
            # JavaScript-specific  
            "javascript": "JavaScript",
            "js": "JavaScript",
            "javascript array": "JavaScript",
            "javascript object": "JavaScript",
            "javascript function": "JavaScript",
            "javascript method": "JavaScript",
            "javascript syntax": "JavaScript",
            "es6": "JavaScript",
            "javascript feature": "JavaScript",
            
            # TypeScript-specific
            "typescript": "TypeScript", 
            "ts": "TypeScript",
            "typescript type": "TypeScript",
            "typescript interface": "TypeScript",
            "typescript generic": "TypeScript",
            
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
            "html": "Frontend Engineering",
            
            # Cloud & DevOps
            "cloud": "Cloud Engineering",
            "aws": "Cloud Engineering > AWS",
            "docker": "DevOps",
            "kubernetes": "DevOps",
            "devops": "DevOps",
            
            # System & ML
            "system": "System Design",
            "ml": "Machine Learning",
            "ai": "Machine Learning",
            "machine learning": "Machine Learning",
            "artificial intelligence": "Machine Learning",
            
            # NON-TECHNICAL DOMAIN MAPPINGS - Add comprehensive non-technical keyword mapping
            # Finance
            "money": "Finance",
            "investment": "Finance > Investment",
            "investing": "Finance > Investment",
            "stock": "Finance > Stock Analysis",
            "stocks": "Finance > Stock Analysis",
            "trading": "Finance > Stock Analysis",
            "portfolio": "Finance > Investment",
            "budget": "Finance > Personal Finance",
            "budgeting": "Finance > Personal Finance",
            "savings": "Finance > Personal Finance",
            "retirement": "Finance > Personal Finance",
            "financial planning": "Finance > Personal Finance",
            "business finance": "Finance > Business Finance",
            "corporate finance": "Finance > Business Finance",
            
            # Psychology
            "psychology": "Psychology",
            "behavior": "Psychology > Behavioral",
            "behavioral": "Psychology > Behavioral",
            "cognitive": "Psychology > Cognitive",
            "mental health": "Psychology",
            "therapy": "Psychology",
            "mindset": "Psychology",
            
            # Business
            "business": "Business",
            "strategy": "Business > Strategy",
            "management": "Business > Management",
            "marketing": "Business > Marketing",
            "leadership": "Business > Management",
            "entrepreneurship": "Business > Strategy",
            "startup": "Business > Strategy",
            
            # Health & Wellness
            "health": "Health",
            "nutrition": "Health > Nutrition",
            "diet": "Health > Nutrition",
            "fitness": "Health > Fitness",
            "exercise": "Health > Fitness",
            "workout": "Health > Fitness",
            "wellness": "Health",
            
            # Education & Learning
            "learning": "Education > Learning Methods",
            "education": "Education",
            "teaching": "Education",
            "study": "Education > Learning Methods",
            "academic": "Education",
            
            # Sciences
            "science": "Science",
            "physics": "Science > Physics",
            "biology": "Science > Biology",
            "chemistry": "Science",
            "research": "Science",
            
            # Humanities
            "philosophy": "Philosophy",
            "history": "History",
            "politics": "Politics",
            "government": "Politics",
            "economics": "Economics",
            "economy": "Economics",
            "literature": "Literature",
            "art": "Arts",
            "music": "Arts",
            
            # Lifestyle
            "travel": "Travel",
            "lifestyle": "Lifestyle",
            "personal development": "Lifestyle",
            "self improvement": "Lifestyle",
            "productivity": "Lifestyle"
        }
        
        # Try fuzzy matching with enhanced mappings
        for keyword, mapped_category in category_mapping.items():
            if keyword in suggested_lower:
                # Verify the mapped category exists in valid categories
                for valid_cat in valid_categories:
                    if mapped_category.lower() == valid_cat.lower():
                        logger.debug(f"Mapped '{suggested_category}' via keyword '{keyword}' to '{valid_cat}'")
                        return valid_cat
        
        # CATEGORY LEARNING INTEGRATION - Check learned mappings before fallback
        learned_suggestion = self.category_learning.suggest_category_from_learning(suggested_category)
        if learned_suggestion and learned_suggestion in valid_categories:
            logger.info(f"🎯 Using learned category mapping: '{suggested_category}' → '{learned_suggestion}'")
            return learned_suggestion
        
        # Final fallback based on context hints
        if any(word in suggested_lower for word in ['technical', 'code', 'programming', 'algorithm', 'software']):
            return "General"  # Technical but unspecified
        elif any(word in suggested_lower for word in ['business', 'finance', 'money', 'investment']):
            return "Finance"
        elif any(word in suggested_lower for word in ['psychology', 'mental', 'behavior', 'cognitive']):
            return "Psychology"
        elif any(word in suggested_lower for word in ['health', 'fitness', 'nutrition', 'wellness']):
            return "Health"
        else:
            return "General"  # Ultimate fallback

    async def _detect_domain_type(self, conversation_text: str, custom_api_key: Optional[str] = None) -> str:
        """
        DOMAIN TYPE DETECTION - Detect if conversation is technical, non-technical, or mixed
        
        Args:
            conversation_text: The conversation to analyze
            custom_api_key: Optional custom API key
            
        Returns:
            Domain type: "TECHNICAL", "NON_TECHNICAL", or "MIXED"
        """
        logger.info("🔍 === STARTING DOMAIN TYPE DETECTION ===")
        
        # First, quick keyword-based detection
        text_lower = conversation_text.lower()
        
        # Technical indicators
        technical_keywords = {
            'code', 'programming', 'algorithm', 'function', 'variable', 'api', 'database', 
            'framework', 'library', 'javascript', 'python', 'react', 'sql', 'html', 'css',
            'leetcode', 'dsa', 'data structure', 'backend', 'frontend', 'server', 'client',
            'debugging', 'software', 'development', 'git', 'deployment', 'testing', 'method',
            'class', 'object', 'array', 'string', 'integer', 'boolean', 'json', 'xml',
            'aws', 'cloud', 'docker', 'kubernetes', 'microservice', 'optimization'
        }
        
        # Non-technical indicators
        non_technical_keywords = {
            'investment', 'finance', 'stock', 'money', 'budget', 'savings', 'portfolio',
            'psychology', 'behavior', 'mental health', 'therapy', 'mindset', 'emotions',
            'business', 'strategy', 'management', 'marketing', 'leadership', 'sales',
            'health', 'nutrition', 'fitness', 'diet', 'exercise', 'wellness', 'medical',
            'education', 'learning', 'teaching', 'study', 'academic', 'school',
            'philosophy', 'ethics', 'history', 'politics', 'economics', 'culture',
            'travel', 'lifestyle', 'personal development', 'relationships', 'family'
        }
        
        # Count keyword occurrences
        technical_score = sum(1 for keyword in technical_keywords if keyword in text_lower)
        non_technical_score = sum(1 for keyword in non_technical_keywords if keyword in text_lower)
        
        logger.debug(f"Keyword analysis - Technical: {technical_score}, Non-technical: {non_technical_score}")
        
        # Quick determination based on clear keyword dominance
        if technical_score >= 3 and non_technical_score <= 1:
            logger.info("🔧 Domain detected: TECHNICAL (keyword analysis)")
            return "TECHNICAL"
        elif non_technical_score >= 2 and technical_score <= 1:
            logger.info("📚 Domain detected: NON_TECHNICAL (keyword analysis)")
            return "NON_TECHNICAL"
        elif technical_score >= 2 and non_technical_score >= 2:
            logger.info("🔀 Domain detected: MIXED (keyword analysis)")
            return "MIXED"
        
        # If keyword analysis is inconclusive, use LLM for deeper analysis
        logger.info("🤖 Using LLM for domain type detection...")
        
        domain_detection_prompt = (
            "Analyze the following conversation and determine if it's primarily about:\n"
            "1. TECHNICAL topics (programming, software development, computer science, algorithms, etc.)\n"
            "2. NON_TECHNICAL topics (finance, psychology, business, health, general knowledge, etc.)\n"
            "3. MIXED (contains significant discussion of both technical and non-technical topics)\n\n"
            
            "Respond with only one word: TECHNICAL, NON_TECHNICAL, or MIXED\n\n"
            
            f"Conversation:\n\"\"\"\n{conversation_text[:2000]}...\n\"\"\""  # Limit text for efficiency
        )
        
        try:
            client = self._get_client(custom_api_key)
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": domain_detection_prompt}],
                temperature=0.0,
                max_tokens=10
            )
            
            domain_type = response.choices[0].message.content.strip().upper()
            
            # Validate response
            if domain_type in ["TECHNICAL", "NON_TECHNICAL", "MIXED"]:
                logger.info(f"🎯 LLM detected domain: {domain_type}")
                return domain_type
            else:
                logger.warning(f"⚠️ Invalid LLM response: {domain_type}, falling back to TECHNICAL")
                return "TECHNICAL"  # Safe fallback
                
        except Exception as e:
            logger.error(f"❌ LLM domain detection failed: {str(e)}")
            logger.warning("🔧 Falling back to TECHNICAL domain")
            return "TECHNICAL"  # Safe fallback to existing behavior

    # OLD METHOD REMOVED - Replaced with _extract_non_technical_insights

    def _parse_structured_response(self, response_text: str) -> Dict:
        """Parse the structured response from the LLM with comprehensive error handling and logging."""
        logger.info("=== PARSING LLM RESPONSE ===")
        logger.info(f"Response length: {len(response_text)} characters")
        logger.debug(f"Raw response preview: {response_text[:500]}...")
        
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
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
                    
                    # Properly format details from implementation/insights if available
                    if "implementation" in concept and "details" not in concept:
                        concept["details"] = concept["implementation"]
                    elif "insights" in concept and "details" not in concept:
                        # Handle non-technical concepts that use "insights" field
                        concept["details"] = concept["insights"]
                    elif "details" not in concept:
                        concept["details"] = concept.get("summary", "")
                        logger.warning(f"Concept {i+1} missing details/implementation/insights, using summary")
                    
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
        """
        ENHANCED FALLBACK EXTRACTION with Non-Technical Support
        Fallback extraction method using regex patterns and domain-aware categorization.
        """
        logger.warning("🔧 Using enhanced fallback extraction method")
        concepts = []
        concept_pattern = r"Title:\s*(.*?)(?=Title:|$)"
        matches = re.finditer(concept_pattern, text, re.DOTALL)
        
        # FALLBACK CATEGORY DETECTION - Try to determine appropriate fallback category
        text_lower = text.lower()
        fallback_category = "General"  # Default fallback
        
        # Simple keyword-based category detection for fallback
        if any(word in text_lower for word in ['investment', 'finance', 'money', 'stock', 'budget']):
            fallback_category = "Finance"
        elif any(word in text_lower for word in ['psychology', 'mental', 'behavior', 'cognitive']):
            fallback_category = "Psychology"
        elif any(word in text_lower for word in ['business', 'strategy', 'management', 'marketing']):
            fallback_category = "Business"
        elif any(word in text_lower for word in ['health', 'fitness', 'nutrition', 'wellness']):
            fallback_category = "Health"
        elif any(word in text_lower for word in ['programming', 'code', 'algorithm', 'software', 'development']):
            fallback_category = "General"  # Technical but unspecified
        
        logger.info(f"🎯 Fallback category detection: '{fallback_category}'")
        
        for match in matches:
            concept_text = match.group(1).strip()
            if concept_text:
                title_match = re.search(r"Title:\s*(.*?)(?:\n|$)", concept_text)
                if title_match:
                    title = title_match.group(1).strip()
                    
                    # ENHANCED FALLBACK CONCEPT CREATION with better categorization
                    concepts.append({
                        "title": title,
                        "category": fallback_category,
                        "categoryPath": [fallback_category],
                        "summary": concept_text[:200] + "..." if len(concept_text) > 200 else concept_text,
                        "details": concept_text,
                        "keyPoints": [
                            "Extracted via fallback method",
                            "May require manual categorization"
                        ],
                        "relatedConcepts": [],
                        "confidence_score": 0.5,
                        "last_updated": datetime.now().isoformat()
                    })
        
        # If no structured concepts found, try to extract basic insights
        if not concepts:
            logger.warning("⚠️ No structured concepts found, attempting basic insight extraction")
            
            # Extract sentences that might contain insights
            sentences = text.split('. ')
            insights = []
            
            for sentence in sentences:
                sentence = sentence.strip()
                # Look for sentences that might contain valuable insights
                if (len(sentence) > 50 and 
                    any(word in sentence.lower() for word in [
                        'important', 'key', 'note', 'remember', 'crucial', 'essential',
                        'strategy', 'approach', 'method', 'technique', 'insight',
                        'learn', 'understand', 'concept', 'principle'
                    ])):
                    insights.append(sentence)
            
            if insights:
                # Create a general concept from insights
                insights_text = '. '.join(insights[:3])  # Limit to first 3 insights
                concepts.append({
                    "title": "Key Insights",
                    "category": fallback_category,
                    "categoryPath": [fallback_category],
                    "summary": "Key insights extracted from the conversation.",
                    "details": insights_text,
                    "keyPoints": insights[:5],  # Up to 5 key points
                    "relatedConcepts": [],
                    "confidence_score": 0.3,
                    "last_updated": datetime.now().isoformat()
                })
        
        logger.info(f"Enhanced fallback extraction found {len(concepts)} concepts")
        
        return {
            "concepts": concepts,
            "summary": "Extracted using enhanced fallback method with domain-aware categorization",
            "conversation_summary": f"Discussion covering {fallback_category.lower()} concepts",
            "metadata": {
                "extraction_time": datetime.now().isoformat(),
                "model_used": self.model,
                "concept_count": len(concepts),
                "extraction_method": "enhanced_fallback",
                "detected_domain": fallback_category
            }
        }

    async def _segment_conversation(self, conversation_text: str, custom_api_key: Optional[str] = None) -> List[Tuple[str, str]]:
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
                "ENHANCED PROBLEM-SOLVING DETECTION:\n"
                "Look for these indicators of PROBLEM-SOLVING conversations:\n"
                "- Mentions of specific LeetCode problems (Contains Duplicate, Valid Anagram, Two Sum, etc.)\n"
                "- References to 'NeetCode', 'Blind 75', 'Blind75', 'LeetCode', or 'DSA practice'\n"
                "- Discussion of algorithm implementation steps or coding approaches\n"
                "- Mentions of data structures in problem-solving context (hash table for duplicates, etc.)\n"
                "- Learning progress tracking ('X down, Y to go', 'problem X of Y')\n"
                "- Step-by-step problem-solving methodology discussions\n"
                "- Coding interview preparation context\n\n"
            )
            
            problem_solving_rules = (
                "For PROBLEM-SOLVING conversations:\n"
                "- Use ONE segment for each distinct problem discussed\n"
                "- Do NOT create separate segments for different approaches to the same problem\n"
                "- When naming the topic, use the EXACT problem name first, then add technique in parentheses\n"
                "- ALWAYS preserve standard LeetCode problem names (e.g., 'Contains Duplicate', not 'Hash Table for Duplicate Detection')\n"
                "- Include learning context if present (e.g., 'Contains Duplicate (NeetCode Blind 75 - Hash Table)')\n"
                "- For DSA practice conversations, include the learning journey context\n"
                "- Examples:\n"
                "  * 'Contains Duplicate (NeetCode Blind 75 - Hash Table)'\n"
                "  * 'Valid Anagram (LeetCode Practice - Frequency Counting)'\n"
                "  * 'Two Sum (DSA Learning - Hash Table)'\n\n"
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

            client = self._get_client(custom_api_key)
            response = await client.chat.completions.create(
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
        self, topic: str, segment_text: str, context: Optional[Dict] = None, category_guidance: Optional[Dict] = None, custom_api_key: Optional[str] = None
    ) -> Dict:
        """
        TRANSFORMATIVE LEARNING INSIGHT EXTRACTION
        NEW PHILOSOPHY: Extract only memorable insights that change thinking, not comprehensive information.
        Focus on actionable takeaways that someone would want to reference 6 months later.
        """
        logger.info("=== STARTING LEARNING INSIGHT EXTRACTION ===")
        logger.info(f"📝 Topic: {topic}")
        logger.info(f"📊 Segment length: {len(segment_text)} characters")
        logger.debug(f"Segment preview: {segment_text[:200]}...")
        
        if context:
            logger.debug(f"Context provided: {list(context.keys())}")
        if category_guidance:
            logger.debug(f"Category guidance provided: {list(category_guidance.keys())}")

        # DOMAIN TYPE DETECTION - Determine if content is technical, non-technical, or mixed
        try:
            domain_type = await self._detect_domain_type(segment_text, custom_api_key)
            logger.info(f"🎯 Detected domain type: {domain_type}")
        except Exception as e:
            logger.error(f"❌ Domain detection failed: {str(e)}")
            domain_type = "TECHNICAL"  # Safe fallback
            logger.warning("🔧 Falling back to TECHNICAL domain analysis")

        # ROUTING LOGIC - Route to appropriate analysis method based on domain
        if domain_type == "NON_TECHNICAL":
            logger.info("📚 Routing to non-technical insight extraction")
            return await self._extract_non_technical_insights(
                topic, segment_text, context, category_guidance, custom_api_key
            )
        elif domain_type == "MIXED":
            logger.info("🔀 Mixed domain detected - using learning-focused analysis")
        else:  # domain_type == "TECHNICAL" or fallback
            logger.info("🔧 Using learning-focused technical analysis")

        # TRANSFORMATIVE INSIGHT EXTRACTION LOGIC
        # Determine insight context from topic tag
        insight_context = "LEARNING_JOURNEY"
        if topic.strip().upper().startswith("[PROBLEM_SOLVING]"):
            insight_context = "PROBLEM_SOLVING"
        
        logger.info(f"🔍 Detected insight context: {insight_context}")
            
        # Handle hierarchical categories if provided
        category_instructions = ""
        if category_guidance and category_guidance.get("use_hierarchical_categories"):
            existing_categories = category_guidance.get("existing_categories", [])
            
            category_instructions = (
                "\n\nCATEGORIZATION GUIDANCE:\n"
                f"Use hierarchical category paths formatted as arrays: e.g., ['Cloud Computing', 'AWS']\n"
                f"Include the 'categoryPath' field in your response.\n\n"
                "FOCUS ON LEARNING CONTEXT:\n"
                "- Match the category to the learning insight, not just the technical topic\n"
                "- Consider the personal growth aspect of the insight\n"
                "- Use specific subcategories when the insight clearly applies\n\n"
            )
            
            if existing_categories:
                category_instructions += "AVAILABLE CATEGORIES:\n"
                for i, path in enumerate(existing_categories[:15]):  # Reduced to prevent prompt bloat
                    path_str = " > ".join(path)
                    category_instructions += f"- {path_str}\n"
            
            category_instructions += (
                "\nEXAMPLES OF INSIGHT-FOCUSED CATEGORIZATION:\n"
                "- Insight about 'AWS Lambda cost optimization' → categoryPath: ['Cloud Computing', 'AWS']\n"
                "- Insight about 'React performance mindset' → categoryPath: ['Frontend Engineering', 'React']\n"
                "- Insight about 'debugging approach' → categoryPath: ['Programming', 'Problem Solving']\n\n"
            )

        # NEW OUTPUT STRUCTURE - Learning Insight Format
        new_output_structure = """
NEW LEARNING INSIGHT OUTPUT FORMAT:

Replace traditional academic extraction with personal learning insights:

STRUCTURE PER INSIGHT:
{
    "insight": "The main learning/mindset shift that changes how you think",
    "example": "Concrete scenario from the content that demonstrates this insight", 
    "application": "How to immediately use this insight in real situations",
    "context": "When this insight matters most or becomes valuable",
    "category": "Appropriate category"
}

INSIGHT QUALITY RULES:
- **Maximum 3 insights per content** (no matter how long)
- **Each insight must pass the "would I reference this?" test**
- **Use specific language, avoid generalities** 
- **Frame for future conversation use**
- **Focus on mindset shifts, not information dumps**

GOOD INSIGHT EXAMPLES:

Technical Example:
{
    "insight": "Build relationships before needing them - networking works best when you're genuinely interested in others' work",
    "example": "Varun networks at Davos without pitching anything, just learning about others' projects",
    "application": "At next event, spend time asking about others' projects instead of promoting mine",
    "context": "Works because people remember genuine interest over sales pitches"
}

Learning Example:
{
    "insight": "Start with syntax, then understand concepts - trying to learn both simultaneously creates confusion",
    "example": "NeetCode approach: first learn Python syntax with simple problems, then focus on algorithmic thinking", 
    "application": "When learning new programming concepts, master the basic syntax first before diving into complex logic",
    "context": "Especially valuable when time-constrained or feeling overwhelmed with new material"
}
"""

        if insight_context == "PROBLEM_SOLVING":
            # PROBLEM-SOLVING INSIGHT EXTRACTION
            transformation_prompt = (
                "You are a LEARNING INSIGHT EXTRACTOR. Your job is to find the memorable insights "
                "that change how someone thinks about problem-solving, NOT to summarize what was discussed.\n\n"
                
                "🎯 MISSION: Extract insights someone would want to remember 6 months later\n\n"
                
                "INSIGHT IDENTIFICATION FOR PROBLEM-SOLVING:\n"
                "1. **MINDSET SHIFTS**: How does this change the way you approach problems?\n"
                "2. **PRACTICAL TECHNIQUES**: What specific approach can you apply immediately?\n" 
                "3. **TIMING WISDOM**: When is this insight most valuable?\n"
                "4. **PATTERN RECOGNITION**: What broader principle does this demonstrate?\n\n"
                
                "🚫 AVOID EXTRACTING:\n"
                "- Code explanations without insight\n"
                "- Generic statements like 'use hash tables'\n"
                "- Academic descriptions of algorithms\n"
                "- Information that doesn't change thinking\n\n"
                
                "✅ EXTRACT INSIGHTS LIKE:\n"
                "- 'Solve the problem first, optimize later - premature optimization leads to overengineering'\n"
                "- 'When stuck, work backwards from the desired output to find the approach'\n" 
                "- 'Hash tables solve most 'find duplicate' problems - recognize this pattern instantly'\n\n"
                
                "QUALITY TEST: Would you actually want to reference this insight when:\n"
                "- Explaining the concept to someone?\n"
                "- Solving a similar problem?\n"
                "- Making a decision in this domain?\n\n"
            )
        else:
            # LEARNING JOURNEY INSIGHT EXTRACTION  
            transformation_prompt = (
                "You are a LEARNING INSIGHT EXTRACTOR. Your job is to find the memorable insights "
                "that change how someone approaches learning, NOT to document what was taught.\n\n"
                
                "🎯 MISSION: Extract insights someone would want to remember and reference later\n\n"
                
                "INSIGHT IDENTIFICATION FOR LEARNING:\n"
                "1. **LEARNING STRATEGIES**: How does this change your approach to learning?\n"
                "2. **IMPLEMENTATION WISDOM**: What's the key to making this work in practice?\n"
                "3. **MENTAL MODELS**: How does this shift your understanding?\n"
                "4. **PRACTICAL APPLICATIONS**: Where would you apply this insight?\n\n"
                
                "🚫 AVOID EXTRACTING:\n"
                "- Definitions and explanations\n"
                "- Step-by-step tutorials\n"
                "- Technical details without insight\n"
                "- Information you could easily look up\n\n"
                
                "✅ EXTRACT INSIGHTS LIKE:\n"
                "- 'Learn syntax first, concepts second - mixing both creates confusion'\n"
                "- 'Build projects immediately after learning - passive consumption doesn't stick'\n"
                "- 'Choose boring technology for side projects - focus energy on the problem, not the tools'\n\n"
                
                "QUALITY TEST: Would you actually reference this insight when:\n"
                "- Making learning decisions?\n"
                "- Talking to someone about this topic?\n"
                "- Applying this knowledge?\n\n"
            )
        
        # CONTEXT AND JSON FORMAT
        context_info = (
            f"CONTENT TO ANALYZE:\n"
            f"TOPIC IDENTIFIED: {topic}\n\n"
            f"⚠️ CRITICAL: The topic has already been identified as '{self._extract_topic_title(topic)}'. "
            f"Focus on extracting insights about THIS specific topic, not reidentifying what the topic is.\n\n"
            f"CONTEXT: {json.dumps(context) if context else 'No additional context'}\n\n"
            "Extract the memorable insights from this conversation about the identified topic.\n\n"
        )
        
        json_format = (
            "Respond in this JSON format:\n"
            "{\n"
            '    "insights": [\n'
            "        {\n"
            '            "insight": "The main learning/mindset shift",\n'
            '            "example": "Concrete scenario from content",\n'
            '            "application": "How to use this immediately",\n'
            '            "context": "When this matters most",\n'
            '            "category": "Appropriate category"' + (f',\n            "categoryPath": ["Parent", "Subcategory"]' if category_guidance else '') + '\n'
            "        }\n"
            "    ],\n"
            '    "conversation_title": "The specific topic/problem/concept being studied (e.g., Valid Parentheses Problem, DeepSeek AI Analysis)",\n'
            '    "conversation_summary": "One sentence about the key insights gained"\n'
            '}\n\n'
            "⚠️ CRITICAL: The title should be the SPECIFIC TOPIC being studied, not a generic insight statement!\n\n"
            f"Content:\n\"\"\"\n{segment_text}\n\"\"\"\n"
        )
        
        # COMBINE ALL SECTIONS
        structured_prompt = (
            transformation_prompt +
            new_output_structure + "\n\n" +
            category_instructions + "\n\n" +
            context_info +
            json_format
        )

        # COMPREHENSIVE LOGGING
        logger.info("=== PREPARING LEARNING INSIGHT EXTRACTION ===")
        logger.info(f"🔧 Prompt length: {len(structured_prompt)} characters")
        logger.info(f"🎯 Temperature: 0.4 (increased for creativity)")
        logger.debug("=== LEARNING INSIGHT EXTRACTION PROMPT ===")
        logger.debug(structured_prompt)

        logger.info("📤 Sending learning insight extraction request...")
        start_time = datetime.now()
        
        client = self._get_client(custom_api_key)
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": structured_prompt}],
            temperature=0.4,  # Increased for more creative, personal extraction
            max_tokens=2000,  # Reduced since we want concise insights
            response_format={"type": "json_object"}
        )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        response_text = response.choices[0].message.content
        
        # RESPONSE PROCESSING FOR NEW FORMAT
        logger.info("📥 Received learning insight response")
        logger.info(f"⏱️  Response time: {response_time:.2f} seconds")
        logger.info(f"📊 Response length: {len(response_text)} characters")
        logger.debug("=== RAW INSIGHT EXTRACTION RESPONSE ===")
        logger.debug(response_text)
        
        logger.info("🔄 Parsing learning insights...")
        parsed_result = self._parse_insight_response(response_text, topic)
        
        # Log parsing results
        if parsed_result.get("concepts"):
            logger.info(f"✅ Successfully extracted {len(parsed_result['concepts'])} learning concepts")
            for i, concept in enumerate(parsed_result["concepts"]):
                logger.debug(f"  Concept {i+1}: {concept.get('title', 'UNTITLED')[:50]}...")
        else:
            logger.warning("⚠️  No concepts extracted from segment")
        
        logger.info("=== LEARNING INSIGHT EXTRACTION COMPLETED ===")
        return parsed_result

    def _parse_insight_response(self, response_text: str, topic: str = None) -> Dict:
        """
        Parse the new insight-based response format from the LLM.
        Converts insights to concept format for compatibility with existing system.
        Now uses the actual topic being studied as the title instead of generic insight text.
        """
        try:
            # Parse the JSON response
            data = json.loads(response_text)
            
            # Convert insights to concepts format for compatibility
            concepts = []
            if "insights" in data and isinstance(data["insights"], list):
                for insight_data in data["insights"]:
                    if isinstance(insight_data, dict):
                        # 🎯 NEW: Use the actual topic being studied as the title
                        title = self._extract_topic_title(topic) if topic else self._generate_insight_title(insight_data.get("insight", ""))
                        
                        # Create concept from insight data with ORIGINAL STRUCTURE
                        concept = {
                            "title": title,
                            "summary": insight_data.get("insight", ""),
                            "details": self._format_insight_details(insight_data),
                            "keyPoints": [
                                insight_data.get("application", ""),
                                insight_data.get("context", "")
                            ],
                            "category": insight_data.get("category", "Learning"),
                            "categoryPath": insight_data.get("categoryPath", [insight_data.get("category", "Learning")]),
                            "relatedConcepts": [],
                            "codeSnippets": [],
                            "confidence_score": 0.9,
                            "last_updated": datetime.now()
                        }
                        
                        # Clean up empty fields
                        concept["keyPoints"] = [point for point in concept["keyPoints"] if point and point.strip()]
                        
                        concepts.append(concept)
            
            return {
                "concepts": concepts,
                "conversation_title": data.get("conversation_title", "Learning Insights"),
                "conversation_summary": data.get("conversation_summary", "Key insights extracted from conversation"),
                "metadata": {
                    "extraction_method": "learning_insight_extraction",
                    "extraction_time": datetime.now().isoformat(),
                    "concept_count": len(concepts)
                }
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse insight response as JSON: {e}")
            logger.debug(f"Raw response: {response_text}")
            return self._fallback_extraction(response_text)
        except Exception as e:
            logger.error(f"Error parsing insight response: {e}")
            logger.debug(f"Raw response: {response_text}")
            return self._fallback_extraction(response_text)

    def _extract_topic_title(self, topic: str) -> str:
        """
        Extract the actual topic/problem/concept being studied from the segmentation topic.
        Removes meta-tags and techniques to get the core subject matter.
        
        Examples:
        - "[PROBLEM_SOLVING] Valid Parentheses (LeetCode) [TECHNIQUE:Stack]" → "Valid Parentheses Problem"
        - "[EXPLORATORY_LEARNING] DeepSeek AI Strategy Analysis" → "DeepSeek AI Strategy Analysis"
        - "[TECHNICAL] React Performance Optimization" → "React Performance Optimization"
        """
        if not topic or not topic.strip():
            return "Learning Topic"
        
        # Remove meta-tags like [PROBLEM_SOLVING], [TECHNIQUE:xxx], etc.
        clean_topic = topic
        
        # Remove conversation type tags
        clean_topic = re.sub(r'^\[.*?\]\s*', '', clean_topic)
        
        # Remove technique tags at the end
        clean_topic = re.sub(r'\s*\[TECHNIQUE:.*?\]$', '', clean_topic)
        
        # Clean up any remaining brackets or parentheses with context info
        # But preserve parentheses that are part of the actual topic name
        
        # For problem-solving topics, add "Problem" if not already there
        if "[PROBLEM_SOLVING]" in topic and not any(word in clean_topic.lower() for word in ["problem", "challenge", "exercise"]):
            # Check if it looks like a LeetCode problem name
            if any(indicator in clean_topic.lower() for indicator in ["leetcode", "neetcode", "blind", "two sum", "valid", "contains"]):
                clean_topic += " Problem"
        
        # Capitalize appropriately
        clean_topic = clean_topic.strip()
        
        # Handle common cases
        if clean_topic.lower().startswith("learning about"):
            clean_topic = clean_topic[14:].strip()  # Remove "learning about "
        
        return clean_topic if clean_topic else "Learning Topic"

    def _generate_insight_title(self, insight_text: str) -> str:
        """
        Generate a concise, meaningful title from an insight.
        Extracts the core concept without truncating mid-sentence.
        """
        if not insight_text or not insight_text.strip():
            return "Learning Insight"
        
        # Clean up the insight text
        insight = insight_text.strip()
        
        # If it's already short enough, use it as-is
        if len(insight) <= 60:
            return insight
        
        # Find natural break points for a concise title
        # Look for the first part before common separators
        separators = [' - ', ': ', ' because ', ' when ', ' if ', ' but ', ' and ', ', ']
        
        for separator in separators:
            if separator in insight:
                first_part = insight.split(separator)[0].strip()
                if 20 <= len(first_part) <= 60:  # Good length for a title
                    return first_part
        
        # If no good separator found, find the first complete sentence or phrase
        # Look for sentence ending followed by space
        sentences = insight.split('. ')
        if len(sentences) > 1 and 20 <= len(sentences[0]) <= 60:
            return sentences[0]
        
        # Look for phrases ending with common words
        words = insight.split()
        if len(words) > 5:
            # Try to find a meaningful 6-10 word phrase
            for end_idx in range(6, min(11, len(words))):
                phrase = ' '.join(words[:end_idx])
                if len(phrase) <= 60:
                    return phrase
        
        # Fallback: intelligent truncation at word boundary
        if len(insight) > 60:
            # Find the last space before the 57 character limit (leaving room for "...")
            truncate_point = insight.rfind(' ', 0, 57)
            if truncate_point > 20:  # Make sure we don't truncate too early
                return insight[:truncate_point] + "..."
        
        return insight

    def _format_insight_details(self, insight_data: Dict) -> str:
        """
        Format insight data into a readable details section.
        Uses clean formatting that works well in the existing UI.
        """
        details_parts = []
        
        # Main insight
        insight = insight_data.get("insight", "")
        if insight:
            details_parts.append(f"💡 **Insight**: {insight}")
        
        # Example
        example = insight_data.get("example", "")
        if example:
            details_parts.append(f"📝 **Example**: {example}")
        
        # Application
        application = insight_data.get("application", "")
        if application:
            details_parts.append(f"🎯 **How to Apply**: {application}")
        
        # Context
        context = insight_data.get("context", "")
        if context:
            details_parts.append(f"⏰ **When to Use**: {context}")
        
        return "\n\n".join(details_parts) if details_parts else "No additional details available."

    async def _extract_non_technical_insights(
        self, topic: str, segment_text: str, context: Optional[Dict] = None, 
        category_guidance: Optional[Dict] = None, custom_api_key: Optional[str] = None
    ) -> Dict:
        """
        NON-TECHNICAL INSIGHT EXTRACTION - Extract valuable insights from non-technical content
        Focus on actionable insights and personal growth rather than information summaries.
        """
        logger.info("=== STARTING NON-TECHNICAL INSIGHT EXTRACTION ===")
        logger.info(f"📚 Topic: {topic}")
        logger.info(f"📊 Segment length: {len(segment_text)} characters")
        logger.debug(f"Segment preview: {segment_text[:200]}...")
        
        if context:
            logger.debug(f"Context provided: {list(context.keys())}")
        if category_guidance:
            logger.debug(f"Category guidance provided: {list(category_guidance.keys())}")

        # Handle hierarchical categories for non-technical domains
        category_instructions = ""
        if category_guidance and category_guidance.get("use_hierarchical_categories"):
            existing_categories = category_guidance.get("existing_categories", [])
            
            category_instructions = (
                "\n\nNON-TECHNICAL CATEGORIZATION:\n"
                f"Use appropriate categories for non-technical content, formatted as arrays.\n"
                f"Include the 'categoryPath' field in your response.\n\n"
                "FOCUS ON INSIGHT DOMAIN:\n"
                "- Match the category to the type of insight, not just the subject matter\n"
                "- Consider the practical application domain\n"
                "- Use specific subcategories when the insight clearly applies\n\n"
            )
            
            if existing_categories:
                category_instructions += "AVAILABLE CATEGORIES:\n"
                for i, path in enumerate(existing_categories[:15]):
                    path_str = " > ".join(path)
                    category_instructions += f"- {path_str}\n"
            
            category_instructions += (
                "\nEXAMPLES OF NON-TECHNICAL INSIGHT CATEGORIZATION:\n"
                "- Insight about 'investment mindset' → categoryPath: ['Finance', 'Investment']\n"
                "- Insight about 'learning approach' → categoryPath: ['Personal Development', 'Learning']\n"
                "- Insight about 'decision making' → categoryPath: ['Psychology', 'Decision Making']\n\n"
            )

        # NON-TECHNICAL INSIGHT EXTRACTION PROMPT
        transformation_prompt = (
            "You are a LEARNING INSIGHT EXTRACTOR for NON-TECHNICAL content. Your job is to find "
            "memorable insights that change how someone thinks about life, business, finance, psychology, "
            "health, or personal development - NOT to summarize what was discussed.\n\n"
            
            "🎯 MISSION: Extract insights someone would want to remember and apply in their life\n\n"
            
            "INSIGHT IDENTIFICATION FOR NON-TECHNICAL CONTENT:\n"
            "1. **MINDSET SHIFTS**: How does this change the way you think about this domain?\n"
            "2. **PRACTICAL WISDOM**: What actionable principle can you apply immediately?\n"
            "3. **DECISION FRAMEWORKS**: How does this help you make better decisions?\n"
            "4. **LIFE APPLICATIONS**: Where would you use this insight in real life?\n\n"
            
            "🚫 AVOID EXTRACTING:\n"
            "- Basic definitions and explanations\n"
            "- Generic advice without specific insight\n"
            "- Information that doesn't change behavior or thinking\n"
            "- Surface-level facts without deeper wisdom\n\n"
            
            "✅ EXTRACT INSIGHTS LIKE:\n"
            "- 'Invest in index funds monthly, not when markets look good - timing the market is impossible'\n"
            "- 'Write down decisions before making them - it forces clearer thinking and reduces bias'\n"
            "- 'Schedule important tasks for your peak energy hours, not just when they fit'\n\n"
            
            "QUALITY TEST: Would you actually reference this insight when:\n"
            "- Making a real-life decision?\n"
            "- Explaining this topic to someone?\n"
            "- Planning your approach to this area?\n\n"
        )

        # Context and JSON format
        context_info = (
            f"CONTENT TO ANALYZE:\n"
            f"TOPIC IDENTIFIED: {topic}\n\n"
            f"⚠️ CRITICAL: The topic has already been identified as '{self._extract_topic_title(topic)}'. "
            f"Focus on extracting insights about THIS specific topic, not reidentifying what the topic is.\n\n"
            f"CONTEXT: {json.dumps(context) if context else 'No additional context'}\n\n"
            "Extract the memorable insights from this conversation about the identified topic.\n\n"
        )
        
        json_format = (
            "Respond in this JSON format:\n"
            "{\n"
            '    "insights": [\n'
            "        {\n"
            '            "insight": "The main learning/mindset shift",\n'
            '            "example": "Concrete scenario from content",\n'
            '            "application": "How to use this immediately",\n'
            '            "context": "When this matters most",\n'
            '            "category": "Appropriate non-technical category"' + (f',\n            "categoryPath": ["Parent", "Subcategory"]' if category_guidance else '') + '\n'
            "        }\n"
            "    ],\n"
            '    "conversation_title": "The specific topic/subject being studied (e.g., Investment Strategy, Psychology of Decision Making)",\n'
            '    "conversation_summary": "One sentence about the key insights gained"\n'
            '}\n\n'
            "⚠️ CRITICAL: The title should be the SPECIFIC TOPIC being studied, not a generic insight statement!\n\n"
            f"Content:\n\"\"\"\n{segment_text}\n\"\"\"\n"
        )
        
        # Combine all sections for non-technical analysis
        structured_prompt = (
            transformation_prompt +
            category_instructions + "\n\n" +
            context_info +
            json_format
        )

        # COMPREHENSIVE LOGGING
        logger.info("=== PREPARING NON-TECHNICAL INSIGHT EXTRACTION ===")
        logger.info(f"🔧 Prompt length: {len(structured_prompt)} characters")
        logger.info(f"🎯 Temperature: 0.4")

        logger.info("📤 Sending non-technical insight extraction request...")
        start_time = datetime.now()
        
        client = self._get_client(custom_api_key)
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": structured_prompt}],
            temperature=0.4,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        response_text = response.choices[0].message.content
        
        # RESPONSE PROCESSING
        logger.info("📥 Received non-technical insight response")
        logger.info(f"⏱️  Response time: {response_time:.2f} seconds")
        logger.info(f"📊 Response length: {len(response_text)} characters")
        
        logger.info("🔄 Parsing non-technical insights...")
        parsed_result = self._parse_insight_response(response_text, topic)
        
        # Fallback category assignment for non-technical content
        if parsed_result.get("concepts"):
            for concept in parsed_result["concepts"]:
                if not concept.get("category") or concept.get("category") in ["Uncategorized", "General"]:
                    # Simple heuristic-based category assignment
                    title = concept.get("title", "")
                    summary = concept.get("summary", "")
                    content = f"{title} {summary}".lower()
                    
                    if any(word in content for word in ['money', 'investment', 'finance', 'stock', 'budget']):
                        concept["category"] = "Finance"
                        concept["categoryPath"] = ["Finance"]
                    elif any(word in content for word in ['psychology', 'mental', 'behavior', 'cognitive']):
                        concept["category"] = "Psychology"  
                        concept["categoryPath"] = ["Psychology"]
                    elif any(word in content for word in ['business', 'strategy', 'management', 'marketing']):
                        concept["category"] = "Business"
                        concept["categoryPath"] = ["Business"]
                    elif any(word in content for word in ['health', 'fitness', 'nutrition', 'wellness']):
                        concept["category"] = "Health"
                        concept["categoryPath"] = ["Health"]
                    else:
                        concept["category"] = "Personal Development"
                        concept["categoryPath"] = ["Personal Development"]

        # Log parsing results
        if parsed_result.get("concepts"):
            logger.info(f"✅ Successfully extracted {len(parsed_result['concepts'])} non-technical concepts")
            for i, concept in enumerate(parsed_result["concepts"]):
                logger.debug(f"  Concept {i+1}: {concept.get('title', 'UNTITLED')[:50]}...")
        else:
            logger.warning("⚠️  No concepts extracted from non-technical segment")
        
        logger.info("=== NON-TECHNICAL INSIGHT EXTRACTION COMPLETED ===")
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

            logger.info("🔍 Starting conversation segmentation...")

            # RESTORE SEGMENTATION: This is critical for identifying specific topics like LeetCode problems
            segments = await self._segment_conversation(req.conversation_text, req.custom_api_key)
            logger.info(f"📊 Found {len(segments)} segments to analyze")

            # Analyze each segment to extract concepts
            all_concepts = []
            conversation_summaries = []
            
            for i, (topic, segment_text) in enumerate(segments):
                logger.info(f"🔄 Analyzing segment {i+1}/{len(segments)}: {topic}")
                
                segment_result = await self._analyze_segment(
                    topic, segment_text, req.context, req.category_guidance, req.custom_api_key
                )
                
                if segment_result.get("concepts"):
                    all_concepts.extend(segment_result["concepts"])
                    logger.info(f"✅ Extracted {len(segment_result['concepts'])} concepts from segment {i+1}")
                
                if segment_result.get("conversation_summary"):
                    conversation_summaries.append(segment_result["conversation_summary"])

            # Create combined result
            single_pass_result = {
                "concepts": all_concepts,
                "conversation_title": segments[0][0] if segments else "Learning Session",
                "conversation_summary": " | ".join(conversation_summaries) if conversation_summaries else "Key insights extracted from conversation",
                "metadata": {
                    "extraction_method": "segmented_insight_extraction",
                    "segments_analyzed": len(segments),
                    "extraction_time": datetime.now().isoformat()
                }
            }

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
            segments = await self._segment_conversation(req.conversation_text, req.custom_api_key)
            all_concepts = []
            segment_summaries = []
            for topic, segment_text in segments:
                segment_result = await self._analyze_segment(
                    topic, segment_text, req.context, req.category_guidance, req.custom_api_key
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


@app.get("/")
async def root():
    """Root endpoint to verify service is running."""
    return {
        "message": "Technical Concept Extractor API is running",
        "status": "healthy",
        "endpoints": [
            "/api/v1/extract-concepts",
            "/api/v1/health",
            "/api/v1/generate-quiz"
        ]
    }


@app.post("/api/v1/extract-concepts")
async def extract_concepts(req: ConversationRequest):
    """Extract technical concepts from a conversation with comprehensive analysis and logging."""
    request_start_time = datetime.now()
    logger.info("🌟 === NEW EXTRACTION REQUEST ===")
    logger.info(f"📊 Request size: {len(req.conversation_text)} characters")
    
    # Log API key usage
    if req.custom_api_key:
        logger.info(f"🔑 Using custom API key: {req.custom_api_key[:10]}...")
    else:
        logger.info("🔑 Using server's default API key")
    
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
        # FIXED: Properly map details field from multiple possible sources
        details_content = ""
        
        # Check for details field (problem-solving content)
        if concept.get("details"):
            details_content = concept["details"]
        # Check for implementation field (exploratory learning content)
        elif concept.get("implementation"):
            details_content = concept["implementation"]
        # Check for insights field (non-technical content)
        elif concept.get("insights"):
            details_content = concept["insights"]
        # Fallback to empty string
        else:
            details_content = ""
        
        # Ensure required fields
        required_fields = {
            "title": concept.get("title", f"Concept {i+1}"),
            "category": concept.get("category", "General"),
            "summary": concept.get("summary", ""),
            "keyPoints": concept.get("keyPoints", []),
            "details": details_content,  # Now properly mapped from all sources
            "relatedConcepts": concept.get("relatedConcepts", []),
            "confidence_score": concept.get("confidence_score", 0.8),
        }
        
        # Update concept with required fields
        standardized["concepts"][i] = {**concept, **required_fields}
        
        # Log the mapping for debugging
        original_field = "details" if concept.get("details") else ("implementation" if concept.get("implementation") else ("insights" if concept.get("insights") else "none"))
        logger.debug(f"Mapped '{original_field}' field to 'details' for concept: {concept.get('title', 'Untitled')}")
        
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
    """Health check endpoint."""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": "gpt-4o",
        "version": "1.0.0"
    }


class ManualCategoryUpdateRequest(BaseModel):
    content_snippet: str
    old_category: str
    new_category: str


@app.post("/api/v1/manual-category-update")
async def record_manual_category_update(req: ManualCategoryUpdateRequest):
    """
    MANUAL CATEGORY UPDATE ENDPOINT
    Record a manual category update for learning and future suggestions.
    """
    logger.info(f"📝 Manual category update: '{req.old_category}' → '{req.new_category}'")
    
    try:
        # Get the extractor instance to access category learning
        extractor = ConceptExtractor()
        extractor.category_learning.record_manual_update(
            req.content_snippet, 
            req.old_category, 
            req.new_category
        )
        
        return {
            "status": "success",
            "message": f"Recorded category update: '{req.old_category}' → '{req.new_category}'",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to record manual category update: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record category update: {str(e)}")


@app.get("/api/v1/category-learning-stats")
async def get_category_learning_stats():
    """
    CATEGORY LEARNING STATISTICS ENDPOINT
    Get statistics about learned category mappings.
    """
    logger.info("📊 Category learning statistics requested")
    
    try:
        extractor = ConceptExtractor()
        stats = extractor.category_learning.get_learning_stats()
        
        return {
            "status": "success",
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get category learning stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get learning stats: {str(e)}")


class QuizRequest(BaseModel):
    concept: Dict
    custom_api_key: Optional[str] = None  # User's custom OpenAI API key


@app.post("/api/v1/generate-quiz")
async def generate_quiz(req: QuizRequest):
    """Generate quiz questions for a given concept."""
    try:
        concept = req.concept
        if not concept:
            raise HTTPException(status_code=400, detail="Missing concept data")
        
        # Create quiz generation prompt
        prompt = f"""
        Based on the following programming concept, generate 5 multiple-choice quiz questions to test understanding.
        
        Concept: {concept.get('title', '')}
        Summary: {concept.get('summary', '')}
        
        For each question:
        1. Create a clear, specific question about the concept
        2. Provide 4 multiple-choice options (A, B, C, D)
        3. Indicate the correct answer (0-3 index)
        4. Provide a brief explanation of why the answer is correct
        
        Make the questions practical and test real understanding, not just memorization.
        
        Return the response in this exact JSON format:
        {{
          "questions": [
            {{
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Explanation of why this answer is correct."
            }}
          ]
        }}
        """
        
        # Use the appropriate client (custom or default)
        client = concept_extractor._get_client(req.custom_api_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert programming instructor creating quiz questions. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.7,
        )
        
        content = response.choices[0].message.content.strip()
        
        # Extract JSON from response (handle markdown wrapping)
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*$', '', content)
        content = content.strip()
        
        # Parse the JSON response
        quiz_data = json.loads(content)
        
        return {
            "questions": quiz_data["questions"],
            "metadata": {
                "conceptTitle": concept.get('title', ''),
                "difficulty": "intermediate",
                "totalQuestions": len(quiz_data["questions"])
            }
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate valid quiz questions")
    except Exception as e:
        logger.error(f"Error generating quiz questions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")