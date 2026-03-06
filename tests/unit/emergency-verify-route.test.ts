import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  generateLLMResponse: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

vi.mock('@/lib/llm', () => ({
  generateLLMResponse: mocks.generateLLMResponse
}))

import { POST } from '@/app/api/emergency/verify/route'

describe('emergency verification shadow mode', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.generateLLMResponse.mockReset()
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.VERIFICATION_AI_MODE = 'shadow'
  })

  it('keeps the deterministic verification outcome visible while storing the ai candidate in audit metadata', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'verification-1' },
      error: null
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })

    mocks.from.mockReturnValue({ insert })
    mocks.generateLLMResponse.mockResolvedValue({
      provider: 'zai',
      model: 'glm-4.6',
      text: JSON.stringify({
        isValid: false,
        reason: 'Website looks suspicious',
        confidence: 0.2
      })
    })

    const request = new Request('http://localhost/api/emergency/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        resourceId: 'biz-1',
        phone: '+61 3 9999 0000',
        website: 'https://example.com'
      })
    })

    const response = await POST(request as any)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.verification).toMatchObject({
      isValid: true,
      reason: 'Phone and website appear to have valid format',
      confidence: 0.8,
      verificationMethod: 'deterministic',
      effectiveMode: 'shadow',
      aiProvider: 'zai',
      aiModel: 'glm-4.6'
    })

    expect(insert).toHaveBeenCalledOnce()
    const insertPayload = insert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      business_id: 'biz-1',
      result: 'valid',
      ai_prompt_version: 'resource-verification-v1'
    })
    expect(insertPayload.details).toMatchObject({
      isValid: true,
      reason: 'Phone and website appear to have valid format',
      confidence: 0.8,
      verificationMethod: 'deterministic',
      shadowCandidate: {
        isValid: false,
        reason: 'Website looks suspicious',
        confidence: 0.2
      },
      aiAutomationAudit: {
        workflowFamily: 'verification',
        effectiveMode: 'shadow',
        approvalState: 'pending',
        resultState: 'result',
        decisionSource: 'llm',
        summary:
          'Shadow verification trace recorded while deterministic verification remained the visible outcome.'
      }
    })
  })
})
