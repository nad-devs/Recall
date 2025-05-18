# Concept Analyzer

A powerful tool to extract, organize, and visualize technical concepts from conversations.

## Overview

Concept Analyzer processes conversations about technical topics and extracts key concepts, details, and relationships. It's designed to help users learn from and reference technical discussions more effectively.

## Features

- **Concept Extraction**: Automatically identifies technical concepts from conversations
- **Structured Organization**: Separates content into summaries, details, and code snippets
- **Relationship Mapping**: Identifies connections between related concepts
- **Interactive UI**: Easy-to-navigate interface for exploring extracted knowledge

## Architecture

- **Backend**: FastAPI service with OpenAI integration for concept extraction
- **Frontend**: React/Next.js web interface for visualization
- **Data Flow**: 
  1. User submits conversation text
  2. Backend extracts structured concept information
  3. Frontend displays concepts in an organized manner

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- OpenAI API key

### Installation

1. Clone the repository
2. Install Python dependencies:
   ```
   cd pyservice
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```
   cd notes-ai
   npm install
   ```

### Running the Application

1. Start the backend:
   ```
   cd pyservice
   python -m uvicorn concept_extractor:app --reload
   ```
2. Start the frontend:
   ```
   cd notes-ai
   npm run dev
   ```

## License

MIT 