'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Simple UI components
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg shadow ${className || ''}`}>{children}</div>
}

function Button({ children, onClick, disabled, variant = 'primary', type = 'button' }: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
}) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors'
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300' 
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100'
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variantClasses}`}
    >
      {children}
    </button>
  )
}

interface SearchFilters {
  query: string
  lat: string
  lng: string
  distance: string
  age_specialties: string[]
  behavior_issues: string[]
  service_type: string
  verified_only: boolean
  rescue_only: boolean
}

interface SearchResult {
  business_id: number
  business_name: string
  business_email: string
  business_phone: string
  suburb_name: string
  council_name: string
  distance_km: number
  average_rating: number
  review_count: number
  abn_verified: boolean
  verification_status: string
  age_specialties: string[]
  behavior_issues: string[]
  services: string[]
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    lat: '',
    lng: '',
    distance: 'any',
    age_specialties: [],
    behavior_issues: [],
    service_type: '',
    verified_only: false,
    rescue_only: false
  })
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  // Available filter options based on database enums
  const ageSpecialtyOptions = [
    { value: 'puppies_0_6m', label: 'Puppies (0-6 months)' },
    { value: 'adolescent_6_18m', label: 'Adolescent (6-18 months)' },
    { value: 'adult_18m_7y', label: 'Adult (18 months - 7 years)' },
    { value: 'senior_7y_plus', label: 'Senior (7+ years)' },
    { value: 'rescue_dogs', label: 'Rescue Dogs' }
  ]

  const behaviorIssueOptions = [
    { value: 'pulling_on_lead', label: 'Pulling on Lead' },
    { value: 'separation_anxiety', label: 'Separation Anxiety' },
    { value: 'excessive_barking', label: 'Excessive Barking' },
    { value: 'dog_aggression', label: 'Dog Aggression' },
    { value: 'leash_reactivity', label: 'Leash Reactivity' },
    { value: 'jumping_up', label: 'Jumping Up' },
    { value: 'destructive_behaviour', label: 'Destructive Behaviour' },
    { value: 'recall_issues', label: 'Recall Issues' },
    { value: 'anxiety_general', label: 'General Anxiety' },
    { value: 'resource_guarding', label: 'Resource Guarding' }
  ]

  const serviceTypeOptions = [
    { value: 'puppy_training', label: 'Puppy Training' },
    { value: 'obedience_training', label: 'Obedience Training' },
    { value: 'behaviour_consultations', label: 'Behaviour Consultations' },
    { value: 'group_classes', label: 'Group Classes' },
    { value: 'private_training', label: 'Private Training' }
  ]

  const distanceOptions = [
    { value: 'any', label: 'Any Distance' },
    { value: '0-5', label: 'Within 5 km' },
    { value: '5-15', label: '5-15 km' },
    { value: 'greater', label: 'Greater than 15 km' }
  ]

  const handleSearch = async (newOffset = 0) => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.query) params.append('query', filters.query)
      if (filters.lat && filters.lng) {
        params.append('lat', filters.lat)
        params.append('lng', filters.lng)
      }
      if (filters.distance !== 'any') params.append('distance', filters.distance)
      if (filters.age_specialties.length > 0) {
        params.append('age_specialties', filters.age_specialties.join(','))
      }
      if (filters.behavior_issues.length > 0) {
        params.append('behavior_issues', filters.behavior_issues.join(','))
      }
      if (filters.service_type) params.append('service_type', filters.service_type)
      if (filters.verified_only) params.append('verified_only', 'true')
      if (filters.rescue_only) params.append('rescue_only', 'true')
      
      params.append('limit', limit.toString())
      params.append('offset', newOffset.toString())

      const response = await fetch(`/api/public/search?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Search failed')
      }

      if (newOffset === 0) {
        setResults(data.results)
      } else {
        setResults(prev => [...prev, ...data.results])
      }
      
      setHasMore(data.metadata.hasMore)
      setOffset(newOffset)
      setHasSearched(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred during search')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(0)
  }

  const handleLoadMore = () => {
    handleSearch(offset + limit)
  }

  const toggleArrayFilter = (filterName: 'age_specialties' | 'behavior_issues', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: prev[filterName].includes(value)
        ? prev[filterName].filter(v => v !== value)
        : [...prev[filterName], value]
    }))
  }

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Search Dog Trainers</h1>

      {/* Search Form */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleSubmit}>
          {/* Text Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Search by name, location, or specialty..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={filters.lat}
                onChange={(e) => setFilters(prev => ({ ...prev, lat: e.target.value }))}
                placeholder="e.g., -37.8136"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={filters.lng}
                onChange={(e) => setFilters(prev => ({ ...prev, lng: e.target.value }))}
                placeholder="e.g., 144.9631"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Distance</label>
              <select
                value={filters.distance}
                onChange={(e) => setFilters(prev => ({ ...prev, distance: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {distanceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Age Specialties */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Age Specialties</label>
            <div className="flex flex-wrap gap-2">
              {ageSpecialtyOptions.map(opt => (
                <label key={opt.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.age_specialties.includes(opt.value)}
                    onChange={() => toggleArrayFilter('age_specialties', opt.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Behavior Issues */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Behavior Issues</label>
            <div className="flex flex-wrap gap-2">
              {behaviorIssueOptions.map(opt => (
                <label key={opt.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.behavior_issues.includes(opt.value)}
                    onChange={() => toggleArrayFilter('behavior_issues', opt.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Service Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Service Type</label>
            <select
              value={filters.service_type}
              onChange={(e) => setFilters(prev => ({ ...prev, service_type: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Services</option>
              {serviceTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Boolean Filters */}
          <div className="flex gap-4 mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.verified_only}
                onChange={(e) => setFilters(prev => ({ ...prev, verified_only: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Verified Only</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.rescue_only}
                onChange={(e) => setFilters(prev => ({ ...prev, rescue_only: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Rescue Dog Specialists</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {results.length} {results.length === 1 ? 'Trainer' : 'Trainers'} Found
            </h2>
          </div>

          {results.length === 0 && !loading && (
            <Card className="p-6 text-center text-gray-500">
              No trainers found matching your criteria. Try adjusting your filters.
            </Card>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((trainer) => (
                <Card key={trainer.business_id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{trainer.business_name}</h3>
                        {trainer.abn_verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">
                        {trainer.suburb_name}, {trainer.council_name}
                        {trainer.distance_km && (
                          <span className="ml-2 text-sm">
                            ({trainer.distance_km.toFixed(1)} km away)
                          </span>
                        )}
                      </p>

                      {trainer.average_rating > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{trainer.average_rating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">
                            ({trainer.review_count} {trainer.review_count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}

                      {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Specialties: </span>
                          <span className="text-sm text-gray-600">
                            {trainer.age_specialties.map(formatLabel).join(', ')}
                          </span>
                        </div>
                      )}

                      {trainer.services && trainer.services.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Services: </span>
                          <span className="text-sm text-gray-600">
                            {trainer.services.map(formatLabel).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Link 
                        href={`/trainers/${trainer.business_id}`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="mt-6 text-center">
              <Button onClick={handleLoadMore} variant="secondary">
                Load More Results
              </Button>
            </div>
          )}

          {loading && offset > 0 && (
            <div className="mt-6 text-center text-gray-500">
              Loading more results...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
