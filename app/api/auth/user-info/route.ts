import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔧 User Info API - Looking up user:', email)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.log('🔧 User Info API - Creating new user for OAuth:', email)
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name || 'User',
          lastActiveAt: new Date()
        }
      })
    } else {
      console.log('🔧 User Info API - Found existing user:', user.id)
      // Update last active time and name if provided
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastActiveAt: new Date(),
          ...(name && { name })
        }
      })
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('🔧 User Info API - Error:', error)
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    )
  }
} 