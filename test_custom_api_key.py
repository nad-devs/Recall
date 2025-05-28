#!/usr/bin/env python3
"""
Test script to validate custom API key functionality in the backend.
"""

import asyncio
import json
from concept_extractor import ConversationRequest, concept_extractor

async def test_custom_api_key():
    """Test the custom API key functionality."""
    
    # Test conversation about a simple programming concept
    test_conversation = """
    I just learned about the Contains Duplicate problem. 
    The basic approach is to use a hash table to track elements we've seen.
    As we iterate through the array, we check if each element is already in our set.
    If it is, we found a duplicate. If not, we add it to the set.
    This gives us O(n) time complexity instead of O(n²) for nested loops.
    """
    
    # Create request without custom API key (should use server's key)
    request = ConversationRequest(
        conversation_text=test_conversation,
        context=None,
        category_guidance=None,
        custom_api_key=None
    )
    
    print("🧪 Testing concept extraction without custom API key...")
    try:
        result = await concept_extractor.analyze_conversation(request)
        print("✅ Success! Extracted concepts:")
        for concept in result.get('concepts', []):
            print(f"  - {concept.get('title', 'Untitled')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test with a placeholder custom API key (this will fail but should handle gracefully)
    print("\n🧪 Testing concept extraction with placeholder custom API key...")
    request_with_custom_key = ConversationRequest(
        conversation_text=test_conversation,
        context=None,
        category_guidance=None,
        custom_api_key="sk-test123456789"  # Placeholder key
    )
    
    try:
        result = await concept_extractor.analyze_conversation(request_with_custom_key)
        print("✅ Success! Extracted concepts:")
        for concept in result.get('concepts', []):
            print(f"  - {concept.get('title', 'Untitled')}")
    except Exception as e:
        print(f"❌ Expected error with invalid key: {e}")
    
    print("\n🎉 Custom API key functionality test completed!")

if __name__ == "__main__":
    asyncio.run(test_custom_api_key()) 