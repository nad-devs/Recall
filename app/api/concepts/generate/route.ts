import { NextResponse } from 'next/server';

// Enhanced LeetCode problem detection (shared with other routes)
function detectLeetCodeProblem(conversationText: string): { isLeetCode: boolean, problemName?: string, approach?: string } {
  const text = conversationText.toLowerCase();
  
  // Common LeetCode problem patterns
  const leetcodePatterns = [
    { pattern: /contains?\s+duplicate/i, name: "Contains Duplicate" },
    { pattern: /valid\s+anagram/i, name: "Valid Anagram" },
    { pattern: /two\s+sum/i, name: "Two Sum" },
    { pattern: /three\s+sum/i, name: "Three Sum" },
    { pattern: /reverse\s+linked\s+list/i, name: "Reverse Linked List" },
    { pattern: /merge\s+(?:two\s+)?sorted\s+(?:arrays?|lists?)/i, name: "Merge Two Sorted Lists" },
    { pattern: /palindrome\s+(?:string|number|linked\s+list)/i, name: "Valid Palindrome" },
    // Add more patterns as needed
  ];
  
  // Check for exact LeetCode problem matches
  for (const { pattern, name } of leetcodePatterns) {
    if (pattern.test(text)) {
      return { isLeetCode: true, problemName: name };
    }
  }
  
  // Check for general problem indicators
  const problemIndicators = [
    "leetcode", "algorithm problem", "coding problem", "interview question"
  ];
  
  const isLeetCodeStyle = problemIndicators.some(indicator => text.includes(indicator));
  return { isLeetCode: isLeetCodeStyle };
}

// Generate enhanced guidance for the backend
function generateLeetCodeGuidance(conversationText: string) {
  const detection = detectLeetCodeProblem(conversationText);
  
  if (!detection.isLeetCode) {
    return null;
  }
  
  let guidance = `This is about a LeetCode-style algorithm problem. When generating the concept title, use the EXACT problem name if known (e.g., "Contains Duplicate", "Valid Anagram", "Two Sum", etc.). Focus on the specific problem, not just the technique used.`;

  if (detection.problemName) {
    guidance += ` Detected Problem: "${detection.problemName}" - use this as the title.`;
  }
  
  return guidance;
}

export async function POST(request: Request) {
  try {
    const { conceptName, context } = await request.json();

    if (!conceptName || typeof conceptName !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Concept name is required' 
      }, { status: 400 });
    }

    // Create a prompt specifically for generating concept details from just a name
    const generationPrompt = context 
      ? `Based on this conversation context:\n\n${context}\n\nPlease provide a comprehensive technical explanation of the concept: "${conceptName}".`
      : `Please provide a comprehensive technical explanation of the concept: "${conceptName}".`;

    // Detect LeetCode problems and generate guidance
    const fullContext = context ? `${context} ${conceptName}` : conceptName;
    const leetcodeGuidance = generateLeetCodeGuidance(fullContext);

    // Use the existing Python backend service to generate the concept
    const httpsUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
    const httpUrl = httpsUrl.replace('https://', 'http://');
    
    let backendResponse;
    try {
      console.log("Attempting HTTPS connection for concept generation...");
      backendResponse = await fetch(`${httpsUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text: generationPrompt + 
            ` Include a detailed summary, key points, implementation details, code examples if applicable, ` +
            `related concepts, and appropriate categorization. Focus specifically on "${conceptName}" as the main concept.`,
          context: null,
          category_guidance: leetcodeGuidance ? { guidance: leetcodeGuidance } : null
        }),
      });
    } catch (sslError) {
      console.log("HTTPS failed for concept generation, trying HTTP fallback...", sslError instanceof Error ? sslError.message : 'SSL connection failed');
      backendResponse = await fetch(`${httpUrl}/api/v1/extract-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversation_text: generationPrompt + 
            ` Include a detailed summary, key points, implementation details, code examples if applicable, ` +
            `related concepts, and appropriate categorization. Focus specifically on "${conceptName}" as the main concept.`,
          context: null,
          category_guidance: leetcodeGuidance ? { guidance: leetcodeGuidance } : null
        }),
      });
    }

    if (!backendResponse.ok) {
      throw new Error(`Backend service failed: ${backendResponse.status}`);
    }

    const backendData = await backendResponse.json();
    
    // Find the most relevant concept from the backend response
    let generatedConcept = null;
    if (backendData.concepts && backendData.concepts.length > 0) {
      // Look for a concept that matches the requested name most closely
      generatedConcept = backendData.concepts.find((concept: any) => 
        concept.title.toLowerCase().includes(conceptName.toLowerCase()) ||
        conceptName.toLowerCase().includes(concept.title.toLowerCase())
      ) || backendData.concepts[0]; // Fallback to first concept if no close match
    }

    if (!generatedConcept) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate concept content'
      }, { status: 500 });
    }

    // Return the generated concept in a format compatible with the frontend
    return NextResponse.json({
      success: true,
      concept: {
        id: `generated-${Date.now()}`, // Temporary ID until saved
        title: generatedConcept.title,
        category: generatedConcept.category || 'General',
        summary: generatedConcept.summary || '',
        details: generatedConcept.details || generatedConcept.implementation || '',
        keyPoints: generatedConcept.keyPoints || [],
        examples: generatedConcept.examples || [],
        codeSnippets: generatedConcept.codeSnippets || [],
        relatedConcepts: generatedConcept.relatedConcepts || [],
        relationships: generatedConcept.relationships || {}
      }
    });

  } catch (error) {
    console.error('Error generating concept:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate concept. Please try again.'
    }, { status: 500 });
  }
} 