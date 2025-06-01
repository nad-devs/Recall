"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Search, ArrowLeft, MessageSquare, Book, Zap, Brain, Settings, Bug } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: "what-is-recall",
    question: "What is Recall and how does it work?",
    answer: "Recall is an AI-powered learning tool that extracts, organizes, and connects concepts from your conversations, notes, and study materials. Simply paste your content, and our AI will identify key concepts, categorize them, and create a structured knowledge base with detailed explanations, examples, and relationships between ideas.",
    category: "Getting Started",
    tags: ["basics", "overview", "how-it-works"]
  },
  {
    id: "what-content-types",
    question: "What types of content can I analyze?",
    answer: "Recall works with various content types including: study notes, conversation transcripts, documentation, coding tutorials, business articles, academic papers, meeting notes, and learning materials. It handles both technical content (programming, algorithms) and non-technical content (business, psychology, finance, etc.).",
    category: "Getting Started",
    tags: ["content-types", "supported-formats", "technical", "non-technical"]
  },
  {
    id: "how-to-start",
    question: "How do I get started with Recall?",
    answer: "Getting started is simple: 1) Sign up with your email or Google account, 2) Go to the Analyze page, 3) Paste or type your content, 4) Click 'Extract Concepts' and wait for the AI analysis, 5) Review and save the extracted concepts to build your knowledge base.",
    category: "Getting Started",
    tags: ["tutorial", "first-steps", "signup"]
  },
  
  // Using the App
  {
    id: "concept-extraction-quality",
    question: "Why do some concept extractions seem incomplete or inconsistent?",
    answer: "Concept extraction quality can vary based on content type and clarity. Technical content (like coding problems) often gets more detailed analysis with implementation details, while general topics might focus more on key principles. If you notice missing details, try providing more context or breaking complex topics into smaller segments. We're continuously improving our AI models.",
    category: "Using the App",
    tags: ["quality", "technical-content", "improvement", "ai-models"]
  },
  {
    id: "editing-concepts",
    question: "Can I edit or improve the extracted concepts?",
    answer: "Absolutely! You can edit concept titles, categories, summaries, key points, and detailed explanations. You can also add your own notes, examples, and code snippets. This helps personalize your learning and improve the knowledge base for your specific needs.",
    category: "Using the App",
    tags: ["editing", "customization", "improvement"]
  },
  {
    id: "categorization-system",
    question: "How does the categorization system work?",
    answer: "Recall uses 130+ predefined categories covering technical and non-technical domains. The AI automatically suggests the most appropriate category, but you can always change it. Categories help organize your knowledge and make it easier to find related concepts later.",
    category: "Using the App",
    tags: ["categories", "organization", "ai-suggestions"]
  },
  {
    id: "concept-relationships",
    question: "How are concept relationships determined?",
    answer: "The AI analyzes semantic similarities, shared themes, and contextual connections between concepts. It creates bidirectional links (if A relates to B, then B relates to A) and suggests connections across different conversations. You can also manually add or remove relationships.",
    category: "Using the App",
    tags: ["relationships", "connections", "semantic-analysis"]
  },
  
  // Technical Issues
  {
    id: "slow-analysis",
    question: "Why is concept extraction taking a long time?",
    answer: "Analysis time depends on content length and complexity. Longer texts take more time as the AI needs to process more information. If extraction is consistently slow, try breaking large texts into smaller chunks (2000-3000 words max) or check your internet connection.",
    category: "Technical Issues",
    tags: ["performance", "speed", "troubleshooting"]
  },
  {
    id: "analysis-failed",
    question: "What should I do if concept extraction fails?",
    answer: "If extraction fails: 1) Check your internet connection, 2) Try with shorter text (under 3000 words), 3) Remove any special characters or formatting that might cause issues, 4) Refresh the page and try again. If the problem persists, contact support with details about the content you were analyzing.",
    category: "Technical Issues",
    tags: ["errors", "failures", "troubleshooting", "support"]
  },
  {
    id: "missing-concepts",
    question: "Why weren't all important concepts extracted?",
    answer: "The AI prioritizes the most significant concepts to avoid information overload. If important concepts are missing: 1) Make sure they're clearly explained in your text, 2) Try rephrasing or adding more context, 3) Manually add missing concepts using the 'Add Concept' feature, 4) Break complex topics into separate analysis sessions.",
    category: "Technical Issues",
    tags: ["missing-concepts", "ai-limitations", "manual-addition"]
  },
  
  // Account & Data
  {
    id: "data-privacy",
    question: "Is my data secure and private?",
    answer: "Yes, your data security is our priority. We use industry-standard encryption for data transmission and storage. Your content is only processed to extract concepts and is not used for training AI models or shared with third parties. You can delete your data at any time.",
    category: "Account & Data",
    tags: ["privacy", "security", "data-protection"]
  },
  {
    id: "usage-limits",
    question: "Are there usage limits or costs?",
    answer: "Recall is currently free to use with generous daily limits. We track usage to ensure fair access for all users. If you need higher limits for heavy usage, contact us about potential enterprise options. We'll always notify users well in advance of any changes to pricing or limits.",
    category: "Account & Data",
    tags: ["limits", "pricing", "free", "enterprise"]
  },
  {
    id: "export-data",
    question: "Can I export or backup my concepts?",
    answer: "Yes! You can export your concepts and conversations in various formats. Go to Settings > Export Data to download your knowledge base. This ensures you always have access to your learning progress and can use it with other tools if needed.",
    category: "Account & Data",
    tags: ["export", "backup", "data-portability"]
  },
  
  // Features & Functionality
  {
    id: "code-snippets",
    question: "How does code snippet extraction work?",
    answer: "For technical content, Recall automatically extracts and formats code examples, preserving syntax highlighting and structure. It identifies the programming language and provides context about what the code does. You can edit, add, or remove code snippets as needed.",
    category: "Features & Functionality",
    tags: ["code", "programming", "technical-content", "syntax-highlighting"]
  },
  {
    id: "search-functionality",
    question: "How can I find specific concepts later?",
    answer: "Use the search feature on your dashboard or in the concepts section. You can search by title, category, or content. The search is semantic, meaning it understands context and related terms, not just exact keyword matches.",
    category: "Features & Functionality",
    tags: ["search", "semantic-search", "discovery"]
  },
  {
    id: "mobile-support",
    question: "Does Recall work on mobile devices?",
    answer: "Yes! Recall is fully responsive and works on smartphones and tablets. The interface adapts to smaller screens while maintaining full functionality. For the best experience on mobile, we recommend using the latest version of Chrome, Safari, or Edge.",
    category: "Features & Functionality",
    tags: ["mobile", "responsive", "cross-platform"]
  },
  
  // Troubleshooting
  {
    id: "login-issues",
    question: "I'm having trouble signing in. What should I do?",
    answer: "For login issues: 1) Clear your browser cache and cookies, 2) Try an incognito/private window, 3) Make sure you're using the correct email address, 4) For Google sign-in, ensure you're logged into the correct Google account, 5) Check if your email provider is blocking our verification emails.",
    category: "Troubleshooting",
    tags: ["login", "authentication", "google-signin", "email-verification"]
  },
  {
    id: "browser-compatibility",
    question: "Which browsers are supported?",
    answer: "Recall works best on modern browsers: Chrome (recommended), Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience. Internet Explorer is not supported.",
    category: "Troubleshooting",
    tags: ["browsers", "compatibility", "requirements"]
  },
  {
    id: "performance-tips",
    question: "How can I improve performance and reliability?",
    answer: "For the best experience: 1) Use shorter text chunks (under 3000 words), 2) Ensure stable internet connection, 3) Close unnecessary browser tabs, 4) Clear browser cache occasionally, 5) Use supported browsers, 6) Avoid very long single-line texts without breaks.",
    category: "Troubleshooting",
    tags: ["performance", "optimization", "best-practices"]
  }
]

const categories = [...new Set(faqData.map(item => item.category))]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started":
        return <Book className="w-4 h-4" />
      case "Using the App":
        return <Brain className="w-4 h-4" />
      case "Technical Issues":
        return <Bug className="w-4 h-4" />
      case "Account & Data":
        return <Settings className="w-4 h-4" />
      case "Features & Functionality":
        return <Zap className="w-4 h-4" />
      case "Troubleshooting":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Book className="w-4 h-4" />
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about using Recall
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("All")}
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-1"
              >
                {getCategoryIcon(category)}
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No FAQs found matching your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFAQs.map(item => (
              <Card key={item.id} className="transition-all duration-200 hover:shadow-md">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(item.category)}
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium text-left">
                          {item.question}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {expandedItems.has(item.id) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                {expandedItems.has(item.id) && (
                  <CardContent className="pt-0">
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {item.answer}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/dashboard?feedback=true">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
} 