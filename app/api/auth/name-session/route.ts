import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { name, timestamp, userAgent, timezone } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const sessionId = nanoid()

    // Check if user with this name already exists
    let user = await prisma.user.findFirst({
      where: {
        name: trimmedName,
        isNameBased: true
      }
    })

    if (user) {
      // Update existing user's session and last active time
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          sessionId,
          lastActiveAt: new Date(),
          timezone: timezone || 'UTC'
        }
      })
    } else {
      // Create new name-based user
      user = await prisma.user.create({
        data: {
          name: trimmedName,
          sessionId,
          isNameBased: true,
          timezone: timezone || 'UTC',
          lastActiveAt: new Date()
        }
      })
    }

    // Log analytics (optional)
    try {
      await prisma.analytics.create({
        data: {
          userId: user.id,
          event: 'name_session_created',
          properties: JSON.stringify({
            name: trimmedName,
            userAgent,
            timezone,
            isNewUser: !user.createdAt || user.createdAt.getTime() === user.updatedAt.getTime()
          }),
          sessionId,
          userAgent
        }
      })
    } catch (analyticsError) {
      // Analytics failure shouldn't block the session creation
      console.warn('Analytics logging failed:', analyticsError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        isNameBased: user.isNameBased
      },
      sessionId
    })

  } catch (error) {
    console.error('Name session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 