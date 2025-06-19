import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ExternalLink, Zap, AlertTriangle, X } from 'lucide-react'

interface AutoRelationshipsProps {
  conceptId: string
  relationships: string // JSON string from database
  onRemoveRelationship?: (relatedConceptId: string, type: 'RELATED' | 'DUPLICATE') => void
}

interface RelationshipData {
  relatedConcepts?: Array<{
    id: string
    title: string
    similarity: number
    type: 'RELATED'
    autoLinked: boolean
    linkedAt: string
    relationshipType?: string
    reason?: string
    context?: string[]
    sharedElements?: string[]
  }>
  potentialDuplicates?: Array<{
    id: string
    title: string
    similarity: number
    type: 'DUPLICATE'
    autoLinked: boolean
    linkedAt: string
    relationshipType?: string
    reason?: string
    context?: string[]
    sharedElements?: string[]
  }>
}

export function AutoRelationships({ conceptId, relationships, onRemoveRelationship }: AutoRelationshipsProps) {
  // Parse relationships JSON
  let parsedRelationships: RelationshipData = {}
  try {
    if (relationships && relationships.trim() !== '') {
      parsedRelationships = JSON.parse(relationships)
    }
  } catch (error) {
    console.warn('Failed to parse relationships JSON:', error)
    return null
  }

  const relatedConcepts = parsedRelationships.relatedConcepts || []
  const potentialDuplicates = parsedRelationships.potentialDuplicates || []
  
  // Don't render if no relationships
  if (relatedConcepts.length === 0 && potentialDuplicates.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Auto-Linked Related Concepts */}
      {relatedConcepts.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Auto-Discovered Relationships
              <Badge variant="secondary" className="text-sm">
                {relatedConcepts.length} found
              </Badge>
            </CardTitle>
            <p className="text-sm text-blue-600">
              These concepts were automatically linked based on semantic similarity
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedConcepts.map((related, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-blue-100">
                <div className="flex-1">
                  <Link 
                    href={`/concept/${related.id}`}
                    className="font-medium text-blue-800 hover:text-blue-900 hover:underline"
                  >
                    {related.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      {related.similarity}% similar
                    </Badge>
                    {related.relationshipType && related.relationshipType !== 'GENERAL_SIMILARITY' && (
                      <Badge variant="secondary" className="text-xs">
                        {related.relationshipType.replace('SHARED_', '').replace('_', ' ').toLowerCase()}
                      </Badge>
                    )}
                    <span className="text-xs text-blue-600">
                      Auto-linked {new Date(related.linkedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {related.reason && (
                    <p className="text-xs text-blue-600 mt-1 italic">
                      {related.reason}
                    </p>
                  )}
                  {related.sharedElements && related.sharedElements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {related.sharedElements.map((element, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
                          {element}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <Link href={`/concept/${related.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  {onRemoveRelationship && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onRemoveRelationship(related.id, 'RELATED')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Potential Duplicates */}
      {potentialDuplicates.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Potential Duplicates
              <Badge variant="destructive" className="text-sm">
                {potentialDuplicates.length} flagged
              </Badge>
            </CardTitle>
            <p className="text-sm text-orange-600">
              These concepts appear very similar and might be duplicates
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {potentialDuplicates.map((duplicate, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-orange-100">
                <div className="flex-1">
                  <Link 
                    href={`/concept/${duplicate.id}`}
                    className="font-medium text-orange-800 hover:text-orange-900 hover:underline"
                  >
                    {duplicate.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      {duplicate.similarity}% similar
                    </Badge>
                    {duplicate.relationshipType && duplicate.relationshipType !== 'GENERAL_SIMILARITY' && (
                      <Badge variant="secondary" className="text-xs">
                        {duplicate.relationshipType.replace('SHARED_', '').replace('_', ' ').toLowerCase()}
                      </Badge>
                    )}
                    <span className="text-xs text-orange-600">
                      Flagged {new Date(duplicate.linkedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {duplicate.reason && (
                    <p className="text-xs text-orange-700 mt-1 italic font-medium">
                      {duplicate.reason}
                    </p>
                  )}
                  {duplicate.sharedElements && duplicate.sharedElements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {duplicate.sharedElements.map((element, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50">
                          {element}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-orange-600 mt-1">
                    Consider merging or removing if this is a duplicate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <Link href={`/concept/${duplicate.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  {onRemoveRelationship && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onRemoveRelationship(duplicate.id, 'DUPLICATE')}
                      title="Remove duplicate flag"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 