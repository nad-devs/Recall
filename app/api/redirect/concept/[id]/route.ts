import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  return NextResponse.redirect(new URL(`/concepts/${id}`, request.url));
} 