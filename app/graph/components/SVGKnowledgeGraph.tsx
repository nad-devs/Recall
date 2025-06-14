import React, { useState, useEffect, useRef } from 'react'
import { EnhancedConcept, processEnhancedConcept } from '../types'
import { Filter, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface Connection {
  from: string
  to: string
  weight: number
  type: 'category' | 'learning' | 'content'
}

interface ConceptNode extends EnhancedConcept {
  x: number
  y: number
  radius: number
}

interface SVGKnowledgeGraphProps {
  concepts: EnhancedConcept[]
  onConceptClick: (concept: EnhancedConcept) => void
  className?: string
}

export const SVGKnowledgeGraph: React.FC<SVGKnowledgeGraphProps> = ({
  concepts,
  onConceptClick,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<ConceptNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [weightFilter, setWeightFilter] = useState(0.3)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Category colors for visual grouping
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
    'default': '#6B7280'
  }

  // Calculate intelligent node positions based on categories
  const calculateNodePositions = (conceptsData: EnhancedConcept[]): ConceptNode[] => {
    const width = 1200
    const height = 800
    const centerX = width / 2
    const centerY = height / 2

    // Group concepts by category
    const categoryGroups = conceptsData.reduce((groups, concept) => {
      const category = concept.category.split(' > ')[0] || 'Other'
      if (!groups[category]) groups[category] = []
      groups[category].push(concept)
      return groups
    }, {} as Record<string, EnhancedConcept[]>)

    const categories = Object.keys(categoryGroups)
    const nodes: ConceptNode[] = []

    categories.forEach((category, categoryIndex) => {
      const categoryNodes = categoryGroups[category]
      const nodeCount = categoryNodes.length
      
      // Calculate category cluster position (circular arrangement)
      const categoryAngle = (categoryIndex / categories.length) * 2 * Math.PI
      const categoryRadius = Math.min(width, height) * 0.25 + (categoryIndex % 2) * 60
      
      const categoryCenterX = centerX + Math.cos(categoryAngle) * categoryRadius
      const categoryCenterY = centerY + Math.sin(categoryAngle) * categoryRadius

      // Position nodes within category cluster
      categoryNodes.forEach((concept, nodeIndex) => {
        let nodeX, nodeY
        
        if (nodeCount === 1) {
          // Single node at category center
          nodeX = categoryCenterX
          nodeY = categoryCenterY
        } else if (nodeCount <= 6) {
          // Small cluster - circular arrangement
          const nodeAngle = (nodeIndex / nodeCount) * 2 * Math.PI
          const nodeRadius = 40 + Math.random() * 20
          nodeX = categoryCenterX + Math.cos(nodeAngle) * nodeRadius
          nodeY = categoryCenterY + Math.sin(nodeAngle) * nodeRadius
        } else {
          // Larger cluster - grid with some randomness
          const cols = Math.ceil(Math.sqrt(nodeCount))
          const row = Math.floor(nodeIndex / cols)
          const col = nodeIndex % cols
          const gridSpacing = 60
          
          nodeX = categoryCenterX + (col - cols/2) * gridSpacing + (Math.random() - 0.5) * 20
          nodeY = categoryCenterY + (row - Math.ceil(nodeCount/cols)/2) * gridSpacing + (Math.random() - 0.5) * 20
        }

        // Calculate node size based on importance
        const baseRadius = 20
        const progressMultiplier = concept.learningProgress ? concept.learningProgress / 100 : 0.5
        const connectionMultiplier = Math.min(1, (concept.occurrences?.length || 1) / 5)
        const radius = baseRadius + (progressMultiplier * 10) + (connectionMultiplier * 5)

        nodes.push({
          ...concept,
          x: nodeX,
          y: nodeY,
          radius: radius
        })
      })
    })

    return nodes
  }

  // Calculate connections between concepts with weights
  const calculateConnections = (nodes: ConceptNode[]): Connection[] => {
    const connections: Connection[] = []
    
    nodes.forEach(node => {
      const processed = processEnhancedConcept(node)
      
      // Related concepts connections
      processed.relatedConceptsParsed?.forEach((relatedId: string) => {
        const targetNode = nodes.find(n => n.id === relatedId)
        if (targetNode) {
          const weight = 0.8 // High weight for explicit relationships
          connections.push({
            from: node.id,
            to: relatedId,
            weight,
            type: 'content'
          })
        }
      })

      // Category-based connections
      nodes.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          const sameCategory = node.category === otherNode.category
          const sharedOccurrences = node.occurrences?.some(occ => 
            otherNode.occurrences?.some(otherOcc => occ.conversationId === otherOcc.conversationId)
          )
          
          if (sameCategory && sharedOccurrences) {
            const weight = 0.6
            if (!connections.find(c => 
              (c.from === node.id && c.to === otherNode.id) || 
              (c.from === otherNode.id && c.to === node.id)
            )) {
              connections.push({
                from: node.id,
                to: otherNode.id,
                weight,
                type: 'learning'
              })
            }
          } else if (sameCategory) {
            const weight = 0.4
            if (!connections.find(c => 
              (c.from === node.id && c.to === otherNode.id) || 
              (c.from === otherNode.id && c.to === node.id)
            )) {
              connections.push({
                from: node.id,
                to: otherNode.id,
                weight,
                type: 'category'
              })
            }
          }
        }
      })
    })

    return connections
  }

  // Initialize graph when concepts change
  useEffect(() => {
    if (concepts.length > 0) {
      const newNodes = calculateNodePositions(concepts)
      const newConnections = calculateConnections(newNodes)
      setNodes(newNodes)
      setConnections(newConnections)
    }
  }, [concepts])

  // Filter connections based on weight
  const filteredConnections = connections.filter(conn => conn.weight >= weightFilter)

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
  const createCurvedPath = (fromNode: ConceptNode, toNode: ConceptNode): string => {
    const dx = toNode.x - fromNode.x
    const dy = toNode.y - fromNode.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Control point for curve (perpendicular offset)
    const controlOffset = Math.min(distance * 0.3, 100)
    const midX = (fromNode.x + toNode.x) / 2
    const midY = (fromNode.y + toNode.y) / 2
    
    // Perpendicular direction
    const perpX = -dy / distance * controlOffset
    const perpY = dx / distance * controlOffset
    
    const controlX = midX + perpX
    const controlY = midY + perpY
    
    return `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`
  }

  // Handle mouse events for pan and zoom
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
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
            <Filter className="w-3 h-3" />
            Connection Strength Filter
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weightFilter}
            onChange={(e) => setWeightFilter(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>All</span>
            <span>Strong</span>
          </div>
        </div>
        
        <div className="text-xs text-slate-400">
          Showing {filteredConnections.length} connections
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={resetView}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Knowledge Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
          
          {/* Gradients for connections */}
          <linearGradient id="strongConnection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.6)" />
          </linearGradient>
          
          <linearGradient id="mediumConnection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Connections */}
          {filteredConnections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from)
            const toNode = nodes.find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null
            
            const isHighlighted = hoveredNode && 
              (connection.from === hoveredNode || connection.to === hoveredNode)
            
            const strokeWidth = Math.max(1, connection.weight * 4)
            const opacity = isHighlighted ? 0.9 : connection.weight * 0.6
            const strokeColor = connection.weight > 0.7 ? "url(#strongConnection)" : 
                              connection.weight > 0.5 ? "url(#mediumConnection)" :
                              "rgba(107, 114, 128, 0.3)"
            
            return (
              <path
                key={index}
                d={createCurvedPath(fromNode, toNode)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={opacity}
                className="transition-all duration-300"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const category = node.category.split(' > ')[0] || 'default'
            const color = categoryColors[category as keyof typeof categoryColors] || categoryColors.default
            const isHovered = hoveredNode === node.id
            const isConnected = connectedNodes.has(node.id)
            const nodeOpacity = hoveredNode ? (isHovered || isConnected ? 1 : 0.3) : 0.9
            
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
                  className="cursor-pointer transition-all duration-300 hover:stroke-white"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onConceptClick(node)}
                />

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y + node.radius + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  opacity={nodeOpacity}
                  className="pointer-events-none"
                >
                  {node.title.length > 15 ? node.title.substring(0, 12) + '...' : node.title}
                </text>

                {/* Progress Indicator */}
                {node.learningProgress !== undefined && (
                  <circle
                    cx={node.x + node.radius - 5}
                    cy={node.y - node.radius + 5}
                    r="6"
                    fill={node.learningProgress > 80 ? "#10B981" : node.learningProgress > 60 ? "#F59E0B" : "#EF4444"}
                    opacity={nodeOpacity}
                    className="pointer-events-none"
                  />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg p-3">
        <h4 className="text-sm font-medium text-white mb-2">Categories</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(categoryColors).slice(0, 6).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-300">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 