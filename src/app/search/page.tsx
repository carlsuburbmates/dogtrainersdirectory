'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import type { SuburbResult } from '@/lib/api'
import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS
} from '@/lib/constants/taxonomies'

function Panel({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ${
        className || ''
      }`}
    >
      {children}
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
  className
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  className?: string
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-colors'
  const variantClasses =
    variant === 'primary'
      ? 'bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
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

const ageSpecialtyOptions = AGE_SPECIALTIES.map((value) => ({
  value,
  label: AGE_SPECIALTY_LABELS[value]
}))

const behaviorIssueOptions = BEHAVIOR_ISSUES.map((value) => ({
  value,
  label: BEHAVIOR_ISSUE_LABELS[value]
}))

const serviceTypeOptions = SERVICE_TYPES.map((value) => ({
  value,
  label: SERVICE_TYPE_LABELS[value]
}))

const distanceOptions = [
  { value: 'any', label: 'Any distance' },
  { value: '0-5', label: 'Within 5 km' },
  { value: '5-15', label: '5 to 15 km' },
  { value: 'greater', label: '15 km+' }
]

const distanceLabels = Object.fromEntries(distanceOptions.map((option) => [option.value, option.label]))

const ageSpecialtySet = new Set<string>(AGE_SPECIALTIES)
const behaviorIssueSet = new Set<string>(BEHAVIOR_ISSUES)
const serviceTypeSet = new Set<string>(SERVICE_TYPES)

const parseAllowedList = (value: string | null, allowedValues: Set<string>) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && allowedValues.has(item))
}

const formatLabel = (value: string) => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (label) => label.toUpperCase())
}

const formatVerificationStatus = (value: string) => {
  if (!value) {
    return 'Status not shown'
  }

  if (value === 'approved') {
    return 'Approved profile'
  }

  if (value === 'verified') {
    return 'Directory verified'
  }

  return formatLabel(value)
}

const getActiveFilterCount = (filters: SearchFilters, selectedSuburb: SuburbResult | null) => {
  let count = 0
  if (filters.query) count += 1
  if (selectedSuburb || (filters.lat && filters.lng)) count += 1
  if (filters.distance !== 'any') count += 1
  count += filters.age_specialties.length
  count += filters.behavior_issues.length
  if (filters.service_type) count += 1
  if (filters.verified_only) count += 1
  if (filters.rescue_only) count += 1
  return count
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [flowSource, setFlowSource] = useState('')
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
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const runSearch = useCallback(
    async (
      nextPage: number,
      activeFilters: SearchFilters,
      activeSuburb: SuburbResult | null,
      activeFlowSource = flowSource
    ) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()

        if (activeFilters.query) params.append('q', activeFilters.query)
        if (activeSuburb) {
          params.append('lat', String(activeSuburb.latitude))
          params.append('lng', String(activeSuburb.longitude))
          params.append('suburbId', String(activeSuburb.id))
          params.append('suburbName', activeSuburb.name)
          params.append('postcode', activeSuburb.postcode)
          params.append('councilId', String(activeSuburb.council_id))
        } else if (activeFilters.lat && activeFilters.lng) {
          params.append('lat', activeFilters.lat)
          params.append('lng', activeFilters.lng)
        }
        if (activeFilters.distance !== 'any') params.append('distance', activeFilters.distance)
        if (activeFilters.age_specialties.length > 0) {
          params.append('age_specialties', activeFilters.age_specialties.join(','))
        }
        if (activeFilters.behavior_issues.length > 0) {
          params.append('behavior_issues', activeFilters.behavior_issues.join(','))
        }
        if (activeFilters.service_type) params.append('service_type', activeFilters.service_type)
        if (activeFilters.verified_only) params.append('verified_only', 'true')
        if (activeFilters.rescue_only) params.append('rescue_only', 'true')
        if (activeFlowSource) params.append('flow_source', activeFlowSource)

        params.append('limit', limit.toString())
        params.append('page', nextPage.toString())

        const response = await fetch(`/api/public/search?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Search failed')
        }

        const nextResults = Array.isArray(data.results) ? data.results : []

        if (nextPage === 1) {
          setResults(nextResults)
        } else {
          setResults((prev) => [...prev, ...nextResults])
        }

        const metadata = data?.metadata ?? {}
        setHasMore(Boolean(metadata.hasMore ?? metadata.has_more))
        setPage(nextPage)
        setHasSearched(true)
      } catch (err: any) {
        setError(err.message || 'An error occurred during search')
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    },
    [flowSource, limit]
  )

  const handleSearch = useCallback(
    (nextPage = 1) => {
      return runSearch(nextPage, filters, selectedSuburb, flowSource)
    },
    [filters, flowSource, runSearch, selectedSuburb]
  )

  useEffect(() => {
    const queryParam = searchParams.get('q') || searchParams.get('query') || ''
    const latParam = searchParams.get('lat') || ''
    const lngParam = searchParams.get('lng') || ''
    const distanceParam = searchParams.get('distance') || 'any'
    const ageParam = searchParams.get('age_specialties')
    const behaviorParam = searchParams.get('behavior_issues')
    const serviceTypeParam = searchParams.get('service_type') || ''
    const verifiedOnlyParam = searchParams.get('verified_only') === 'true'
    const rescueOnlyParam = searchParams.get('rescue_only') === 'true'
    const flowSourceParam = searchParams.get('flow_source') || ''

    const distanceValues = new Set(['any', '0-5', '5-15', 'greater'])
    const nextFilters: SearchFilters = {
      query: queryParam,
      lat: latParam,
      lng: lngParam,
      distance: distanceValues.has(distanceParam) ? distanceParam : 'any',
      age_specialties: parseAllowedList(ageParam, ageSpecialtySet),
      behavior_issues: parseAllowedList(behaviorParam, behaviorIssueSet),
      service_type: serviceTypeSet.has(serviceTypeParam) ? serviceTypeParam : '',
      verified_only: verifiedOnlyParam,
      rescue_only: rescueOnlyParam
    }

    setFilters(nextFilters)
    setFlowSource(flowSourceParam)

    const suburbName = searchParams.get('suburbName')
    const postcode = searchParams.get('postcode')
    const suburbId = searchParams.get('suburbId')
    const councilId = searchParams.get('councilId')

    let suburbFromParams: SuburbResult | null = null
    if (suburbName && postcode && latParam && lngParam) {
      suburbFromParams = {
        id: suburbId ? Number(suburbId) : -1,
        name: suburbName,
        postcode,
        latitude: Number(latParam),
        longitude: Number(lngParam),
        council_id: councilId ? Number(councilId) : 0
      }
    }

    setSelectedSuburb(suburbFromParams)

    const shouldAutoSearch = Boolean(
      queryParam ||
        (latParam && lngParam) ||
        nextFilters.age_specialties.length > 0 ||
        nextFilters.behavior_issues.length > 0 ||
        nextFilters.service_type ||
        nextFilters.verified_only ||
        nextFilters.rescue_only ||
        nextFilters.distance !== 'any'
    )

    if (shouldAutoSearch) {
      runSearch(1, nextFilters, suburbFromParams, flowSourceParam)
    } else {
      setHasSearched(false)
    }
  }, [searchParams, runSearch])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSearch(1)
  }

  const handleLoadMore = () => {
    handleSearch(page + 1)
  }

  const toggleArrayFilter = (filterName: 'age_specialties' | 'behavior_issues', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: prev[filterName].includes(value)
        ? prev[filterName].filter((item) => item !== value)
        : [...prev[filterName], value]
    }))
  }

  const activeFilterCount = getActiveFilterCount(filters, selectedSuburb)
  const resultHeading = hasSearched
    ? `${results.length} ${results.length === 1 ? 'trainer' : 'trainers'} found`
    : 'Search ready'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.06),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f7fafc_50%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_22px_60px_-36px_rgba(15,23,42,0.35)]">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Trainer discovery
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Compare Melbourne trainers with your shortlist already narrowed.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Use the filters to tighten fit, then move quickly into a profile with clearer trust
                cues and direct contact options.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {resultHeading}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {activeFilterCount} active filters
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {distanceLabels[filters.distance] || distanceLabels.any}
                </span>
                {selectedSuburb && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {selectedSuburb.name} {selectedSuburb.postcode}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">What this page is for</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Keep the search broad enough to compare, then move to a profile once you find a
                  credible fit.
                </p>
                <p>
                  Verified badges and ratings are intended to help you narrow faster, not replace
                  the final conversation with the trainer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Panel className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Refine your shortlist</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Adjust fit, distance, and service focus before comparing profiles.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Search</label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, query: event.target.value }))
                    }
                    placeholder="Search by name, location, or speciality..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Suburb</label>
                  <div className="mt-2">
                    <SuburbAutocomplete
                      value={selectedSuburb}
                      onChange={(suburb) => {
                        setSelectedSuburb(suburb)
                        if (suburb) {
                          setFilters((prev) => ({
                            ...prev,
                            lat: String(suburb.latitude),
                            lng: String(suburb.longitude)
                          }))
                        } else {
                          setFilters((prev) => ({
                            ...prev,
                            lat: '',
                            lng: ''
                          }))
                        }
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    We use suburb coordinates for distance sorting. Manual coordinates are still
                    available below.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={filters.lat}
                      onChange={(event) => {
                        setFilters((prev) => ({ ...prev, lat: event.target.value }))
                        setSelectedSuburb(null)
                      }}
                      placeholder="-37.8136"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={filters.lng}
                      onChange={(event) => {
                        setFilters((prev) => ({ ...prev, lng: event.target.value }))
                        setSelectedSuburb(null)
                      }}
                      placeholder="144.9631"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Distance</label>
                  <select
                    value={filters.distance}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, distance: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {distanceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">
                    Age specialities
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ageSpecialtyOptions.map((option) => {
                      const selected = filters.age_specialties.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleArrayFilter('age_specialties', option.value)}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                            selected
                              ? 'bg-slate-950 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">
                    Behaviour issues
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {behaviorIssueOptions.map((option) => {
                      const selected = filters.behavior_issues.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleArrayFilter('behavior_issues', option.value)}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Service type</label>
                  <select
                    value={filters.service_type}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, service_type: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">All services</option>
                    {serviceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span>Verified only</span>
                    <input
                      type="checkbox"
                      checked={filters.verified_only}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, verified_only: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span>Rescue dog specialists</span>
                    <input
                      type="checkbox"
                      checked={filters.rescue_only}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, rescue_only: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <ActionButton type="submit" disabled={loading} className="w-full">
                  {loading ? 'Searching...' : 'Update results'}
                </ActionButton>
              </form>
            </Panel>

            <Panel className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                How to compare well
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Start with fit: stage, location, and key behaviour issues.</li>
                <li>Use ratings and verification to narrow, then read the full profile.</li>
                <li>When a profile looks credible, contact directly instead of endlessly filtering.</li>
              </ul>
            </Panel>
          </div>

          <div className="space-y-5">
            {error && (
              <Panel className="border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </Panel>
            )}

            {!hasSearched && !error && (
              <Panel className="p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Ready to search
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950">
                  Run a search to build your shortlist
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Start with suburb, service needs, or a trainer name. This page is designed to
                  move you from a broad shortlist into one credible profile fast.
                </p>
              </Panel>
            )}

            {hasSearched && (
              <>
                <Panel className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-950">{resultHeading}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Prioritise verified fit, then move to a full profile for contact details and
                        proof.
                      </p>
                    </div>
                    {hasMore && !loading && (
                      <ActionButton onClick={handleLoadMore} variant="secondary">
                        Load More Results
                      </ActionButton>
                    )}
                  </div>
                </Panel>

                {results.length === 0 && !loading && (
                  <Panel className="p-8 text-center">
                    <h3 className="text-xl font-bold text-slate-900">No trainers matched yet</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Widen the search radius, remove a few filters, or broaden the issue list to
                      surface more options.
                    </p>
                  </Panel>
                )}

                {results.length > 0 && (
                  <div className="space-y-4">
                    {results.map((trainer) => {
                      const rating = Number(trainer.average_rating || 0)
                      const reviewCount = Number(trainer.review_count || 0)
                      const hasPublicReviews = rating > 0 && reviewCount > 0
                      const listedScopeCount =
                        trainer.services.length +
                        trainer.age_specialties.length +
                        trainer.behavior_issues.length
                      const trainerHref = flowSource
                        ? `/trainers/${trainer.business_id}?flow_source=${encodeURIComponent(flowSource)}`
                        : `/trainers/${trainer.business_id}`

                      return (
                        <Panel key={trainer.business_id} className="p-6">
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-2xl font-bold text-slate-950">
                                  {trainer.business_name}
                                </h3>
                                {trainer.abn_verified && (
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                                    Verified
                                  </span>
                                )}
                                {trainer.verification_status === 'approved' && (
                                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                                    Approved profile
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                                <span>
                                  {trainer.suburb_name}, {trainer.council_name}
                                </span>
                                {trainer.distance_km ? (
                                  <span>{trainer.distance_km.toFixed(1)} km away</span>
                                ) : null}
                                {hasPublicReviews ? (
                                  <span>
                                    {rating.toFixed(1)} from {reviewCount}{' '}
                                    {reviewCount === 1 ? 'review' : 'reviews'}
                                  </span>
                                ) : (
                                  <span>No public reviews yet</span>
                                )}
                              </div>

                              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Verification
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-950">
                                    {trainer.abn_verified ? 'ABN verified' : 'ABN not verified'}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {formatVerificationStatus(trainer.verification_status)}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Public reviews
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-950">
                                    {hasPublicReviews ? `${rating.toFixed(1)} average` : 'No rating yet'}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {reviewCount > 0
                                      ? `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'} visible`
                                      : 'No approved reviews listed'}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Match details
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-950">
                                    {listedScopeCount > 0
                                      ? `${listedScopeCount} fit signals listed`
                                      : 'No fit details listed'}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {trainer.services.length} services, {trainer.age_specialties.length}{' '}
                                    age, {trainer.behavior_issues.length} behaviour
                                  </p>
                                </div>
                              </div>

                              {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Age fit ({trainer.age_specialties.length})
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {trainer.age_specialties.slice(0, 4).map((value) => (
                                      <span
                                        key={value}
                                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                      >
                                        {formatLabel(value)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {trainer.behavior_issues && trainer.behavior_issues.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Behaviour strengths ({trainer.behavior_issues.length})
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {trainer.behavior_issues.slice(0, 4).map(formatLabel).join(', ')}
                                  </p>
                                </div>
                              )}

                              {trainer.services && trainer.services.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Services ({trainer.services.length})
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {trainer.services.slice(0, 3).map(formatLabel).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-5 xl:w-[240px]">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Next step
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                Open the profile to confirm contact details, pricing, and the full
                                credibility breakdown before reaching out.
                              </p>
                              <Link
                                href={trainerHref}
                                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </Panel>
                      )
                    })}
                  </div>
                )}

                {loading && page > 1 && (
                  <Panel className="p-5 text-center">
                    <p className="text-sm text-slate-500">Loading more results...</p>
                  </Panel>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
