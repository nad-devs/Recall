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
        <div className="container mx-auto p-4 max-w-7xl">
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

