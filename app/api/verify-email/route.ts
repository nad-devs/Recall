import { NextRequest, NextResponse } from 'next/server'
import { PingEmail } from 'ping-email'

// Initialize ping-email with more lenient configuration
const pingEmail = new PingEmail({
  port: 25,
  fqdn: "mail.analyzer.com", // You can change this to your domain
  sender: "verify@analyzer.com", // You can change this to your email
  timeout: 15000, // Increased timeout to 15 seconds for slower mail servers
  attempts: 3, // Increased attempts to 3 for better reliability
  ignoreSMTPVerify: false, // Set to true if you want to skip SMTP verification
  debug: false
})

// Fallback ping-email instance with even more lenient settings
const fallbackPingEmail = new PingEmail({
  port: 25,
  fqdn: "mail.analyzer.com",
  sender: "verify@analyzer.com",
  timeout: 25000, // Very generous timeout for fallback
  attempts: 1, // Single attempt for fallback
  ignoreSMTPVerify: true, // Skip SMTP verification for fallback
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

    // List of known reliable domains that we can trust without deep verification
    const trustedDomains = [
      'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
      'aol.com', 'protonmail.com', 'proton.me', 'tutanota.com',
      'zoho.com', 'yandex.com', 'mail.ru'
    ]

    // For trusted domains, do a quick validation and accept
    if (trustedDomains.includes(domain)) {
      return NextResponse.json({
        valid: true,
        reason: 'Email verified successfully - trusted domain'
      })
    }

    // Use ping-email for comprehensive verification
    try {
      console.log(`Attempting email verification for: ${trimmedEmail}`)
      const result = await pingEmail.ping(trimmedEmail)
      
      if (result.valid) {
        return NextResponse.json({
          valid: true,
          reason: 'Email verified successfully - domain exists and can receive emails'
        })
      } else {
        // Check if it's a timeout issue and try fallback
        if (result.message.includes('timeout') || result.message.includes('TIMEOUT')) {
          console.log(`Primary verification timed out for ${trimmedEmail}, trying fallback...`)
          
          try {
            const fallbackResult = await fallbackPingEmail.ping(trimmedEmail)
            if (fallbackResult.valid) {
              return NextResponse.json({
                valid: true,
                reason: 'Email verified successfully (fallback verification)'
              })
            }
          } catch (fallbackError) {
            console.log(`Fallback verification also failed for ${trimmedEmail}:`, fallbackError)
          }
          
          // If both verifications timeout, but the domain looks legitimate, accept it
          if (domain.includes('.') && !domain.includes('..') && domain.length > 3) {
            return NextResponse.json({
              valid: true,
              reason: 'Email format is valid (verification timed out but domain appears legitimate)'
            })
          }
        }
        
        // Map ping-email messages to user-friendly messages
        let reason: string = result.message
        
        if (result.message.includes('No MX records')) {
          reason = 'Domain cannot receive emails'
        } else if (result.message.includes('Invalid email syntax')) {
          reason = 'Invalid email format'
        } else if (result.message.includes('SMTP connection error')) {
          reason = 'Unable to verify email delivery - but format appears valid'
          // For SMTP connection errors, we'll be lenient and accept the email
          return NextResponse.json({
            valid: true,
            reason: reason
          })
        } else if (result.message.includes('Disposable email')) {
          reason = 'Disposable email addresses are not allowed'
        } else if (result.message.includes('timeout')) {
          reason = 'Email verification timed out - but format appears valid'
          // For timeouts, we'll be lenient and accept the email
          return NextResponse.json({
            valid: true,
            reason: reason
          })
        }
        
        return NextResponse.json({
          valid: false,
          reason: reason
        })
      }
    } catch (pingError) {
      console.error('Ping-email verification error:', pingError)
      
      // Enhanced fallback logic - be more lenient for legitimate-looking emails
      const errorMessage = (pingError as Error).message || String(pingError)
      
      if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        // For timeout errors, accept emails from domains that look legitimate
        if (domain.includes('.') && !domain.includes('..') && domain.length > 3) {
          return NextResponse.json({
            valid: true,
            reason: 'Email format is valid (verification timed out but domain appears legitimate)'
          })
        }
      }
      
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