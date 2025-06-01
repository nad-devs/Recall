"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Download, Eye, EyeOff } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/use-toast"

export default function FeedbackAdminPage() {
  const [feedbackLog, setFeedbackLog] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showRawLog, setShowRawLog] = useState(false)
  const { toast } = useToast()

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/feedback')
      
      if (response.ok) {
        const data = await response.json()
        setFeedbackLog(data.feedbackLog || 'No feedback received yet.')
        toast({
          title: "Feedback loaded",
          description: `Found ${data.entries || 0} feedback entries`,
        })
      } else {
        toast({
          title: "Error loading feedback",
          description: "Failed to load feedback log.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feedback log.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const parseFeedbackEntries = (logContent: string) => {
    if (!logContent || logContent === 'No feedback received yet.') {
      return []
    }

    const entries = logContent.split('================================================================================')
    return entries
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0)
      .map((entry, index) => {
        const lines = entry.split('\n')
        const timestamp = lines[0]?.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/)?.[1] || 'Unknown'
        const type = lines[0]?.match(/- (BUG|FEATURE|GENERAL|RATING)/)?.[1] || 'UNKNOWN'
        
        // Extract key information
        const userMatch = entry.match(/User: ([^\n]+)/)
        const pageMatch = entry.match(/Page: ([^\n]+)/)
        const messageMatch = entry.match(/Message:\n([^]*?)(?=\n(?:Additional Context|Screenshots uploaded|Timestamp))/)
        const priorityMatch = entry.match(/Priority: ([^\n]+)/)
        const ratingMatch = entry.match(/Rating: (⭐+) \((\d)\/5\)/)
        const screenshotsMatch = entry.match(/Screenshots uploaded: (\d+)/)
        
        return {
          id: index,
          timestamp,
          type,
          user: userMatch?.[1] || 'Unknown',
          page: pageMatch?.[1] || 'Not specified',
          message: messageMatch?.[1]?.trim() || 'No message',
          priority: priorityMatch?.[1] || null,
          rating: ratingMatch?.[2] || null,
          screenshots: screenshotsMatch?.[1] || '0',
          rawEntry: entry
        }
      })
      .reverse() // Show newest first
  }

  const feedbackEntries = parseFeedbackEntries(feedbackLog)

  const downloadLog = () => {
    const blob = new Blob([feedbackLog], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-log-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUG':
        return 'destructive'
      case 'FEATURE':
        return 'default'
      case 'RATING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'outline'
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading feedback...</p>
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
            View and manage user feedback, bug reports, and feature requests
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={fetchFeedback} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={downloadLog} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Log
          </Button>
          <Button 
            onClick={() => setShowRawLog(!showRawLog)} 
            variant="outline" 
            size="sm"
          >
            {showRawLog ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showRawLog ? 'Hide Raw Log' : 'Show Raw Log'}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{feedbackEntries.length}</div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {feedbackEntries.filter(e => e.type === 'BUG').length}
              </div>
              <p className="text-sm text-muted-foreground">Bug Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {feedbackEntries.filter(e => e.type === 'FEATURE').length}
              </div>
              <p className="text-sm text-muted-foreground">Feature Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {feedbackEntries.filter(e => e.priority === 'HIGH').length}
              </div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
        </div>

        {showRawLog ? (
          /* Raw Log View */
          <Card>
            <CardHeader>
              <CardTitle>Raw Feedback Log</CardTitle>
              <CardDescription>
                Complete log file content for debugging purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                {feedbackLog}
              </pre>
            </CardContent>
          </Card>
        ) : (
          /* Parsed Feedback Entries */
          <div className="space-y-4">
            {feedbackEntries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No feedback received yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Feedback will appear here once users start submitting it.
                  </p>
                </CardContent>
              </Card>
            ) : (
              feedbackEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeColor(entry.type)}>
                            {entry.type}
                          </Badge>
                          {entry.priority && (
                            <Badge variant={getPriorityColor(entry.priority)}>
                              {entry.priority} Priority
                            </Badge>
                          )}
                          {entry.rating && (
                            <Badge variant="secondary">
                              {entry.rating}⭐ Rating
                            </Badge>
                          )}
                          {parseInt(entry.screenshots) > 0 && (
                            <Badge variant="outline">
                              📸 {entry.screenshots} screenshot{entry.screenshots !== '1' ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{entry.user}</CardTitle>
                        <CardDescription>
                          {new Date(entry.timestamp).toLocaleString()} • Page: {entry.page}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Message:</h4>
                        <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                          {entry.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
} 