import React, { useState, useEffect, useRef, useMemo } from 'react'
import { EnhancedConcept, processEnhancedConcept } from '../types'
import { Search, Filter, RotateCcw } from 'lucide-react'

interface Connection {
  from: string
  to: string
  weight: number
  type: 'prerequisite' | 'related' | 'category' | 'conversation'
  label?: string
}

interface ConceptNode extends EnhancedConcept {
  x: number
  y: number
  width: number
  height: number
  laneIndex: number
  positionInLane: number
}

interface CategoryLane {
  category: string
  color: string
  icon: string
  concepts: ConceptNode[]
  y: number
  height: number
  collapsed: boolean
  stats: {
    total: number
    mastered: number
    learning: number
    struggling: number
  }
}

interface LaneKnowledgeGraphProps {
  concepts: EnhancedConcept[]
  onConceptClick: (concept: EnhancedConcept) => void
  interviewMode: boolean
  className?: string
}

export const LaneKnowledgeGraph: React.FC<LaneKnowledgeGraphProps> = ({
  concepts,
  onConceptClick,
  interviewMode,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [lanes, setLanes] = useState<CategoryLane[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [focusedLanes, setFocusedLanes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [weightFilter, setWeightFilter] = useState(0.3)
  // Removed zoom/pan state - making it static
  const [tooltip, setTooltip] = useState<{ x: number, y: number, concept: EnhancedConcept } | null>(null)

  // Category configuration with colors and icons
  const categoryConfig = {
    'Machine Learning': { color: '#EC4899', icon: '🤖', bgColor: '#EC449920' },
    'LeetCode Problems': { color: '#F59E0B', icon: '💻', bgColor: '#F59E0B20' },
    'System Design': { color: '#EF4444', icon: '🏗️', bgColor: '#EF444420' },
    'Algorithms': { color: '#F97316', icon: '⚡', bgColor: '#F9731620' },
    'Data Structures': { color: '#14B8A6', icon: '📊', bgColor: '#14B8A620' },
    'Frontend': { color: '#3B82F6', icon: '🎨', bgColor: '#3B82F620' },
    'Backend': { color: '#6366F1', icon: '⚙️', bgColor: '#6366F120' },
    'Database': { color: '#06B6D4', icon: '🗄️', bgColor: '#06B6D420' },
    'Cloud Engineering': { color: '#84CC16', icon: '☁️', bgColor: '#84CC1620' },
    'Artificial Intelligence': { color: '#8B5CF6', icon: '🧠', bgColor: '#8B5CF620' },
    'General': { color: '#6B7280', icon: '📚', bgColor: '#6B728020' },
    'default': { color: '#6B7280', icon: '📝', bgColor: '#6B728020' }
  }

  // Calculate understanding strength - return clean percentages
  const calculateUnderstandingStrength = (concept: EnhancedConcept): number => {
    // If learningProgress is already a percentage (0-100), use it directly
    if (concept.learningProgress && concept.learningProgress > 0) {
      return concept.learningProgress > 1 ? concept.learningProgress : concept.learningProgress * 100
    }
    
    let totalScore = 0
    let maxScore = 0
    
    // Practice count contribution (0-40 points)
    if (concept.practiceCount !== undefined && concept.practiceCount > 0) {
      totalScore += Math.min(40, concept.practiceCount * 8)
      maxScore += 40
    }
    
    // Review count contribution (0-30 points)
    if (concept.reviewCount !== undefined && concept.reviewCount > 0) {
      totalScore += Math.min(30, concept.reviewCount * 6)
      maxScore += 30
    }
    
    // Mastery level contribution (0-50 points)
    if (concept.masteryLevel) {
      const masteryScores = { 'BEGINNER': 20, 'INTERMEDIATE': 35, 'ADVANCED': 45, 'EXPERT': 50 }
      totalScore += masteryScores[concept.masteryLevel as keyof typeof masteryScores] || 0
      maxScore += 50
    }
    
    // Confidence score contribution (0-30 points)
    if (concept.confidenceScore !== undefined && concept.confidenceScore > 0) {
      const confidencePoints = concept.confidenceScore > 1 ? concept.confidenceScore : concept.confidenceScore * 30
      totalScore += Math.min(30, confidencePoints)
      maxScore += 30
    }
    
    // Personal rating contribution (0-25 points)
    if (concept.personalRating && concept.personalRating > 0) {
      totalScore += concept.personalRating * 5
      maxScore += 25
    }
    
    // Occurrences contribution (0-20 points)
    if (concept.occurrences && concept.occurrences.length > 0) {
      totalScore += Math.min(20, concept.occurrences.length * 4)
      maxScore += 20
    }
    
    // Calculate final percentage and round to whole number
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 25
    return Math.round(Math.min(100, Math.max(0, percentage)))
  }

  // Build connections between concepts
  const buildConnections = (conceptsData: EnhancedConcept[]): Connection[] => {
    const connections: Connection[] = []
    
    conceptsData.forEach(concept => {
      const processed = processEnhancedConcept(concept)
      
      // Prerequisites connections
      if (processed.prerequisitesParsed && Array.isArray(processed.prerequisitesParsed)) {
        processed.prerequisitesParsed.forEach((prereqId: string) => {
          const targetConcept = conceptsData.find(c => c.id === prereqId)
          if (targetConcept) {
            connections.push({
              from: prereqId,
              to: concept.id,
              weight: 0.9,
              type: 'prerequisite',
              label: 'prerequisite'
            })
          }
        })
      }
      
      // Related concepts connections
      if (processed.relatedConceptsParsed && Array.isArray(processed.relatedConceptsParsed)) {
        processed.relatedConceptsParsed.forEach((relatedId: string) => {
          const targetConcept = conceptsData.find(c => c.id === relatedId)
          if (targetConcept) {
            const existingConnection = connections.find(c => 
              (c.from === concept.id && c.to === relatedId) ||
              (c.from === relatedId && c.to === concept.id)
            )
            if (!existingConnection) {
              connections.push({
                from: concept.id,
                to: relatedId,
                weight: 0.8,
                type: 'related',
                label: 'related'
              })
            }
          }
        })
      }
      
      // Same conversation connections
      if (concept.occurrences) {
        concept.occurrences.forEach(occurrence => {
          conceptsData.forEach(otherConcept => {
            if (otherConcept.id !== concept.id && otherConcept.occurrences) {
              const sharedConversation = otherConcept.occurrences.some(
                otherOcc => otherOcc.conversationId === occurrence.conversationId
              )
              if (sharedConversation) {
                const existingConnection = connections.find(c => 
                  (c.from === concept.id && c.to === otherConcept.id) ||
                  (c.from === otherConcept.id && c.to === concept.id)
                )
                if (!existingConnection) {
                  connections.push({
                    from: concept.id,
                    to: otherConcept.id,
                    weight: 0.6,
                    type: 'conversation',
                    label: 'discussed together'
                  })
                }
              }
            }
          })
        })
      }
    })
    
    return connections
  }

  // Create lane-based layout with proper spacing like the demo
  const createLaneLayout = (conceptsData: EnhancedConcept[], connections: Connection[]): CategoryLane[] => {
    const laneHeaderHeight = 60
    const laneSpacing = 40
    const nodeWidth = 140
    const nodeHeight = 80
    const nodeSpacing = 24
    const laneStartX = 200
    const laneContentPadding = 20
    const maxLaneWidth = 1200
    
    // Group concepts by category
    const categoryGroups = conceptsData.reduce((groups, concept) => {
      const category = concept.category.split(' > ')[0] || 'General'
      if (!groups[category]) groups[category] = []
      groups[category].push(concept)
      return groups
    }, {} as Record<string, EnhancedConcept[]>)

    const lanes: CategoryLane[] = []
    let currentY = 80

    Object.entries(categoryGroups).forEach(([category, categoryConcepts], laneIndex) => {
      const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.default
      
      // Calculate stats
      const stats = {
        total: categoryConcepts.length,
        mastered: 0,
        learning: 0,
        struggling: 0
      }
      
      // Sort concepts by understanding strength (highest first)
      const sortedConcepts = categoryConcepts.sort((a, b) => 
        calculateUnderstandingStrength(b) - calculateUnderstandingStrength(a)
      )
      
      // Calculate optimal layout - limit concepts per row for readability
      const availableWidth = maxLaneWidth - laneStartX - 100
      const maxConceptsPerRow = Math.floor(availableWidth / (nodeWidth + nodeSpacing))
      const optimalConceptsPerRow = Math.min(4, Math.max(2, maxConceptsPerRow))
      const actualConceptsPerRow = Math.min(optimalConceptsPerRow, sortedConcepts.length)
      const totalRows = Math.ceil(sortedConcepts.length / actualConceptsPerRow)
      
      const nodes: ConceptNode[] = []
      
      sortedConcepts.forEach((concept, index) => {
        const row = Math.floor(index / actualConceptsPerRow)
        const col = index % actualConceptsPerRow
        const conceptsInThisRow = Math.min(actualConceptsPerRow, sortedConcepts.length - (row * actualConceptsPerRow))
        
        // Center concepts in each row
        const thisRowWidth = (conceptsInThisRow * nodeWidth) + ((conceptsInThisRow - 1) * nodeSpacing)
        const thisRowStartX = laneStartX + (availableWidth - thisRowWidth) / 2
        
        const x = thisRowStartX + col * (nodeWidth + nodeSpacing)
        const y = currentY + laneHeaderHeight + laneContentPadding + row * (nodeHeight + 20)
        
        const strength = calculateUnderstandingStrength(concept)
        
        // Update stats
        if (strength > 80) stats.mastered++
        else if (strength > 40) stats.learning++
        else stats.struggling++
        
        nodes.push({
          ...concept,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
          laneIndex,
          positionInLane: index
        })
      })
      
      // Calculate actual lane height based on content
      const laneContentHeight = Math.max(100, totalRows * nodeHeight + (totalRows - 1) * 20 + (laneContentPadding * 2))
      const actualLaneHeight = laneHeaderHeight + laneContentHeight
      
      lanes.push({
        category,
        color: config.color,
        icon: config.icon,
        concepts: nodes,
        y: currentY,
        height: actualLaneHeight,
        collapsed: false,
        stats
      })
      
      currentY += actualLaneHeight + laneSpacing
    })
    
    return lanes
  }

  // Initialize layout
  useEffect(() => {
    if (concepts.length > 0) {
      console.log('🛤️ Building lane-based knowledge graph...')
      const newConnections = buildConnections(concepts)
      const newLanes = createLaneLayout(concepts, newConnections)
      
      console.log(`📊 Created ${newLanes.length} lanes with ${newConnections.length} connections`)
      
      setConnections(newConnections)
      setLanes(newLanes)
    }
  }, [concepts])

  // Filter based on search and focus
  const { filteredLanes, filteredConnections } = useMemo(() => {
    let filteredLanes = lanes
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredLanes = lanes.map(lane => ({
        ...lane,
        concepts: lane.concepts.filter(concept => 
          concept.title.toLowerCase().includes(query) ||
          concept.category.toLowerCase().includes(query) ||
          concept.summary?.toLowerCase().includes(query)
        )
      })).filter(lane => lane.concepts.length > 0)
    }
    
    // Apply focus filter
    if (focusedLanes.size > 0) {
      filteredLanes = filteredLanes.filter(lane => focusedLanes.has(lane.category))
    }
    
    // Filter connections
    const visibleNodeIds = new Set(filteredLanes.flatMap(lane => lane.concepts.map(c => c.id)))
    const filteredConnections = connections.filter(conn => 
      conn.weight >= weightFilter &&
      visibleNodeIds.has(conn.from) &&
      visibleNodeIds.has(conn.to)
    )
    
    return { filteredLanes, filteredConnections }
  }, [lanes, connections, searchQuery, focusedLanes, weightFilter])

  // Get connected nodes for highlighting
  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>()
    filteredConnections.forEach(conn => {
      if (conn.from === nodeId) connected.add(conn.to)
      if (conn.to === nodeId) connected.add(conn.from)
    })
    return connected
  }

  const connectedNodes = hoveredNode || selectedNode ? 
    getConnectedNodeIds(hoveredNode || selectedNode!) : new Set()

  // Create curved connection paths between lanes
  const createConnectionPath = (fromNode: ConceptNode, toNode: ConceptNode): string => {
    const fromCenterX = fromNode.x + fromNode.width / 2
    const fromCenterY = fromNode.y + fromNode.height / 2
    const toCenterX = toNode.x + toNode.width / 2
    const toCenterY = toNode.y + toNode.height / 2
    
    // If nodes are in the same lane, use simple curve
    if (fromNode.laneIndex === toNode.laneIndex) {
      const midX = (fromCenterX + toCenterX) / 2
      const midY = (fromCenterY + toCenterY) / 2 - 30
      return `M ${fromCenterX} ${fromCenterY} Q ${midX} ${midY} ${toCenterX} ${toCenterY}`
    }
    
    // For cross-lane connections, route around lanes
    const controlOffset = Math.abs(toCenterY - fromCenterY) * 0.3
    const midX = (fromCenterX + toCenterX) / 2
    const controlY1 = fromCenterY - controlOffset
    const controlY2 = toCenterY - controlOffset
    
    return `M ${fromCenterX} ${fromCenterY} C ${fromCenterX} ${controlY1}, ${toCenterX} ${controlY2}, ${toCenterX} ${toCenterY}`
  }

  // Toggle lane focus
  const toggleLaneFocus = (category: string) => {
    const newFocused = new Set(focusedLanes)
    if (newFocused.has(category)) {
      newFocused.delete(category)
    } else {
      newFocused.add(category)
    }
    setFocusedLanes(newFocused)
  }

  // Toggle lane collapse
  const toggleLaneCollapse = (category: string) => {
    setLanes(prev => prev.map(lane => 
      lane.category === category 
        ? { ...lane, collapsed: !lane.collapsed }
        : lane
    ))
  }

  const resetView = () => {
    setFocusedLanes(new Set())
  }

  // Calculate total graph dimensions
  const graphDimensions = useMemo(() => {
    if (lanes.length === 0) return { width: 1400, height: 800 }
    
    const maxY = Math.max(...lanes.map(lane => lane.y + lane.height))
    const width = 1400
    const height = Math.max(800, maxY + 100)
    
    return { width, height }
  }, [lanes])

  // Abbreviate long titles
  const abbreviateTitle = (title: string, maxLength: number = 20): string => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength - 3) + '...'
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800/95 backdrop-blur rounded-lg p-4 space-y-3 max-w-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Weight Filter */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
            <Filter className="w-3 h-3" />
            Connection Strength ({weightFilter.toFixed(1)})
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weightFilter}
            onChange={(e) => setWeightFilter(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {/* Stats */}
        <div className="text-xs text-slate-400 space-y-1">
          <div>{filteredLanes.length} lanes visible</div>
          <div>{filteredLanes.reduce((sum, lane) => sum + lane.concepts.length, 0)} concepts</div>
          <div>{filteredConnections.length} connections</div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">

          <button
            onClick={resetView}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Lane Focus Controls */}
      {lanes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-slate-800/95 backdrop-blur rounded-lg p-3">
          <h4 className="text-sm font-medium text-white mb-2">Focus Lanes</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {lanes.map(lane => (
              <button
                key={lane.category}
                onClick={() => toggleLaneFocus(lane.category)}
                className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
                  focusedLanes.has(lane.category) || focusedLanes.size === 0
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{lane.icon}</span>
                <span className="truncate">{lane.category}</span>
                <span className="text-slate-500">({lane.concepts.length})</span>
              </button>
            ))}
          </div>
          {focusedLanes.size > 0 && (
            <button
              onClick={() => setFocusedLanes(new Set())}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Clear Focus
            </button>
          )}
        </div>
      )}

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${graphDimensions.width} ${graphDimensions.height}`}
      >
        <defs>
          {/* Connection gradients */}
          <linearGradient id="prerequisite" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
            <stop offset="100%" stopColor="rgba(249, 115, 22, 0.8)" />
          </linearGradient>
          
          <linearGradient id="related" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.7)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.7)" />
          </linearGradient>
          
          <linearGradient id="conversation" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.6)" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        <g>
          {/* Lane Backgrounds */}
          {filteredLanes.map((lane, index) => {
            const config = categoryConfig[lane.category as keyof typeof categoryConfig] || categoryConfig.default
            const isHighlighted = focusedLanes.size === 0 || focusedLanes.has(lane.category)
            
            return (
              <g key={lane.category}>
                {/* Lane Background */}
                <rect
                  x="50"
                  y={lane.y - 10}
                  width="1300"
                  height={lane.collapsed ? 60 : lane.height + 20}
                  fill={config.bgColor}
                  stroke={lane.color}
                  strokeWidth="2"
                  rx="16"
                  opacity={isHighlighted ? 1 : 0.3}
                  className="transition-opacity duration-300"
                />
                
                {/* Lane Header */}
                <g className="cursor-pointer" onClick={() => toggleLaneCollapse(lane.category)}>
                  <rect
                    x="70"
                    y={lane.y + 5}
                    width="1260"
                    height="50"
                    fill={lane.color}
                    rx="12"
                    opacity={isHighlighted ? 0.9 : 0.6}
                    className="transition-opacity duration-300"
                  />
                  
                  {/* Lane Icon */}
                  <circle
                    cx="100"
                    cy={lane.y + 30}
                    r="16"
                    fill="rgba(255,255,255,0.2)"
                    className="pointer-events-none"
                  />
                  <text
                    x="100"
                    y={lane.y + 36}
                    fill="white"
                    fontSize="16"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {lane.icon}
                  </text>
                  
                  {/* Lane Title */}
                  <text
                    x="130"
                    y={lane.y + 25}
                    fill="white"
                    fontSize="18"
                    fontWeight="700"
                    className="pointer-events-none"
                  >
                    {lane.category}
                  </text>
                  
                  {/* Lane Stats */}
                  <text
                    x="130"
                    y={lane.y + 42}
                    fill="rgba(255,255,255,0.9)"
                    fontSize="13"
                    className="pointer-events-none"
                  >
                    {lane.stats.total} concepts • {lane.stats.mastered} mastered • {lane.stats.learning} learning • {lane.stats.struggling} struggling
                  </text>
                  
                  {/* Progress Bar */}
                  <rect
                    x="600"
                    y={lane.y + 25}
                    width="200"
                    height="6"
                    fill="rgba(255,255,255,0.2)"
                    rx="3"
                    className="pointer-events-none"
                  />
                  <rect
                    x="600"
                    y={lane.y + 25}
                    width={200 * (lane.stats.mastered / Math.max(1, lane.stats.total))}
                    height="6"
                    fill="rgba(255,255,255,0.8)"
                    rx="3"
                    className="pointer-events-none"
                  />
                  
                  {/* Collapse Icon */}
                  <text
                    x="1300"
                    y={lane.y + 36}
                    fill="white"
                    fontSize="14"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {lane.collapsed ? '▼' : '▲'}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Connections */}
          {filteredConnections.map((connection, index) => {
            const fromNode = filteredLanes.flatMap(l => l.concepts).find(n => n.id === connection.from)
            const toNode = filteredLanes.flatMap(l => l.concepts).find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null
            
            const isHighlighted = (hoveredNode || selectedNode) && 
              (connection.from === (hoveredNode || selectedNode) || connection.to === (hoveredNode || selectedNode))
            
            const strokeWidth = Math.max(1, connection.weight * 2)
            const opacity = isHighlighted ? 0.9 : connection.weight * 0.5
            
            let strokeColor = "rgba(107, 114, 128, 0.4)"
            let strokeDasharray = "none"
            
            if (connection.type === 'prerequisite') {
              strokeColor = "url(#prerequisite)"
              strokeDasharray = "none"
            } else if (connection.type === 'related') {
              strokeColor = "url(#related)"
              strokeDasharray = "none"
            } else if (connection.type === 'conversation') {
              strokeColor = "url(#conversation)"
              strokeDasharray = "5,5"
            } else {
              strokeDasharray = "2,2"
            }
            
            return (
              <path
                key={index}
                d={createConnectionPath(fromNode, toNode)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                fill="none"
                opacity={opacity}
                className="transition-all duration-300"
              />
            )
          })}

          {/* Concept Nodes */}
          {filteredLanes.map(lane => 
            !lane.collapsed && lane.concepts.map((node) => {
              const isHovered = hoveredNode === node.id
              const isSelected = selectedNode === node.id
              const isConnected = connectedNodes.has(node.id)
              const isHighlighted = isHovered || isSelected || isConnected
              const nodeOpacity = (hoveredNode || selectedNode) ? (isHighlighted ? 1 : 0.4) : 1
              const strength = calculateUnderstandingStrength(node)
              
              return (
                <g key={node.id}>
                  {/* Node Background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    fill="rgba(30, 41, 59, 0.95)"
                    stroke={isSelected ? "#FFFFFF" : lane.color}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                    rx="8"
                    opacity={nodeOpacity}
                    filter={isHovered ? "url(#dropshadow)" : "none"}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={(e) => {
                      setHoveredNode(node.id)
                      const rect = svgRef.current?.getBoundingClientRect()
                      if (rect) {
                        setTooltip({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          concept: node
                        })
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredNode(null)
                      setTooltip(null)
                    }}
                    onClick={() => {
                      setSelectedNode(selectedNode === node.id ? null : node.id)
                      onConceptClick(node)
                    }}
                  />
                  
                  {/* Progress Indicator */}
                  <rect
                    x={node.x + 8}
                    y={node.y + 8}
                    width="6"
                    height="6"
                    fill={strength > 70 ? "#10B981" : strength > 40 ? "#F59E0B" : "#EF4444"}
                    rx="3"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  />
                  
                  {/* Node Title */}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + 25}
                    fill="white"
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  >
                    {node.title.length > 16 ? node.title.substring(0, 14) + '...' : node.title}
                  </text>
                  
                  {/* Understanding Percentage */}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + 45}
                    fill={strength > 70 ? "#10B981" : strength > 40 ? "#F59E0B" : "#EF4444"}
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  >
                    {Math.round(strength)}%
                  </text>
                  
                  {/* Progress Bar */}
                  <rect
                    x={node.x + 15}
                    y={node.y + 55}
                    width={node.width - 30}
                    height="4"
                    fill="rgba(255,255,255,0.2)"
                    rx="2"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  />
                  <rect
                    x={node.x + 15}
                    y={node.y + 55}
                    width={(node.width - 30) * (strength / 100)}
                    height="4"
                    fill={strength > 70 ? "#10B981" : strength > 40 ? "#F59E0B" : "#EF4444"}
                    rx="2"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  />
                  
                  {/* Connection Count */}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + 72}
                    fill="rgba(255,255,255,0.6)"
                    fontSize="10"
                    textAnchor="middle"
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  >
                    {filteredConnections.filter(c => c.from === node.id || c.to === node.id).length} connections
                  </text>
                </g>
              )
            })
          )}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl max-w-sm pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <h4 className="text-white font-semibold mb-1">{tooltip.concept.title}</h4>
          <p className="text-slate-300 text-sm mb-2">{tooltip.concept.summary}</p>
          <div className="text-xs text-slate-400">
            <div>Category: {tooltip.concept.category}</div>
            <div>Understanding: {calculateUnderstandingStrength(tooltip.concept)}%</div>
            {tooltip.concept.masteryLevel && (
              <div>Mastery: {tooltip.concept.masteryLevel}</div>
            )}
          </div>
        </div>
      )}

      {/* Connection Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-800/95 backdrop-blur rounded-lg p-3">
        <h4 className="text-sm font-medium text-white mb-2">Connections</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
            <span className="text-slate-300">Prerequisites</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-slate-300">Related</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-green-500 to-cyan-500" style={{strokeDasharray: "2,2"}} />
            <span className="text-slate-300">Discussed Together</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500" style={{strokeDasharray: "1,1"}} />
            <span className="text-slate-300">Same Category</span>
          </div>
        </div>
      </div>
    </div>
  )
} 