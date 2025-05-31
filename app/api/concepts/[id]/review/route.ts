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
    
    // Simple confidence calculation based on 80% threshold
    let finalConfidenceScore;
    
    if (percentageScore >= 0.8) {
      // 80% or above → Remove "Needs Review" (confidence ≥ 0.7)
      if (percentageScore === 1) {
        finalConfidenceScore = 0.95; // Perfect score
      } else if (percentageScore >= 0.9) {
        finalConfidenceScore = 0.9;  // Excellent
      } else {
        finalConfidenceScore = 0.8;  // Good (above threshold)
      }
    } else {
      // Below 80% → Show "Needs Review" (confidence < 0.7)
      if (percentageScore >= 0.6) {
        finalConfidenceScore = 0.65; // Moderate but needs review
      } else if (percentageScore >= 0.4) {
        finalConfidenceScore = 0.6;  // Below average
      } else {
        finalConfidenceScore = 0.5;  // Poor performance
      }
    }
    
    console.log('🔧 Review API - Percentage score:', (percentageScore * 100).toFixed(1) + '%');
    console.log('🔧 Review API - Final confidence:', finalConfidenceScore);
    console.log('🔧 Review API - Needs review:', finalConfidenceScore < 0.7);
    console.log('🔧 Review API - Status:', percentageScore >= 0.8 ? 'MASTERED (≥80%)' : 'NEEDS REVIEW (<80%)');
    
    // Use raw SQL for the update to avoid TypeScript issues
    // This ensures we can update all fields regardless of TypeScript definitions
    await prisma.$executeRaw`
      UPDATE "Concept" 
      SET 
        "confidenceScore" = ${finalConfidenceScore},
        "lastReviewed" = ${new Date().toISOString()},
        "reviewCount" = "reviewCount" + 1,
        "nextReviewDate" = ${new Date(Date.now() + (percentageScore >= 0.8 ? 14 : 7) * 24 * 60 * 60 * 1000).toISOString()}
      WHERE "id" = ${id}
    `;
    
    console.log('🔧 Review API - Update successful');
    
    return NextResponse.json({ 
      success: true,
      newConfidenceScore: finalConfidenceScore,
      needsReview: finalConfidenceScore < 0.7,
      status: percentageScore >= 0.8 ? 'mastered' : 'needs_review'
    });
  } catch (error) {
    console.error("Error updating review stats:", error);
    return NextResponse.json(
      { error: "Failed to update review stats" }, 
      { status: 500 }
    );
  }
} 