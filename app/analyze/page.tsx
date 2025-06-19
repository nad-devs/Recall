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
import { YouTubeLinkPrompt } from "@/components/youtube-link-prompt"
import { Button } from "@/components/ui/button"
import { useAnalyzePage } from "@/hooks/useAnalyzePage"

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

    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setShowAddConceptCard,
    setEditConceptMode,

    // Handlers
    handleAnalyze,
    handleSaveConversation,
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,
    handleUserInfoProvided,
    handleUserInfoModalClose,
    handleYouTubeLinkAdd,
    handleYouTubeLinkSkip,
  } = useAnalyzePage()

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
                <Button onClick={handleSaveConversation} disabled={isSaving}>
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
            /* Grid layout for analysis results - Concepts list on left, insights on right */
            <div className="grid grid-cols-1 lg:grid-cols-[30%_65%] gap-[5%]">
              {/* Left column - Identified Concepts (30% width) */}
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

              {/* Right column - Concept details (65% width) */}
              <div className="space-y-6">
                <PersonalInsightsView
                  selectedConcept={selectedConcept}
                  showYouTubeLinkPrompt={showYouTubeLinkPrompt}
                  onYouTubeLinkAdd={handleYouTubeLinkAdd}
                  onYouTubeLinkSkip={handleYouTubeLinkSkip}
                />
              </div>
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
        </div>
      </PageTransition>
    </AuthGuard>
  )
}

export default AnalyzePage

