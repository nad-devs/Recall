"use client"

import React, { useState, useEffect } from 'react'
import { use } from "react"
import { useRouter } from 'next/navigation'
import { SimpleConceptEnhancer } from '@/components/simple-concept-enhancer'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ConceptEnhancePageProps {
  params: Promise<{ id: string }>
}

export default function ConceptEnhancePage({ params }: ConceptEnhancePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [concept, setConcept] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConcept = async () => {
      try {
        const response = await fetch(`/api/concepts/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch concept')
        }
        const data = await response.json()
        setConcept(data.concept)
      } catch (err) {
        console.error('Error fetching concept:', err)
        setError('Failed to load concept')
      } finally {
        setLoading(false)
      }
    }

    fetchConcept()
  }, [id])

  const handleSave = (updatedConcept: any) => {
    setConcept(updatedConcept)
    router.push(`/concept/${id}`)
  }

  const handleCancel = () => {
    router.push(`/concept/${id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading concept...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !concept) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/concepts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Enhance Concept</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || 'Concept not found'}</p>
          <Button asChild>
            <Link href="/concepts">Back to Concepts</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/concept/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Enhance Concept</h1>
      </div>
      
      <SimpleConceptEnhancer
        concept={concept}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
} 