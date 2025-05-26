import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get user signups
    const userSignups = await prisma.analytics.findMany({
      where: {
        event: 'user_signup'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Last 100 users
    });

    // Parse and format the data
    const users = userSignups.map(signup => {
      try {
        const properties = JSON.parse(signup.properties);
        return {
          id: signup.id,
          name: properties.name,
          timezone: properties.timezone,
          timestamp: signup.timestamp,
          userAgent: signup.userAgent
        };
      } catch (e) {
        return {
          id: signup.id,
          name: 'Unknown',
          timezone: 'Unknown',
          timestamp: signup.timestamp,
          userAgent: signup.userAgent
        };
      }
    });

    // Get some basic stats
    const totalUsers = users.length;
    const todayUsers = users.filter(user => {
      const today = new Date();
      const userDate = new Date(user.timestamp);
      return userDate.toDateString() === today.toDateString();
    }).length;

    const thisWeekUsers = users.filter(user => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(user.timestamp) > weekAgo;
    }).length;

    return NextResponse.json({
      users,
      stats: {
        total: totalUsers,
        today: todayUsers,
        thisWeek: thisWeekUsers
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 