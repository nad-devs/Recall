"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Shield, Zap, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function LandingPage() {
  const [name, setName] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    if (!name.trim() || name.trim().length < 2) {
      alert('Please enter your name first')
      return
    }

    setIsSigningIn(true)
    
    // Store the name temporarily to use after OAuth
    localStorage.setItem('pendingUserName', name.trim())
    
    try {
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true 
      })
    } catch (error) {
      console.error("Sign-in error:", error)
      setIsSigningIn(false)
      localStorage.removeItem('pendingUserName')
    }
  }

  const isValidName = (name: string) => {
    return name.trim().length >= 2
  }

  const canStart = isValidName(name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-30"></div>
              <div className="relative bg-white rounded-full p-2 shadow-lg">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">Recall</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20 scale-150"></div>
              <div className="relative bg-white rounded-full p-8 shadow-2xl mx-auto w-fit">
                <Brain className="w-16 h-16 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Transform Learning
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}with AI
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Intelligent conversation analysis, personalized insights, and seamless knowledge extraction 
                to accelerate your learning journey.
              </p>
            </div>

            {/* Enhanced Sign Up Card */}
            <div className="max-w-md mx-auto">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="space-y-4">
                  <CardTitle className="text-2xl text-center">Get Started</CardTitle>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 text-center">
                      <strong>Secure & Private:</strong> Google sign-in ensures only you can access your data - no one else can impersonate you.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="What name would you like to be called?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 text-lg text-gray-900 placeholder:text-gray-500"
                      onKeyPress={(e) => e.key === "Enter" && canStart && handleGoogleSignIn()}
                    />
                    {name.trim() && !isValidName(name) && (
                      <p className="text-sm text-red-600">Please enter a name (at least 2 characters)</p>
                    )}
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={!canStart || isSigningIn}
                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isSigningIn ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Continue with Google'
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      We use Google to verify your identity and get your name automatically
                    </p>
                    <div className="flex items-center justify-center space-x-1">
                      <Shield className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-green-600 font-medium">
                        Secure • No passwords • No one else can access your account
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <a 
                          href="/auth/signin" 
                          className="text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Sign in here
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-4 w-fit mx-auto">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced AI extracts key insights, concepts, and actionable knowledge from your conversations and content.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-full p-4 w-fit mx-auto">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600">
                Process and analyze content in seconds. Get instant insights and recommendations tailored to your learning style.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full p-4 w-fit mx-auto">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is encrypted and secure. Google OAuth ensures safe authentication without storing passwords.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Ready to accelerate your learning?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of learners who are transforming how they process and retain information.
            </p>
            <Button
              onClick={() => {
                if (canStart) {
                  handleGoogleSignIn()
                } else {
                  // Scroll to the sign-up card
                  document.querySelector('input')?.focus()
                }
              }}
              disabled={isSigningIn}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Recall. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </footer>
    </div>
  )
}

