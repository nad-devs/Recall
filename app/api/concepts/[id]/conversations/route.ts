import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const params = await context.params;
    const conceptId = params.id;
    
    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get conversations that include this concept
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        concepts: {
          some: {
            id: conceptId
          }
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error getting concept conversations:', error);
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
} 