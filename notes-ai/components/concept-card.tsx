"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowRight, BookOpen } from "lucide-react"

interface ConceptCardProps {
  concept: any
  showDescription?: boolean
}

export function ConceptCard({ concept, showDescription = false }: ConceptCardProps) {
  const { id, title, category, notes, discussedInConversations, needsReview } = concept

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${needsReview ? "border-amber-300 dark:border-amber-700" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-2">
            {needsReview && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
              >
                Needs Review
              </Badge>
            )}
            <Badge>{category}</Badge>
          </div>
        </div>
        {showDescription && notes && (
          <CardDescription className="line-clamp-2">{notes.substring(0, 120)}...</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <MessageSquare className="mr-1 h-3 w-3" />
          Discussed in {discussedInConversations.length} conversation{discussedInConversations.length !== 1 ? "s" : ""}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/review/${id}`}>
            <BookOpen className="mr-1 h-3 w-3" />
            Review
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/concepts/${id}`}>
            View concept
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
