import type { SuburbResult } from '@/lib/api'

export type SearchRouteFilters = {
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

export type SearchRouteState = {
  filters: SearchRouteFilters
  selectedSuburb: SuburbResult | null
  flowSource: string
  canonicalSuburbId: number | null
}

export function buildSearchRouteParams({
  filters,
  selectedSuburb,
  flowSource,
  canonicalSuburbId
}: SearchRouteState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.query) params.append('q', filters.query)
  if (canonicalSuburbId !== null) {
    params.append('suburbId', String(canonicalSuburbId))
  }

  if (selectedSuburb) {
    params.append('lat', String(selectedSuburb.latitude))
    params.append('lng', String(selectedSuburb.longitude))
    params.append('suburbName', selectedSuburb.name)
    params.append('postcode', selectedSuburb.postcode)
    params.append('councilId', String(selectedSuburb.council_id))
  } else if (canonicalSuburbId === null && filters.lat && filters.lng) {
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
  if (flowSource) params.append('flow_source', flowSource)

  return params
}

export function buildSearchRouteHref(state: SearchRouteState, pathname = '/search') {
  const queryString = buildSearchRouteParams(state).toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export function hasSearchRouteCriteria({
  filters,
  selectedSuburb,
  canonicalSuburbId
}: Pick<SearchRouteState, 'filters' | 'selectedSuburb' | 'canonicalSuburbId'>) {
  return Boolean(
    filters.query ||
      selectedSuburb ||
      canonicalSuburbId !== null ||
      (canonicalSuburbId === null && filters.lat && filters.lng) ||
      filters.age_specialties.length > 0 ||
      filters.behavior_issues.length > 0 ||
      filters.service_type ||
      filters.verified_only ||
      filters.rescue_only ||
      filters.distance !== 'any'
  )
}
