"use client"

// Mock data for a large conversation analysis with multiple topics

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
        {
          language: "SQL",
          description: "Using EXPLAIN to analyze query performance",
          code: "EXPLAIN ANALYZE\nSELECT u.name, COUNT(o.id) as order_count\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active'\nGROUP BY u.id\nHAVING COUNT(o.id) > 5\nORDER BY order_count DESC\nLIMIT 10;",
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
        "Database indexing is a technique used to improve the speed of data retrieval operations on a database table. The conversation covered different types of indexes including B-tree indexes (the most common), hash indexes, covering indexes, and partial indexes.\n\nB-tree indexes are balanced tree data structures that maintain sorted data and allow searches, sequential access, insertions, and deletions in logarithmic time. They're particularly effective for range queries and sorting operations.\n\nCovering indexes include all the columns needed by a query, allowing the database to satisfy the query using only the index without accessing the table itself. This significantly improves performance for read-heavy workloads.",
      keyPoints: [
        "B-tree indexes are best for range queries and sorting",
        "Hash indexes are faster for equality comparisons but don't support range queries",
        "Covering indexes can dramatically improve read performance",
        "Partial indexes reduce index size by only indexing a subset of rows",
        "Too many indexes can slow down write operations",
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
        {
          language: "SQL",
          description: "Creating a partial index",
          code: "-- This index only includes active users\nCREATE INDEX idx_active_users ON users(id, name, email)\nWHERE status = 'active';\n\n-- Queries for active users will be much faster\nSELECT * FROM users\nWHERE status = 'active' AND last_login > '2023-01-01';",
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
        "Text classification is a fundamental NLP task that involves assigning predefined categories to text documents. The conversation covered the complete pipeline for text classification, from preprocessing to model deployment.\n\nText preprocessing typically includes tokenization (splitting text into words or subwords), removing stop words, stemming or lemmatization, and handling special characters. Feature extraction methods discussed included bag-of-words, TF-IDF, and more modern approaches using word embeddings like Word2Vec and GloVe.\n\nThe discussion also compared traditional machine learning approaches (Naive Bayes, SVM, Random Forest) with deep learning approaches (RNNs, LSTMs, Transformers) for text classification tasks.",
      keyPoints: [
        "Text preprocessing is crucial for good classification performance",
        "TF-IDF often outperforms simple bag-of-words for feature extraction",
        "Pre-trained word embeddings can improve performance with limited data",
        "Transformer models like BERT represent state-of-the-art for many text classification tasks",
        "Model choice depends on dataset size, computational resources, and accuracy requirements",
      ],
      examples: [
        "For sentiment analysis of product reviews, a fine-tuned BERT model achieved 92% accuracy compared to 84% with a TF-IDF + SVM approach.",
        "For a custom domain with limited training data, using transfer learning with a pre-trained language model was more effective than training from scratch.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Text preprocessing with NLTK",
          code: "import nltk\nfrom nltk.corpus import stopwords\nfrom nltk.stem import PorterStemmer\nfrom nltk.tokenize import word_tokenize\n\nstop_words = set(stopwords.words('english'))\nstemmer = PorterStemmer()\n\ndef preprocess_text(text):\n    # Tokenize\n    tokens = word_tokenize(text.lower())\n    \n    # Remove stopwords and stem\n    filtered_tokens = [stemmer.stem(w) for w in tokens if w not in stop_words]\n    \n    return filtered_tokens\n\n# Example usage\ntext = \"Natural language processing is fascinating and powerful!\"\nprocessed = preprocess_text(text)\nprint(processed)",
        },
        {
          language: "Python",
          description: "Text classification with scikit-learn",
          code: "from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.svm import LinearSVC\nfrom sklearn.metrics import classification_report\n\n# Assume we have texts and labels\nX_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2)\n\n# TF-IDF feature extraction\nvectorizer = TfidfVectorizer(max_features=10000)\nX_train_tfidf = vectorizer.fit_transform(X_train)\nX_test_tfidf = vectorizer.transform(X_test)\n\n# Train classifier\nclassifier = LinearSVC()\nclassifier.fit(X_train_tfidf, y_train)\n\n# Evaluate\npredictions = classifier.predict(X_test_tfidf)\nprint(classification_report(y_test, predictions))",
        },
        {
          language: "Python",
          description: "Fine-tuning BERT for text classification",
          code: "import torch\nfrom transformers import BertTokenizer, BertForSequenceClassification\nfrom transformers import AdamW, get_linear_schedule_with_warmup\n\n# Load pre-trained model and tokenizer\ntokenizer = BertTokenizer.from_pretrained('bert-base-uncased')\nmodel = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)\n\n# Tokenize and prepare data\nencoded_data = tokenizer(texts, padding=True, truncation=True, return_tensors='pt')\n\n# Create DataLoader, optimizer, etc.\n# ...\n\n# Training loop\nfor epoch in range(epochs):\n    model.train()\n    for batch in train_dataloader:\n        optimizer.zero_grad()\n        outputs = model(input_ids=batch['input_ids'], \n                       attention_mask=batch['attention_mask'], \n                       labels=batch['labels'])\n        loss = outputs.loss\n        loss.backward()\n        optimizer.step()\n        scheduler.step()",
        },
      ],
      relatedConcepts: ["Sentiment Analysis", "Machine Learning Model Deployment"],
    },
    {
      id: "concept-4",
      title: "Sentiment Analysis",
      category: "Machine Learning",
      summary:
        "Implementation of sentiment analysis systems to determine emotional tone in text, covering lexicon-based approaches, machine learning models, and evaluation metrics.",
      details:
        "Sentiment analysis is the process of determining the emotional tone behind a series of words, used to understand attitudes, opinions and emotions in text. The conversation explored different approaches to sentiment analysis, from simple lexicon-based methods to advanced deep learning techniques.\n\nLexicon-based approaches use dictionaries of words with associated sentiment scores. While simple to implement, they struggle with context, negations, and domain-specific language. Machine learning approaches treat sentiment analysis as a classification problem, learning from labeled examples to predict sentiment in new text.\n\nThe discussion also covered evaluation metrics for sentiment analysis systems, including accuracy, precision, recall, F1-score, and the importance of balanced datasets to avoid biased models.",
      keyPoints: [
        "Sentiment can typically be classified as positive, negative, or neutral",
        "More fine-grained emotion detection is a related but more complex task",
        "Context and domain knowledge significantly impact sentiment analysis accuracy",
        "Handling negations and sarcasm remains challenging for many systems",
        "BERT and other transformer models have set new benchmarks for sentiment analysis",
      ],
      examples: [
        "The sentence 'The movie wasn't bad at all' contains a negation that reverses the sentiment of 'bad'.",
        "Domain adaptation is important - words like 'unpredictable' might be positive for movies but negative for banking services.",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Simple lexicon-based sentiment analysis",
          code: "from nltk.sentiment import SentimentIntensityAnalyzer\n\nsia = SentimentIntensityAnalyzer()\n\ndef analyze_sentiment(text):\n    sentiment_scores = sia.polarity_scores(text)\n    \n    if sentiment_scores['compound'] >= 0.05:\n        return 'Positive'\n    elif sentiment_scores['compound'] <= -0.05:\n        return 'Negative'\n    else:\n        return 'Neutral'\n\n# Example usage\ntext = \"I absolutely loved the new movie! The plot was fantastic.\"\nsentiment = analyze_sentiment(text)\nprint(f\"Sentiment: {sentiment}\")",
        },
        {
          language: "Python",
          description: "Sentiment analysis with Hugging Face transformers",
          code: "from transformers import pipeline\n\n# Load sentiment analysis pipeline with DistilBERT\nsentiment_analyzer = pipeline('sentiment-analysis')\n\n# Analyze text\nresult = sentiment_analyzer(\"The customer service was terrible and I'll never shop here again.\")\nprint(result)\n\n# Output: [{'label': 'NEGATIVE', 'score': 0.9978}]",
        },
      ],
      relatedConcepts: ["Text Classification with NLP"],
    },
    {
      id: "concept-5",
      title: "React Custom Hooks",
      category: "Frontend",
      summary:
        "Creation and usage of custom React hooks for code reuse, state management, and side effects across components, with practical examples for common use cases.",
      details:
        "Custom hooks are a powerful feature in React that allows you to extract component logic into reusable functions. The conversation explored how to create custom hooks, best practices, and common use cases.\n\nCustom hooks are JavaScript functions that start with 'use' and can call other hooks. They enable sharing stateful logic between components without changing the component hierarchy. The discussion covered several examples including hooks for form handling, data fetching, local storage interaction, and media queries.\n\nThe conversation also addressed testing strategies for custom hooks, performance considerations, and how to properly handle dependencies in hooks that use useEffect.",
      keyPoints: [
        "Custom hooks must start with 'use' to follow React conventions",
        "They enable sharing logic without render props or higher-order components",
        "Custom hooks can call other hooks, including other custom hooks",
        "They should have a clear, single responsibility",
        "Proper dependency array management is crucial for hooks with effects",
      ],
      examples: [
        "A useLocalStorage hook that synchronizes state with browser local storage",
        "A useMediaQuery hook that responds to viewport size changes for responsive designs",
      ],
      codeSnippets: [
        {
          language: "JavaScript",
          description: "Custom hook for form handling",
          code: 'import { useState } from \'react\';\n\nfunction useForm(initialValues) {\n  const [values, setValues] = useState(initialValues);\n  const [errors, setErrors] = useState({});\n\n  const handleChange = (e) => {\n    const { name, value } = e.target;\n    setValues({\n      ...values,\n      [name]: value\n    });\n  };\n\n  const handleSubmit = (callback) => (e) => {\n    e.preventDefault();\n    // Validation could be added here\n    callback(values);\n  };\n\n  const reset = () => {\n    setValues(initialValues);\n    setErrors({});\n  };\n\n  return {\n    values,\n    errors,\n    handleChange,\n    handleSubmit,\n    reset\n  };\n}\n\n// Usage example\nfunction SignupForm() {\n  const { values, handleChange, handleSubmit } = useForm({\n    email: \'\',\n    password: \'\'\n  });\n\n  const submitForm = (formValues) => {\n    console.log(\'Form submitted with:\', formValues);\n    // Submit to API, etc.\n  };\n\n  return (\n    <form onSubmit={handleSubmit(submitForm)}>\n      <input\n        type="email"\n        name="email"\n        value={values.email}\n        onChange={handleChange}\n      />\n      <input\n        type="password"\n        name="password"\n        value={values.password}\n        onChange={handleChange}\n      />\n      <button type="submit">Sign Up</button>\n    </form>\n  );\n}',
        },
        {
          language: "JavaScript",
          description: "Custom hook for data fetching",
          code: "import { useState, useEffect } from 'react';\n\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    const controller = new AbortController();\n    const signal = controller.signal;\n\n    const fetchData = async () => {\n      try {\n        setLoading(true);\n        const response = await fetch(url, { signal });\n        \n        if (!response.ok) {\n          throw new Error(`HTTP error! Status: ${response.status}`);\n        }\n        \n        const result = await response.json();\n        if (!signal.aborted) {\n          setData(result);\n          setError(null);\n        }\n      } catch (err) {\n        if (!signal.aborted) {\n          setError(err.message);\n          setData(null);\n        }\n      } finally {\n        if (!signal.aborted) {\n          setLoading(false);\n        }\n      }\n    };\n\n    fetchData();\n\n    return () => {\n      controller.abort();\n    };\n  }, [url]);\n\n  return { data, loading, error };\n}\n\n// Usage example\nfunction UserProfile({ userId }) {\n  const { data, loading, error } = useFetch(`/api/users/${userId}`);\n\n  if (loading) return <div>Loading...</div>;\n  if (error) return <div>Error: {error}</div>;\n\n  return (\n    <div>\n      <h1>{data.name}</h1>\n      <p>{data.email}</p>\n    </div>\n  );\n}",
        },
        {
          language: "JavaScript",
          description: "Custom hook for local storage",
          code: "import { useState, useEffect } from 'react';\n\nfunction useLocalStorage(key, initialValue) {\n  // Get from local storage then\n  // parse stored json or return initialValue\n  const readValue = () => {\n    if (typeof window === 'undefined') {\n      return initialValue;\n    }\n\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      console.warn(`Error reading localStorage key \"${key}\":`, error);\n      return initialValue;\n    }\n  };\n\n  // State to store our value\n  const [storedValue, setStoredValue] = useState(readValue);\n\n  // Return a wrapped version of useState's setter function that\n  // persists the new value to localStorage.\n  const setValue = (value) => {\n    try {\n      // Allow value to be a function so we have same API as useState\n      const valueToStore =\n        value instanceof Function ? value(storedValue) : value;\n      \n      // Save state\n      setStoredValue(valueToStore);\n      \n      // Save to local storage\n      if (typeof window !== 'undefined') {\n        window.localStorage.setItem(key, JSON.stringify(valueToStore));\n      }\n    } catch (error) {\n      console.warn(`Error setting localStorage key \"${key}\":`, error);\n    }\n  };\n\n  useEffect(() => {\n    setStoredValue(readValue());\n  }, []);\n\n  return [storedValue, setValue];\n}\n\n// Usage example\nfunction App() {\n  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);\n\n  return (\n    <div className={darkMode ? 'dark-mode' : 'light-mode'}>\n      <button onClick={() => setDarkMode(!darkMode)}>\n        Toggle {darkMode ? 'Light' : 'Dark'} Mode\n      </button>\n    </div>\n  );\n}",
        },
      ],
      relatedConcepts: ["React Performance Optimization", "API Data Fetching"],
    },
    {
      id: "concept-6",
      title: "API Data Fetching",
      category: "Backend",
      summary:
        "Strategies for efficient API data fetching, including RESTful API design, pagination, filtering, and error handling for optimal frontend-backend communication.",
      details:
        "Efficient API data fetching is crucial for application performance and user experience. The conversation covered best practices for designing and consuming APIs, with a focus on RESTful principles, query optimization, and error handling.\n\nThe discussion emphasized the importance of pagination for large datasets, implementing filtering and sorting on the server side, and using appropriate HTTP status codes for different scenarios. It also covered strategies for caching responses, handling authentication tokens, and implementing retry logic for failed requests.\n\nThe conversation compared different approaches to API fetching in frontend applications, including native fetch, axios, and React Query/SWR for React applications.",
      keyPoints: [
        "Use pagination for large datasets to improve performance",
        "Implement filtering and sorting on the server to reduce data transfer",
        "Use appropriate HTTP status codes and consistent error formats",
        "Consider caching strategies to reduce unnecessary requests",
        "Implement proper error handling and retry logic",
      ],
      examples: [
        "Instead of fetching all users, implement pagination with /api/users?page=1&limit=20",
        "For filtering, use query parameters like /api/products?category=electronics&min_price=100",
      ],
      codeSnippets: [
        {
          language: "JavaScript",
          description: "API fetching with error handling",
          code: "async function fetchData(url, options = {}) {\n  try {\n    const response = await fetch(url, {\n      headers: {\n        'Content-Type': 'application/json',\n        ...options.headers\n      },\n      ...options\n    });\n    \n    if (!response.ok) {\n      // Try to parse error response\n      let errorData;\n      try {\n        errorData = await response.json();\n      } catch (e) {\n        errorData = { message: response.statusText };\n      }\n      \n      throw new Error(\n        errorData.message || `HTTP error! Status: ${response.status}`\n      );\n    }\n    \n    return await response.json();\n  } catch (error) {\n    console.error('Fetch error:', error);\n    throw error;\n  }\n}\n\n// Usage example\nasync function getUsers(page = 1, limit = 10) {\n  try {\n    const data = await fetchData(`/api/users?page=${page}&limit=${limit}`);\n    return data;\n  } catch (error) {\n    // Handle specific errors\n    if (error.message.includes('401')) {\n      // Handle authentication error\n    }\n    throw error;\n  }\n}",
        },
        {
          language: "JavaScript",
          description: "Using React Query for data fetching",
          code: "import { useQuery, useMutation, useQueryClient } from 'react-query';\n\n// API functions\nconst fetchUsers = async (page = 1) => {\n  const response = await fetch(`/api/users?page=${page}&limit=10`);\n  if (!response.ok) throw new Error('Network response was not ok');\n  return response.json();\n};\n\nconst createUser = async (userData) => {\n  const response = await fetch('/api/users', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(userData)\n  });\n  if (!response.ok) throw new Error('Failed to create user');\n  return response.json();\n};\n\n// Component using React Query\nfunction UserList() {\n  const [page, setPage] = useState(1);\n  const queryClient = useQueryClient();\n  \n  // Query for fetching users\n  const { data, isLoading, error } = useQuery(\n    ['users', page],\n    () => fetchUsers(page),\n    { keepPreviousData: true }\n  );\n  \n  // Mutation for creating a user\n  const mutation = useMutation(createUser, {\n    onSuccess: () => {\n      // Invalidate and refetch\n      queryClient.invalidateQueries('users');\n    }\n  });\n  \n  if (isLoading) return <div>Loading...</div>;\n  if (error) return <div>Error: {error.message}</div>;\n  \n  return (\n    <div>\n      <ul>\n        {data.users.map(user => (\n          <li key={user.id}>{user.name}</li>\n        ))}\n      </ul>\n      \n      <div>\n        <button\n          onClick={() => setPage(old => Math.max(old - 1, 1))}\n          disabled={page === 1}\n        >\n          Previous Page\n        </button>\n        <span>Page {page}</span>\n        <button\n          onClick={() => setPage(old => old + 1)}\n          disabled={!data.hasMore}\n        >\n          Next Page\n        </button>\n      </div>\n      \n      <button\n        onClick={() => {\n          mutation.mutate({ name: 'New User' });\n        }}\n      >\n        Add User\n      </button>\n    </div>\n  );\n}",
        },
        {
          language: "JavaScript",
          description: "Backend API with pagination and filtering",
          code: "// Express.js API endpoint with pagination and filtering\napp.get('/api/products', async (req, res) => {\n  try {\n    const page = parseInt(req.query.page) || 1;\n    const limit = parseInt(req.query.limit) || 10;\n    const skip = (page - 1) * limit;\n    \n    // Build filter object from query parameters\n    const filter = {};\n    \n    if (req.query.category) {\n      filter.category = req.query.category;\n    }\n    \n    if (req.query.min_price) {\n      filter.price = { $gte: parseFloat(req.query.min_price) };\n    }\n    \n    if (req.query.max_price) {\n      filter.price = { ...filter.price, $lte: parseFloat(req.query.max_price) };\n    }\n    \n    // Get total count for pagination info\n    const total = await Product.countDocuments(filter);\n    \n    // Get products with pagination and filters\n    const products = await Product.find(filter)\n      .sort({ createdAt: -1 })\n      .skip(skip)\n      .limit(limit);\n    \n    // Send response with pagination metadata\n    res.json({\n      products,\n      pagination: {\n        total,\n        page,\n        limit,\n        pages: Math.ceil(total / limit)\n      }\n    });\n  } catch (error) {\n    res.status(500).json({ message: 'Server error', error: error.message });\n  }\n});",
        },
      ],
      relatedConcepts: ["SQL Query Optimization", "React Custom Hooks"],
    },
    {
      id: "concept-7",
      title: "Machine Learning Model Deployment",
      category: "Machine Learning",
      summary:
        "Strategies for deploying machine learning models to production, including containerization, API development, monitoring, and scaling considerations.",
      details:
        "Deploying machine learning models to production involves several challenges beyond model training. The conversation covered the complete deployment pipeline, from model serialization to monitoring and maintenance.\n\nThe discussion emphasized containerization with Docker for consistent environments, creating RESTful APIs with Flask or FastAPI to serve predictions, and implementing proper logging and monitoring to track model performance over time. It also addressed scaling considerations for high-traffic applications, batch vs. real-time prediction strategies, and A/B testing approaches for model updates.\n\nThe conversation also covered MLOps practices, including CI/CD for ML models, versioning both code and data, and strategies for handling model drift and retraining.",
      keyPoints: [
        "Containerize models with Docker for consistent environments",
        "Create well-documented APIs for model serving",
        "Implement monitoring for both technical metrics and model performance",
        "Consider batch prediction for efficiency when real-time isn't required",
        "Plan for model versioning and updates from the beginning",
      ],
      examples: [
        "A sentiment analysis model deployed as a microservice with a REST API",
        "A recommendation system with batch predictions updated daily",
      ],
      codeSnippets: [
        {
          language: "Python",
          description: "Model deployment with Flask",
          code: "from flask import Flask, request, jsonify\nimport pickle\nimport numpy as np\n\napp = Flask(__name__)\n\n# Load the model\nwith open('model.pkl', 'rb') as f:\n    model = pickle.load(f)\n\n@app.route('/predict', methods=['POST'])\ndef predict():\n    try:\n        # Get data from request\n        data = request.get_json(force=True)\n        features = np.array(data['features']).reshape(1, -1)\n        \n        # Make prediction\n        prediction = model.predict(features)[0]\n        \n        # Return prediction\n        return jsonify({\n            'prediction': prediction.tolist(),\n            'success': True\n        })\n    except Exception as e:\n        return jsonify({\n            'error': str(e),\n            'success': False\n        }), 400\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=5000)",
        },
        {
          language: "Dockerfile",
          description: "Dockerfile for ML model deployment",
          code: 'FROM python:3.9-slim\n\nWORKDIR /app\n\n# Install dependencies\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\n# Copy model and application code\nCOPY model.pkl .\nCOPY app.py .\n\n# Expose port\nEXPOSE 5000\n\n# Run the application\nCMD ["python", "app.py"]',
        },
        {
          language: "Python",
          description: "Model monitoring and logging",
          code: "import time\nimport logging\nimport numpy as np\nfrom flask import Flask, request, jsonify\nimport pickle\nfrom prometheus_client import Counter, Histogram, start_http_server\n\n# Set up logging\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger(__name__)\n\n# Set up metrics\nprediction_counter = Counter('model_predictions_total', 'Total number of predictions')\nprediction_latency = Histogram('model_prediction_latency_seconds', 'Prediction latency in seconds')\n\napp = Flask(__name__)\n\n# Load the model\nwith open('model.pkl', 'rb') as f:\n    model = pickle.load(f)\n\n@app.route('/predict', methods=['POST'])\ndef predict():\n    start_time = time.time()\n    \n    try:\n        # Get data from request\n        data = request.get_json(force=True)\n        features = np.array(data['features']).reshape(1, -1)\n        \n        # Log input data\n        logger.info(f\"Received prediction request with features: {features}\")\n        \n        # Make prediction\n        prediction = model.predict(features)[0]\n        prediction_counter.inc()\n        \n        # Calculate and record latency\n        latency = time.time() - start_time\n        prediction_latency.observe(latency)\n        \n        logger.info(f\"Prediction: {prediction}, Latency: {latency:.4f}s\")\n        \n        # Return prediction\n        return jsonify({\n            'prediction': prediction.tolist(),\n            'latency': latency,\n            'success': True\n        })\n    except Exception as e:\n        logger.error(f\"Prediction error: {str(e)}\")\n        return jsonify({\n            'error': str(e),\n            'success': False\n        }), 400\n\nif __name__ == '__main__':\n    # Start metrics server\n    start_http_server(8000)\n    logger.info(\"Metrics server started on port 8000\")\n    \n    # Start Flask app\n    app.run(host='0.0.0.0', port=5000)",
        },
      ],
      relatedConcepts: ["Text Classification with NLP", "API Data Fetching"],
    },
    {
      id: "concept-8",
      title: "React Performance Optimization",
      category: "Frontend",
      summary:
        "Techniques for optimizing React application performance, including component memoization, code splitting, virtualization, and effective state management.",
      details:
        "Optimizing React application performance is essential for providing a smooth user experience, especially for complex applications. The conversation covered various optimization techniques at different levels of the application.\n\nComponent-level optimizations discussed included using React.memo for functional components, shouldComponentUpdate for class components, and the useMemo and useCallback hooks to prevent unnecessary re-renders. The discussion also covered code splitting with React.lazy and Suspense to reduce initial bundle size, and virtualization techniques for rendering large lists efficiently.\n\nState management optimizations included structuring state to minimize re-renders, using immutable data patterns, and choosing appropriate state management solutions based on application complexity.",
      keyPoints: [
        "Use React.memo and useMemo/useCallback to prevent unnecessary re-renders",
        "Implement code splitting to reduce initial load time",
        "Use virtualization for long lists (react-window or react-virtualized)",
        "Structure state to minimize component re-renders",
        "Profile performance with React DevTools to identify bottlenecks",
      ],
      examples: [
        "A dashboard with multiple charts that only re-render when their specific data changes",
        "An e-commerce product list that uses virtualization to handle thousands of items",
      ],
      codeSnippets: [
        {
          language: "JavaScript",
          description: "Component memoization",
          code: "import React, { useState, useMemo, useCallback } from 'react';\n\n// Memoized child component\nconst ExpensiveComponent = React.memo(({ data, onItemClick }) => {\n  console.log('ExpensiveComponent rendered');\n  \n  return (\n    <div>\n      {data.map(item => (\n        <div key={item.id} onClick={() => onItemClick(item.id)}>\n          {item.name}\n        </div>\n      ))}\n    </div>\n  );\n});\n\nfunction ParentComponent() {\n  const [count, setCount] = useState(0);\n  const [items, setItems] = useState([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);\n  \n  // Memoize data processing\n  const processedData = useMemo(() => {\n    console.log('Processing data...');\n    return items.map(item => ({\n      ...item,\n      name: item.name.toUpperCase()\n    }));\n  }, [items]); // Only recompute when items change\n  \n  // Memoize callback\n  const handleItemClick = useCallback((id) => {\n    console.log(`Item ${id} clicked`);\n  }, []); // Never recreate this function\n  \n  return (\n    <div>\n      <button onClick={() => setCount(count + 1)}>\n        Increment Count: {count}\n      </button>\n      <ExpensiveComponent \n        data={processedData} \n        onItemClick={handleItemClick} \n      />\n    </div>\n  );\n}",
        },
        {
          language: "JavaScript",
          description: "Code splitting with React.lazy",
          code: "import React, { Suspense, lazy } from 'react';\nimport { BrowserRouter as Router, Route, Switch } from 'react-router-dom';\n\n// Lazy load components\nconst Home = lazy(() => import('./pages/Home'));\nconst Dashboard = lazy(() => import('./pages/Dashboard'));\nconst Settings = lazy(() => import('./pages/Settings'));\n\nfunction App() {\n  return (\n    <Router>\n      <Suspense fallback={<div>Loading...</div>}>\n        <Switch>\n          <Route exact path=\"/\" component={Home} />\n          <Route path=\"/dashboard\" component={Dashboard} />\n          <Route path=\"/settings\" component={Settings} />\n        </Switch>\n      </Suspense>\n    </Router>\n  );\n}",
        },
        {
          language: "JavaScript",
          description: "Virtualized list rendering",
          code: "import React from 'react';\nimport { FixedSizeList } from 'react-window';\n\nfunction VirtualizedList({ items }) {\n  // Render an individual row\n  const Row = ({ index, style }) => (\n    <div style={style} className={index % 2 ? 'ListItemOdd' : 'ListItemEven'}>\n      {items[index].name}\n    </div>\n  );\n\n  return (\n    <FixedSizeList\n      height={400}\n      width=\"100%\"\n      itemCount={items.length}\n      itemSize={35}\n    >\n      {Row}\n    </FixedSizeList>\n  );\n}\n\nfunction App() {\n  // Generate 10,000 items\n  const items = Array.from({ length: 10000 }, (_, index) => ({\n    id: index,\n    name: `Item ${index}`\n  }));\n\n  return (\n    <div className=\"App\">\n      <h1>Virtualized List Example</h1>\n      <VirtualizedList items={items} />\n    </div>\n  );\n}",
        },
      ],
      relatedConcepts: ["React Custom Hooks"],
    },
  ],
}
