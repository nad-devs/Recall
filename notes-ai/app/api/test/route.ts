import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Try to create a test conversation
    const testConversation = await prisma.conversation.create({
      data: {
        text: "Test conversation",
        summary: "This is a test",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      data: testConversation 
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 