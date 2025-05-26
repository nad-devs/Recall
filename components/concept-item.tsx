import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Tag } from "lucide-react"

interface CodeSnippet {
  id: string
  language: string
  description?: string
  code: string
}

/**
 * Interface defining the structure of a Concept item.
 * A Concept represents a learning or knowledge unit that can be categorized and tracked.
 */
interface ConceptProps {
  /** Unique identifier for the concept */
  id: string
  /** Display title of the concept */
  title: string
  /** Optional category the concept belongs to */
  category?: string
  /** Optional detailed summary of the concept */
  summary?: string
  /** Optional array of key points or single string of key points */
  keyPoints?: string[] | string
  /** Optional array of code snippets related to the concept */
  codeSnippets?: CodeSnippet[]
  /** Flag indicating if the concept needs review */
  needsReview?: boolean
}

interface ConceptItemProps {
  concept: ConceptProps
  showActions?: boolean
}

export function ConceptItem({ concept, showActions = true }: ConceptItemProps) {
  // Parse keyPoints if it's a string
  let keyPointsArray: string[] = [];
  if (typeof concept.keyPoints === 'string') {
    try {
      keyPointsArray = JSON.parse(concept.keyPoints);
    } catch (e) {
      keyPointsArray = [];
    }
  } else if (Array.isArray(concept.keyPoints)) {
    keyPointsArray = concept.keyPoints;
  }

  return (
    <Card className={`border-l-4 ${concept.needsReview ? 'border-amber-500' : 'border-primary'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{concept.title}</CardTitle>
            {concept.category && (
              <div className="mt-1">
                <Badge variant="outline" className="flex items-center">
                  <Tag className="mr-1 h-3 w-3" />
                  {concept.category}
                </Badge>
              </div>
            )}
          </div>
          {showActions && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/concept/${concept.id}`} className="flex items-center text-sm text-primary">
                View details
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {concept.summary && (
          <div className="text-sm">{concept.summary}</div>
        )}
        
        {keyPointsArray.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mt-2 mb-1">Key Points:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {keyPointsArray.slice(0, 3).map((point, idx) => (
                <li key={idx} className="text-sm">{point}</li>
              ))}
              {keyPointsArray.length > 3 && (
                <li className="text-sm text-muted-foreground italic">
                  + {keyPointsArray.length - 3} more points
                </li>
              )}
            </ul>
          </div>
        )}
        
        {concept.codeSnippets && concept.codeSnippets.length > 0 && (
          <div className="mt-2">
            <Badge variant="secondary" className="px-2 py-1">
              {concept.codeSnippets.length} code snippet{concept.codeSnippets.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 