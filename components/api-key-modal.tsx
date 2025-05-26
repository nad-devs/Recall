"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Key, ExternalLink, Shield, Zap } from "lucide-react"
import { setCustomApiKey } from "@/lib/usage-tracker"

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onApiKeySet: () => void
  conversationCount: number
}

export function ApiKeyModal({ isOpen, onClose, onApiKeySet, conversationCount }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      setError("Please enter your OpenAI API key")
      return
    }

    if (!apiKey.startsWith("sk-")) {
      setError("OpenAI API keys start with 'sk-'. Please check your key.")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      // Test the API key with a simple request
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (response.ok) {
        // Save the API key
        setCustomApiKey(apiKey.trim())
        onApiKeySet()
        onClose()
        setApiKey("")
      } else {
        const data = await response.json()
        setError(data.error || "Invalid API key. Please check and try again.")
      }
    } catch (error) {
      setError("Failed to validate API key. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Continue with Your API Key
          </DialogTitle>
          <DialogDescription>
            You've used {conversationCount} free conversations! Add your OpenAI API key to continue using Recall unlimited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Why use your own API key?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Unlimited conversations</li>
              <li>• You control your spending (~$0.01-0.03 per conversation)</li>
              <li>• Your data stays private</li>
              <li>• No monthly subscriptions</li>
            </ul>
          </div>

          {/* API Compatibility Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-amber-900 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Important: OpenAI API Keys Only
            </h4>
            <p className="text-sm text-amber-800">
              Currently, only OpenAI API keys are supported. Other providers (Claude, Gemini, etc.) 
              are not supported as of now but will be soon.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-600">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={isValidating || !apiKey.trim()}
                className="w-full"
              >
                {isValidating ? "Validating..." : "Continue with API Key"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkip}
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          </form>

          {/* Help Section */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-white flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              How to get an OpenAI API key
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. Go to OpenAI's website and create an account</p>
              <p>2. Navigate to API keys section</p>
              <p>3. Create a new API key (starts with "sk-")</p>
              <p>4. Copy and paste it above</p>
              <p className="text-xs text-yellow-400 font-medium">
                ⚠️ Only OpenAI keys work - other providers coming soon
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get OpenAI API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 