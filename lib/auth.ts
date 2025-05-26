import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      usageCount: true,
      createdAt: true,
      lastActiveAt: true,
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function requirePlan(requiredPlan: 'pro' | 'enterprise') {
  const user = await requireAuth()
  
  const planHierarchy = {
    'free': 0,
    'pro': 1,
    'enterprise': 2
  }
  
  const userPlanLevel = planHierarchy[user.plan as keyof typeof planHierarchy] || 0
  const requiredPlanLevel = planHierarchy[requiredPlan]
  
  if (userPlanLevel < requiredPlanLevel) {
    redirect('/upgrade')
  }
  
  return user
}

export async function checkUsageLimit(userId: string, action: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, usageCount: true }
  })
  
  if (!user) return false
  
  const limits = {
    free: {
      conversation_analysis: 50,
      concept_creation: 100,
      monthly_limit: 50
    },
    pro: {
      conversation_analysis: 500,
      concept_creation: 1000,
      monthly_limit: 500
    },
    enterprise: {
      conversation_analysis: Infinity,
      concept_creation: Infinity,
      monthly_limit: Infinity
    }
  }
  
  const userLimits = limits[user.plan as keyof typeof limits] || limits.free
  const actionLimit = userLimits[action as keyof typeof userLimits] || userLimits.monthly_limit
  
  return user.usageCount < actionLimit
}

export async function incrementUsage(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      usageCount: {
        increment: 1
      },
      lastActiveAt: new Date()
    }
  })
}

export async function trackAnalytics(
  userId: string | null,
  event: string,
  properties: Record<string, any> = {}
) {
  await prisma.analytics.create({
    data: {
      userId,
      event,
      properties: JSON.stringify(properties),
      timestamp: new Date()
    }
  })
} 