import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Brain } from "lucide-react"
import { ConversationCard } from "@/components/conversation-card"
import { prisma } from "@/lib/prisma"

export default async function Dashboard() {
  // Get real data from the database
  const conversationsCount = await prisma.conversation.count();
  const conceptsCount = await prisma.concept.count();
  
  // Count unique categories
  const uniqueCategories = await prisma.concept.groupBy({
    by: ['category'],
  });
  const categoriesCount = uniqueCategories.length;
  
  // Get concepts that need review (lower confidence score)
  const conceptsToReview = await prisma.concept.findMany({
    where: {
      confidenceScore: {
        lt: 0.7, // Concepts with confidence score less than 0.7 need review
      },
    },
    take: 3,
    orderBy: {
      lastUpdated: 'desc',
    },
    include: {
      conversation: true,
      occurrences: true,
    }
  });

  // Get recent conversations
  const recentConversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      concepts: true,
    },
    take: 5,
  });

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-8">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Dashboard</h1>
          <p className="text-muted-foreground">Track your learning journey and explore your knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" asChild className="shadow-sm">
            <Link href="/analyze">
              <Brain className="mr-2 h-4 w-4" />
              Analyze Conversation
            </Link>
          </Button>
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/concepts">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Concepts
            </Link>
          </Button>
        </div>
      </div>

      {/* Welcome card */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">Welcome back!</h2>
            <p className="text-muted-foreground mb-4">
              You've analyzed {conversationsCount} conversations and learned about {conceptsCount} concepts across {categoriesCount} categories.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="px-2 py-1">
                <BookOpen className="mr-1 h-3 w-3" /> {conceptsCount} Concepts
              </Badge>
              <Badge variant="secondary" className="px-2 py-1">
                <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 9h8m-8 4h6m-6 4h4M5 7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {conversationsCount} Conversations
              </Badge>
              <Badge variant="secondary" className="px-2 py-1">
                <svg className="mr-1 h-3 w-3 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v4m0 4h.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {conceptsToReview.length} concepts need review
              </Badge>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-muted/50 flex items-center justify-center">
              <Brain className="h-14 w-14 md:h-16 md:w-16 text-foreground/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <svg className="mr-2 h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Recent Conversations
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/conversation">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentConversations.map((conversation) => {
              // Parse the summary to get a concise title and description
              const summary = conversation.summary || '';
              
              // For title: Use first sentence/phrase if it's not too long
              const firstSentence = summary.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
              const title = firstSentence && firstSentence.length < 60 
                ? firstSentence 
                : conversation.summary.split('\n')[0] || 'Untitled Conversation';
              
              // Format conversation data for ConversationCard
              const conversationData = {
                id: conversation.id,
                title: title,
                summary: summary,
                date: conversation.createdAt.toISOString(),
                concepts: conversation.concepts.map(concept => ({
                  id: concept.id,
                  title: concept.title
                }))
              };
              
              return (
                <ConversationCard key={conversation.id} conversation={conversationData} />
              );
            })}
          </div>
        </div>

        {/* Concepts to Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <svg className="mr-2 h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v4m0 4h.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Concepts to Review
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/concepts">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {conceptsToReview.map((concept) => {
              // Format concept data for ConceptCard
              const discussedInConversations = concept.occurrences.map(occ => occ.conversationId);
              const conceptData = {
                id: concept.id,
                title: concept.title,
                category: concept.category,
                notes: concept.summary,
                discussedInConversations: discussedInConversations,
                needsReview: true
              };
              
              // For concepts to review, we use the same ConversationCard but format the data properly
              return <ConversationCard 
                key={concept.id} 
                conversation={{
                  id: concept.id,
                  title: concept.title,
                  summary: concept.summary,
                  date: concept.lastUpdated.toISOString(),
                  concepts: [],
                  conceptMap: [concept.category], // Use conceptMap to show the category
                  metadata: {
                    conceptCount: 1
                  }
                }}
              />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
