import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  recordLatencyMetric: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

vi.mock('@/lib/telemetryLatency', () => ({
  recordLatencyMetric: mocks.recordLatencyMetric,
}))

import { GET, POST } from '@/app/api/admin/scaffolded/route'

describe('admin scaffolded route', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.recordLatencyMetric.mockClear()
  })

  it('returns a stable scaffolded envelope on GET failures', async () => {
    const query = {
      eq: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'relation not found' },
      }),
    }
    query.eq.mockReturnValueOnce(query)
    query.eq.mockReturnValueOnce(query)

    const select = vi.fn().mockReturnValue(query)
    mocks.from.mockReturnValue({ select })

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toMatchObject({
      success: false,
      scaffolded: [],
      error: 'Unable to fetch scaffolded listings',
      message: 'relation not found',
    })

    expect(mocks.recordLatencyMetric).toHaveBeenCalledTimes(1)
    expect(mocks.recordLatencyMetric.mock.calls[0]?.[0]).toMatchObject({
      area: 'admin_scaffolded_queue',
      route: '/api/admin/scaffolded',
      success: false,
      statusCode: 500,
      metadata: {
        operatorScaffoldReviewGuidance: {
          aiAutomationAudit: {
            workflowFamily: 'scaffold_review_guidance',
            actorClass: 'operator',
            effectiveMode: 'shadow',
            resultState: 'error',
            routeOrJob: '/api/admin/scaffolded',
          },
        },
      },
    })
  })

  it('returns a stable envelope for invalid scaffolded review requests', async () => {
    const request = new Request('http://localhost/api/admin/scaffolded', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request as any)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({
      success: false,
      error: 'Missing id or action',
    })
  })

  it('does not change the scaffolded queue payload when recording shadow guidance traces', async () => {
    const scaffolded = [
      {
        id: 42,
        name: 'Example Trainer',
        verification_status: 'manual_review',
        is_scaffolded: true,
        bio: null,
      },
    ]

    const query = {
      eq: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: scaffolded,
        error: null,
      }),
    }
    query.eq.mockReturnValueOnce(query)
    query.eq.mockReturnValueOnce(query)

    const select = vi.fn().mockReturnValue(query)
    mocks.from.mockReturnValue({ select })

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      scaffolded,
    })

    expect(mocks.recordLatencyMetric).toHaveBeenCalledTimes(1)
    const metric = mocks.recordLatencyMetric.mock.calls[0]?.[0] as any
    expect(metric).toMatchObject({
      area: 'admin_scaffolded_queue',
      route: '/api/admin/scaffolded',
      metadata: {
        operatorScaffoldReviewGuidance: {
          aiAutomationAudit: {
            workflowFamily: 'scaffold_review_guidance',
            actorClass: 'operator',
            effectiveMode: 'shadow',
            decisionSource: 'deterministic',
            resultState: 'result',
            routeOrJob: '/api/admin/scaffolded',
          },
          visibleOutcome: {
            queuePayloadChanged: false,
            scaffoldApprovalBehaviourChanged: false,
            publicationOutcomeChanged: false,
            verificationOutcomeChanged: false,
            featuredOutcomeChanged: false,
            spotlightOutcomeChanged: false,
            monetizationOutcomeChanged: false,
            rankingOutcomeChanged: false,
          },
          advisoryCandidate: {
            queueSize: 1,
            sample: [
              {
                businessId: 42,
              },
            ],
          },
        },
      },
    })
  })

  it('keeps scaffold approval writes deterministic and unchanged', async () => {
    const fetchBackup = global.fetch
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-ok' }), { status: 200 })
    )
    global.fetch = fetchMock as any

    try {
      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const update = vi.fn().mockReturnValue({ eq: updateEq })

      const selectSingle = vi.fn().mockResolvedValue({
        data: { name: 'Example Trainer', email: 'operator-test@example.com' },
        error: null,
      })
      const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
      const select = vi.fn().mockReturnValue({ eq: selectEq, single: selectSingle })

      mocks.from.mockReturnValue({ update, select })

      const request = new Request('http://localhost/api/admin/scaffolded', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 123, action: 'approve' }),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)
      expect(update).toHaveBeenCalledWith({
        is_scaffolded: false,
        is_claimed: true,
        verification_status: 'verified',
        abn_verified: true,
      })
    } finally {
      global.fetch = fetchBackup
    }
  })
})
