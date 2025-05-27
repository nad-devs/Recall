import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SessionUser {
  id: string
  name: string | null
  email: string | null
  isEmailBased: boolean
}

export async function validateSession(request: NextRequest): Promise<SessionUser | null> {
  try {
    // First, try to get NextAuth session
    const session = await getServerSession()
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isEmailBased: false
        }
      }
    }

    // Check for email-based session
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')

    if (userEmail && userId) {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          email: userEmail
        }
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
          isEmailBased: true
        }
      }
    }

    return null
  } catch (error) {
    console.error('Session validation error:', error)
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