"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, FileText, Youtube, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface InputSelectorProps {
  onSubmit: (type: string, content: string) => void
  isProcessing: boolean
  initialText?: string
}

export function InputSelector({ onSubmit, isProcessing, initialText = "" }: InputSelectorProps) {
  const [inputType, setInputType] = useState<string>("conversation")
  const [conversationText, setConversationText] = useState(initialText)
  const [articleUrl, setArticleUrl] = useState("")
  const [articleText, setArticleText] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    switch (inputType) {
      case "conversation":
        if (conversationText.trim()) {
          onSubmit("conversation", conversationText)
        }
        break
      case "article-url":
        if (articleUrl.trim()) {
          onSubmit("article-url", articleUrl)
        }
        break
      case "article-text":
        if (articleText.trim()) {
          onSubmit("article-text", articleText)
        }
        break
      case "youtube":
        if (youtubeUrl.trim()) {
          onSubmit("youtube", youtubeUrl)
        }
        break
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Analyze Content</CardTitle>
        <CardDescription>
          Choose a content type below to analyze. You can paste a conversation, enter an article URL, paste article
          text, or enter a YouTube video URL.
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="conversation" value={inputType} onValueChange={setInputType} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 w-full">
          <TabsTrigger value="conversation" className="flex items-center gap-2 py-3">
            <MessageSquare className="h-4 w-4" />
            <span>Conversation</span>
          </TabsTrigger>
          <TabsTrigger value="article-url" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span>Article URL</span>
          </TabsTrigger>
          <TabsTrigger value="article-text" className="flex items-center gap-2 py-3">
            <Upload className="h-4 w-4" />
            <span>Article Text</span>
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2 py-3">
            <Youtube className="h-4 w-4" />
            <span>YouTube</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">ChatGPT Conversation</CardTitle>
              <CardDescription>Paste your conversation with ChatGPT or another AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="conversation"
                  placeholder="Paste your ChatGPT conversation here..."
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  className="min-h-[200px] resize-y"
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="article-url">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Article URL</CardTitle>
              <CardDescription>Enter the URL of an article you want to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  id="article-url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  We'll extract the content from the article URL and analyze it.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="article-text">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Article Text</CardTitle>
              <CardDescription>Paste the text of an article you want to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="article-text"
                  placeholder="Paste the full text of the article here..."
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  className="min-h-[200px] resize-y"
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="youtube">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">YouTube Video</CardTitle>
              <CardDescription>Enter a YouTube video URL to analyze its transcript</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  We'll extract the transcript from the YouTube video and analyze it.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            isProcessing ||
            (inputType === "conversation" && !conversationText.trim()) ||
            (inputType === "article-url" && !articleUrl.trim()) ||
            (inputType === "article-text" && !articleText.trim()) ||
            (inputType === "youtube" && !youtubeUrl.trim())
          }
          size="lg"
          className="mt-4"
        >
          {isProcessing ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4 animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              Analyze Content
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
