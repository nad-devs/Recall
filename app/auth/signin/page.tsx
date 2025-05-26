"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Github, Zap, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 SignIn component mounted, fetching providers...')
    const fetchProviders = async () => {
      try {
        console.log('📡 Calling getProviders()...')
        const res = await getProviders()
        console.log('✅ Providers fetched successfully:', res)
        
        if (!res) {
          console.warn('⚠️ No providers returned from getProviders()')
          setError('No authentication providers available')
          return
        }

        // Check specific providers
        if (res.google) {
          console.log('✅ Google provider is available:', res.google)
        } else {
          console.warn('❌ Google provider is NOT available')
          console.log('🔍 Available providers:', Object.keys(res))
        }

        if (res.github) {
          console.log('✅ GitHub provider is available:', res.github)
        } else {
          console.log('ℹ️ GitHub provider is not configured (this is optional)')
        }

        setProviders(res)
      } catch (error) {
        console.error('❌ Error fetching providers:', error)
        setError('Failed to load authentication providers')
      }
    }
    fetchProviders()
  }, [])

  const handleProviderSignIn = async (providerId: string) => {
    console.log(`🚀 Starting ${providerId} sign-in process...`)
    setIsLoading(true)
    setLoadingProvider(providerId)
    setError(null)
    
    try {
      console.log(`📡 Calling signIn("${providerId}", { callbackUrl: "/dashboard" })...`)
      
      const result = await signIn(providerId, { 
        callbackUrl: "/dashboard",
        redirect: false // Don't redirect automatically so we can handle the response
      })
      
      console.log(`📋 Sign-in result for ${providerId}:`, result)
      
      if (result?.error) {
        console.error(`❌ Sign-in error for ${providerId}:`, result.error)
        setError(`Sign-in failed: ${result.error}`)
      } else if (result?.ok) {
        console.log(`✅ Sign-in successful for ${providerId}, redirecting to dashboard...`)
        router.push('/dashboard')
      } else if (result?.url) {
        console.log(`🔄 Redirecting to: ${result.url}`)
        window.location.href = result.url
      } else {
        console.warn(`⚠️ Unexpected sign-in result for ${providerId}:`, result)
      }
    } catch (error) {
      console.error(`❌ Exception during ${providerId} sign-in:`, error)
      setError(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setLoadingProvider(null)
    }
  }

  const handleTryDemo = () => {
    console.log('🎮 Starting demo mode...')
    try {
      // Set demo mode flag
      const demoUser = {
        name: 'Demo User',
        id: 'demo-' + Date.now(),
        createdAt: new Date().toISOString()
      }
      
      localStorage.setItem('demoMode', 'true')
      localStorage.setItem('demoUser', JSON.stringify(demoUser))
      
      console.log('✅ Demo mode data stored:', demoUser)
      console.log('🔄 Redirecting to dashboard...')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ Error setting up demo mode:', error)
      setError('Failed to start demo mode')
    }
  }

  // Check if Google provider is available
  const isGoogleAvailable = providers?.google
  const isGitHubAvailable = providers?.github

  console.log('🔍 Current state:', {
    providers,
    isGoogleAvailable,
    isGitHubAvailable,
    isLoading,
    loadingProvider,
    error
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20"></div>
            <div className="relative bg-white rounded-full p-4 shadow-lg mx-auto w-fit">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Recall</h1>
            <p className="text-gray-600">Choose how you'd like to get started</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Try Demo Card */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Try Demo</h3>
                <p className="text-sm text-gray-600">Instant access, no signup required</p>
              </div>
            </div>
            <Button
              onClick={handleTryDemo}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
            >
              <Zap className="w-5 h-5 mr-2" />
              {loadingProvider === 'demo' ? 'Starting Demo...' : 'Start Demo Now'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              ✨ Full features • 💾 Temporary data • 🚀 Upgrade anytime
            </p>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
              Or create a permanent account
            </span>
          </div>
        </div>

        {/* Sign In Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Save Your Data Forever</CardTitle>
            <p className="text-center text-sm text-gray-600">
              Sync across devices and never lose your progress
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading state while fetching providers */}
            {!providers && !error && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading sign-in options...</p>
              </div>
            )}

            {/* Google Provider */}
            {providers && (
              <>
                <Button
                  onClick={() => handleProviderSignIn("google")}
                  disabled={isLoading || !isGoogleAvailable}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loadingProvider === 'google' ? 'Signing in...' : 
                   !isGoogleAvailable ? 'Google Sign-in Unavailable' : 'Continue with Google'}
                </Button>

                {/* Debug info for Google */}
                {!isGoogleAvailable && (
                  <p className="text-xs text-red-500 text-center">
                    Google provider not configured. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
                  </p>
                )}

                {/* GitHub Provider (if available) */}
                {isGitHubAvailable && (
                  <Button
                    onClick={() => handleProviderSignIn("github")}
                    disabled={isLoading}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    <Github className="w-5 h-5 mr-3" />
                    {loadingProvider === 'github' ? 'Signing in...' : 'Continue with GitHub'}
                  </Button>
                )}
              </>
            )}

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Demo mode stores data locally. Sign up to save permanently and sync across devices.
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 font-mono">
                Debug: Providers loaded = {providers ? 'Yes' : 'No'} | 
                Google = {isGoogleAvailable ? 'Available' : 'Not Available'} | 
                GitHub = {isGitHubAvailable ? 'Available' : 'Not Available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 