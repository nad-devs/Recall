import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from openai import OpenAI

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

class QuizGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
    
    def _validate_quiz_question(self, question_data):
        """Validate that a quiz question has exactly one correct answer and logical consistency."""
        question = question_data.get("question", "")
        options = question_data.get("options", [])
        correct_answer = question_data.get("correctAnswer", -1)
        explanation = question_data.get("explanation", "")
        
        # Basic validation
        if len(options) != 4:
            return False, "Must have exactly 4 options"
        
        if correct_answer < 0 or correct_answer >= 4:
            return False, "Correct answer index must be between 0-3"
        
        if not question or not explanation:
            return False, "Question and explanation cannot be empty"
        
        # Check for contradictory content
        question_lower = question.lower()
        
        # Special validation for NLP questions
        if "nlp" in question_lower or "natural language processing" in question_lower:
            if "not" in question_lower or "which of the following" in question_lower:
                # For negative questions, ensure the correct answer is actually NOT part of NLP
                correct_option = options[correct_answer].lower()
                
                # Known NLP tasks that should NOT be the answer for "not part of NLP"
                nlp_tasks = [
                    "speech recognition", "text analysis", "sentiment analysis", 
                    "machine translation", "named entity recognition", "text classification",
                    "language modeling", "natural language understanding", "text generation",
                    "parsing", "tokenization", "part-of-speech tagging"
                ]
                
                # Non-NLP tasks that SHOULD be the answer for "not part of NLP"
                non_nlp_tasks = [
                    "image processing", "computer vision", "image recognition",
                    "facial recognition", "object detection", "image classification",
                    "photo editing", "graphics rendering", "3d modeling"
                ]
                
                # If asking what's NOT part of NLP, the correct answer should be a non-NLP task
                is_correct_non_nlp = any(task in correct_option for task in non_nlp_tasks)
                is_incorrect_nlp = any(task in correct_option for task in nlp_tasks)
                
                if is_incorrect_nlp:
                    return False, f"Answer '{options[correct_answer]}' is actually part of NLP - contradicts the question"
                
                if not is_correct_non_nlp:
                    # Double-check if this might be an NLP task we missed
                    if any(word in correct_option for word in ["text", "language", "speech", "translation", "sentiment"]):
                        return False, f"Answer '{options[correct_answer]}' appears to be related to NLP"
        
        # General validation for other negative questions
        elif "not" in question_lower and ("which" in question_lower or "what" in question_lower):
            # For any negative question, check if the explanation supports the answer
            explanation_lower = explanation.lower()
            correct_option_lower = options[correct_answer].lower()
            
            # The explanation should mention why the correct answer is NOT part of the category
            if "not" not in explanation_lower and "isn't" not in explanation_lower and "does not" not in explanation_lower:
                print(f"Warning: Negative question may lack proper explanation - {question}")
        
        # Check for duplicate options
        options_lower = [opt.lower().strip() for opt in options]
        if len(set(options_lower)) != len(options_lower):
            return False, "Duplicate options found"
        
        # Check explanation quality - should be comprehensive
        if len(explanation.split()) < 10:
            return False, "Explanation too brief - should explain why answer is correct and others are wrong"
        
        # Additional validation: ensure explanation mentions the correct answer
        correct_option_words = options[correct_answer].lower().split()
        explanation_words = explanation.lower().split()
        
        # Check if at least one significant word from the correct answer appears in explanation
        significant_words = [word for word in correct_option_words if len(word) > 3]
        if significant_words and not any(word in explanation_words for word in significant_words):
            print(f"Warning: Explanation may not adequately address the correct answer")
        
        return True, "Valid question"
    
    def generate_quiz_questions(self, concept):
        """Generate quiz questions for a given concept using OpenAI."""
        prompt = f"""
        Based on the following programming concept, generate 5 multiple-choice quiz questions to test understanding.
        
        Concept: {concept.get('title', '')}
        Summary: {concept.get('summary', '')}
        
        CRITICAL REQUIREMENTS:
        1. Each question must have EXACTLY ONE correct answer
        2. The other 3 options must be clearly incorrect or not applicable
        3. For negative questions (asking what is NOT something), ensure the correct answer is genuinely NOT part of that category
        4. Provide detailed explanations that clearly explain why the correct answer is right AND why the other options are wrong
        5. Avoid contradictory or ambiguous questions
        6. Double-check your logic before finalizing each question
        
        For each question:
        1. Create a clear, specific question about the concept
        2. Provide 4 multiple-choice options (A, B, C, D)
        3. Indicate the correct answer (0-3 index) - VERIFY this is actually correct
        4. Provide a comprehensive explanation that explains:
           - Why the correct answer is right
           - Why each incorrect option is wrong
           - Any important distinctions or context
        
        Make the questions practical and test real understanding, not just memorization.
        Be especially careful with negative questions (asking what is NOT part of something).
        
        Example for a negative question about NLP:
        Question: "Which of the following is NOT a task in Natural Language Processing?"
        Options: ["Sentiment Analysis", "Machine Translation", "Image Recognition", "Text Summarization"]
        Correct Answer: 2 (Image Recognition)
        Explanation: "Image Recognition is a computer vision task that deals with visual data, not textual data. The other options - Sentiment Analysis (analyzing emotions in text), Machine Translation (converting text between languages), and Text Summarization (condensing text content) - are all core NLP tasks that work with human language."
        
        Return the response in this exact JSON format:
        {{
          "questions": [
            {{
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Comprehensive explanation of why this answer is correct and others are wrong."
            }}
          ]
        }}
        """
        
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert programming instructor creating quiz questions. You must ensure logical consistency and exactly one correct answer per question. Always respond with valid JSON only. Pay special attention to negative questions to avoid contradictions."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=3000,
                    temperature=0.3,  # Lower temperature for more consistent results
                )
                
                content = response.choices[0].message.content.strip()
                
                # Parse the JSON response
                quiz_data = json.loads(content)
                
                # Validate each question
                validated_questions = []
                for i, question in enumerate(quiz_data["questions"]):
                    is_valid, error_msg = self._validate_quiz_question(question)
                    if is_valid:
                        validated_questions.append(question)
                    else:
                        print(f"Question {i+1} validation failed: {error_msg}")
                        print(f"Question: {question.get('question', 'N/A')}")
                        print(f"Options: {question.get('options', [])}")
                        print(f"Correct Answer: {question.get('correctAnswer', 'N/A')}")
                
                # If we have at least 3 valid questions, return them
                if len(validated_questions) >= 3:
                    return {
                        "questions": validated_questions,
                        "metadata": {
                            "conceptTitle": concept.get('title', ''),
                            "difficulty": "intermediate",
                            "totalQuestions": len(validated_questions),
                            "validationPassed": True,
                            "attempt": attempt + 1
                        }
                    }
                else:
                    print(f"Attempt {attempt + 1}: Only {len(validated_questions)} valid questions generated")
                    if attempt == max_attempts - 1:
                        # Last attempt failed, return what we have with a warning
                        return {
                            "questions": validated_questions,
                            "metadata": {
                                "conceptTitle": concept.get('title', ''),
                                "difficulty": "intermediate", 
                                "totalQuestions": len(validated_questions),
                                "validationPassed": False,
                                "warning": "Some questions failed validation"
                            }
                        }
                
            except json.JSONDecodeError as e:
                print(f"Attempt {attempt + 1}: JSON parsing error: {e}")
                if attempt == max_attempts - 1:
                    raise
            except Exception as e:
                print(f"Attempt {attempt + 1}: Error generating quiz questions: {e}")
                if attempt == max_attempts - 1:
                    raise

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            concept = data.get('concept')
            if not concept:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing concept data"}).encode())
                return
            
            # Generate quiz questions
            generator = QuizGenerator()
            result = generator.generate_quiz_questions(concept)
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            print(f"Error in quiz generation handler: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Internal server error"}).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 