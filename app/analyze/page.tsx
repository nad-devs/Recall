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
  } = useAnalyzePage()

  return (
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-black dark:text-white"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M6 10h2M6 14h2M16 10h2M16 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="absolute -top-1 -right-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-yellow-400"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with transitions */}
        {isAnalyzing ? (
          <AnalyzingView 
            conversationText={conversationText}
            discoveredConcepts={discoveredConcepts}
            analysisStage={analysisStage}
          />
        ) : analysisResult ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1"
          >
            {/* Sidebar with concept list */}
            <ConceptsList
              filteredConcepts={filteredConcepts}
              selectedConcept={selectedConcept}
              setSelectedConcept={setSelectedConcept}
              setEditConceptMode={setEditConceptMode}
              setShowAddConceptCard={setShowAddConceptCard}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loadingConcepts={loadingConcepts}
            />

            {/* Main content area */}
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
          </motion.div>
        ) : (
          <InputView
            conversationText={conversationText}
            setConversationText={setConversationText}
            handleAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={handleApiKeyModalClose}
          onApiKeySet={handleApiKeySet}
          conversationCount={usageData.conversationCount}
        />
      </div>
    </PageTransition>
  )
}

export default AnalyzePage

