import {
  BookOpen,
  Brain,
  Code,
  Lightbulb,
} from "lucide-react"
import { Concept, ConversationAnalysis } from "@/lib/types/conversation"
import { useState } from "react"
import { YouTubeLinkPrompt } from "@/components/youtube-link-prompt"

interface PersonalInsightsViewProps {
  analysisResult: ConversationAnalysis | null
  selectedConcept: Concept | null
  showYouTubeLinkPrompt: boolean
  onYouTubeLinkAdd: (link: string) => void
  onYouTubeLinkSkip: () => void
  analysisMode: "deepdive" | "recall"
  setAnalysisMode: (mode: "deepdive" | "recall") => void
}

export function PersonalInsightsView({
  analysisResult,
  selectedConcept,
  showYouTubeLinkPrompt,
  onYouTubeLinkAdd,
  onYouTubeLinkSkip,
  analysisMode,
  setAnalysisMode,
}: PersonalInsightsViewProps) {
  const conceptToDisplay = analysisResult?.concepts.find(c => c.id === selectedConcept?.id) || selectedConcept;

  if (!conceptToDisplay) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-8 text-center border border-slate-700 h-full flex flex-col justify-center">
        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <h4 className="text-lg font-semibold text-slate-200 mb-2">
          Select a Concept
        </h4>
        <p className="text-slate-400 mb-4">
          Choose a concept from the list to see the details here.
        </p>
      </div>
    )
  }

  const concept = conceptToDisplay as Concept;

  return (
    <div className="space-y-6">
      {showYouTubeLinkPrompt && (
        <YouTubeLinkPrompt
          onAddLink={onYouTubeLinkAdd}
          onSkip={onYouTubeLinkSkip}
        />
      )}

      {/* Header with title and mode toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-100">{concept.title}</h3>
        
        {/* Mode Toggle Slider */}
        <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setAnalysisMode("deepdive")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              analysisMode === "deepdive"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Deep Dive</span>
          </button>
          <button
            onClick={() => setAnalysisMode("recall")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              analysisMode === "recall"
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <Brain className="w-3 h-3" />
            <span>Quick Recall</span>
          </button>
        </div>
      </div>

      {/* Content based on mode */}
      {analysisMode === "recall" ? (
        // Quick Recall Mode - Practical Summary
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/30">
          <div className="space-y-6">
            {/* Key Takeaway */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3">Key Takeaway</h4>
              <blockquote className="text-slate-300 italic text-lg leading-relaxed">
                {concept.keyTakeaway || "A core insight about this concept will appear here once analyzed."}
              </blockquote>
            </div>

            {/* Analogy */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-200 mb-3 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Think of it like:
              </h4>
              <p className="text-slate-300 italic">
                {concept.analogy || "An easy-to-understand analogy will be provided here."}
              </p>
            </div>

            {/* Practical Tips */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-200 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Practical Tips
              </h4>
              <ul className="space-y-2">
                {concept.practicalTips && concept.practicalTips.length > 0 ? (
                  concept.practicalTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 text-slate-300">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 text-sm">Practical tips will be generated during analysis.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // Deep Dive Mode - Full Details
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-slate-800/30 rounded-lg p-6 border-l-4 border-blue-500">
            <h4 className="font-semibold text-slate-200 mb-3">Summary</h4>
            <p className="text-slate-300 leading-relaxed">
              {concept.summary || "Detailed summary will appear here."}
            </p>
          </div>

          {/* Details */}
          <div className="bg-slate-800/30 rounded-lg p-6">
            <h4 className="font-semibold text-slate-200 mb-3">Details</h4>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {concept.details || "In-depth details will appear here."}
            </p>
          </div>

          {/* Details and Key Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Points */}
            <div className="bg-slate-800/30 rounded-lg p-6">
              <h4 className="font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <span>Key Points</span>
              </h4>
              <ul className="space-y-3">
                {concept.keyPoints && concept.keyPoints.length > 0 ? (
                  concept.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 text-slate-300">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Key points will be extracted during analysis.</li>
                )}
              </ul>
            </div>

            {/* Examples */}
            <div className="bg-slate-800/30 rounded-lg p-6">
              <h4 className="font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-green-400" />
                <span>Examples</span>
              </h4>
              <div className="space-y-3">
                {concept.examples && concept.examples.length > 0 ? (
                  concept.examples.map((example: string, index: number) => (
                    <div key={index} className="bg-green-900/20 border border-green-700/30 rounded-md p-3">
                      <span className="text-green-300 text-sm">{example}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">Examples will be provided during analysis.</p>
                )}
              </div>
            </div>
          </div>

          {/* Code Snippets */}
          {concept.code_examples && concept.code_examples.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-6">
              <h4 className="font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5 text-purple-400" />
                <span>Code Examples</span>
              </h4>
              <div className="space-y-4">
                {concept.code_examples.map((snippet, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">{snippet.description}</span>
                      <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                        {snippet.language}
                      </span>
                    </div>
                    <pre className="text-sm text-slate-300 overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 