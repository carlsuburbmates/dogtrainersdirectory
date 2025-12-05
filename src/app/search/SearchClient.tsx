'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchAutocomplete, SearchNavigatePayload } from '@/components/SearchAutocomplete'
import { apiService, SearchResult, SuburbResult, TriageRequest } from '../../lib/api'
import {
  AGE_STAGE_OPTIONS,
  DISTANCE_OPTIONS,
  FILTERS_SESSION_KEY,
  ISSUE_OPTIONS,
  RESULTS_SESSION_KEY,
  AgeStageValue,
  formatSuburbLabel,
  isValidIssueValue,
  stageToSpecialties
} from '../../lib/triage'
import { BehaviorIssue, DistanceFilter, ServiceType, isValidServiceType } from '../../types/database'

const PAGE_SIZE = 20
const MAX_PRICE = 200

type FilterState = {
  stage: AgeStageValue
  includeRescue: boolean
  issues: BehaviorIssue[]
  suburbId: number | null
  suburbLabel: string | null
  distance: DistanceFilter
  serviceType: ServiceType | null
  priceMax: number
  verifiedOnly: boolean
  searchTerm: string
}

const SERVICE_OPTIONS: { value: ServiceType | null; label: string }[] = [
  { value: null, label: 'Any service' },
  { value: 'puppy_training', label: 'Puppy training' },
  { value: 'obedience_training', label: 'Obedience training' },
  { value: 'behaviour_consultations', label: 'Behaviour consultations' },
  { value: 'group_classes', label: 'Group classes' },
  { value: 'private_training', label: 'Private training' }
]

const formatTag = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const buildRequest = (filters: FilterState): TriageRequest => ({
  ageFilters: stageToSpecialties(filters.stage) ?? undefined,
  includeRescue: filters.includeRescue,
  issues: filters.issues.length ? filters.issues : undefined,
  suburbId: filters.suburbId ?? undefined,
  distanceFilter: filters.suburbId ? filters.distance : 'greater',
  serviceType: filters.serviceType ?? undefined,
  verifiedOnly: filters.verifiedOnly,
  priceMax: filters.priceMax,
  searchTerm: filters.searchTerm || undefined,
  limit: 100
})

const filtersMatch = (cached: any, current: FilterState) => {
  try {
    return (
      cached &&
      cached.stage === current.stage &&
      cached.includeRescue === current.includeRescue &&
      (cached.suburbId ?? null) === current.suburbId &&
      (cached.distance ?? 'greater') === current.distance &&
      (cached.serviceType ?? null) === current.serviceType &&
      (cached.priceMax ?? MAX_PRICE) === current.priceMax &&
      (cached.verifiedOnly ?? false) === current.verifiedOnly &&
      (cached.searchTerm ?? '') === current.searchTerm &&
      Array.isArray(cached.issues) &&
      cached.issues.length === current.issues.length &&
      cached.issues.every((issue: string, index: number) => issue === current.issues[index])
    )
  } catch {
    return false
  }
}

export default function SearchResultsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const initialFilters = useMemo<FilterState>(() => {
    const stageParam = params.get('stage')
    const stage = AGE_STAGE_OPTIONS.some((option) => option.value === stageParam) ? (stageParam as AgeStageValue) : '2-6'
    const includeRescue = params.get('rescue') === '1'
    const issuesParam = params.get('issues')
    const parsedIssues = issuesParam
      ? issuesParam
          .split(',')
          .map((issue) => issue.trim())
          .filter((issue): issue is BehaviorIssue => isValidIssueValue(issue))
      : []
    const suburbIdParam = params.get('suburbId')
    const suburbId = suburbIdParam ? Number(suburbIdParam) : null
    const suburbLabel = suburbId ? params.get('suburbLabel') ?? null : null
    const distanceParam = params.get('distance')
    const allowedDistances: DistanceFilter[] = ['0-5', '5-15', 'greater']
    const distance = suburbId && distanceParam && allowedDistances.includes(distanceParam as DistanceFilter)
      ? (distanceParam as DistanceFilter)
      : 'greater'
    const serviceParam = params.get('service')
    const serviceType = serviceParam && isValidServiceType(serviceParam) ? (serviceParam as ServiceType) : null
    const verifiedOnly = params.get('verified') === '1'
    const priceParam = params.get('priceMax')
    const parsedPrice = priceParam ? Number(priceParam) : MAX_PRICE
    const priceMax = Number.isFinite(parsedPrice) ? Math.min(Math.max(parsedPrice, 0), MAX_PRICE) : MAX_PRICE
    const searchTerm = params.get('search') ?? ''
    return {
      stage,
      includeRescue,
      issues: parsedIssues,
      suburbId,
      suburbLabel,
      distance: suburbId ? distance : 'greater',
      serviceType,
      priceMax,
      verifiedOnly,
      searchTerm
    }
  }, [params])

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [suburbQuery, setSuburbQuery] = useState(initialFilters.suburbLabel ?? '')
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = true
  }, [])

  useEffect(() => {
    if (suburbQuery.trim().length < 2) {
      setSuburbSuggestions([])
      return
    }

    let isCurrent = true
    apiService
      .searchSuburbs(suburbQuery.trim())
      .then((items) => {
        if (isCurrent) setSuburbSuggestions(items)
      })
      .catch(() => {
        if (isCurrent) setSuburbSuggestions([])
      })

    return () => {
      isCurrent = false
    }
  }, [suburbQuery])

  useEffect(() => {
    const cachedFiltersRaw = typeof window !== 'undefined' ? sessionStorage.getItem(FILTERS_SESSION_KEY) : null
    const cachedResultsRaw = typeof window !== 'undefined' ? sessionStorage.getItem(RESULTS_SESSION_KEY) : null
    if (!cachedFiltersRaw || !cachedResultsRaw) return
    try {
      const cachedFilters = JSON.parse(cachedFiltersRaw)
      const cachedResults: SearchResult[] = JSON.parse(cachedResultsRaw)
      if (filtersMatch(cachedFilters, initialFilters)) {
        setResults(cachedResults)
        setVisibleCount(Math.min(PAGE_SIZE, cachedResults.length))
      }
    } catch {
      // Ignore cache parse errors
    }
  }, [initialFilters])

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)
    const request = buildRequest(filters)
    apiService
      .getTriageResults(request)
      .then((data) => {
        if (!isCurrent) return
        setResults(data)
        setVisibleCount(Math.min(PAGE_SIZE, data.length))
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(RESULTS_SESSION_KEY, JSON.stringify(data))
          sessionStorage.setItem(FILTERS_SESSION_KEY, JSON.stringify(filters))
        }
      })
      .catch((err) => {
        console.error(err)
        if (!isCurrent) return
        setResults([])
        setError('Unable to load trainers right now. Please adjust filters or try again.')
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [filters])

  const syncQueryParams = (state: FilterState) => {
    const query = new URLSearchParams()
    query.set('stage', state.stage)
    if (state.includeRescue) query.set('rescue', '1')
    if (state.issues.length) query.set('issues', state.issues.join(','))
    if (state.suburbId) {
      query.set('suburbId', String(state.suburbId))
      if (state.suburbLabel) query.set('suburbLabel', state.suburbLabel)
      if (state.distance) query.set('distance', state.distance)
    }
    if (state.serviceType) query.set('service', state.serviceType)
    if (state.verifiedOnly) query.set('verified', '1')
    if (state.priceMax !== MAX_PRICE) query.set('priceMax', String(state.priceMax))
    if (state.searchTerm) query.set('search', state.searchTerm)
    router.replace(`/search?${query.toString()}`, { scroll: false })
  }

  const updateFilters = (updater: (prev: FilterState) => FilterState) => {
    setFilters((prev) => {
      const next = updater(prev)
      if (hasMounted.current) {
        syncQueryParams(next)
      }
      return next
    })
    setVisibleCount(PAGE_SIZE)
  }

  const handleAutocompleteNavigate = (payload: SearchNavigatePayload) => {
    if (payload.type === 'trainer') {
      router.push(`/trainer/${payload.id}`)
      return
    }

    if (payload.type === 'issue') {
      updateFilters((prev) => ({ ...prev, issues: [payload.value], searchTerm: '' }))
      return
    }

    if (payload.type === 'suburb') {
      const label = `${payload.name} (${payload.postcode}) • ${payload.council_name}`
      setSuburbQuery(`${payload.name} (${payload.postcode})`)
      updateFilters((prev) => ({
        ...prev,
        suburbId: payload.id,
        suburbLabel: label,
        distance: '0-5'
      }))
      return
    }

    if (payload.type === 'age') {
      updateFilters((prev) => ({ ...prev, stage: payload.value }))
      return
    }

    if (payload.type === 'search') {
      updateFilters((prev) => ({ ...prev, searchTerm: payload.query }))
    }
  }

  const handleIssueToggle = (issue: BehaviorIssue) => {
    updateFilters((prev) => {
      const exists = prev.issues.includes(issue)
      return {
        ...prev,
        issues: exists ? prev.issues.filter((value) => value !== issue) : [...prev.issues, issue]
      }
    })
  }

  const handleSuburbSelect = (suburb: SuburbResult) => {
    setSuburbQuery(`${suburb.name} (${suburb.postcode})`)
    setSuburbSuggestions([])
    updateFilters((prev) => ({
      ...prev,
      suburbId: suburb.id,
      suburbLabel: formatSuburbLabel(suburb),
      distance: prev.distance === 'greater' ? '0-5' : prev.distance
    }))
  }

  const handleSuburbClear = () => {
    setSuburbQuery('')
    setSuburbSuggestions([])
    updateFilters((prev) => ({
      ...prev,
      suburbId: null,
      suburbLabel: null,
      distance: 'greater'
    }))
  }

  const displayedResults = results.slice(0, visibleCount)

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-80 space-y-6">
          <div className="card space-y-4">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500">Age</p>
              <div className="space-y-2 mt-2">
                {AGE_STAGE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-start space-x-2 text-sm">
                    <input
                      type="radio"
                      name="age"
                      value={option.value}
                      checked={filters.stage === option.value}
                      onChange={() => updateFilters((prev) => ({ ...prev, stage: option.value }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-gray-900">{option.label}</span>
                      <span className="text-gray-500">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center space-x-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={filters.includeRescue}
                onChange={(event) => updateFilters((prev) => ({ ...prev, includeRescue: event.target.checked }))}
              />
              <span>Rescue dog focus</span>
            </label>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase font-semibold text-gray-500">Behaviour issues</p>
              <button type="button" className="text-xs text-blue-600 underline" onClick={() => updateFilters((prev) => ({ ...prev, issues: [] }))}>
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ISSUE_OPTIONS.map((option) => {
                const active = filters.issues.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleIssueToggle(option.value)}
                    className={`px-2 py-1 rounded-full text-xs border ${
                      active ? 'bg-orange-600 text-white border-orange-600' : 'text-gray-700 border-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card space-y-3">
            <p className="text-xs uppercase font-semibold text-gray-500">Primary service</p>
            <div className="space-y-2 text-sm">
              {SERVICE_OPTIONS.map((option) => (
                <label key={option.label} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="service"
                    checked={filters.serviceType === option.value}
                    onChange={() => updateFilters((prev) => ({ ...prev, serviceType: option.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500">Price per session</p>
              <p className="text-sm text-gray-500">Max ${filters.priceMax}</p>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={10}
              value={filters.priceMax}
              onChange={(event) =>
                updateFilters((prev) => ({ ...prev, priceMax: Number(event.target.value) }))
              }
            />
          </div>

          <div className="card space-y-3">
            <label className="flex items-center space-x-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(event) => updateFilters((prev) => ({ ...prev, verifiedOnly: event.target.checked }))}
              />
              <span>Verified trainers only</span>
            </label>
          </div>

          <div className="card space-y-3">
            <p className="text-xs uppercase font-semibold text-gray-500">Distance</p>
            <div className="space-y-2 text-sm">
              {DISTANCE_OPTIONS.map((option) => {
                const disabled = !filters.suburbId && option.value !== 'greater'
                return (
                  <label key={option.value} className={`flex items-start space-x-2 ${disabled ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="distance"
                      value={option.value}
                      disabled={disabled}
                      checked={filters.distance === option.value}
                      onChange={() => updateFilters((prev) => ({ ...prev, distance: option.value }))}
                    />
                    <span>
                      <span className="block font-semibold text-gray-900">{option.label}</span>
                      <span className="text-gray-500">{option.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="card space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-600" htmlFor="searchTerm">
                  Search trainers, issues, suburbs
                </label>
                <input
                  id="searchTerm"
                  value={filters.searchTerm}
                  onChange={(event) => updateFilters((prev) => ({ ...prev, searchTerm: event.target.value }))}
                  placeholder="Try “Loose Lead Training” or “Leash reactivity”"
                  className="mt-2 w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-600" htmlFor="resultsSuburb">
                  Location (optional)
                </label>
                <input
                  id="resultsSuburb"
                  value={suburbQuery}
                  onChange={(event) => {
                    setSuburbQuery(event.target.value)
                    if (event.target.value.trim().length === 0) handleSuburbClear()
                  }}
                  placeholder="Update location…"
                  className="mt-2 w-full border rounded-md px-3 py-2"
                />
                {suburbSuggestions.length > 0 && (
                  <ul className="border border-gray-200 rounded-md mt-2 bg-white max-h-60 overflow-y-auto divide-y">
                    {suburbSuggestions.map((suburb) => (
                      <li
                        key={suburb.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSuburbSelect(suburb)}
                      >
                        <p className="font-semibold">{suburb.name} ({suburb.postcode})</p>
                        <p className="text-xs text-gray-500">{suburb.council_name} · {suburb.region}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {filters.suburbId && (
                  <button
                    type="button"
                    onClick={handleSuburbClear}
                    className="text-xs text-blue-600 underline mt-1"
                  >
                    Clear location
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Showing {displayedResults.length} of {results.length} trainers{' '}
                {filters.suburbLabel ? `near ${filters.suburbLabel}` : 'across Greater Melbourne'}
              </p>
            </div>
          </div>

          {error && <div className="card text-red-600">{error}</div>}

          {loading && results.length === 0 ? (
            <div className="card text-center text-gray-500 py-10">Fetching trainers…</div>
          ) : displayedResults.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-lg font-semibold text-gray-900 mb-2">No trainers match these filters</p>
              <p className="text-gray-600">Try expanding the distance range or clearing a few filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedResults.map((trainer) => (
                <article key={trainer.business_id} className="card space-y-4">
                  <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-gray-500">
                        {filters.suburbLabel ? `Distance from ${filters.suburbLabel}` : 'Metro coverage'}
                      </p>
                      <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        {trainer.business_name}
                        {trainer.is_featured && (
                          <span className="badge badge-gold flex items-center gap-1">
                            🏆 Featured
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {trainer.suburb_name} · {trainer.council_name}
                      </p>
                      {trainer.distance_km && (
                        <p className="text-sm text-gray-500">{trainer.distance_km.toFixed(1)} km away</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        {trainer.abn_verified && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                        {trainer.featured_until && !trainer.is_featured && (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
                            Featured soon
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        ⭐ {trainer.average_rating?.toFixed(1) ?? 'N/A'} ({trainer.review_count} reviews)
                      </div>
                    </div>
                  </header>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-gray-500 font-semibold">Age specialties</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trainer.age_specialties.map((age) => (
                          <span key={age} className="badge badge-blue">
                            {formatTag(age)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 font-semibold">Issues</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trainer.behavior_issues.slice(0, 4).map((issue) => (
                          <span key={issue} className="badge badge-orange">
                            {formatTag(issue)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 font-semibold">Services</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trainer.services.map((service) => (
                          <span key={service} className="badge badge-purple">
                            {formatTag(service)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {trainer.business_pricing && (
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Pricing snapshot</p>
                      <p>{trainer.business_pricing}</p>
                    </div>
                  )}

                  <div className="text-sm text-gray-700 space-y-1">
                    {trainer.business_phone && (
                      <p>
                        📞{' '}
                        <a href={`tel:${trainer.business_phone}`} className="text-blue-600 underline">
                          {trainer.business_phone}
                        </a>
                      </p>
                    )}
                    {trainer.business_email && (
                      <p>
                        ✉{' '}
                        <a href={`mailto:${trainer.business_email}`} className="text-blue-600 underline">
                          {trainer.business_email}
                        </a>
                      </p>
                    )}
                    {trainer.business_website && (
                      <p>
                        🌐{' '}
                        <a href={trainer.business_website} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          {trainer.business_website}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {trainer.business_phone && (
                      <a href={`tel:${trainer.business_phone}`} className="btn-primary">
                        Call
                      </a>
                    )}
                    {trainer.business_email && (
                      <a href={`mailto:${trainer.business_email}`} className="btn-secondary">
                        Email
                      </a>
                    )}
                    {trainer.business_website && (
                      <a
                        href={trainer.business_website}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline"
                      >
                        Visit website
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => router.push(`/trainer/${trainer.business_id}`)}
                    >
                      View profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {visibleCount < results.length && (
            <div className="text-center">
              <button
                type="button"
                className="btn-outline px-6 py-3"
                onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, results.length))}
              >
                Load more trainers
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
