'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  Badge,
  Capsule,
  Card,
  Chip,
  Field,
  Sheet,
  StateCard
} from '@/components/ui/primitives'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import { apiService, type SuburbResult } from '@/lib/api'
import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS
} from '@/lib/constants/taxonomies'
import { parseCanonicalSuburbId } from '@/lib/triageLocation'
import {
  buildOwnerSearchExplanation,
  buildOwnerShortlistComparisonGuidance,
  buildOwnerSearchRefinementSuggestions,
  buildTrainerProfileSearchParams,
  getOwnerSearchContext
} from '@/lib/ownerGuidance'
import {
  getSearchDiscoveryLinks,
  getSearchLandingContent
} from './landing'

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
  const [canonicalSuburbId, setCanonicalSuburbId] = useState<number | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const filterSheetTriggerRef = useRef<HTMLButtonElement | null>(null)
  const filterSheetCloseRef = useRef<HTMLButtonElement | null>(null)
  const wasFilterSheetOpenRef = useRef(false)
  const limit = 20

  const runSearch = useCallback(
    async (
      nextPage: number,
      activeFilters: SearchFilters,
      activeSuburb: SuburbResult | null,
      activeFlowSource: string,
      activeCanonicalSuburbId: number | null
    ) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()

        if (activeFilters.query) params.append('q', activeFilters.query)
        if (activeCanonicalSuburbId !== null) {
          params.append('suburbId', String(activeCanonicalSuburbId))
        }
        if (activeSuburb) {
          params.append('lat', String(activeSuburb.latitude))
          params.append('lng', String(activeSuburb.longitude))
          params.append('suburbName', activeSuburb.name)
          params.append('postcode', activeSuburb.postcode)
          params.append('councilId', String(activeSuburb.council_id))
        } else if (activeCanonicalSuburbId === null && activeFilters.lat && activeFilters.lng) {
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
    [limit]
  )

  const handleSearch = useCallback(
    (nextPage = 1) => {
      return runSearch(nextPage, filters, selectedSuburb, flowSource, canonicalSuburbId)
    },
    [canonicalSuburbId, filters, flowSource, runSearch, selectedSuburb]
  )

  useEffect(() => {
    let isCurrent = true

    const syncSearchState = async () => {
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
      const nextCanonicalSuburbId = parseCanonicalSuburbId(searchParams.get('suburbId'))

      const distanceValues = new Set(['any', '0-5', '5-15', 'greater'])
      let resolvedSuburb: SuburbResult | null = null

      if (nextCanonicalSuburbId !== null) {
        try {
          resolvedSuburb = await apiService.getSuburbById(nextCanonicalSuburbId)
        } catch {
          resolvedSuburb = null
        }
      }

      if (!isCurrent) {
        return
      }

      const nextFilters: SearchFilters = {
        query: queryParam,
        lat: resolvedSuburb
          ? String(resolvedSuburb.latitude)
          : nextCanonicalSuburbId === null
            ? latParam
            : '',
        lng: resolvedSuburb
          ? String(resolvedSuburb.longitude)
          : nextCanonicalSuburbId === null
            ? lngParam
            : '',
        distance: distanceValues.has(distanceParam) ? distanceParam : 'any',
        age_specialties: parseAllowedList(ageParam, ageSpecialtySet),
        behavior_issues: parseAllowedList(behaviorParam, behaviorIssueSet),
        service_type: serviceTypeSet.has(serviceTypeParam) ? serviceTypeParam : '',
        verified_only: verifiedOnlyParam,
        rescue_only: rescueOnlyParam
      }

      setFilters(nextFilters)
      setFlowSource(flowSourceParam)
      setCanonicalSuburbId(nextCanonicalSuburbId)
      setSelectedSuburb(resolvedSuburb)

      const shouldAutoSearch = Boolean(
        queryParam ||
          resolvedSuburb ||
          (nextCanonicalSuburbId === null && latParam && lngParam) ||
          nextFilters.age_specialties.length > 0 ||
          nextFilters.behavior_issues.length > 0 ||
          nextFilters.service_type ||
          nextFilters.verified_only ||
          nextFilters.rescue_only ||
          nextFilters.distance !== 'any'
      )

      if (shouldAutoSearch) {
        runSearch(1, nextFilters, resolvedSuburb, flowSourceParam, nextCanonicalSuburbId)
      } else {
        setHasSearched(false)
      }
    }

    syncSearchState()

    return () => {
      isCurrent = false
    }
  }, [searchParams, runSearch])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSearch(1)
  }

  const handleLoadMore = () => {
    handleSearch(page + 1)
  }

  const handleOpenFilterSheet = () => {
    setIsFilterSheetOpen(true)
  }

  const handleCloseFilterSheet = () => {
    setIsFilterSheetOpen(false)
  }

  const handleApplyFilterSheet = () => {
    handleSearch(1)
    setIsFilterSheetOpen(false)
  }

  const handleBroadenSearch = () => {
    const broadenedFilters: SearchFilters = {
      ...filters,
      distance: 'any'
    }

    setFilters(broadenedFilters)
    runSearch(1, broadenedFilters, selectedSuburb, flowSource, canonicalSuburbId)
  }

  const handleClearRefinements = () => {
    const clearedFilters: SearchFilters = {
      ...filters,
      distance: 'any',
      age_specialties: [],
      behavior_issues: [],
      service_type: '',
      verified_only: false,
      rescue_only: false
    }

    setFilters(clearedFilters)
    runSearch(1, clearedFilters, selectedSuburb, flowSource, canonicalSuburbId)
    setIsFilterSheetOpen(false)
  }

  const handleApplyRefinementSuggestion = (
    patch: Partial<
      Pick<
        SearchFilters,
        'distance' | 'age_specialties' | 'behavior_issues' | 'service_type' | 'verified_only' | 'rescue_only'
      >
    >
  ) => {
    const nextFilters: SearchFilters = {
      ...filters,
      distance: patch.distance ?? filters.distance,
      age_specialties: patch.age_specialties ?? filters.age_specialties,
      behavior_issues: patch.behavior_issues ?? filters.behavior_issues,
      service_type: patch.service_type ?? filters.service_type,
      verified_only: patch.verified_only ?? filters.verified_only,
      rescue_only: patch.rescue_only ?? filters.rescue_only
    }

    setFilters(nextFilters)
    runSearch(1, nextFilters, selectedSuburb, flowSource, canonicalSuburbId)
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
  const landingParams = new URLSearchParams()
  if (filters.query) {
    landingParams.set('q', filters.query)
  }
  if (flowSource) {
    landingParams.set('flow_source', flowSource)
  }
  if (canonicalSuburbId !== null) {
    landingParams.set('suburbId', String(canonicalSuburbId))
  }
  if (selectedSuburb) {
    landingParams.set('suburbName', selectedSuburb.name)
    landingParams.set('postcode', selectedSuburb.postcode)
    landingParams.set('lat', String(selectedSuburb.latitude))
    landingParams.set('lng', String(selectedSuburb.longitude))
    landingParams.set('councilId', String(selectedSuburb.council_id))
  } else if (filters.lat && filters.lng) {
    landingParams.set('lat', filters.lat)
    landingParams.set('lng', filters.lng)
  }
  if (filters.distance !== 'any') {
    landingParams.set('distance', filters.distance)
  }
  if (filters.age_specialties.length > 0) {
    landingParams.set('age_specialties', filters.age_specialties.join(','))
  }
  if (filters.behavior_issues.length > 0) {
    landingParams.set('behavior_issues', filters.behavior_issues.join(','))
  }
  if (filters.service_type) {
    landingParams.set('service_type', filters.service_type)
  }
  if (filters.verified_only) {
    landingParams.set('verified_only', 'true')
  }
  if (filters.rescue_only) {
    landingParams.set('rescue_only', 'true')
  }
  const landingContent = getSearchLandingContent(landingParams)
  const ownerSearchContext = getOwnerSearchContext(landingParams)
  const ownerSearchExplanation = buildOwnerSearchExplanation(ownerSearchContext)
  const discoveryLinks = getSearchDiscoveryLinks(landingParams)
  const trainerProfileParams = buildTrainerProfileSearchParams(landingParams)
  const verifiedResultCount = results.filter((trainer) => trainer.abn_verified).length
  const unverifiedResultCount = results.filter((trainer) => !trainer.abn_verified).length
  const reviewedResultCount = results.filter((trainer) => {
    const rating = Number(trainer.average_rating || 0)
    const reviewCount = Number(trainer.review_count || 0)
    return rating > 0 && reviewCount > 0
  }).length
  const directContactResultCount = results.filter(
    (trainer) => Boolean(trainer.business_phone || trainer.business_email)
  ).length
  const detailedProfileCount = results.filter((trainer) => {
    const listedScopeCount =
      trainer.services.length +
      trainer.age_specialties.length +
      trainer.behavior_issues.length

    return listedScopeCount > 0
  }).length
  const refinementSuggestions = buildOwnerSearchRefinementSuggestions({
    ...ownerSearchContext,
    resultCount: results.length,
    hasMoreResults: hasMore,
    hasSelectedLocation: Boolean(selectedSuburb || (filters.lat && filters.lng) || canonicalSuburbId !== null),
    verifiedResultCount,
    unverifiedResultCount
  })
  const shortlistComparisonGuidance = buildOwnerShortlistComparisonGuidance({
    resultCount: results.length,
    verifiedCount: verifiedResultCount,
    reviewedCount: reviewedResultCount,
    directContactCount: directContactResultCount,
    detailedProfileCount
  })
  const isTriageFlow = flowSource === 'triage'
  const activeServiceLabel = serviceTypeSet.has(filters.service_type)
    ? SERVICE_TYPE_LABELS[filters.service_type as keyof typeof SERVICE_TYPE_LABELS]
    : null
  const activeAgeLabel = filters.age_specialties.length > 0
    ? AGE_SPECIALTY_LABELS[filters.age_specialties[0] as keyof typeof AGE_SPECIALTY_LABELS]
    : null
  const activeBehaviourLabel = filters.behavior_issues.length > 0
    ? BEHAVIOR_ISSUE_LABELS[filters.behavior_issues[0] as keyof typeof BEHAVIOR_ISSUE_LABELS]
    : null
  const resultHeading = hasSearched
    ? `${results.length} ${results.length === 1 ? 'trainer' : 'trainers'} found`
    : 'Ready to compare'
  const locationSummary = selectedSuburb
    ? `${selectedSuburb.name} ${selectedSuburb.postcode}`
    : canonicalSuburbId !== null
      ? 'Saved suburb unavailable'
    : filters.lat && filters.lng
      ? 'Saved location'
      : 'Any suburb'
  const capsuleTags = [
    filters.query ? `"${filters.query}"` : null,
    locationSummary,
    distanceLabels[filters.distance] || distanceLabels.any,
    activeServiceLabel,
    activeAgeLabel,
    activeBehaviourLabel
  ].filter((tag): tag is string => Boolean(tag))

  useEffect(() => {
    if (!isFilterSheetOpen) {
      if (wasFilterSheetOpenRef.current) {
        filterSheetTriggerRef.current?.focus()
        wasFilterSheetOpenRef.current = false
      }
      document.body.style.overflow = ''
      return
    }

    wasFilterSheetOpenRef.current = true
    document.body.style.overflow = 'hidden'

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterSheetOpen(false)
      }
    }

    document.addEventListener('keydown', keyHandler)
    window.setTimeout(() => {
      filterSheetCloseRef.current?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', keyHandler)
    }
  }, [isFilterSheetOpen])

  return (
    <div className="public-page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="shell-surface mb-6 overflow-hidden">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                {landingContent.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {landingContent.heading}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {landingContent.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="primary" className="normal-case tracking-[0.04em]">
                  {resultHeading}
                </Badge>
                <Badge className="normal-case tracking-[0.04em]">
                  {activeFilterCount} active filters
                </Badge>
                <Badge tone="success" className="normal-case tracking-[0.04em]">
                  {distanceLabels[filters.distance] || distanceLabels.any}
                </Badge>
                {selectedSuburb ? (
                  <Badge tone="success" className="normal-case tracking-[0.04em]">
                    {selectedSuburb.name} {selectedSuburb.postcode}
                  </Badge>
                ) : null}
                {activeServiceLabel ? (
                  <Badge tone="warning" className="normal-case tracking-[0.04em]">
                    {activeServiceLabel}
                  </Badge>
                ) : null}
                {activeAgeLabel ? <Chip asSpan tone="info">{activeAgeLabel}</Chip> : null}
                {activeBehaviourLabel ? <Chip asSpan tone="info">{activeBehaviourLabel}</Chip> : null}
              </div>
            </div>

            <Card tone="muted" className="px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">
                {isTriageFlow
                  ? 'From guided triage'
                  : landingContent.hasLandingIntent
                    ? 'Current focus'
                    : 'Need a clearer starting point?'}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isTriageFlow
                  ? `This shortlist started from guided triage, and you can keep refining it here without changing the usual search order.${landingContent.contextLabel ? ` Current focus: ${landingContent.contextLabel}.` : ''}`
                  : landingContent.hasLandingIntent
                  ? `You are already viewing a narrower shortlist.${landingContent.contextLabel ? ` Current focus: ${landingContent.contextLabel}.` : ''}`
                  : 'Use search when you know what to compare. Use triage if you need help narrowing the right type of support first.'}
              </p>
              {isTriageFlow ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Compare two or three profiles first, then open one full profile to confirm fit,
                  credibility, and the best contact path. You can still widen filters or return to
                  triage without changing the usual search order.
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card tone="info" padding="sm" className="rounded-2xl shadow-none">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Already reflected
                  </p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {ownerSearchExplanation.reflected.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card>
                <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Still confirm
                  </p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {ownerSearchExplanation.confirmNext.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {discoveryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface))] px-3 py-2 text-xs font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-accent-primary)/0.4)] hover:text-[hsl(var(--ds-accent-primary))]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Capsule
              title="Current shortlist focus"
              kicker="Intent capsule"
              actions={
                <Button
                  type="button"
                  ref={filterSheetTriggerRef}
                  onClick={handleOpenFilterSheet}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                  aria-haspopup="dialog"
                  aria-expanded={isFilterSheetOpen}
                  aria-controls="search-filter-sheet"
                >
                  More filters ({activeFilterCount})
                </Button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {capsuleTags.slice(0, 6).map((tag) => (
                  <Chip key={tag} asSpan>
                    {tag}
                  </Chip>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <Field label="Search">
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, query: event.target.value }))
                    }
                    placeholder="Search by name, location, or speciality..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Suburb">
                  <div className="mt-2">
                    <SuburbAutocomplete
                      value={selectedSuburb}
                      onChange={(suburb) => {
                        setSelectedSuburb(suburb)
                        setCanonicalSuburbId(suburb?.id ?? null)
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
                </Field>

                <Field label="Distance">
                  <select
                    value={filters.distance}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, distance: event.target.value }))
                    }
                    className="mt-2 min-h-[44px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {distanceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button type="submit" size="lg" loading={loading} className="w-full min-h-[44px]">
                    {loading ? 'Searching...' : 'Update results'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleOpenFilterSheet}
                    variant="outline"
                    size="lg"
                    className="w-full min-h-[44px]"
                  >
                    Edit advanced filters
                  </Button>
                </div>
              </form>
            </Capsule>

            <Card className="p-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href="/triage"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface))] px-3 py-2 font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-accent-primary)/0.4)] hover:text-[hsl(var(--ds-accent-primary))]"
                >
                  Start guided triage
                </Link>
                <Link
                  href="/emergency"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[hsl(var(--ds-accent-warning)/0.35)] bg-[hsl(var(--ds-accent-warning)/0.12)] px-3 py-2 font-semibold text-[hsl(var(--ds-text-primary))] transition-colors hover:border-[hsl(var(--ds-accent-warning)/0.55)]"
                >
                  Emergency support
                </Link>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            {error && (
              <StateCard
                title="Search unavailable right now"
                description={error}
                tone="error"
                align="left"
                actions={
                  <>
                    <Button
                      type="button"
                      onClick={() => handleSearch(1)}
                      className="min-h-[44px]"
                    >
                      Retry current search
                    </Button>
                    <Link
                      href="/triage"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface))] px-5 py-3 text-sm font-semibold text-[hsl(var(--ds-text-primary))] transition-colors hover:border-[hsl(var(--ds-accent-primary)/0.4)] hover:text-[hsl(var(--ds-accent-primary))]"
                    >
                      Start guided triage
                    </Link>
                  </>
                }
              />
            )}

            {!hasSearched && !error && (
              <StateCard
                title="Run a search to build your shortlist"
                description="Start with a suburb, service need, or trainer name, then move straight into a tighter shortlist."
              />
            )}

            {hasSearched && (
              <>
                <Card className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-950">{resultHeading}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {landingContent.resultsDescription}
                      </p>
                    </div>
                    {hasMore && !loading && (
                      <Button onClick={handleLoadMore} variant="outline" className="min-h-[44px]">
                        Load More Results
                      </Button>
                    )}
                  </div>
                </Card>

                {refinementSuggestions.length > 0 && (
                  <Card className="p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Suggested next refinements
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      Nothing changes until you apply one
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      These suggestions use the current shortlist only. Each one explains the exact filter change before you apply it.
                    </p>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {refinementSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} tone="muted" className="p-4">
                          <p className="text-sm font-semibold text-slate-950">{suggestion.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {suggestion.reason}
                          </p>
                          <Card tone="info" padding="sm" className="mt-3 rounded-2xl shadow-none">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                              What will change
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {suggestion.changeSummary}
                            </p>
                          </Card>
                          <Button
                            type="button"
                            onClick={() =>
                              handleApplyRefinementSuggestion({
                                distance: suggestion.patch.distance,
                                age_specialties: suggestion.patch.ageSpecialties,
                                behavior_issues: suggestion.patch.behaviorIssues,
                                service_type: suggestion.patch.serviceType,
                                verified_only: suggestion.patch.verifiedOnly,
                                rescue_only: suggestion.patch.rescueOnly
                              })
                            }
                            variant="outline"
                            className="mt-4 min-h-[44px] w-full"
                          >
                            {suggestion.actionLabel}
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}

                {results.length > 0 && (
                  <Card className="p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Shortlist decision help
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {shortlistComparisonGuidance.summary}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {shortlistComparisonGuidance.nextAction}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {shortlistComparisonGuidance.comparisonPoints.map((point) => (
                        <Card key={point} tone="muted" padding="sm" className="rounded-2xl shadow-none">
                          <p className="text-sm leading-6 text-slate-700">{point}</p>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}

                {results.length === 0 && !loading && (
                  <StateCard
                    title="No trainers matched this search"
                    description="Try a wider distance, remove one filter, or choose another suburb to see more options."
                    actions={
                      <>
                        <Chip asSpan>Broaden distance</Chip>
                        <Chip asSpan>Remove one filter</Chip>
                        <Chip asSpan>Try another suburb</Chip>
                        {filters.distance !== 'any' ? (
                          <Button onClick={handleBroadenSearch} variant="outline" className="min-h-[44px]">
                            Search all distances
                          </Button>
                        ) : null}
                        <Button onClick={handleClearRefinements} variant="outline" className="min-h-[44px]">
                          Clear extra filters
                        </Button>
                        <Link
                          href="/triage"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                          Start guided search
                        </Link>
                      </>
                    }
                  />
                )}

                {results.length > 0 && (
                  <div className="space-y-4">
                    {results.map((trainer) => {
                      const rating = Number(trainer.average_rating || 0)
                      const reviewCount = Number(trainer.review_count || 0)
                      const hasPublicReviews = rating > 0 && reviewCount > 0
                      const directContactCount = [
                        trainer.business_phone,
                        trainer.business_email
                      ].filter(Boolean).length
                      const listedScopeCount =
                        trainer.services.length +
                        trainer.age_specialties.length +
                        trainer.behavior_issues.length
                      const trainerQueryString = trainerProfileParams.toString()
                      const trainerHref = trainerQueryString
                        ? `/trainers/${trainer.business_id}?${trainerQueryString}`
                        : `/trainers/${trainer.business_id}`

                      return (
                        <Card key={trainer.business_id} className="p-6">
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-2xl font-bold text-slate-950">
                                  {trainer.business_name}
                                </h3>
                                {trainer.abn_verified && (
                                  <Badge tone="success">
                                    Verified
                                  </Badge>
                                )}
                                {trainer.verification_status === 'approved' && (
                                  <Badge tone="primary">
                                    Approved profile
                                  </Badge>
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
                                <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Verification
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-950">
                                    {trainer.abn_verified ? 'ABN verified' : 'ABN not verified'}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {formatVerificationStatus(trainer.verification_status)}
                                  </p>
                                </Card>

                                <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
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
                                </Card>

                                <Card tone="muted" padding="sm" className="rounded-2xl shadow-none">
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
                                </Card>
                              </div>

                              {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Age fit ({trainer.age_specialties.length})
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {trainer.age_specialties.slice(0, 4).map((value) => (
                                      <Chip key={value} asSpan>
                                        {formatLabel(value)}
                                      </Chip>
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

                            <Card tone="muted" className="w-full xl:w-[260px]">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Best next step
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                Open the full profile to confirm the fastest contact option,
                                pricing, and the full credibility breakdown before you reach out.
                              </p>
                              <Card tone="info" padding="sm" className="mt-4 rounded-2xl shadow-none">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                                  What happens next
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-700">
                                  {directContactCount > 0
                                    ? `${directContactCount} direct contact ${
                                        directContactCount === 1 ? 'option is' : 'options are'
                                      } already listed on the profile.`
                                    : 'The profile shows the clearest available contact path for this listing.'}
                                </p>
                              </Card>
                              <Link
                                href={trainerHref}
                                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                              >
                                View Profile
                              </Link>
                              <p className="mt-3 text-xs leading-5 text-slate-500">
                                Most buyers review the profile, then contact the trainer directly.
                              </p>
                            </Card>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {loading && page > 1 && (
                  <StateCard
                    title="Loading more results"
                    description="Fetching additional trainers for this shortlist."
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div
          className={`fixed inset-0 z-50 transition-opacity duration-200 ${
            isFilterSheetOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!isFilterSheetOpen}
        >
          <div
            className="absolute inset-0 bg-slate-950/45"
            onClick={handleCloseFilterSheet}
          />
          <Sheet
            id="search-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Advanced search filters"
            open={isFilterSheetOpen}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Filter sheet
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">Advanced shortlist filters</h3>
              </div>
              <button
                ref={filterSheetCloseRef}
                type="button"
                onClick={handleCloseFilterSheet}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Use these filters to narrow fit after setting your main suburb, query, and distance.
            </p>

            <div className="mt-5 space-y-5">
              <Field label="Age specialities">
                <div className="mt-3 flex flex-wrap gap-2">
                  {ageSpecialtyOptions.map((option) => {
                    const selected = filters.age_specialties.includes(option.value)
                    return (
                      <Chip
                        key={option.value}
                        onClick={() => toggleArrayFilter('age_specialties', option.value)}
                        tone="neutral"
                        selected={selected}
                      >
                        {option.label}
                      </Chip>
                    )
                  })}
                </div>
              </Field>

              <Field label="Behaviour issues">
                <div className="mt-3 flex flex-wrap gap-2">
                  {behaviorIssueOptions.map((option) => {
                    const selected = filters.behavior_issues.includes(option.value)
                    return (
                      <Chip
                        key={option.value}
                        onClick={() => toggleArrayFilter('behavior_issues', option.value)}
                        tone="info"
                        selected={selected}
                      >
                        {option.label}
                      </Chip>
                    )
                  })}
                </div>
              </Field>

              <Field label="Service type">
                <select
                  value={filters.service_type}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, service_type: event.target.value }))
                  }
                  className="mt-2 min-h-[44px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">All services</option>
                  {serviceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="space-y-2">
                <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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
                <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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
            </div>

            <div className="sticky bottom-0 mt-6 border-t border-slate-200 bg-white py-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleApplyFilterSheet} className="min-h-[44px] flex-1 min-w-[180px]">
                  Apply filters
                </Button>
                <Button
                  onClick={handleClearRefinements}
                  variant="outline"
                  className="min-h-[44px] flex-1 min-w-[180px]"
                >
                  Clear extra filters
                </Button>
              </div>
            </div>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
