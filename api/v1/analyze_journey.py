from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import os
import openai
import logging
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional, List
from datetime import datetime, timezone

# --- Configuration & Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Learning Journey Analyzer API")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenAI Client ---
client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    logger.error("OPENAI_API_KEY environment variable is not set.")

# --- Pydantic Models ---

class Relationship(BaseModel):
    source_concept: str = Field(..., description="The concept that the relationship originates from.")
    target_concept: str = Field(..., description="The concept that the relationship points to.")
    type: str = Field(..., description="The type of relationship, e.g., 'IS_PREREQUISITE_FOR', 'IS_APPLICATION_OF'.")
    explanation: str = Field(..., description="A brief explanation of why this relationship exists.")

class JourneyAnalysis(BaseModel):
    """ The structured output of the 'Learning Coach' persona. """
    identified_concepts: List[str] = Field(..., description="A list of the primary concept titles identified in the text.")
    suggested_prerequisites: List[Dict] = Field(..., description="Concepts that are likely prerequisites for the topics discussed.")
    next_learning_steps: List[Dict] = Field(..., description="Actionable next steps or topics for the user to explore.")
    identified_relationships: List[Relationship] = Field(..., description="Directional relationships discovered between concepts within the conversation.")
    learning_gaps_summary: str = Field(..., description="A summary of potential knowledge gaps detected from the user's questions or statements.")

class JourneyRequest(BaseModel):
    """ The input for the learning journey analysis. """
    conversation_text: str
    existing_concepts: Optional[List[str]] = Field(None, description="A list of concepts the user has already mastered, for context.")
    custom_api_key: Optional[str] = None

class JourneyResponse(BaseModel):
    """ The final response from this service. """
    learning_journey_analysis: JourneyAnalysis
    metadata: Dict

# --- Core Logic: The "Learning Coach" ---

class JourneyAnalyzer:
    def __init__(self):
        self.model = "gpt-4o" # Using a powerful model for nuanced learning path analysis
        logger.info(f"JourneyAnalyzer initialized with model: {self.model}")

    def _get_client(self, custom_api_key: Optional[str] = None) -> openai.AsyncOpenAI:
        if custom_api_key:
            return openai.AsyncOpenAI(api_key=custom_api_key)
        return client

    def _create_prompt(self, text: str, existing_concepts: Optional[List[str]]) -> str:
        existing_concepts_str = ", ".join(existing_concepts) if existing_concepts else "None known."
        
        return f"""
        You are an expert Learning Coach AI. Your task is to analyze a conversation transcript to map out a user's learning journey. You are not defining concepts; you are identifying connections, prerequisites, and future paths.

        **Conversation Transcript:**
        ---
        {text}
        ---

        **Context: User's Existing Knowledge (Titles of mastered concepts):**
        {existing_concepts_str}

        **Your Analysis Task:**
        Based on the transcript, perform the following analysis and provide the output as a single, valid JSON object.

        1.  **Identify Concepts:** List the main topics or concepts being discussed.
        2.  **Suggest Prerequisites:** Based on the concepts, what are the essential prerequisites someone would need? For each, provide a `topic` and a `reason`.
        3.  **Identify Relationships:** Detect directional relationships *between the concepts mentioned in the text*. Use relationship types like 'IS_PREREQUISITE_FOR', 'IS_APPLICATION_OF', 'IS_ANALOGOUS_TO', 'DEEPENS_UNDERSTANDING_OF'.
        4.  **Suggest Next Steps:** What are 2-3 logical next topics to learn? For each, provide a `topic` and a `reason`.
        5.  **Summarize Learning Gaps:** Based on the user's questions or statements, briefly summarize any potential gaps in their understanding.

        **Output Format (Strict JSON):**
        {{
          "identified_concepts": ["Concept Title A", "Concept Title B"],
          "suggested_prerequisites": [
            {{"topic": "Prereq A", "reason": "Why it's needed for the discussed topics."}}
          ],
          "next_learning_steps": [
            {{"topic": "Next Topic A", "reason": "Why this is a logical next step."}}
          ],
          "identified_relationships": [
            {{
              "source_concept": "Concept A",
              "target_concept": "Concept B",
              "type": "IS_APPLICATION_OF",
              "explanation": "Concept A is a practical use case of the theory in Concept B."
            }}
          ],
          "learning_gaps_summary": "The user seems to understand X but might be unclear on the nuances of Y, as suggested by their question about Z."
        }}
        
        Do not include any text outside of this JSON structure.
        """

    async def analyze(self, req: JourneyRequest) -> JourneyAnalysis:
        prompt = self._create_prompt(req.conversation_text, req.existing_concepts)
        
        try:
            api_client = self._get_client(req.custom_api_key)
            if not api_client.api_key:
                raise ValueError("OpenAI API key is missing.")

            response = await api_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                response_format={"type": "json_object"}
            )
            
            analysis_data = openai.json.loads(response.choices[0].message.content)
            return JourneyAnalysis(**analysis_data)

        except Exception as e:
            logger.error(f"Error analyzing learning journey: {e}")
            raise HTTPException(status_code=500, detail="Failed to analyze learning journey.")

# --- FastAPI Endpoints ---

analyzer = JourneyAnalyzer()

@app.post("/api/v1/analyze-journey", response_model=JourneyResponse)
async def analyze_journey_endpoint(req: JourneyRequest):
    logger.info(f"Received request to analyze learning journey.")
    
    analysis = await analyzer.analyze(req)
    
    metadata = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_used": analyzer.model,
    }
    
    return JourneyResponse(learning_journey_analysis=analysis, metadata=metadata)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "LearningJourneyAnalyzer"} 