"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/page-transition"
import { AnalyzingView } from "@/components/analyze/AnalyzingView"
import { InputView } from "@/components/analyze/InputView"
import { ConceptsList } from "@/components/analyze/ConceptsList"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ApiKeyModal } from "@/components/api-key-modal"
import { UserInfoModal } from "@/components/ui/user-info-modal"
import { AuthGuard } from "@/components/auth-guard"
import { PersonalInsightsView } from "@/components/analyze/PersonalInsightsView"
import { LearningJourneyView } from "@/components/analyze/LearningJourneyView"
import { YouTubeLinkPrompt } from "@/components/youtube-link-prompt"
import { Button } from "@/components/ui/button"
import { useAnalyzePage } from "@/hooks/useAnalyzePage"
import { CategoryDialogs } from "@/components/concepts-navigation/CategoryDialogs"
import { Concept } from "@/lib/types/conversation"
import { SimpleCategoryEditModal } from "@/components/analyze/SimpleCategoryEditModal"
import { useState, useEffect } from "react"

function AnalyzePage() {
  const {
    // State
    conversationText,
    analysisResult,
    selectedConcept,
    isAnalyzing,
    searchQuery,
    isSaving,
    analysisStage,
    discoveredConcepts,
    filteredConcepts,
    showApiKeyModal,
    usageData,
    showUserInfoModal,
    showYouTubeLinkPrompt,
    loadingConcepts,
    youtubeLink,
    learningJourneyAnalysis,
    isAnalyzingLearningJourney,
    analysisMode,
    showCategoryDialog,
    editingConcept,

    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setShowAddConceptCard,
    setEditConceptMode,
    setAnalysisMode,

    // Handlers
    handleAnalyze,
    handleSaveAnalysis,
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,
    handleUserInfoProvided,
    handleUserInfoModalClose,
    handleYouTubeLinkAdd,
    handleYouTubeLinkSkip,
    handleCategoryEdit,
    handleCategoryDialogClose,
    handleCategoryUpdate,
  } = useAnalyzePage()

  const [allCategories, setAllCategories] = useState<string[]>([])
  const [structuredCategories, setStructuredCategories] = useState<{ [key: string]: string[] }>({})

  useEffect(() => {
    // Fetch all unique categories for the dropdown
    if (analysisResult) {
      const uniqueCategories = [
        ...new Set(analysisResult.concepts.map(c => c.category.split(' > ')[0])),
      ]
      setAllCategories(uniqueCategories)
    }
  }, [analysisResult])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Assuming the backend runs on port 8000
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/structured-categories`);
        if (response.ok) {
          const data = await response.json();
          setStructuredCategories(data);
        } else {
          console.error("Failed to fetch structured categories:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching structured categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <AuthGuard>
      <PageTransition>
        <div className="container mx-auto p-4 max-w-7xl">
          {/* Header with back button and title */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="flex items-center text-sm font-medium"
            >
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
                className="h-4 w-4 mr-2"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Dashboard
            </Link>

            <div className="flex items-center space-x-4">
              {analysisResult && !isAnalyzing && (
                <Button onClick={handleSaveAnalysis} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Analysis"}
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Main content area */}
          {!analysisResult || isAnalyzing ? (
            /* Full width layout for input view and analyzing */
            <div className="w-full">
              {isAnalyzing ? (
                <AnalyzingView
                  conversationText={conversationText}
                  discoveredConcepts={discoveredConcepts}
                  analysisStage={analysisStage}
                />
              ) : (
                <InputView
                  conversationText={conversationText}
                  setConversationText={setConversationText}
                  handleAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  usageData={usageData}
                  remainingConversations={getRemainingConversations()}
                />
              )}
            </div>
          ) : (
            /* Grid layout for analysis results - Better proportions */
            <div className="grid grid-cols-1 lg:grid-cols-[25%_70%] gap-[5%]">
              {/* Left column - Concepts list (25% width) */}
              <div className="space-y-6">
                <ConceptsList
                  filteredConcepts={filteredConcepts}
                  selectedConcept={selectedConcept}
                  setSelectedConcept={setSelectedConcept}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  loadingConcepts={loadingConcepts}
                  setEditConceptMode={setEditConceptMode}
                  setShowAddConceptCard={setShowAddConceptCard}
                />
              </div>

              {/* Right column - Analysis results (70% width) */}
              <div className="space-y-6">
                <PersonalInsightsView
                  analysisResult={analysisResult}
                  selectedConcept={selectedConcept}
                  showYouTubeLinkPrompt={showYouTubeLinkPrompt}
                  onYouTubeLinkAdd={handleYouTubeLinkAdd}
                  onYouTubeLinkSkip={handleYouTubeLinkSkip}
                  analysisMode={analysisMode}
                  setAnalysisMode={setAnalysisMode}
                  onCategoryEdit={handleCategoryEdit}
                />
              </div>
            </div>
          )}

          {/* Learning Journey Analysis - Full width below main analysis */}
          {analysisResult && (
            <div className="mt-8">
              <LearningJourneyView
                analysis={learningJourneyAnalysis}
                isAnalyzing={isAnalyzingLearningJourney}
              />
            </div>
          )}

          {/* Modals */}
          <ApiKeyModal
            isOpen={showApiKeyModal}
            onClose={handleApiKeyModalClose}
            onApiKeySet={handleApiKeySet}
            conversationCount={usageData.conversationCount}
          />

          <UserInfoModal
            isOpen={showUserInfoModal}
            onClose={handleUserInfoModalClose}
            onSave={handleUserInfoProvided}
          />

          {editingConcept && (
            <SimpleCategoryEditModal
              isOpen={showCategoryDialog}
              onClose={handleCategoryDialogClose}
              onSave={async (conceptId, newCategory, subcategories) => {
                const finalCategory = [newCategory, ...subcategories].join(' > ');
                await handleCategoryUpdate(conceptId, finalCategory);
                handleCategoryDialogClose();
              }}
              concept={editingConcept}
              structuredCategories={structuredCategories}
            />
          )}
        </div>
      </PageTransition>
    </AuthGuard>
  )
}

export default AnalyzePage

