import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { name, email, timestamp, timezone } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    // Check if user with this email already exists
    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    })

    if (user) {
      // User exists, update their name and last active time
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: trimmedName, // Update name in case they changed it
          lastActiveAt: new Date(),
          timezone: timezone || 'UTC'
        }
      })

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        isReturningUser: true,
        message: `Welcome back, ${trimmedName}!`
      })
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          timezone: timezone || 'UTC',
          lastActiveAt: new Date()
        }
      })

      // Log analytics for new user
      try {
        await prisma.analytics.create({
          data: {
            userId: user.id,
            event: 'user_created',
            properties: JSON.stringify({
              name: trimmedName,
              email: trimmedEmail,
              timezone,
              timestamp
            })
          }
        })
      } catch (analyticsError) {
        // Analytics failure shouldn't block user creation
        console.warn('Analytics logging failed:', analyticsError)
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        isNewUser: true,
        message: `Welcome, ${trimmedName}! Your account has been created.`
      })
    }

  } catch (error) {
    console.error('User creation/login error:', error)
    return NextResponse.json(
      { error: 'Failed to create or find user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 