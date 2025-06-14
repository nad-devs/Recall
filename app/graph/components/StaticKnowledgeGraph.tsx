import React, { useState, useMemo } from 'react'
import { EnhancedConcept, processEnhancedConcept } from '../types'
import { ChevronDown, ChevronRight, Star, Clock, TrendingUp, BookOpen } from 'lucide-react'
import SearchBar from './SearchBar'

interface StaticKnowledgeGraphProps {
  concepts: EnhancedConcept[]
  onConceptClick: (concept: EnhancedConcept) => void
  interviewMode: boolean
  className?: string
}

export const StaticKnowledgeGraph: React.FC<StaticKnowledgeGraphProps> = ({
  concepts,
  onConceptClick,
  interviewMode,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Category colors matching your design
  const categoryColors = {
    'Machine Learning': '#EC4899',
    'LeetCode Problems': '#F59E0B', 
    'System Design': '#EF4444',
    'Algorithms': '#F97316',
    'Data Structures': '#14B8A6',
    'Frontend': '#3B82F6',
    'Backend': '#6366F1',
    'Database': '#06B6D4',
    'Cloud Engineering': '#84CC16',
    'NLP': '#8B5CF6',
    'default': '#6B7280'
  }

  // Filter and group concepts
  const { filteredConcepts, groupedConcepts } = useMemo(() => {
    let filtered = concepts

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = concepts.filter(concept => 
        concept.title.toLowerCase().includes(query) ||
        concept.category.toLowerCase().includes(query) ||
        concept.summary?.toLowerCase().includes(query) ||
        // Check if it's a category filter
        concept.category.split(' > ')[0].toLowerCase() === query
      )
    }

    // Group by main category
    const grouped = filtered.reduce((groups, concept) => {
      const mainCategory = concept.category.split(' > ')[0] || 'Other'
      if (!groups[mainCategory]) {
        groups[mainCategory] = []
      }
      groups[mainCategory].push(concept)
      return groups
    }, {} as Record<string, EnhancedConcept[]>)

    // Sort categories and concepts within each category
    const sortedGrouped = Object.keys(grouped)
      .sort()
      .reduce((acc, category) => {
        acc[category] = grouped[category].sort((a, b) => a.title.localeCompare(b.title))
        return acc
      }, {} as Record<string, EnhancedConcept[]>)

    return { filteredConcepts: filtered, groupedConcepts: sortedGrouped }
  }, [concepts, searchQuery])

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  const getConceptStatus = (concept: EnhancedConcept) => {
    const processed = processEnhancedConcept(concept)
    
    if (interviewMode) {
      // Interview mode priorities
      if (concept.masteryLevel === 'Expert' || concept.learningProgress > 90) return 'ready'
      if (concept.practiceCount === 0 || !concept.lastPracticed) return 'needs-practice'
      if (concept.learningProgress < 50) return 'high-priority'
      return 'stale'
    } else {
      // Learning mode
      if (concept.learningProgress > 80) return 'mastered'
      if (concept.learningProgress > 40) return 'learning'
      return 'struggling'
    }
  }

  const getStatusColor = (status: string, mode: boolean) => {
    if (mode) { // Interview mode
      switch (status) {
        case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'needs-practice': return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'high-priority': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        case 'stale': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    } else { // Learning mode
      switch (status) {
        case 'mastered': return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'learning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'struggling': return 'bg-red-500/20 text-red-400 border-red-500/30'
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    }
  }

  return (
    <div className={`w-full h-full overflow-auto ${className}`}>
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          concepts={concepts}
          mode={interviewMode ? 'interview' : 'learning'}
        />
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Showing {filteredConcepts.length} of {concepts.length} concepts
            {searchQuery && ` for "${searchQuery}"`}
          </span>
          <span className="text-slate-400">
            {Object.keys(groupedConcepts).length} categories
          </span>
        </div>
      </div>

      {/* Concept Grid by Category */}
      <div className="p-6 space-y-8">
        {Object.entries(groupedConcepts).map(([category, categoryConcepts]) => {
          const isCollapsed = collapsedCategories.has(category)
          const categoryColor = categoryColors[category as keyof typeof categoryColors] || categoryColors.default

          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  )}
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {category}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>({categoryConcepts.length})</span>
                </div>
              </div>

              {/* Concepts Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-6">
                  {categoryConcepts.map((concept) => {
                    const processed = processEnhancedConcept(concept)
                    const status = getConceptStatus(concept)
                    const statusColor = getStatusColor(status, interviewMode)

                    return (
                      <div
                        key={concept.id}
                        onClick={() => onConceptClick(concept)}
                        className="group relative bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                      >
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs border ${statusColor}`}>
                          {status.replace('-', ' ')}
                        </div>

                        {/* Concept Title */}
                        <h3 className="text-white font-medium mb-2 pr-16 leading-tight">
                          {concept.title}
                        </h3>

                        {/* Summary */}
                        {concept.summary && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {concept.summary}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {concept.learningProgress !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Progress</span>
                              <span>{concept.learningProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${concept.learningProgress}%`,
                                  backgroundColor: categoryColor
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            {concept.bookmarked && (
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            )}
                            {concept.practiceCount > 0 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{concept.practiceCount}</span>
                              </div>
                            )}
                            {processed.videoResourcesParsed?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{processed.videoResourcesParsed.length}</span>
                              </div>
                            )}
                          </div>
                          
                          {concept.lastPracticed && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(concept.lastPracticed).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Hover Effect */}
                        <div 
                          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                          style={{ 
                            background: `linear-gradient(135deg, ${categoryColor}10, transparent)`,
                            border: `1px solid ${categoryColor}30`
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredConcepts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-slate-400 mb-4">
            <BookOpen className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg">No concepts found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  )
} 