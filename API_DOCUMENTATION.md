# API Documentation

This document provides comprehensive documentation for all Recall API endpoints, including the Next.js API routes and Python backend service.

## 🌍 API Overview

Recall exposes two main API layers:
1. **Frontend API**: Next.js API routes (`/api/*`) - Database operations, authentication
2. **Backend API**: Python FastAPI service (`/api/v1/*`) - AI processing, concept extraction

## 🔐 Authentication

### Authentication Methods

1. **Session-based Authentication**: NextAuth.js sessions for web interface
2. **API Key Authentication**: Custom OpenAI API keys for increased limits
3. **User Info Authentication**: Browser-stored user info for non-OAuth users

### Authentication Headers

```typescript
// Standard authenticated request
const headers = {
  'Content-Type': 'application/json',
  'Cookie': 'session-token=...', // Automatically handled by browser
}

// With custom API key
const headers = {
  'Content-Type': 'application/json',
  'X-Custom-API-Key': 'sk-your-custom-openai-key',
}
```

## 📝 Frontend API Endpoints (Next.js)

### Authentication Endpoints

#### `GET /api/auth/session`
Get current user session information.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://avatar.url"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

#### `POST /api/auth/signin`
Initiate authentication flow.

### Concept Management

#### `GET /api/concepts`
Retrieve user's concepts with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search in title, summary, or details
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (default: lastUpdated)
- `sortOrder` (optional): asc/desc (default: desc)

**Request:**
```bash
GET /api/concepts?category=Algorithm&search=binary&limit=10&offset=0
```

**Response:**
```json
{
  "concepts": [
    {
      "id": "concept_123",
      "title": "Binary Search Algorithm",
      "category": "Data Structures and Algorithms",
      "summary": "Efficient search algorithm for sorted arrays",
      "details": {
        "implementation": "...",
        "complexity": {
          "time": "O(log n)",
          "space": "O(1)"
        },
        "useCases": ["Searching sorted data", "Database indexing"]
      },
      "keyPoints": [
        "Requires sorted input",
        "Divides search space in half each iteration",
        "More efficient than linear search"
      ],
      "examples": [...],
      "codeSnippets": [...],
      "relatedConcepts": ["Linear Search", "Tree Traversal"],
      "confidenceScore": 0.85,
      "lastUpdated": "2024-01-15T10:30:00Z",
      "conversation": {
        "id": "conv_456",
        "title": "Algorithm Discussion",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      "masteryLevel": "INTERMEDIATE",
      "learningProgress": 75,
      "bookmarked": false
    }
  ],
  "total": 1,
  "hasMore": false
}
```

#### `POST /api/concepts`
Create a new concept.

**Request Body:**
```json
{
  "title": "Concept Title",
  "category": "Category Name",
  "summary": "Brief summary",
  "details": {...},
  "keyPoints": ["Point 1", "Point 2"],
  "examples": [...],
  "codeSnippets": [...],
  "relatedConcepts": ["Related Concept 1"],
  "isManualCreation": true,
  "context": "Additional context for AI enhancement"
}
```

**Response:**
```json
{
  "concept": {
    "id": "concept_789",
    "title": "Concept Title",
    // ... full concept object
  }
}
```

#### `GET /api/concepts/[id]`
Retrieve a specific concept by ID.

**Response:**
```json
{
  "concept": {
    "id": "concept_123",
    // ... full concept object with all fields
  }
}
```

#### `PUT /api/concepts/[id]`
Update an existing concept.

**Request Body:**
```json
{
  "title": "Updated Title",
  "category": "Updated Category",
  "summary": "Updated summary",
  "preserveEnhancements": true
}
```

**Response:**
```json
{
  "concept": {
    // ... updated concept object
  }
}
```

#### `DELETE /api/concepts/[id]`
Delete a concept.

**Response:**
```json
{
  "success": true,
  "message": "Concept deleted successfully"
}
```

#### `POST /api/concepts/check-existing`
Check for existing similar concepts before creating new ones.

**Request Body:**
```json
{
  "concepts": [
    {
      "title": "Binary Search",
      "summary": "Search algorithm for sorted arrays",
      "category": "Algorithms"
    }
  ]
}
```

**Response:**
```json
{
  "matches": [
    {
      "newConcept": {
        "title": "Binary Search",
        "summary": "Search algorithm for sorted arrays",
        // ... new concept data
      },
      "existingConcept": {
        "id": "concept_123",
        "title": "Binary Search Algorithm",
        "summary": "Efficient search for sorted data",
        "lastUpdated": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

### Conversation Management

#### `GET /api/conversations`
Retrieve user's conversations.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": "Algorithm Discussion",
      "summary": "Discussion about search algorithms",
      "createdAt": "2024-01-15T10:00:00Z",
      "concepts": [
        {
          "id": "concept_123",
          "title": "Binary Search Algorithm"
        }
      ]
    }
  ]
}
```

#### `GET /api/conversations/[id]`
Retrieve a specific conversation with full details.

**Response:**
```json
{
  "conversation": {
    "id": "conv_123",
    "title": "Algorithm Discussion",
    "summary": "Discussion about search algorithms",
    "text": "Full conversation text...",
    "createdAt": "2024-01-15T10:00:00Z",
    "concepts": [
      // ... array of full concept objects
    ]
  }
}
```

#### `POST /api/saveConversation`
Save a new conversation with extracted concepts.

**Request Body:**
```json
{
  "conversation_text": "Full conversation text...",
  "analysis": {
    "conversation_title": "Generated Title",
    "conversation_summary": "Generated summary",
    "concepts": [
      // ... array of extracted concepts
    ]
  },
  "customApiKey": "sk-optional-custom-key",
  "userInfo": {
    "name": "User Name",
    "email": "user@example.com",
    "id": "user_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully saved 3 concepts",
  "conversationId": "conv_456",
  "conceptIds": ["concept_789", "concept_790", "concept_791"],
  "redirectTo": "/concepts"
}
```

### Analysis and Extraction

#### `POST /api/extract-concepts`
Extract concepts from conversation text using AI.

**Request Body:**
```json
{
  "conversation_text": "Text to analyze...",
  "customApiKey": "sk-optional-custom-key",
  "options": {
    "extraction_depth": "detailed",
    "content_type_hint": "technical"
  }
}
```

**Response:**
```json
{
  "concepts": [
    {
      "title": "Extracted Concept",
      "category": "Detected Category",
      "summary": "Generated summary",
      "details": {...},
      "keyPoints": [...],
      "examples": [...],
      "codeSnippets": [...],
      "relatedConcepts": [...],
      "confidenceScore": 0.85
    }
  ],
  "conversation_summary": "Overall conversation summary",
  "content_type": "TECHNICAL",
  "processing_time": 2.5
}
```

### Category Management

#### `GET /api/categories`
Retrieve available categories.

**Response:**
```json
{
  "categories": [
    "Data Structures and Algorithms",
    "Backend Engineering > Authentication",
    "Frontend Development > React",
    "Business > Finance",
    "Psychology > Cognitive Biases"
  ]
}
```

### User and Settings

#### `GET /api/user/profile`
Get user profile information.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "timezone": "UTC",
    "language": "en",
    "theme": "system",
    "plan": "free",
    "usageCount": 15,
    "lastActiveAt": "2024-01-15T10:30:00Z"
  }
}
```

#### `PUT /api/user/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "timezone": "America/New_York",
  "language": "en",
  "theme": "dark"
}
```

#### `GET /api/usage`
Get user's usage statistics.

**Response:**
```json
{
  "currentUsage": {
    "conversationsThisMonth": 15,
    "conceptsCreated": 45,
    "lastAnalysis": "2024-01-15T10:30:00Z"
  },
  "limits": {
    "freeConversations": 20,
    "hasCustomApiKey": false
  },
  "remainingConversations": 5
}
```

## 🤖 Backend API Endpoints (Python FastAPI)

### Core Extraction

#### `POST /api/v1/extract-concepts`
Main concept extraction endpoint.

**Request Body:**
```json
{
  "conversation_text": "Text to analyze...",
  "user_id": "user_123",
  "custom_api_key": "sk-optional-key",
  "user_preferences": {
    "preferred_categories": ["Algorithm", "Data Structure"],
    "extraction_depth": "detailed",
    "include_code_examples": true
  },
  "options": {
    "max_concepts": 10,
    "min_confidence": 0.6,
    "enable_relationship_discovery": true
  }
}
```

**Response:**
```json
{
  "concepts": [
    {
      "title": "Binary Search Algorithm",
      "category": "Data Structures and Algorithms",
      "summary": "Efficient search algorithm for sorted arrays",
      "details": {
        "implementation": "Detailed explanation...",
        "complexity": {
          "time": "O(log n)",
          "space": "O(1)"
        },
        "advantages": [...],
        "disadvantages": [...],
        "useCases": [...]
      },
      "keyPoints": [
        "Requires sorted input",
        "Divides search space in half",
        "More efficient than linear search"
      ],
      "examples": [
        {
          "title": "Basic Implementation",
          "description": "Simple binary search example",
          "code": "def binary_search(arr, target):\n    # implementation",
          "language": "python"
        }
      ],
      "codeSnippets": [
        {
          "language": "python",
          "description": "Iterative implementation",
          "code": "# Binary search implementation\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1"
        }
      ],
      "relatedConcepts": [
        "Linear Search",
        "Tree Traversal",
        "Divide and Conquer"
      ],
      "confidenceScore": 0.92,
      "extractionMetadata": {
        "source_segment": "Lines 15-45",
        "extraction_method": "gpt-4",
        "processing_time": 1.2
      }
    }
  ],
  "conversation_summary": "Discussion about search algorithms, focusing on binary search implementation and complexity analysis",
  "content_type": "TECHNICAL",
  "processing_time": 2.8,
  "metadata": {
    "total_segments": 3,
    "concepts_discovered": 5,
    "concepts_filtered": 2,
    "avg_confidence": 0.87
  }
}
```

#### `POST /api/v1/generate-quiz`
Generate quiz questions from concepts.

**Request Body:**
```json
{
  "concepts": [
    {
      "id": "concept_123",
      "title": "Binary Search Algorithm",
      "details": {...}
    }
  ],
  "quiz_options": {
    "question_count": 5,
    "difficulty": "intermediate",
    "question_types": ["multiple_choice", "code_completion", "scenario"],
    "include_explanations": true
  }
}
```

**Response:**
```json
{
  "quiz": {
    "id": "quiz_456",
    "title": "Binary Search Algorithm Quiz",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "What is the time complexity of binary search?",
        "options": [
          "O(n)",
          "O(log n)",
          "O(n log n)",
          "O(1)"
        ],
        "correct_answer": 1,
        "explanation": "Binary search divides the search space in half each iteration, resulting in O(log n) time complexity.",
        "difficulty": "intermediate",
        "concept_id": "concept_123"
      },
      {
        "id": "q2",
        "type": "code_completion",
        "question": "Complete the binary search implementation:",
        "code_template": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = ___\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            ___\n        else:\n            ___\n    return -1",
        "expected_completions": [
          "(left + right) // 2",
          "left = mid + 1",
          "right = mid - 1"
        ],
        "explanation": "The midpoint calculation and boundary updates are crucial for correct binary search implementation."
      }
    ],
    "estimated_time": 10,
    "difficulty_level": "intermediate",
    "total_points": 100
  }
}
```

### Health and Monitoring

#### `GET /api/v1/health`
Comprehensive health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "openai": "healthy",
    "memory_usage": "78%",
    "cache": "healthy"
  },
  "performance": {
    "avg_response_time": 245,
    "requests_per_minute": 12,
    "cache_hit_rate": 0.85
  },
  "uptime": 86400
}
```

#### `GET /api/v1/metrics`
Service metrics and statistics.

**Response:**
```json
{
  "requests": {
    "total": 1250,
    "successful": 1198,
    "errors": 52,
    "success_rate": 0.958
  },
  "concepts": {
    "extracted_today": 45,
    "avg_confidence": 0.83,
    "most_common_categories": [
      "Data Structures and Algorithms",
      "Backend Engineering",
      "Frontend Development"
    ]
  },
  "performance": {
    "avg_extraction_time": 2.1,
    "p95_extraction_time": 4.8,
    "max_extraction_time": 12.3
  }
}
```

## 🔧 Error Handling

### Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details",
    "suggestion": "How to fix the error"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456"
}
```

### Common HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions or rate limited
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Error Examples

#### Authentication Error
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "details": {
    "suggestion": "Please sign in or provide a valid API key"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Rate Limit Error
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 20,
    "reset_time": "2024-01-15T11:00:00Z",
    "suggestion": "Please wait or upgrade your plan"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Validation Error
```json
{
  "error": "Invalid request data",
  "code": "VALIDATION_ERROR",
  "details": {
    "conversation_text": "This field is required",
    "max_length": "Text cannot exceed 50,000 characters"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Rate Limiting

### Rate Limits

- **Free Plan**: 20 requests per hour
- **With Custom API Key**: 100 requests per hour
- **Pro Plan**: 500 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1642248000
X-RateLimit-Retry-After: 3600
```

## 🔍 Usage Examples

### JavaScript/TypeScript

```typescript
// Extract concepts from text
async function extractConcepts(text: string) {
  const response = await fetch('/api/extract-concepts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_text: text
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// Get user's concepts
async function getConcepts(filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`/api/concepts?${params}`)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// Update a concept
async function updateConcept(id: string, updates: Partial<Concept>) {
  const response = await fetch(`/api/concepts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}
```

### Python

```python
import requests
import json

class RecallAPI:
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({'X-Custom-API-Key': api_key})
    
    def extract_concepts(self, text: str):
        """Extract concepts from conversation text"""
        response = self.session.post(
            f"{self.base_url}/api/extract-concepts",
            json={"conversation_text": text}
        )
        response.raise_for_status()
        return response.json()
    
    def get_concepts(self, **filters):
        """Get user's concepts with optional filters"""
        response = self.session.get(
            f"{self.base_url}/api/concepts",
            params=filters
        )
        response.raise_for_status()
        return response.json()
    
    def create_concept(self, concept_data: dict):
        """Create a new concept"""
        response = self.session.post(
            f"{self.base_url}/api/concepts",
            json=concept_data
        )
        response.raise_for_status()
        return response.json()

# Usage
api = RecallAPI("https://your-recall-instance.com")
result = api.extract_concepts("Discussion about binary search algorithms...")
concepts = api.get_concepts(category="Algorithm", limit=10)
```

### cURL Examples

```bash
# Extract concepts
curl -X POST "https://your-recall-instance.com/api/extract-concepts" \
  -H "Content-Type: application/json" \
  -d '{"conversation_text": "Let me explain binary search..."}'

# Get concepts with filtering
curl "https://your-recall-instance.com/api/concepts?category=Algorithm&limit=5"

# Update concept
curl -X PUT "https://your-recall-instance.com/api/concepts/concept_123" \
  -H "Content-Type: application/json" \
  -d '{"category": "Data Structures"}'

# Health check
curl "https://your-recall-instance.com/api/v1/health"
```

This API documentation provides a comprehensive reference for integrating with Recall's services, whether you're building a custom frontend, automating concept extraction, or integrating with other tools. 