"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, CheckCircle, Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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
  },
  onDelete?: (id: string) => void;
}

export function ConversationCard({ conversation, onDelete }: ConversationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
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
  
  // Format date - Add validation to prevent Invalid Date NaN
  const formattedDate = (() => {
    try {
      const parsedDate = new Date(dateString);
      return isNaN(parsedDate.getTime()) 
        ? "No date" 
        : parsedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric' 
          });
    } catch (error) {
      return "No date";
    }
  })();

  // Generate a meaningful title if original is missing or just "Untitled Conversation"
  const getDisplayTitle = () => {
    // If we have a non-empty title from the database that's not the same as the summary, use it
    if (title && title.trim() !== "" && title !== "Untitled Conversation" && title !== summary) {
      return title;
    }
    
    // If title is too similar to summary, create a more distinct title
    if (title && summary && (summary.startsWith(title) || title.startsWith(summary.split('\n')[0]))) {
      if (displayConcepts && displayConcepts.length > 0) {
        // Use concepts instead if available
        if (displayConcepts.length === 1) {
          return `Discussion about ${displayConcepts[0]}`;
        } else if (displayConcepts.length === 2) {
          return `${displayConcepts[0]} and ${displayConcepts[1]} Discussion`;
        } else {
          return `${displayConcepts[0]}, ${displayConcepts[1]} & More`;
        }
      } else {
        return `Topic from ${formattedDate}`;
      }
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
    
    // If we have a summary, create a title that's different from the summary
    if (summary && summary.trim() !== "") {
      // Get the first sentence of the summary
      const firstSentence = summary.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
      
      if (firstSentence && firstSentence.length > 5) {
        // If summary is short, prefix it with "Topic: " to differentiate
        if (firstSentence.length <= 50) {
          return `Topic: ${firstSentence}`;
        }
        
        // For longer summaries, take just the first 40 chars + ellipsis
        return `${firstSentence.substring(0, 40)}...`;
      }
    }
    
    // Last resort: Date-based title
    return `Conversation from ${formattedDate}`;
  };

  // Handle conversation deletion
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this conversation?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been successfully removed",
        duration: 3000,
      });

      // Call the callback if provided
      if (onDelete) {
        onDelete(id);
      } else {
        // Refresh the page
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Ensure we have a valid ID for the link
  const conversationId = id || '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {conversationId && conversationId.trim() !== '' ? (
            <CardTitle className="text-xl">
              <Link href={`/conversation/${conversationId}`} className="hover:text-primary transition-colors cursor-pointer">
                {getDisplayTitle()}
              </Link>
            </CardTitle>
          ) : (
            <CardTitle className="text-xl">{getDisplayTitle()}</CardTitle>
          )}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              {formattedDate}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Display the summary prominently */}
        {summary && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1.5">
          {displayConcepts.slice(0, 4).map((concept, index) => {
            // Find the concept ID if available
            const conceptObj = concepts.find(c => c.title === concept);
            const conceptId = conceptObj?.id;
            
            return conceptId ? (
              <Link key={index} href={`/concept/${conceptId}`}>
                <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer transition-colors">
                  {concept}
                </Badge>
              </Link>
            ) : (
              <Badge key={index} variant="secondary" className="text-xs">
                {concept}
              </Badge>
            );
          })}
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
        {conversationId && conversationId.trim() !== '' ? (
          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <Link href={`/conversation/${conversationId}`}>
              View details
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="ml-auto" disabled>
            View details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
