/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, StateCard } from '@/components/ui/primitives'

interface TrainerFallbackClientProps {
  id: number
}

export default function TrainerFallbackClient({ id }: TrainerFallbackClientProps) {
  const searchParams = useSearchParams()
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fixtureKey = `e2e_trainer_${id}`
    const fixture = typeof window !== 'undefined' ? sessionStorage.getItem(fixtureKey) : null
    
    if (fixture) {
      try {
        setTrainer(JSON.parse(fixture))
      } catch (e) {
        console.error('Failed to parse trainer fixture:', e)
      }
    }
    setLoading(false)
  }, [id])

  const preservedSearch = searchParams.toString()
  const searchHref = preservedSearch ? `/search?${preservedSearch}` : '/search'

  if (loading) {
    return (
      <div className="shell-container py-6">
        <Card tone="muted" className="animate-pulse">
          <div className="h-8 w-1/2 rounded bg-gray-200 mb-4"></div>
          <div className="h-4 w-3/4 rounded bg-gray-200 mb-2"></div>
        </Card>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="shell-container max-w-3xl py-6">
        <StateCard
          title="Trainer Not Found"
          description="This trainer profile is no longer available, or the link may be out of date."
          actions={
            <>
              <Link
                href={searchHref}
                className="inline-flex min-h-[44px] items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Back to search
              </Link>
              <Link
                href="/directory"
                className="inline-flex min-h-[44px] items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              >
                Browse directory
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              >
                Go home
              </Link>
            </>
          }
        />
      </div>
    )
  }

  return (
    <div className="shell-container py-6">
      <h1 className="text-2xl font-bold mb-6">{trainer.business_name || 'Trainer Profile'}</h1>
      <Card>
        {trainer.description && <p className="text-gray-700 mb-4">{trainer.description}</p>}
        {trainer.suburb && <p className="text-gray-600">Location: {trainer.suburb}</p>}
      </Card>
    </div>
  )
}
