import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Get the snippet ID from the URL query params
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Code snippet ID is required' },
        { status: 400 }
      );
    }

    // Check if the code snippet exists
    const snippet = await prisma.codeSnippet.findUnique({
      where: { id }
    });

    if (!snippet) {
      return NextResponse.json(
        { error: 'Code snippet not found' },
        { status: 404 }
      );
    }

    // Store the conceptId for the response
    const conceptId = snippet.conceptId;

    // Delete the code snippet
    await prisma.codeSnippet.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Code snippet deleted successfully',
      conceptId
    });
  } catch (error) {
    console.error('Error deleting code snippet:', error);
    return NextResponse.json(
      { error: 'Failed to delete code snippet' },
      { status: 500 }
    );
  }
} 