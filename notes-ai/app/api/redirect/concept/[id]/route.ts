import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  return NextResponse.redirect(new URL(`/concepts/${id}`, request.url));
} 