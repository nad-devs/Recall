import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Check,
  X,
  GripVertical
} from "lucide-react"
import { useDrag, useDrop } from 'react-dnd'
import { CategoryNode as CategoryNodeType } from '@/hooks/useCategoryHierarchy'

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

interface CategoryNodeProps {
  node: CategoryNodeType
  depth: number
  isExpanded: boolean
  isSelected: boolean
  isInlineEditing: boolean
  onToggleCategory: (path: string) => void
  onCategorySelect: (path: string) => void
  onAddSubcategory: (path: string) => void
  onStartInlineEdit: (path: string) => void
  onSaveInlineEdit: () => void
  onCancelInlineEdit: () => void
  onSetTransferConcepts: (concepts: Concept[]) => void
  onShowTransferDialog: (show: boolean) => void
  inlineEditValue: string
  onSetInlineEditValue: (value: string) => void
  isCreatingCategory: boolean
  isMovingConcepts: boolean
  isRenamingCategory: boolean
  handleCategoryDrop: (draggedPath: string, targetPath: string | null) => void
  onDragStart: () => void
  onDragEnd: () => void
  isDraggingAny: boolean
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

export const CategoryNodeComponent = React.memo(({ 
  node, 
  depth, 
  isExpanded, 
  isSelected, 
  isInlineEditing,
  onToggleCategory,
  onCategorySelect,
  onAddSubcategory,
  onStartInlineEdit,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onSetTransferConcepts,
  onShowTransferDialog,
  inlineEditValue,
  onSetInlineEditValue,
  isCreatingCategory,
  isMovingConcepts,
  isRenamingCategory,
  handleCategoryDrop,
  onDragStart,
  onDragEnd,
  isDraggingAny
}: CategoryNodeProps) => {
  const hasSubcategories = Object.keys(node.subcategories).length > 0
  const hasDirectConcepts = node.concepts.length > 0
  const Icon = getCategoryIcon(node.name)

  // Drag source setup
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CATEGORY',
    item: () => {
      if (!isDraggingAny) {
        onDragStart()
      }
      return { categoryPath: node.fullPath }
    },
    end: () => {
      if (isDraggingAny) {
        onDragEnd()
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !isCreatingCategory && !isMovingConcepts && !isRenamingCategory && !isInlineEditing,
  }), [node.fullPath, isCreatingCategory, isMovingConcepts, isRenamingCategory, isInlineEditing, isDraggingAny, onDragStart, onDragEnd])

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

  const CategoryContent = () => {
    if (isInlineEditing) {
      return (
        <div className="flex items-center flex-1" style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
          <GripVertical className="mr-1 h-4 w-4 text-muted-foreground" />
          <Icon className="mr-2 h-4 w-4" />
          <Input
            value={inlineEditValue}
            onChange={(e) => onSetInlineEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveInlineEdit()
              } else if (e.key === 'Escape') {
                onCancelInlineEdit()
              }
            }}
            onBlur={onSaveInlineEdit}
            className="h-6 text-sm flex-1 mr-2"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onSaveInlineEdit}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelInlineEdit}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

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
              onCategorySelect(node.fullPath)
              if (hasSubcategories && !isExpanded) {
                onToggleCategory(node.fullPath)
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
          onClick={() => onCategorySelect(node.fullPath)}
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
      <Collapsible open={isExpanded} onOpenChange={() => onToggleCategory(node.fullPath)}>
        <div className={`flex items-center group ${isOver && canDrop ? 'bg-primary/5' : ''}`}>
          <CategoryContent />
          
          {!isInlineEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                  disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory || isDragging}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onAddSubcategory(node.fullPath)}
                  disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStartInlineEdit(node.fullPath)}
                  disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Name
                </DropdownMenuItem>
                {hasDirectConcepts && (
                  <DropdownMenuItem 
                    onClick={() => {
                      onSetTransferConcepts(node.concepts)
                      onShowTransferDialog(true)
                    }}
                    disabled={isCreatingCategory || isMovingConcepts || isRenamingCategory}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move Concepts
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Collapsible>
    </div>
  )
}) 