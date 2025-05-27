import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Check if user with this email exists
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (user) {
      // Update last active time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      })

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        message: `Welcome back, ${user.name}!`
      })
    } else {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Sign-in check error:', error)
    return NextResponse.json(
      { error: 'Failed to check user account' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 