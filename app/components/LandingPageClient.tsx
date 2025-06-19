"use client"

import { useState, useEffect } from "react"
import { Brain, MessageSquare, BookOpen, ArrowRight, Sparkles, BarChart3, Upload, FileText, Zap, Target, Github, Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export function LandingPageClient() {
  const [name, setName] = useState("")
  const router = useRouter()

  const isValidName = (name: string) => {
    return name.trim().length >= 2
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
                    <p className="text-gray-600 text-sm">Sign in securely with Google to get started</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-700 text-center">
                        <strong>Secure & Private:</strong> Google sign-in ensures only you can access your data - no one else can impersonate you.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="What is your name?"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 text-lg !text-gray-900 placeholder:text-gray-500 !bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        style={{ 
                          color: '#111827 !important',
                          backgroundColor: '#ffffff !important'
                        } as React.CSSProperties}
                      />
                      {name.trim() && !isValidName(name) && (
                        <p className="text-sm text-red-600">Please enter a name (at least 2 characters)</p>
                      )}
                    </div>

                    <Button
                      onClick={async () => {
                        if (name.trim()) {
                          // Store the name temporarily so OAuth can pick it up
                          localStorage.setItem('tempUserName', name.trim())
                        }
                        // Directly trigger Google OAuth instead of going to signin page
                        await signIn("google", { callbackUrl: "/dashboard" })
                      }}
                      disabled={!isValidName(name)}
                      className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-500">
                        We use Google to verify your identity and get your name automatically
                      </p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Secure • No passwords • No one else can access your account</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                        <p className="text-sm text-gray-600">Already have an account?</p>
                        <button
                          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                          className="text-blue-600 hover:text-blue-800 font-medium underline text-sm"
                        >
                          Sign in here
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Extracted Concepts:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">Tokenization</span>
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">Word Embeddings</span>
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">Transformers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 