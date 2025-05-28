import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { validateSession } from "../../../../../lib/session";
import { Prisma } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user session
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    const { score, totalQuestions } = await request.json();
    
    console.log('🔧 Review API - User:', user.id, 'Concept:', id, 'Score:', score, '/', totalQuestions);
    
    // Calculate the percentage score
    const percentageScore = score / totalQuestions;
    
    // Determine confidence score based on quiz performance
    let confidenceScore = 0.6; // Default/minimum
    
    if (percentageScore === 1) {
      confidenceScore = 0.9; // Perfect score
    } else if (percentageScore >= 0.8) {
      confidenceScore = 0.85; // Very good
    } else if (percentageScore >= 0.7) {
      confidenceScore = 0.8; // Good
    } else if (percentageScore >= 0.6) {
      confidenceScore = 0.75; // Moderate
    } else if (percentageScore >= 0.5) {
      confidenceScore = 0.7; // Pass
    }
    
    // First check if the concept exists and belongs to the user
    const existingConcept = await prisma.concept.findFirst({
      where: { 
        id,
        userId: user.id  // Ensure user can only update their own concepts
      }
    });
    
    if (!existingConcept) {
      return NextResponse.json(
        { error: "Concept not found or access denied" }, 
        { status: 404 }
      );
    }
    
    console.log('🔧 Review API - Updating concept with confidence score:', confidenceScore);
    
    // Use raw SQL for the update to avoid TypeScript issues
    // This ensures we can update all fields regardless of TypeScript definitions
    await prisma.$executeRaw`
      UPDATE "Concept" 
      SET 
        "confidenceScore" = ${confidenceScore},
        "lastReviewed" = ${new Date().toISOString()},
        "reviewCount" = "reviewCount" + 1,
        "nextReviewDate" = ${new Date(Date.now() + (percentageScore >= 0.8 ? 14 : 7) * 24 * 60 * 60 * 1000).toISOString()}
      WHERE "id" = ${id}
    `;
    
    console.log('🔧 Review API - Update successful');
    
    return NextResponse.json({ 
      success: true,
      newConfidenceScore: confidenceScore,
      needsReview: confidenceScore < 0.7
    });
  } catch (error) {
    console.error("Error updating review stats:", error);
    return NextResponse.json(
      { error: "Failed to update review stats" }, 
      { status: 500 }
    );
  }
} 