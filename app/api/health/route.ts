import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check environment variables
    const requiredEnvVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      EXTRACTION_SERVICE_URL: !!process.env.EXTRACTION_SERVICE_URL,
    }

    // Check if extraction service is reachable
    let extractionServiceHealthy = false
    try {
      const extractionServiceUrl = process.env.EXTRACTION_SERVICE_URL?.replace('/api/v1/extract-concepts', '/api/v1/health')
      if (extractionServiceUrl) {
        const response = await fetch(extractionServiceUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        extractionServiceHealthy = response.ok
      }
    } catch (error) {
      console.warn('Extraction service health check failed:', error)
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: requiredEnvVars,
      extractionService: extractionServiceHealthy ? 'healthy' : 'unhealthy',
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        database: 'disconnected'
      },
      { status: 503 }
    )
  }
} 