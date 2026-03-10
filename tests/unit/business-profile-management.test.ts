import { describe, expect, it } from 'vitest'
import {
  evaluateBusinessProfileCompleteness,
  parseBusinessProfileUpdatePayload,
  type OwnedBusinessProfile
} from '@/lib/businessProfileManagement'
import { buildBusinessListingQualityShadowTrace } from '@/lib/businessListingQualityShadow'

const baseProfile: OwnedBusinessProfile = {
  businessId: 21,
  businessName: 'Calm Lead Dogs',
  businessPhone: '0400123456',
  businessEmail: 'hello@calmlead.example',
  website: 'https://calmlead.example',
  address: '1 Example Street',
  suburbName: 'Richmond',
  suburbPostcode: '3121',
  bio: 'Reward-based private training for family dogs with clear plans and realistic at-home support.',
  pricing: 'From $140',
  verificationStatus: 'pending',
  abnVerified: false,
  featuredUntil: null,
  isActive: true,
  updatedAt: '2026-03-10T10:00:00.000Z',
  primaryService: 'private_training',
  secondaryServices: ['group_classes'],
  ages: ['adult_18m_7y'],
  issues: ['separation_anxiety'],
  completeness: {
    score: 100,
    completedChecks: 10,
    totalChecks: 10,
    summary: 'complete',
    missingItems: [],
    completedItems: []
  }
}

describe('business profile management helpers', () => {
  it('rejects forbidden business profile fields', () => {
    const result = parseBusinessProfileUpdatePayload({
      businessName: 'Calm Lead Dogs',
      primaryService: 'private_training',
      ages: ['adult_18m_7y'],
      verification_status: 'verified'
    })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('forbidden_fields')
    expect(result.error.fields).toContain('verification_status')
  })

  it('evaluates deterministic completeness from the saved owned profile', () => {
    const completeness = evaluateBusinessProfileCompleteness({
      ...baseProfile,
      businessPhone: '',
      website: '',
      pricing: '',
      issues: []
    })

    expect(completeness.score).toBe(60)
    expect(completeness.completedChecks).toBe(6)
    expect(completeness.totalChecks).toBe(10)
    expect(completeness.missingItems).toEqual([
      'public phone',
      'website',
      'pricing guidance',
      'behaviour issues'
    ])
  })

  it('builds a shadow-only business listing-quality trace without protected outcome changes', () => {
    const trace = buildBusinessListingQualityShadowTrace({
      profile: baseProfile,
      resultState: 'result',
      decisionSource: 'llm',
      errorMessage: null,
      candidate: {
        summary: 'Add clearer pricing guidance and broaden the bio.',
        suggestedImprovements: ['Clarify pricing', 'Expand the bio'],
        trustSignals: ['Website provided']
      }
    })

    expect(trace.aiAutomationAudit).toMatchObject({
      workflowFamily: 'business_listing_quality',
      actorClass: 'business',
      effectiveMode: 'shadow',
      resultState: 'result',
      routeOrJob: '/account/business/21'
    })
    expect(trace.deterministicCompleteness.score).toBe(100)
    expect(trace.visibleOutcome).toEqual({
      profileFieldsSaved: true,
      publicationOutcomeChanged: false,
      verificationOutcomeChanged: false,
      featuredStateChanged: false,
      spotlightStateChanged: false,
      monetizationOutcomeChanged: false,
      rankingOutcomeChanged: false
    })
  })
})
