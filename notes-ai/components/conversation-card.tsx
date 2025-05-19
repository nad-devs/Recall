"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, CheckCircle } from "lucide-react"

interface ConversationCardProps {
  conversation: {
    id: string;
    title: string;
    summary: string;
    conceptMap?: string[];
    concepts?: Array<{id: string; title: string}>; 
    keyPoints?: string[];
    createdAt?: string;
    date?: string;
    metadata?: {
      conceptCount: number;
    }
  }
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const { 
    id, 
    title, 
    summary, 
    conceptMap, 
    concepts = [], 
    keyPoints = [], 
    createdAt, 
    date 
  } = conversation
  
  // Handle both conceptMap and concepts arrays
  const displayConcepts = conceptMap || concepts.map(c => c.title)
  
  // Handle both createdAt and date fields
  const dateString = createdAt || date || new Date().toISOString()
  
  // Format date
  const formattedDate = new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  })

  // Generate a meaningful title if original is missing or just "Untitled Conversation"
  const getDisplayTitle = () => {
    // If we have a non-empty title that's not "Untitled Conversation", use it
    if (title && title.trim() !== "" && title !== "Untitled Conversation") {
      return title;
    }
    
    // Generate a title from concepts if available
    if (displayConcepts && displayConcepts.length > 0) {
      if (displayConcepts.length === 1) {
        return `Discussion about ${displayConcepts[0]}`;
      } else if (displayConcepts.length === 2) {
        return `${displayConcepts[0]} and ${displayConcepts[1]} Discussion`;
      } else {
        return `${displayConcepts[0]}, ${displayConcepts[1]} & More`;
      }
    }
    
    // If we have a summary, use the first sentence
    if (summary && summary.trim() !== "") {
      const firstSentence = summary.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
      if (firstSentence && firstSentence.length > 5) {
        return firstSentence.length > 60 
          ? firstSentence.substring(0, 57) + '...' 
          : firstSentence;
      }
    }
    
    // Last resort: Date-based title
    return `Conversation from ${formattedDate}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{getDisplayTitle()}</CardTitle>
          <Badge variant="outline" className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {formattedDate}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {displayConcepts.slice(0, 4).map((concept, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {concept}
            </Badge>
          ))}
          {displayConcepts.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{displayConcepts.length - 4} more
            </Badge>
          )}
        </div>
        
        {keyPoints && keyPoints.length > 0 && (
          <div className="pt-1">
            <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Key Points ({keyPoints.length})
            </div>
            <ul className="space-y-1">
              {keyPoints.slice(0, 2).map((point, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <span className="text-xs mr-1 mt-0.5">•</span>
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
              {keyPoints.length > 2 && (
                <li className="text-xs text-muted-foreground italic">
                  + {keyPoints.length - 2} more points
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="ghost" size="sm" className="ml-auto" asChild>
          <Link href={`/conversation/${id}`}>
            View details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
