#!/usr/bin/env python3
"""
Comprehensive test script for the enhanced concept extractor.
Tests various conversation types to ensure robust analysis and extraction.
"""

import asyncio
import json
import logging
from datetime import datetime
from concept_extractor import ConceptExtractor, ConversationRequest

# Configure logging for testing
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveAnalysisTest:
    def __init__(self):
        self.extractor = ConceptExtractor()
        self.test_results = []
    
    async def test_leetcode_problem(self):
        """Test analysis of a LeetCode problem discussion."""
        logger.info("🧪 Testing LeetCode Problem Analysis...")
        
        conversation = """
        I'm working on the Contains Duplicate problem. The problem asks: given an array of integers, 
        return true if any value appears at least twice in the array, and return false if every element is distinct.

        My first approach was to use nested loops - for each element, check if it appears later in the array. 
        But that's O(n²) time complexity which is inefficient for large arrays.

        The optimal solution uses a hash table (dictionary in Python). As we iterate through the array, 
        we check if the current element already exists in our hash table. If it does, we found a duplicate. 
        If not, we add it to the hash table and continue.

        Here's the code:
        ```python
        def containsDuplicate(nums):
            seen = {}
            for num in nums:
                if num in seen:
                    return True
                seen[num] = True
            return False
        ```

        This approach has O(n) time complexity and O(n) space complexity in the worst case. 
        The space trade-off is worth it for the significant time improvement.
        """
        
        req = ConversationRequest(conversation_text=conversation)
        result = await self.extractor.analyze_conversation(req)
        
        self.test_results.append({
            "test_name": "LeetCode Problem",
            "concepts_found": len(result.get("concepts", [])),
            "has_code_snippets": any(concept.get("codeSnippets") for concept in result.get("concepts", [])),
            "categories": [concept.get("category") for concept in result.get("concepts", [])],
            "summary": result.get("conversation_summary", "")
        })
        
        logger.info(f"✅ LeetCode test completed: {len(result.get('concepts', []))} concepts extracted")
        return result
    
    async def test_system_design_discussion(self):
        """Test analysis of a system design discussion."""
        logger.info("🧪 Testing System Design Discussion...")
        
        conversation = """
        We're designing a URL shortener service like bit.ly. The key components include:

        1. URL Encoding: We need to convert long URLs to short codes. Base62 encoding works well - 
        using characters a-z, A-Z, 0-9 gives us 62^n possible combinations for n-character codes.

        2. Database Design: We need to store the mapping between short codes and original URLs. 
        A NoSQL database like DynamoDB would work well for this use case due to high read/write throughput.

        3. Caching: Implement Redis caching for frequently accessed URLs to reduce database load.

        4. Load Balancing: Use application load balancers to distribute traffic across multiple servers.

        5. Rate Limiting: Implement rate limiting to prevent abuse, using algorithms like token bucket.

        The system needs to handle millions of requests per day with low latency. Horizontal scaling 
        is crucial - we can partition data by the first few characters of the short code.
        """
        
        req = ConversationRequest(conversation_text=conversation)
        result = await self.extractor.analyze_conversation(req)
        
        self.test_results.append({
            "test_name": "System Design",
            "concepts_found": len(result.get("concepts", [])),
            "has_technical_details": any(len(str(concept.get("details", ""))) > 200 for concept in result.get("concepts", [])),
            "categories": [concept.get("category") for concept in result.get("concepts", [])],
            "summary": result.get("conversation_summary", "")
        })
        
        logger.info(f"✅ System Design test completed: {len(result.get('concepts', []))} concepts extracted")
        return result
    
    async def test_frontend_framework_learning(self):
        """Test analysis of frontend framework learning discussion."""
        logger.info("🧪 Testing Frontend Framework Learning...")
        
        conversation = """
        I'm learning React hooks and how they've changed the way we write components. 

        useState is the most basic hook - it lets you add state to functional components. 
        Before hooks, you needed class components for state management.

        useEffect is incredibly powerful - it combines componentDidMount, componentDidUpdate, 
        and componentWillUnmount into one API. You can use it for data fetching, subscriptions, 
        and manual DOM changes.

        Custom hooks are where React really shines. You can extract component logic into 
        reusable functions. For example, a useLocalStorage hook that syncs state with localStorage:

        ```javascript
        function useLocalStorage(key, initialValue) {
          const [storedValue, setStoredValue] = useState(() => {
            try {
              const item = window.localStorage.getItem(key);
              return item ? JSON.parse(item) : initialValue;
            } catch (error) {
              return initialValue;
            }
          });

          const setValue = (value) => {
            try {
              setStoredValue(value);
              window.localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
              console.error(error);
            }
          };

          return [storedValue, setValue];
        }
        ```

        The dependency array in useEffect is crucial for performance - it determines when the effect runs.
        """
        
        req = ConversationRequest(conversation_text=conversation)
        result = await self.extractor.analyze_conversation(req)
        
        self.test_results.append({
            "test_name": "Frontend Learning",
            "concepts_found": len(result.get("concepts", [])),
            "has_code_snippets": any(concept.get("codeSnippets") for concept in result.get("concepts", [])),
            "categories": [concept.get("category") for concept in result.get("concepts", [])],
            "summary": result.get("conversation_summary", "")
        })
        
        logger.info(f"✅ Frontend Learning test completed: {len(result.get('concepts', []))} concepts extracted")
        return result
    
    async def test_database_optimization(self):
        """Test analysis of database optimization discussion."""
        logger.info("🧪 Testing Database Optimization Discussion...")
        
        conversation = """
        We're having performance issues with our PostgreSQL queries. The main problems are:

        1. Missing Indexes: Our user lookup queries are doing table scans. We need composite indexes 
        on frequently queried columns like (user_id, created_at).

        2. N+1 Query Problem: Our ORM is generating separate queries for each related record. 
        We need to use JOIN queries or eager loading to fetch related data in one query.

        3. Query Optimization: Some queries have unnecessary WHERE clauses and aren't using 
        the most selective conditions first.

        Here's an example of optimizing a slow query:

        Before:
        ```sql
        SELECT * FROM orders 
        WHERE status = 'pending' 
        AND user_id = 123 
        AND created_at > '2023-01-01';
        ```

        After (with proper indexing):
        ```sql
        SELECT order_id, total_amount, created_at 
        FROM orders 
        WHERE user_id = 123 
        AND status = 'pending' 
        AND created_at > '2023-01-01'
        ORDER BY created_at DESC;
        ```

        We also implemented connection pooling and query result caching to reduce database load.
        """
        
        req = ConversationRequest(conversation_text=conversation)
        result = await self.extractor.analyze_conversation(req)
        
        self.test_results.append({
            "test_name": "Database Optimization",
            "concepts_found": len(result.get("concepts", [])),
            "has_sql_code": any(
                any(snippet.get("language", "").lower() == "sql" for snippet in concept.get("codeSnippets", []))
                for concept in result.get("concepts", [])
            ),
            "categories": [concept.get("category") for concept in result.get("concepts", [])],
            "summary": result.get("conversation_summary", "")
        })
        
        logger.info(f"✅ Database Optimization test completed: {len(result.get('concepts', []))} concepts extracted")
        return result
    
    async def test_machine_learning_concepts(self):
        """Test analysis of machine learning discussion."""
        logger.info("🧪 Testing Machine Learning Concepts...")
        
        conversation = """
        I'm working on a text classification project using transformers. The key concepts I've learned:

        1. Attention Mechanism: The core innovation in transformers. It allows the model to focus 
        on relevant parts of the input sequence when making predictions. Self-attention computes 
        relationships between all positions in a sequence.

        2. BERT (Bidirectional Encoder Representations from Transformers): Pre-trained on large 
        text corpora using masked language modeling. It understands context from both directions.

        3. Fine-tuning: Taking a pre-trained model and adapting it to your specific task. 
        Much more efficient than training from scratch.

        4. Tokenization: Converting text into tokens that the model can understand. 
        WordPiece and BPE are common approaches.

        Here's a simple fine-tuning example with Hugging Face:

        ```python
        from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer

        tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)

        def tokenize_function(examples):
            return tokenizer(examples['text'], truncation=True, padding=True)

        tokenized_datasets = dataset.map(tokenize_function, batched=True)
        
        trainer = Trainer(
            model=model,
            train_dataset=tokenized_datasets['train'],
            eval_dataset=tokenized_datasets['test']
        )
        
        trainer.train()
        ```

        The key is understanding that transformers excel at capturing long-range dependencies in sequences.
        """
        
        req = ConversationRequest(conversation_text=conversation)
        result = await self.extractor.analyze_conversation(req)
        
        self.test_results.append({
            "test_name": "Machine Learning",
            "concepts_found": len(result.get("concepts", [])),
            "has_python_code": any(
                any(snippet.get("language", "").lower() == "python" for snippet in concept.get("codeSnippets", []))
                for concept in result.get("concepts", [])
            ),
            "categories": [concept.get("category") for concept in result.get("concepts", [])],
            "summary": result.get("conversation_summary", "")
        })
        
        logger.info(f"✅ Machine Learning test completed: {len(result.get('concepts', []))} concepts extracted")
        return result
    
    async def run_all_tests(self):
        """Run all comprehensive tests."""
        logger.info("🚀 Starting Comprehensive Analysis Tests...")
        
        tests = [
            self.test_leetcode_problem,
            self.test_system_design_discussion,
            self.test_frontend_framework_learning,
            self.test_database_optimization,
            self.test_machine_learning_concepts
        ]
        
        results = []
        for test in tests:
            try:
                result = await test()
                results.append(result)
            except Exception as e:
                logger.error(f"❌ Test failed: {e}")
                results.append(None)
        
        # Generate comprehensive report
        self.generate_test_report()
        return results
    
    def generate_test_report(self):
        """Generate a comprehensive test report."""
        logger.info("📊 === COMPREHENSIVE TEST REPORT ===")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["concepts_found"] > 0])
        
        logger.info(f"✅ Tests passed: {successful_tests}/{total_tests}")
        logger.info(f"📈 Success rate: {(successful_tests/total_tests)*100:.1f}%")
        
        for result in self.test_results:
            logger.info(f"\n📋 {result['test_name']}:")
            logger.info(f"  🔢 Concepts extracted: {result['concepts_found']}")
            logger.info(f"  🏷️  Categories: {', '.join(set(result['categories']))}")
            logger.info(f"  💻 Has code: {result.get('has_code_snippets', result.get('has_sql_code', result.get('has_python_code', False)))}")
            logger.info(f"  📝 Summary: {result['summary'][:100]}...")
        
        # Test quality metrics
        avg_concepts = sum(r["concepts_found"] for r in self.test_results) / len(self.test_results)
        logger.info(f"\n📊 QUALITY METRICS:")
        logger.info(f"  📈 Average concepts per conversation: {avg_concepts:.1f}")
        logger.info(f"  💻 Tests with code snippets: {sum(1 for r in self.test_results if r.get('has_code_snippets', False))}")
        logger.info(f"  📋 Tests with detailed analysis: {sum(1 for r in self.test_results if r.get('has_technical_details', False))}")
        
        logger.info("🎉 === TEST REPORT COMPLETED ===")

async def main():
    """Run the comprehensive analysis tests."""
    test_suite = ComprehensiveAnalysisTest()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 