"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PageTransition>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/conversations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversation Details</h1>
            <p className="text-muted-foreground">This feature is coming soon!</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Conversation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>This page will show detailed conversation analysis and extracted concepts.</p>
            <p className="mt-2">For now, you can use the main analyze page to process your conversations.</p>
            <Button asChild className="mt-4">
              <Link href="/analyze">Go to Analyzer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
