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
    
    // Get current confidence score and review count
    const currentConfidence = existingConcept.confidenceScore || 0.5;
    const currentReviewCount = existingConcept.reviewCount || 0;
    
    // Calculate new confidence score based on current quiz performance
    let newQuizConfidence = 0.6; // Default/minimum
    
    if (percentageScore === 1) {
      newQuizConfidence = 0.9; // Perfect score
    } else if (percentageScore >= 0.8) {
      newQuizConfidence = 0.85; // Very good
    } else if (percentageScore >= 0.7) {
      newQuizConfidence = 0.8; // Good
    } else if (percentageScore >= 0.6) {
      newQuizConfidence = 0.75; // Moderate
    } else if (percentageScore >= 0.5) {
      newQuizConfidence = 0.7; // Pass
    } else if (percentageScore >= 0.4) {
      newQuizConfidence = 0.65; // Below average
    } else {
      newQuizConfidence = 0.5; // Poor performance
    }
    
    // Calculate final confidence score using weighted average
    // Give more weight to recent performance, but consider history
    let finalConfidenceScore;
    
    if (currentReviewCount === 0) {
      // First review - use the quiz confidence directly
      finalConfidenceScore = newQuizConfidence;
    } else {
      // Weighted average: 60% current performance, 40% historical performance
      // This ensures recent poor performance can bring down a previously high score
      const currentWeight = 0.6;
      const historicalWeight = 0.4;
      
      finalConfidenceScore = (newQuizConfidence * currentWeight) + (currentConfidence * historicalWeight);
      
      // If current performance is significantly worse than previous confidence,
      // apply additional penalty to ensure "needs review" status triggers
      if (newQuizConfidence < currentConfidence - 0.2) {
        // Apply penalty for regression in performance
        finalConfidenceScore = Math.max(finalConfidenceScore - 0.1, 0.3);
      }
    }
    
    // Ensure confidence score stays within valid bounds
    finalConfidenceScore = Math.max(0.3, Math.min(1.0, finalConfidenceScore));
    
    console.log('🔧 Review API - Current confidence:', currentConfidence);
    console.log('🔧 Review API - Quiz confidence:', newQuizConfidence);
    console.log('🔧 Review API - Final confidence:', finalConfidenceScore);
    console.log('🔧 Review API - Needs review:', finalConfidenceScore < 0.7);
    
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
      needsReview: finalConfidenceScore < 0.7
    });
  } catch (error) {
    console.error("Error updating review stats:", error);
    return NextResponse.json(
      { error: "Failed to update review stats" }, 
      { status: 500 }
    );
  }
} 