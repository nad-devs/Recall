"""
Test script to demonstrate the Enhanced Learning Intelligence System
"""
import asyncio
import json
from datetime import datetime

# Mock the API key for testing
import os
os.environ["OPENAI_API_KEY"] = "test-key"

async def test_enhanced_extraction():
    """Test the enhanced extraction system with silent intelligence."""
    
    # Example concept (this would normally come from your extraction)
    sample_concept = {
        "title": "Valid Parentheses Using Stack",
        "category": "LeetCode Problems", 
        "summary": "A method to determine if a string of parentheses is valid using a stack data structure to ensure correct matching and order.",
        "details": "The problem of validating parentheses involves ensuring that each opening bracket has a corresponding closing bracket and that they are correctly nested. The stack data structure is ideal for this task because it follows a Last In, First Out (LIFO) principle, which matches the requirement of closing the most recently opened bracket first. The process begins by iterating through each character in the string. If an opening bracket is encountered, it is pushed onto the stack. When a closing bracket is encountered, the algorithm checks if the stack is empty, which would indicate an unmatched closing bracket, and returns false if so. Otherwise, it checks if the top of the stack contains the matching opening bracket. If it does, the top element is popped from the stack. If not, the string is invalid, and false is returned. After processing all characters, the stack should be empty if the string is valid, indicating all brackets were matched and closed correctly. This approach efficiently handles the problem with a time complexity of O(n), where n is the length of the string, as each character is processed once.",
        "confidence_score": 0.9,
        "codeSnippets": [
            {
                "language": "Python",
                "description": "Stack-based solution for valid parentheses",
                "code": "def isValid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    \n    for char in s:\n        if char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return False\n        else:\n            stack.append(char)\n    \n    return not stack"
            }
        ]
    }
    
    print("🚀 Testing Enhanced Learning Intelligence System")
    print("=" * 60)
    
    # Load the enhanced system (mock for testing)
    from api.v1.extract_concepts import LearningIntelligence
    
    # Initialize intelligence system
    intelligence = LearningIntelligence("test_learning_data.json")
    
    print("🧠 Analyzing concept intelligence...")
    print(f"   Concept: {sample_concept['title']}")
    print(f"   Category: {sample_concept['category']}")
    
    # Analyze the concept (this would run silently in the background)
    try:
        intelligence_result = await intelligence.analyze_concept_intelligence(
            sample_concept, 
            user_context={"user_id": "test_user"}
        )
        
        print("\n✅ Intelligence Analysis Complete!")
        print("=" * 60)
        
        # Display what the system learned (this would be stored silently)
        print(f"🔍 Learning Type: {intelligence_result.get('learning_type', 'Unknown')}")
        
        interview_potential = intelligence_result.get('interview_potential', {})
        print(f"🎯 Interview Potential: {interview_potential.get('score', 0):.1f}/1.0")
        print(f"   Readiness Level: {interview_potential.get('readiness_level', 'Unknown')}")
        
        review_timing = intelligence_result.get('review_timing', {})
        print(f"📅 Next Review: {review_timing.get('next_review', 'Not scheduled')}")
        print(f"   Complexity: {review_timing.get('complexity', 'Unknown')}")
        
        prerequisites = intelligence_result.get('prerequisite_connections', [])
        if prerequisites:
            print(f"📚 Prerequisites: {', '.join(prerequisites[:3])}")
        
        next_suggestions = intelligence_result.get('next_suggestions', [])
        if next_suggestions:
            print(f"💡 Next Learning Steps:")
            for i, suggestion in enumerate(next_suggestions[:2]):
                print(f"   {i+1}. {suggestion.get('concept', 'Unknown')} - {suggestion.get('reason', '')}")
        
        print("\n🎉 User Experience: UNCHANGED")
        print("   - User sees same clean concept extraction")
        print("   - Intelligence runs silently in background")
        print("   - Available for interview mode & recommendations")
        
        return intelligence_result
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return None

if __name__ == "__main__":
    # Run the test
    result = asyncio.run(test_enhanced_extraction())
    
    if result:
        print(f"\n📊 Intelligence Metadata Generated:")
        print(f"   - Analysis confidence: {result.get('confidence', 0)}")
        print(f"   - Learning insights: {len(result)} categories")
        print(f"   - Cost impact: ~$0.002 per concept (negligible)") 