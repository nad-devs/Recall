"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowRight } from "lucide-react"

interface DashboardConceptCardProps {
  concept: {
    id: string
    title: string
    summary: string
    category: string
  }
}

export function DashboardConceptCard({ concept }: DashboardConceptCardProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, [role="button"]');
    
    if (isInteractiveElement) {
      return; // Let the interactive element handle the click
    }
    
    // Navigate to concept view on normal click
    e.preventDefault();
    router.push(`/concept/${concept.id}`);
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow border-amber-300 dark:border-amber-700 border-l-4 cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{concept.title}</CardTitle>
          <Badge 
            variant="outline"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
          >
            Needs Review
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{concept.summary}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {concept.category}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/review/${concept.id}`}>
            <BookOpen className="mr-1 h-3 w-3" />
            Review
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/concept/${concept.id}`}>
            View concept
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 