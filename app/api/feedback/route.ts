import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'rating']),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(1).max(1000),
  page: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  browserInfo: z.string().optional(),
  context: z.string().optional(),
})

// Simple email sending function (you can replace with your preferred service)
async function sendFeedbackEmail(feedbackData: any, screenshots: string[]) {
  const emailContent = `
🔔 NEW FEEDBACK RECEIVED

Type: ${feedbackData.type.toUpperCase()}
${feedbackData.priority ? `Priority: ${feedbackData.priority.toUpperCase()}` : ''}
${feedbackData.rating ? `Rating: ${'⭐'.repeat(feedbackData.rating)} (${feedbackData.rating}/5)` : ''}

User: ${feedbackData.userEmail}
Page: ${feedbackData.page || 'Not specified'}
Browser: ${feedbackData.browserInfo || 'Not specified'}

Message:
${feedbackData.message}

${feedbackData.context ? `
Additional Context:
${JSON.stringify(JSON.parse(feedbackData.context), null, 2)}
` : ''}

${screenshots.length > 0 ? `
Screenshots uploaded: ${screenshots.length}
File paths: ${screenshots.join(', ')}
` : ''}

Timestamp: ${new Date().toISOString()}
---
  `.trim()

  // Log to console for now (you can see this in your server logs)
  console.log('\n' + '='.repeat(50))
  console.log('📧 FEEDBACK EMAIL CONTENT:')
  console.log(emailContent)
  console.log('='.repeat(50) + '\n')

  // Here you could integrate with email services like:
  // - Resend
  // - SendGrid
  // - Nodemailer with Gmail
  // - Or even a simple webhook to Zapier/Make.com
  
  // For now, we'll also write to a simple log file
  try {
    const fs = require('fs')
    const path = require('path')
    const logDir = path.join(process.cwd(), 'logs')
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const logFile = path.join(logDir, 'feedback.log')
    const logEntry = `\n${new Date().toISOString()} - ${feedbackData.type.toUpperCase()}\n${emailContent}\n${'='.repeat(80)}\n`
    
    fs.appendFileSync(logFile, logEntry)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for both NextAuth session and email-based session
    const session = await getServerSession()
    const userEmail = request.headers.get('x-user-email') || session?.user?.email
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse form data for file uploads
    const formData = await request.formData()
    
    // Extract form fields
    const type = formData.get('type') as string
    const message = formData.get('message') as string
    const page = formData.get('page') as string || undefined
    const priority = formData.get('priority') as string || 'medium'
    const browserInfo = formData.get('browserInfo') as string || undefined
    const context = formData.get('context') as string || undefined
    const ratingStr = formData.get('rating') as string
    const rating = ratingStr ? parseInt(ratingStr) : undefined

    // Validate the data
    const validatedData = feedbackSchema.parse({
      type,
      rating,
      message,
      page,
      priority,
      browserInfo,
      context
    })

    // Handle screenshot uploads (save to public folder for easy access)
    const screenshots: string[] = []
    const fs = require('fs')
    const path = require('path')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'feedback')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Process screenshot uploads
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`screenshot_${i}`) as File
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Generate unique filename
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${i}_${safeName}`
        const filepath = path.join(uploadDir, filename)
        
        fs.writeFileSync(filepath, buffer)
        screenshots.push(`/uploads/feedback/${filename}`)
      }
    }

    // Prepare feedback data for email
    const feedbackData = {
      ...validatedData,
      userEmail,
      timestamp: new Date().toISOString()
    }

    // Send email notification
    await sendFeedbackEmail(feedbackData, screenshots)

    // Store minimal info in database for analytics (optional)
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })

      if (user) {
        await prisma.feedback.create({
          data: {
            userId: user.id,
            type: validatedData.type,
            rating: validatedData.rating,
            message: validatedData.message.substring(0, 200) + '...', // Truncated version
            page: validatedData.page,
            userAgent: request.headers.get('user-agent'),
          }
        })
      }
    } catch (dbError) {
      console.log('Database logging failed (not critical):', dbError)
    }

    return NextResponse.json({ 
      success: true, 
      message: screenshots.length > 0 
        ? `Feedback submitted with ${screenshots.length} screenshot(s)!` 
        : 'Feedback submitted successfully!',
      screenshotsUploaded: screenshots.length
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = request.headers.get('x-user-email') || session?.user?.email
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin (you can change this logic)
    if (userEmail !== 'your-email@example.com') { // Replace with your email
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Read feedback log file
    try {
      const fs = require('fs')
      const path = require('path')
      const logFile = path.join(process.cwd(), 'logs', 'feedback.log')
      
      if (fs.existsSync(logFile)) {
        const logContent = fs.readFileSync(logFile, 'utf8')
        return NextResponse.json({ 
          feedbackLog: logContent,
          message: 'Feedback log retrieved successfully'
        })
      } else {
        return NextResponse.json({ 
          feedbackLog: 'No feedback received yet.',
          message: 'Log file not found'
        })
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to read feedback log' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Feedback retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 