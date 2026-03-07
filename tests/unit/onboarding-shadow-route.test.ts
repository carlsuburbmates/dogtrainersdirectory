import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  from: vi.fn(),
  encryptValue: vi.fn(),
  recordAbnFallbackEvent: vi.fn(),
  recordLatencyMetric: vi.fn(),
  generateLLMResponse: vi.fn(),
  abrIsValidAbn: vi.fn(),
  abrFetchAbrJson: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: mocks.createUser
      }
    },
    from: mocks.from
  }
}))

vi.mock('@/lib/encryption', () => ({
  encryptValue: mocks.encryptValue
}))

vi.mock('@/lib/abnFallback', () => ({
  recordAbnFallbackEvent: mocks.recordAbnFallbackEvent
}))

vi.mock('@/lib/telemetryLatency', () => ({
  recordLatencyMetric: mocks.recordLatencyMetric
}))

vi.mock('@/lib/llm', () => ({
  generateLLMResponse: mocks.generateLLMResponse
}))

vi.mock('@/lib/abr', () => ({
  default: {
    isValidAbn: mocks.abrIsValidAbn,
    fetchAbrJson: mocks.abrFetchAbrJson
  }
}))

import { POST } from '@/app/api/onboarding/route'

describe('onboarding shadow assistance', () => {
  beforeEach(() => {
    mocks.createUser.mockReset()
    mocks.from.mockReset()
    mocks.encryptValue.mockReset()
    mocks.recordAbnFallbackEvent.mockReset()
    mocks.recordLatencyMetric.mockReset()
    mocks.generateLLMResponse.mockReset()
    mocks.abrIsValidAbn.mockReset()
    mocks.abrFetchAbrJson.mockReset()

    process.env.AI_GLOBAL_MODE = 'live'
  })

  it('records a shadow onboarding advisory trace without changing the visible onboarding outcome', async () => {
    mocks.createUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })
    mocks.encryptValue.mockImplementation(async (value: string) => `enc:${value}`)
    mocks.abrIsValidAbn.mockReturnValue(true)
    mocks.abrFetchAbrJson.mockResolvedValue({
      status: 200,
      body: '{"ok":true}',
      parsed: {
        Response: {
          ResponseBody: {
            ABNStatus: 'Active'
          }
        }
      }
    })
    mocks.generateLLMResponse.mockResolvedValue({
      provider: 'zai',
      model: 'glm-4.6',
      text: JSON.stringify({
        summary: 'Clarify the bio and add stronger trust signals about services offered.',
        suggestedImprovements: ['Expand the bio', 'Add public pricing guidance'],
        trustSignals: ['Website provided', 'Age specialties selected']
      })
    })

    const genericInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const businessSingle = vi.fn().mockResolvedValue({
      data: { id: 12 },
      error: null
    })
    const businessSelect = vi.fn().mockReturnValue({ single: businessSingle })
    const businessInsert = vi.fn().mockReturnValue({ select: businessSelect })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return { insert: businessInsert }
      }

      return { insert: genericInsert }
    })

    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'trainer@example.com',
        password: 'password123',
        fullName: 'Taylor Trainer',
        businessName: 'Paws Academy',
        businessPhone: '0400000000',
        businessEmail: 'hello@paws.example',
        website: 'https://paws.example',
        address: '123 Example Street',
        suburbId: 101,
        bio: 'Reward-based training for family dogs.',
        pricing: 'From $120',
        ages: ['adult_18m_7y'],
        issues: ['separation_anxiety'],
        primaryService: 'private_training',
        secondaryServices: ['group_classes'],
        abn: '12345678901'
      })
    })

    const response = await POST(request as any)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      trainer_id: 'user-1',
      business_id: 12,
      abn_status: 'verified'
    })
    expect(payload).not.toHaveProperty('onboardingShadowAssistance')

    expect(mocks.recordLatencyMetric).toHaveBeenCalledOnce()
    const latencyPayload = mocks.recordLatencyMetric.mock.calls[0][0]
    expect(latencyPayload).toMatchObject({
      area: 'onboarding_api',
      route: '/api/onboarding',
      success: true,
      statusCode: 200,
      metadata: {
        businessId: 12,
        abnStatus: 'verified',
        onboardingAiProvider: 'zai',
        onboardingAiModel: 'glm-4.6',
        onboardingAiPromptVersion: 'onboarding-shadow-v1',
        onboardingShadowAssistance: {
          aiAutomationAudit: {
            workflowFamily: 'onboarding',
            actorClass: 'business',
            effectiveMode: 'shadow',
            approvalState: 'not_required',
            resultState: 'result',
            decisionSource: 'llm',
            routeOrJob: '/api/onboarding',
            summary:
              'Shadow onboarding assistance recorded while submission, publication, verification, and billing outcomes remained deterministic.'
          },
          advisoryCandidate: {
            summary:
              'Clarify the bio and add stronger trust signals about services offered.',
            suggestedImprovements: ['Expand the bio', 'Add public pricing guidance'],
            trustSignals: ['Website provided', 'Age specialties selected']
          },
          visibleOutcome: {
            submissionPayloadChanged: false,
            publicationOutcomeChanged: false,
            verificationOutcomeChanged: false,
            monetizationOutcomeChanged: false,
            featuredStateChanged: false,
            spotlightStateChanged: false
          }
        }
      }
    })
  })
})
