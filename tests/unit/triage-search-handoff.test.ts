import { describe, expect, it } from 'vitest'
import {
  buildTriageSearchHandoffParams,
  buildTriageSearchHandoffPreview,
  getTriageSearchHandoffGuardrailNote
} from '@/lib/triageSearchHandoff'

describe('triage search handoff', () => {
  it('builds the canonical deterministic /triage -> /search params', () => {
    const params = buildTriageSearchHandoffParams({
      age: 'adult_18m_7y',
      issues: ['separation_anxiety', 'leash_reactivity'],
      radius: 15,
      suburb: {
        id: 42,
        name: 'Carlton',
        postcode: '3053',
        council_id: 7,
        latitude: -37.8005,
        longitude: 144.9666
      }
    })

    expect(params.toString()).toBe(
      'age_specialties=adult_18m_7y&behavior_issues=separation_anxiety%2Cleash_reactivity&distance=5-15&lat=-37.8005&lng=144.9666&suburbId=42&suburbName=Carlton&postcode=3053&councilId=7&flow_source=triage'
    )
  })

  it('summarises the starting shortlist without changing route truth', () => {
    const preview = buildTriageSearchHandoffPreview({
      age: 'adult_18m_7y',
      issues: ['separation_anxiety', 'leash_reactivity'],
      radius: 15,
      suburb: {
        id: 42,
        name: 'Carlton',
        postcode: '3053',
        council_id: 7,
        latitude: -37.8005,
        longitude: 144.9666
      }
    })

    expect(preview).toContain('Carlton within 15 km')
    expect(preview).toContain('Adult (18 months–7 years)')
    expect(preview).toContain('Separation anxiety and Leash reactivity')
    expect(getTriageSearchHandoffGuardrailNote()).toContain('usual search route and ranking')
  })
})
