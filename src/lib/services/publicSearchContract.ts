export type ParsedPublicSearchParams = {
  query: string | null
  lat: number | null
  lng: number | null
  distance: string
  ageSpecialties: string[] | null
  behaviorIssues: string[] | null
  serviceType: string | null
  verifiedOnly: boolean
  rescueOnly: boolean
  priceMax: number | null
  limit: number
  offset: number
}

const parseIntSafe = (value: string | null, fallback: number) => {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseFloatSafe = (value: string | null) => {
  if (!value) return null
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseList = (value: string | null) =>
  value ? value.split(',').filter(Boolean) : null

export const parsePublicSearchParams = (
  searchParams: URLSearchParams
): ParsedPublicSearchParams => {
  const limit = Math.min(parseIntSafe(searchParams.get('limit'), 50), 100)
  const offsetParam = searchParams.get('offset')
  const pageParam = searchParams.get('page')
  const offset = offsetParam !== null
    ? Math.max(parseIntSafe(offsetParam, 0), 0)
    : Math.max(parseIntSafe(pageParam, 1) - 1, 0) * limit

  return {
    query: searchParams.get('query') || searchParams.get('q') || null,
    lat: parseFloatSafe(searchParams.get('lat')),
    lng: parseFloatSafe(searchParams.get('lng')),
    distance: searchParams.get('distance') || 'any',
    ageSpecialties: parseList(searchParams.get('age_specialties')),
    behaviorIssues: parseList(searchParams.get('behavior_issues')),
    serviceType: searchParams.get('service_type') || searchParams.get('service') || null,
    verifiedOnly: searchParams.get('verified_only') === 'true',
    rescueOnly: searchParams.get('rescue_only') === 'true',
    priceMax: parseFloatSafe(searchParams.get('price_max')),
    limit,
    offset
  }
}

export const buildPublicSearchMetadata = (
  total: number,
  params: ParsedPublicSearchParams
) => {
  const hasMore = total === params.limit

  return {
    total,
    limit: params.limit,
    offset: params.offset,
    hasMore,
    has_more: hasMore,
    filters: {
      query: params.query,
      location: params.lat !== null && params.lng !== null
        ? { lat: params.lat, lng: params.lng }
        : null,
      distance: params.distance,
      ageSpecialties: params.ageSpecialties,
      behaviorIssues: params.behaviorIssues,
      serviceType: params.serviceType,
      verifiedOnly: params.verifiedOnly,
      rescueOnly: params.rescueOnly,
      priceMax: params.priceMax
    }
  }
}
