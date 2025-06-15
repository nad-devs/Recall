import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { conceptId1, conceptId2 } = await request.json();

    if (!conceptId1 || !conceptId2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Both concept IDs are required' 
      }, { status: 400 });
    }

    if (conceptId1 === conceptId2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot link a concept to itself' 
      }, { status: 400 });
    }

    // Fetch both concepts to get their current related concepts
    const [concept1, concept2] = await Promise.all([
      prisma.concept.findUnique({ where: { id: conceptId1 } }),
      prisma.concept.findUnique({ where: { id: conceptId2 } })
    ]);

    if (!concept1 || !concept2) {
      return NextResponse.json({ 
        success: false, 
        error: 'One or both concepts not found' 
      }, { status: 404 });
    }

    // Parse existing related concepts for both concepts
    let concept1Related = [];
    let concept2Related = [];

    try {
      concept1Related = concept1.relatedConcepts ? JSON.parse(concept1.relatedConcepts) : [];
      if (!Array.isArray(concept1Related)) concept1Related = [];
    } catch {
      concept1Related = [];
    }

    try {
      concept2Related = concept2.relatedConcepts ? JSON.parse(concept2.relatedConcepts) : [];
      if (!Array.isArray(concept2Related)) concept2Related = [];
    } catch {
      concept2Related = [];
    }

    // Add bidirectional relationships (using both ID and title for compatibility)
    const concept2Reference = { id: concept2.id, title: concept2.title };
    const concept1Reference = { id: concept1.id, title: concept1.title };

    // Check if relationship already exists
    const concept1HasConcept2 = concept1Related.some((rel: any) => 
      (typeof rel === 'object' && rel.id === concept2.id) ||
      (typeof rel === 'string' && rel === concept2.title)
    );

    const concept2HasConcept1 = concept2Related.some((rel: any) => 
      (typeof rel === 'object' && rel.id === concept1.id) ||
      (typeof rel === 'string' && rel === concept1.title)
    );

    // Add relationships if they don't exist
    if (!concept1HasConcept2) {
      concept1Related.push(concept2Reference);
    }

    if (!concept2HasConcept1) {
      concept2Related.push(concept1Reference);
    }

    // Update both concepts with new relationships
    await Promise.all([
      prisma.concept.update({
        where: { id: conceptId1 },
        data: { relatedConcepts: JSON.stringify(concept1Related) }
      }),
      prisma.concept.update({
        where: { id: conceptId2 },
        data: { relatedConcepts: JSON.stringify(concept2Related) }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully linked "${concept1.title}" and "${concept2.title}"`
    });

  } catch (error) {
    console.error('Error linking concepts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to link concepts. Please try again.'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { conceptId1, conceptId2 } = await request.json();

    if (!conceptId1 || !conceptId2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Both concept IDs are required' 
      }, { status: 400 });
    }

    // Fetch both concepts to get their current related concepts
    const [concept1, concept2] = await Promise.all([
      prisma.concept.findUnique({ where: { id: conceptId1 } }),
      prisma.concept.findUnique({ where: { id: conceptId2 } })
    ]);

    if (!concept1 || !concept2) {
      return NextResponse.json({ 
        success: false, 
        error: 'One or both concepts not found' 
      }, { status: 404 });
    }

    // Parse existing related concepts for both concepts
    let concept1Related = [];
    let concept2Related = [];

    try {
      concept1Related = concept1.relatedConcepts ? JSON.parse(concept1.relatedConcepts) : [];
      if (!Array.isArray(concept1Related)) concept1Related = [];
    } catch {
      concept1Related = [];
    }

    try {
      concept2Related = concept2.relatedConcepts ? JSON.parse(concept2.relatedConcepts) : [];
      if (!Array.isArray(concept2Related)) concept2Related = [];
    } catch {
      concept2Related = [];
    }

    // Remove bidirectional relationships
    concept1Related = concept1Related.filter((rel: any) => 
      !((typeof rel === 'object' && rel.id === concept2.id) ||
        (typeof rel === 'string' && rel === concept2.title))
    );

    concept2Related = concept2Related.filter((rel: any) => 
      !((typeof rel === 'object' && rel.id === concept1.id) ||
        (typeof rel === 'string' && rel === concept1.title))
    );

    // Update both concepts with removed relationships
    await Promise.all([
      prisma.concept.update({
        where: { id: conceptId1 },
        data: { relatedConcepts: JSON.stringify(concept1Related) }
      }),
      prisma.concept.update({
        where: { id: conceptId2 },
        data: { relatedConcepts: JSON.stringify(concept2Related) }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully unlinked "${concept1.title}" and "${concept2.title}"`
    });

  } catch (error) {
    console.error('Error unlinking concepts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to unlink concepts. Please try again.'
    }, { status: 500 });
  }
} 