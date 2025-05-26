// Usage tracking for anonymous users using localStorage
export interface UsageData {
  conversationCount: number
  hasCustomApiKey: boolean
  customApiKey?: string
  lastReset: string
}

const STORAGE_KEY = 'recall_usage_data'
const MAX_FREE_CONVERSATIONS = 25

export function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return {
      conversationCount: 0,
      hasCustomApiKey: false,
      lastReset: new Date().toISOString()
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const newData: UsageData = {
        conversationCount: 0,
        hasCustomApiKey: false,
        lastReset: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return newData
    }

    const data = JSON.parse(stored) as UsageData
    
    // Reset monthly (optional - you can remove this if you want lifetime limits)
    const lastReset = new Date(data.lastReset)
    const now = new Date()
    const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                            (now.getMonth() - lastReset.getMonth())
    
    if (monthsSinceReset >= 1) {
      const resetData: UsageData = {
        conversationCount: 0,
        hasCustomApiKey: data.hasCustomApiKey,
        customApiKey: data.customApiKey,
        lastReset: now.toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData))
      return resetData
    }

    return data
  } catch (error) {
    console.error('Error reading usage data:', error)
    return {
      conversationCount: 0,
      hasCustomApiKey: false,
      lastReset: new Date().toISOString()
    }
  }
}

export function incrementConversationCount(): UsageData {
  const data = getUsageData()
  data.conversationCount += 1
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  
  return data
}

export function setCustomApiKey(apiKey: string): UsageData {
  const data = getUsageData()
  data.hasCustomApiKey = true
  data.customApiKey = apiKey
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  
  return data
}

export function removeCustomApiKey(): UsageData {
  const data = getUsageData()
  data.hasCustomApiKey = false
  delete data.customApiKey
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  
  return data
}

export function canMakeConversation(): boolean {
  const data = getUsageData()
  return data.hasCustomApiKey || data.conversationCount < MAX_FREE_CONVERSATIONS
}

export function getRemainingConversations(): number {
  const data = getUsageData()
  if (data.hasCustomApiKey) return Infinity
  return Math.max(0, MAX_FREE_CONVERSATIONS - data.conversationCount)
}

export function needsApiKey(): boolean {
  const data = getUsageData()
  return !data.hasCustomApiKey && data.conversationCount >= MAX_FREE_CONVERSATIONS
} 