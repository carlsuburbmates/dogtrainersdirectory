import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  generateLLMResponse: vi.fn(),
  recordLatencyMetric: vi.fn(),
  recordCommercialFunnelMetric: vi.fn(),
  detectMedicalEmergency: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

vi.mock('@/lib/llm', () => ({
  generateLLMResponse: mocks.generateLLMResponse
}))

vi.mock('@/lib/telemetryLatency', () => ({
  recordLatencyMetric: mocks.recordLatencyMetric,
  recordCommercialFunnelMetric: mocks.recordCommercialFunnelMetric
}))

vi.mock('@/lib/medicalDetector', () => ({
  detectMedicalEmergency: mocks.detectMedicalEmergency
}))

import { POST } from '@/app/api/emergency/triage/route'

describe('emergency triage owner search handoff shadow mode', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.generateLLMResponse.mockReset()
    mocks.recordLatencyMetric.mockReset()
    mocks.recordCommercialFunnelMetric.mockReset()
    mocks.detectMedicalEmergency.mockReset()
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.TRIAGE_AI_MODE = 'shadow'
  })

  it('records an owner handoff advisory trace without changing the visible deterministic outcome', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'triage-1' },
      error: null
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })

    mocks.from.mockReturnValue({ insert })
    mocks.generateLLMResponse.mockResolvedValue({
      provider: 'zai',
      model: 'glm-4.6',
      text: JSON.stringify({
        classification: 'normal',
        priority: 'low',
        followUpActions: ['Monitor situation'],
        searchAdvisory: {
          summary: 'Look for trainers experienced with separation anxiety and lead reactivity.',
          suggestedSearchTerms: ['separation anxiety', 'lead reactivity'],
          focusAreas: ['adult dogs', 'behaviour support']
        }
      })
    })

    const request = new Request('http://localhost/api/emergency/triage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        situation: 'Dog gets stressed when separated from the family and pulls hard on walks',
        location: 'Carlton 3053',
        age: 'adult_1_3y',
        issues: ['separation_anxiety', 'reactivity_on_leash']
      })
    })

    const response = await POST(request as any)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.triage).toMatchObject({
      classification: 'normal',
      priority: 'low',
      decisionSource: 'deterministic',
      effectiveMode: 'shadow',
      triageId: 'triage-1'
    })
    expect(payload.triage).not.toHaveProperty('searchAdvisory')

    expect(insert).toHaveBeenCalledOnce()
    const insertPayload = insert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      decision_source: 'deterministic',
      ai_mode: 'shadow',
      metadata: {
        aiAutomationAudit: {
          workflowFamily: 'triage',
          effectiveMode: 'shadow',
          decisionSource: 'llm'
        },
        ownerSearchHandoff: {
          aiAutomationAudit: {
            workflowFamily: 'triage',
            actorClass: 'owner',
            effectiveMode: 'shadow',
            approvalState: 'not_required',
            resultState: 'result',
            decisionSource: 'llm',
            routeOrJob: '/triage -> /search',
            summary:
              'Shadow owner search advisory recorded while deterministic /triage -> /search remained the visible outcome.'
          },
          advisoryCandidate: {
            summary:
              'Look for trainers experienced with separation anxiety and lead reactivity.',
            suggestedSearchTerms: ['separation anxiety', 'lead reactivity'],
            focusAreas: ['adult dogs', 'behaviour support']
          },
          visibleOutcome: {
            searchParamsChanged: false,
            searchResultsChanged: false,
            emergencyEscalationChanged: false
          }
        }
      }
    })
  })
})
