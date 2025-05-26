import { NextResponse } from 'next/server'
import { getClientIP, getServerUsageData } from '@/lib/usage-tracker-server'

export async function GET(request: Request) {
  try {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get custom API key from query params if provided
    const url = new URL(request.url)
    const customApiKey = url.searchParams.get('customApiKey') || undefined
    
    const usageData = await getServerUsageData(clientIP, userAgent, customApiKey)
    
    return NextResponse.json(usageData)
  } catch (error) {
    console.error('Error getting usage data:', error)
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    )
  }
} 