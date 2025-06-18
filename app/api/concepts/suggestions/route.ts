import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🔍 [Frontend] Proxying concept suggestions request to backend...");
    console.log("📝 Concept:", body.conceptTitle);

    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || 'https://recall-p3vg.onrender.com';
    
    // Proxy the request to our smart backend
    const response = await fetch(`${backendUrl}/api/v1/concepts/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Frontend/1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend suggestions error:", response.status, errorText);
      
      // Return fallback suggestions on backend error
      return NextResponse.json({
        suggestions: [
          {
            title: "Related Concept Analysis",
            reason: "Analyze the relationships and connections with this concept",
            relevanceScore: 0.7
          },
          {
            title: "Practical Applications",
            reason: "Explore real-world use cases and implementations",
            relevanceScore: 0.6
          }
        ],
        fallback: true,
        error: "Backend suggestions temporarily unavailable"
      });
    }

    const result = await response.json();
    console.log("✅ [Frontend] Received suggestions from backend:", result.suggestions?.length || 0);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in suggestions proxy:', error);
    
    // Return fallback on any error
    return NextResponse.json({
      suggestions: [
        {
          title: "Explore Related Topics",
          reason: "Discover concepts that build upon your current knowledge",
          relevanceScore: 0.5
        }
      ],
      fallback: true,
      error: "Suggestions service temporarily unavailable"
    });
  }
} 