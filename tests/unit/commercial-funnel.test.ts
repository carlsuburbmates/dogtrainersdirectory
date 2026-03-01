import { describe, expect, it } from 'vitest'
import { summarizeCommercialFunnelRows } from '@/lib/telemetryLatency'

describe('summarizeCommercialFunnelRows', () => {
  it('aggregates stage metrics and calculates dropoff in order', () => {
    const summary = summarizeCommercialFunnelRows([
      { route: 'triage_submit', duration_ms: 100, success: true, created_at: '2026-03-01T10:00:00.000Z' },
      { route: 'triage_submit', duration_ms: 200, success: true, created_at: '2026-03-01T10:05:00.000Z' },
      { route: 'search_results', duration_ms: 120, success: true, created_at: '2026-03-01T10:06:00.000Z' },
      { route: 'trainer_profile_view', duration_ms: 180, success: true, created_at: '2026-03-01T10:07:00.000Z' },
      { route: 'promote_page_view', duration_ms: 220, success: false, created_at: '2026-03-01T10:08:00.000Z' },
      { route: 'promote_checkout_session', duration_ms: 300, success: true, created_at: '2026-03-01T10:09:00.000Z' }
    ])

    expect(summary.stages[0]).toMatchObject({
      stage: 'triage_submit',
      count: 2,
      avgMs: 150,
      p95Ms: 100,
      successRate: 1,
      lastSeen: '2026-03-01T10:05:00.000Z'
    })
    expect(summary.stages[3]).toMatchObject({
      stage: 'promote_page_view',
      count: 1,
      avgMs: 220,
      p95Ms: 220,
      successRate: 0
    })
    expect(summary.dropoff[0]).toEqual({
      from: 'triage_submit',
      to: 'search_results',
      fromCount: 2,
      toCount: 1,
      conversionRate: 0.5,
      dropoffCount: 1
    })
    expect(summary.dropoff[3]).toEqual({
      from: 'promote_page_view',
      to: 'promote_checkout_session',
      fromCount: 1,
      toCount: 1,
      conversionRate: 1,
      dropoffCount: 0
    })
  })
})
