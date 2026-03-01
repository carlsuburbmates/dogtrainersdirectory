import { describe, expect, it } from 'vitest'
import {
  buildPublicSearchMetadata,
  parsePublicSearchParams
} from '@/lib/services/publicSearchContract'

describe('public search contract helpers', () => {
  it('accepts q/service/page aliases when offset is absent', () => {
    const params = parsePublicSearchParams(
      new URLSearchParams({
        q: 'calm',
        service: 'private_training',
        page: '3',
        limit: '20',
        age_specialties: 'puppies_0_6m,rescue_dogs',
        behavior_issues: 'socialisation,resource_guarding'
      })
    )

    expect(params).toMatchObject({
      query: 'calm',
      serviceType: 'private_training',
      limit: 20,
      offset: 40,
      ageSpecialties: ['puppies_0_6m', 'rescue_dogs'],
      behaviorIssues: ['socialisation', 'resource_guarding']
    })
  })

  it('prefers explicit query and offset over q and page aliases', () => {
    const params = parsePublicSearchParams(
      new URLSearchParams({
        query: 'verified',
        q: 'ignored',
        offset: '15',
        page: '9',
        limit: '10'
      })
    )

    expect(params.query).toBe('verified')
    expect(params.offset).toBe(15)
  })

  it('returns dual metadata flags for compatibility', () => {
    const params = parsePublicSearchParams(
      new URLSearchParams({
        q: 'steady',
        page: '2',
        limit: '5'
      })
    )

    const metadata = buildPublicSearchMetadata(5, params)

    expect(metadata).toMatchObject({
      total: 5,
      limit: 5,
      offset: 5,
      hasMore: true,
      has_more: true,
      filters: {
        query: 'steady'
      }
    })
  })
})
