export interface DemoData {
  conversations: any[]
  concepts: any[]
  user: {
    name: string
    id: string
    createdAt: string
  }
}

export function getDemoData(): DemoData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const conversations = JSON.parse(localStorage.getItem('demoConversations') || '[]')
    const concepts = JSON.parse(localStorage.getItem('demoConcepts') || '[]')
    const user = JSON.parse(localStorage.getItem('demoUser') || 'null')
    
    if (!user) return null
    
    return {
      conversations,
      concepts,
      user
    }
  } catch (error) {
    console.error('Error reading demo data:', error)
    return null
  }
}

export function clearDemoData(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('demoMode')
  localStorage.removeItem('demoUser')
  localStorage.removeItem('demoConversations')
  localStorage.removeItem('demoConcepts')
  localStorage.removeItem('pendingMigration')
}

export async function migrateDemoData(userId: string): Promise<boolean> {
  const demoData = getDemoData()
  if (!demoData || demoData.conversations.length === 0 && demoData.concepts.length === 0) {
    return true // Nothing to migrate
  }
  
  try {
    // Migrate conversations
    for (const conversation of demoData.conversations) {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...conversation,
          userId, // Associate with the new user
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to migrate conversation: ${response.statusText}`)
      }
    }
    
    // Migrate concepts
    for (const concept of demoData.concepts) {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...concept,
          userId, // Associate with the new user
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to migrate concept: ${response.statusText}`)
      }
    }
    
    // Clear demo data after successful migration
    clearDemoData()
    
    return true
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
}

export function hasPendingMigration(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('pendingMigration') === 'true'
} 