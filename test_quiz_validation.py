#!/usr/bin/env python3
"""
Test script to validate quiz question generation and validation logic.
This script tests the specific issue where "Machine Translation" was incorrectly
marked as the correct answer for "What is NOT part of NLP".
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.v1.generate_quiz import QuizGenerator

def test_nlp_validation():
    """Test the validation logic for NLP-related questions."""
    generator = QuizGenerator()
    
    # Test case 1: Correct NLP question (Image processing should be the answer)
    correct_question = {
        "question": "Which of the following tasks is NOT a part of Natural Language Processing (NLP)?",
        "options": ["Speech recognition", "Image processing", "Sentiment analysis", "Machine translation"],
        "correctAnswer": 1,  # Image processing
        "explanation": "Image processing is a computer vision task that deals with visual data, not textual data. The other options - Speech recognition (converting spoken language to text), Sentiment analysis (analyzing emotions in text), and Machine translation (converting text between languages) - are all core NLP tasks that work with human language."
    }
    
    # Test case 2: Incorrect NLP question (Machine translation marked as NOT part of NLP - this should fail)
    incorrect_question = {
        "question": "Which of the following tasks is NOT a part of Natural Language Processing (NLP)?",
        "options": ["Speech recognition", "Image processing", "Sentiment analysis", "Machine translation"],
        "correctAnswer": 3,  # Machine translation - THIS IS WRONG!
        "explanation": "Machine translation is the correct answer."
    }
    
    # Test case 3: Question with duplicate options (should fail)
    duplicate_options_question = {
        "question": "What is a key feature of Python?",
        "options": ["Dynamic typing", "Static typing", "Dynamic typing", "Compiled"],
        "correctAnswer": 0,
        "explanation": "Python uses dynamic typing where variable types are determined at runtime."
    }
    
    # Test case 4: Question with brief explanation (should fail)
    brief_explanation_question = {
        "question": "What does API stand for?",
        "options": ["Application Programming Interface", "Advanced Programming Interface", "Automated Programming Interface", "Application Protocol Interface"],
        "correctAnswer": 0,
        "explanation": "It's API."
    }
    
    print("=== Testing Quiz Validation Logic ===\n")
    
    # Test 1: Correct NLP question
    print("Test 1: Correct NLP question")
    is_valid, message = generator._validate_quiz_question(correct_question)
    print(f"Result: {'✅ PASS' if is_valid else '❌ FAIL'}")
    print(f"Message: {message}")
    print(f"Question: {correct_question['question']}")
    print(f"Correct Answer: {correct_question['options'][correct_question['correctAnswer']]}")
    print()
    
    # Test 2: Incorrect NLP question
    print("Test 2: Incorrect NLP question (Machine Translation as NOT part of NLP)")
    is_valid, message = generator._validate_quiz_question(incorrect_question)
    print(f"Result: {'✅ PASS (correctly detected error)' if not is_valid else '❌ FAIL (should have detected error)'}")
    print(f"Message: {message}")
    print(f"Question: {incorrect_question['question']}")
    print(f"Marked Correct Answer: {incorrect_question['options'][incorrect_question['correctAnswer']]}")
    print()
    
    # Test 3: Duplicate options
    print("Test 3: Question with duplicate options")
    is_valid, message = generator._validate_quiz_question(duplicate_options_question)
    print(f"Result: {'✅ PASS (correctly detected error)' if not is_valid else '❌ FAIL (should have detected error)'}")
    print(f"Message: {message}")
    print()
    
    # Test 4: Brief explanation
    print("Test 4: Question with brief explanation")
    is_valid, message = generator._validate_quiz_question(brief_explanation_question)
    print(f"Result: {'✅ PASS (correctly detected error)' if not is_valid else '❌ FAIL (should have detected error)'}")
    print(f"Message: {message}")
    print()
    
    # Summary
    print("=== Test Summary ===")
    print("✅ Test 1 should PASS (valid NLP question)")
    print("✅ Test 2 should FAIL validation (incorrect NLP answer)")
    print("✅ Test 3 should FAIL validation (duplicate options)")
    print("✅ Test 4 should FAIL validation (brief explanation)")

def test_quiz_generation():
    """Test actual quiz generation with a sample concept."""
    print("\n=== Testing Quiz Generation ===\n")
    
    # Sample concept about NLP
    sample_concept = {
        "title": "Natural Language Processing",
        "summary": "Natural Language Processing (NLP) is a field of artificial intelligence that focuses on the interaction between computers and human language. It involves techniques for analyzing, understanding, and generating human language in a way that is both meaningful and useful."
    }
    
    try:
        generator = QuizGenerator()
        print("Generating quiz for NLP concept...")
        result = generator.generate_quiz_questions(sample_concept)
        
        print(f"Generated {len(result['questions'])} questions")
        print(f"Validation passed: {result['metadata'].get('validationPassed', 'Unknown')}")
        
        if result['metadata'].get('validationPassed'):
            print("✅ Quiz generation and validation successful!")
        else:
            print("⚠️  Some questions failed validation")
            print(f"Warning: {result['metadata'].get('warning', 'Unknown issue')}")
        
        # Show the first question as an example
        if result['questions']:
            first_q = result['questions'][0]
            print(f"\nExample question:")
            print(f"Q: {first_q['question']}")
            print(f"Options: {first_q['options']}")
            print(f"Correct Answer: {first_q['correctAnswer']} - {first_q['options'][first_q['correctAnswer']]}")
            print(f"Explanation: {first_q['explanation'][:100]}...")
            
    except Exception as e:
        print(f"❌ Error during quiz generation: {e}")
        print("Note: This might be expected if OPENAI_API_KEY is not set")

if __name__ == "__main__":
    # Run validation tests
    test_nlp_validation()
    
    # Run generation test (optional, requires API key)
    test_quiz_generation() 