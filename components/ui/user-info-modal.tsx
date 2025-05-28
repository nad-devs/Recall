"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userInfo: { name: string; email: string }) => void
}

export function UserInfoModal({ isOpen, onClose, onSave }: UserInfoModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const canSubmit = name.trim().length >= 2 && isValidEmail(email)

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      // Create or get user via the email session API
      const response = await fetch('/api/auth/email-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      const { user } = await response.json()

      // Store proper user info in localStorage
      localStorage.setItem('userName', user.name)
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userId', user.id) // Use the real database ID

      // Generate initials for display
      const initials = user.name
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2)
      localStorage.setItem('userInitials', initials)

      onSave({
        name: user.name,
        email: user.email
      })
    } catch (error) {
      console.error('Error creating user:', error)
      // Show error to user
      alert('Failed to save user information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Your Conversation</DialogTitle>
          <DialogDescription>
            To save your conversation and concepts, please provide your name and email. 
            This helps us organize your learning progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Privacy Note:</strong> We only use this information to save your learning progress. 
              No spam emails, just your personal concept library.
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
              {name.trim() && name.trim().length < 2 && (
                <p className="text-sm text-red-600 mt-1">Name must be at least 2 characters</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
              {email.trim() && !isValidEmail(email) && (
                <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Conversation"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-6"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 