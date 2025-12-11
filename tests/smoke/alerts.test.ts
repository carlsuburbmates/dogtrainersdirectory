import { beforeAll, describe, expect, it } from 'vitest'
import type { LatencySummary } from '@/lib/telemetryLatency'

let evaluateAlerts: typeof import('@/lib/alerts')['evaluateAlerts']

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
  const mod = await import('@/lib/alerts')
  evaluateAlerts = mod.evaluateAlerts
})

describe('alert evaluation snapshot', () => {
  const latencyOk: LatencySummary = { count: 5, avgMs: 1200, p95Ms: 1500, successRate: 0.95 }

  it('raises ABN fallback alert when rate exceeds threshold', async () => {
    const snapshot = await evaluateAlerts({
      fetchOverrides: async () => [],
      fetchCronSnapshot: async () => ({ lastSuccess: new Date().toISOString(), lastFailure: null }),
      fetchFallbackStats: async () => ({ fallbackCount: 6, verificationCount: 10, rate: 0.6 }),
      fetchLatency: async () => latencyOk,
      now: () => new Date('2025-12-09T00:00:00Z')
    })

    const fallbackAlert = snapshot.alerts.find((alert) => alert.id === 'abn-fallback-rate')
    expect(fallbackAlert).toBeTruthy()
    expect(fallbackAlert?.suppressed).toBe(false)
  })

  it('suppresses AI health alert when override active', async () => {
    const lowSuccessLatency: LatencySummary = { count: 4, avgMs: 3000, p95Ms: 3800, successRate: 0.5 }
    const snapshot = await evaluateAlerts({
      fetchOverrides: async () => [{ service: 'telemetry', status: 'investigating', reason: 'LLM drill', expires_at: new Date(Date.now() + 3600000).toISOString() }],
      fetchCronSnapshot: async () => ({ lastSuccess: new Date().toISOString(), lastFailure: null }),
      fetchFallbackStats: async () => ({ fallbackCount: 0, verificationCount: 10, rate: 0 }),
      fetchLatency: async (area) => (area === 'ai_health_endpoint' ? lowSuccessLatency : latencyOk),
      now: () => new Date('2025-12-09T00:00:00Z')
    })

    const aiAlert = snapshot.alerts.find((alert) => alert.id === 'ai-health-degraded')
    expect(aiAlert).toBeTruthy()
    expect(aiAlert?.suppressed).toBe(true)
  })
})
