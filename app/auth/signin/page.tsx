"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, AlertCircle, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 SignIn component mounted, fetching providers...')
    const fetchProviders = async () => {
      try {
        console.log('📡 Calling getProviders()...')
        const res = await getProviders()
        console.log('✅ Providers fetched successfully:', res)
        
        if (!res || !res.google) {
          console.warn('⚠️ Google provider not available')
          setError('Google authentication is not configured. Please contact support.')
          return
        }

        console.log('✅ Google provider is available:', res.google)
        setProviders(res)
      } catch (error) {
        console.error('❌ Error fetching providers:', error)
        setError('Failed to load authentication. Please contact support.')
      }
    }
    fetchProviders()
  }, [])

  const handleGoogleSignIn = async () => {
    console.log('🚀 Starting Google sign-in process...')
    setIsLoading(true)
    setError(null)
    
    try {
      if (!providers?.google) {
        throw new Error('Google provider not available')
      }
      
      console.log('🔧 Google provider is available, proceeding with sign-in...')
      
      await signIn("google", { 
        callbackUrl: "/dashboard"
      })
      
    } catch (error) {
      console.error('❌ Sign-in error:', error)
      setError('Failed to sign in with Google. Please try again.')
      setIsLoading(false)
    }
  }

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
            <p className="text-gray-600">Sign in to access your learning dashboard</p>
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

        {/* Sign In Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="space-y-4">
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <Shield className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Secure authentication powered by Google
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Loading state while fetching providers */}
            {!providers && !error && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading sign-in options...</p>
              </div>
            )}

            {/* Google Provider */}
            {providers?.google && (
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-medium disabled:opacity-50"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in with Google'
                )}
              </Button>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                No passwords, no hassle. Just secure, one-click access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          New to Recall? <a href="/" className="text-blue-600 hover:text-blue-800 underline">Get started here</a>
        </div>
      </div>
    </div>
  )
} 