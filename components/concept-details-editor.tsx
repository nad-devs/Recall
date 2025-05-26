"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  X, 
  Star, 
  BookOpen, 
  Video, 
  Link as LinkIcon, 
  Code, 
  Lightbulb,
  Target,
  Building,
  Wrench,
  FolderOpen,
  Tag,
  Heart,
  Save,
  Loader2
} from "lucide-react"

interface ConceptDetailsEditorProps {
  concept: any
  onSave: (updatedConcept: any) => void
  onCancel: () => void
}

export function ConceptDetailsEditor({ concept, onSave, onCancel }: ConceptDetailsEditorProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    masteryLevel: concept.masteryLevel || '',
    learningProgress: concept.learningProgress || 0,
    difficultyRating: concept.difficultyRating || null,
    timeToMaster: concept.timeToMaster || null,
    personalNotes: concept.personalNotes || '',
    mnemonics: concept.mnemonics || '',
    personalRating: concept.personalRating || null,
    bookmarked: concept.bookmarked || false,
    
    // Arrays (parsed from JSON strings)
    videoResources: parseJsonArray(concept.videoResources),
    documentationLinks: parseJsonArray(concept.documentationLinks),
    practiceExercises: parseJsonArray(concept.practiceExercises),
    realWorldExamples: parseJsonArray(concept.realWorldExamples),
    commonMistakes: parseJsonArray(concept.commonMistakes),
    personalExamples: parseJsonArray(concept.personalExamples),
    learningTips: parseJsonArray(concept.learningTips),
    useCases: parseJsonArray(concept.useCases),
    industries: parseJsonArray(concept.industries),
    tools: parseJsonArray(concept.tools),
    projectsUsedIn: parseJsonArray(concept.projectsUsedIn),
    tags: parseJsonArray(concept.tags),
  })

  // Temporary input states for adding new items to arrays
  const [newInputs, setNewInputs] = useState({
    videoResource: '',
    documentationLink: '',
    practiceExercise: '',
    realWorldExample: '',
    commonMistake: '',
    personalExample: '',
    learningTip: '',
    useCase: '',
    industry: '',
    tool: '',
    project: '',
    tag: '',
  })

  function parseJsonArray(jsonString: string | null | undefined): string[] {
    if (!jsonString) return []
    try {
      const parsed = JSON.parse(jsonString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const addToArray = (arrayName: keyof typeof formData, inputName: keyof typeof newInputs) => {
    const value = newInputs[inputName].trim()
    if (!value) return

    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] as string[]), value]
    }))
    setNewInputs(prev => ({ ...prev, [inputName]: '' }))
  }

  const removeFromArray = (arrayName: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName] as string[]).filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert arrays back to JSON strings for storage
      const dataToSave = {
        ...formData,
        videoResources: JSON.stringify(formData.videoResources),
        documentationLinks: JSON.stringify(formData.documentationLinks),
        practiceExercises: JSON.stringify(formData.practiceExercises),
        realWorldExamples: JSON.stringify(formData.realWorldExamples),
        commonMistakes: JSON.stringify(formData.commonMistakes),
        personalExamples: JSON.stringify(formData.personalExamples),
        learningTips: JSON.stringify(formData.learningTips),
        useCases: JSON.stringify(formData.useCases),
        industries: JSON.stringify(formData.industries),
        tools: JSON.stringify(formData.tools),
        projectsUsedIn: JSON.stringify(formData.projectsUsedIn),
        tags: JSON.stringify(formData.tags),
      }

      const response = await fetch(`/api/concepts/${concept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (!response.ok) {
        throw new Error('Failed to save concept details')
      }

      const result = await response.json()
      onSave(result.concept)
      
      toast({
        title: "Details Saved",
        description: "Concept details have been updated successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error saving concept details:', error)
      toast({
        title: "Error",
        description: "Failed to save concept details. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const ArrayInputSection = ({ 
    title, 
    icon: Icon, 
    arrayName, 
    inputName, 
    placeholder 
  }: {
    title: string
    icon: any
    arrayName: keyof typeof formData
    inputName: keyof typeof newInputs
    placeholder: string
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">{title}</Label>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newInputs[inputName]}
          onChange={(e) => setNewInputs(prev => ({ ...prev, [inputName]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && addToArray(arrayName, inputName)}
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={() => addToArray(arrayName, inputName)}
          disabled={!newInputs[inputName].trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(formData[arrayName] as string[]).map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <button
              type="button"
              onClick={() => removeFromArray(arrayName, index)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Enhance "{concept.title}"
        </CardTitle>
        <CardDescription>
          Add additional details to make this concept more useful for your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="learning" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Mastery Level</Label>
                <select 
                  value={formData.masteryLevel} 
                  onChange={(e) => setFormData(prev => ({ ...prev, masteryLevel: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select mastery level</option>
                  <option value="BEGINNER">🌱 Beginner</option>
                  <option value="INTERMEDIATE">🌿 Intermediate</option>
                  <option value="ADVANCED">🌳 Advanced</option>
                  <option value="EXPERT">🏆 Expert</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>Learning Progress ({formData.learningProgress}%)</Label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${formData.learningProgress}%` }}
                  ></div>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.learningProgress}
                  onChange={(e) => setFormData(prev => ({ ...prev, learningProgress: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Difficulty Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, difficultyRating: star }))}
                      className={`p-1 ${star <= (formData.difficultyRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Estimated Time to Master (hours)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 20"
                  value={formData.timeToMaster || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeToMaster: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
            </div>

            <ArrayInputSection
              title="Learning Tips"
              icon={Lightbulb}
              arrayName="learningTips"
              inputName="learningTip"
              placeholder="Add a learning tip..."
            />

            <ArrayInputSection
              title="Common Mistakes"
              icon={Target}
              arrayName="commonMistakes"
              inputName="commonMistake"
              placeholder="Add a common mistake to avoid..."
            />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <ArrayInputSection
              title="Video Resources"
              icon={Video}
              arrayName="videoResources"
              inputName="videoResource"
              placeholder="Add video URL..."
            />

            <ArrayInputSection
              title="Documentation Links"
              icon={LinkIcon}
              arrayName="documentationLinks"
              inputName="documentationLink"
              placeholder="Add documentation URL..."
            />

            <ArrayInputSection
              title="Practice Exercises"
              icon={Code}
              arrayName="practiceExercises"
              inputName="practiceExercise"
              placeholder="Add practice exercise URL..."
            />

            <ArrayInputSection
              title="Real World Examples"
              icon={Building}
              arrayName="realWorldExamples"
              inputName="realWorldExample"
              placeholder="Add real world example..."
            />
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <div className="space-y-3">
              <Label>Personal Notes</Label>
              <Textarea
                placeholder="Add your personal insights and notes..."
                value={formData.personalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, personalNotes: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Memory Aids / Mnemonics</Label>
              <Textarea
                placeholder="Add memory aids or mnemonics..."
                value={formData.mnemonics}
                onChange={(e) => setFormData(prev => ({ ...prev, mnemonics: e.target.value }))}
                rows={3}
              />
            </div>

            <ArrayInputSection
              title="Personal Examples"
              icon={Lightbulb}
              arrayName="personalExamples"
              inputName="personalExample"
              placeholder="Add your own example..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Personal Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, personalRating: star }))}
                      className={`p-1 ${star <= (formData.personalRating || 0) ? 'text-red-500' : 'text-gray-300'}`}
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.bookmarked}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookmarked: e.target.checked }))}
                  />
                  Bookmark this concept
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            <ArrayInputSection
              title="Use Cases"
              icon={Target}
              arrayName="useCases"
              inputName="useCase"
              placeholder="When would you use this concept?"
            />

            <ArrayInputSection
              title="Industries"
              icon={Building}
              arrayName="industries"
              inputName="industry"
              placeholder="Which industries use this?"
            />

            <ArrayInputSection
              title="Tools & Frameworks"
              icon={Wrench}
              arrayName="tools"
              inputName="tool"
              placeholder="Related tools or frameworks..."
            />

            <ArrayInputSection
              title="Projects Used In"
              icon={FolderOpen}
              arrayName="projectsUsedIn"
              inputName="project"
              placeholder="Projects where you've used this..."
            />

            <ArrayInputSection
              title="Tags"
              icon={Tag}
              arrayName="tags"
              inputName="tag"
              placeholder="Add custom tags..."
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 