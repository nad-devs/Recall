# Recall - AI-Powered Learning Concept Extractor

**Transform conversations and notes into a structured knowledge base automatically.**

Recall is a free, open-source tool that uses AI to extract, organize, and connect learning concepts from your conversations, notes, and study materials. Built with Next.js, TypeScript, and Python, it provides both technical and non-technical concept extraction with intelligent categorization.

## ✨ Key Features

### 🧠 **Intelligent Concept Extraction**
- **Dual-Mode Processing**: Enhanced handling for both technical (coding, algorithms) and non-technical (business, psychology, finance) concepts
- **Smart Content Detection**: Automatically detects content type and adjusts extraction strategy
- **Rich Structured Output**: Summary, details, key points, examples, and code snippets for every concept

### 🔗 **Advanced Relationship Mapping**
- **Automatic Linking**: Discovers connections between concepts across conversations
- **Bidirectional Relationships**: Creates two-way links between related concepts
- **Concept Matching**: Intelligent detection and merging of duplicate concepts

### 📚 **Intelligent Categorization**
- **130+ Categories**: Comprehensive categorization system covering technical and non-technical domains
- **Fuzzy Matching**: Smart category suggestion with variation handling
- **Hierarchical Organization**: Nested categories for precise organization

### 💬 **Conversation Analysis**
- **Multi-Format Support**: Analyze conversations, notes, documentation, and learning materials
- **Context Awareness**: Maintains conversation context for better concept extraction
- **Auto-Save & Review**: Automatic conversation saving with concept review workflow

### 🎯 **Learning Progress Tracking**
- **Mastery Levels**: Track understanding from beginner to expert
- **Review System**: Spaced repetition for concept reinforcement
- **Personal Notes**: Add custom insights and examples

### 🔍 **Advanced Search & Discovery**
- **Semantic Search**: Find concepts by meaning, not just keywords
- **Visual Knowledge Graph**: See your learning connections grow
- **Smart Recommendations**: Discover related concepts to explore

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.8+
- **OpenAI API Key** (or custom API endpoint)
- **PostgreSQL** (production) or **SQLite** (development)

### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/recall
cd recall

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL
# - OPENAI_API_KEY
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# Set up database
npx prisma migrate dev
npx prisma generate

# Start the development server
npm run dev
```

### 2. Backend Service Setup (Required for Analysis)

The Python backend service handles the AI-powered concept extraction:

```bash
# Switch to backend branch
git checkout backend

# Set up Python environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the Python service
python main.py
# Service runs on http://localhost:8000
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database Studio**: `npm run db:studio`

## 🏗 Architecture Overview

### **Frontend (Next.js 15)**
- **Branch**: `main`
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS + Radix UI components
- **State**: Redux Toolkit + React hooks
- **Authentication**: NextAuth.js with OAuth providers

### **Backend Services**
- **Branch**: `backend` 
- **Python Service**: FastAPI for AI processing
- **API Routes**: Next.js API routes for data operations
- **Database**: Prisma ORM with PostgreSQL/SQLite

### **Key Components**

#### Frontend Structure
```
app/
├── analyze/           # Conversation analysis interface
├── concepts/          # Concept management and viewing
├── conversations/     # Conversation history
├── dashboard/         # User dashboard and analytics
├── auth/              # Authentication pages
├── api/               # Next.js API routes
│   ├── concepts/      # Concept CRUD operations
│   ├── conversations/ # Conversation management
│   ├── extract-concepts/ # Integration with Python service
│   └── auth/          # Authentication endpoints
└── admin/             # Admin panel (if enabled)

components/
├── ui/                # Reusable UI components
├── concept/           # Concept-specific components
├── conversation/      # Conversation-related components
└── analysis/          # Analysis workflow components

hooks/
├── useAnalyzePage.ts  # Main analysis workflow logic
├── useAutoAnalysis.ts # Auto-analysis features
└── useConcepts.ts     # Concept management
```

#### Backend Structure
```
pyservice/
├── concept_extractor.py # Core AI extraction logic
├── main.py             # FastAPI application
└── requirements.txt    # Python dependencies

api/v1/
├── extract-concepts.py # Concept extraction endpoint
├── generate-quiz.py    # Quiz generation
└── health.py          # Health checks
```

## 🛠 Technology Stack

### **Frontend Stack**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Redux Toolkit**: State management
- **React Hook Form**: Form handling with validation
- **Framer Motion**: Animations and transitions
- **NextAuth.js**: Authentication and session management

### **Backend Stack**
- **FastAPI**: Python web framework for AI services
- **OpenAI GPT-4**: Language model for concept extraction
- **LangChain**: LLM orchestration and chains
- **Prisma**: Type-safe database toolkit
- **PostgreSQL**: Production database
- **SQLite**: Development database

### **Infrastructure**
- **Vercel**: Frontend hosting and serverless functions
- **Railway/Render**: Backend service hosting
- **Docker**: Containerization for deployment
- **GitHub Actions**: CI/CD workflows

## 📊 Core Features Deep Dive

### **Concept Extraction Engine**

The heart of Recall is its dual-mode concept extraction system:

#### Technical Content Processing
- **Code Analysis**: Extracts algorithms, data structures, and implementation patterns
- **Technical Documentation**: Processes API docs, tutorials, and technical articles
- **Problem-Solving**: Handles LeetCode-style problems and coding challenges
- **Framework Learning**: Extracts concepts from React, Python, database tutorials

#### Non-Technical Content Processing
- **Business Concepts**: Finance, marketing, management principles
- **Soft Skills**: Communication, leadership, time management
- **Academic Topics**: Psychology, history, science concepts
- **Practical Knowledge**: Life skills, hobby learning, personal development

### **Smart Categorization System**

With 130+ predefined categories including:

**Technical Categories:**
- Data Structures & Algorithms
- Backend Engineering → Authentication, APIs, Databases
- Frontend Development → React, CSS, JavaScript
- DevOps → Docker, CI/CD, Monitoring
- Machine Learning → Deep Learning, NLP, Computer Vision

**Non-Technical Categories:**
- Business → Finance, Marketing, Operations, Strategy
- Psychology → Cognitive Biases, Learning Techniques
- Personal Development → Productivity, Communication
- Health & Wellness → Mental Health, Exercise, Nutrition

### **Relationship Discovery**

The system automatically identifies and creates relationships between concepts:

- **Prerequisite Relationships**: Concept A should be learned before Concept B
- **Complementary Concepts**: Topics that work well together
- **Contrast Relationships**: Concepts that are alternatives or opposites
- **Implementation Relationships**: Theory to practice connections

## 🔧 Configuration & Environment

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/recall"
# For development: "file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
PYTHON_SERVICE_URL="http://localhost:8000"

# Optional: Custom model endpoints
CUSTOM_AI_ENDPOINT="https://your-custom-endpoint.com"

# Analytics (optional)
POSTHOG_KEY="your-posthog-key"
SENTRY_DSN="your-sentry-dsn"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### Database Setup

#### Development (SQLite)
```bash
npm run db:generate
npm run db:migrate
```

#### Production (PostgreSQL)
```bash
# Set DATABASE_URL to PostgreSQL connection string
npm run db:migrate
npm run db:generate
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

### Backend Deployment (Railway)

```bash
# Switch to backend branch
git checkout backend

# Deploy to Railway
railway login
railway new
railway up

# Configure environment variables in Railway dashboard
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🧪 Testing & Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio

# Testing
npm run test           # Run all tests
npm run test:apis      # Test API endpoints
npm run test:health    # Health check tests
npm run test:email     # Email verification tests
```

### Python Service Testing

```bash
# Switch to backend branch
git checkout backend

# Test the concept extraction
python test_comprehensive_analysis.py

# Test quiz generation
python test_quiz_validation.py

# Test with custom API key
python test_custom_api_key.py
```

## 📚 API Documentation

### Frontend API Routes

#### Concepts
- `GET /api/concepts` - List user's concepts
- `POST /api/concepts` - Create new concept
- `GET /api/concepts/[id]` - Get specific concept
- `PUT /api/concepts/[id]` - Update concept
- `DELETE /api/concepts/[id]` - Delete concept
- `POST /api/concepts/check-existing` - Check for duplicate concepts

#### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/saveConversation` - Save new conversation
- `GET /api/conversations/[id]` - Get specific conversation

#### Analysis
- `POST /api/extract-concepts` - Extract concepts from text

### Python Backend API

#### Core Endpoints
- `POST /api/v1/extract-concepts` - Main concept extraction
- `POST /api/v1/generate-quiz` - Generate quiz from concepts
- `GET /api/v1/health` - Service health check

## 🤝 Contributing

We welcome contributions! Whether you're:

- 🐛 **Reporting bugs** - Use GitHub Issues with detailed reproduction steps
- 💡 **Suggesting features** - Open a discussion or issue with your idea
- 🔧 **Contributing code** - Fork, create a feature branch, and submit a PR
- 📝 **Improving docs** - Help make our documentation clearer and more comprehensive
- 🎨 **Designing** - UI/UX improvements and design suggestions

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper testing
4. **Commit with clear messages**: `git commit -m "Add amazing feature"`
5. **Push to your branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with description of changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for powerful language models
- **Vercel** for hosting and deployment infrastructure
- **The Next.js team** for an amazing React framework
- **The open-source community** for inspiration and contributions

---

**Built with ❤️ for learners, by learners.**

[⭐ Star us on GitHub](https://github.com/your-org/recall) | [📖 Full Documentation](./docs/) | [💬 Join Community](https://discord.gg/recall) 