import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Brain, Target, BookOpen, Search, Eye, EyeOff, Code, Cloud, Database, Cpu, Network, Shield, Zap, Settings, FileText, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

// Physics node interface - simplified for geometric positioning with collision detection
interface GeometricNode {
  id: string;
  x: number;
  y: number;
  originalX: number; // Keep track of geometric position
  originalY: number;
  radius: number;
  type: 'concept' | 'subcategory';
  fixed?: boolean;
}

// Add tooltip state interface
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: any;
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

// Generate subcategories within clusters - only for categories with actual subcategories
const generateSubcategories = (clusterConcepts: Concept[]) => {
  const subcategoryMap = new Map<string, Concept[]>();
  
  clusterConcepts.forEach(concept => {
    // Extract subcategory from full category path (e.g., "Machine Learning > Neural Networks" -> "Neural Networks")
    const categoryParts = concept.category.split(' > ');
    
    // Only create subcategories if there are actually subcategories (more than 1 part)
    if (categoryParts.length > 1) {
      const subcategory = categoryParts[categoryParts.length - 1];
      
      if (!subcategoryMap.has(subcategory)) {
        subcategoryMap.set(subcategory, []);
      }
      subcategoryMap.get(subcategory)!.push(concept);
    }
  });
  
  return Array.from(subcategoryMap.entries()).map(([name, concepts]) => ({
    name,
    concepts,
    count: concepts.length
  }));
};

const generateClustersFromData = (concepts: Concept[]): SemanticCluster[] => {
  const categoryMap = new Map<string, Concept[]>();

  // Group concepts by their top-level category
  concepts.forEach(concept => {
    const topLevelCategory = concept.category.split(' > ')[0];
    if (!categoryMap.has(topLevelCategory)) {
      categoryMap.set(topLevelCategory, []);
    }
    categoryMap.get(topLevelCategory)!.push(concept);
  });

  // Define colors for consistency
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"
  ];

  // Define icons for categories - fallback to a default
  const icons: { [key: string]: React.ComponentType<any> } = {
    "LeetCode & Algorithms": Code,
    "Cloud & Infrastructure": Cloud,
    "Machine Learning & AI": Brain,
    "Data & Databases": Database,
    "System Architecture": Cpu,
    "Security & Authentication": Shield,
    "Performance & Optimization": Zap,
    "Web Development": Network,
  };

  const clusters: SemanticCluster[] = [];
  let colorIndex = 0;

  Array.from(categoryMap.entries()).forEach(([name, concepts]) => {
    const cols = 3;
    const row = Math.floor(clusters.length / cols);
    const col = clusters.length % cols;
    
    clusters.push({
      id: `cluster-${name.replace(/\s+/g, '-')}`,
      name: name,
      concepts: concepts,
      color: colors[colorIndex % colors.length],
      icon: icons[name] || Settings,
      position: {
        x: col * 700 + 450,
        y: row * 600 + 350
      },
      keywords: [] // No longer needed
    });

    colorIndex++;
  });

  return clusters;
};

// Collision detection and minimal adjustment
const detectAndResolveCollisions = (nodes: { [key: string]: GeometricNode }, clusters: SemanticCluster[]): { [key: string]: GeometricNode } => {
  const nodeArray = Object.values(nodes);
  const maxIterations = 50;
  let iteration = 0;

  // Create a map for quick cluster lookup for each node
  const nodeToClusterMap = new Map<string, SemanticCluster>();
  nodeArray.forEach(node => {
    const cluster = clusters.find(c => c.concepts.some(concept => concept.id === node.id || `subcategory-${c.id}-${node.id.split('-')[2]}` === node.id));
    if(cluster) {
      nodeToClusterMap.set(node.id, cluster);
    }
  });


  while (iteration < maxIterations) {
    let hasCollisions = false;
    
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const nodeA = nodeArray[i];
        const nodeB = nodeArray[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let minDistance = nodeA.radius + nodeB.radius;
        
        if (nodeA.type === 'concept' && nodeB.type === 'concept') {
          minDistance += 45; 
        } else if (nodeA.type === 'subcategory' && nodeB.type === 'subcategory') {
          minDistance += 30;
        } else {
          minDistance += 35; 
        }
        
        if (distance < minDistance && distance > 0) {
          hasCollisions = true;
          
          const overlap = minDistance - distance;
          const correctionFactor = overlap / distance * 0.5;
          
          const forceMultiplier = 0.7; // Reduced repulsion force
          
          const correctionX = dx * correctionFactor * forceMultiplier;
          const correctionY = dy * correctionFactor * forceMultiplier;
          
          nodeA.x -= correctionX;
          nodeA.y -= correctionY;
          nodeB.x += correctionX;
          nodeB.y += correctionY;
        }
      }
    }

    // Boundary enforcement
    nodeArray.forEach(node => {
      const parentCluster = nodeToClusterMap.get(node.id);
      if (parentCluster) {
        const boundaryRadius = 450; // Tighter boundary
        const dx = node.x - parentCluster.position.x;
        const dy = node.y - parentCluster.position.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > boundaryRadius) {
          hasCollisions = true;
          const pullFactor = (dist - boundaryRadius) / dist * 0.1; // Gentle pull back
          node.x -= dx * pullFactor;
          node.y -= dy * pullFactor;
        }
      }
    });
    
    if (!hasCollisions) break;
    iteration++;
  }

  const result: { [key: string]: GeometricNode } = {};
  nodeArray.forEach(node => {
    result[node.id] = node;
  });
  
  return result;
};

const KnowledgeCompanion: React.FC<KnowledgeCompanionProps> = ({
  concepts,
  categories,
  onConceptSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'learning' | 'interview'>('learning');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [animatingSubcategories, setAnimatingSubcategories] = useState<Set<string>>(new Set());
  
  // Physics state
  const [physicsNodes, setPhysicsNodes] = useState<{ [key: string]: GeometricNode }>({});

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });

  // Generate semantic clusters - MEMOIZED to prevent recalculation
  const semanticClusters = React.useMemo(() => 
    generateClustersFromData(concepts), 
    [concepts]
  );

  // Filter concepts - MEMOIZED
  const filteredConcepts = React.useMemo(() => {
    return concepts.filter(concept => {
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
  }, [concepts, selectedClusters, searchQuery, semanticClusters]);

  // Parse JSON fields safely
  const parseJsonField = (jsonString: string | undefined, fallback: any = []) => {
    if (!jsonString || jsonString.trim() === '') return fallback;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Memoize the geometric position generation function
  const generateGeometricPositions = React.useCallback((): { [key: string]: GeometricNode } => {
    const geometricNodes: { [key: string]: GeometricNode } = {};
    
  semanticClusters.forEach(cluster => {
      const subcategories = generateSubcategories(
        cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id))
      );
    
    if (subcategories.length > 0) {
      subcategories.forEach((subcategory, index) => {
          const key = `subcategory-${cluster.id}-${subcategory.name}`;
          let angle, radius;
          
          // Create a "safe zone" for the cluster title at the top
          const totalNodes = subcategories.length;
          const startAngle = 0.6 * Math.PI;
          const endAngle = 2.4 * Math.PI;
          const angleRange = endAngle - startAngle;

          if (subcategories.length <= 6) {
            angle = totalNodes > 1 ? startAngle + (index / (totalNodes - 1)) * angleRange : startAngle;
            radius = 180 + (subcategories.length * 8); // Reduced radius
            
            const subcategoryX = cluster.position.x + Math.cos(angle) * radius;
            const subcategoryY = cluster.position.y + Math.sin(angle) * radius;
            geometricNodes[key] = { id: key, x: subcategoryX, y: subcategoryY, originalX: subcategoryX, originalY: subcategoryY, radius: 50, type: 'subcategory', fixed: false };
        } else {
            const cols = Math.ceil(Math.sqrt(subcategories.length));
            const row = Math.floor(index / cols);
            const col = index % cols;
            const gridX = cluster.position.x + (col - cols/2) * 200; // Reduced grid spacing
            const gridY = cluster.position.y + (row - Math.ceil(subcategories.length/cols)/2) * 200; // Reduced grid spacing
            geometricNodes[key] = { id: key, x: gridX, y: gridY, originalX: gridX, originalY: gridY, radius: 50, type: 'subcategory', fixed: false };
          }

          const node = geometricNodes[key];
          if (expandedSubcategories.has(`${cluster.id}-${subcategory.name}`)) {
            const baseAngle = Math.atan2(node.y - cluster.position.y, node.x - cluster.position.x);
            const arcSpan = Math.PI * 1.5; 
            const totalConcepts = subcategory.concepts.length;

            subcategory.concepts.forEach((concept, conceptIndex) => {
              const conceptRadius = 90; // Reduced concept orbit
              let conceptAngle;

              if (totalConcepts === 1) {
                conceptAngle = baseAngle;
        } else {
                conceptAngle = baseAngle - (arcSpan / 2) + (conceptIndex / (totalConcepts - 1)) * arcSpan;
              }
              
              const conceptX = node.x + Math.cos(conceptAngle) * conceptRadius;
              const conceptY = node.y + Math.sin(conceptAngle) * conceptRadius;
              geometricNodes[concept.id] = { id: concept.id, x: conceptX, y: conceptY, originalX: conceptX, originalY: conceptY, radius: 35, type: 'concept', fixed: false };
      });
    }
  });
      } else {
        const clusterConcepts = cluster.concepts.filter(concept => filteredConcepts.some(fc => fc.id === concept.id));
        clusterConcepts.forEach((concept, index) => {
          let angle, radius;
          const baseRadius = 150;

          // Create a "safe zone" for the cluster title at the top
          const totalNodes = clusterConcepts.length;
          const startAngle = 0.6 * Math.PI; // Start angle (around 5 o'clock)
          const endAngle = 2.4 * Math.PI;   // End angle (around 1 o'clock)
          const angleRange = endAngle - startAngle;

          if (clusterConcepts.length <= 8) {
            angle = totalNodes > 1 ? startAngle + (index / (totalNodes - 1)) * angleRange : startAngle;
            radius = baseRadius + (clusterConcepts.length * 20);
          } else {
            const spiralFactor = index / clusterConcepts.length;
            angle = startAngle + spiralFactor * (angleRange * 1.5); // Spiral within the allowed arc
            radius = baseRadius + spiralFactor * 220;
          }
          
          const conceptX = cluster.position.x + Math.cos(angle) * radius;
          const conceptY = cluster.position.y + Math.sin(angle) * radius;
          geometricNodes[concept.id] = { id: concept.id, x: conceptX, y: conceptY, originalX: conceptX, originalY: conceptY, radius: 35, type: 'concept', fixed: false };
        });
      }
    });
    
    return detectAndResolveCollisions(geometricNodes, semanticClusters);
  }, [semanticClusters, filteredConcepts, expandedSubcategories]);

  // Generate and update geometric nodes
  React.useEffect(() => {
    setPhysicsNodes(generateGeometricPositions());
  }, [generateGeometricPositions]);

  // Generate connections - MEMOIZED to stop infinite recalculation
  const connections = React.useMemo(() => {
    return concepts.flatMap(concept => {
    const relatedIds = parseJsonField(concept.relatedConcepts, []);
    
    return relatedIds.map((relatedItem: any) => {
      let targetConceptId: string | null = null;
      let targetConcept: any;
      
      if (typeof relatedItem === 'string') {
        targetConceptId = relatedItem;
        targetConcept = concepts.find(c => c.id === targetConceptId);
      } else if (typeof relatedItem === 'object' && relatedItem !== null) {
        if (relatedItem.id) {
          targetConceptId = relatedItem.id;
          targetConcept = concepts.find(c => c.id === targetConceptId);
        } else if (relatedItem.title) {
          targetConcept = concepts.find(c => c.title === relatedItem.title);
          targetConceptId = targetConcept?.id || null;
        }
      }
      
        if (!targetConcept || !targetConceptId) return null;
      
        const fromPos = physicsNodes[concept.id];
        const toPos = physicsNodes[targetConceptId];
      
        if (!fromPos || !toPos) return null;
      
      return {
        from: concept.id,
        to: targetConceptId,
          fromPos: { x: fromPos.x, y: fromPos.y },
          toPos: { x: toPos.x, y: toPos.y },
        fromConcept: concept,
        toConcept: targetConcept
      };
    }).filter(Boolean);
  });
  }, [concepts, physicsNodes]);

  const hoveredConnections = React.useMemo(() => {
    const nodeSet = new Set<string>();
    const connectionSet = new Set<string>();

    if (hoveredConcept) {
      nodeSet.add(hoveredConcept);
      connections.forEach((conn: any) => {
        const key = [conn.from, conn.to].sort().join('-');
        if (conn.from === hoveredConcept) {
          nodeSet.add(conn.to);
          connectionSet.add(key);
        }
        if (conn.to === hoveredConcept) {
          nodeSet.add(conn.from);
          connectionSet.add(key);
        }
      });
    }
    return { nodes: nodeSet, connections: connectionSet };
  }, [hoveredConcept, connections]);

  // Get visible concept IDs
  const visibleConceptIds = React.useMemo(() => {
    const visibleIds = new Set<string>();
    
    semanticClusters.forEach(cluster => {
      const subcategories = generateSubcategories(
        cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id))
      );
      
      if (subcategories.length > 0) {
        subcategories.forEach(subcategory => {
          const key = `${cluster.id}-${subcategory.name}`;
          if (expandedSubcategories.has(key)) {
            subcategory.concepts.forEach(concept => {
              visibleIds.add(concept.id);
            });
          }
        });
      } else {
        cluster.concepts.forEach(concept => {
          if (filteredConcepts.some(fc => fc.id === concept.id)) {
            visibleIds.add(concept.id);
          }
        });
      }
    });
    
    return visibleIds;
  }, [semanticClusters, filteredConcepts, expandedSubcategories]);

  const visibleConnections = React.useMemo(() => {
    return connections.filter((conn: any) => {
    if (!conn || !showConnections) return false;
    return visibleConceptIds.has(conn.from) && visibleConceptIds.has(conn.to);
  });
  }, [connections, showConnections, visibleConceptIds]);

  // Calculate viewport bounds
  const viewportBounds = React.useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    semanticClusters.forEach(cluster => {
      minX = Math.min(minX, cluster.position.x - 100);
      minY = Math.min(minY, cluster.position.y - 100);
      maxX = Math.max(maxX, cluster.position.x + 100);
      maxY = Math.max(maxY, cluster.position.y + 100);
    });
    
    Object.values(physicsNodes).forEach(node => {
      minX = Math.min(minX, node.x - node.radius);
      minY = Math.min(minY, node.y - node.radius);
      maxX = Math.max(maxX, node.x + node.radius);
      maxY = Math.max(maxY, node.y + node.radius);
    });
    
    const padding = 200;
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1400, (maxX - minX) + padding * 2),
      height: Math.max(1000, (maxY - minY) + padding * 2)
    };
  }, [semanticClusters, physicsNodes]);

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x,
        y
      }));
    }

  };

  const handleConceptHover = (conceptId: string | null, event?: React.MouseEvent) => {
    if (conceptId) {
      const concept = concepts.find(c => c.id === conceptId);
      if (concept && event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        setTooltip({
          visible: true,
          x,
          y,
          content: concept
        });
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
    setHoveredConcept(conceptId);
  };

  const toggleSubcategoryExpansion = (key: string) => {
    setAnimatingSubcategories(prev => new Set(prev).add(key));
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
          } else {
        newSet.add(key);
      }
      return newSet;
    });
    
    setTimeout(() => {
      setAnimatingSubcategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 300);
  };

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

  const getMasteryColor = (masteryLevel: string | null | undefined): string => {
    switch (masteryLevel) {
      case 'EXPERT': return '#10B981';
      case 'ADVANCED': return '#3B82F6';
      case 'INTERMEDIATE': return '#F59E0B';
      case 'BEGINNER': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Enhanced concept color based on category and mastery
  const getConceptColor = (concept: Concept): string => {
    // First check mastery level
    if (concept.masteryLevel) {
      return getMasteryColor(concept.masteryLevel);
    }
    
    // Fallback to category-based colors
    const category = concept.category.toLowerCase();
    
    if (category.includes('machine learning') || category.includes('ai') || category.includes('artificial')) {
      return '#8B5CF6'; // Purple for AI/ML
    } else if (category.includes('leetcode') || category.includes('algorithm') || category.includes('programming')) {
      return '#F59E0B'; // Orange for algorithms
    } else if (category.includes('cloud') || category.includes('aws') || category.includes('infrastructure')) {
      return '#06B6D4'; // Cyan for cloud
    } else if (category.includes('data') || category.includes('database') || category.includes('sql')) {
      return '#10B981'; // Green for data
    } else if (category.includes('security') || category.includes('auth')) {
      return '#EC4899'; // Pink for security
    } else if (category.includes('system') || category.includes('architecture')) {
      return '#3B82F6'; // Blue for systems
    } else if (category.includes('frontend') || category.includes('ui') || category.includes('react')) {
      return '#14B8A6'; // Teal for frontend
    } else if (category.includes('backend') || category.includes('api')) {
      return '#F97316'; // Orange for backend
    } else {
      // Use learning progress as fallback
      const progress = concept.learningProgress || 0;
      if (progress >= 80) return '#10B981'; // Green for high progress
      if (progress >= 60) return '#3B82F6'; // Blue for medium progress
      if (progress >= 40) return '#F59E0B'; // Yellow for some progress
      if (progress >= 20) return '#EF4444'; // Red for low progress
      return '#8B5CF6'; // Purple for no progress
    }
  };

  const getConnectedNodes = (conceptId: string) => {
    const connected = new Set<string>();
    connections.forEach(conn => {
      if (conn?.from === conceptId) connected.add(conn.to);
      if (conn?.to === conceptId) connected.add(conn.from);
    });
    return connected;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white flex">
      {/* Left Sidebar */}
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

        <div className="border-t border-white/10 pt-4">
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
          
          <div className="mt-3 text-xs text-gray-400">
            <div>Geometric Nodes: {Object.keys(physicsNodes).length}</div>
            <div>Connections: {connections.length}</div>
            <div>Visible: {visibleConnections.length}</div>
            <div>Layout: Hybrid (Geometry + Collision Detection)</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Knowledge Graph - Real Physics
                  </h1>
                </div>
              </div>

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

        {/* Physics-Based Graph */}
        <div 
          ref={containerRef}
          className="flex-1 relative"
          onMouseMove={handleMouseMove}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{
              minHeight: '100vh',
              background: 'transparent'
            }}
            viewBox={`${viewportBounds.x} ${viewportBounds.y} ${viewportBounds.width} ${viewportBounds.height}`}
            preserveAspectRatio="xMidYMid meet"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              </pattern>
              <style>
                {`
                  .node-enter {
                    transform: scale(0.5);
                    r: 0;
                    opacity: 0;
                  }
                  .node-enter-active {
                    transform: scale(1);
                    r: attr(data-radius);
                    opacity: 1;
                    transition: transform 300ms ease-out, r 300ms ease-out, opacity 300ms ease-out;
                  }
                `}
              </style>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Render Connections with proper stroke widths */}
            {showConnections && visibleConnections.map((connection, index) => {
              const isHighlighted = hoveredConnections.connections.has([connection.from, connection.to].sort().join('-'));
              return (
                <line
                  key={`connection-${index}`}
                  x1={connection.fromPos.x}
                  y1={connection.fromPos.y}
                  x2={connection.toPos.x}
                  y2={connection.toPos.y}
                  stroke={isHighlighted ? 'rgba(255, 255, 255, 0.9)' : 'rgba(139, 92, 246, 0.4)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray="3,3"
                  style={{ transition: 'all 0.2s ease-in-out', opacity: isHighlighted ? 1 : 0.5 }}
                />
              );
            })}

            {/* Render Cluster Centers */}
            {semanticClusters.map(cluster => {
              const IconComponent = cluster.icon;
                    return (
                <g key={`cluster-${cluster.id}`} className="opacity-80">
                        <circle
                    cx={cluster.position.x}
                    cy={cluster.position.y}
                    r="75"
                    fill={`${cluster.color}1A`}
                          stroke={cluster.color}
                          strokeWidth="2"
                    strokeDasharray="12,6"
                        />
                        <text
                    x={cluster.position.x}
                    y={cluster.position.y - 85}
                          textAnchor="middle"
                    className="text-lg font-semibold"
                    fill={cluster.color}
                    style={{ fontSize: '18px', fontWeight: 600 }}
                  >
                    {cluster.name}
                        </text>
                  <foreignObject
                    x={cluster.position.x - 18}
                    y={cluster.position.y - 18}
                    width="36"
                    height="36"
                  >
                    <IconComponent size={36} color={cluster.color} />
                  </foreignObject>
                </g>
              );
            })}

            {/* Render Physics Nodes */}
            {Object.values(physicsNodes).map(node => {
              const concept = concepts.find(c => c.id === node.id);
              
              if (!concept) {
                // Subcategory bubble - TEXT ONLY
                const subcategoryMatch = node.id.match(/subcategory-(.+)-(.+)/);
                if (subcategoryMatch) {
                  const [, clusterId, subcategoryName] = subcategoryMatch;
                  const cluster = semanticClusters.find(c => c.id === clusterId);
                  const key = `${clusterId}-${subcategoryName}`;
                  const isExpanded = expandedSubcategories.has(key);
              
              return (
                    <g key={node.id} className="node-enter-active">
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="50"
                        fill={cluster?.color || '#6B7280'}
                        stroke="white"
                strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onClick={() => toggleSubcategoryExpansion(key)}
                      />
                              <text
                        x={node.x}
                        y={node.y + 5} // Centered text
                                textAnchor="middle"
                                className="pointer-events-none"
                                fill="white"
                        style={{ 
                          fontSize: '15px', 
                          fontWeight: 500,
                          textShadow: '0px 1px 3px rgba(0,0,0,0.5)' 
                        }}
                      >
                        {subcategoryName.length > 9 ? subcategoryName.substring(0, 8) + '...' : subcategoryName}
                              </text>
                      {isExpanded && (
                            <text
                          x={node.x}
                          y={node.y - 60}
                              textAnchor="middle"
                          className="text-xs"
                              fill="white"
                          style={{ fontSize: '12px' }}
                            >
                          ▼
                            </text>
                          )}
                                </g>
                              );
                }
                return null;
              }

              // Individual concept with PROPER VISIBLE sizing
              const conceptColor = getConceptColor(concept);
              const isHovered = hoveredConcept === concept.id;
              const isConnected = hoveredConnections.nodes.has(concept.id) && !isHovered;
              const opacity = hoveredConcept ? (isHovered || isConnected ? 1 : 0.3) : 1;
              
              return (
                <AnimatePresence key={node.id}>
                  <motion.g
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: opacity,
                      scale: isHovered ? 1.1 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="cursor-pointer"
                    onMouseEnter={(e) => handleConceptHover(concept.id, e)}
                    onMouseLeave={() => handleConceptHover(null)}
                    onClick={() => onConceptSelect ? onConceptSelect(concept) : setSelectedConcept(concept)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="35"
                      fill={conceptColor}
                      stroke={isHovered ? 'white' : isConnected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
                      strokeWidth={isHovered || isConnected ? 2 : 1}
                      className="transition-all"
                    />
                    
                    {/* Concept Icon - bigger but still fits in circle */}
                    <foreignObject
                      x={node.x - 12}
                      y={node.y - 12}
                      width="24"
                      height="24"
                      className="pointer-events-none"
                    >
                      {React.createElement(getConceptIcon(concept), {
                        size: 24,
                        color: 'white'
                      })}
                    </foreignObject>

                    {/* Concept Label with proper readable size */}
                    <text
                      x={node.x}
                      y={node.y + 50}
                      textAnchor="middle"
                      className="pointer-events-none"
                      fill="rgba(255,255,255,0.9)"
                      style={{ 
                        fontSize: '14px', 
                        fontWeight: 400,
                        textShadow: '0px 1px 2px rgba(0,0,0,0.7)' 
                      }}
                    >
                      {concept.title.length > 16 ? concept.title.substring(0, 14) + '...' : concept.title}
                    </text>

                    {/* Progress indicator */}
                    {(concept.learningProgress || 0) > 0 && (
                      <g transform={`translate(${node.x + 25}, ${node.y - 25})`}>
                        <circle r="8" fill="rgba(34, 197, 94, 0.9)" stroke="white" strokeWidth="1" />
                          <text
                            textAnchor="middle"
                          dy="0.35em"
                            className="pointer-events-none"
                          fill="white"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                          {Math.round(concept.learningProgress || 0)}
                          </text>
                      </g>
                    )}
                    
                    {/* Connection indicators */}
                    {getConnectedNodes(concept.id).size > 0 && (
                      <circle
                        cx={node.x - 25}
                        cy={node.y - 25}
                        r="6"
                        fill="rgba(59, 130, 246, 0.9)"
                        stroke="white"
                        strokeWidth="1"
                        className="pointer-events-none"
                      />
                    )}
                  </motion.g>
                </AnimatePresence>
              );
            })}

          </svg>

          {/* Dynamic Tooltip */}
          {tooltip.visible && tooltip.content && (
            <div 
              className="absolute pointer-events-none bg-slate-800/95 backdrop-blur-lg rounded-lg border border-white/10 p-3 max-w-sm z-50 transform -translate-x-1/2 -translate-y-full"
                 style={{ 
                left: Math.min(Math.max(tooltip.x, 150), window.innerWidth - 150),
                top: Math.max(tooltip.y - 10, 10)
              }}
            >
              <h4 className="font-semibold text-white mb-1">{tooltip.content.title}</h4>
              <p className="text-sm text-gray-300 mb-2">{tooltip.content.category}</p>
              <p className="text-xs text-gray-400 line-clamp-3">{tooltip.content.summary}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {tooltip.content.masteryLevel || 'Not Practiced'}
                </span>
                <span className="text-xs text-gray-500">
                  Progress: {tooltip.content.learningProgress || 0}%
                </span>
                    </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCompanion; 