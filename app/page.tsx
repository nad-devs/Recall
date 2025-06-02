"use client"

import { useState, useEffect } from "react"
import { Brain, MessageSquare, BookOpen, ArrowRight, Sparkles, BarChart3, Upload, FileText, Zap, Target, Github, Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [signInEmail, setSignInEmail] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [emailVerification, setEmailVerification] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid'
    message: string
    suggestion?: string
  }>({ status: 'idle', message: '' })
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')
    const userId = localStorage.getItem('userId')
    
    if (userName && userEmail && userId) {
      // User is already logged in, redirect to dashboard
      router.push('/dashboard')
    }
  }, [router])

  const verifyEmail = async (emailToVerify: string) => {
    if (!isValidEmail(emailToVerify)) {
      setEmailVerification({
        status: 'invalid',
        message: 'Please enter a valid email format'
      })
      return false
    }

    setEmailVerification({ 
      status: 'checking', 
      message: 'Verifying email...' 
    })

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToVerify,
          fast: false 
        })
      })

      const result = await response.json()

      if (result.valid) {
        setEmailVerification({
          status: 'valid',
          message: '✓ Email verified successfully'
        })
        return true
      } else {
        setEmailVerification({
          status: 'invalid',
          message: result.reason,
          suggestion: result.suggestion
        })
        return false
      }
    } catch (error) {
      setEmailVerification({
        status: 'invalid',
        message: 'Unable to verify email. Please check your connection.'
      })
      return false
    }
  }

  const handleStart = async () => {
    if (!name.trim() || !email.trim()) return

    // First verify the email
    const isEmailValid = await verifyEmail(email)
    if (!isEmailValid) return

    // Check if this is a Gmail user and suggest OAuth
    const isGmailUser = email.toLowerCase().includes('@gmail.com') || email.toLowerCase().includes('@googlemail.com')
    if (isGmailUser) {
      const useOAuth = confirm(
        `We detected you're using Gmail! You can sign up with Google OAuth for a faster and more secure experience, or continue with email signup. Would you like to use Google Sign-Up?`
      )
      
      if (useOAuth) {
        // Redirect to OAuth signin page
        router.push('/auth/signin')
        return
      }
    }

    setIsStarting(true)
    const initials = name
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)

    try {
      // Create or get user based on email
      const response = await fetch('/api/auth/email-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      const { user } = await response.json()

      // Store user info in localStorage
      localStorage.setItem('userName', user.name)
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userInitials', initials)
      localStorage.setItem('userId', user.id)

      // Redirect directly to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('User creation failed:', error)
      setIsStarting(false)
      // Show error to user
      alert('Something went wrong. Please try again.')
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const isValidName = (name: string) => {
    return name.trim().length >= 2
  }

  const canStart = isValidEmail(email) && isValidName(name) && emailVerification.status !== 'checking'

  const handleEmailSuggestion = () => {
    if (emailVerification.suggestion) {
      setEmail(emailVerification.suggestion)
      setEmailVerification({ status: 'idle', message: '' })
    }
  }

  const handleSignIn = async () => {
    if (!isValidEmail(signInEmail)) return

    setIsSigningIn(true)
    try {
      // Check if user exists and what authentication methods are available
      const response = await fetch('/api/auth/validate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: signInEmail.trim().toLowerCase(),
          method: 'email'
        })
      })

      const result = await response.json()

      if (response.ok && result.exists) {
        // Check if this is a Gmail user who could use OAuth
        if (result.isGmailUser && result.canUseOAuth) {
          const useOAuth = confirm(
            `We detected you're using Gmail! You can sign in with Google OAuth for a faster experience, or continue with email. Would you like to use Google Sign-In?`
          )
          
          if (useOAuth) {
            // Redirect to OAuth signin page
            router.push('/auth/signin')
            return
          }
        }
        
        // User exists, log them in with email method
        const userName = result.user.name || 'User'
        const initials = userName
          .split(" ")
          .map((word: string) => word.charAt(0).toUpperCase())
          .join("")
          .slice(0, 2)

        localStorage.setItem('userName', userName)
        localStorage.setItem('userEmail', result.user.email)
        localStorage.setItem('userInitials', initials)
        localStorage.setItem('userId', result.user.id)
        
        // Close the modal and show welcome message
        setShowSignIn(false)
        
        // Show a brief welcome message before redirecting
        setIsStarting(true)
        setName(userName) // Set the name for the welcome screen
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        alert('No account found with this email. Please sign up instead.')
        setShowSignIn(false)
        setEmail(signInEmail)
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  if (isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {name}!</h2>
            <p className="text-gray-600">Setting up your learning dashboard...</p>
          </div>
          <div className="w-64 mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-full"></div>
                      </div>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sign In</h3>
              <button
                onClick={() => setShowSignIn(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-green-700 text-center">
                  <strong>Privacy Note:</strong> This isn't to send you emails - it's only to identify you uniquely and securely access your learning data.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Enter your email to access your existing account
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="h-12 text-lg"
                  onKeyPress={(e) => e.key === "Enter" && isValidEmail(signInEmail) && handleSignIn()}
                />
                {signInEmail.trim() && !isValidEmail(signInEmail) && (
                  <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSignIn}
                  disabled={!isValidEmail(signInEmail) || isSigningIn}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSigningIn ? "Signing in..." : "Sign In"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSignIn(false)}
                  className="h-12 px-6"
                >
                  Cancel
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account? Just fill out the form above to create one.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Recall</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Open Source</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="https://github.com/nad-devs/recall" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <Heart className="w-4 h-4" />
                <span>Free & Open Source</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Turn Conversations into
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-tight pb-2">
                  Clarity
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Recall is your AI-powered learning companion that extracts concepts from your chats and helps you truly remember them.
                <span className="block mt-2 font-semibold text-gray-900">Own your data, control your learning.</span>
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">No subscriptions</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Self-hosted</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">AI-powered</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Github className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-gray-700">MIT licensed</span>
              </div>
            </div>

            {/* CTA Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to organize your knowledge?</h3>
                      <p className="text-gray-600 text-sm">Enter your details to get started</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-green-700 text-center">
                          <strong>Privacy Note:</strong> We only use your email to identify you uniquely - no marketing emails or spam.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="Email (to uniquely identify you)"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setEmailVerification({ status: 'idle', message: '' })
                          }}
                          className={`h-12 text-lg text-gray-900 placeholder:text-gray-500 ${
                            emailVerification.status === 'valid' ? 'border-green-500 bg-green-50' :
                            emailVerification.status === 'invalid' ? 'border-red-500 bg-red-50' :
                            emailVerification.status === 'checking' ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                        />
                        
                        {/* Email verification status */}
                        {emailVerification.status === 'checking' && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>{emailVerification.message}</span>
                          </div>
                        )}
                        
                        {emailVerification.status === 'valid' && (
                          <p className="text-sm text-green-600 flex items-center space-x-1">
                            <span>✓</span>
                            <span>{emailVerification.message}</span>
                          </p>
                        )}
                        
                        {emailVerification.status === 'invalid' && (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600">{emailVerification.message}</p>
                            {emailVerification.suggestion && (
                              <button
                                onClick={handleEmailSuggestion}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                Use suggested email: {emailVerification.suggestion}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {email.trim() && !isValidEmail(email) && emailVerification.status === 'idle' && (
                          <p className="text-sm text-red-600">Please enter a valid email address</p>
                        )}
                        
                        {email.trim() && isValidEmail(email) && emailVerification.status === 'idle' && (
                          <button
                            onClick={() => verifyEmail(email)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Click to verify this email address
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Input
                          placeholder="What name would you like to be called"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 text-lg text-gray-900 placeholder:text-gray-500"
                          onKeyPress={(e) => e.key === "Enter" && canStart && handleStart()}
                        />
                        {name.trim() && !isValidName(name) && (
                          <p className="text-sm text-red-600">Please enter a name (at least 2 characters)</p>
                        )}
                      </div>

                      <Button
                        onClick={handleStart}
                        disabled={!canStart}
                        className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {emailVerification.status === 'checking' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Verifying Email...
                          </>
                        ) : (
                          <>
                            Start Building Your Knowledge Base
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    
                                          <div className="text-center space-y-2">
                        <p className="text-sm text-gray-500">
                          Your data will be saved and accessible from any device
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                          <p className="text-sm text-gray-600">Already have an account?</p>
                          <button
                            onClick={() => router.push('/auth/signin')}
                            className="text-blue-600 hover:text-blue-800 font-medium underline text-sm"
                          >
                            Google Sign In
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Open Source Message */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">100% Free & Open Source.</span> No hidden costs, no vendor lock-in. 
                    Deploy on your own infrastructure and own your data completely.
                  </p>
                  <Link href="https://github.com/nad-devs/recall" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View source code →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Demo */}
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl transform rotate-3"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl transform -rotate-3"></div>
            
            {/* Main demo card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Concept Extraction</h3>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>

              {/* Demo content */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">ChatGPT conversation:</p>
                  <div className="text-sm text-gray-800 space-y-2">
                    <p><span className="font-medium">You:</span> "Can you explain how NLP models work?"</p>
                    <p><span className="font-medium">ChatGPT:</span> "NLP models use machine learning algorithms to process natural language. They employ techniques like tokenization, word embeddings, and transformer architectures to understand context and meaning..."</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4 animate-pulse text-blue-500" />
                  <span>AI extracting concepts...</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">Machine Learning</span>
                    </div>
                    <p className="text-xs text-blue-800">Algorithms that learn patterns from data</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-900">Natural Language Processing</span>
                    </div>
                    <p className="text-xs text-green-800">AI field focused on language understanding</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-900">Transformer Architecture</span>
                    </div>
                    <p className="text-xs text-purple-800">Neural network design for sequence processing</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-900">Word Embeddings</span>
                    </div>
                    <p className="text-xs text-orange-800">Vector representations of words</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">4 concepts extracted</span>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 animate-bounce">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 animate-pulse">
              <BookOpen className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mt-24 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">How to Use Recall</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to transform your conversations into organized knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">1. Upload Your Content</h3>
                <p className="text-gray-600">
                  Paste conversations, notes, or any text containing learning material you want to analyze.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">2. AI Extracts Concepts</h3>
                <p className="text-gray-600">
                  Our AI automatically identifies key concepts, definitions, and learning points from your content.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">3. Review & Remember</h3>
                <p className="text-gray-600">
                  Browse your organized concepts, save important ones, and build your personal knowledge base.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Recall?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built by a learner for learners. No subscriptions, no vendor lock-in, just pure learning enhancement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI-Powered Extraction</h3>
                <p className="text-gray-600">
                  Automatically identify and extract key concepts from any text using advanced AI models.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Completely Free</h3>
                <p className="text-gray-600">
                  Open source and self-hosted. Pay only for your own infrastructure and API usage.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Your Data, Your Control</h3>
                <p className="text-gray-600">
                  Complete ownership of your knowledge base. No vendor lock-in, export anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
