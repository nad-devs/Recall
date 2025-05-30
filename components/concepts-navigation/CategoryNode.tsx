import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Brain,
  Code,
  Database,
  Globe,
  Layers
} from "lucide-react"
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
  onToggleCategory,
  onCategorySelect
}: CategoryNodeProps) => {
  const hasSubcategories = Object.keys(node.subcategories).length > 0
  const hasDirectConcepts = node.concepts.length > 0
  const Icon = getCategoryIcon(node.name)

  // Calculate direct concepts count (only concepts directly in this category)
  const directConceptsCount = node.concepts.length
  
  // Calculate subcategory concepts count 
  const subcategoryConceptsCount = node.conceptCount - directConceptsCount
  
  // Determine what count to show and how
  const getCountDisplay = () => {
    if (hasSubcategories) {
      if (isExpanded) {
        // When expanded, show direct count and total if there are subcategories with concepts
        if (directConceptsCount > 0 && subcategoryConceptsCount > 0) {
          return (
            <div className="flex items-center gap-1 ml-auto">
              <Badge variant="outline" className="text-xs" title="Direct concepts in this category">
                {directConceptsCount}
              </Badge>
              <Badge variant={isSelected ? "default" : "secondary"} className="text-xs" title="Total concepts including subcategories">
                {node.conceptCount}
              </Badge>
            </div>
          )
        } else if (directConceptsCount > 0) {
          return (
            <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs" title="Direct concepts in this category">
              {directConceptsCount}
            </Badge>
          )
        } else if (subcategoryConceptsCount > 0) {
          return (
            <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs" title="Total concepts in subcategories">
              {node.conceptCount}
            </Badge>
          )
        }
      } else {
        // When collapsed, always show total aggregated count
        if (node.conceptCount > 0) {
          return (
            <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs" title="Total concepts including subcategories">
              {node.conceptCount}
            </Badge>
          )
        }
      }
    } else {
      // No subcategories, just show direct count
      if (directConceptsCount > 0) {
        return (
          <Badge variant={isSelected ? "default" : "secondary"} className="ml-auto text-xs" title="Concepts in this category">
            {directConceptsCount}
          </Badge>
        )
      }
    }
    return null
  }

  if (hasSubcategories) {
    return (
      <div>
        <Collapsible open={isExpanded} onOpenChange={() => onToggleCategory(node.fullPath)}>
          <div className="flex items-center group">
            <div className="flex items-center flex-1" style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
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
                }`}
                onClick={() => {
                  onCategorySelect(node.fullPath)
                  if (hasSubcategories && !isExpanded) {
                    onToggleCategory(node.fullPath)
                  }
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="truncate">{node.name}</span>
                {getCountDisplay()}
              </Button>
            </div>
          </div>
        </Collapsible>
      </div>
    )
  } else {
    return (
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        className={`w-full justify-start h-auto hover:bg-muted/30 ${
          depth === 0 ? 'font-medium p-2' : 'font-normal text-sm p-1.5'
        }`}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        onClick={() => onCategorySelect(node.fullPath)}
      >
        <Icon className="mr-2 h-4 w-4" />
        <span className="truncate">{node.name}</span>
        {getCountDisplay()}
      </Button>
    )
  }
}) 