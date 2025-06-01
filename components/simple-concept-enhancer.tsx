"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getAuthHeaders } from '@/lib/auth-utils'
import { 
  Plus, 
  X, 
  Video, 
  AlertTriangle,
  FileText,
  Save,
  Loader2
} from "lucide-react"

interface SimpleConceptEnhancerProps {
  concept: any
  onSave?: (updatedConcept: any) => void
  onCancel?: () => void
}

export function SimpleConceptEnhancer({ concept, onSave, onCancel }: SimpleConceptEnhancerProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Parse existing data
  const [videoResources, setVideoResources] = useState<string[]>(() => {
    try {
      return concept.videoResources ? JSON.parse(concept.videoResources) : []
    } catch {
      return []
    }
  })
  
  const [commonMistakes, setCommonMistakes] = useState<string[]>(() => {
    try {
      return concept.commonMistakes ? JSON.parse(concept.commonMistakes) : []
    } catch {
      return []
    }
  })
  
  const [additionalNotes, setAdditionalNotes] = useState(concept.personalNotes || '')
  
  // Temporary input states
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newMistake, setNewMistake] = useState('')

  const addVideoResource = () => {
    if (newVideoUrl.trim()) {
      setVideoResources([...videoResources, newVideoUrl.trim()])
      setNewVideoUrl('')
    }
  }

  const removeVideoResource = (index: number) => {
    setVideoResources(videoResources.filter((_, i) => i !== index))
  }

  const addCommonMistake = () => {
    if (newMistake.trim()) {
      setCommonMistakes([...commonMistakes, newMistake.trim()])
      setNewMistake('')
    }
  }

  const removeCommonMistake = (index: number) => {
    setCommonMistakes(commonMistakes.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updatedData = {
        videoResources: JSON.stringify(videoResources),
        commonMistakes: JSON.stringify(commonMistakes),
        personalNotes: additionalNotes
      }

      const response = await fetch(`/api/concepts/${concept.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error('Failed to save enhancements')
      }

      const updatedConcept = await response.json()
      
      toast({
        title: "Enhancements saved!",
        description: "Your concept has been enhanced successfully.",
      })

      onSave?.(updatedConcept)
    } catch (error) {
      console.error('Error saving enhancements:', error)
      toast({
        title: "Error",
        description: "Failed to save enhancements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhance: {concept.title}</h2>
          <p className="text-muted-foreground">Add helpful resources and notes to this concept</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Video Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Resources
          </CardTitle>
          <CardDescription>
            Add helpful video tutorials or explanations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter video URL or resource link"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addVideoResource()}
            />
            <Button onClick={addVideoResource} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {videoResources.length > 0 && (
            <div className="space-y-2">
              {videoResources.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {url}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoResource(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Mistakes
          </CardTitle>
          <CardDescription>
            Note common pitfalls or mistakes to avoid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a common mistake or pitfall"
              value={newMistake}
              onChange={(e) => setNewMistake(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCommonMistake()}
            />
            <Button onClick={addCommonMistake} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {commonMistakes.length > 0 && (
            <div className="space-y-2">
              {commonMistakes.map((mistake, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="flex-1 text-sm">{mistake}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCommonMistake(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Notes
          </CardTitle>
          <CardDescription>
            Add any extra notes, insights, or reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your additional notes here..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>
    </div>
  )
} 