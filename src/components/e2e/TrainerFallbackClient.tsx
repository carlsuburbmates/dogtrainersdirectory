/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Trainer Not Found</h1>
          <p className="text-gray-600">
            This trainer profile is no longer available, or the link may be out of date.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Choose one of the options below to keep exploring the directory.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={searchHref}
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to search
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              Browse directory
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{trainer.business_name || 'Trainer Profile'}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {trainer.description && <p className="text-gray-700 mb-4">{trainer.description}</p>}
        {trainer.suburb && <p className="text-gray-600">Location: {trainer.suburb}</p>}
      </div>
    </div>
  )
}
