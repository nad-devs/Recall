import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend (will work with or without API key for demo)
const resend = new Resend(process.env.RESEND_API_KEY)

// Fallback email function for when Resend isn't configured
async function sendFallbackEmail(feedbackData: any, screenshots: string[]) {
  const emailContent = `
🔔 NEW FEEDBACK RECEIVED - Recall App

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
Screenshot URLs: ${screenshots.map(s => `https://recall-henna.vercel.app${s}`).join(', ')}
` : ''}

Timestamp: ${new Date().toISOString()}
IP: ${feedbackData.ip || 'Unknown'}

---
Sent from Recall Feedback System
  `.trim()

  // Log to console (visible in Vercel dashboard)
  console.log('\n' + '='.repeat(60))
  console.log('📧 FEEDBACK EMAIL TO: arjunnadar2003@gmail.com')
  console.log('='.repeat(60))
  console.log(emailContent)
  console.log('='.repeat(60) + '\n')

  return emailContent
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
    
    try {
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
    } catch (error) {
      console.error('⚠️ Screenshot upload failed (not critical):', error)
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

    // Try to send email via Resend
    let emailSent = false
    let emailContent = ''

    try {
      if (process.env.RESEND_API_KEY) {
        console.log('📧 Attempting to send email via Resend...')
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              🔔 New Feedback - Recall App
            </h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <strong>Type:</strong> ${feedbackData.type.toUpperCase()}<br>
              ${feedbackData.priority ? `<strong>Priority:</strong> ${feedbackData.priority.toUpperCase()}<br>` : ''}
              ${feedbackData.rating ? `<strong>Rating:</strong> ${'⭐'.repeat(feedbackData.rating)} (${feedbackData.rating}/5)<br>` : ''}
              <strong>Page:</strong> ${feedbackData.page || 'Not specified'}<br>
              <strong>Browser:</strong> ${feedbackData.browserInfo || 'Not specified'}
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #555;">Message:</h3>
              <p style="white-space: pre-wrap; background: #f1f5f9; padding: 10px; border-radius: 4px;">${feedbackData.message}</p>
            </div>

            ${screenshots.length > 0 ? `
              <div style="margin: 15px 0;">
                <h3 style="color: #555;">Screenshots (${screenshots.length}):</h3>
                ${screenshots.map(s => `<a href="https://recall-henna.vercel.app${s}" style="display: block; color: #2563eb; margin: 5px 0;">View: ${s}</a>`).join('')}
              </div>
            ` : ''}

            <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin-top: 20px; font-size: 12px; color: #666;">
              <strong>Timestamp:</strong> ${new Date(feedbackData.timestamp).toLocaleString()}<br>
              <strong>IP:</strong> ${feedbackData.ip}
            </div>
          </div>
        `

        await resend.emails.send({
          from: 'Recall Feedback <onboarding@resend.dev>',
          to: ['arjunnadar2003@gmail.com'],
          subject: `[Recall] ${feedbackData.type.toUpperCase()} Feedback${feedbackData.priority === 'high' ? ' - HIGH PRIORITY' : ''}`,
          html: emailHtml,
        })

        console.log('✅ Email sent successfully via Resend')
        emailSent = true
      } else {
        console.log('⚠️ Resend API key not configured, using fallback')
      }
    } catch (error) {
      console.error('❌ Resend email failed:', error)
    }

    // Always use fallback for console logging
    emailContent = await sendFallbackEmail(feedbackData, screenshots)

    const responseMessage = emailSent 
      ? `Feedback sent to your email${screenshots.length > 0 ? ` with ${screenshots.length} screenshot(s)` : ''}!`
      : `Feedback received${screenshots.length > 0 ? ` with ${screenshots.length} screenshot(s)` : ''}! Check Vercel logs for details.`

    console.log('✅ Feedback processed successfully')

    return NextResponse.json({ 
      success: true, 
      message: responseMessage,
      emailSent,
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
  return NextResponse.json({ 
    success: true,
    message: 'Feedback is now sent via email. Check your email (arjunnadar2003@gmail.com) and Vercel console logs.',
    emailTarget: 'arjunnadar2003@gmail.com',
    info: 'To view feedback, check your email or Vercel function logs.'
  })
} 