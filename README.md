# Recall - AI-Powered Learning Companion

<div align="center">

![Recall Logo](https://img.shields.io/badge/Recall-AI%20Learning-blue?style=for-the-badge&logo=brain&logoColor=white)

**Transform conversations and notes into a structured knowledge base automatically**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=flat&logo=openai&logoColor=white)](https://openai.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://recall-henna.vercel.app) • [Backend API](https://recall.p3vg.onrender.com) • [Documentation](#documentation)

</div>

## 🧠 What is Recall?

**Recall** is an intelligent learning companion that transforms your conversations, notes, study sessions, and learning materials into a beautifully organized, searchable knowledge base. Think of it as having a personal AI assistant that extracts key concepts from anything you learn and organizes them in a way that makes sense for your learning journey.

### ✨ Key Highlights

- 🤖 **AI-Powered Extraction**: Automatically extracts and organizes concepts from any text
- 🎯 **Dual-Mode Processing**: Optimized for both technical (programming, algorithms) and non-technical (business, psychology) content
- 🗂️ **Smart Categorization**: 130+ predefined categories with custom category support
- 🔗 **Relationship Mapping**: Automatically discovers connections between concepts
- 📚 **Multi-Format Support**: Works with conversations, notes, tutorials, documentation
- 🎨 **Beautiful Interface**: Modern, responsive design with dark/light themes
- 🔍 **Semantic Search**: Find concepts by meaning, not just keywords
- 📱 **Progressive Web App**: Works seamlessly on desktop and mobile

## 🚀 Features

### 🧩 Intelligent Concept Extraction
- **Smart Content Detection**: Automatically detects content type and adjusts extraction strategy
- **Rich Structured Output**: Summary, details, key points, examples, and code snippets
- **LeetCode Problem Recognition**: Special handling for algorithm problems and coding challenges
- **Confidence Scoring**: AI confidence levels for extracted concepts

### 🏗️ Advanced Organization
- **Hierarchical Categories**: Organized structure like "Frontend → React → Hooks → useState"
- **Custom Categories**: Create your own categories and subcategories
- **Concept Relationships**: Bidirectional linking between related concepts
- **Tag System**: Additional labeling and organization options

### 🎓 Learning Enhancement
- **Review System**: Spaced repetition for concept reinforcement
- **Mastery Tracking**: Track your understanding levels (Beginner → Expert)
- **Quiz Generation**: AI-generated practice questions from your concepts
- **Personal Notes**: Add your own insights and examples

### 🔍 Discovery & Navigation
- **Semantic Search**: Find concepts by meaning and context
- **Related Concept Suggestions**: Discover what to learn next
- **Visual Knowledge Graph**: See how your learning connects
- **Category Browsing**: Navigate through organized knowledge hierarchy

## 🏛️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: Redux Toolkit + React hooks
- **Authentication**: NextAuth.js with OAuth providers
- **Database**: Prisma ORM with PostgreSQL

### Backend (Python FastAPI)
- **Framework**: FastAPI for high-performance API
- **AI Integration**: OpenAI GPT-4 for concept extraction
- **Language Processing**: LangChain for LLM orchestration
- **Caching**: Response caching for performance
- **Deployment**: Containerized with Docker

## 🛠️ Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.8+ (for backend service)
- **PostgreSQL** or **SQLite** for database
- **OpenAI API Key** (required for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/nad-devs/Recall.git
cd Recall
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Setup below)

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

Your frontend will be running at `http://localhost:3000`

### 3. Backend Setup (Required for AI Features)
```bash
# Switch to backend branch
git checkout backend

# Set up Python environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend service
python main.py
```

Your backend API will be running at `http://localhost:8000`

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/recall"
# For development with SQLite: "file:./dev.db"

# AI Configuration (Required)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Backend Service
BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"

# Environment
NODE_ENV="development"
```

### Getting API Keys

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Google OAuth**: Setup at [Google Cloud Console](https://console.cloud.google.com/)
3. **GitHub OAuth**: Configure at [GitHub Developer Settings](https://github.com/settings/developers)

## 🎯 How to Use

### 1. **Analyze Content**
Paste any learning material into the analyze page:
- ChatGPT conversations
- YouTube tutorial transcripts
- Study notes or documentation
- Meeting notes or discussions

### 2. **Review Extracted Concepts**
The AI will automatically:
- Extract key concepts with summaries
- Categorize them appropriately
- Suggest relationships to existing concepts
- Generate code examples where relevant

### 3. **Organize Your Knowledge**
- Move concepts between categories
- Create custom categories for your learning domains
- Link related concepts together
- Add personal notes and insights

### 4. **Learn and Review**
- Use semantic search to find concepts
- Browse your knowledge graph
- Take AI-generated quizzes
- Track your learning progress

## 📚 Example Use Cases

### For Developers
```
Input: "React useState allows you to add state to functional components..."
Output: Structured concept with:
- Title: "React useState Hook"
- Category: "Frontend Engineering > React > Hooks"
- Code examples with syntax highlighting
- Related concepts: "React Components", "State Management"
```

### For Students
```
Input: "Machine learning algorithms can be supervised or unsupervised..."
Output: Organized concepts for:
- Supervised Learning
- Unsupervised Learning
- Algorithm Classification
- Connected to existing ML concepts
```

### For Professionals
```
Input: "Our microservices architecture uses event-driven communication..."
Output: Concepts extracted for:
- Microservices Architecture
- Event-Driven Design
- Inter-service Communication
- System Design patterns
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build the application
npm run build

# Deploy to Vercel
npx vercel --prod
```

### Backend (Render/Railway)
```bash
# Switch to backend branch
git checkout backend

# Deploy using Docker
docker build -t recall-backend .
docker run -p 8000:8000 recall-backend
```

### Database (Neon/Supabase)
```bash
# Run migrations on production database
npx prisma migrate deploy
npx prisma generate
```

## 🧪 Development Scripts

```bash
# Frontend development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Database operations
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## 🔧 API Documentation

### Key Endpoints

- `POST /api/extract-concepts` - Extract concepts from text
- `GET /api/concepts` - Retrieve user's concepts
- `POST /api/concepts` - Create new concept
- `PUT /api/concepts/:id` - Update concept
- `DELETE /api/concepts/:id` - Delete concept
- `GET /api/categories` - Get category hierarchy

### Backend Service
- `POST /api/v1/extract-concepts` - AI concept extraction
- `POST /api/v1/generate-quiz` - Generate quiz questions
- `GET /api/v1/health` - Service health check

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure all features work
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes

### Development Guidelines
- Use TypeScript for type safety
- Follow the existing component patterns
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API that powers our concept extraction
- **Vercel** for excellent Next.js hosting and deployment
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/nad-devs/Recall/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nad-devs/Recall/discussions)
- **Email**: [Create an issue](https://github.com/nad-devs/Recall/issues/new) for support

---

<div align="center">

**Built with ❤️ for learners, by learners**

[⭐ Star us on GitHub](https://github.com/nad-devs/Recall) • [🐛 Report Bug](https://github.com/nad-devs/Recall/issues) • [💡 Request Feature](https://github.com/nad-devs/Recall/issues)

</div> 