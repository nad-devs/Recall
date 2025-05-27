# Recall Backend Microservice

This is a Python FastAPI microservice for Recall that analyzes conversations and extracts technical concepts, generates quizzes, and provides comprehensive learning insights.

## Features

- **Concept Extraction**: AI-powered extraction of technical concepts from conversations
- **Quiz Generation**: Generate multiple-choice quizzes for any concept
- **Health Monitoring**: Service health checks and monitoring
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
# Windows
set OPENAI_API_KEY=your_api_key_here
set PORT=8000

# Mac/Linux
export OPENAI_API_KEY=your_api_key_here
export PORT=8000
```

4. Run the service:
```bash
# Development mode
uvicorn concept_extractor:app --reload --port 8000

# Production mode
python main.py
```

5. Test the service:
```bash
# Check health
curl http://localhost:8000/api/v1/health

# Extract concepts
curl -X POST http://localhost:8000/api/v1/extract-concepts \
     -H "Content-Type: application/json" \
     -d '{"conversation_text": "Your conversation text here"}'

# Generate quiz
curl -X POST http://localhost:8000/api/v1/generate-quiz \
     -H "Content-Type: application/json" \
     -d '{"concept": {"title": "Hash Tables", "summary": "Data structure for fast lookups"}}'
```

## API Endpoints

- `GET /` - Root endpoint with service information
- `GET /health` - Basic health check
- `GET /api/v1/health` - Detailed health check with service status
- `POST /api/v1/extract-concepts` - Extract technical concepts from conversations
- `POST /api/v1/generate-quiz` - Generate quiz questions for a concept

## Request/Response Formats

### Extract Concepts

**Request:**
```json
{
  "conversation_text": "Your conversation text here",
  "context": {
    "optional": "additional context"
  },
  "category_guidance": {
    "use_hierarchical_categories": true,
    "existing_categories": [["Backend Engineering", "APIs"]],
    "category_keywords": {"Backend Engineering": ["API", "REST", "GraphQL"]}
  }
}
```

**Response:**
```json
{
  "concepts": [
    {
      "title": "Hash Tables",
      "category": "Data Structures",
      "categoryPath": ["Data Structures"],
      "summary": "A data structure that maps keys to values",
      "details": "Comprehensive explanation...",
      "keyPoints": ["O(1) average lookup time", "Uses hash function"],
      "codeSnippets": [
        {
          "language": "python",
          "code": "hash_table = {}",
          "description": "Creating a hash table"
        }
      ],
      "relatedConcepts": ["Arrays", "Dictionaries"],
      "confidence_score": 0.95
    }
  ],
  "conversation_summary": "Discussion about hash tables and their implementation",
  "metadata": {
    "extraction_time": "2024-01-01T12:00:00Z",
    "model_used": "gpt-4o",
    "concept_count": 1
  }
}
```

### Generate Quiz

**Request:**
```json
{
  "concept": {
    "title": "Hash Tables",
    "summary": "A data structure for fast key-value lookups"
  }
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is the average time complexity for hash table lookups?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      "correctAnswer": 0,
      "explanation": "Hash tables provide O(1) average time complexity for lookups due to direct indexing via hash functions."
    }
  ],
  "metadata": {
    "conceptTitle": "Hash Tables",
    "difficulty": "intermediate",
    "totalQuestions": 5
  }
}
```

## Deployment

### Render Deployment

1. Connect your repository to Render
2. Use the `render.yaml` configuration file
3. Set the `OPENAI_API_KEY` environment variable
4. Deploy!

### Local Development

Use the provided `start_service.bat` (Windows) or run directly:
```bash
uvicorn concept_extractor:app --reload --port 8000
```
``` 