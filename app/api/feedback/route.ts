import { NextRequest, NextResponse } from 'next/server'

// Simple logging function
async function logFeedback(feedbackData: any, screenshots: string[]) {
  const logContent = `
🔔 NEW FEEDBACK RECEIVED

Type: ${feedbackData.type.toUpperCase()}
${feedbackData.priority ? `Priority: ${feedbackData.priority.toUpperCase()}` : ''}
${feedbackData.rating ? `Rating: ${'⭐'.repeat(feedbackData.rating)} (${feedbackData.rating}/5)` : ''}

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
IP: ${feedbackData.ip || 'Unknown'}
---
  `.trim()

  // Log to console for immediate visibility
  console.log('\n' + '='.repeat(50))
  console.log('📧 NEW FEEDBACK RECEIVED:')
  console.log(logContent)
  console.log('='.repeat(50) + '\n')

  // Write to log file
  try {
    const fs = require('fs')
    const path = require('path')
    const logDir = path.join(process.cwd(), 'logs')
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const logFile = path.join(logDir, 'feedback.log')
    const logEntry = `\n${new Date().toISOString()} - ${feedbackData.type.toUpperCase()}\n${logContent}\n${'='.repeat(80)}\n`
    
    fs.appendFileSync(logFile, logEntry)
    console.log('✅ Feedback logged to file:', logFile)
  } catch (error) {
    console.error('❌ Failed to write to log file:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Feedback submission received')

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

    // Basic validation
    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      )
    }

    console.log('📝 Feedback data:', { type, message: message.substring(0, 50) + '...', priority })

    // Handle screenshot uploads (save to public folder for easy access)
    const screenshots: string[] = []
    const fs = require('fs')
    const path = require('path')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'feedback')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log('📁 Created upload directory:', uploadDir)
    }

    // Process screenshot uploads
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`screenshot_${i}`) as File
      if (file && file.size > 0) {
        try {
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          // Generate unique filename
          const timestamp = Date.now()
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const filename = `${timestamp}_${i}_${safeName}`
          const filepath = path.join(uploadDir, filename)
          
          fs.writeFileSync(filepath, buffer)
          screenshots.push(`/uploads/feedback/${filename}`)
          console.log('📷 Screenshot saved:', filename)
        } catch (error) {
          console.error('❌ Failed to save screenshot:', error)
        }
      }
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Prepare feedback data
    const feedbackData = {
      type,
      rating,
      message,
      page,
      priority,
      browserInfo,
      context,
      timestamp: new Date().toISOString(),
      ip
    }

    // Log the feedback
    await logFeedback(feedbackData, screenshots)

    const responseMessage = screenshots.length > 0 
      ? `Feedback submitted with ${screenshots.length} screenshot(s)!` 
      : 'Feedback submitted successfully!'

    console.log('✅ Feedback processed successfully')

    return NextResponse.json({ 
      success: true, 
      message: responseMessage,
      screenshotsUploaded: screenshots.length
    })

  } catch (error) {
    console.error('❌ Feedback submission error:', error)
    
    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Feedback retrieval requested')

    // Read feedback log file
    const fs = require('fs')
    const path = require('path')
    const logFile = path.join(process.cwd(), 'logs', 'feedback.log')
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8')
      
      // Parse the log content to create a structured response
      const entries = logContent.split('================================================================================')
        .filter((entry: string) => entry.trim())
        .map((entry: string) => entry.trim())

      console.log(`📈 Retrieved ${entries.length} feedback entries`)

      return NextResponse.json({ 
        success: true,
        feedbackLog: logContent,
        entries: entries.length,
        message: `Retrieved ${entries.length} feedback entries`
      })
    } else {
      console.log('📝 No feedback log file found')
      return NextResponse.json({ 
        success: true,
        feedbackLog: 'No feedback received yet.',
        entries: 0,
        message: 'No feedback received yet'
      })
    }

  } catch (error) {
    console.error('❌ Feedback retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    )
  }
} 