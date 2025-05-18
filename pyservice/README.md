# Conversation Analysis Microservice

This is a Python microservice that uses LangMem to analyze conversations and extract concepts, code snippets, and generate summaries.

## Setup

1. Create a virtual environment and activate it:
```
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Run the service with your OpenAI API key:
```
# Option 1: Set environment variable
set OPENAI_API_KEY=your_api_key_here  # Windows
# export OPENAI_API_KEY=your_api_key_here  # Mac/Linux

# Option 2: Pass API key as argument
uvicorn memory_service:app --reload --port 8000 --openai_api_key=your_api_key_here
```

4. Test the service:
```
# Check health
curl http://localhost:8000/health

# Analyze conversation
curl -X POST http://localhost:8000/analyze \
     -H "Content-Type: application/json" \
     -d '{"conversation_text": "Your conversation text here"}'
```

## API Endpoints

- `GET /health` - Check if the service is running
- `POST /analyze` - Analyze a conversation

## Request Format

```json
{
  "conversation_text": "Your conversation text here"
}
```

## Response Format

```json
{
  "title": "Conversation Title",
  "summary": "Conversation Summary",
  "concepts": [
    {
      "name": "Concept Name",
      "description": "Concept Description",
      "category": "Concept Category",
      "needsReview": false,
      "aliases": []
    }
  ],
  "codeSnippets": [
    {
      "language": "python",
      "code": "print('Hello World')",
      "relatedConcept": "Python Basics"
    }
  ]
}
``` 