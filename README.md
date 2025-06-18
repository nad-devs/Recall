# Recall - AI-Powered Learning Knowledge Base

<!-- Latest working frontend deployed -->

<div align="center">

![Recall Logo](https://img.shields.io/badge/Recall-AI%20Learning-blue?style=for-the-badge&logo=brain&logoColor=white)

**Transform conversations and notes into a structured, searchable knowledge base automatically**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=flat&logo=openai&logoColor=white)](https://openai.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[🚀 Live Demo](https://recall-henna.vercel.app) • [🔧 Backend API](https://recall.p3vg.onrender.com) • [📚 Documentation](#documentation)

</div>

## 🧠 What is Recall?

**Recall** is an intelligent learning companion that automatically extracts, organizes, and structures knowledge from any text content. Whether you're studying programming concepts, analyzing conversations, or organizing meeting notes, Recall transforms unstructured information into a beautiful, searchable knowledge base.

### ✨ Key Highlights

- 🤖 **Advanced AI Extraction**: GPT-4 powered concept extraction with high accuracy.
- 🎯 **Smart Content Detection**: Specialized processing for LeetCode problems, technical discussions, and general learning content.
- 🏗️ **Hierarchical Organization**: Predefined categories with support for custom categorization.
- 🔗 **Intelligent Relationships**: Automatic concept linking and dependency mapping.
- 📱 **Full-Stack Application**: Modern Next.js frontend with a high-performance FastAPI backend.
- 🔍 **Semantic Search**: Find concepts by meaning, context, and relationships.
- 🎨 **Beautiful UI**: Responsive design with dark/light themes and smooth animations.
- 🔐 **Multi-Auth Support**: Email, Google OAuth, and GitHub authentication.

## 🏛️ Architecture

Recall uses a microservices architecture, separating the user-facing application from the AI processing backend.

### Frontend Stack (Next.js 15)
The frontend is a modern web application built with the latest technologies to ensure a fast, reliable, and user-friendly experience.
```
📦 Frontend Architecture
├── 🖥️  Next.js 15.2.4 (App Router)
├── 🔷  TypeScript 5+ (Strict Mode)
├── 🎨  Tailwind CSS 4 + Radix UI
├── 🔄  Redux Toolkit (State Management)
├── 🔐  NextAuth.js (Authentication)
├── 🗄️  Prisma ORM + PostgreSQL
├── 📊  Vercel Analytics & Speed Insights
├── 🎭  Framer Motion (Animations)
└── 📱  PWA Support
```

### Backend Stack (Python FastAPI)
The backend is a high-performance Python service dedicated to AI-powered analysis and data processing.
```
📦 Backend Architecture
├── ⚡  FastAPI (High-performance API)
├── 🤖  OpenAI GPT-4 Integration
├── 🔗  LangChain (LLM Orchestration)
├── 🐍  Python 3.8+ with Async/Await
├── 🚀  Docker Containerization
├── 🌐  CORS & Security Middleware
└── 📊  Comprehensive Logging
```

## 🚀 Features

### 🧩 AI-Powered Concept Extraction
- **Advanced Pattern Recognition**: Specialized detection for various content types including technical discussions and learning materials.
- **Rich Structured Output**: Extracts titles, summaries, detailed explanations, key points, and code examples.
- **Multi-Language Code Support**: Identifies and syntax-highlights code in numerous languages.
- **Confidence Scoring**: Provides AI-generated confidence scores for each extraction.
- **Context-Aware Processing**: Adapts its extraction strategy based on the type of content provided.

### 🎓 Learning and Organization
- **Hierarchical Categorization**: Organizes concepts into a structured tree.
- **Dynamic Category Learning**: Improves categorization accuracy over time by learning from user-provided corrections.
- **AI Quiz Generation**: Creates quizzes from your concepts to help reinforce learning.
- **Relationship Mapping**: Automatically links related concepts to build a knowledge graph.

## 🛠️ Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.8+
- **PostgreSQL** (or another Prisma-compatible database)
- **OpenAI API Key**

### 1. Clone the repository
```bash
git clone https://github.com/nad-devs/recall.git
cd recall
```

### 2. Backend Setup (`backend` branch)
The Python backend handles all the AI processing.

```bash
# Switch to the backend branch
git checkout backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# (Create a .env file and add your OPENAI_API_KEY)
export OPENAI_API_KEY="your-key-here"

# Run the service
uvicorn api.v1.extract_concepts:app --reload
```
The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup (`main` branch)
The Next.js app is the main user interface.

```bash
# Switch back to the main branch
git checkout main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local to add your database URL, NextAuth secret,
# and point NEXT_PUBLIC_BACKEND_URL to http://localhost:8000

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```
The frontend will be running at `http://localhost:3000`.

## ⚙️ Environment Configuration

You will need a `.env.local` file in the root of the `main` branch checkout.

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."

# Backend URL
# This should point to your running FastAPI service
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```
And a `.env` file in the root of the `backend` branch checkout.
```env
# AI Configuration
OPENAI_API_KEY="sk-your-openai-key"
```

## 🚀 Deployment

The application is designed for easy deployment on platforms like Vercel (for the frontend) and Render (for the backend).

-   **Frontend (Vercel)**: Connect your repository to Vercel and it will automatically build and deploy the Next.js application from the `main` branch.
-   **Backend (Render)**: Use the `render.yaml` file in the `backend` branch to deploy the FastAPI service. The `Dockerfile` is also available for containerized deployments.

## 🤝 Contributing

We welcome contributions! Please check out the [GitHub Issues](https://github.com/nad-devs/recall/issues) and [Discussions](https://github.com/nad-devs/recall/discussions) to get started.

1.  **Fork the repository.**
2.  Create a feature branch: `git checkout -b feature/my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin feature/my-new-feature`
5.  Submit a pull request.

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
