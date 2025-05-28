import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

const prisma = new PrismaClient()

// NextAuth configuration for server-side session validation
const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : [])
  ],
  session: {
    strategy: "database" as const,
  },
}

export interface SessionUser {
  id: string
  name: string | null
  email: string | null
  isEmailBased: boolean
}

export async function validateSession(request: NextRequest): Promise<SessionUser | null> {
  try {
    // First, try to get NextAuth session (OAuth)
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      console.log('🔧 Session validation - Found NextAuth session for:', session.user.email)
      
      // Find or create user for OAuth
      let user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      if (!user) {
        console.log('🔧 Session validation - Creating new user for OAuth:', session.user.email)
        // Create user if they don't exist
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || 'User',
            lastActiveAt: new Date()
          }
        })
      } else {
        // Update last active time for OAuth users
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        })
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailBased: false
      }
    }

    // Check for email-based session headers
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')

    if (userEmail && userId) {
      console.log('🔧 Session validation - Found email-based session for:', userEmail)
      
      // First try to find by ID and email combination
      let user = await prisma.user.findFirst({
        where: {
          id: userId,
          email: userEmail
        }
      })

      // If not found by ID, try to find by email only (for OAuth users who have email as userId)
      if (!user && userEmail === userId) {
        console.log('🔧 Session validation - Trying to find OAuth user by email:', userEmail)
        user = await prisma.user.findUnique({
          where: { email: userEmail }
        })
      }

      // If still not found, try just by email (fallback for OAuth users)
      if (!user) {
        console.log('🔧 Session validation - Fallback: finding user by email only:', userEmail)
        user = await prisma.user.findUnique({
          where: { email: userEmail }
        })
      }

      if (user) {
        // Update last active time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isEmailBased: userId !== userEmail // If userId equals email, it's likely OAuth
        }
      }
    }

    console.log('🔧 Session validation - No valid session found')
    return null
  } catch (error) {
    console.error('🔧 Session validation error:', error)
    return null
  }
}

export async function getUserFromLocalStorage(userId: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailBased: true
      }
    }

    return null
  } catch (error) {
    console.error('User lookup error:', error)
    return null
  }
}

// New function to handle cross-authentication validation
export async function validateGmailUser(email: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (user) {
      // Update last active time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      })

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailBased: false // Could be either, but we'll treat as OAuth for this validation
      }
    }

    return null
  } catch (error) {
    console.error('Gmail user validation error:', error)
    return null
  }
}

// Function to merge OAuth and email-based user accounts if they have the same email
export async function mergeUserAccounts(email: string): Promise<SessionUser | null> {
  try {
    const users = await prisma.user.findMany({
      where: { email: email.toLowerCase().trim() }
    })

    if (users.length > 1) {
      // Multiple users with same email - merge them
      const primaryUser = users.find(u => u.email) || users[0]
      const otherUsers = users.filter(u => u.id !== primaryUser.id)

      // Merge conversations and concepts to primary user
      for (const user of otherUsers) {
        await prisma.conversation.updateMany({
          where: { userId: user.id },
          data: { userId: primaryUser.id }
        })

        await prisma.concept.updateMany({
          where: { userId: user.id },
          data: { userId: primaryUser.id }
        })

        // Delete the duplicate user
        await prisma.user.delete({
          where: { id: user.id }
        })
      }

      return {
        id: primaryUser.id,
        name: primaryUser.name,
        email: primaryUser.email,
        isEmailBased: false
      }
    }

    return users.length === 1 ? {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      isEmailBased: false
    } : null

  } catch (error) {
    console.error('Account merge error:', error)
    return null
  }
} 