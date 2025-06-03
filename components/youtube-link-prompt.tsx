"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Youtube, Plus } from "lucide-react"

interface YouTubeLinkPromptProps {
  onAddLink: (youtubeUrl: string) => void
  onSkip: () => void
}

export function YouTubeLinkPrompt({ onAddLink, onSkip }: YouTubeLinkPromptProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const handleAddLink = () => {
    if (youtubeUrl.trim()) {
      onAddLink(youtubeUrl.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink()
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
              YouTube Video Detected
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          It looks like you analyzed a YouTube transcript. Add the video link to enhance your concepts!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter YouTube video URL..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleAddLink} 
            disabled={!youtubeUrl.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Link
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={onSkip} 
          className="w-full text-sm"
        >
          Skip for now
        </Button>
      </CardContent>
    </Card>
  )
} 