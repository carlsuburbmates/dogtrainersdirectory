import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  saveOwnedBusinessProfile: vi.fn(),
  recordLatencyMetric: vi.fn(),
  runBusinessListingQualityShadow: vi.fn(),
  buildBusinessListingQualityShadowTrace: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser
}))

vi.mock('@/lib/businessProfileManagement', async () => {
  const actual = await vi.importActual<typeof import('@/lib/businessProfileManagement')>(
    '@/lib/businessProfileManagement'
  )

  return {
    ...actual,
    saveOwnedBusinessProfile: mocks.saveOwnedBusinessProfile
  }
})

vi.mock('@/lib/telemetryLatency', () => ({
  recordLatencyMetric: mocks.recordLatencyMetric
}))

vi.mock('@/lib/businessListingQualityShadow', async () => {
  const actual = await vi.importActual<typeof import('@/lib/businessListingQualityShadow')>(
    '@/lib/businessListingQualityShadow'
  )

  return {
    ...actual,
    runBusinessListingQualityShadow: mocks.runBusinessListingQualityShadow,
    buildBusinessListingQualityShadowTrace: mocks.buildBusinessListingQualityShadowTrace
  }
})

import { PATCH } from '@/app/api/account/business/[businessId]/route'

const updatedProfile = {
  businessId: 15,
  businessName: 'Paws Academy',
  businessPhone: '0400000000',
  businessEmail: 'hello@paws.example',
  website: 'https://paws.example',
  address: '123 Example Street',
  suburbName: 'Richmond',
  suburbPostcode: '3121',
  bio: 'Reward-based training for family dogs with practical weekly support at home.',
  pricing: 'From $120',
  verificationStatus: 'pending',
  abnVerified: false,
  featuredUntil: null,
  isActive: true,
  updatedAt: '2026-03-10T12:00:00.000Z',
  primaryService: 'private_training',
  secondaryServices: ['group_classes'],
  ages: ['adult_18m_7y'],
  issues: ['separation_anxiety'],
  completeness: {
    score: 90,
    completedChecks: 9,
    totalChecks: 10,
    summary: 'Strong baseline',
    missingItems: ['pricing guidance'],
    completedItems: []
  }
}

describe('account business profile route', () => {
  beforeEach(() => {
    mocks.getAuthenticatedUser.mockReset()
    mocks.saveOwnedBusinessProfile.mockReset()
    mocks.recordLatencyMetric.mockReset()
    mocks.runBusinessListingQualityShadow.mockReset()
    mocks.buildBusinessListingQualityShadowTrace.mockReset()
    process.env.AI_GLOBAL_MODE = 'live'
  })

  it('returns 401 when the business actor is not signed in', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null)

    const response = await PATCH(
      new Request('http://localhost/api/account/business/15', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      }),
      { params: Promise.resolve({ businessId: '15' }) }
    )

    expect(response.status).toBe(401)
    expect(mocks.recordLatencyMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        area: 'business_profile_api',
        route: '/api/account/business/[businessId]',
        success: false,
        statusCode: 401,
        metadata: { reason: 'unauthenticated' }
      })
    )
  })

  it('returns 404 when the requested business is not owned by the signed-in actor', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue('user-1')
    mocks.saveOwnedBusinessProfile.mockResolvedValue(null)

    const response = await PATCH(
      new Request('http://localhost/api/account/business/15', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Paws Academy',
          primaryService: 'private_training',
          ages: ['adult_18m_7y'],
          issues: []
        })
      }),
      { params: Promise.resolve({ businessId: '15' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.saveOwnedBusinessProfile).toHaveBeenCalledWith(
      'user-1',
      15,
      expect.objectContaining({ businessName: 'Paws Academy' })
    )
  })

  it('rejects forbidden out-of-scope fields before saving', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue('user-1')

    const response = await PATCH(
      new Request('http://localhost/api/account/business/15', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Paws Academy',
          primaryService: 'private_training',
          ages: ['adult_18m_7y'],
          verification_status: 'verified'
        })
      }),
      { params: Promise.resolve({ businessId: '15' }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.fields).toContain('verification_status')
    expect(mocks.saveOwnedBusinessProfile).not.toHaveBeenCalled()
  })

  it('records a shadow trace without changing the visible business profile response', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue('user-1')
    mocks.saveOwnedBusinessProfile.mockResolvedValue(updatedProfile)
    mocks.runBusinessListingQualityShadow.mockResolvedValue({
      candidate: {
        summary: 'Clarify pricing and add broader service detail.',
        suggestedImprovements: ['Clarify pricing'],
        trustSignals: ['Website provided']
      },
      decisionSource: 'llm',
      provider: 'zai',
      model: 'glm-4.6',
      resultState: 'result',
      errorMessage: null
    })
    mocks.buildBusinessListingQualityShadowTrace.mockReturnValue({
      aiAutomationAudit: {
        workflowFamily: 'business_listing_quality',
        actorClass: 'business',
        effectiveMode: 'shadow',
        resultState: 'result'
      },
      deterministicCompleteness: updatedProfile.completeness,
      visibleOutcome: {
        profileFieldsSaved: true,
        publicationOutcomeChanged: false,
        verificationOutcomeChanged: false,
        featuredStateChanged: false,
        spotlightStateChanged: false,
        monetizationOutcomeChanged: false,
        rankingOutcomeChanged: false
      }
    })

    const response = await PATCH(
      new Request('http://localhost/api/account/business/15', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Paws Academy',
          businessPhone: '0400000000',
          businessEmail: 'hello@paws.example',
          website: 'https://paws.example',
          address: '123 Example Street',
          bio: updatedProfile.bio,
          pricing: 'From $120',
          primaryService: 'private_training',
          secondaryServices: ['group_classes'],
          ages: ['adult_18m_7y'],
          issues: ['separation_anxiety']
        })
      }),
      { params: Promise.resolve({ businessId: '15' }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      profile: updatedProfile
    })
    expect(payload).not.toHaveProperty('businessListingQualityShadow')

    expect(mocks.recordLatencyMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        area: 'business_profile_api',
        route: '/api/account/business/[businessId]',
        success: true,
        statusCode: 200,
        metadata: expect.objectContaining({
          businessId: 15,
          profileCompletenessScore: 90,
          businessListingQualityShadow: expect.objectContaining({
            aiAutomationAudit: expect.objectContaining({
              workflowFamily: 'business_listing_quality',
              actorClass: 'business',
              effectiveMode: 'shadow',
              resultState: 'result'
            })
          })
        })
      })
    )
  })
})
