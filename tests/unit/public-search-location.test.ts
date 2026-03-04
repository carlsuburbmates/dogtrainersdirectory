import { describe, expect, it } from 'vitest'
import { resolvePublicSearchLocation } from '@/lib/services/publicSearchLocation'

describe('public search location authority', () => {
  it('prefers canonical suburb coordinates over conflicting snapshot values', () => {
    const result = resolvePublicSearchLocation({
      suburbId: 5,
      lat: -10,
      lng: 10,
      canonicalSuburb: {
        latitude: -37.812,
        longitude: 144.963,
      },
    })

    expect(result).toEqual({
      lat: -37.812,
      lng: 144.963,
      source: 'canonical',
    })
  })

  it('preserves snapshot coordinates when no canonical suburb id is present', () => {
    const result = resolvePublicSearchLocation({
      suburbId: null,
      lat: -37.81,
      lng: 144.96,
      canonicalSuburb: null,
    })

    expect(result).toEqual({
      lat: -37.81,
      lng: 144.96,
      source: 'snapshot',
    })
  })

  it('drops back to a non-authoritative no-location search when suburb id is unresolvable', () => {
    const result = resolvePublicSearchLocation({
      suburbId: 999,
      lat: -37.81,
      lng: 144.96,
      canonicalSuburb: null,
    })

    expect(result).toEqual({
      lat: null,
      lng: null,
      source: 'none',
    })
  })
})
