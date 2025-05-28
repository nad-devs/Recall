import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

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

    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to find a concept with this exact title that belongs to the user
    const concept = await prisma.concept.findFirst({
      where: {
        title: {
          equals: title
        },
        userId: user.id  // Ensure user can only find their own concepts
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