import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  return NextResponse.redirect(new URL(`/conversation/${id}`, request.url));
} 