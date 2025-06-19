import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react"
import { Brain, MessageSquare, BookOpen, ArrowRight, Sparkles, BarChart3, Upload, FileText, Zap, Target, Github, Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"


// Component with all the client-side logic
function LandingPageClient() {
  "use client"

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

            {/* CTA Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to organize your knowledge?</h3>
                    <p className="text-gray-600 text-sm">Sign in securely with Google to get started</p>
                  </div>
                  <div className="space-y-3">
                    <Button
                      onClick={async () => {
                        await signIn("google", { callbackUrl: "/dashboard" })
                      }}
                      className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Visual Demo */}
          <div className="relative">
            {/* Visual content here */}
          </div>
        </div>
      </div>
    </div>
  )
}


// The main page component, which is now a Server Component
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If the user already has a session on the server,
  // redirect them straight to the dashboard.
  if (session?.user) {
    redirect('/dashboard');
  }

  // If there's no session, show the client-side landing page.
  return <LandingPageClient />;
}
