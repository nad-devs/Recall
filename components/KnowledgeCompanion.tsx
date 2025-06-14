import React, { useState, useRef, useEffect } from 'react';
import { Brain, Target, BookOpen, Search, Eye, EyeOff, Code, Cloud, Database, Cpu, Network, Shield, Zap, Settings, FileText, Users, ChevronDown, ChevronRight } from 'lucide-react';

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

// Semantic clustering with AI-based concept similarity
interface SemanticCluster {
  id: string;
  name: string;
  concepts: Concept[];
  color: string;
  icon: React.ComponentType<any>;
  position: { x: number; y: number };
  keywords: string[];
}

// Get icon for concept category/type
const getConceptIcon = (concept: Concept): React.ComponentType<any> => {
  const title = concept.title.toLowerCase();
  const category = concept.category.toLowerCase();
  
  // Programming/Code related
  if (title.includes('algorithm') || title.includes('programming') || title.includes('code') || 
      category.includes('leetcode') || category.includes('programming')) {
    return Code;
  }
  
  // Cloud/Infrastructure
  if (title.includes('cloud') || title.includes('aws') || title.includes('kubernetes') || 
      title.includes('docker') || category.includes('cloud')) {
    return Cloud;
  }
  
  // Data/Database
  if (title.includes('data') || title.includes('database') || title.includes('sql') || 
      title.includes('query') || category.includes('data')) {
    return Database;
  }
  
  // AI/ML
  if (title.includes('machine') || title.includes('learning') || title.includes('ai') || 
      title.includes('neural') || category.includes('artificial')) {
    return Brain;
  }
  
  // System/Architecture
  if (title.includes('system') || title.includes('architecture') || title.includes('microservice') || 
      title.includes('distributed')) {
    return Cpu;
  }
  
  // Network/Security
  if (title.includes('network') || title.includes('security') || title.includes('auth') || 
      title.includes('token')) {
    return title.includes('security') || title.includes('auth') ? Shield : Network;
  }
  
  // Performance/Optimization
  if (title.includes('performance') || title.includes('optimization') || title.includes('load') || 
      title.includes('balance')) {
    return Zap;
  }
  
  // Default
  return Settings;
};

// AI-powered semantic clustering
const generateSemanticClusters = (concepts: Concept[]): SemanticCluster[] => {
  // Define semantic groups with keywords and patterns
  const semanticGroups = [
    {
      name: "LeetCode & Algorithms",
      keywords: ["leetcode", "algorithm", "programming", "problem", "solution", "coding", "dynamic", "graph", "tree"],
      color: "#FF6B6B",
      icon: Code
    },
    {
      name: "Cloud & Infrastructure", 
      keywords: ["cloud", "aws", "kubernetes", "docker", "infrastructure", "deployment", "container", "service"],
      color: "#4ECDC4",
      icon: Cloud
    },
    {
      name: "Machine Learning & AI",
      keywords: ["machine", "learning", "ai", "artificial", "intelligence", "neural", "model", "training"],
      color: "#45B7D1", 
      icon: Brain
    },
    {
      name: "Data & Databases",
      keywords: ["data", "database", "sql", "query", "storage", "table", "index", "optimization"],
      color: "#96CEB4",
      icon: Database
    },
    {
      name: "System Architecture",
      keywords: ["system", "architecture", "microservice", "distributed", "scalability", "design", "pattern"],
      color: "#FFEAA7",
      icon: Cpu
    },
    {
      name: "Security & Authentication",
      keywords: ["security", "auth", "token", "encryption", "authentication", "authorization", "jwt"],
      color: "#DDA0DD",
      icon: Shield
    },
    {
      name: "Performance & Optimization",
      keywords: ["performance", "optimization", "load", "balance", "caching", "speed", "efficiency"],
      color: "#98D8C8",
      icon: Zap
    },
    {
      name: "Web Development",
      keywords: ["web", "frontend", "backend", "api", "http", "rest", "javascript", "react"],
      color: "#F7DC6F",
      icon: Network
    }
  ];

  // Score concepts against each semantic group
  const conceptScores = concepts.map(concept => {
    const text = `${concept.title} ${concept.category} ${concept.summary || ''}`.toLowerCase();
    
    const scores = semanticGroups.map(group => {
      let score = 0;
      group.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += keyword.length; // Longer keywords get higher weight
        }
      });
      return { group, score };
    });
    
    // Find best matching group
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return {
      concept,
      bestGroup: bestMatch.score > 0 ? bestMatch.group : semanticGroups[semanticGroups.length - 1], // Default to last group
      score: bestMatch.score
    };
  });

  // Group concepts by their best semantic match
  const clusters: SemanticCluster[] = [];
  
  semanticGroups.forEach((group, groupIndex) => {
    const groupConcepts = conceptScores
      .filter(item => item.bestGroup === group)
      .map(item => item.concept);
    
    if (groupConcepts.length > 0) {
      // Calculate cluster position in a better grid
      const cols = 3;
      const row = Math.floor(clusters.length / cols);
      const col = clusters.length % cols;
      
      clusters.push({
        id: `cluster-${groupIndex}`,
        name: group.name,
        concepts: groupConcepts,
        color: group.color,
        icon: group.icon,
        position: {
          x: col * 450 + 250,
          y: row * 350 + 200
        },
        keywords: group.keywords
      });
    }
  });

  return clusters;
};

// Generate positions for concepts within clusters with dynamic viewport adjustment
const generateClusterLayout = (clusters: SemanticCluster[], viewBox: { x: number; y: number; width: number; height: number }) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Calculate the bounds of all concepts
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  clusters.forEach(cluster => {
    const { concepts, position } = cluster;
    const centerX = position.x;
    const centerY = position.y;
    
    concepts.forEach((concept, index) => {
      let x, y;
      
      if (concepts.length === 1) {
        x = centerX;
        y = centerY;
      } else if (concepts.length <= 8) {
        // Single ring for small clusters
        const angle = (index / concepts.length) * 2 * Math.PI;
        const radius = Math.min(120, 60 + concepts.length * 10);
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Multiple rings for larger clusters
        const conceptsPerRing = 8;
        const ring = Math.floor(index / conceptsPerRing);
        const indexInRing = index % conceptsPerRing;
        const conceptsInThisRing = Math.min(conceptsPerRing, concepts.length - ring * conceptsPerRing);
        const ringRadius = 80 + (ring * 60);
        const angle = (indexInRing / conceptsInThisRing) * 2 * Math.PI;
        
        x = centerX + Math.cos(angle) * ringRadius;
        y = centerY + Math.sin(angle) * ringRadius;
      }
      
      positions.set(concept.id, { x, y });
      
      // Track bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
  });
  
  // Add padding
  const padding = 100;
  const bounds = {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding
  };
  
  return { positions, bounds };
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
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [viewBox, setViewBox] = useState({ x: -200, y: -100, width: 1800, height: 1200 });
  
  // Connection creation state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ conceptId: string; x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Generate semantic clusters and layout
  const semanticClusters = generateSemanticClusters(concepts);
  const { positions: conceptPositions, bounds } = generateClusterLayout(semanticClusters, viewBox);
  
  // Update viewBox to fit all concepts
  useEffect(() => {
    if (bounds && (bounds.minX !== Infinity)) {
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      setViewBox({
        x: bounds.minX,
        y: bounds.minY,
        width: Math.max(width, 1200),
        height: Math.max(height, 800)
      });
    }
  }, [bounds]);
  
  // Parse JSON fields safely with better error handling
  const parseJsonField = (jsonString: string | undefined, fallback: any = []) => {
    if (!jsonString || jsonString.trim() === '') return fallback;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.warn('Failed to parse JSON field:', jsonString, error);
      return fallback;
    }
  };

  // Filter concepts based on search and cluster selection
  const filteredConcepts = concepts.filter(concept => {
    // First apply cluster filter
    if (selectedClusters.size > 0) {
      const conceptCluster = semanticClusters.find(cluster => 
        cluster.concepts.some(c => c.id === concept.id)
      );
      if (!conceptCluster || !selectedClusters.has(conceptCluster.id)) {
        return false;
      }
    }
    
    // Then apply search filter
    if (!searchQuery) return true;
    
    return concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           concept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (concept.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Generate connections with better debugging
  const connections = concepts.flatMap(concept => {
    const relatedIds = parseJsonField(concept.relatedConcepts, []);
    
    if (relatedIds.length > 0) {
      console.log(`Concept "${concept.title}" has related concepts:`, relatedIds);
    }
    
    return relatedIds.map((relatedItem: any) => {
      // Handle different formats of related concepts
      let targetConceptId: string | null = null;
      let targetConcept: any;
      
      if (typeof relatedItem === 'string') {
        // Direct ID reference
        targetConceptId = relatedItem;
        targetConcept = concepts.find(c => c.id === targetConceptId);
      } else if (typeof relatedItem === 'object' && relatedItem !== null) {
        // Object with id, title, or other properties
        if (relatedItem.id) {
          targetConceptId = relatedItem.id;
          targetConcept = concepts.find(c => c.id === targetConceptId);
        } else if (relatedItem.title) {
          // Try to find by title
          targetConcept = concepts.find(c => c.title === relatedItem.title);
          targetConceptId = targetConcept?.id || null;
        } else {
          console.warn(`Invalid related concept format:`, relatedItem, `for concept ${concept.title}`);
          return null;
        }
      } else {
        console.warn(`Unknown related concept format:`, relatedItem, `for concept ${concept.title}`);
        return null;
      }
      
      if (!targetConcept || !targetConceptId) {
        console.warn(`Related concept not found:`, relatedItem, `for concept ${concept.title}`);
        return null;
      }
      
      const fromPos = conceptPositions.get(concept.id);
      const toPos = targetConceptId ? conceptPositions.get(targetConceptId) : null;
      
      if (!fromPos || !toPos) {
        console.warn(`Position not found for connection: ${concept.title} -> ${targetConcept.title}`);
        return null;
      }
      
      return {
        from: concept.id,
        to: targetConceptId,
        fromPos,
        toPos,
        fromConcept: concept,
        toConcept: targetConcept
      };
    }).filter(Boolean);
  });

  console.log(`Total connections found: ${connections.length}`);

  const visibleConnections = connections.filter(conn => {
    if (!conn || !showConnections) return false;
    const fromVisible = filteredConcepts.some(c => c.id === conn.from);
    const toVisible = filteredConcepts.some(c => c.id === conn.to);
    return fromVisible && toVisible;
  });

  console.log(`Visible connections: ${visibleConnections.length}`);

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

  // Handle cluster selection
  const handleClusterClick = (clusterId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedClusters);
      if (newSelected.has(clusterId)) {
        newSelected.delete(clusterId);
      } else {
        newSelected.add(clusterId);
      }
      setSelectedClusters(newSelected);
    } else {
      if (selectedClusters.has(clusterId) && selectedClusters.size === 1) {
        setSelectedClusters(new Set());
      } else {
        setSelectedClusters(new Set([clusterId]));
      }
    }
  };

  const toggleClusterExpansion = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
    }
    setExpandedClusters(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white flex">
      {/* Left Sidebar - Semantic Clusters */}
      <div className="w-80 bg-slate-800/50 border-r border-white/10 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Categories</h3>
          <span className="text-xs text-gray-400">Click to filter</span>
        </div>
        
        <div className="space-y-2 mb-6">
          {semanticClusters.map(cluster => {
            const isSelected = selectedClusters.has(cluster.id);
            const isExpanded = expandedClusters.has(cluster.id);
            const IconComponent = cluster.icon;
            const visibleConceptsInCluster = cluster.concepts.filter(c => 
              filteredConcepts.some(fc => fc.id === c.id)
            ).length;
            
            return (
              <div key={cluster.id}>
                <button
                  onClick={(e) => handleClusterClick(cluster.id, e)}
                  className={`flex items-center justify-between w-full p-3 rounded-lg text-sm transition-all ${
                    isSelected 
                      ? 'bg-white/20 border border-white/30' 
                      : 'hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClusterExpansion(cluster.id);
                      }}
                      className="p-0.5 hover:bg-white/20 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cluster.color}20` }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: cluster.color }} />
                    </div>
                    <div className="text-left">
                      <div className="text-gray-300 font-medium">{cluster.name}</div>
                      <div className="text-xs text-gray-400">
                        {visibleConceptsInCluster}/{cluster.concepts.length} concepts
                      </div>
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-1">
                    {cluster.concepts.slice(0, 5).map(concept => {
                      const isVisible = filteredConcepts.some(fc => fc.id === concept.id);
                      return (
                        <div 
                          key={concept.id} 
                          className={`text-xs p-1 ${isVisible ? 'text-gray-300' : 'text-gray-500'}`}
                        >
                          • {concept.title.length > 30 ? concept.title.substring(0, 27) + '...' : concept.title}
                        </div>
                      );
                    })}
                    {cluster.concepts.length > 5 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{cluster.concepts.length - 5} more...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedClusters.size > 0 && (
          <button
            onClick={() => setSelectedClusters(new Set())}
            className="text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            Clear selection ({selectedClusters.size} selected)
          </button>
        )}

        {/* Connection Controls */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-white mb-3">Connections</h4>
          
          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-all w-full ${
              showConnections ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {showConnections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showConnections ? 'Hide' : 'Show'} Connections</span>
          </button>
          
          <div className="mt-3 text-xs text-gray-400">
            <div>Total: {connections.length} connections</div>
            <div>Visible: {visibleConnections.length}</div>
            <div className="mt-2">Right-click + drag to connect</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Compact Header */}
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="px-6 py-3">
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

            {/* Search */}
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Graph */}
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

            {/* Cluster Labels */}
            {semanticClusters.map(cluster => {
              const hasVisibleConcepts = cluster.concepts.some(c => 
                filteredConcepts.some(fc => fc.id === c.id)
              );
              
              if (!hasVisibleConcepts) return null;
              
              return (
                <g key={`label-${cluster.id}`}>
                  <text
                    x={cluster.position.x}
                    y={cluster.position.y - 150}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.6)"
                    fontSize="14"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {cluster.name}
                  </text>
                  <text
                    x={cluster.position.x}
                    y={cluster.position.y - 135}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    {cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)).length} concepts
                  </text>
                </g>
              );
            })}

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
                  stroke={isHighlighted ? "#10B981" : "rgba(99, 102, 241, 0.6)"}
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

              const cluster = semanticClusters.find(c => c.concepts.some(cc => cc.id === concept.id));
              const categoryColor = cluster?.color || '#6B7280';
              const masteryColor = getMasteryColor(concept.masteryLevel);
              const isSelected = selectedConcept?.id === concept.id;
              const isHovered = hoveredConcept === concept.id;
              const connectedNodes = getConnectedNodes(concept.id);
              const isConnected = hoveredConcept && connectedNodes.has(hoveredConcept);
              const progress = concept.learningProgress || 0;
              const IconComponent = getConceptIcon(concept);
              
              return (
                <g key={concept.id}>
                  {/* Node Glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r="40"
                      fill={`${categoryColor}20`}
                      className="transition-all duration-300"
                    />
                  )}
                  
                  {/* Progress Ring */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="26"
                    fill="none"
                    stroke={masteryColor}
                    strokeWidth="2"
                    strokeDasharray={`${(progress / 100) * (2 * Math.PI * 26)} ${2 * Math.PI * 26}`}
                    className="transition-all duration-300"
                    transform={`rotate(-90 ${position.x} ${position.y})`}
                  />
                  
                  {/* Main Node */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="22"
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

                  {/* Icon */}
                  <foreignObject
                    x={position.x - 8}
                    y={position.y - 8}
                    width="16"
                    height="16"
                    className="pointer-events-none"
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </foreignObject>

                  {/* Title */}
                  <text
                    x={position.x}
                    y={position.y + 40}
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
                      x={position.x + 18}
                      y={position.y - 12}
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
          <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300">
            <div>Concepts: {filteredConcepts.length}/{concepts.length}</div>
            <div>Connections: {visibleConnections.length}/{connections.length}</div>
            <div>Clusters: {semanticClusters.filter(c => c.concepts.some(cc => filteredConcepts.some(fc => fc.id === cc.id))).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCompanion; 