"use client"

import { useState } from "react"
import { Brain, MessageSquare, BookOpen, ArrowRight, Sparkles, BarChart3, Upload, FileText, Zap, Target, Search, Github, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [name, setName] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    if (!name.trim()) return

    setIsStarting(true)
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)

    // Store user info in localStorage for personalization
    localStorage.setItem('userName', name.trim())
    localStorage.setItem('userInitials', initials)

    // Optional: Track user signup for analytics (privacy-friendly)
    try {
      await fetch('/api/analytics/user-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
    } catch (error) {
      // Analytics failure shouldn't block the user experience
      console.log('Analytics tracking failed (non-critical):', error)
    }

    // Simulate a brief transition then redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
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
                    <p className="text-gray-600 text-sm">Start extracting concepts from your learning materials</p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 text-lg text-gray-900 placeholder:text-gray-500"
                      onKeyPress={(e) => e.key === "Enter" && handleStart()}
                    />

                    <Button
                      onClick={handleStart}
                      disabled={!name.trim()}
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Start Building Your Knowledge Base
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    
                    <div className="text-center">
                      <Link href="/dashboard" className={`text-sm text-gray-500 hover:text-gray-700 transition-colors ${!name.trim() ? 'pointer-events-none opacity-50' : ''}`}
                        tabIndex={!name.trim() ? -1 : 0}
                        aria-disabled={!name.trim()}>
                        Or go directly to dashboard →
                      </Link>
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
                    <p className="text-xs text-blue-700">Algorithms that learn patterns from data</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-900">Natural Language Processing</span>
                    </div>
                    <p className="text-xs text-green-700">AI field focused on language understanding</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-900">Transformer Architecture</span>
                    </div>
                    <p className="text-xs text-purple-700">Neural network design for sequence processing</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-900">Word Embeddings</span>
                    </div>
                    <p className="text-xs text-orange-700">Vector representations of words</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">4 concepts extracted</span>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Search className="w-3 h-3 mr-1" />
                    Explore
                  </Button>
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
