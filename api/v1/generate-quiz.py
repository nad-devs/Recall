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
    
    def generate_quiz_questions(self, concept):
        """Generate quiz questions for a given concept using OpenAI."""
        prompt = f"""
        Based on the following programming concept, generate 5 multiple-choice quiz questions to test understanding.
        
        Concept: {concept.get('title', '')}
        Summary: {concept.get('summary', '')}
        
        For each question:
        1. Create a clear, specific question about the concept
        2. Provide 4 multiple-choice options (A, B, C, D)
        3. Indicate the correct answer (0-3 index)
        4. Provide a brief explanation of why the answer is correct
        
        Make the questions practical and test real understanding, not just memorization.
        
        Return the response in this exact JSON format:
        {{
          "questions": [
            {{
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Explanation of why this answer is correct."
            }}
          ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert programming instructor creating quiz questions. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=0.7,
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse the JSON response
            quiz_data = json.loads(content)
            
            return {
                "questions": quiz_data["questions"],
                "metadata": {
                    "conceptTitle": concept.get('title', ''),
                    "difficulty": "intermediate",
                    "totalQuestions": len(quiz_data["questions"])
                }
            }
            
        except Exception as e:
            print(f"Error generating quiz questions: {e}")
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