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
    process.env.NEXT_PUBLIC_SITE_URL = 'https://dogtrainersdirectory.com.au'
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
      scaffolded: [
        {
          ...scaffolded[0],
          guidance_checks: [
            'Bio is missing. Confirm service scope, experience, and any credentials before approving.'
          ],
          next_action:
            'Check the business website or source record for services, locality, and trust signals before approving. Keep it pending if the listing is still too thin.',
          guidance_source: 'shadow_trace',
        },
      ],
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

  it('surfaces placeholder risk guidance without changing approval ownership', async () => {
    const scaffolded = [
      {
        id: 77,
        name: 'Demo Trainer Listing',
        verification_status: 'manual_review',
        is_scaffolded: true,
        bio: 'Short bio',
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
    expect(payload.scaffolded[0]).toMatchObject({
      id: 77,
      guidance_source: 'shadow_trace',
    })
    expect(payload.scaffolded[0].guidance_checks[0]).toContain('Bio is very short')
    expect(payload.scaffolded[0].guidance_checks[1]).toContain('placeholder')
    expect(payload.scaffolded[0].next_action).toContain('Reject it or keep it pending')
  })

  it('keeps scaffold approval truthful for concierge-seeded listings', async () => {
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
        is_scaffolded: true,
        is_claimed: false,
        verification_status: 'pending',
        abn_verified: false,
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [, options] = fetchMock.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.html).toContain(
        'https://dogtrainersdirectory.com.au/login?redirectTo=%2Faccount%2Fbusiness'
      )
    } finally {
      global.fetch = fetchBackup
    }
  })
})
