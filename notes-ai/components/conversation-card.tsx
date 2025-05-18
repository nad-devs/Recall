"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"

interface ConversationCardProps {
  conversation: any
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const { id, title, summary, date, concepts } = conversation

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="outline" className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{summary}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1.5">
          {concepts.slice(0, 4).map((concept) => (
            <Badge key={concept.id} variant="secondary" className="text-xs">
              {concept.title}
            </Badge>
          ))}
          {concepts.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{concepts.length - 4} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="ghost" size="sm" className="ml-auto" asChild>
          <Link href={`/conversations/${id}`}>
            View details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
