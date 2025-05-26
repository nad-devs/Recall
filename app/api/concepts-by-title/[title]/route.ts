import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ title: string }> }
) {
  try {
    const params = await context.params;
    const title = decodeURIComponent(params.title);

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Try to find a concept with this exact title
    const concept = await prisma.concept.findFirst({
      where: {
        title: {
          equals: title
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        summary: true
      }
    });

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(concept);

  } catch (error) {
    console.error('Error finding concept by title:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 