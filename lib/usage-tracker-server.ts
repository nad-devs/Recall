import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface ServerUsageData {
  conversationCount: number
  hasCustomApiKey: boolean
  canMakeConversation: boolean
  remainingConversations: number
}

const MAX_FREE_CONVERSATIONS = 25

// Create a fingerprint from IP + User Agent for anonymous tracking
function createUserFingerprint(ip: string, userAgent: string): string {
  const combined = `${ip}:${userAgent}`
  return crypto.createHash('sha256').update(combined).digest('hex')
}

// Get IP address from request headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfIP) {
    return cfIP
  }
  
  return 'unknown'
}

// Get or create anonymous user tracking
export async function getServerUsageData(
  ip: string, 
  userAgent: string,
  customApiKey?: string
): Promise<ServerUsageData> {
  const fingerprint = createUserFingerprint(ip, userAgent)
  
  try {
    // Try to find existing analytics record for this fingerprint
    const existingUsage = await prisma.analytics.findFirst({
      where: {
        event: 'usage_tracking',
        sessionId: fingerprint
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    let conversationCount = 0
    let hasCustomApiKey = false

    if (existingUsage) {
      try {
        const properties = JSON.parse(existingUsage.properties)
        conversationCount = properties.conversationCount || 0
        hasCustomApiKey = properties.hasCustomApiKey || false
        
        // Check if we should reset monthly (optional)
        const lastUpdate = new Date(existingUsage.timestamp)
        const now = new Date()
        const monthsSinceUpdate = (now.getFullYear() - lastUpdate.getFullYear()) * 12 + 
                                 (now.getMonth() - lastUpdate.getMonth())
        
        if (monthsSinceUpdate >= 1) {
          conversationCount = 0
        }
      } catch (error) {
        console.error('Error parsing usage data:', error)
      }
    }

    // Update API key status if provided
    if (customApiKey) {
      hasCustomApiKey = true
    }

    const canMakeConversation = hasCustomApiKey || conversationCount < MAX_FREE_CONVERSATIONS
    const remainingConversations = hasCustomApiKey ? Infinity : Math.max(0, MAX_FREE_CONVERSATIONS - conversationCount)

    return {
      conversationCount,
      hasCustomApiKey,
      canMakeConversation,
      remainingConversations
    }
  } catch (error) {
    console.error('Error getting server usage data:', error)
    return {
      conversationCount: 0,
      hasCustomApiKey: false,
      canMakeConversation: true,
      remainingConversations: MAX_FREE_CONVERSATIONS
    }
  }
}

// Increment conversation count on server
export async function incrementServerConversationCount(
  ip: string,
  userAgent: string,
  customApiKey?: string
): Promise<ServerUsageData> {
  const fingerprint = createUserFingerprint(ip, userAgent)
  
  try {
    const currentUsage = await getServerUsageData(ip, userAgent, customApiKey)
    
    // Only increment if they don't have a custom API key
    const newCount = customApiKey ? currentUsage.conversationCount : currentUsage.conversationCount + 1
    
    // Store updated usage data
    await prisma.analytics.create({
      data: {
        event: 'usage_tracking',
        sessionId: fingerprint,
        properties: JSON.stringify({
          conversationCount: newCount,
          hasCustomApiKey: !!customApiKey,
          ip: ip.substring(0, 8) + '***', // Partial IP for privacy
          timestamp: new Date().toISOString()
        }),
        userAgent: userAgent.substring(0, 100), // Truncate for storage
        ipAddress: ip.substring(0, 8) + '***' // Partial IP for privacy
      }
    })

    return {
      conversationCount: newCount,
      hasCustomApiKey: !!customApiKey,
      canMakeConversation: !!customApiKey || newCount < MAX_FREE_CONVERSATIONS,
      remainingConversations: customApiKey ? Infinity : Math.max(0, MAX_FREE_CONVERSATIONS - newCount)
    }
  } catch (error) {
    console.error('Error incrementing server conversation count:', error)
    throw error
  }
}

// Check if user can make a conversation (server-side)
export async function canMakeServerConversation(
  ip: string,
  userAgent: string,
  customApiKey?: string
): Promise<boolean> {
  const usage = await getServerUsageData(ip, userAgent, customApiKey)
  return usage.canMakeConversation
} 