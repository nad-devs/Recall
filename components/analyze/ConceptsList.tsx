"use client"

import { motion } from "framer-motion"
import { PlusCircle } from "lucide-react"
import { Concept } from '@/lib/types/conversation'
import { Spinner } from '@/components/ui/spinner'
import { SmartLearningDashboard } from '@/components/smart-learning/SmartLearningDashboard'

interface ConceptsListProps {
  filteredConcepts: Concept[]
  selectedConcept: Concept | null
  setSelectedConcept: (concept: Concept) => void
  setEditConceptMode: (mode: boolean) => void
  setShowAddConceptCard: (show: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadingConcepts?: string[]
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Backend":
      return (
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
          className="h-4 w-4 text-blue-500"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    case "Database":
      return (
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
          className="h-4 w-4 text-green-500"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    case "Frontend":
      return (
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
          className="h-4 w-4 text-purple-500"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m10 13-2 2 2 2" />
          <path d="m14 17 2-2-2-2" />
        </svg>
      )
    case "Machine Learning":
      return (
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
          className="h-4 w-4 text-red-500"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M15 2v2" />
          <path d="M15 20v2" />
          <path d="M2 15h2" />
          <path d="M2 9h2" />
          <path d="M20 15h2" />
          <path d="M20 9h2" />
          <path d="M9 2v2" />
          <path d="M9 20v2" />
        </svg>
      )
    default:
      return (
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
          className="h-4 w-4 text-gray-500"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
  }
}

export function ConceptsList({
  filteredConcepts,
  selectedConcept,
  setSelectedConcept,
  setEditConceptMode,
  setShowAddConceptCard,
  searchQuery,
  setSearchQuery,
  loadingConcepts = [],
}: ConceptsListProps) {
  return (
    <motion.div
      className="lg:col-span-1 space-y-4"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Search input */}
      <div className="relative">
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
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search concepts..."
          className="w-full pl-8 pr-4 py-2 text-sm rounded-md border border-input bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Spinner above concepts list */}
      {loadingConcepts.length > 0 && (
        <div className="flex items-center justify-center py-2">
          <Spinner className="mr-2" />
          <span>Adding concept{loadingConcepts.length > 1 ? 's' : ''}...</span>
        </div>
      )}

      {/* Concepts list */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="py-3 px-6">
          <h3 className="text-lg font-semibold flex items-center">
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
              className="mr-2 h-4 w-4 text-primary"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Identified Concepts
          </h3>
        </div>
        <div className="p-0">
          <div className="space-y-2 p-3">
            {filteredConcepts.map((concept, index) => (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <div className="flex items-center">
                  <button
                    className={`w-full justify-start text-left font-normal py-3 px-4 rounded-md hover:bg-muted transition-colors ${
                      selectedConcept?.id === concept.id ? "bg-muted font-medium" : ""
                    }`}
                    onClick={() => setSelectedConcept(concept)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5 flex-shrink-0">
                        {getCategoryIcon(concept.category)}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-medium truncate pr-2">{concept.title}</div>
                        <div className="text-sm text-muted-foreground mt-1 pr-2 line-clamp-2 break-words leading-tight">
                          {concept.summary?.substring(0, 120) || "No description available"}
                        </div>
                        
                        {/* Show enhanced features available */}
                        <div className="flex items-center gap-2 mt-2">
                          {(concept as any).keyTakeaway && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                              Quick Recall
                            </span>
                          )}
                          {(concept as any).codeSnippets && (concept as any).codeSnippets.length > 0 && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                              Code
                            </span>
                          )}
                          {(concept as any).keyPoints && (concept as any).keyPoints.length > 0 && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Details
                            </span>
                          )}
                        </div>
                        
                        {/* Show embedding-based insights */}
                        {concept.embeddingData && (
                          <div className="mt-2 space-y-1">
                            {/* Show potential duplicates */}
                            {concept.embeddingData.potentialDuplicates.length > 0 && (
                              <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Similar to "{concept.embeddingData.potentialDuplicates[0].title}"
                              </div>
                            )}
                            
                            {/* Show related concepts */}
                            {concept.embeddingData.relationships.length > 0 && (
                              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                                Related to {concept.embeddingData.relationships.length} concept{concept.embeddingData.relationships.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredConcepts.length === 0 && (
              <div className="px-3 py-6 text-center text-muted-foreground">
                No concepts match your search
              </div>
            )}

            {/* Add concept button */}
            <div className="border-t mt-2 pt-2">
              <button
                onClick={() => setShowAddConceptCard(true)}
                className="w-full justify-start text-left font-normal py-2 px-3 rounded-md hover:bg-muted text-primary"
              >
                <div className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  <span>Add Missing Concept</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Learning Dashboard */}
      <SmartLearningDashboard 
        userId={localStorage.getItem('userId') || 'default'} 
        compact={true}
        onSuggestionClick={(suggestion) => {
          // Handle suggestion click - could navigate or show details
          console.log('Smart suggestion clicked:', suggestion);
        }}
      />
    </motion.div>
  )
} 