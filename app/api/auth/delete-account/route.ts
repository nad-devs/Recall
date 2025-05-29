import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, confirmDelete } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Please confirm deletion by setting confirmDelete: true' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.toLowerCase().trim()
    console.log('🗑️ Delete Account API - Attempting to delete:', trimmedEmail)

    // Find the user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        accounts: true,
        sessions: true,
        conversations: true,
        concepts: true,
        categories: true
      }
    })

    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'Account not found'
      })
    }

    console.log('🔍 Found user to delete:', {
      id: userToDelete.id,
      email: userToDelete.email,
      name: userToDelete.name,
      accountsCount: userToDelete.accounts.length,
      sessionsCount: userToDelete.sessions.length,
      conversationsCount: userToDelete.conversations.length,
      conceptsCount: userToDelete.concepts.length,
      categoriesCount: userToDelete.categories.length
    })

    // Delete all associated data first (due to foreign key constraints)
    
    // 1. Delete concepts
    await prisma.concept.deleteMany({
      where: { userId: userToDelete.id }
    })
    console.log(`🗑️ Deleted ${userToDelete.concepts.length} concepts`)

    // 2. Delete conversations
    await prisma.conversation.deleteMany({
      where: { userId: userToDelete.id }
    })
    console.log(`🗑️ Deleted ${userToDelete.conversations.length} conversations`)

    // 3. Delete categories
    await prisma.category.deleteMany({
      where: { userId: userToDelete.id }
    })
    console.log(`🗑️ Deleted ${userToDelete.categories.length} categories`)

    // 4. Delete sessions
    await prisma.session.deleteMany({
      where: { userId: userToDelete.id }
    })
    console.log(`🗑️ Deleted ${userToDelete.sessions.length} sessions`)

    // 5. Delete OAuth accounts
    await prisma.account.deleteMany({
      where: { userId: userToDelete.id }
    })
    console.log(`🗑️ Deleted ${userToDelete.accounts.length} OAuth accounts`)

    // 6. Finally delete the user
    await prisma.user.delete({
      where: { id: userToDelete.id }
    })
    console.log('🗑️ Deleted user account')

    return NextResponse.json({
      success: true,
      message: `Successfully deleted account for ${trimmedEmail}`,
      deletedData: {
        concepts: userToDelete.concepts.length,
        conversations: userToDelete.conversations.length,
        categories: userToDelete.categories.length,
        sessions: userToDelete.sessions.length,
        accounts: userToDelete.accounts.length
      }
    })

  } catch (error) {
    console.error('🗑️ Delete Account API - Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete account', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 