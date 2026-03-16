import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  generateLLMResponse: vi.fn(),
  fetchDigestMetrics: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

vi.mock('@/lib/llm', () => ({
  generateLLMResponse: mocks.generateLLMResponse
}))

vi.mock('@/lib/emergency', () => ({
  fetchDigestMetrics: mocks.fetchDigestMetrics
}))

import { getOrCreateDailyDigest, runDailyDigest } from '@/lib/digest'

describe('ops digest shadow mode', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.generateLLMResponse.mockReset()
    mocks.fetchDigestMetrics.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.DIGEST_AI_MODE = 'shadow'
  })

  it('keeps the deterministic digest visible while storing the ai candidate as a shadow trace', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 7,
        digest_date: '2026-03-07',
        summary: 'deterministic summary',
        metrics: {},
        model: 'glm-4.6',
        generated_by: 'zai',
        created_at: '2026-03-07T00:00:00.000Z'
      },
      error: null
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })

    mocks.from.mockReturnValue({ insert })
    mocks.fetchDigestMetrics.mockResolvedValue({
      onboarding_today: 2,
      pending_abn_manual: 1,
      emergency_logs_today: 5,
      emergency_accuracy_pct: 92,
      emergency_pending_verifications: 3,
      errors_last24h: 1
    })
    mocks.generateLLMResponse.mockResolvedValue({
      provider: 'zai',
      model: 'glm-4.6',
      text: 'AI summary for operators.'
    })

    const digest = await getOrCreateDailyDigest(true)

    expect(digest.summary).not.toBe('AI summary for operators.')

    const insertPayload = insert.mock.calls[0][0]
    expect(insertPayload.decision_source).toBe('deterministic')
    expect(insertPayload.summary).toContain('DTD recorded 2 onboarding submissions')
    expect(insertPayload.ci_summary).toMatchObject({
      shadowCandidate: {
        summary: 'AI summary for operators.'
      },
      executionContext: {
        source: 'manual_force'
      },
      operatorVisibleState: {
        outputType: 'shadow_evaluation',
        finalState: 'no_external_action'
      },
      aiAutomationAudit: {
        workflowFamily: 'ops_digest',
        effectiveMode: 'shadow',
        decisionSource: 'llm',
        summary:
          'Shadow digest trace recorded while deterministic advisory remained visible.'
      }
    })
  })

  it('marks a digest run as non-reviewable when persistence is unavailable', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    mocks.fetchDigestMetrics.mockResolvedValue({
      onboarding_today: 2,
      pending_abn_manual: 1,
      emergency_logs_today: 5,
      emergency_accuracy_pct: 92,
      emergency_pending_verifications: 3,
      errors_last24h: 1
    })
    mocks.generateLLMResponse.mockResolvedValue({
      provider: 'zai',
      model: 'glm-4.6',
      text: 'AI summary for operators.'
    })

    const result = await runDailyDigest(true)

    expect(result.persisted).toBe(false)
    expect(result.evidenceReviewable).toBe(false)
    expect(result.countsAsNewEvidence).toBe(false)
    expect(result.runtimeMode).toBe('shadow')
    expect(result.persistenceNote).toContain('does not count toward reviewable shadow evidence')
  })

  it('returns a cached shadow digest without counting it as new evidence', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 8,
        digest_date: '2026-03-17',
        summary: 'Persisted digest',
        metrics: {},
        model: 'glm-4.6',
        generated_by: 'zai',
        ai_mode: 'shadow',
        created_at: '2026-03-17T01:00:00.000Z'
      },
      error: null
    })
    const limit = vi.fn(() => ({ maybeSingle }))
    const order = vi.fn(() => ({ limit }))
    const eq = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ eq }))

    mocks.from.mockReturnValue({ select })

    const result = await runDailyDigest(false)

    expect(result.persisted).toBe(true)
    expect(result.evidenceReviewable).toBe(true)
    expect(result.countsAsNewEvidence).toBe(false)
    expect(result.usedCachedDigest).toBe(true)
    expect(result.persistenceNote).toContain('Cached reads do not count as new reviewable evidence')
  })
})
