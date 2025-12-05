'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiService, SearchResult } from '../../lib/api'

export default function SearchResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get results from sessionStorage set by the triage page
    const storedResults = sessionStorage.getItem('searchResults')
    const storedParams = sessionStorage.getItem('searchParams')
    
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults) as SearchResult[]
        setResults(results)
        setLoading(false)
      } catch (error) {
        console.error('Error parsing stored results:', error)
        setResults([])
        setLoading(false)
      }
    } else {
      // No results found, redirect back to home
      router.push('/')
    }
  }, [router])

  const handleContactTrainer = (trainer: SearchResult) => {
    // TODO: Implement contact functionality
    alert(`Contacting ${trainer.business_name} - Phone: ${trainer.business_phone}`)
  }

  const handleViewProfile = (trainer: SearchResult) => {
    // TODO: Navigate to trainer profile page
    alert(`Viewing profile for ${trainer.business_name}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding trainers...</p>
        </div>
      </div>
    )
  }

  return (
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

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">No trainers found</h2>
              <p className="text-gray-600">
                We couldn't find any trainers matching your criteria. Try adjusting your search filters or browse all trainers in your area.
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
          </div>
        )}
      </div>
    </main>
  )
}