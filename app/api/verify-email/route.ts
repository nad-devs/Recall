import { NextRequest, NextResponse } from 'next/server'
import { PingEmail } from 'ping-email'

// Initialize ping-email with configuration
const pingEmail = new PingEmail({
  port: 25,
  fqdn: "mail.analyzer.com", // You can change this to your domain
  sender: "verify@analyzer.com", // You can change this to your email
  timeout: 8000, // Reduced timeout for faster response
  attempts: 2,
  ignoreSMTPVerify: false, // Set to true if you want to skip SMTP verification
  debug: false
})



export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json({
        valid: false,
        reason: 'Invalid email format'
      })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const domain = trimmedEmail.split('@')[1]

    // Check for common typos in popular domains first (fast check)
    const commonDomains = {
      'gmail.com': ['gmai.com', 'gmial.com', 'gmail.co', 'gmaill.com'],
      'yahoo.com': ['yaho.com', 'yahoo.co', 'yahooo.com'],
      'hotmail.com': ['hotmai.com', 'hotmail.co', 'hotmial.com'],
      'outlook.com': ['outlook.co', 'outlok.com']
    }

    for (const [correctDomain, typos] of Object.entries(commonDomains)) {
      if (typos.includes(domain)) {
        return NextResponse.json({
          valid: false,
          reason: `Did you mean ${correctDomain}?`,
          suggestion: trimmedEmail.replace(domain, correctDomain)
        })
      }
    }

    // Check for common disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'temp-mail.org',
      'yopmail.com',
      'maildrop.cc',
      'sharklasers.com'
    ]

    if (disposableDomains.includes(domain)) {
      return NextResponse.json({
        valid: false,
        reason: 'Disposable email addresses are not allowed'
      })
    }

    // Use ping-email for comprehensive verification
    try {
      const result = await pingEmail.ping(trimmedEmail)
      
      if (result.valid) {
        return NextResponse.json({
          valid: true,
          reason: 'Email verified successfully - domain exists and can receive emails'
        })
      } else {
        // Map ping-email messages to user-friendly messages
        let reason: string = result.message
        
        if (result.message.includes('No MX records')) {
          reason = 'Domain cannot receive emails'
        } else if (result.message.includes('Invalid email syntax')) {
          reason = 'Invalid email format'
        } else if (result.message.includes('SMTP connection error')) {
          reason = 'Unable to verify email delivery'
        } else if (result.message.includes('Disposable email')) {
          reason = 'Disposable email addresses are not allowed'
        } else if (result.message.includes('timeout')) {
          reason = 'Email verification timed out - please try again'
        }
        
        return NextResponse.json({
          valid: false,
          reason: reason
        })
      }
    } catch (pingError) {
      console.error('Ping-email verification error:', pingError)
      
      // Fallback to basic validation if ping-email fails
      return NextResponse.json({
        valid: true,
        reason: 'Email format is valid (full verification unavailable)'
      })
    }

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({
      valid: false,
      reason: 'Unable to verify email at this time'
    }, { status: 500 })
  }
} 