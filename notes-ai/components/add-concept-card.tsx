"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface AddConceptCardProps {
  onAddConcept: (title: string) => Promise<void>
  isCreating: boolean
}

export function AddConceptCard({ onAddConcept, isCreating }: AddConceptCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const router = useRouter()

  const handleAddClick = () => {
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    try {
      await onAddConcept(title)
      setTitle("")
      setIsEditing(false)
    } catch (error) {
      console.error("Error adding concept:", error)
    }
  }

  const handleCancel = () => {
    setTitle("")
    setIsEditing(false)
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-dashed h-full flex flex-col justify-between">
      {isEditing ? (
        <>
          <CardHeader className="pb-2">
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                placeholder="Enter concept title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                disabled={isCreating}
              />
            </form>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            {isCreating ? (
              <div className="flex justify-center py-4">
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
                  className="h-6 w-6 animate-spin text-primary"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
            ) : (
              <p>
                Enter a title for your new concept. <br />
                AI will generate content automatically.
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Concept"}
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center h-full cursor-pointer" onClick={handleAddClick}>
            <div className="flex flex-col items-center py-10">
              <PlusCircle className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground font-medium">Add New Concept</p>
            </div>
          </div>
        </>
      )}
    </Card>
  )
} 