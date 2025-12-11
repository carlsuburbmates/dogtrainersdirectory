'use client'

import React, { useState, useEffect, useMemo, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { apiService, SearchResult } from '../../lib/api'
import { Button } from '@/components/ui/Button'
import { generateResultsStructuredData } from './metadata'
import Head from 'next/head'
export default function SearchResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'verified'>('distance')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 30

  const suburbId = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    const storedParams = window.sessionStorage.getItem('searchParams')
    return storedParams ? JSON.parse(storedParams)?.suburbId : null
  }, [])

  useEffect(() => {
    let cancelled = false

    const hydrateFromStorage = () => {
      if (typeof window === 'undefined') return
      const storedResults = window.sessionStorage.getItem('searchResults')

      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults) as SearchResult[]
          startTransition(() => {
            if (cancelled) return
            setResults(parsed)
            setLoading(false)
          })
          return
        } catch (error) {
          console.error('Error parsing stored results:', error)
        }
      }

      if (!cancelled) {
        router.push('/')
      }
    }

    hydrateFromStorage()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleContactTrainer = (trainer: SearchResult) => {
    // TODO: Implement contact functionality
    alert(`Contacting ${trainer.business_name} - Phone: ${trainer.business_phone}`)
  }

  const handleViewProfile = (trainer: SearchResult) => {
    router.push(`/trainers/${trainer.business_id}`)
  }

  const paginatedResults = results.slice(0, page * PAGE_SIZE)
  const canLoadMore = results.length > page * PAGE_SIZE

  const sortedResults = useMemo(() => {
    const list = [...paginatedResults]
    switch (sortBy) {
      case 'distance':
        return list.sort((a, b) => a.distance_km - b.distance_km)
      case 'rating':
        return list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      case 'verified':
        return list.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0))
      default:
        return list
    }
  }, [sortBy, paginatedResults])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding trainers...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    )
  }

  const structuredData = JSON.stringify(generateResultsStructuredData(results.length, suburbId), null, 0)

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      </Head>
      <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="btn-secondary mb-4"
          >
            ← Back to Triage
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Search Results
          </h1>
          <p className="text-gray-600">
            Found {results.length} trainer{results.length === 1 ? '' : 's'} near you
          </p>
        </div>

        {/* Sort bar */}
        <div className="mb-4 bg-white rounded-md border border-gray-200 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-sm border rounded px-2 py-1">
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
            <option value="verified">Verified</option>
          </select>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">No trainers found</h2>
              <p className="text-gray-600">
                We couldn&rsquo;t find any trainers matching your criteria. Try adjusting your search filters or browse all trainers in your area.
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary mt-6"
              >
                Start New Search
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((trainer, index) => (
              <div key={trainer.business_id} className="card p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {trainer.business_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {trainer.suburb_name} • {trainer.distance_km.toFixed(1)}km away
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {trainer.verified && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        ✓ Verified
                      </span>
                    )}
                    <div className="text-right">
                      <div className="flex items-center mb-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="ml-1 text-sm font-medium">{trainer.average_rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {trainer.review_count} reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Specializes in:</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.age_specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-2 mb-2"
                      >
                        {specialty.replace(/_/g, ' ').replace(/\b\w/g, ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Behavior Issues */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Helps with:</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.behavior_issues.map((issue, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mr-2 mb-2"
                      >
                        {issue.replace(/_/g, ' ').replace(/\b\w/g, ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Services:</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mr-2 mb-2"
                      >
                        {service.replace(/_/g, ' ').replace(/\b\w/g, ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Contact:</h4>
                  <div className="space-y-2 text-sm">
                    {trainer.business_phone && (
                      <div>
                        <span className="font-medium">📞 Phone:</span>
                        <span>{trainer.business_phone}</span>
                      </div>
                    )}
                    {trainer.business_email && (
                      <div>
                        <span className="font-medium">✉ Email:</span>
                        <span>{trainer.business_email}</span>
                      </div>
                    )}
                    {trainer.business_website && (
                      <div>
                        <span className="font-medium">🌐 Website:</span>
                        <a 
                          href={trainer.business_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {trainer.business_website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleContactTrainer(trainer)}
                    className="btn-primary flex-1"
                  >
                    Contact Trainer
                  </button>
                  <button
                    onClick={() => handleViewProfile(trainer)}
                    className="btn-secondary flex-1"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
            {canLoadMore && (
              <div className="mt-6 text-center">
                <Button onClick={() => setPage(p => p + 1)} variant="secondary" className="w-full max-w-xs">
                  Load more ({results.length - page * PAGE_SIZE} left)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
    </>
  )
}
