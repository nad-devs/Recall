import React, { useState, useRef, useEffect } from 'react';
import { Brain, Target, BookOpen, Zap, Search, Filter, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

// Types compatible with existing graph page
interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: Category;
  children: Category[];
  concepts: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface Concept {
  id: string;
  title: string;
  category: string;
  summary?: string;
  details?: string; // JSON string
  keyPoints?: string; // JSON string
  examples?: string; // JSON string
  relatedConcepts?: string; // JSON string - array of concept IDs
  relationships?: string; // JSON string
  confidenceScore?: number;
  masteryLevel?: string | null; // "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"
  learningProgress?: number; // 0-100%
  practiceCount?: number;
  lastPracticed?: Date | string | null;
  difficultyRating?: number | null; // 1-5 stars
  prerequisites?: string; // JSON string - array of concept IDs
  personalRating?: number | null;
  bookmarked?: boolean;
  tags?: string; // JSON string
  createdAt?: Date | string;
  categories?: Category[];
  // Additional fields from EnhancedConcept
  [key: string]: any;
}

interface KnowledgeCompanionProps {
  concepts: Concept[];
  categories: Category[];
  onConceptSelect?: (concept: Concept | null) => void;
}

// AI-powered abbreviation service
class AbbreviationService {
  private cache = new Map<string, string>();
  private pendingRequests = new Map<string, Promise<string>>();

  async getAbbreviation(title: string): Promise<string> {
    // Return immediately if short enough - increased threshold for less aggressive abbreviation
    if (title.length <= 25) return title;
    
    // Check cache first
    if (this.cache.has(title)) {
      return this.cache.get(title)!;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(title)) {
      return this.pendingRequests.get(title)!;
    }

    // Create new request
    const request = this.createAbbreviation(title);
    this.pendingRequests.set(title, request);
    
    try {
      const result = await request;
      this.cache.set(title, result);
      this.pendingRequests.delete(title);
      return result;
    } catch (error) {
      this.pendingRequests.delete(title);
      // Fallback to simple truncation
      return this.simpleTruncation(title);
    }
  }

  private async createAbbreviation(title: string): Promise<string> {
    const prompt = `Create a concise abbreviation or short form for this technical concept that would fit well in a knowledge graph node. Keep it under 12 characters but still meaningful and recognizable.

Concept: "${title}"

Rules:
- Use common technical abbreviations when possible (ML, AI, API, etc.)
- For compound terms, use key words or initials
- Preserve important technical terms
- Make it instantly recognizable to someone familiar with the concept
- Return ONLY the abbreviation, no explanation

Abbreviation:`;

    try {
      const response = await fetch('/api/v1/abbreviate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cheapest model
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 20,
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const abbreviation = data.choices[0]?.message?.content?.trim() || '';
      
      // Validate and clean the result
      if (abbreviation && abbreviation.length <= 15) {
        return abbreviation;
      }
      
      throw new Error('Invalid abbreviation response');
    } catch (error) {
      console.warn('AI abbreviation failed for:', title, error);
      throw error;
    }
  }

  private simpleTruncation(title: string): string {
    // Fallback truncation logic
    if (title.length <= 15) return title;
    
    const words = title.split(' ');
    if (words.length > 1) {
      // Try to use first and last word
      if (words[0].length + words[words.length - 1].length + 3 <= 15) {
        return `${words[0]}...${words[words.length - 1]}`;
      }
      // Use initials
      if (words.length <= 5) {
        return words.map(w => w.charAt(0).toUpperCase()).join('');
      }
    }
    
    // Simple truncation
    return title.substring(0, 12) + '...';
  }
}

// Generate dynamic color based on category name
const generateCategoryColor = (categoryName: string, index: number = 0): string => {
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 55 + (Math.abs(hash) % 15); // 55-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Build category hierarchy
const buildCategoryHierarchy = (categories: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build hierarchy
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(category);
        category.parent = parent;
      }
    } else {
      rootCategories.push(category);
    }
  });

  return rootCategories;
};

// Generate cluster layout positions
const generateClusterLayout = (categories: Category[], concepts: Concept[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  const clusterRadius = 120;
  const clusterSpacing = 300;
  
  let clusterIndex = 0;
  const processedCategories = new Set<string>();

  const processCategory = (category: Category, level: number = 0) => {
    if (processedCategories.has(category.id)) return;
    processedCategories.add(category.id);

    const conceptsInCategory = concepts.filter(c => c.category === category.name);
    if (conceptsInCategory.length === 0 && category.children.length === 0) return;

    // Calculate cluster center
    const row = Math.floor(clusterIndex / 4);
    const col = clusterIndex % 4;
    const centerX = col * clusterSpacing + 200;
    const centerY = row * clusterSpacing + 200;

    // Position concepts in a circular pattern within the cluster
    conceptsInCategory.forEach((concept, index) => {
      const angle = (index / conceptsInCategory.length) * 2 * Math.PI;
      const radius = Math.min(clusterRadius, 40 + (conceptsInCategory.length * 8));
      
      positions.set(concept.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    clusterIndex++;

    // Process child categories
    category.children.forEach(child => processCategory(child, level + 1));
  };

  categories.forEach(category => processCategory(category));
  
  return positions;
};

const KnowledgeCompanion: React.FC<KnowledgeCompanionProps> = ({
  concepts,
  categories,
  onConceptSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<'learning' | 'interview'>('learning');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showConnections, setShowConnections] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1600, height: 1000 });
  
  // Connection creation state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ conceptId: string; x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [highlightConnected, setHighlightConnected] = useState(false);
  
  // Abbreviation service and cache
  const [abbreviationService] = useState(() => new AbbreviationService());
  const [abbreviations, setAbbreviations] = useState<Map<string, string>>(new Map());
  const [loadingAbbreviations, setLoadingAbbreviations] = useState<Set<string>>(new Set());

  // Process data
  const categoryHierarchy = buildCategoryHierarchy(categories);
  const conceptPositions = generateClusterLayout(categoryHierarchy, concepts);
  
  // Parse JSON fields
  const parseJsonField = (jsonString: string, fallback: any = []) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  // Filter concepts
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(concept.category);
    
    return matchesSearch && matchesCategory;
  });
  
  // Load abbreviations for visible concepts
  useEffect(() => {
    const loadAbbreviations = async () => {
      const conceptsNeedingAbbreviation = filteredConcepts.filter(
        concept => concept.title.length > 15 && !abbreviations.has(concept.id) && !loadingAbbreviations.has(concept.id)
      );

      if (conceptsNeedingAbbreviation.length === 0) return;

      const newLoading = new Set(loadingAbbreviations);
      conceptsNeedingAbbreviation.forEach(concept => newLoading.add(concept.id));
      setLoadingAbbreviations(newLoading);

      // Process abbreviations in parallel
      const abbreviationPromises = conceptsNeedingAbbreviation.map(async (concept) => {
        try {
          const abbreviation = await abbreviationService.getAbbreviation(concept.title);
          return { conceptId: concept.id, abbreviation };
        } catch (error) {
          // Fallback to simple truncation
          const fallback = concept.title.length > 15 
            ? concept.title.substring(0, 12) + '...' 
            : concept.title;
          return { conceptId: concept.id, abbreviation: fallback };
        }
      });

      try {
        const results = await Promise.all(abbreviationPromises);
        
        setAbbreviations(prev => {
          const newMap = new Map(prev);
          results.forEach(({ conceptId, abbreviation }) => {
            newMap.set(conceptId, abbreviation);
          });
          return newMap;
        });
      } catch (error) {
        console.error('Error loading abbreviations:', error);
      } finally {
        setLoadingAbbreviations(prev => {
          const newSet = new Set(prev);
          conceptsNeedingAbbreviation.forEach(concept => newSet.delete(concept.id));
          return newSet;
        });
      }
    };

    loadAbbreviations();
  }, [filteredConcepts, abbreviations, loadingAbbreviations, abbreviationService]);

  // Generate connections
  const connections = concepts.flatMap(concept => {
    const relatedIds = parseJsonField(concept.relatedConcepts, []);
    return relatedIds.map((relatedId: string) => {
      const targetConcept = concepts.find(c => c.id === relatedId);
      if (!targetConcept) return null;
      
      const fromPos = conceptPositions.get(concept.id);
      const toPos = conceptPositions.get(targetConcept.id);
      
      if (!fromPos || !toPos) return null;
      
      return {
        from: concept.id,
        to: relatedId,
        fromPos,
        toPos,
        strength: Math.min(concept.confidenceScore, targetConcept.confidenceScore),
        fromConcept: concept,
        toConcept: targetConcept
      };
    }).filter(Boolean);
  });

  const visibleConnections = connections.filter(conn => {
    if (!conn || !showConnections) return false;
    const fromVisible = filteredConcepts.some(c => c.id === conn.from);
    const toVisible = filteredConcepts.some(c => c.id === conn.to);
    return fromVisible && toVisible;
  });

  // Category selection handlers
  const handleCategoryClick = (categoryName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedCategories);
      if (newSelected.has(categoryName)) {
        newSelected.delete(categoryName);
      } else {
        newSelected.add(categoryName);
      }
      setSelectedCategories(newSelected);
    } else {
      if (selectedCategories.has(categoryName) && selectedCategories.size === 1) {
        setSelectedCategories(new Set());
      } else {
        setSelectedCategories(new Set([categoryName]));
      }
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Render category tree
  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map(category => {
      const conceptCount = concepts.filter(c => c.category === category.name).length;
      const isSelected = selectedCategories.has(category.name);
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = category.children.length > 0;
      
      return (
        <div key={category.id} style={{ marginLeft: level * 16 }}>
          <button
            onClick={(e) => handleCategoryClick(category.name, e)}
            className={`flex items-center justify-between w-full p-2 rounded-lg text-sm transition-all ${
              isSelected 
                ? 'bg-white/20 border border-white/30' 
                : 'hover:bg-white/10 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryExpansion(category.id);
                  }}
                  className="p-0.5 hover:bg-white/20 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: generateCategoryColor(category.name) }}
              />
              <span className="text-gray-300 truncate">{category.name}</span>
            </div>
            <span className="text-gray-400">({conceptCount})</span>
          </button>
          
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getMasteryColor = (masteryLevel: string | null): string => {
    switch (masteryLevel) {
      case 'EXPERT': return '#10B981';
      case 'ADVANCED': return '#3B82F6';
      case 'INTERMEDIATE': return '#F59E0B';
      case 'BEGINNER': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getMasterySymbol = (masteryLevel: string | null): string => {
    switch (masteryLevel) {
      case 'EXPERT': return '●●●●';
      case 'ADVANCED': return '●●●○';
      case 'INTERMEDIATE': return '●●○○';
      case 'BEGINNER': return '●○○○';
      default: return '○○○○';
    }
  };

  // Handle connection creation
  const handleMouseDown = (event: React.MouseEvent, conceptId: string, position: { x: number; y: number }) => {
    if (event.button === 2) { // Right click
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ conceptId, x: position.x, y: position.y });
      setDragCurrent({ x: position.x, y: position.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const svgX = ((event.clientX - rect.left) * viewBox.width) / rect.width + viewBox.x;
        const svgY = ((event.clientY - rect.top) * viewBox.height) / rect.height + viewBox.y;
        setDragCurrent({ x: svgX, y: svgY });
      }
    }
  };

  const handleMouseUp = (event: React.MouseEvent, targetConceptId?: string) => {
    if (isDragging && dragStart && targetConceptId && targetConceptId !== dragStart.conceptId) {
      // Create connection logic here
      console.log(`Creating connection from ${dragStart.conceptId} to ${targetConceptId}`);
      // You can add API call to save the connection
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const getConnectedNodes = (conceptId: string) => {
    const connected = new Set<string>();
    connections.forEach(conn => {
      if (conn?.from === conceptId) connected.add(conn.to);
      if (conn?.to === conceptId) connected.add(conn.from);
    });
    return connected;
  };

  // Get display title for concept
  const getDisplayTitle = (concept: Concept): string => {
    if (concept.title.length <= 25) return concept.title;
    
    // Check if abbreviation is available
    if (abbreviations.has(concept.id)) {
      return abbreviations.get(concept.id)!;
    }
    
    // Show loading state or fallback
    if (loadingAbbreviations.has(concept.id)) {
      return concept.title.substring(0, 12) + '...';
    }
    
    // Fallback truncation
    return concept.title.substring(0, 12) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                {mode === 'learning' ? <Brain className="w-6 h-6" /> : <Target className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Knowledge Companion
                </h1>
                <p className="text-sm text-gray-400">
                  {mode === 'learning' ? 'Explore & Connect' : 'Prepare & Practice'}
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMode('learning')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  mode === 'learning' 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700/70'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Learning</span>
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  mode === 'interview' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700/70'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Interview</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search concepts, categories, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar - Categories */}
        <div className="w-96 bg-slate-800/50 border-r border-white/10 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Categories</h3>
            <span className="text-sm text-gray-400">Ctrl+Click for multi-select</span>
          </div>
          
          <div className="space-y-1 mb-6">
            {renderCategoryTree(categoryHierarchy)}
          </div>

          {selectedCategories.size > 0 && (
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear selection ({selectedCategories.size} selected)
            </button>
          )}

          {/* Connection Controls */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <h4 className="text-sm font-medium text-white mb-3">Graph Controls</h4>
            
            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-all w-full ${
                showConnections ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {showConnections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showConnections ? 'Hide' : 'Show'} Connections</span>
            </button>
          </div>

          {/* Stats */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <h4 className="text-sm font-medium text-white mb-3">Overview</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div>Total Concepts: {concepts.length}</div>
              <div>Visible: {filteredConcepts.length}</div>
              <div>Connections: {visibleConnections.length}</div>
              <div>Categories: {categories.length}</div>
            </div>
          </div>
        </div>

        {/* Main Graph Area */}
        <div className="flex-1 relative">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            onMouseMove={handleMouseMove}
            onMouseUp={(e) => handleMouseUp(e)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
              </pattern>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connections */}
            {visibleConnections.map((conn, index) => {
              if (!conn) return null;
              
              const isHighlighted = highlightConnected && hoveredConcept && 
                (conn.from === hoveredConcept || conn.to === hoveredConcept);
              
              return (
                <line
                  key={index}
                  x1={conn.fromPos.x}
                  y1={conn.fromPos.y}
                  x2={conn.toPos.x}
                  y2={conn.toPos.y}
                  stroke={isHighlighted ? "rgba(16, 185, 129, 0.8)" : "rgba(99, 102, 241, 0.3)"}
                  strokeWidth={isHighlighted ? 4 : Math.max(1, conn.strength * 3)}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Drag Connection Line */}
            {isDragging && dragStart && dragCurrent && (
              <line
                x1={dragStart.x}
                y1={dragStart.y}
                x2={dragCurrent.x}
                y2={dragCurrent.y}
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="pointer-events-none"
              />
            )}

            {/* Concept Nodes */}
            {filteredConcepts.map((concept) => {
              const position = conceptPositions.get(concept.id);
              if (!position) return null;

              const masteryColor = getMasteryColor(concept.masteryLevel);
              const nodeSize = 20 + (concept.learningProgress / 100) * 15;
              const displayTitle = getDisplayTitle(concept);
              const isSelected = selectedConcept?.id === concept.id;
              const isHovered = hoveredConcept === concept.id;
              const connectedNodes = getConnectedNodes(concept.id);
              const isConnected = highlightConnected && hoveredConcept && connectedNodes.has(hoveredConcept);
              const isBeingDragged = isDragging && dragStart?.conceptId === concept.id;
              
              return (
                <g key={concept.id}>
                  {/* Node Glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={nodeSize + 10}
                      fill={`${generateCategoryColor(concept.category)}40`}
                      className="transition-all duration-300"
                    />
                  )}
                  
                  {/* Main Node */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={nodeSize}
                    fill={generateCategoryColor(concept.category)}
                    stroke={isConnected ? "#10B981" : isBeingDragged ? "#EF4444" : masteryColor}
                    strokeWidth={isConnected || isBeingDragged ? 4 : 2}
                    className="cursor-pointer transition-all duration-300 hover:stroke-white"
                    onMouseEnter={() => {
                      setHoveredConcept(concept.id);
                      setHighlightConnected(true);
                    }}
                    onMouseLeave={() => {
                      setHoveredConcept(null);
                      setHighlightConnected(false);
                    }}
                    onMouseDown={(e) => handleMouseDown(e, concept.id, position)}
                    onMouseUp={(e) => handleMouseUp(e, concept.id)}
                    onClick={() => {
                      if (!isDragging) {
                        setSelectedConcept(concept);
                        onConceptSelect?.(concept);
                      }
                    }}
                  />

                  {/* Progress Ring */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={nodeSize + 5}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    strokeDasharray={`${(concept.learningProgress / 100) * (2 * Math.PI * (nodeSize + 5))} ${2 * Math.PI * (nodeSize + 5)}`}
                    className="transition-all duration-300"
                  />

                  {/* Display Title */}
                  <text
                    x={position.x}
                    y={position.y + nodeSize + 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {displayTitle}
                  </text>

                  {/* Mastery Level */}
                  <text
                    x={position.x}
                    y={position.y + nodeSize + 35}
                    textAnchor="middle"
                    fill={masteryColor}
                    fontSize="8"
                    className="pointer-events-none"
                  >
                    {getMasterySymbol(concept.masteryLevel)}
                  </text>

                  {/* Bookmarked indicator */}
                  {concept.bookmarked && (
                    <text
                      x={position.x + nodeSize - 5}
                      y={position.y - nodeSize + 10}
                      textAnchor="middle"
                      fontSize="12"
                      className="pointer-events-none"
                    >
                      ⭐
                    </text>
                  )}

                  {/* Loading indicator for abbreviations */}
                  {loadingAbbreviations.has(concept.id) && (
                    <circle
                      cx={position.x - nodeSize + 5}
                      cy={position.y - nodeSize + 5}
                      r="3"
                      fill="#F59E0B"
                      className="pointer-events-none animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredConcept && (
            <div className="absolute pointer-events-none bg-slate-800/95 backdrop-blur-lg rounded-lg border border-white/10 p-3 max-w-sm z-50"
                 style={{ 
                   left: '50%', 
                   top: '10%', 
                   transform: 'translateX(-50%)' 
                 }}>
              {(() => {
                const concept = concepts.find(c => c.id === hoveredConcept);
                if (!concept) return null;
                
                return (
                  <div>
                    <h4 className="font-semibold text-white mb-1">{concept.title}</h4>
                    <p className="text-sm text-gray-300 mb-2">{concept.category}</p>
                    <p className="text-xs text-gray-400 line-clamp-3">{concept.summary}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gray-400">Progress: {concept.learningProgress}%</span>
                      <span className="text-gray-400">{concept.masteryLevel || 'No level'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Concept Detail Panel */}
          {selectedConcept && (
            <div className="absolute top-6 right-6 w-96 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{selectedConcept.title}</h3>
                  <div className="flex items-center space-x-3 mb-3">
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${generateCategoryColor(selectedConcept.category)}20`,
                        color: generateCategoryColor(selectedConcept.category)
                      }}
                    >
                      {selectedConcept.category}
                    </span>
                    {selectedConcept.masteryLevel && (
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: `${getMasteryColor(selectedConcept.masteryLevel)}20`,
                          color: getMasteryColor(selectedConcept.masteryLevel)
                        }}
                      >
                        {selectedConcept.masteryLevel}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-indigo-400 mb-2">Summary</h4>
                <p className="text-sm text-gray-300">{selectedConcept.summary}</p>
              </div>

              {/* Learning Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Learning Progress</span>
                  <span className="text-sm text-white">{selectedConcept.learningProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${selectedConcept.learningProgress}%` }}
                  />
                </div>
              </div>

              {/* Key Points */}
              {selectedConcept.keyPoints && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-purple-400 mb-2">Key Points</h4>
                  <div className="space-y-1">
                    {parseJsonField(selectedConcept.keyPoints, []).map((point: string, index: number) => (
                      <div key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                        <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Concepts */}
              {selectedConcept.relatedConcepts && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Related Concepts</h4>
                  <div className="space-y-1">
                    {parseJsonField(selectedConcept.relatedConcepts, []).map((relatedId: string) => {
                      const relatedConcept = concepts.find(c => c.id === relatedId);
                      if (!relatedConcept) return null;
                      
                      return (
                        <button
                          key={relatedId}
                          onClick={() => setSelectedConcept(relatedConcept)}
                          className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: generateCategoryColor(relatedConcept.category) }}
                            />
                            <span className="text-sm text-gray-300">{relatedConcept.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Practice Count */}
              {selectedConcept.practiceCount > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Practice Sessions</span>
                    <span className="text-white">{selectedConcept.practiceCount}</span>
                  </div>
                  {selectedConcept.lastPracticed && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last: {new Date(selectedConcept.lastPracticed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/10 p-4 max-w-sm">
        <h4 className="text-sm font-medium text-white mb-3">Mastery Levels</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span style={{ color: getMasteryColor('EXPERT') }}>●●●●</span>
            <span className="text-xs text-gray-300">Expert</span>
          </div>
          <div className="flex items-center space-x-2">
            <span style={{ color: getMasteryColor('ADVANCED') }}>●●●○</span>
            <span className="text-xs text-gray-300">Advanced</span>
          </div>
          <div className="flex items-center space-x-2">
            <span style={{ color: getMasteryColor('INTERMEDIATE') }}>●●○○</span>
            <span className="text-xs text-gray-300">Intermediate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span style={{ color: getMasteryColor('BEGINNER') }}>●○○○</span>
            <span className="text-xs text-gray-300">Beginner</span>
          </div>
        </div>
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="text-xs text-gray-400">Progress ring shows learning completion</div>
          <div className="text-xs text-gray-400">⭐ indicates bookmarked concepts</div>
          <div className="text-xs text-gray-400">Hover nodes for full details</div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCompanion; 