import React, { useState, useRef, useEffect } from 'react';
import { Brain, Target, BookOpen, Search, Eye, EyeOff } from 'lucide-react';

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
  details?: string;
  keyPoints?: string;
  examples?: string;
  relatedConcepts?: string;
  relationships?: string;
  confidenceScore?: number;
  masteryLevel?: string | null;
  learningProgress?: number;
  practiceCount?: number;
  lastPracticed?: Date | string | null;
  difficultyRating?: number | null;
  prerequisites?: string;
  personalRating?: number | null;
  bookmarked?: boolean;
  tags?: string;
  createdAt?: Date | string;
  categories?: Category[];
  [key: string]: any;
}

interface KnowledgeCompanionProps {
  concepts: Concept[];
  categories: Category[];
  onConceptSelect?: (concept: Concept | null) => void;
}

// Generate dynamic color based on category name
const generateCategoryColor = (categoryName: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Compact clustering algorithm
const generateCompactLayout = (concepts: Concept[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group by category
  const categoryGroups = concepts.reduce((groups, concept) => {
    const category = concept.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(concept);
    return groups;
  }, {} as Record<string, Concept[]>);

  // Sort categories by size
  const sortedCategories = Object.entries(categoryGroups)
    .sort(([, a], [, b]) => b.length - a.length);

  // Compact grid layout
  const cols = Math.ceil(Math.sqrt(sortedCategories.length));
  const spacing = 280;
  
  sortedCategories.forEach(([categoryName, categorysConcepts], index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const centerX = col * spacing + 200;
    const centerY = row * spacing + 200;
    
    // Arrange concepts in tight circles
    categorysConcepts.forEach((concept, i) => {
      if (categorysConcepts.length === 1) {
        positions.set(concept.id, { x: centerX, y: centerY });
      } else {
        const angle = (i / categorysConcepts.length) * 2 * Math.PI;
        const radius = Math.min(80, 30 + categorysConcepts.length * 8);
        positions.set(concept.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
    });
  });
  
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
  const [showConnections, setShowConnections] = useState(true);
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, width: 1400, height: 900 });
  
  // Connection creation state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ conceptId: string; x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Generate layout
  const conceptPositions = generateCompactLayout(concepts);
  
  // Parse JSON fields safely
  const parseJsonField = (jsonString: string | undefined, fallback: any = []) => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  // Filter concepts
  const filteredConcepts = concepts.filter(concept => {
    if (!searchQuery) return true;
    return concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           concept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (concept.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
  });
  
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

  // Get mastery color
  const getMasteryColor = (masteryLevel: string | null): string => {
    switch (masteryLevel) {
      case 'EXPERT': return '#10B981';
      case 'ADVANCED': return '#3B82F6';
      case 'INTERMEDIATE': return '#F59E0B';
      case 'BEGINNER': return '#EF4444';
      default: return '#6B7280';
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
      const sourceConcept = concepts.find(c => c.id === dragStart.conceptId);
      const targetConcept = concepts.find(c => c.id === targetConceptId);
      
      if (sourceConcept && targetConcept) {
        console.log(`Connection: ${sourceConcept.title} → ${targetConcept.title}`);
        // Add your connection creation logic here
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Get connected nodes for highlighting
  const getConnectedNodes = (conceptId: string) => {
    const connected = new Set<string>();
    connections.forEach(conn => {
      if (conn?.from === conceptId) connected.add(conn.to);
      if (conn?.to === conceptId) connected.add(conn.from);
    });
    return connected;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Compact Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Knowledge Graph
                </h1>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMode('learning')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  mode === 'learning' 
                    ? 'bg-indigo-500/20 text-indigo-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Learning
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  mode === 'interview' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Interview
              </button>
            </div>
          </div>

          {/* Compact Search */}
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                showConnections ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {showConnections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Connections</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Graph - Full Width */}
      <div className="relative h-[calc(100vh-120px)]">
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
            
            const isHighlighted = hoveredConcept && 
              (conn.from === hoveredConcept || conn.to === hoveredConcept);
            
            return (
              <line
                key={index}
                x1={conn.fromPos.x}
                y1={conn.fromPos.y}
                x2={conn.toPos.x}
                y2={conn.toPos.y}
                stroke={isHighlighted ? "#10B981" : "rgba(99, 102, 241, 0.4)"}
                strokeWidth={isHighlighted ? 3 : 2}
                strokeDasharray={isHighlighted ? "none" : "5,5"}
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
              strokeWidth="2"
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
          )}

          {/* Concept Nodes */}
          {filteredConcepts.map((concept) => {
            const position = conceptPositions.get(concept.id);
            if (!position) return null;

            const categoryColor = generateCategoryColor(concept.category);
            const masteryColor = getMasteryColor(concept.masteryLevel);
            const isSelected = selectedConcept?.id === concept.id;
            const isHovered = hoveredConcept === concept.id;
            const connectedNodes = getConnectedNodes(concept.id);
            const isConnected = hoveredConcept && connectedNodes.has(hoveredConcept);
            const progress = concept.learningProgress || 0;
            
            return (
              <g key={concept.id}>
                {/* Node Glow */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="35"
                    fill={`${categoryColor}20`}
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Progress Ring */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="22"
                  fill="none"
                  stroke={masteryColor}
                  strokeWidth="2"
                  strokeDasharray={`${(progress / 100) * (2 * Math.PI * 22)} ${2 * Math.PI * 22}`}
                  className="transition-all duration-300"
                  transform={`rotate(-90 ${position.x} ${position.y})`}
                />
                
                {/* Main Node */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="18"
                  fill={categoryColor}
                  stroke={isConnected ? "#10B981" : masteryColor}
                  strokeWidth={isConnected ? 3 : 2}
                  className="cursor-pointer transition-all duration-300 hover:stroke-white"
                  onMouseEnter={() => setHoveredConcept(concept.id)}
                  onMouseLeave={() => setHoveredConcept(null)}
                  onMouseDown={(e) => handleMouseDown(e, concept.id, position)}
                  onMouseUp={(e) => handleMouseUp(e, concept.id)}
                  onClick={() => {
                    if (!isDragging) {
                      setSelectedConcept(concept);
                      onConceptSelect?.(concept);
                    }
                  }}
                />

                {/* Title */}
                <text
                  x={position.x}
                  y={position.y + 35}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {concept.title.length > 20 ? concept.title.substring(0, 17) + '...' : concept.title}
                </text>

                {/* Bookmarked indicator */}
                {concept.bookmarked && (
                  <text
                    x={position.x + 15}
                    y={position.y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    ⭐
                  </text>
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
                    <span className="text-gray-400">Progress: {concept.learningProgress || 0}%</span>
                    <span className="text-gray-400">{concept.masteryLevel || 'No level'}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Stats Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300">
          <div>Concepts: {filteredConcepts.length}/{concepts.length}</div>
          <div>Connections: {visibleConnections.length}</div>
          <div className="mt-1 text-gray-400">Right-click + drag to connect</div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCompanion; 