"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectOption } from "@/components/ui/select"
import { MessageSquare, Star, Send, Bug, Lightbulb, MessageCircle, Upload, X, Image, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FeedbackWidgetProps {
  page?: string
}

export function FeedbackWidget({ page }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<string>("")
  const [rating, setRating] = useState<number>(0)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [priority, setPriority] = useState<string>("medium")
  const [browserInfo, setBrowserInfo] = useState("")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Automatically detect browser info when component mounts
  useState(() => {
    const userAgent = navigator.userAgent
    const browserName = getBrowserName(userAgent)
    const osName = getOSName(userAgent)
    setBrowserInfo(`${browserName} on ${osName}`)
  })

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Unknown Browser"
  }

  const getOSName = (userAgent: string) => {
    if (userAgent.includes("Windows")) return "Windows"
    if (userAgent.includes("Mac")) return "macOS"
    if (userAgent.includes("Linux")) return "Linux"
    if (userAgent.includes("Android")) return "Android"
    if (userAgent.includes("iOS")) return "iOS"
    return "Unknown OS"
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files (PNG, JPG, etc.)",
          variant: "destructive"
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload images smaller than 5MB",
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    setScreenshots(prev => [...prev, ...validFiles].slice(0, 3)) // Max 3 screenshots
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!type || !message.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a feedback type and enter a message.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare form data for file upload
      const formData = new FormData()
      formData.append('type', type)
      formData.append('message', message)
      formData.append('page', page || '')
      formData.append('priority', priority)
      formData.append('browserInfo', browserInfo)
      
      if (rating > 0) {
        formData.append('rating', rating.toString())
      }

      // Add screenshots
      screenshots.forEach((file, index) => {
        formData.append(`screenshot_${index}`, file)
      })

      // Add additional context for bug reports
      if (type === 'bug') {
        const additionalContext = {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent
        }
        formData.append('context', JSON.stringify(additionalContext))
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData, // Use FormData instead of JSON for file uploads
      })

      if (response.ok) {
        toast({
          title: "Feedback submitted!",
          description: screenshots.length > 0 
            ? "Thank you for your feedback and screenshots. We'll review it soon."
            : "Thank you for your feedback. We'll review it soon.",
        })
        
        // Reset form
        setIsOpen(false)
        setType("")
        setRating(0)
        setMessage("")
        setScreenshots([])
        setPriority("medium")
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case 'bug':
        return <Bug className="w-4 h-4" />
      case 'feature':
        return <Lightbulb className="w-4 h-4" />
      case 'rating':
        return <Star className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'high':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts, reporting bugs, or suggesting features.
            You can also upload screenshots to help us understand issues better.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <SelectOption value="">Select feedback type</SelectOption>
              <SelectOption value="bug">🐛 Bug Report</SelectOption>
              <SelectOption value="feature">💡 Feature Request</SelectOption>
              <SelectOption value="rating">⭐ Rating & Review</SelectOption>
              <SelectOption value="general">💬 General Feedback</SelectOption>
            </Select>
          </div>

          {type === 'bug' && (
            <div className="space-y-2">
              <Label>Priority Level</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <SelectOption value="low">🟢 Low - Minor issue</SelectOption>
                <SelectOption value="medium">🟡 Medium - Affects functionality</SelectOption>
                <SelectOption value="high">🔴 High - Blocks usage</SelectOption>
              </Select>
            </div>
          )}

          {type === 'rating' && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 rounded ${
                      star <= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">
              {type === 'bug' ? 'Describe the problem' : 'Message'}
            </Label>
            <Textarea
              id="message"
              placeholder={
                type === 'bug' 
                  ? "Please describe what happened, what you expected to happen, and any steps to reproduce the issue..."
                  : "Tell us more about your experience..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {message.length}/1000
            </div>
          </div>

          {/* Screenshot Upload Section */}
          <div className="space-y-2">
            <Label>Screenshots (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={screenshots.length >= 3}
              >
                <Upload className="w-4 h-4 mr-2" />
                {screenshots.length === 0 ? 'Upload Screenshots' : `Add More (${screenshots.length}/3)`}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {screenshots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Uploaded screenshots ({screenshots.length}/3):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                        <Image className="w-4 h-4" />
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="ml-auto p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Browser Info Display */}
          {(type === 'bug' || type === 'general') && (
            <div className="space-y-2">
              <Label>Browser Information</Label>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {browserInfo}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !type || !message.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit {type === 'bug' && priority === 'high' ? '(Priority)' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 