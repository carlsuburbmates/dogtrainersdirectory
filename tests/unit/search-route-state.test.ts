import { describe, expect, it } from 'vitest'
import {
  buildSearchRouteHref,
  buildSearchRouteParams,
  hasSearchRouteCriteria,
  type SearchRouteFilters
} from '@/app/search/searchRouteState'

const baseFilters: SearchRouteFilters = {
  query: 'calm trainer',
  lat: '',
  lng: '',
  distance: '5-15',
  age_specialties: ['adult_18m_7y'],
  behavior_issues: ['leash_reactivity'],
  service_type: 'private_training',
  verified_only: true,
  rescue_only: false
}

describe('search route state helpers', () => {
  it('builds canonical search params from the visible shortlist state', () => {
    const params = buildSearchRouteParams({
      filters: baseFilters,
      selectedSuburb: {
        id: 42,
        name: 'Carlton',
        postcode: '3053',
        latitude: -37.8005,
        longitude: 144.9666,
        council_id: 7
      },
      flowSource: 'triage',
      canonicalSuburbId: 42
    })

    expect(params.toString()).toBe(
      'q=calm+trainer&suburbId=42&lat=-37.8005&lng=144.9666&suburbName=Carlton&postcode=3053&councilId=7&distance=5-15&age_specialties=adult_18m_7y&behavior_issues=leash_reactivity&service_type=private_training&verified_only=true&flow_source=triage'
    )
    expect(buildSearchRouteHref({
      filters: baseFilters,
      selectedSuburb: {
        id: 42,
        name: 'Carlton',
        postcode: '3053',
        latitude: -37.8005,
        longitude: 144.9666,
        council_id: 7
      },
      flowSource: 'triage',
      canonicalSuburbId: 42
    })).toBe(
      '/search?q=calm+trainer&suburbId=42&lat=-37.8005&lng=144.9666&suburbName=Carlton&postcode=3053&councilId=7&distance=5-15&age_specialties=adult_18m_7y&behavior_issues=leash_reactivity&service_type=private_training&verified_only=true&flow_source=triage'
    )
  })

  it('detects whether the route still carries visible shortlist criteria', () => {
    expect(
      hasSearchRouteCriteria({
        filters: {
          ...baseFilters,
          query: '',
          distance: 'any',
          age_specialties: [],
          behavior_issues: [],
          service_type: '',
          verified_only: false
        },
        selectedSuburb: null,
        canonicalSuburbId: null
      })
    ).toBe(false)

    expect(
      hasSearchRouteCriteria({
        filters: {
          ...baseFilters,
          query: '',
          distance: 'any',
          age_specialties: [],
          behavior_issues: [],
          service_type: '',
          verified_only: false
        },
        selectedSuburb: null,
        canonicalSuburbId: 42
      })
    ).toBe(true)
  })
})
