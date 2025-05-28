"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/page-transition"
import { useAnalyzePage } from "@/hooks/useAnalyzePage"
import { AnalyzingView } from "@/components/analyze/AnalyzingView"
import { InputView } from "@/components/analyze/InputView"
import { ConceptsList } from "@/components/analyze/ConceptsList"
import { ResultsView } from "@/components/analyze/ResultsView"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ApiKeyModal } from "@/components/api-key-modal"
import { UserInfoModal } from "@/components/ui/user-info-modal"
import { AuthGuard } from "@/components/auth-guard"

function AnalyzePage() {
  const {
    // State
    conversationText,
    analysisResult,
    selectedConcept,
    isAnalyzing,
    searchQuery,
    isEditingCategory,
    editCategoryValue,
    isAddingConcept,
    showAddConceptCard,
    showAnimation,
    selectedTab,
    isSaving,
    saveError,
    isDeleting,
    editConceptMode,
    editConceptTitle,
    editConceptCategory,
    existingConcepts,
    showConceptConfirmation,
    originalSaveData,
    discoveredConcepts,
    analysisStage,
    filteredConcepts,
    loadingConcepts,
    conceptMatches,
    showConceptMatchDialog,
    pendingAnalysisResult,
    isProcessingMatches,
    showConversationSaveDialog,
    updatedConceptsCount,
    showApiKeyModal,
    usageData,
    showUserInfoModal,

    // Setters
    setConversationText,
    setSelectedConcept,
    setSearchQuery,
    setEditCategoryValue,
    setShowAddConceptCard,
    setSelectedTab,
    setIsEditingCategory,
    setEditConceptMode,
    setEditConceptTitle,
    setEditConceptCategory,

    // Handlers
    handleAnalyze,
    handleCategoryUpdate,
    handleSaveConversation,
    handleAddConcept,
    handleDeleteConcept,
    handleDeleteCodeSnippet,
    handleConfirmConceptUpdates,
    handleCancelConceptUpdates,
    
    // Additional functions
    addConceptToCurrentAnalysis,
    
    // Concept matching functions
    handleConceptMatchDecision,
    finalizeSaveWithMatches,
    
    // Conversation save functions
    handleSaveConversationDecision,
    handleSkipSavingDecision,
    
    // API key modal functions
    handleApiKeySet,
    handleApiKeyModalClose,
    getRemainingConversations,
    
    // User info modal functions
    handleUserInfoProvided,
    handleUserInfoModalClose,
  } = useAnalyzePage()

  return (
    <AuthGuard>
      <PageTransition>
        <div className="container mx-auto p-4 max-w-6xl">
          {/* Header with back button and title */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="flex items-center text-sm font-medium">
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
              <h1 className="text-2xl font-bold">Analyze Conversation</h1>
              <ThemeToggle />
            </div>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Input and concepts list */}
            <div className="lg:col-span-1 space-y-6">
              {!analysisResult ? (
                <InputView
                  conversationText={conversationText}
                  setConversationText={setConversationText}
                  handleAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              ) : (
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
              )}
            </div>

            {/* Right column - Analysis results or analyzing view */}
            <div className="lg:col-span-2">
              {isAnalyzing ? (
                <AnalyzingView
                  conversationText={conversationText}
                  discoveredConcepts={discoveredConcepts}
                  analysisStage={analysisStage}
                />
              ) : analysisResult ? (
                <ResultsView
                  analysisResult={analysisResult}
                  selectedConcept={selectedConcept}
                  selectedTab={selectedTab}
                  setSelectedTab={setSelectedTab}
                  showAddConceptCard={showAddConceptCard}
                  setShowAddConceptCard={setShowAddConceptCard}
                  editConceptMode={editConceptMode}
                  setEditConceptMode={setEditConceptMode}
                  editConceptTitle={editConceptTitle}
                  setEditConceptTitle={setEditConceptTitle}
                  editConceptCategory={editConceptCategory}
                  setEditConceptCategory={setEditConceptCategory}
                  isEditingCategory={isEditingCategory}
                  setIsEditingCategory={setIsEditingCategory}
                  editCategoryValue={editCategoryValue}
                  setEditCategoryValue={setEditCategoryValue}
                  isAddingConcept={isAddingConcept}
                  isSaving={isSaving}
                  saveError={saveError}
                  isDeleting={isDeleting}
                  showConceptConfirmation={showConceptConfirmation}
                  existingConcepts={existingConcepts}
                  handleSaveConversation={handleSaveConversation}
                  handleAddConcept={handleAddConcept}
                  handleDeleteConcept={handleDeleteConcept}
                  handleDeleteCodeSnippet={handleDeleteCodeSnippet}
                  handleCategoryUpdate={handleCategoryUpdate}
                  handleConfirmConceptUpdates={handleConfirmConceptUpdates}
                  handleCancelConceptUpdates={handleCancelConceptUpdates}
                  setSelectedConcept={setSelectedConcept}
                  addConceptToCurrentAnalysis={addConceptToCurrentAnalysis}
                  conceptMatches={conceptMatches}
                  showConceptMatchDialog={showConceptMatchDialog}
                  isProcessingMatches={isProcessingMatches}
                  handleConceptMatchDecision={handleConceptMatchDecision}
                  showConversationSaveDialog={showConversationSaveDialog}
                  updatedConceptsCount={updatedConceptsCount}
                  handleSaveConversationDecision={handleSaveConversationDecision}
                  handleSkipSavingDecision={handleSkipSavingDecision}
                />
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">No analysis yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Paste a conversation and click analyze to get started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

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

