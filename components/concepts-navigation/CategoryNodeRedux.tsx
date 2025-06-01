import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Brain,
  Code,
  Database,
  Globe,
  Layers,
  FolderPlus,
  MoreHorizontal,
  ArrowRight,
  Edit,
  GripVertical
} from "lucide-react"
import { useDrag, useDrop } from 'react-dnd'
import { useAppSelector, useAppDispatch } from '@/store/hooks'

interface Concept {
  id: string
  title: string
  category: string
  notes?: string
  summary?: string
  discussedInConversations?: string[]
  needsReview?: boolean
  isPlaceholder?: boolean
}

interface CategoryNodeReduxProps {
  node: any
  depth: number
  onAddSubcategory: (path: string) => void
  onSetTransferConcepts: (concepts: Concept[]) => void
  handleCategoryDrop: (draggedPath: string, targetPath: string | null) => void
  categoryOps: any
  expandedCategories?: string[]
  onToggleCategory?: (path: string) => void
  selectedCategory?: string
  isDraggingAny?: boolean
  onStartDragging?: () => void
  onEndDragging?: () => void
}

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase()
  if (lower.includes('algorithm') || lower.includes('data structures')) return Code
  if (lower.includes('backend') || lower.includes('database')) return Database
  if (lower.includes('frontend') || lower.includes('react')) return Layers
  if (lower.includes('cloud') || lower.includes('aws')) return Globe
  if (lower.includes('machine learning') || lower.includes('ai') || lower.includes('deep learning')) return Brain
  return BookOpen
}

export const CategoryNodeRedux = React.memo(({ 
  node, 
  depth, 
  onAddSubcategory,
  onSetTransferConcepts,
  handleCategoryDrop,
  categoryOps,
  expandedCategories = [],
  onToggleCategory,
  selectedCategory,
  isDraggingAny = false,
  onStartDragging,
  onEndDragging
}: CategoryNodeReduxProps) => {
  const dispatch = useAppDispatch()
  
  // Local state for expansion if not provided via props
  const [localExpanded, setLocalExpanded] = useState(false)
  
  const hasSubcategories = Object.keys(node.subcategories).length > 0
  const hasDirectConcepts = node.concepts.length > 0
  const Icon = getCategoryIcon(node.name)
  const isExpanded = expandedCategories.includes(node.fullPath) || localExpanded
  const isSelected = selectedCategory === node.fullPath

  // Drag source setup
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CATEGORY',
    item: () => {
      if (!isDraggingAny && onStartDragging) {
        onStartDragging()
      }
      return { categoryPath: node.fullPath }
    },
    end: () => {
      if (isDraggingAny && onEndDragging) {
        onEndDragging()
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !categoryOps.isCreatingCategory && !categoryOps.isMovingConcepts && !categoryOps.isRenamingCategory,
  }), [node.fullPath, categoryOps.isCreatingCategory, categoryOps.isMovingConcepts, categoryOps.isRenamingCategory, isDraggingAny, onStartDragging, onEndDragging])

  // Drop target setup
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'CATEGORY',
    drop: (item: { categoryPath: string }, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        handleCategoryDrop(item.categoryPath, node.fullPath)
      }
    },
    canDrop: (item: { categoryPath: string }) => {
      return item.categoryPath !== node.fullPath && 
             !node.fullPath.startsWith(item.categoryPath + ' > ')
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  }), [node.fullPath, handleCategoryDrop])

  const handleToggle = () => {
    if (onToggleCategory) {
      onToggleCategory(node.fullPath)
    } else {
      setLocalExpanded(!localExpanded)
    }
  }

  const CategoryContent = () => {
    if (hasSubcategories) {
      return (
        <div className="flex items-center flex-1" style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
          <GripVertical className="mr-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-1 h-6 w-6 hover:bg-muted/50 mr-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            className={`flex-1 justify-start h-auto hover:bg-muted/30 ${
              depth === 0 ? 'font-medium p-2' : 'font-normal text-sm p-1.5'
            } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-primary/10' : ''}`}
            onClick={() => {
              // Use Redux for category selection
              if (hasSubcategories && !isExpanded) {
                handleToggle()
              }
            }}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="truncate">{node.name}</span>
            {!isExpanded && node.conceptCount > 0 && (
              <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs">
                {node.conceptCount}
              </Badge>
            )}
          </Button>
        </div>
      )
    } else {
      return (
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={`flex-1 justify-start h-auto hover:bg-muted/30 ${
            depth === 0 ? 'font-medium p-2' : 'font-normal text-sm p-1.5'
          } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-primary/10' : ''}`}
          style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        >
          <GripVertical className="mr-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon className="mr-2 h-4 w-4" />
          <span className="truncate">{node.name}</span>
          {node.conceptCount > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {node.conceptCount}
            </Badge>
          )}
        </Button>
      )
    }
  }

  return (
    <div ref={(el) => {
      drag(el)
      drop(el)
    }}>
      <Collapsible open={isExpanded} onOpenChange={handleToggle}>
        <div className={`flex items-center group ${isOver && canDrop ? 'bg-primary/5' : ''}`}>
          <CategoryContent />
          
          <div className="flex-shrink-0 ml-1 mr-2 w-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                  disabled={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory || isDragging}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md">
                <DropdownMenuItem 
                  onClick={() => onAddSubcategory(node.fullPath)}
                  disabled={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory}
                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    // TODO: Implement inline editing with Redux
                  }}
                  disabled={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory}
                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Name
                </DropdownMenuItem>
                {hasDirectConcepts && (
                  <DropdownMenuItem 
                    onClick={() => {
                      onSetTransferConcepts(node.concepts)
                    }}
                    disabled={categoryOps.isCreatingCategory || categoryOps.isMovingConcepts || categoryOps.isRenamingCategory}
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move Concepts
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Render subcategories */}
        {Object.keys(node.subcategories).length > 0 && isExpanded && (
          <CollapsibleContent>
            <div>
              {Object.values(node.subcategories)
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((subNode: any) => (
                  <CategoryNodeRedux
                    key={subNode.fullPath}
                    node={subNode}
                    depth={depth + 1}
                    onAddSubcategory={onAddSubcategory}
                    onSetTransferConcepts={onSetTransferConcepts}
                    handleCategoryDrop={handleCategoryDrop}
                    categoryOps={categoryOps}
                    expandedCategories={expandedCategories}
                    onToggleCategory={onToggleCategory}
                    selectedCategory={selectedCategory}
                    isDraggingAny={isDraggingAny}
                    onStartDragging={onStartDragging}
                    onEndDragging={onEndDragging}
                  />
                ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}) 