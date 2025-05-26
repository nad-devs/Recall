import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, timestamp, userAgent, timezone } = await request.json();

    // Create analytics entry
    await prisma.analytics.create({
      data: {
        event: 'user_signup',
        properties: JSON.stringify({
          name: name,
          timezone: timezone,
          timestamp: timestamp
        }),
        userAgent: userAgent,
        timestamp: new Date(timestamp)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return success even if analytics fails - don't block user experience
    return NextResponse.json({ success: true });
  }
} 