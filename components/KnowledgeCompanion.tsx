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

// Cluster boundary system
interface ClusterBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  innerBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Enhanced node interface with cluster ownership
interface HierarchicalNode {
  id: string;
  type: 'cluster_name' | 'category' | 'concept';
  x: number;
  y: number;
  radius: number;
  clusterId: string;
  parentId?: string;
  textWidth?: number;
  textHeight?: number;
}

// Collision detection with hierarchical rules
const checkCollision = (nodeA: HierarchicalNode, nodeB: HierarchicalNode): boolean => {
  const distance = Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
  
  let minDistance: number;
  
  if (nodeA.type === 'cluster_name' || nodeB.type === 'cluster_name') {
    // Cluster names need extra space
    minDistance = 100;
  } else if (nodeA.type === 'category' && nodeB.type === 'category') {
    minDistance = 4 * Math.max(nodeA.radius, nodeB.radius);
  } else if (nodeA.type === 'concept' && nodeB.type === 'concept') {
    minDistance = 2 * Math.max(nodeA.radius, nodeB.radius);
  } else {
    // Mixed types (category-concept)
    minDistance = 3 * Math.max(nodeA.radius, nodeB.radius);
  }
  
  return distance < minDistance;
};

// Calculate hierarchical layout with proper zones
const calculateHierarchicalLayout = (cluster: SemanticCluster, subcategories: any[]) => {
  const clusterRegion = {
    centerX: cluster.position.x,
    centerY: cluster.position.y,
    width: 600, // Dynamic based on content
    height: 500
  };
  
  // Zone definitions (vertical zones)
  const zones = {
    clusterName: {
      top: clusterRegion.centerY - clusterRegion.height / 2,
      height: clusterRegion.height * 0.2, // Top 20%
      centerY: clusterRegion.centerY - clusterRegion.height / 2 + clusterRegion.height * 0.1
    },
    categories: {
      top: clusterRegion.centerY - clusterRegion.height / 2 + clusterRegion.height * 0.2,
      height: clusterRegion.height * 0.3, // Middle 30%
      centerY: clusterRegion.centerY - clusterRegion.height / 2 + clusterRegion.height * 0.35
    },
    concepts: {
      top: clusterRegion.centerY - clusterRegion.height / 2 + clusterRegion.height * 0.5,
      height: clusterRegion.height * 0.5, // Bottom 50%
      centerY: clusterRegion.centerY - clusterRegion.height / 2 + clusterRegion.height * 0.75
    }
  };
  
  const nodes: HierarchicalNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  
  // 1. CLUSTER NAME POSITIONING (Fixed at top-center)
  const clusterNameNode: HierarchicalNode = {
    id: `cluster-name-${cluster.id}`,
    type: 'cluster_name',
    x: clusterRegion.centerX,
    y: zones.clusterName.centerY,
    radius: 0, // Text element
    clusterId: cluster.id,
    textWidth: cluster.name.length * 12 + 40, // Estimate text width
    textHeight: 24 + 20 // Font height + padding
  };
  nodes.push(clusterNameNode);
  
  // 2. CATEGORY NODE SPACING (Semi-circle below cluster name)
  if (subcategories.length > 0) {
    const arcRadius = 120;
    const arcSpan = Math.PI * 2/3; // 120° arc
    const arcStart = -arcSpan / 2;
    
    subcategories.forEach((subcategory, index) => {
      const angle = arcStart + (index / Math.max(1, subcategories.length - 1)) * arcSpan;
      
      // Calculate category position
      let categoryX = clusterRegion.centerX + Math.cos(angle) * arcRadius;
      let categoryY = zones.categories.centerY + Math.sin(angle) * arcRadius * 0.5; // Flatten the arc
      
      // Ensure minimum distance from cluster name
      const distanceFromClusterName = Math.sqrt(
        Math.pow(categoryX - clusterNameNode.x, 2) + 
        Math.pow(categoryY - clusterNameNode.y, 2)
      );
      if (distanceFromClusterName < 100) {
        categoryY = clusterNameNode.y + 100;
      }
      
      // Dynamic bubble size based on content
      const nameLength = subcategory.name.length;
      const baseSizeFromName = Math.max(25, nameLength * 2);
      const baseSizeFromCount = subcategory.count * 3;
      const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
      
      const categoryNode: HierarchicalNode = {
        id: `category-${cluster.id}-${subcategory.name}`,
        type: 'category',
        x: categoryX,
        y: categoryY,
        radius: bubbleRadius,
        clusterId: cluster.id
      };
      
      // Check for collisions with existing nodes and adjust
      let attempts = 0;
      while (attempts < 50) {
        let hasCollision = false;
        for (const existingNode of nodes) {
          if (checkCollision(categoryNode, existingNode)) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) break;
        
        // Adjust position to avoid collision
        categoryNode.x += (Math.random() - 0.5) * 20;
        categoryNode.y += 15; // Move down to avoid cluster name
        attempts++;
      }
      
      nodes.push(categoryNode);
      positions.set(`subcategory-${cluster.id}-${subcategory.name}`, { 
        x: categoryNode.x, 
        y: categoryNode.y 
      });
    });
  }
  
  return { nodes, positions, zones, clusterRegion };
};

// Calculate concept positions within category zones
const calculateConceptPositions = (
  category: HierarchicalNode,
  concepts: any[],
  zones: any,
  existingNodes: HierarchicalNode[]
) => {
  const conceptPositions = new Map<string, { x: number; y: number }>();
  const conceptNodes: HierarchicalNode[] = [];
  
  if (concepts.length === 0) return { conceptPositions, conceptNodes };
  
  // Determine layout strategy based on concept count
  const conceptRadius = 18;
  
  if (concepts.length <= 6) {
    // Small circle around category
    const radius = Math.max(60, category.radius + 45); // Minimum distance = 2.5 * concept_radius
    
    concepts.forEach((concept, index) => {
      const angle = (index / concepts.length) * 2 * Math.PI;
      let conceptX = category.x + Math.cos(angle) * radius;
      let conceptY = category.y + Math.sin(angle) * radius;
      
      // Ensure concepts stay in concept zone
      conceptY = Math.max(conceptY, zones.concepts.top + conceptRadius);
      conceptY = Math.min(conceptY, zones.concepts.top + zones.concepts.height - conceptRadius);
      
      const conceptNode: HierarchicalNode = {
        id: concept.id,
        type: 'concept',
        x: conceptX,
        y: conceptY,
        radius: conceptRadius,
        clusterId: category.clusterId,
        parentId: category.id
      };
      
      // Check collisions and adjust
      let attempts = 0;
      while (attempts < 30) {
        let hasCollision = false;
        for (const existingNode of [...existingNodes, ...conceptNodes]) {
          if (checkCollision(conceptNode, existingNode)) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) break;
        
        // Spiral outward if collision
        const spiralRadius = radius + attempts * 10;
        const spiralAngle = angle + attempts * 0.5;
        conceptNode.x = category.x + Math.cos(spiralAngle) * spiralRadius;
        conceptNode.y = category.y + Math.sin(spiralAngle) * spiralRadius;
        
        // Keep in concept zone
        conceptNode.y = Math.max(conceptNode.y, zones.concepts.top + conceptRadius);
        conceptNode.y = Math.min(conceptNode.y, zones.concepts.top + zones.concepts.height - conceptRadius);
        
        attempts++;
      }
      
      conceptNodes.push(conceptNode);
      conceptPositions.set(concept.id, { x: conceptNode.x, y: conceptNode.y });
    });
  } else {
    // Grid layout for many concepts
    const conceptsPerRow = Math.ceil(Math.sqrt(concepts.length));
    const horizontalSpacing = conceptRadius * 2.5; // 2 * concept_radius minimum
    const verticalSpacing = conceptRadius * 2.5;
    
    const gridWidth = (conceptsPerRow - 1) * horizontalSpacing;
    const gridStartX = category.x - gridWidth / 2;
    const gridStartY = Math.max(
      category.y + category.radius + 45, // 2.5 * concept_radius from category
      zones.concepts.top + conceptRadius
    );
    
    concepts.forEach((concept, index) => {
      const row = Math.floor(index / conceptsPerRow);
      const col = index % conceptsPerRow;
      
      const conceptX = gridStartX + col * horizontalSpacing;
      const conceptY = gridStartY + row * verticalSpacing;
      
      const conceptNode: HierarchicalNode = {
        id: concept.id,
        type: 'concept',
        x: conceptX,
        y: conceptY,
        radius: conceptRadius,
        clusterId: category.clusterId,
        parentId: category.id
      };
      
      conceptNodes.push(conceptNode);
      conceptPositions.set(concept.id, { x: conceptX, y: conceptY });
    });
  }
  
  return { conceptPositions, conceptNodes };
};

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

// Calculate cluster boundary rectangles
const calculateClusterBounds = (clusters: SemanticCluster[], viewportBounds: any): Map<string, ClusterBounds> => {
  const clusterBounds = new Map<string, ClusterBounds>();
  const totalClusters = clusters.length;
  
  // Calculate grid layout for clusters
  const cols = Math.ceil(Math.sqrt(totalClusters));
  const rows = Math.ceil(totalClusters / cols);
  
  const clusterWidth = viewportBounds.width / cols;
  const clusterHeight = viewportBounds.height / rows;
  
  clusters.forEach((cluster, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const bounds: ClusterBounds = {
      x: viewportBounds.x + col * clusterWidth,
      y: viewportBounds.y + row * clusterHeight,
      width: clusterWidth,
      height: clusterHeight,
      innerBounds: {
        x: viewportBounds.x + col * clusterWidth + 20, // 20px padding
        y: viewportBounds.y + row * clusterHeight + 20,
        width: clusterWidth - 40,
        height: clusterHeight - 40
      }
    };
    
    clusterBounds.set(cluster.id, bounds);
  });
  
  return clusterBounds;
};

// Boundary clamping function
const clampToClusterBounds = (position: {x: number, y: number}, nodeRadius: number, clusterBounds: ClusterBounds): {x: number, y: number} => {
  const bounds = clusterBounds.innerBounds;
  
  return {
    x: Math.max(
      bounds.x + nodeRadius,
      Math.min(position.x, bounds.x + bounds.width - nodeRadius)
    ),
    y: Math.max(
      bounds.y + nodeRadius + 100, // Leave space for cluster title
      Math.min(position.y, bounds.y + bounds.height - nodeRadius)
    )
  };
};

// Force calculation with cluster containment
const applyClusterForces = (node: HierarchicalNode, allNodes: HierarchicalNode[]): {x: number, y: number} => {
  let force = {x: 0, y: 0};
  
  // Only calculate forces from nodes in SAME CLUSTER
  const clusterNodes = allNodes.filter(n => n.clusterId === node.clusterId && n.id !== node.id);
  
  for (const other of clusterNodes) {
    // Repulsion force
    const distance = Math.sqrt(Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2));
    const minDistance = (node.radius + other.radius) * 1.5;
    
    if (distance < minDistance && distance > 0) {
      const repulsion = (minDistance - distance) / distance;
      force.x += (node.x - other.x) * repulsion * 0.5;
      force.y += (node.y - other.y) * repulsion * 0.5;
    }
  }
  
  // Attraction to parent (if not cluster root)
  if (node.parentId) {
    const parent = allNodes.find(n => n.id === node.parentId);
    if (parent) {
      const parentAttraction = 0.1;
      force.x += (parent.x - node.x) * parentAttraction;
      force.y += (parent.y - node.y) * parentAttraction;
    }
  }
  
  return force;
};

// Calculate cluster-contained hierarchical layout
const calculateClusterContainedLayout = (
  cluster: SemanticCluster, 
  subcategories: any[], 
  clusterBounds: ClusterBounds
) => {
  const nodes: HierarchicalNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  
  const bounds = clusterBounds.innerBounds;
  
  // 1. CLUSTER NAME POSITIONING (Fixed at top-center of cluster bounds)
  const clusterNameNode: HierarchicalNode = {
    id: `cluster-name-${cluster.id}`,
    type: 'cluster_name',
    x: bounds.x + bounds.width / 2,
    y: bounds.y + 30, // Top of cluster region
    radius: 0,
    clusterId: cluster.id,
    textWidth: cluster.name.length * 12 + 40,
    textHeight: 24 + 20
  };
  nodes.push(clusterNameNode);
  
  // 2. CATEGORY GRID LAYOUT (within cluster bounds)
  if (subcategories.length > 0) {
    const categoriesPerRow = Math.ceil(Math.sqrt(subcategories.length));
    const categorySpacing = Math.min(120, bounds.width / (categoriesPerRow + 1));
    
    subcategories.forEach((subcategory, index) => {
      const row = Math.floor(index / categoriesPerRow);
      const col = index % categoriesPerRow;
      
      // Calculate initial position within cluster bounds
      let categoryX = bounds.x + bounds.width * 0.2 + (col * categorySpacing);
      let categoryY = bounds.y + 120 + (row * 80);
      
      // Dynamic bubble size
      const nameLength = subcategory.name.length;
      const baseSizeFromName = Math.max(25, nameLength * 2);
      const baseSizeFromCount = subcategory.count * 3;
      const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
      
      // Clamp to cluster bounds
      const clampedPosition = clampToClusterBounds({x: categoryX, y: categoryY}, bubbleRadius, clusterBounds);
      
      const categoryNode: HierarchicalNode = {
        id: `category-${cluster.id}-${subcategory.name}`,
        type: 'category',
        x: clampedPosition.x,
        y: clampedPosition.y,
        radius: bubbleRadius,
        clusterId: cluster.id,
        parentId: clusterNameNode.id
      };
      
      nodes.push(categoryNode);
      positions.set(`subcategory-${cluster.id}-${subcategory.name}`, { 
        x: categoryNode.x, 
        y: categoryNode.y 
      });
    });
  }
  
  return { nodes, positions, clusterBounds };
};

// Calculate concept positions within cluster bounds
const calculateClusterConceptPositions = (
  category: HierarchicalNode,
  concepts: any[],
  clusterBounds: ClusterBounds,
  existingNodes: HierarchicalNode[]
) => {
  const conceptPositions = new Map<string, { x: number; y: number }>();
  const conceptNodes: HierarchicalNode[] = [];
  
  if (concepts.length === 0) return { conceptPositions, conceptNodes };
  
  const conceptRadius = 18;
  
  // Radial arrangement around parent category (within cluster bounds)
  concepts.forEach((concept, index) => {
    const angle = (2 * Math.PI * index) / concepts.length;
    const radius = Math.max(60, category.radius + 45);
    
    // Calculate ideal position
    let idealX = category.x + radius * Math.cos(angle);
    let idealY = category.y + radius * Math.sin(angle);
    
    // Clamp to cluster bounds
    const clampedPosition = clampToClusterBounds({x: idealX, y: idealY}, conceptRadius, clusterBounds);
    
    const conceptNode: HierarchicalNode = {
      id: concept.id,
      type: 'concept',
      x: clampedPosition.x,
      y: clampedPosition.y,
      radius: conceptRadius,
      clusterId: category.clusterId,
      parentId: category.id
    };
    
    // Apply forces within cluster bounds
    let force = applyClusterForces(conceptNode, [...existingNodes, ...conceptNodes]);
    
    // Apply force but stay within bounds
    let newX = conceptNode.x + force.x;
    let newY = conceptNode.y + force.y;
    
    const finalPosition = clampToClusterBounds({x: newX, y: newY}, conceptRadius, clusterBounds);
    conceptNode.x = finalPosition.x;
    conceptNode.y = finalPosition.y;
    
    conceptNodes.push(conceptNode);
    conceptPositions.set(concept.id, { x: conceptNode.x, y: conceptNode.y });
  });
  
  return { conceptPositions, conceptNodes };
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
  const [userConnections, setUserConnections] = useState<Array<{from: string, to: string}>>([]);
  
  // Subcategory expansion state
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Generate semantic clusters and layout
  const semanticClusters = generateSemanticClusters(concepts);
  const { positions: conceptPositions, bounds } = generateClusterLayout(semanticClusters, viewBox);
  

  
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
  
  // Create dynamic position map with cluster boundary system
  const dynamicConceptPositions = new Map<string, { x: number; y: number }>();
  const allHierarchicalNodes: HierarchicalNode[] = [];
  
  // First calculate initial viewport bounds for cluster boundary calculation
  const initialViewportBounds = {
    x: -600,
    y: -400,
    width: 2400,
    height: 1600
  };
  
  // Calculate cluster boundaries
  const clusterBounds = calculateClusterBounds(semanticClusters, initialViewportBounds);
  
  // Add positions from conceptPositions (for non-subcategory concepts)
  conceptPositions.forEach((pos, id) => {
    dynamicConceptPositions.set(id, pos);
  });
  
  // Calculate cluster-contained hierarchical layout for expanded subcategory concepts
  semanticClusters.forEach(cluster => {
    const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
    const bounds = clusterBounds.get(cluster.id);
    
    if (subcategories.length > 0 && bounds) {
      // Calculate cluster-contained hierarchical layout for this cluster
      const { nodes, positions } = calculateClusterContainedLayout(cluster, subcategories, bounds);
      allHierarchicalNodes.push(...nodes);
      
      // Add subcategory positions
      positions.forEach((pos, key) => {
        dynamicConceptPositions.set(key, pos);
      });
      
      // Calculate concept positions for expanded subcategories
      subcategories.forEach((subcategory, index) => {
        const key = `${cluster.id}-${subcategory.name}`;
        if (expandedSubcategories.has(key)) {
          // Find the category node for this subcategory
          const categoryNode = nodes.find(n => n.id === `category-${cluster.id}-${subcategory.name}`);
          if (categoryNode && bounds) {
            const { conceptPositions: subConceptPositions, conceptNodes } = calculateClusterConceptPositions(
              categoryNode,
              subcategory.concepts,
              bounds,
              allHierarchicalNodes
            );
            
            // Add concept positions to the map
            subConceptPositions.forEach((pos, conceptId) => {
              dynamicConceptPositions.set(conceptId, pos);
            });
            
            // Add concept nodes to global tracking
            allHierarchicalNodes.push(...conceptNodes);
          }
        }
      });
    }
  });

  // Calculate dynamic viewport bounds for hierarchical layout
  const calculateViewportBounds = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Include all base cluster positions
    semanticClusters.forEach(cluster => {
      minX = Math.min(minX, cluster.position.x);
      minY = Math.min(minY, cluster.position.y);
      maxX = Math.max(maxX, cluster.position.x);
      maxY = Math.max(maxY, cluster.position.y);
    });
    
    // Include all hierarchical node positions
    allHierarchicalNodes.forEach(node => {
      // Account for node size in bounds
      const nodeExtent = node.type === 'cluster_name' ? 50 : node.radius;
      minX = Math.min(minX, node.x - nodeExtent);
      minY = Math.min(minY, node.y - nodeExtent);
      maxX = Math.max(maxX, node.x + nodeExtent);
      maxY = Math.max(maxY, node.y + nodeExtent);
    });
    
    // Include all dynamic concept positions
    dynamicConceptPositions.forEach(position => {
      minX = Math.min(minX, position.x - 25); // Account for concept radius
      minY = Math.min(minY, position.y - 25);
      maxX = Math.max(maxX, position.x + 25);
      maxY = Math.max(maxY, position.y + 25);
    });
    
    // Add padding for better visibility
    const padding = 120; // Increased for hierarchical spacing
    
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1400, (maxX - minX) + padding * 2),
      height: Math.max(1000, (maxY - minY) + padding * 2)
    };
  };
  
  const viewportBounds = calculateViewportBounds();

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
      
      const fromPos = dynamicConceptPositions.get(concept.id);
      const toPos = targetConceptId ? dynamicConceptPositions.get(targetConceptId) : null;
      
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

  // Add user-created connections
  const userConnectionsWithPositions = userConnections.map(conn => {
    const fromPos = dynamicConceptPositions.get(conn.from);
    const toPos = dynamicConceptPositions.get(conn.to);
    const fromConcept = concepts.find(c => c.id === conn.from);
    const toConcept = concepts.find(c => c.id === conn.to);
    
    if (fromPos && toPos && fromConcept && toConcept) {
      return {
        from: conn.from,
        to: conn.to,
        fromPos,
        toPos,
        fromConcept,
        toConcept,
        isUserCreated: true
      };
    }
    return null;
  }).filter(Boolean);

  const allConnections = [...connections, ...userConnectionsWithPositions];
  console.log(`Total connections found: ${allConnections.length} (${userConnections.length} user-created)`);

  // Get currently visible concept IDs (only expanded individual concepts, not subcategory bubbles)
  const getVisibleConceptIds = () => {
    const visibleIds = new Set<string>();
    
    semanticClusters.forEach(cluster => {
      const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
      
      if (subcategories.length > 0) {
        // Only add concepts from expanded subcategories
        subcategories.forEach(subcategory => {
          const key = `${cluster.id}-${subcategory.name}`;
          if (expandedSubcategories.has(key)) {
            subcategory.concepts.forEach(concept => {
              visibleIds.add(concept.id);
            });
          }
        });
      } else {
        // Add all concepts from clusters without subcategories
        cluster.concepts.forEach(concept => {
          if (filteredConcepts.some(fc => fc.id === concept.id)) {
            visibleIds.add(concept.id);
          }
        });
      }
    });
    
    return visibleIds;
  };

  const visibleConceptIds = getVisibleConceptIds();
  const visibleConnections = allConnections.filter(conn => {
    if (!conn || !showConnections) return false;
    // Only show connections between concepts that are actually visible as individual nodes
    return visibleConceptIds.has(conn.from) && visibleConceptIds.has(conn.to);
  });

  console.log(`Visible connections: ${visibleConnections.length}`);

  // Get mastery color
  const getMasteryColor = (masteryLevel: string | null | undefined): string => {
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
        const svgX = ((event.clientX - rect.left) * viewportBounds.width) / rect.width + viewportBounds.x;
        const svgY = ((event.clientY - rect.top) * viewportBounds.height) / rect.height + viewportBounds.y;
        setDragCurrent({ x: svgX, y: svgY });
      }
    }
  };

  const handleMouseUp = async (event: React.MouseEvent, targetConceptId?: string) => {
    if (isDragging && dragStart && targetConceptId && targetConceptId !== dragStart.conceptId) {
      const sourceConcept = concepts.find(c => c.id === dragStart.conceptId);
      const targetConcept = concepts.find(c => c.id === targetConceptId);
      
      if (sourceConcept && targetConcept) {
        try {
          // Call the API to persist the connection
          const response = await fetch('/api/concepts/link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conceptId1: dragStart.conceptId,
              conceptId2: targetConceptId
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            console.log(`✅ Created persistent connection: ${sourceConcept.title} → ${targetConcept.title}`);
            // Refresh the page to show the new connection
            window.location.reload();
          } else {
            console.error(`❌ Failed to create connection: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ Error creating connection:`, error);
        }
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Get connected nodes for highlighting
  const getConnectedNodes = (conceptId: string) => {
    const connected = new Set<string>();
    allConnections.forEach(conn => {
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
            <div>Auto: {connections.length} connections</div>
            <div>User: {userConnections.length} connections</div>
            <div>Visible: {visibleConnections.length}</div>
            <div className="mt-2 text-yellow-400">🟡 User connections</div>
            <div className="text-blue-400">🔵 Auto connections</div>
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
            viewBox={`${viewportBounds.x} ${viewportBounds.y} ${viewportBounds.width} ${viewportBounds.height}`}
            onMouseMove={handleMouseMove}
            onMouseUp={(e) => handleMouseUp(e)}
          >
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            
            {/* Background grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Cluster Boundary Visualization (for debugging) */}
            {semanticClusters.map(cluster => {
              const bounds = clusterBounds.get(cluster.id);
              if (!bounds) return null;
              
              return (
                <g key={`cluster-bounds-${cluster.id}`}>
                  {/* Outer cluster boundary */}
                  <rect
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    fill="none"
                    stroke={cluster.color}
                    strokeWidth="2"
                    strokeOpacity="0.3"
                    strokeDasharray="5,5"
                  />
                  
                  {/* Inner working area */}
                  <rect
                    x={bounds.innerBounds.x}
                    y={bounds.innerBounds.y}
                    width={bounds.innerBounds.width}
                    height={bounds.innerBounds.height}
                    fill={`${cluster.color}08`}
                    stroke={cluster.color}
                    strokeWidth="1"
                    strokeOpacity="0.2"
                  />
                  
                  {/* Cluster title area */}
                  <rect
                    x={bounds.innerBounds.x}
                    y={bounds.innerBounds.y}
                    width={bounds.innerBounds.width}
                    height="60"
                    fill={`${cluster.color}15`}
                    stroke="none"
                  />
                </g>
              );
            })}

            {/* Connections */}
            {visibleConnections.map((conn, index) => {
              if (!conn) return null;
              
              const isHighlighted = hoveredConcept && 
                (conn.from === hoveredConcept || conn.to === hoveredConcept);
              const isUserCreated = (conn as any).isUserCreated;
              
              return (
                <line
                  key={index}
                  x1={conn.fromPos.x}
                  y1={conn.fromPos.y}
                  x2={conn.toPos.x}
                  y2={conn.toPos.y}
                  stroke={
                    isHighlighted 
                      ? "#10B981" 
                      : isUserCreated 
                        ? "#F59E0B" 
                        : "rgba(99, 102, 241, 0.6)"
                  }
                  strokeWidth={isHighlighted ? 3 : isUserCreated ? 3 : 2}
                  strokeDasharray={isHighlighted ? "none" : isUserCreated ? "none" : "5,5"}
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

            {/* Cluster Content - Names, Categories, and Concepts */}
            {semanticClusters.map(cluster => {
              const hasVisibleConcepts = cluster.concepts.some(c => 
                filteredConcepts.some(fc => fc.id === c.id)
              );
              
              if (!hasVisibleConcepts) return null;
              
              const bounds = clusterBounds.get(cluster.id);
              if (!bounds) return null;
              
              const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
              
              return (
                <g key={`cluster-content-${cluster.id}`}>
                  {/* Cluster Name (within title area) */}
                  <text
                    x={bounds.innerBounds.x + bounds.innerBounds.width / 2}
                    y={bounds.innerBounds.y + 25}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize="16"
                    fontWeight="700"
                    className="pointer-events-none"
                  >
                    {cluster.name}
                  </text>
                  <text
                    x={bounds.innerBounds.x + bounds.innerBounds.width / 2}
                    y={bounds.innerBounds.y + 40}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.6)"
                    fontSize="11"
                    className="pointer-events-none"
                  >
                    {cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)).length} concepts
                  </text>
                  
                  {/* Subcategory Nodes (positioned within cluster bounds) */}
                  {subcategories.map((subcategory, index) => {
                    const subcategoryKey = `subcategory-${cluster.id}-${subcategory.name}`;
                    const subcategoryPosition = dynamicConceptPositions.get(subcategoryKey);
                    
                    if (!subcategoryPosition) return null;
                    
                    const x = subcategoryPosition.x;
                    const y = subcategoryPosition.y;
                    
                    // Dynamic bubble size
                    const nameLength = subcategory.name.length;
                    const baseSizeFromName = Math.max(25, nameLength * 2);
                    const baseSizeFromCount = subcategory.count * 3;
                    const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
                    
                    return (
                      <g key={`subcategory-${cluster.id}-${subcategory.name}`}>
                        {/* Subcategory Bubble */}
                        <circle
                          cx={x}
                          cy={y}
                          r={bubbleRadius}
                          fill={cluster.color}
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-300 hover:stroke-white"
                          onClick={() => {
                            const key = `${cluster.id}-${subcategory.name}`;
                            const newExpanded = new Set(expandedSubcategories);
                            if (newExpanded.has(key)) {
                              newExpanded.delete(key);
                            } else {
                              newExpanded.add(key);
                            }
                            setExpandedSubcategories(newExpanded);
                          }}
                        />
                        
                        {/* Subcategory Icon */}
                        <foreignObject
                          x={x - 8}
                          y={y - 8}
                          width="16"
                          height="16"
                          className="pointer-events-none"
                        >
                          <cluster.icon className="w-4 h-4 text-white" />
                        </foreignObject>
                        
                        {/* Subcategory Name */}
                        <text
                          x={x}
                          y={subcategory.name.length > 15 ? y + 15 : y + 8}
                          textAnchor="middle"
                          fill="white"
                          fontSize="9"
                          className="pointer-events-none"
                        >
                          {subcategory.name.length > 12 ? subcategory.name.substring(0, 10) + '..' : subcategory.name}
                        </text>
                        
                        {/* Concept Count */}
                        <text
                          x={x}
                          y={subcategory.name.length > 15 ? y + 15 : y + 8}
                          textAnchor="middle"
                          fill="white"
                          fontSize="9"
                          className="pointer-events-none"
                        >
                          {subcategory.count}
                        </text>
                        
                        {/* Expanded Individual Concepts (within cluster bounds) */}
                        {expandedSubcategories.has(`${cluster.id}-${subcategory.name}`) && 
                          subcategory.concepts.map((concept, conceptIndex) => {
                            // Get cluster-contained position for this concept
                            const conceptPosition = dynamicConceptPositions.get(concept.id);
                            if (!conceptPosition) return null;
                            
                            const conceptX = conceptPosition.x;
                            const conceptY = conceptPosition.y;
                            
                            const masteryColor = getMasteryColor(concept.masteryLevel);
                            const isSelected = selectedConcept?.id === concept.id;
                            const isHovered = hoveredConcept === concept.id;
                            const progress = concept.learningProgress || 0;
                            const IconComponent = getConceptIcon(concept);
                            
                            return (
                              <g key={`cluster-concept-${concept.id}`}>
                                {/* Connection line to subcategory */}
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={conceptX}
                                  y2={conceptY}
                                  stroke={cluster.color}
                                  strokeWidth={1}
                                  strokeOpacity={0.3}
                                />
                                
                                {/* Individual Concept Node */}
                                <circle
                                  cx={conceptX}
                                  cy={conceptY}
                                  r="18"
                                  fill={cluster.color}
                                  stroke={masteryColor}
                                  strokeWidth={2}
                                  className="cursor-pointer transition-all duration-300 hover:stroke-white"
                                  onMouseEnter={() => setHoveredConcept(concept.id)}
                                  onMouseLeave={() => setHoveredConcept(null)}
                                  onMouseDown={(e) => handleMouseDown(e, concept.id, { x: conceptX, y: conceptY })}
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
                                  cx={conceptX}
                                  cy={conceptY}
                                  r="20"
                                  fill="none"
                                  stroke={masteryColor}
                                  strokeWidth="1"
                                  strokeDasharray={`${(progress / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                                  className="transition-all duration-300"
                                  transform={`rotate(-90 ${conceptX} ${conceptY})`}
                                />
                                
                                {/* Icon */}
                                <foreignObject
                                  x={conceptX - 6}
                                  y={conceptY - 6}
                                  width="12"
                                  height="12"
                                  className="pointer-events-none"
                                >
                                  <IconComponent className="w-3 h-3 text-white" />
                                </foreignObject>
                                
                                {/* Title */}
                                <text
                                  x={conceptX}
                                  y={conceptY + 30}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="9"
                                  fontWeight="400"
                                  className="pointer-events-none"
                                >
                                  {concept.title.length > 15 ? concept.title.substring(0, 12) + '...' : concept.title}
                                </text>
                              </g>
                            );
                          })
                        }
                      </g>
                    );
                  })}
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