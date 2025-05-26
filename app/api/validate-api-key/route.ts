import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Test the API key with a simple request
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    try {
      // Make a simple request to validate the key
      await openai.models.list()
      
      return NextResponse.json({ valid: true })
    } catch (error: any) {
      console.error('API key validation failed:', error)
      
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your key and try again.' },
          { status: 400 }
        )
      }
      
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'API key rate limit exceeded. Please try again later.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to validate API key. Please try again.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 