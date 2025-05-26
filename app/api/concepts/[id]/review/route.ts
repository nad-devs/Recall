import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const { score, totalQuestions } = await request.json();
    
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
    
    // First check if the concept exists
    const existingConcept = await prisma.concept.findUnique({
      where: { id }
    });
    
    if (!existingConcept) {
      return NextResponse.json(
        { error: "Concept not found" }, 
        { status: 404 }
      );
    }
    
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