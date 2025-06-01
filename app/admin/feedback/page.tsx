"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Mail, ExternalLink, Eye } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/use-toast"

export default function FeedbackAdminPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchSystemInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/feedback')
      
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
        toast({
          title: "System info loaded",
          description: "Feedback system status retrieved successfully",
        })
      } else {
        toast({
          title: "Error loading info",
          description: "Failed to load system information.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load system information.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  if (loading) {
    return (
      <PageTransition>
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading system info...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Feedback Admin</h1>
          <p className="text-muted-foreground">
            Monitor feedback system and view submission details
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={fetchSystemInfo} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button 
            onClick={() => window.open('https://vercel.com/dashboard', '_blank')} 
            variant="outline" 
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Vercel Logs
          </Button>
          <Button 
            onClick={() => window.open('https://gmail.com', '_blank')} 
            variant="outline" 
            size="sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Check Email
          </Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Delivery
              </CardTitle>
              <CardDescription>
                Feedback is automatically sent to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Target Email:</span>
                  <Badge variant="secondary">
                    {systemInfo?.emailTarget || 'arjunnadar0507@gmail.com'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Service:</span>
                  <Badge variant="default">Resend</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ✅ All feedback submissions are sent directly to your email with formatted HTML content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Monitoring Options
              </CardTitle>
              <CardDescription>
                Ways to monitor and view feedback submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('https://gmail.com', '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Check Gmail Inbox
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Vercel Function Logs
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 Real-time console logs are visible in Vercel's Functions tab
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to View Feedback</CardTitle>
            <CardDescription>
              Follow these steps to access submitted feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your email inbox at <strong>arjunnadar0507@gmail.com</strong>. Each feedback submission 
                    will arrive as a formatted email with all details, screenshots, and metadata.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Real-time Logs</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to <strong>Vercel Dashboard → Your Project → Functions</strong> to see real-time 
                    console logs when feedback is submitted. Includes detailed technical information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Screenshots</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded screenshots are stored in your app and linked in the email. 
                    Direct URLs are provided for easy viewing.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Test the System</CardTitle>
            <CardDescription>
              Submit a test feedback to verify everything is working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                🧪 <strong>Test Instructions:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>Go to any page on your app</li>
                <li>Click the "Feedback" button (bottom-right corner)</li>
                <li>Fill out a test bug report or feature request</li>
                <li>Optionally upload a screenshot</li>
                <li>Submit and check your email within 1-2 minutes</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
} 