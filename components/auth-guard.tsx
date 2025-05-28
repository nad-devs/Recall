"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { isAuthenticated, getCurrentUser } from '@/lib/auth-utils'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔧 AuthGuard - Checking authentication...')
      console.log('🔧 AuthGuard - NextAuth session status:', status)
      console.log('🔧 AuthGuard - NextAuth session:', session ? 'present' : 'missing')
      
      // Check NextAuth session first (for OAuth users)
      if (status === 'loading') {
        console.log('🔧 AuthGuard - NextAuth session still loading...')
        return // Still loading, wait
      }
      
      if (status === 'authenticated' && session?.user?.email) {
        console.log('🔧 AuthGuard - User authenticated via NextAuth (OAuth)')
        
        // For OAuth users, we need to get the proper user ID from the database
        try {
          const response = await fetch('/api/auth/user-info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name || 'User'
            })
          })
          
          if (response.ok) {
            const userData = await response.json()
            
            // Store OAuth user data in localStorage with proper user ID
            localStorage.setItem('userEmail', session.user.email)
            localStorage.setItem('userName', session.user.name || 'User')
            localStorage.setItem('userInitials', 
              (session.user.name || 'User')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .slice(0, 2)
            )
            localStorage.setItem('userId', userData.userId) // Use proper database ID
            
            console.log('🔧 AuthGuard - Stored OAuth user data with proper ID:', userData.userId)
            
            // Small delay to ensure localStorage is fully updated
            setTimeout(() => {
              setIsAuth(true)
              setIsChecking(false)
            }, 100)
          } else {
            console.error('🔧 AuthGuard - Failed to get user info from database')
            // Fallback to using email as ID (old behavior)
            localStorage.setItem('userEmail', session.user.email)
            localStorage.setItem('userName', session.user.name || 'User')
            localStorage.setItem('userInitials', 
              (session.user.name || 'User')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .slice(0, 2)
            )
            localStorage.setItem('userId', session.user.email)
            
            setTimeout(() => {
              setIsAuth(true)
              setIsChecking(false)
            }, 100)
          }
        } catch (error) {
          console.error('🔧 AuthGuard - Error fetching user info:', error)
          // Fallback to using email as ID
          localStorage.setItem('userEmail', session.user.email)
          localStorage.setItem('userName', session.user.name || 'User')
          localStorage.setItem('userInitials', 
            (session.user.name || 'User')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2)
          )
          localStorage.setItem('userId', session.user.email)
          
          setTimeout(() => {
            setIsAuth(true)
            setIsChecking(false)
          }, 100)
        }
        
        return
      }
      
      // Check localStorage-based authentication (for email users)
      const authenticated = isAuthenticated()
      const user = getCurrentUser()
      
      console.log('🔧 AuthGuard - LocalStorage authentication status:', { 
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

    // Check authentication on mount and when session changes
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
  }, [router, session, status])

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