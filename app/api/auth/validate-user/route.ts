import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { validateSession, validateGmailUser, mergeUserAccounts } from '@/lib/session'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, method } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check for existing users with this email
    const existingUsers = await prisma.user.findMany({
      where: { email: trimmedEmail }
    })

    if (existingUsers.length === 0) {
      return NextResponse.json({
        exists: false,
        message: 'No account found with this email'
      })
    }

    // If multiple users exist with same email, merge them
    if (existingUsers.length > 1) {
      console.log(`🔄 Found ${existingUsers.length} users with email ${trimmedEmail}, merging...`)
      const mergedUser = await mergeUserAccounts(trimmedEmail)
      
      if (mergedUser) {
        return NextResponse.json({
          exists: true,
          user: {
            id: mergedUser.id,
            name: mergedUser.name,
            email: mergedUser.email
          },
          method: 'merged',
          message: 'Accounts merged successfully'
        })
      }
    }

    const user = existingUsers[0]

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    })

    // Determine authentication method based on how they're trying to sign in
    let authMethod = 'email'
    if (method === 'oauth' || method === 'google') {
      authMethod = 'oauth'
    }

    // For Gmail users, check if they can use OAuth
    const isGmailUser = trimmedEmail.includes('@gmail.com') || trimmedEmail.includes('@googlemail.com')
    
    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      isGmailUser,
      canUseOAuth: isGmailUser,
      method: authMethod,
      message: `Welcome back, ${user.name}!`
    })

  } catch (error) {
    console.error('User validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate current session using both methods
    const sessionUser = await validateSession(request)
    
    if (!sessionUser) {
      // Try NextAuth session
      const session = await getServerSession()
      if (session?.user?.email) {
        const gmailUser = await validateGmailUser(session.user.email)
        if (gmailUser) {
          return NextResponse.json({
            authenticated: true,
            user: gmailUser,
            method: 'oauth'
          })
        }
      }
      
      return NextResponse.json({
        authenticated: false,
        message: 'No valid session found'
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionUser,
      method: sessionUser.isEmailBased ? 'email' : 'oauth'
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    )
  }
} 