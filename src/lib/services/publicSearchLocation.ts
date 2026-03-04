export type PublicSearchLocationResolution = {
  lat: number | null
  lng: number | null
  source: 'canonical' | 'snapshot' | 'none'
}

type ResolvePublicSearchLocationArgs = {
  suburbId: number | null
  lat: number | null
  lng: number | null
  canonicalSuburb:
    | {
        latitude: number | null
        longitude: number | null
      }
    | null
}

export function resolvePublicSearchLocation({
  suburbId,
  lat,
  lng,
  canonicalSuburb,
}: ResolvePublicSearchLocationArgs): PublicSearchLocationResolution {
  if (suburbId !== null) {
    if (
      canonicalSuburb &&
      typeof canonicalSuburb.latitude === 'number' &&
      Number.isFinite(canonicalSuburb.latitude) &&
      typeof canonicalSuburb.longitude === 'number' &&
      Number.isFinite(canonicalSuburb.longitude)
    ) {
      return {
        lat: canonicalSuburb.latitude,
        lng: canonicalSuburb.longitude,
        source: 'canonical',
      }
    }

    return {
      lat: null,
      lng: null,
      source: 'none',
    }
  }

  if (lat !== null && lng !== null) {
    return {
      lat,
      lng,
      source: 'snapshot',
    }
  }

  return {
    lat: null,
    lng: null,
    source: 'none',
  }
}
