import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, name, pendingUserName } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔧 User Info API - Looking up user:', email)
    console.log('🔧 User Info API - Pending name from form:', pendingUserName)

    // Prioritize the name from the landing page form, then OAuth name, then default
    const finalName = pendingUserName?.trim() || name || 'User'

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.log('🔧 User Info API - Creating new user for OAuth:', email, 'with name:', finalName)
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: finalName,
          lastActiveAt: new Date()
        }
      })
    } else {
      console.log('🔧 User Info API - Found existing user:', user.id)
      // Update last active time and name if a new name is provided
      const updateData: any = { lastActiveAt: new Date() }
      
      // Only update name if we have a pending name from the form
      if (pendingUserName?.trim()) {
        updateData.name = finalName
        console.log('🔧 User Info API - Updating user name to:', finalName)
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })
      
      // Update the user object with the new name for return
      if (pendingUserName?.trim()) {
        user.name = finalName
      }
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