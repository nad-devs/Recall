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

// Remove complex hierarchical functions - using simple positioning instead
/*
interface HierarchicalNode {
  id: string;
  type: 'cluster_name' | 'category' | 'concept';
  x: number;
  y: number;
  radius: number;
  textWidth?: number;
  textHeight?: number;
}

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
        radius: bubbleRadius
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
        radius: conceptRadius
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
        radius: conceptRadius
      };
      
      conceptNodes.push(conceptNode);
      conceptPositions.set(concept.id, { x: conceptX, y: conceptY });
    });
  }
  
  return { conceptPositions, conceptNodes };
};
*/

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

// Simple collision detection - only check actual overlaps
const checkActualOverlap = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance < (r1 + r2 + 5); // Small 5px buffer
};

// Simple subcategory positioning with minimal collision adjustment
const calculateSubcategoryPositions = (cluster: SemanticCluster, subcategories: any[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (subcategories.length === 0) return positions;
  
  // Simple circular arrangement around cluster center
  const baseRadius = 80; // Keep subcategories close to cluster
  const angleStep = (2 * Math.PI) / subcategories.length;
  const startAngle = -Math.PI / 2; // Start from top
  
  const placedPositions: Array<{ x: number; y: number; radius: number }> = [];
  
  subcategories.forEach((subcategory, index) => {
    const angle = startAngle + (index * angleStep);
    let x = cluster.position.x + Math.cos(angle) * baseRadius;
    let y = cluster.position.y + Math.sin(angle) * baseRadius;
    
    // Calculate bubble size
    const nameLength = subcategory.name.length;
    const baseSizeFromName = Math.max(25, nameLength * 2);
    const baseSizeFromCount = subcategory.count * 3;
    const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
    
    // Only adjust if there's an actual overlap with existing subcategories
    let hasOverlap = true;
    let attempts = 0;
    
    while (hasOverlap && attempts < 10) { // Limited attempts - keep it simple
      hasOverlap = false;
      
      for (const placed of placedPositions) {
        if (checkActualOverlap(x, y, bubbleRadius, placed.x, placed.y, placed.radius)) {
          hasOverlap = true;
          // Small adjustment - just nudge slightly outward
          const adjustAngle = angle + (attempts * 0.3); // Small angular adjustment
          const adjustRadius = baseRadius + (attempts * 10); // Small radial increase
          x = cluster.position.x + Math.cos(adjustAngle) * adjustRadius;
          y = cluster.position.y + Math.sin(adjustAngle) * adjustRadius;
          break;
        }
      }
      attempts++;
    }
    
    placedPositions.push({ x, y, radius: bubbleRadius });
    positions.set(`subcategory-${cluster.id}-${subcategory.name}`, { x, y });
  });
  
  return positions;
};

// Simple concept positioning around subcategories with minimal collision adjustment
const calculateExpandedConceptPositions = (
  subcategoryX: number,
  subcategoryY: number,
  concepts: any[],
  bubbleRadius: number,
  allSubcategoryPositions: Map<string, { x: number; y: number; radius: number }>
) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (concepts.length === 0) return positions;
  
  // Arrange concepts in a circle around subcategory
  const conceptRadius = Math.max(bubbleRadius + 50, 70); // Minimum distance from subcategory
  const angleStep = (2 * Math.PI) / concepts.length;
  const conceptSize = 18; // Concept node radius
  
  concepts.forEach((concept, index) => {
    const angle = index * angleStep;
    let x = subcategoryX + Math.cos(angle) * conceptRadius;
    let y = subcategoryY + Math.sin(angle) * conceptRadius;
    
    // Only check for overlaps with other subcategories (not concepts)
    let hasOverlap = true;
    let attempts = 0;
    
    while (hasOverlap && attempts < 5) { // Very limited attempts
      hasOverlap = false;
      
      // Check overlap with other subcategories
      for (const [key, subPos] of allSubcategoryPositions) {
        if (checkActualOverlap(x, y, conceptSize, subPos.x, subPos.y, subPos.radius)) {
          hasOverlap = true;
          // Small adjustment - move outward slightly
          const adjustedRadius = conceptRadius + (attempts * 15);
          x = subcategoryX + Math.cos(angle) * adjustedRadius;
          y = subcategoryY + Math.sin(angle) * adjustedRadius;
          break;
        }
      }
      attempts++;
    }
    
    positions.set(concept.id, { x, y });
  });
  
  return positions;
};

// Dynamic clustering based on actual concept data
const generateDynamicSemanticClusters = (concepts: Concept[]): SemanticCluster[] => {
  // Analyze concepts to find natural clusters
  const categoryGroups = new Map<string, Concept[]>();
  const categoryKeywords = new Map<string, Set<string>>();
  
  // First pass: group by main category and collect keywords
  concepts.forEach(concept => {
    const mainCategory = concept.category.split(' > ')[0] || 'Other';
    
    if (!categoryGroups.has(mainCategory)) {
      categoryGroups.set(mainCategory, []);
      categoryKeywords.set(mainCategory, new Set());
    }
    
    categoryGroups.get(mainCategory)!.push(concept);
    
    // Extract keywords from title and summary
    const text = `${concept.title} ${concept.summary || ''}`.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 3);
    words.forEach(word => categoryKeywords.get(mainCategory)!.add(word));
  });
  
  // Define color palette for dynamic clusters
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#FF9F43", "#54A0FF", "#5F27CD", "#00D2D3"
  ];
  
  const clusters: SemanticCluster[] = [];
  let colorIndex = 0;
  
  // Create clusters from natural categories
  categoryGroups.forEach((groupConcepts, categoryName) => {
    if (groupConcepts.length > 0) {
      // Determine icon based on keywords
      const keywords = Array.from(categoryKeywords.get(categoryName) || []);
      let icon = Settings; // default
      
      if (keywords.some(k => ['algorithm', 'leetcode', 'programming', 'code'].includes(k))) {
        icon = Code;
      } else if (keywords.some(k => ['cloud', 'aws', 'kubernetes', 'docker'].includes(k))) {
        icon = Cloud;
      } else if (keywords.some(k => ['machine', 'learning', 'ai', 'neural'].includes(k))) {
        icon = Brain;
      } else if (keywords.some(k => ['data', 'database', 'sql', 'query'].includes(k))) {
        icon = Database;
      } else if (keywords.some(k => ['system', 'architecture', 'microservice'].includes(k))) {
        icon = Cpu;
      } else if (keywords.some(k => ['security', 'auth', 'token'].includes(k))) {
        icon = Shield;
      } else if (keywords.some(k => ['performance', 'optimization', 'load'].includes(k))) {
        icon = Zap;
      } else if (keywords.some(k => ['web', 'frontend', 'backend', 'api'].includes(k))) {
        icon = Network;
      }
      
      // Calculate cluster position in grid
      const cols = 3;
      const row = Math.floor(clusters.length / cols);
      const col = clusters.length % cols;
      
      clusters.push({
        id: `cluster-${clusters.length}`,
        name: categoryName,
        concepts: groupConcepts,
        color: colors[colorIndex % colors.length],
        icon: icon,
        position: {
          x: col * 450 + 250,
          y: row * 350 + 200
        },
        keywords: keywords.slice(0, 10) // Top 10 keywords
      });
      
      colorIndex++;
    }
  });
  
  return clusters;
};

// Physics-based positioning with constraints
const calculatePhysicsBasedPositions = (cluster: SemanticCluster, subcategories: any[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (subcategories.length === 0) return positions;
  
  // Initialize positions - start with simple circular arrangement
  const nodes = subcategories.map((subcategory, index) => {
    const angle = (index / subcategories.length) * 2 * Math.PI;
    const baseRadius = 80;
    
    // Calculate bubble size for repulsion force
    const nameLength = subcategory.name.length;
    const baseSizeFromName = Math.max(25, nameLength * 2);
    const baseSizeFromCount = subcategory.count * 3;
    const radius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
    
    return {
      id: `subcategory-${cluster.id}-${subcategory.name}`,
      x: cluster.position.x + Math.cos(angle) * baseRadius,
      y: cluster.position.y + Math.sin(angle) * baseRadius,
      radius: radius,
      vx: 0, // velocity
      vy: 0,
      subcategory: subcategory
    };
  });
  
  // Physics simulation with constraints
  const iterations = 30; // Stable number of iterations
  const damping = 0.9; // Velocity damping for stability
  const clusterAttraction = 0.1; // Pull toward cluster center
  const nodeRepulsion = 200; // Push away from other nodes
  const maxDistance = 150; // Hard constraint - don't go too far from cluster
  
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate forces for each node
    nodes.forEach(node => {
      let fx = 0, fy = 0;
      
      // 1. Attraction to cluster center (keeps hierarchy)
      const dcx = cluster.position.x - node.x;
      const dcy = cluster.position.y - node.y;
      const clusterDist = Math.sqrt(dcx * dcx + dcy * dcy);
      
      if (clusterDist > 60) { // Only pull if too far
        fx += dcx * clusterAttraction;
        fy += dcy * clusterAttraction;
      }
      
      // 2. Repulsion from other nodes (prevents overlap)
      nodes.forEach(other => {
        if (other === node) return;
        
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = node.radius + other.radius + 20; // Minimum separation
        
        if (dist < minDist && dist > 0) {
          const force = nodeRepulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      });
      
      // Apply forces to velocity
      node.vx += fx;
      node.vy += fy;
      
      // Apply damping
      node.vx *= damping;
      node.vy *= damping;
      
      // Update position
      node.x += node.vx;
      node.y += node.vy;
      
      // Hard constraint: don't go too far from cluster
      const newDcx = cluster.position.x - node.x;
      const newDcy = cluster.position.y - node.y;
      const newClusterDist = Math.sqrt(newDcx * newDcx + newDcy * newDcy);
      
      if (newClusterDist > maxDistance) {
        const angle = Math.atan2(newDcy, newDcx);
        node.x = cluster.position.x - Math.cos(angle) * maxDistance;
        node.y = cluster.position.y - Math.sin(angle) * maxDistance;
        node.vx = 0; // Stop velocity to prevent oscillation
        node.vy = 0;
      }
    });
  }
  
  // Store final positions
  nodes.forEach(node => {
    positions.set(node.id, { x: node.x, y: node.y });
  });
  
  return positions;
};

// Smart concept positioning based on count
const calculateSmartConceptPositions = (
  subcategoryX: number,
  subcategoryY: number,
  concepts: any[],
  bubbleRadius: number,
  allSubcategoryPositions: Map<string, { x: number; y: number; radius: number }>
) => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (concepts.length === 0) return positions;
  
  const conceptSize = 18;
  const minDistanceFromSubcategory = bubbleRadius + 35;
  
  if (concepts.length <= 3) {
    // Simple arrangement for few concepts
    const angles = concepts.length === 1 ? [0] : 
                   concepts.length === 2 ? [0, Math.PI] :
                   [0, 2*Math.PI/3, 4*Math.PI/3];
    
    concepts.forEach((concept, index) => {
      const angle = angles[index];
      const x = subcategoryX + Math.cos(angle) * minDistanceFromSubcategory;
      const y = subcategoryY + Math.sin(angle) * minDistanceFromSubcategory;
      positions.set(concept.id, { x, y });
    });
    
  } else if (concepts.length <= 8) {
    // Single ring
    const radius = minDistanceFromSubcategory;
    concepts.forEach((concept, index) => {
      const angle = (index / concepts.length) * 2 * Math.PI;
      const x = subcategoryX + Math.cos(angle) * radius;
      const y = subcategoryY + Math.sin(angle) * radius;
      positions.set(concept.id, { x, y });
    });
    
  } else if (concepts.length <= 15) {
    // Dual concentric rings
    const innerRadius = minDistanceFromSubcategory;
    const outerRadius = minDistanceFromSubcategory + 40;
    const innerCount = Math.min(6, concepts.length);
    const outerCount = concepts.length - innerCount;
    
    concepts.forEach((concept, index) => {
      if (index < innerCount) {
        // Inner ring
        const angle = (index / innerCount) * 2 * Math.PI;
        const x = subcategoryX + Math.cos(angle) * innerRadius;
        const y = subcategoryY + Math.sin(angle) * innerRadius;
        positions.set(concept.id, { x, y });
      } else {
        // Outer ring
        const outerIndex = index - innerCount;
        const angle = (outerIndex / outerCount) * 2 * Math.PI;
        const x = subcategoryX + Math.cos(angle) * outerRadius;
        const y = subcategoryY + Math.sin(angle) * outerRadius;
        positions.set(concept.id, { x, y });
      }
    });
    
  } else {
    // Compact grid for many concepts
    const conceptsPerRow = Math.ceil(Math.sqrt(concepts.length));
    const spacing = conceptSize * 2.5;
    const gridWidth = (conceptsPerRow - 1) * spacing;
    const gridHeight = (Math.ceil(concepts.length / conceptsPerRow) - 1) * spacing;
    
    const startX = subcategoryX - gridWidth / 2;
    const startY = subcategoryY + minDistanceFromSubcategory + 20;
    
    concepts.forEach((concept, index) => {
      const row = Math.floor(index / conceptsPerRow);
      const col = index % conceptsPerRow;
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      positions.set(concept.id, { x, y });
    });
  }
  
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
  
  // Add zoom and pan functionality
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Zoom event handler
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };
  
  // Reset zoom
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Generate dynamic semantic clusters and layout
  const semanticClusters = generateDynamicSemanticClusters(concepts);
  const { positions: conceptPositions, bounds } = generateClusterLayout(semanticClusters, viewBox);

  // Filter concepts based on search and cluster selection BEFORE using them
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
  
  // Create dynamic position map with physics-based layout for ALL concepts
  const dynamicConceptPositions = new Map<string, { x: number; y: number }>();
  
  // Advanced physics-based positioning with proper boundary understanding
  const allNodes: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    mass: number;
    clusterId: string;
    clusterX: number;
    clusterY: number;
    concept: any;
    textWidth: number;
    textHeight: number;
  }> = [];

  // Initialize all nodes with proper text boundary calculations
  semanticClusters.forEach(cluster => {
    const clusterConcepts = cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id));
    
    clusterConcepts.forEach((concept, index) => {
      // Calculate actual text dimensions for proper spacing
      const title = concept.title || '';
      const textWidth = Math.max(80, title.length * 8 + 20); // Approximate text width
      const textHeight = 40; // Standard text height with padding
      const nodeRadius = Math.max(25, Math.sqrt(textWidth * textHeight) / 3); // Dynamic radius based on text
      
      // Initial positioning in expanding spiral to avoid immediate overlaps
      const spiralRadius = 60 + (index * 30);
      const spiralAngle = index * 2.4; // Golden angle for optimal distribution
      
      allNodes.push({
        id: concept.id,
        x: cluster.position.x + Math.cos(spiralAngle) * spiralRadius,
        y: cluster.position.y + Math.sin(spiralAngle) * spiralRadius,
        vx: 0,
        vy: 0,
        radius: nodeRadius,
        mass: 1 + (textWidth * textHeight) / 1000, // Mass proportional to text area
        clusterId: cluster.id,
        clusterX: cluster.position.x,
        clusterY: cluster.position.y,
        concept: concept,
        textWidth: textWidth,
        textHeight: textHeight
      });
    });
  });

  // Advanced multi-force physics simulation
  const iterations = 50; // More iterations for better convergence
  const timeStep = 0.1;
  const damping = 0.95; // High damping for stability
  
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate forces for each node
    allNodes.forEach(node => {
      let fx = 0, fy = 0;
      
      // 1. CLUSTER COHESION FORCE - Keeps nodes near their cluster
      const clusterDx = node.clusterX - node.x;
      const clusterDy = node.clusterY - node.y;
      const clusterDist = Math.sqrt(clusterDx * clusterDx + clusterDy * clusterDy);
      
      // Adaptive cluster attraction based on distance and cluster size
      const clusterSize = allNodes.filter(n => n.clusterId === node.clusterId).length;
      const optimalClusterRadius = Math.max(150, clusterSize * 40);
      
      if (clusterDist > optimalClusterRadius * 0.5) {
        const clusterForce = 0.02 * (clusterDist - optimalClusterRadius * 0.5);
        fx += (clusterDx / clusterDist) * clusterForce;
        fy += (clusterDy / clusterDist) * clusterForce;
      }
      
      // 2. NODE REPULSION FORCE - Prevents overlaps with proper text boundary consideration
      allNodes.forEach(other => {
        if (other.id === node.id) return;
        
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) return; // Avoid division by zero
        
        // Calculate minimum safe distance based on text boundaries
        const minDistance = Math.max(
          node.radius + other.radius + 30, // Basic node separation
          (node.textWidth + other.textWidth) / 2 + 20, // Text width consideration
          60 // Absolute minimum for readability
        );
        
        if (distance < minDistance) {
          // Strong repulsion force with inverse square law
          const repulsionForce = (minDistance - distance) * 500 / (distance * distance);
          const forceX = (dx / distance) * repulsionForce;
          const forceY = (dy / distance) * repulsionForce;
          
          // Apply force proportional to mass ratio
          const massRatio = other.mass / (node.mass + other.mass);
          fx += forceX * massRatio;
          fy += forceY * massRatio;
        }
      });
      
      // 3. INTER-CLUSTER SEPARATION FORCE - Prevents clusters from overlapping
      allNodes.forEach(other => {
        if (other.clusterId === node.clusterId) return;
        
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100 && distance > 0.1) { // Close to nodes from other clusters
          const separationForce = (100 - distance) * 0.5;
          fx += (dx / distance) * separationForce;
          fy += (dy / distance) * separationForce;
        }
      });
      
      // 4. BOUNDARY FORCES - Keep nodes within reasonable viewport bounds
      const viewportMargin = 200;
      const leftBound = -viewBox.width / 2 + viewportMargin;
      const rightBound = viewBox.width / 2 - viewportMargin;
      const topBound = -viewBox.height / 2 + viewportMargin;
      const bottomBound = viewBox.height / 2 - viewportMargin;
      
      if (node.x < leftBound) fx += (leftBound - node.x) * 0.1;
      if (node.x > rightBound) fx += (rightBound - node.x) * 0.1;
      if (node.y < topBound) fy += (topBound - node.y) * 0.1;
      if (node.y > bottomBound) fy += (bottomBound - node.y) * 0.1;
      
      // Apply forces with proper physics integration
      const acceleration = 1 / node.mass;
      node.vx += fx * acceleration * timeStep;
      node.vy += fy * acceleration * timeStep;
      
      // Apply damping
      node.vx *= damping;
      node.vy *= damping;
      
      // Velocity limiting to prevent instability
      const maxVelocity = 10;
      const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (velocity > maxVelocity) {
        node.vx = (node.vx / velocity) * maxVelocity;
        node.vy = (node.vy / velocity) * maxVelocity;
      }
      
      // Update position
      node.x += node.vx * timeStep;
      node.y += node.vy * timeStep;
    });
    
    // Adaptive cooling - reduce forces as system stabilizes
    if (iter > iterations * 0.7) {
      allNodes.forEach(node => {
        node.vx *= 0.98;
        node.vy *= 0.98;
      });
    }
  }

  // Store final optimized positions
  allNodes.forEach(node => {
    dynamicConceptPositions.set(node.id, { x: node.x, y: node.y });
  });
  
  // SIMPLE STRUCTURED CIRCULAR LAYOUTS for subcategories
  semanticClusters.forEach(cluster => {
    const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
    
    console.log(`🔍 DEBUG: Cluster "${cluster.name}" has ${subcategories.length} subcategories`);
    
    subcategories.forEach((subcategory, index) => {
      const totalSubcategories = subcategories.length;
      let x, y;
      
      if (totalSubcategories === 1) {
        // Single subcategory - place at cluster center
        x = cluster.position.x;
        y = cluster.position.y;
      } else if (totalSubcategories <= 6) {
        // Small clusters - single perfect circle
        const angle = (index / totalSubcategories) * 2 * Math.PI;
        const radius = Math.max(150, totalSubcategories * 30); // Larger radius for better spacing
        x = cluster.position.x + Math.cos(angle) * radius;
        y = cluster.position.y + Math.sin(angle) * radius;
      } else {
        // Larger clusters - concentric circles
        const innerCount = 6;
        if (index < innerCount) {
          // Inner circle
          const angle = (index / innerCount) * 2 * Math.PI;
          const radius = 120;
          x = cluster.position.x + Math.cos(angle) * radius;
          y = cluster.position.y + Math.sin(angle) * radius;
        } else {
          // Outer circle
          const outerIndex = index - innerCount;
          const outerCount = totalSubcategories - innerCount;
          const angle = (outerIndex / outerCount) * 2 * Math.PI;
          const radius = 200;
          x = cluster.position.x + Math.cos(angle) * radius;
          y = cluster.position.y + Math.sin(angle) * radius;
        }
      }
      
      const subcategoryKey = `subcategory-${cluster.id}-${subcategory.name}`;
      dynamicConceptPositions.set(subcategoryKey, { x, y });
      
      console.log(`🔍 DEBUG: Set position for "${subcategoryKey}" at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    });
  });

  // Handle expanded subcategory concepts (when user clicks to expand)
  semanticClusters.forEach(cluster => {
    const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
    
    subcategories.forEach((subcategory) => {
      const key = `${cluster.id}-${subcategory.name}`;
      const subcategoryKey = `subcategory-${cluster.id}-${subcategory.name}`;
      const subcategoryPos = dynamicConceptPositions.get(subcategoryKey);
      
      if (expandedSubcategories.has(key) && subcategoryPos) {
        // Calculate bubble size
        const nameLength = subcategory.name.length;
        const baseSizeFromName = Math.max(25, nameLength * 2);
        const baseSizeFromCount = subcategory.count * 3;
        const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
        
        // Calculate smart concept positions based on count
        const conceptPositions = calculateSmartConceptPositions(
          subcategoryPos.x,
          subcategoryPos.y,
          subcategory.concepts,
          bubbleRadius,
          new Map() // Empty map since we're not checking subcategory overlaps here
        );
        
        // Add concept positions to the map
        conceptPositions.forEach((pos, conceptId) => {
          dynamicConceptPositions.set(conceptId, pos);
        });
      }
    });
  });

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
  
  // Calculate dynamic viewport bounds for simple layout
  const calculateViewportBounds = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Include all base cluster positions
    semanticClusters.forEach(cluster => {
      minX = Math.min(minX, cluster.position.x - 50);
      minY = Math.min(minY, cluster.position.y - 50);
      maxX = Math.max(maxX, cluster.position.x + 50);
      maxY = Math.max(maxY, cluster.position.y + 50);
    });
    
    // Include all dynamic concept positions
    dynamicConceptPositions.forEach(position => {
      minX = Math.min(minX, position.x - 30);
      minY = Math.min(minY, position.y - 30);
      maxX = Math.max(maxX, position.x + 30);
      maxY = Math.max(maxY, position.y + 30);
    });
    
    // Add reasonable padding
    const padding = 100;
    
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1200, (maxX - minX) + padding * 2),
      height: Math.max(800, (maxY - minY) + padding * 2)
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
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Cluster Labels and Subcategory Bubbles */}
            {semanticClusters.map(cluster => {
              const hasVisibleConcepts = cluster.concepts.some(c => 
                filteredConcepts.some(fc => fc.id === c.id)
              );
              
              if (!hasVisibleConcepts) return null;
              
              const subcategories = generateSubcategories(cluster.concepts);
              const isExpanded = expandedClusters.has(cluster.id);
              
              return (
                <g key={`label-${cluster.id}`}>
                  {/* Main Cluster Label */}
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
                  
                  {/* Subcategory Expansion Button */}
                  {subcategories.length > 1 && (
                    <circle
                      cx={cluster.position.x + 80}
                      cy={cluster.position.y - 140}
                      r="8"
                      fill={cluster.color}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1"
                      className="cursor-pointer transition-all duration-300 hover:stroke-white"
                      onClick={() => {
                        const newExpanded = new Set(expandedSubcategories);
                        if (newExpanded.has(cluster.id)) {
                          newExpanded.delete(cluster.id);
                        } else {
                          newExpanded.add(cluster.id);
                        }
                        setExpandedSubcategories(newExpanded);
                      }}
                    />
                  )}
                  
                  {/* Subcategory Count */}
                  {subcategories.length > 1 && (
                    <text
                      x={cluster.position.x + 80}
                      y={cluster.position.y - 137}
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {subcategories.length}
                    </text>
                  )}
                  
                  {/* Expanded Subcategory Bubbles */}
                  {isExpanded && subcategories.length > 1 && subcategories.map((subcategory, index) => {
                    // Get hierarchical position for this subcategory
                    const subcategoryKey = `subcategory-${cluster.id}-${subcategory.name}`;
                    const subcategoryPosition = dynamicConceptPositions.get(subcategoryKey);
                    
                    if (!subcategoryPosition) return null;
                    
                    const x = subcategoryPosition.x;
                    const y = subcategoryPosition.y;
                    
                    // Dynamic bubble size based on name length and concept count
                    const nameLength = subcategory.name.length;
                    const baseSizeFromName = Math.max(25, nameLength * 2);
                    const baseSizeFromCount = subcategory.count * 3;
                    const bubbleRadius = Math.max(30, Math.min(50, Math.max(baseSizeFromName, baseSizeFromCount)));
                    
                    return (
                      <g key={`subcat-${cluster.id}-${index}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={bubbleRadius}
                          fill={`${cluster.color}80`}
                          stroke={cluster.color}
                          strokeWidth="2"
                          className="transition-all duration-300"
                        />
                        <text
                          x={x}
                          y={y + 2}
                          textAnchor="middle"
                          fill="white"
                          fontSize="8"
                          fontWeight="500"
                          className="pointer-events-none"
                        >
                          {subcategory.count}
                        </text>
                        <text
                          x={x}
                          y={y + 25}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.8)"
                          fontSize="9"
                          fontWeight="400"
                          className="pointer-events-none"
                        >
                          {subcategory.name.length > 8 ? subcategory.name.substring(0, 6) + '..' : subcategory.name}
                        </text>
                      </g>
                    );
                  })}
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

            {/* Subcategory Bubbles and Individual Concepts */}
            {semanticClusters.map(cluster => {
              const subcategories = generateSubcategories(cluster.concepts.filter(c => filteredConcepts.some(fc => fc.id === c.id)));
              const isExpanded = expandedClusters.has(cluster.id);
              
              // If cluster has subcategories, show subcategory bubbles
              if (subcategories.length > 0) {
                return (
                  <g key={`subcategories-${cluster.id}`}>
                    {subcategories.map((subcategory, index) => {
                      // Get hierarchical position for this subcategory
                      const subcategoryKey = `subcategory-${cluster.id}-${subcategory.name}`;
                      const subcategoryPosition = dynamicConceptPositions.get(subcategoryKey);
                      
                      if (!subcategoryPosition) return null;
                      
                      const x = subcategoryPosition.x;
                      const y = subcategoryPosition.y;
                      
                      // Dynamic bubble size based on name length and concept count
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
                            fillOpacity={0.7}
                            stroke={cluster.color}
                            strokeWidth={2}
                            className="cursor-pointer transition-all duration-300 hover:opacity-90"
                            onClick={() => {
                              const newExpanded = new Set(expandedSubcategories);
                              const key = `${cluster.id}-${subcategory.name}`;
                              if (newExpanded.has(key)) {
                                newExpanded.delete(key);
                              } else {
                                newExpanded.add(key);
                              }
                              setExpandedSubcategories(newExpanded);
                            }}
                          />
                          
                          {/* Subcategory Name - Multi-line for longer names */}
                          {subcategory.name.length > 15 ? (
                            <>
                              <text
                                x={x}
                                y={y - 8}
                                textAnchor="middle"
                                fill="white"
                                fontSize="9"
                                fontWeight="600"
                                className="pointer-events-none"
                              >
                                {subcategory.name.substring(0, 12)}
                              </text>
                              <text
                                x={x}
                                y={y + 2}
                                textAnchor="middle"
                                fill="white"
                                fontSize="9"
                                fontWeight="600"
                                className="pointer-events-none"
                              >
                                {subcategory.name.substring(12, 24)}...
                              </text>
                            </>
                          ) : (
                            <text
                              x={x}
                              y={y - 3}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="600"
                              className="pointer-events-none"
                            >
                              {subcategory.name}
                            </text>
                          )}
                          
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
                          
                          {/* Expanded Individual Concepts */}
                          {expandedSubcategories.has(`${cluster.id}-${subcategory.name}`) && 
                            subcategory.concepts.map((concept, conceptIndex) => {
                              // Get hierarchical position for this concept
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
                                <g key={`expanded-concept-${concept.id}`}>
                                  {/* Connection line to subcategory */}
                                  <line
                                    x1={x}
                                    y1={y}
                                    x2={conceptX}
                                    y2={conceptY}
                                    stroke={cluster.color}
                                    strokeWidth={1}
                                    strokeOpacity={0.5}
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
              } else {
                // If no subcategories, show individual concepts as before (for clusters without subcategories)
                return cluster.concepts
                  .filter(concept => filteredConcepts.some(fc => fc.id === concept.id))
                  .map((concept) => {
                    const position = dynamicConceptPositions.get(concept.id);
                    if (!position) return null;

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
                            fill={`${cluster.color}20`}
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
                          fill={cluster.color}
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
                  });
              }
            })}
            </g>
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