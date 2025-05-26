"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    console.log('🚨 Authentication error page loaded with error:', error)
  }, [error])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There's an issue with the authentication configuration. Please contact support.",
          technical: "The OAuth provider is not properly configured on the server."
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You cancelled the sign-in process or access was denied.",
          technical: "User denied access or the OAuth provider rejected the request."
        }
      case "Verification":
        return {
          title: "Verification Error",
          description: "The sign-in link is invalid or has expired.",
          technical: "Email verification token is invalid or expired."
        }
      case "Default":
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during sign-in. Please try again.",
          technical: error || "Unknown authentication error"
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Error Card */}
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">{errorInfo.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              {errorInfo.description}
            </p>

            {/* Technical details for debugging */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-mono">
                  <strong>Technical Details:</strong><br />
                  {errorInfo.technical}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Help text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Still having trouble? Try using the demo mode instead.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 font-mono">
                Debug Info: Error = {error || 'None'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <CardTitle className="text-xl text-gray-900">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Loading error details...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  )
} 