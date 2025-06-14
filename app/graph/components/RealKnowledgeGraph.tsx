import React, { useState, useEffect, useRef, useMemo } from 'react'
import { EnhancedConcept, processEnhancedConcept } from '../types'
import { Search, Filter, Target, BookOpen, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface Connection {
  from: string
  to: string
  weight: number
  type: 'prerequisite' | 'related' | 'category' | 'conversation'
  label?: string
}

interface GraphNode extends EnhancedConcept {
  x: number
  y: number
  radius: number
  connections: Connection[]
}

interface RealKnowledgeGraphProps {
  concepts: EnhancedConcept[]
  onConceptClick: (concept: EnhancedConcept) => void
  interviewMode: boolean
  className?: string
}

export const RealKnowledgeGraph: React.FC<RealKnowledgeGraphProps> = ({
  concepts,
  onConceptClick,
  interviewMode,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [weightFilter, setWeightFilter] = useState(0.3)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Category colors
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
    'Artificial Intelligence': '#8B5CF6',
    'General': '#6B7280',
    'default': '#6B7280'
  }

  // Calculate understanding strength properly
  const calculateUnderstandingStrength = (concept: EnhancedConcept): number => {
    let strength = 0
    
    // Base on learning progress if available
    if (concept.learningProgress && concept.learningProgress > 0) {
      strength = concept.learningProgress
    } else {
      // Calculate from other factors
      let totalScore = 0
      let maxScore = 0
      
      // Practice count factor (0-40 points)
      if (concept.practiceCount !== undefined) {
        totalScore += Math.min(40, concept.practiceCount * 8)
        maxScore += 40
      }
      
      // Review count factor (0-30 points)
      if (concept.reviewCount !== undefined) {
        totalScore += Math.min(30, concept.reviewCount * 6)
        maxScore += 30
      }
      
      // Mastery level factor (0-50 points)
      if (concept.masteryLevel) {
        const masteryScores = {
          'BEGINNER': 20,
          'INTERMEDIATE': 35,
          'ADVANCED': 45,
          'EXPERT': 50
        }
        totalScore += masteryScores[concept.masteryLevel as keyof typeof masteryScores] || 0
        maxScore += 50
      }
      
      // Confidence score factor (0-30 points)
      if (concept.confidenceScore !== undefined && concept.confidenceScore > 0) {
        totalScore += concept.confidenceScore * 30
        maxScore += 30
      }
      
      // Personal rating factor (0-25 points)
      if (concept.personalRating && concept.personalRating > 0) {
        totalScore += concept.personalRating * 5
        maxScore += 25
      }
      
      // Occurrences factor (0-20 points)
      if (concept.occurrences && concept.occurrences.length > 0) {
        totalScore += Math.min(20, concept.occurrences.length * 4)
        maxScore += 20
      }
      
      // Calculate percentage if we have factors, otherwise default to low
      strength = maxScore > 0 ? Math.min(100, (totalScore / maxScore) * 100) : 15
    }
    
    return Math.round(strength)
  }

  // Build real connections between concepts
  const buildConnections = (conceptsData: EnhancedConcept[]): Connection[] => {
    const connections: Connection[] = []
    
    conceptsData.forEach(concept => {
      const processed = processEnhancedConcept(concept)
      
      // 1. Prerequisites connections (strongest)
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
      
      // 2. Related concepts connections (strong)
      if (processed.relatedConceptsParsed && Array.isArray(processed.relatedConceptsParsed)) {
        processed.relatedConceptsParsed.forEach((relatedId: string) => {
          const targetConcept = conceptsData.find(c => c.id === relatedId)
          if (targetConcept) {
            // Avoid duplicate connections
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
      
      // 3. Same conversation connections (medium)
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
      
      // 4. Same category connections (weaker)
      conceptsData.forEach(otherConcept => {
        if (otherConcept.id !== concept.id && 
            concept.category === otherConcept.category) {
          const existingConnection = connections.find(c => 
            (c.from === concept.id && c.to === otherConcept.id) ||
            (c.from === otherConcept.id && c.to === concept.id)
          )
          if (!existingConnection) {
            connections.push({
              from: concept.id,
              to: otherConcept.id,
              weight: 0.4,
              type: 'category',
              label: 'same category'
            })
          }
        }
      })
    })
    
    return connections
  }

  // Position nodes using force-directed layout
  const positionNodes = (conceptsData: EnhancedConcept[], connections: Connection[]): GraphNode[] => {
    const width = 1200
    const height = 800
    const centerX = width / 2
    const centerY = height / 2
    
    // Initialize nodes with random positions
    const nodes: GraphNode[] = conceptsData.map(concept => {
      const strength = calculateUnderstandingStrength(concept)
      const baseRadius = 15
      const strengthMultiplier = 1 + (strength / 100) * 0.8
      const connectionCount = connections.filter(c => c.from === concept.id || c.to === concept.id).length
      const connectionMultiplier = 1 + Math.min(connectionCount / 10, 0.5)
      
      return {
        ...concept,
        x: centerX + (Math.random() - 0.5) * width * 0.8,
        y: centerY + (Math.random() - 0.5) * height * 0.8,
        radius: baseRadius * strengthMultiplier * connectionMultiplier,
        connections: connections.filter(c => c.from === concept.id || c.to === concept.id)
      }
    })
    
    // Simple force-directed positioning
    for (let iteration = 0; iteration < 100; iteration++) {
      nodes.forEach(node => {
        let forceX = 0
        let forceY = 0
        
        // Repulsion from other nodes
        nodes.forEach(otherNode => {
          if (otherNode.id !== node.id) {
            const dx = node.x - otherNode.x
            const dy = node.y - otherNode.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance > 0) {
              const repulsion = 1000 / (distance * distance)
              forceX += (dx / distance) * repulsion
              forceY += (dy / distance) * repulsion
            }
          }
        })
        
        // Attraction to connected nodes
        connections.forEach(connection => {
          let connectedNode: GraphNode | undefined
          if (connection.from === node.id) {
            connectedNode = nodes.find(n => n.id === connection.to)
          } else if (connection.to === node.id) {
            connectedNode = nodes.find(n => n.id === connection.from)
          }
          
          if (connectedNode) {
            const dx = connectedNode.x - node.x
            const dy = connectedNode.y - node.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance > 0) {
              const attraction = connection.weight * 0.1
              forceX += (dx / distance) * attraction
              forceY += (dy / distance) * attraction
            }
          }
        })
        
        // Apply forces with damping
        const damping = 0.1
        node.x += forceX * damping
        node.y += forceY * damping
        
        // Keep nodes within bounds
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x))
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y))
      })
    }
    
    return nodes
  }

  // Initialize graph
  useEffect(() => {
    if (concepts.length > 0) {
      console.log('🔗 Building real knowledge graph connections...')
      const newConnections = buildConnections(concepts)
      console.log(`📊 Found ${newConnections.length} connections:`, {
        prerequisites: newConnections.filter(c => c.type === 'prerequisite').length,
        related: newConnections.filter(c => c.type === 'related').length,
        conversations: newConnections.filter(c => c.type === 'conversation').length,
        categories: newConnections.filter(c => c.type === 'category').length
      })
      
      const newNodes = positionNodes(concepts, newConnections)
      console.log('🎯 Understanding strengths calculated:', 
        newNodes.map(n => ({ title: n.title, strength: calculateUnderstandingStrength(n) }))
      )
      
      setConnections(newConnections)
      setNodes(newNodes)
    }
  }, [concepts])

  // Filter connections and nodes
  const { filteredNodes, filteredConnections } = useMemo(() => {
    let filteredNodes = nodes
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredNodes = nodes.filter(node => 
        node.title.toLowerCase().includes(query) ||
        node.category.toLowerCase().includes(query) ||
        node.summary?.toLowerCase().includes(query)
      )
    }
    
    // Filter connections by weight and include only connections between visible nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredConnections = connections.filter(conn => 
      conn.weight >= weightFilter &&
      nodeIds.has(conn.from) &&
      nodeIds.has(conn.to)
    )
    
    return { filteredNodes, filteredConnections }
  }, [nodes, connections, searchQuery, weightFilter])

  // Get connected nodes for highlighting
  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>()
    filteredConnections.forEach(conn => {
      if (conn.from === nodeId) connected.add(conn.to)
      if (conn.to === nodeId) connected.add(conn.from)
    })
    return connected
  }

  const connectedNodes = hoveredNode ? getConnectedNodeIds(hoveredNode) : new Set()

  // Create curved path for connections
  const createCurvedPath = (fromNode: GraphNode, toNode: GraphNode): string => {
    const dx = toNode.x - fromNode.x
    const dy = toNode.y - fromNode.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const controlOffset = Math.min(distance * 0.3, 80)
    const midX = (fromNode.x + toNode.x) / 2
    const midY = (fromNode.y + toNode.y) / 2
    
    const perpX = -dy / distance * controlOffset
    const perpY = dx / distance * controlOffset
    
    const controlX = midX + perpX
    const controlY = midY + perpY
    
    return `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg p-4 space-y-3 max-w-xs">
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
        
        <div className="text-xs text-slate-400">
          {filteredNodes.length} concepts, {filteredConnections.length} connections
        </div>
        
        {/* Zoom Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={resetView}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
          
          {/* Connection type gradients */}
          <linearGradient id="prerequisite" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
            <stop offset="100%" stopColor="rgba(249, 115, 22, 0.8)" />
          </linearGradient>
          
          <linearGradient id="related" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.6)" />
          </linearGradient>
          
          <linearGradient id="conversation" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.5)" />
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Connections */}
          {filteredConnections.map((connection, index) => {
            const fromNode = filteredNodes.find(n => n.id === connection.from)
            const toNode = filteredNodes.find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null
            
            const isHighlighted = hoveredNode && 
              (connection.from === hoveredNode || connection.to === hoveredNode)
            
            const strokeWidth = Math.max(1, connection.weight * 3)
            const opacity = isHighlighted ? 0.9 : connection.weight * 0.7
            
            let strokeColor = "rgba(107, 114, 128, 0.4)"
            if (connection.type === 'prerequisite') strokeColor = "url(#prerequisite)"
            else if (connection.type === 'related') strokeColor = "url(#related)"
            else if (connection.type === 'conversation') strokeColor = "url(#conversation)"
            
            return (
              <g key={index}>
                <path
                  d={createCurvedPath(fromNode, toNode)}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={opacity}
                  className="transition-all duration-300"
                />
                {/* Connection label on hover */}
                {isHighlighted && connection.label && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    {connection.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const category = node.category.split(' > ')[0] || 'default'
            const color = categoryColors[category as keyof typeof categoryColors] || categoryColors.default
            const isHovered = hoveredNode === node.id
            const isConnected = connectedNodes.has(node.id)
            const nodeOpacity = hoveredNode ? (isHovered || isConnected ? 1 : 0.3) : 0.9
            const strength = calculateUnderstandingStrength(node)
            
            return (
              <g key={node.id}>
                {/* Node Glow */}
                {(isHovered || isConnected) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + 8}
                    fill={`${color}40`}
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Main Node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={color}
                  stroke={isHovered ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                  strokeWidth={isHovered ? 3 : 1}
                  opacity={nodeOpacity}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onConceptClick(node)}
                />

                {/* Understanding Strength Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius - 3}
                  fill="none"
                  stroke={strength > 70 ? "#10B981" : strength > 40 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="2"
                  strokeDasharray={`${(strength / 100) * (2 * Math.PI * (node.radius - 3))} ${2 * Math.PI * (node.radius - 3)}`}
                  opacity={nodeOpacity * 0.8}
                  className="pointer-events-none"
                />

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y + node.radius + 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="500"
                  opacity={nodeOpacity}
                  className="pointer-events-none"
                >
                  {node.title.length > 20 ? node.title.substring(0, 17) + '...' : node.title}
                </text>

                {/* Understanding Percentage */}
                <text
                  x={node.x}
                  y={node.y + 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="600"
                  opacity={nodeOpacity}
                  className="pointer-events-none"
                >
                  {strength}%
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur rounded-lg p-3">
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
            <div className="w-4 h-0.5 bg-gradient-to-r from-green-500 to-cyan-500" />
            <span className="text-slate-300">Discussed Together</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500" />
            <span className="text-slate-300">Same Category</span>
          </div>
        </div>
      </div>
    </div>
  )
} 