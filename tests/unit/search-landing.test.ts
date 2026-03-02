import { describe, expect, it } from 'vitest'
import { getSearchLandingContent } from '@/app/search/landing'
import {
  generateResultsStructuredData,
  generateSearchMetadata
} from '@/app/search/metadata'

describe('search landing helpers', () => {
  it('builds metadata from real suburb and service params', () => {
    const params = new URLSearchParams({
      suburbName: 'Richmond',
      service_type: 'private_training',
      age_specialties: 'puppies_0_6m',
      behavior_issues: 'separation_anxiety'
    })

    const landing = getSearchLandingContent(params)
    const metadata = generateSearchMetadata(params)

    expect(landing.heading).toContain('Richmond')
    expect(landing.heading).toContain('Private training')
    expect(String(metadata.title)).toContain('Richmond')
    expect(String(metadata.title)).toContain('Private training')
    expect(String(metadata.description)).toContain('Richmond')
    expect(String(metadata.description)).not.toContain('price')
  })

  it('removes placeholder offer pricing from structured data', () => {
    const params = new URLSearchParams({
      suburbName: 'Richmond',
      service_type: 'private_training'
    })

    const structuredData = generateResultsStructuredData(params)
    const serialised = JSON.stringify(structuredData)

    expect(structuredData['@type']).toBe('CollectionPage')
    expect(serialised).not.toContain('"price"')
    expect(serialised).not.toContain('lowPrice')
    expect(serialised).not.toContain('highPrice')
    expect(serialised).toContain('Richmond')
  })
})
