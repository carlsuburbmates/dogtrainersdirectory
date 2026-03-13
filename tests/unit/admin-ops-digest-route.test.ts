import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  runDailyDigest: vi.fn()
}))

vi.mock('@/lib/digest', () => ({
  runDailyDigest: mocks.runDailyDigest
}))

import { POST } from '@/app/api/admin/ops-digest/route'

describe('admin ops digest route', () => {
  beforeEach(() => {
    mocks.runDailyDigest.mockReset()
  })

  it('returns a controlled failure when the digest run is not persisted and cannot count toward evidence', async () => {
    mocks.runDailyDigest.mockResolvedValue({
      digest: {
        id: -1,
        digest_date: '2026-03-13',
        summary: 'Fallback digest',
        metrics: {},
        model: 'fallback',
        generated_by: 'deterministic',
        ai_mode: 'shadow',
        created_at: '2026-03-13T00:00:00.000Z'
      },
      runtimeMode: 'shadow',
      persisted: false,
      evidenceReviewable: false,
      usedCachedDigest: false,
      persistenceNote:
        'SUPABASE_SERVICE_ROLE_KEY is not configured, so this digest run is local-only and does not count toward reviewable shadow evidence.'
    })

    const response = await POST(new Request('http://localhost/api/admin/ops-digest?force=true', {
      method: 'POST'
    }))
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.error).toBe('Ops digest evidence is not reviewable in this environment')
    expect(payload.evidenceReviewable).toBe(false)
  })

  it('returns reviewable evidence details when the digest row is persisted', async () => {
    mocks.runDailyDigest.mockResolvedValue({
      digest: {
        id: 9,
        digest_date: '2026-03-13',
        summary: 'Persisted digest',
        metrics: {},
        model: 'glm-4.6',
        generated_by: 'zai',
        ai_mode: 'shadow',
        created_at: '2026-03-13T00:00:00.000Z'
      },
      runtimeMode: 'shadow',
      persisted: true,
      evidenceReviewable: true,
      usedCachedDigest: false,
      persistenceNote:
        'This run persisted a shadow digest row in daily_ops_digests and counts toward the seven-run evidence window.'
    })

    const response = await POST(new Request('http://localhost/api/admin/ops-digest?force=true', {
      method: 'POST'
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.evidenceReviewable).toBe(true)
    expect(payload.persistenceNote).toContain('counts toward the seven-run evidence window')
  })
})
