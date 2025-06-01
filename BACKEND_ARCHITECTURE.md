# Backend Architecture Documentation

This document provides a comprehensive overview of the Recall backend services, including the Python-based AI processing service and Next.js API integration.

## 🏗 Architecture Overview

### Backend Components
- **Python AI Service**: FastAPI-based concept extraction engine
- **Next.js API Routes**: Frontend-backend integration layer
- **Database Layer**: Prisma ORM with PostgreSQL/SQLite
- **Authentication**: NextAuth.js session management
- **External APIs**: OpenAI GPT-4 integration

### Technology Stack
- **Python Service**: FastAPI 0.104+ with Python 3.8+
- **AI/ML**: OpenAI GPT-4, LangChain for LLM orchestration
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: Prisma 6 with TypeScript bindings
- **Caching**: In-memory caching for categories and frequent queries
- **Deployment**: Docker containers, Railway/Render hosting

## 🐍 Python AI Service Architecture

### Service Structure

```
pyservice/
├── concept_extractor.py    # Core extraction logic (104KB, 1881 lines)
├── main.py                # FastAPI application entry point
├── requirements.txt       # Python dependencies
├── __init__.py           # Package initialization
├── test_comprehensive_analysis.py  # Comprehensive testing
├── test_quiz_validation.py         # Quiz generation testing
├── test_custom_api_key.py          # API key testing
└── README.md             # Service documentation

api/v1/
├── extract-concepts.py   # Main concept extraction endpoint
├── generate-quiz.py      # Quiz generation from concepts
├── health.py            # Health check endpoint
└── requirements.txt     # API-specific dependencies
```

### Core Components

#### 1. ConceptExtractor Class (`concept_extractor.py`)

The heart of the AI processing system, responsible for:
- **Text Analysis**: Processing conversation text and extracting concepts
- **Content Type Detection**: Distinguishing technical vs non-technical content
- **Category Management**: 130+ predefined categories with fuzzy matching
- **Relationship Discovery**: Identifying connections between concepts
- **Confidence Scoring**: Rating extraction quality

```python
class ConceptExtractor:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.categories_cache = None
        self.category_learning = CategoryLearning()
        
    async def extract_concepts(self, conversation_text: str, custom_api_key: str = None):
        """Main entry point for concept extraction"""
        # Content type detection
        content_type = self._detect_content_type(conversation_text)
        
        # Segment conversation for analysis
        segments = self._segment_conversation(conversation_text)
        
        # Extract concepts from each segment
        extracted_concepts = []
        for segment in segments:
            concepts = await self._analyze_segment(segment, content_type)
            extracted_concepts.extend(concepts)
        
        # Post-process and deduplicate
        final_concepts = self._post_process_concepts(extracted_concepts)
        
        return {
            "concepts": final_concepts,
            "conversation_summary": self._generate_summary(conversation_text),
            "content_type": content_type
        }
```

#### 2. Content Type Detection System

Enhanced detection for better concept extraction:

```python
def _detect_content_type(self, text: str) -> str:
    """Detect whether content is technical or non-technical"""
    text_lower = text.lower()
    
    # Technical indicators
    technical_indicators = [
        'function', 'class', 'method', 'variable', 'code', 'programming',
        'algorithm', 'data structure', 'array', 'list', 'dictionary',
        'api', 'database', 'sql', 'javascript', 'python', 'react'
    ]
    
    # Non-technical indicators  
    non_technical_indicators = [
        'psychology', 'business', 'finance', 'marketing', 'leadership',
        'communication', 'management', 'strategy', 'personal development'
    ]
    
    technical_score = sum(1 for indicator in technical_indicators if indicator in text_lower)
    non_technical_score = sum(1 for indicator in non_technical_indicators if indicator in text_lower)
    
    if technical_score > non_technical_score * 1.5:
        return "TECHNICAL"
    elif non_technical_score > technical_score:
        return "NON_TECHNICAL"
    else:
        return "MIXED"
```

#### 3. Advanced Categorization System

130+ categories with intelligent matching:

```python
async def _fetch_categories(self) -> List[str]:
    """Comprehensive category system for technical and non-technical content"""
    default_categories = [
        # Technical Categories
        "Data Structures and Algorithms",
        "Backend Engineering > Authentication",
        "Frontend Development > React",
        "Machine Learning > Deep Learning",
        "DevOps > Docker",
        
        # Non-Technical Categories
        "Business > Finance > Investment Strategies",
        "Psychology > Cognitive Biases",
        "Personal Development > Productivity",
        "Health & Wellness > Mental Health",
        "Communication > Public Speaking"
    ]
    
    # Fetch from API with fallback to defaults
    try:
        response = await self._api_request('/api/categories')
        return response.get('categories', default_categories)
    except:
        return default_categories
```

#### 4. Enhanced Prompting System

Dual-mode prompting for technical vs non-technical content:

```python
def _build_analysis_prompt(self, text: str, content_type: str) -> str:
    """Build content-specific prompts for better extraction"""
    
    base_prompt = """
    Analyze the following conversation and extract key learning concepts.
    For each concept, provide:
    - Title (concise, descriptive)
    - Summary (2-3 sentences)
    - Details (comprehensive explanation)
    - Key Points (3-5 bullet points)
    - Examples (practical applications)
    - Related Concepts (connections to other topics)
    """
    
    if content_type == "NON_TECHNICAL":
        content_guidance = """
        IMPORTANT - NON-TECHNICAL CONTENT ENHANCEMENT:
        Since this is non-technical content, ensure you provide:
        - Rich, detailed explanations even without code examples
        - Practical applications and real-world examples
        - Actionable insights and implementation strategies
        - Context about when and why to apply these concepts
        - Common pitfalls and success factors
        """
    else:
        content_guidance = """
        TECHNICAL CONTENT GUIDANCE:
        For technical content, include:
        - Code examples and implementation details
        - Performance considerations and complexity analysis
        - Common use cases and patterns
        - Integration with other technologies
        - Best practices and anti-patterns
        """
    
    return base_prompt + content_guidance + f"\n\nText to analyze:\n{text}"
```

### API Endpoints

#### 1. Main Concept Extraction (`/api/v1/extract-concepts`)

```python
@app.post("/api/v1/extract-concepts")
async def extract_concepts_endpoint(request: ConceptExtractionRequest):
    """
    Main endpoint for concept extraction from conversation text.
    
    Handles:
    - Text preprocessing and segmentation
    - Content type detection
    - AI-powered concept extraction
    - Category assignment and validation
    - Response formatting
    """
    try:
        extractor = ConceptExtractor()
        
        # Custom API key handling
        if request.custom_api_key:
            extractor.set_api_key(request.custom_api_key)
        
        # Extract concepts
        result = await extractor.extract_concepts(
            conversation_text=request.conversation_text,
            user_preferences=request.user_preferences
        )
        
        return ConceptExtractionResponse(
            concepts=result["concepts"],
            conversation_summary=result["conversation_summary"],
            processing_time=result["processing_time"],
            content_type=result["content_type"]
        )
        
    except Exception as e:
        logger.error(f"Concept extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### 2. Quiz Generation (`/api/v1/generate-quiz`)

```python
@app.post("/api/v1/generate-quiz")
async def generate_quiz_endpoint(request: QuizGenerationRequest):
    """
    Generate interactive quizzes from extracted concepts.
    
    Supports:
    - Multiple choice questions
    - Code completion challenges
    - Scenario-based questions
    - Difficulty level adaptation
    """
    try:
        quiz_generator = QuizGenerator()
        
        quiz = await quiz_generator.generate_quiz(
            concepts=request.concepts,
            difficulty=request.difficulty,
            question_count=request.question_count,
            quiz_type=request.quiz_type
        )
        
        return QuizResponse(
            questions=quiz["questions"],
            estimated_time=quiz["estimated_time"],
            difficulty_level=quiz["difficulty_level"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3. Health Check (`/api/v1/health`)

```python
@app.get("/api/v1/health")
async def health_check():
    """
    Comprehensive health check for service monitoring.
    
    Checks:
    - Service status
    - Database connectivity
    - OpenAI API availability
    - Memory usage
    - Cache status
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "checks": {}
    }
    
    # Database check
    try:
        # Test database connection if applicable
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # OpenAI API check
    try:
        # Test OpenAI connectivity
        test_response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        health_status["checks"]["openai"] = "healthy"
    except Exception as e:
        health_status["checks"]["openai"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status
```

## 🔗 Frontend Integration Layer

### Next.js API Routes

The frontend uses Next.js API routes to integrate with both the Python service and the database:

#### 1. Concept Extraction Integration (`/api/extract-concepts`)

```typescript
// app/api/extract-concepts/route.ts
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { conversation_text, customApiKey } = body
    
    // Forward to Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    const response = await fetch(`${pythonServiceUrl}/api/v1/extract-concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customApiKey || process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        conversation_text,
        user_id: session.user.id,
        user_preferences: {
          preferred_categories: await getUserPreferredCategories(session.user.id),
          extraction_depth: 'detailed'
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`)
    }
    
    const extractionResult = await response.json()
    
    // Enhance with database context
    const enhancedConcepts = await enhanceConceptsWithContext(
      extractionResult.concepts,
      session.user.id
    )
    
    return Response.json({
      ...extractionResult,
      concepts: enhancedConcepts
    })
    
  } catch (error) {
    console.error('Concept extraction error:', error)
    return Response.json(
      { error: 'Failed to extract concepts' }, 
      { status: 500 }
    )
  }
}
```

#### 2. Concept Management APIs

```typescript
// app/api/concepts/route.ts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return unauthorizedResponse()
  
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const concepts = await prisma.concept.findMany({
    where: {
      userId: session.user.id,
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      conversation: {
        select: { id: true, title: true, createdAt: true }
      },
      codeSnippets: true
    },
    orderBy: { lastUpdated: 'desc' },
    take: limit,
    skip: offset
  })
  
  return Response.json({ concepts })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return unauthorizedResponse()
  
  const body = await request.json()
  
  // If this is a manual concept creation, enhance with AI
  if (body.isManualCreation) {
    const enhancedConcept = await enhanceManualConcept(body, session.user.id)
    return Response.json({ concept: enhancedConcept })
  }
  
  // Standard concept creation
  const concept = await prisma.concept.create({
    data: {
      ...body,
      userId: session.user.id,
      lastUpdated: new Date()
    },
    include: {
      conversation: true,
      codeSnippets: true
    }
  })
  
  return Response.json({ concept })
}
```

#### 3. Conversation Management

```typescript
// app/api/saveConversation/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return unauthorizedResponse()
  
  const body = await request.json()
  const { conversation_text, analysis, userInfo } = body
  
  try {
    // Check for existing similar concepts
    const existingConceptMatches = await checkForSimilarConcepts(
      analysis.concepts,
      session.user.id
    )
    
    if (existingConceptMatches.length > 0 && !body.confirmUpdate) {
      return Response.json({
        requiresConfirmation: true,
        existingConcepts: existingConceptMatches,
        originalData: body
      })
    }
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        text: conversation_text,
        title: analysis.conversation_title,
        summary: analysis.conversation_summary,
        userId: session.user.id
      }
    })
    
    // Create or update concepts
    const createdConcepts = await Promise.all(
      analysis.concepts.map(async (conceptData: any) => {
        return await prisma.concept.create({
          data: {
            title: conceptData.title,
            category: conceptData.category,
            summary: conceptData.summary,
            details: JSON.stringify(conceptData.details),
            keyPoints: JSON.stringify(conceptData.keyPoints),
            examples: JSON.stringify(conceptData.examples || []),
            codeSnippets: JSON.stringify(conceptData.codeSnippets || []),
            relatedConcepts: JSON.stringify(conceptData.relatedConcepts || []),
            confidenceScore: conceptData.confidenceScore || 0.8,
            conversationId: conversation.id,
            userId: session.user.id
          }
        })
      })
    )
    
    return Response.json({
      success: true,
      message: `Successfully saved ${createdConcepts.length} concepts`,
      conversationId: conversation.id,
      conceptIds: createdConcepts.map(c => c.id)
    })
    
  } catch (error) {
    console.error('Save conversation error:', error)
    return Response.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    )
  }
}
```

## 🗄 Database Architecture

### Schema Design (Prisma)

The database schema is optimized for concept relationships and user isolation:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // User preferences
  timezone      String    @default("UTC")
  language      String    @default("en")
  theme         String    @default("system")
  
  // Usage tracking
  plan          String    @default("free")
  usageCount    Int       @default(0)
  lastActiveAt  DateTime  @default(now())
  
  // Relationships
  concepts      Concept[]
  conversations Conversation[]
  categories    Category[]
  feedback      Feedback[]
}

model Concept {
  id              String    @id @default(cuid())
  title           String
  category        String
  summary         String
  details         String    // JSON: rich content structure
  keyPoints       String    // JSON: array of key insights
  examples        String    // JSON: practical examples
  relatedConcepts String    // JSON: concept relationships
  relationships   String    // JSON: relationship types
  confidenceScore Float     @default(0.5)
  lastUpdated     DateTime  @default(now())
  isPlaceholder   Boolean   @default(false)
  
  // User isolation
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  // Learning progress
  masteryLevel        String?   // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  learningProgress    Int       @default(0) // 0-100%
  practiceCount       Int       @default(0)
  lastPracticed       DateTime?
  difficultyRating    Int?      // 1-5 stars
  
  // Rich content (JSON fields)
  videoResources      String    @default("[]")
  documentationLinks  String    @default("[]")
  practiceExercises   String    @default("[]")
  prerequisites       String    @default("[]")
  
  // Personal learning data
  personalNotes       String?
  mnemonics          String?
  commonMistakes     String    @default("[]")
  learningTips       String    @default("[]")
  
  // Context and usage
  useCases           String    @default("[]")
  industries         String    @default("[]")
  tools              String    @default("[]")
  tags               String    @default("[]")
  
  // Relationships
  conversation       Conversation @relation(fields: [conversationId], references: [id])
  conversationId     String
  codeSnippets       CodeSnippet[]
  occurrences        Occurrence[]
  
  createdAt          DateTime  @default(now())
}

model Conversation {
  id          String    @id @default(cuid())
  text        String
  title       String    @default("")
  summary     String
  createdAt   DateTime  @default(now())
  
  // User isolation
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  // Relationships
  concepts    Concept[]
  occurrences Occurrence[]
}
```

### Query Optimization

Key database optimizations implemented:

1. **Indexing Strategy**:
   ```sql
   -- User isolation index
   CREATE INDEX idx_concept_user_id ON Concept(userId);
   
   -- Search optimization
   CREATE INDEX idx_concept_search ON Concept USING gin(to_tsvector('english', title || ' ' || summary));
   
   -- Category filtering
   CREATE INDEX idx_concept_category ON Concept(category);
   
   -- Recent concepts
   CREATE INDEX idx_concept_recent ON Concept(userId, lastUpdated DESC);
   ```

2. **Efficient Queries**:
   ```typescript
   // Optimized concept fetching with relationships
   const conceptsWithRelations = await prisma.concept.findMany({
     where: { userId },
     include: {
       conversation: {
         select: { id: true, title: true, createdAt: true }
       },
       codeSnippets: {
         select: { id: true, language: true, description: true }
       }
     },
     orderBy: [
       { bookmarked: 'desc' },
       { lastUpdated: 'desc' }
     ]
   })
   ```

## 🚀 Performance & Scalability

### Caching Strategy

1. **Category Caching**: In-memory cache for frequently accessed categories
2. **User Preference Caching**: Redis cache for user settings
3. **Concept Relationship Caching**: Cache computed relationships

### Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/extract-concepts")
@limiter.limit("10/minute")  # Prevent abuse
async def extract_concepts_endpoint(request: Request):
    # Endpoint implementation
```

### Monitoring & Observability

1. **Health Checks**: Comprehensive service health monitoring
2. **Logging**: Structured logging with correlation IDs
3. **Metrics**: Performance metrics and usage analytics
4. **Error Tracking**: Sentry integration for error monitoring

## 🔒 Security Implementation

### API Security

1. **Authentication**: JWT token validation
2. **Authorization**: User-based resource access control
3. **Input Validation**: Pydantic models for request validation
4. **Rate Limiting**: Prevent API abuse
5. **CORS**: Controlled cross-origin requests

### Data Protection

1. **User Isolation**: All data scoped to authenticated users
2. **SQL Injection Prevention**: Prisma ORM protection
3. **XSS Prevention**: Content sanitization
4. **Environment Variables**: Secure secret management

## 🧪 Testing Strategy

### Python Service Testing

```python
# test_comprehensive_analysis.py
class TestConceptExtraction:
    async def test_technical_content_extraction(self):
        """Test extraction from technical conversations"""
        technical_text = """
        Let's discuss implementing a binary search algorithm.
        The time complexity is O(log n) and space complexity is O(1).
        """
        
        extractor = ConceptExtractor()
        result = await extractor.extract_concepts(technical_text)
        
        assert len(result["concepts"]) > 0
        assert any("binary search" in concept["title"].lower() 
                  for concept in result["concepts"])
        assert result["content_type"] == "TECHNICAL"
    
    async def test_non_technical_content_extraction(self):
        """Test extraction from non-technical conversations"""
        business_text = """
        Let's talk about effective leadership strategies.
        Good leaders focus on emotional intelligence and team building.
        """
        
        extractor = ConceptExtractor()
        result = await extractor.extract_concepts(business_text)
        
        assert len(result["concepts"]) > 0
        assert any("leadership" in concept["title"].lower() 
                  for concept in result["concepts"])
        assert result["content_type"] == "NON_TECHNICAL"
```

### API Integration Testing

```typescript
// tests/api-integration.test.ts
describe('Concept Extraction API', () => {
  test('should extract concepts from technical text', async () => {
    const response = await fetch('/api/extract-concepts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        conversation_text: 'Implementing quicksort algorithm...'
      })
    })
    
    const result = await response.json()
    expect(result.concepts).toHaveLength.greaterThan(0)
    expect(result.concepts[0]).toHaveProperty('title')
    expect(result.concepts[0]).toHaveProperty('category')
  })
})
```

## 🚀 Deployment Architecture

### Container Configuration

```dockerfile
# Dockerfile.python
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Environment Configuration

```bash
# Backend service environment variables
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL=postgresql://user:pass@host:5432/recall
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
RATE_LIMIT_PER_MINUTE=60
```

### Production Deployment

1. **Railway/Render Deployment**: One-click deployment from GitHub
2. **Docker Compose**: Multi-service deployment
3. **Kubernetes**: Scalable container orchestration
4. **Monitoring**: Health checks and performance monitoring

This backend architecture provides a robust, scalable foundation for AI-powered concept extraction while maintaining security, performance, and maintainability standards. 