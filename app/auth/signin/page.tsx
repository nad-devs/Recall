"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Github, Mail, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
// Using a simple Google icon instead of react-icons

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    await signIn("email", { email, callbackUrl: "/dashboard" })
    setIsLoading(false)
  }

  const handleProviderSignIn = async (providerId: string) => {
    setIsLoading(true)
    await signIn(providerId, { callbackUrl: "/dashboard" })
    setIsLoading(false)
  }

  const handleTryDemo = () => {
    // Set demo mode flag
    localStorage.setItem('demoMode', 'true')
    localStorage.setItem('demoUser', JSON.stringify({
      name: 'Demo User',
      id: 'demo-' + Date.now(),
      createdAt: new Date().toISOString()
    }))
    
    // Redirect to dashboard
    router.push('/dashboard')
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
            <p className="text-gray-600">Choose how you'd like to get started</p>
          </div>
        </div>

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
              className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Demo Now
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
            {/* Social Providers */}
            {providers?.google && (
              <Button
                onClick={() => handleProviderSignIn("google")}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              >
                <span className="w-5 h-5 mr-3 text-lg">🔍</span>
                Continue with Google
              </Button>
            )}

            {providers?.github && (
              <Button
                onClick={() => handleProviderSignIn("github")}
                disabled={isLoading}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Github className="w-5 h-5 mr-3" />
                Continue with GitHub
              </Button>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or use email</span>
              </div>
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Mail className="w-5 h-5 mr-2" />
                {isLoading ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Demo mode stores data locally. Sign up to save permanently and sync across devices.
        </div>
      </div>
    </div>
  )
} 