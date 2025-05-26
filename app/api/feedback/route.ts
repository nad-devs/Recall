import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'rating']),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(1).max(1000),
  page: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = feedbackSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        rating: validatedData.rating,
        message: validatedData.message,
        page: validatedData.page,
        userAgent: request.headers.get('user-agent'),
      }
    })

    // Track analytics
    await prisma.analytics.create({
      data: {
        userId: user.id,
        event: 'feedback_submitted',
        properties: JSON.stringify({
          type: validatedData.type,
          rating: validatedData.rating,
          page: validatedData.page,
        })
      }
    })

    return NextResponse.json({ 
      success: true, 
      feedbackId: feedback.id 
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin users to view all feedback
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ feedback })

  } catch (error) {
    console.error('Feedback retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 