"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getCurrentUser } from '@/lib/auth-utils'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔧 AuthGuard - Checking authentication...')
      
      const authenticated = isAuthenticated()
      const user = getCurrentUser()
      
      console.log('🔧 AuthGuard - Authentication status:', { 
        authenticated, 
        user: user ? 'present' : 'missing' 
      })
      
      if (!authenticated || !user) {
        console.log('🔧 AuthGuard - User not authenticated, redirecting to landing page')
        router.push('/')
        return
      }
      
      setIsAuth(true)
      setIsChecking(false)
    }

    // Check authentication on mount
    checkAuth()
    
    // Also check when localStorage changes (e.g., user signs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail' || e.key === 'userId') {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router])

  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuth) {
    return null // Will redirect, so don't render anything
  }

  return <>{children}</>
} 