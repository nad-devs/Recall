"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Code, Map, Tag, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface TopicDisplayProps {
  results: any
}

export function TopicDisplay({ results }: TopicDisplayProps) {
  const { learningSummary, keyTopics, category, conceptsMap, codeAnalysis, studyNotes } = results
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log("Saving analysis with data:", results)
      console.log("Payload:", JSON.stringify({
        conversation_text: results.originalConversationText,
        analysis: results,
      }, null, 2))
      const response = await fetch('/api/saveConversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_text: results.originalConversationText,
          analysis: results,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save analysis')
      }
      
      const data = await response.json();
      
      if (data.alreadyExists) {
        toast({
          title: "Already Saved",
          description: "This analysis was already saved. View it in your dashboard.",
          duration: 3000,
        })
      } else {
        toast({
          title: "Analysis Saved",
          description: "Your learning has been saved to your dashboard.",
          duration: 3000,
        })
        
        // Redirect to the concepts page
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          window.location.href = '/concepts';
        }
      }
    } catch (error) {
      console.error('Error saving analysis:', error)
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full mt-6 shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" /> Learning Analysis
        </CardTitle>
        <CardDescription>
          Key insights extracted from your content
          {category && <Badge className="ml-2">{category}</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="concepts">Concept Map</TabsTrigger>
            <TabsTrigger value="code">Code Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {learningSummary ? (
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-medium">Learning Summary</h3>
                <div className="whitespace-pre-wrap text-sm">{learningSummary}</div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">No summary was generated for this content.</div>
            )}

            {studyNotes && (
              <div className="prose dark:prose-invert max-w-none mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" /> Study Notes
                </h3>
                <div className="whitespace-pre-wrap text-sm">{studyNotes}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="topics">
            {keyTopics && keyTopics.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4" /> Key Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keyTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No key topics were identified in this content.
              </div>
            )}
          </TabsContent>

          <TabsContent value="concepts">
            {conceptsMap ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Map className="mr-2 h-4 w-4" /> Concept Map
                </h3>
                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">{conceptsMap}</div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No concept map was generated for this content.
              </div>
            )}
          </TabsContent>

          <TabsContent value="code">
            {codeAnalysis ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Code className="mr-2 h-4 w-4" /> Code Analysis
                </h3>
                <div className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-md overflow-x-auto">
                  {codeAnalysis}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No code analysis was generated for this content.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save to Dashboard
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
