import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Delete code snippets first (if not cascaded)
    await prisma.codeSnippet.deleteMany({});
    // Delete concepts
    await prisma.concept.deleteMany({});
    // Delete conversations
    const deletedConversations = await prisma.conversation.deleteMany({});
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedConversations.count} conversations and all related data.`
    });
  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations', details: error },
      { status: 500 }
    );
  }
} 