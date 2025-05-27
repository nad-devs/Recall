import { NextResponse } from 'next/server';

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
            `related concepts, and appropriate categorization. Focus specifically on "${conceptName}" as the main concept.`
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
            `related concepts, and appropriate categorization. Focus specifically on "${conceptName}" as the main concept.`
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