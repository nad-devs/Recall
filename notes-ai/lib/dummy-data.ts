export const dummyConcepts = [
  {
    id: "concept-1",
    title: "React Server Components",
    category: "React",
    notes:
      "React Server Components (RSC) are a new type of component that runs only on the server. They allow you to write components that can access server-side resources directly, like databases or file systems, without having to create API endpoints.\n\nKey benefits:\n- Reduced client-side JavaScript\n- Direct access to server resources\n- Automatic code splitting\n- Improved performance for end users\n\nServer Components cannot use hooks or browser APIs, as they don't run in the browser. They can, however, render Client Components which do have access to these features.",
    discussedInConversations: ["conv-1", "conv-3", "conv-7"],
    needsReview: true,
  },
  {
    id: "concept-2",
    title: "Next.js App Router",
    category: "Next.js",
    notes:
      "The Next.js App Router is a new routing system introduced in Next.js 13. It's built on top of React Server Components and uses a file-system based router where folders define routes.\n\nKey features:\n- Nested layouts with shared UI across routes\n- Server Components by default\n- Loading and error states\n- Data fetching within components\n- Special files like page.js, layout.js, loading.js, and error.js\n\nThe App Router coexists with the Pages Router, allowing for incremental adoption.",
    discussedInConversations: ["conv-1", "conv-4"],
    needsReview: true,
  },
  {
    id: "concept-3",
    title: "SQL Query Optimization",
    category: "Database",
    notes:
      "SQL query optimization involves techniques to improve database performance by making queries execute faster and use fewer resources.\n\nKey techniques:\n- Proper indexing strategy\n- Query restructuring\n- Avoiding functions on indexed columns\n- Using EXPLAIN to analyze execution plans\n- Considering denormalization for read-heavy workloads\n\nOptimized queries can significantly reduce response times and server load, especially for large datasets.",
    discussedInConversations: ["conv-5"],
    needsReview: false,
  },
  {
    id: "concept-4",
    title: "Natural Language Processing",
    category: "Machine Learning",
    notes:
      "Natural Language Processing (NLP) is a field of AI focused on enabling computers to understand, interpret, and generate human language.\n\nKey components:\n- Tokenization: Breaking text into words or subwords\n- Part-of-speech tagging: Identifying grammatical components\n- Named entity recognition: Identifying proper nouns\n- Sentiment analysis: Determining emotional tone\n- Text classification: Categorizing text into predefined groups\n\nModern NLP relies heavily on transformer models like BERT, GPT, and T5.",
    discussedInConversations: ["conv-6"],
    needsReview: true,
  },
  {
    id: "concept-5",
    title: "Tokenization in NLP",
    category: "Machine Learning",
    notes:
      "Tokenization is the process of breaking text into smaller units called tokens, which can be words, subwords, or characters.\n\nKey aspects:\n- Word tokenization splits text by spaces and punctuation\n- Subword tokenization (like BPE or WordPiece) handles unknown words better\n- Character tokenization is useful for languages without clear word boundaries\n- Special tokens like [CLS], [SEP], [MASK] have specific meanings in transformer models\n\nThe choice of tokenization strategy significantly impacts model performance and vocabulary size.",
    discussedInConversations: ["conv-6"],
    needsReview: false,
  },
  {
    id: "concept-6",
    title: "Machine Learning Model Deployment",
    category: "Machine Learning",
    notes:
      "Model deployment is the process of making machine learning models available in production environments where they can receive data and return predictions.\n\nKey considerations:\n- Scalability to handle varying loads\n- Latency requirements for real-time vs. batch predictions\n- Monitoring for performance degradation\n- Version control for models\n- A/B testing for comparing model versions\n\nCommon deployment options include REST APIs, batch processing systems, and edge devices.",
    discussedInConversations: ["conv-7"],
    needsReview: true,
  },
]

// Concepts that need review
export const conceptsToReview = dummyConcepts.filter((concept) => concept.needsReview)

// Quiz questions for concepts
export const quizQuestions = [
  {
    id: "q1",
    conceptId: "concept-1",
    question: "What is the main advantage of React Server Components?",
    answer: "They can access server-side resources directly without creating API endpoints",
    options: [
      "They can access server-side resources directly without creating API endpoints",
      "They run faster than client components",
      "They support more React hooks",
      "They automatically optimize images",
    ],
  },
  {
    id: "q2",
    conceptId: "concept-2",
    question: "What is the Next.js App Router built on top of?",
    answer: "React Server Components",
    options: ["React Server Components", "Express.js", "React Router", "Redux"],
  },
  {
    id: "q3",
    conceptId: "concept-3",
    question: "What should you avoid using in WHERE clauses for better SQL performance?",
    answer: "Functions on indexed columns",
    options: ["Functions on indexed columns", "Multiple conditions", "Subqueries", "JOIN operations"],
  },
  {
    id: "q4",
    conceptId: "concept-4",
    question: "Which of these is NOT a common task in Natural Language Processing?",
    answer: "Database normalization",
    options: ["Database normalization", "Named entity recognition", "Sentiment analysis", "Part-of-speech tagging"],
  },
  {
    id: "q5",
    conceptId: "concept-5",
    question: "What is the main advantage of subword tokenization over word tokenization?",
    answer: "Better handling of unknown words",
    options: [
      "Better handling of unknown words",
      "Faster processing speed",
      "Lower memory usage",
      "Improved grammatical analysis",
    ],
  },
  {
    id: "q6",
    conceptId: "concept-6",
    question: "What is an important consideration when deploying machine learning models?",
    answer: "Monitoring for performance degradation",
    options: [
      "Monitoring for performance degradation",
      "Using only one programming language",
      "Avoiding cloud services",
      "Maximizing model complexity",
    ],
  },
]

// Dummy conversations
export const dummyConversations = [
  {
    id: "conv-1",
    title: "Introduction to Next.js 13 and React Server Components",
    date: "2023-05-15T14:30:00Z",
    summary:
      "Explored the new features in Next.js 13, focusing on the App Router and React Server Components. Discussed how they work together to improve performance and developer experience.",
    concepts: [
      { id: "concept-1", title: "React Server Components" },
      { id: "concept-2", title: "Next.js App Router" },
    ],
    codeSnippets: [
      {
        language: "TypeScript",
        code: "// Server Component\nexport default async function Page() {\n  const data = await fetchData() // Direct server data access\n  return <div>{data.map(item => <div key={item.id}>{item.name}</div>)}</div>\n}",
        conceptId: "concept-1",
      },
      {
        language: "TypeScript",
        code: "// app/dashboard/layout.tsx\nexport default function DashboardLayout({ children }) {\n  return (\n    <div>\n      <nav>Dashboard Navigation</nav>\n      <main>{children}</main>\n    </div>\n  )\n}",
        conceptId: "concept-2",
      },
    ],
  },
  {
    id: "conv-5",
    title: "Database Performance Optimization with SQL",
    date: "2023-07-10T09:45:00Z",
    summary:
      "Deep dive into SQL query optimization techniques for large datasets. Covered indexing strategies, query restructuring, and execution plan analysis to improve database performance.",
    concepts: [{ id: "concept-3", title: "SQL Query Optimization" }],
    codeSnippets: [
      {
        language: "SQL",
        code: "-- Creating an efficient composite index\nCREATE INDEX idx_users_status_created ON users(status, created_at);\n\n-- This query can now use the index efficiently\nSELECT * FROM users\nWHERE status = 'active'\nAND created_at > '2023-01-01';",
        conceptId: "concept-3",
      },
      {
        language: "SQL",
        code: "-- Before optimization\nSELECT * FROM orders\nWHERE MONTH(order_date) = 6;\n\n-- After optimization\nSELECT * FROM orders\nWHERE order_date >= '2023-06-01' AND order_date < '2023-07-01';",
        conceptId: "concept-3",
      },
    ],
  },
  {
    id: "conv-6",
    title: "Natural Language Processing Fundamentals",
    date: "2023-08-05T15:20:00Z",
    summary:
      "Comprehensive overview of NLP techniques including tokenization, text classification, and sentiment analysis. Discussed both traditional methods and modern transformer-based approaches.",
    concepts: [
      { id: "concept-4", title: "Natural Language Processing" },
      { id: "concept-5", title: "Tokenization in NLP" },
    ],
    codeSnippets: [
      {
        language: "Python",
        code: "import nltk\nfrom nltk.corpus import stopwords\nfrom nltk.stem import PorterStemmer\nfrom nltk.tokenize import word_tokenize\n\nstop_words = set(stopwords.words('english'))\nstemmer = PorterStemmer()\n\ndef preprocess_text(text):\n    # Tokenize\n    tokens = word_tokenize(text.lower())\n    \n    # Remove stopwords and stem\n    filtered_tokens = [stemmer.stem(w) for w in tokens if w not in stop_words]\n    \n    return filtered_tokens",
        conceptId: "concept-4",
      },
      {
        language: "Python",
        code: 'from transformers import AutoTokenizer\n\n# Load a pre-trained tokenizer\ntokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")\n\n# Tokenize text\ntext = "Tokenization is the first step in many NLP pipelines."\ntokens = tokenizer.tokenize(text)\nprint(tokens)\n\n# Convert tokens to IDs\ninput_ids = tokenizer.convert_tokens_to_ids(tokens)\nprint(input_ids)',
        conceptId: "concept-5",
      },
    ],
  },
  {
    id: "conv-7",
    title: "Deploying Machine Learning Models in Production",
    date: "2023-09-12T11:30:00Z",
    summary:
      "Explored strategies for deploying ML models in production environments. Covered REST APIs, containerization, monitoring, and scaling considerations for real-world applications.",
    concepts: [
      { id: "concept-1", title: "React Server Components" },
      { id: "concept-6", title: "Machine Learning Model Deployment" },
    ],
    codeSnippets: [
      {
        language: "Python",
        code: 'from fastapi import FastAPI\nimport joblib\n\napp = FastAPI()\n\n# Load the pre-trained model\nmodel = joblib.load(\'model.pkl\')\n\n@app.post("/predict")\nasync def predict(data: dict):\n    # Preprocess input data\n    features = preprocess(data)\n    \n    # Make prediction\n    prediction = model.predict([features])[0]\n    \n    return {"prediction": prediction}',
        conceptId: "concept-6",
      },
      {
        language: "YAML",
        code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ml-model-api\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: ml-model-api\n  template:\n    metadata:\n      labels:\n        app: ml-model-api\n    spec:\n      containers:\n      - name: ml-model-api\n        image: ml-model-api:latest\n        ports:\n        - containerPort: 8000\n        resources:\n          limits:\n            cpu: "1"\n            memory: "2Gi"\n          requests:\n            cpu: "500m"\n            memory: "1Gi"',
        conceptId: "concept-6",
      },
    ],
  },
]

// Mock analysis result with multiple diverse topics
export const mockAnalysisResult = {
  learningSummary:
    "This conversation covers multiple topics including SQL database optimization, NLP techniques, React frontend development, and machine learning model deployment. The discussion includes code examples, best practices, and implementation details for each area.",
  keyTopics: [
    "SQL Optimization",
    "Database Indexing",
    "NLP",
    "Text Classification",
    "Tokenization",
    "Machine Learning",
    "Model Deployment",
    "API Design",
  ],
  category: "Technical",
  conceptsMap:
    "SQL Optimization → Indexing → Query Performance\nNLP → Text Classification → Sentiment Analysis\nMachine Learning → Model Deployment → API Integration\nSQL ↔ Backend API ↔ React Frontend\nNLP ↔ Machine Learning Models",
  codeAnalysis:
    "The conversation includes code examples in multiple languages:\n1. SQL queries demonstrating index creation and query optimization\n2. Python code for NLP preprocessing and tokenization\n3. FastAPI implementation for ML model serving\n4. Kubernetes YAML for deployment configuration",
  studyNotes:
    "1. SQL query optimization relies on proper indexing and avoiding functions on indexed columns\n2. NLP pipelines typically start with tokenization and preprocessing\n3. Machine learning models should be monitored for performance degradation after deployment\n4. Containerization helps ensure consistent environments for ML model deployment",
  error: null,
  originalConversationText: "Sample conversation text about SQL, NLP, and Machine Learning",
}

// Mock large conversation analysis with multiple topics
export const mockLargeConversationAnalysis = {
  overallSummary:
    "This conversation covers multiple topics including SQL database optimization, NLP techniques, React frontend development, and machine learning model deployment. The discussion includes code examples, best practices, and implementation details for each area.",

  conceptMap: [
    "SQL Optimization → Indexing → Query Performance",
    "NLP → Text Classification → Sentiment Analysis",
    "React → Hooks → Custom Hooks → Performance",
    "Machine Learning → Model Deployment → API Integration",
    "SQL ↔ Backend API ↔ React Frontend",
    "NLP ↔ Machine Learning Models",
    "Data Analysis → Visualization → Dashboard",
  ],

  concepts: [
    {
      id: "concept-1",
      title: "SQL Query Optimization",
      category: "Database",
      summary:
        "Discussion of SQL query optimization techniques focusing on proper indexing, query structure, and database design to improve performance for large datasets.",
      details:
        "SQL query optimization is critical for applications dealing with large datasets. The conversation covered several key optimization techniques including proper index selection, query restructuring to avoid full table scans, and understanding execution plans.\n\nThe discussion emphasized how composite indexes should be created based on query patterns, and how the order of columns in these indexes matters significantly for performance. It also covered the importance of avoiding functions on indexed columns in WHERE clauses, as they prevent index usage.",
      keyPoints: [
        "Create indexes based on common query patterns",
        "Order of columns in composite indexes matters",
        "Avoid functions on indexed columns in WHERE clauses",
        "Use EXPLAIN to analyze query execution plans",
        "Consider denormalization for read-heavy workloads",
      ],
      examples: [
        "For a query that filters by user_id and status, a composite index on (user_id, status) would be more efficient than separate indexes.",
        "Changing WHERE YEAR(created_at) = 2023 to WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31' allows index usage.",
      ],
      codeSnippets: [
        {
          language: "SQL",
          description: "Creating an efficient composite index",
          code: "CREATE INDEX idx_users_status_created ON users(status, created_at);\n\n-- This query can now use the index efficiently\nSELECT * FROM users\nWHERE status = 'active'\nAND created_at > '2023-01-01';",
        },
        {
          language: "SQL",
          description: "Query optimization example",
          code: "-- Before optimization\nSELECT * FROM orders\nWHERE MONTH(order_date) = 6;\n\n-- After optimization\nSELECT * FROM orders\nWHERE order_date >= '2023-06-01' AND order_date < '2023-07-01';",
        },
      ],
      relatedConcepts: ["Database Indexing", "API Data Fetching"],
    },
    {
      id: "concept-2",
      title: "Database Indexing",
      category: "Database",
      summary:
        "Detailed exploration of database indexing strategies, including B-tree indexes, covering indexes, and partial indexes for optimizing different query patterns.",
      details:
        "Database indexing is a technique used to improve the speed of data retrieval operations on a database table. The conversation covered different types of indexes including B-tree indexes (the most common), hash indexes, covering indexes, and partial indexes.",
      keyPoints: [
        "B-tree indexes are best for range queries and sorting",
        "Hash indexes are faster for equality comparisons but don't support range queries",
        "Covering indexes can dramatically improve read performance",
        "Partial indexes reduce index size by only indexing a subset of rows",
      ],
      examples: [
        "A covering index for a query that selects user_id and email would include both columns in the index.",
        "A partial index might only index active users, improving performance for queries that only need active users.",
      ],
      codeSnippets: [
        {
          language: "SQL",
          description: "Creating a covering index",
          code: "-- This index covers queries that only need user_id and email\nCREATE INDEX idx_users_id_email ON users(id, email);\n\n-- This query can now be satisfied using only the index\nSELECT user_id, email FROM users WHERE user_id = 123;",
        },
      ],
      relatedConcepts: ["SQL Query Optimization"],
    },
    {
      id: "concept-3",
      title: "Text Classification with NLP",
      category: "Machine Learning",
      summary:
        "Overview of text classification techniques in Natural Language Processing, including preprocessing steps, feature extraction methods, and model selection for tasks like sentiment analysis and topic categorization.",
      details:
        "Text classification is a fundamental NLP task that involves assigning predefined categories to text documents. The conversation covered the complete pipeline for text classification, from preprocessing to model deployment.",
      keyPoints: [
        "Text preprocessing is crucial for good classification performance",
        "TF-IDF often outperforms simple bag-of-words for feature extraction",
        "Pre-trained word embeddings can improve performance with limited data",
        "Transformer models like BERT represent state-of-the-art for many text classification tasks",
      ],
      examples: [
        "For sentiment analysis of product reviews, a fine-tuned BERT model achieved 92% accuracy compared to 84% with a TF-IDF + SVM approach.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Text preprocessing with NLTK",
          code: "import nltk\nfrom nltk.corpus import stopwords\nfrom nltk.stem import PorterStemmer\nfrom nltk.tokenize import word_tokenize\n\nstop_words = set(stopwords.words('english'))\nstemmer = PorterStemmer()\n\ndef preprocess_text(text):\n    # Tokenize\n    tokens = word_tokenize(text.lower())\n    \n    # Remove stopwords and stem\n    filtered_tokens = [stemmer.stem(w) for w in tokens if w not in stop_words]\n    \n    return filtered_tokens",
        },
      ],
      relatedConcepts: ["Sentiment Analysis", "Machine Learning Model Deployment"],
    },
    {
      id: "concept-4",
      title: "Tokenization in NLP",
      category: "Machine Learning",
      summary:
        "Detailed explanation of tokenization methods in Natural Language Processing, including word-level, subword, and character-level approaches, and their impact on model performance.",
      details:
        "Tokenization is the process of breaking text into smaller units (tokens) that can be processed by NLP models. The conversation covered different tokenization strategies and their trade-offs.",
      keyPoints: [
        "Word tokenization splits text at word boundaries but struggles with out-of-vocabulary words",
        "Subword tokenization methods like BPE and WordPiece balance vocabulary size and handling of rare words",
        "Character-level tokenization has a small vocabulary but produces very long sequences",
        "Modern transformer models use specialized tokenizers with special tokens like [CLS], [SEP], and [MASK]",
      ],
      examples: [
        "The word 'tokenization' might be split into subword tokens like ['token', '##ization'] by BERT's WordPiece tokenizer.",
        "Byte-Pair Encoding (BPE) used by GPT models iteratively merges the most frequent character pairs to form a vocabulary.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Using Hugging Face tokenizers",
          code: "from transformers import AutoTokenizer\n\ntokenizer = AutoTokenizer.from_pretrained(\"bert-base-uncased\")\n\ntext = \"Tokenization is fundamental to NLP.\"\n\n# Tokenize the text\ntokens = tokenizer.tokenize(text)\nprint(tokens)  # ['token', '##ization', 'is', 'fundamental', 'to', 'nl', '##p', '.']\n\n# Convert to token IDs\ntoken_ids = tokenizer.encode(text)\nprint(token_ids)  # [101, 19204, 2286, 2003, 8766, 2000, 17953, 1012, 102]",
        },
      ],
      relatedConcepts: ["Text Classification with NLP", "Transformer Models"],
    },
    {
      id: "concept-5",
      title: "Machine Learning Model Deployment",
      category: "DevOps",
      summary:
        "Strategies and best practices for deploying machine learning models to production environments, including API design, containerization, scaling, and monitoring.",
      details:
        "Deploying machine learning models involves bridging the gap between data science and software engineering. The conversation covered the entire deployment pipeline from model export to production monitoring.",
      keyPoints: [
        "REST APIs are common for serving real-time predictions",
        "Containerization ensures consistency across environments",
        "Model versioning is essential for reproducibility and rollbacks",
        "Monitoring should track both technical metrics and model performance",
        "A/B testing helps validate model changes in production",
      ],
      examples: [
        "Using FastAPI to create a prediction endpoint that accepts JSON input and returns model predictions.",
        "Deploying models with Kubernetes for automatic scaling based on request load.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "FastAPI model serving",
          code: "from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\nimport joblib\nimport numpy as np\n\napp = FastAPI()\n\n# Load the model\nmodel = joblib.load('model.pkl')\n\nclass PredictionRequest(BaseModel):\n    features: list[float]\n\nclass PredictionResponse(BaseModel):\n    prediction: float\n    probability: float\n\n@app.post(\"/predict\", response_model=PredictionResponse)\nasync def predict(request: PredictionRequest):\n    try:\n        features = np.array(request.features).reshape(1, -1)\n        prediction = model.predict(features)[0]\n        probability = model.predict_proba(features).max()\n        \n        return PredictionResponse(\n            prediction=float(prediction),\n            probability=float(probability)\n        )\n    except Exception as e:\n        raise HTTPException(status_code=500, detail=str(e))",
        },
        {
          language: "Dockerfile",
          description: "Containerizing a model API",
          code: 'FROM python:3.9-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY ./app /app\nCOPY model.pkl /app/\n\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]',
        },
      ],
      relatedConcepts: ["API Design", "Containerization", "MLOps"],
    },
  ],
}
