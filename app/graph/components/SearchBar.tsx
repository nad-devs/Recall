import React from 'react';
import { Search, Filter, Target, BookOpen } from 'lucide-react';
import { EnhancedConcept } from '../types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  concepts: EnhancedConcept[];
  mode: 'learning' | 'interview';
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, concepts, mode }) => {
  const categories = [...new Set(concepts.map(c => c.category.split(' > ')[0]))];
  
  const modeSpecificFilters = mode === 'interview' 
    ? ['High Priority', 'Needs Practice', 'Ready', 'Stale']
    : ['Mastered', 'Learning', 'Struggling'];

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === 'learning' 
            ? "Search concepts, explore connections..." 
            : "Search topics to practice, review priorities..."
          }
          className="w-full pl-12 pr-12 py-3 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {mode === 'learning' ? (
            <BookOpen className="w-5 h-5 text-indigo-400" />
          ) : (
            <Target className="w-5 h-5 text-red-400" />
          )}
          <Filter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className="px-3 py-1 bg-slate-800/30 hover:bg-slate-700/50 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-all"
          >
            {category}
          </button>
        ))}
        <div className="w-px h-4 bg-white/20 mx-2" />
        {modeSpecificFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => onChange(filter.toLowerCase())}
            className={`px-3 py-1 border rounded-full text-xs transition-all ${
              mode === 'learning'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar; 