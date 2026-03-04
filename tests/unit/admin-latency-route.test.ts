import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: mocks.rpc,
  },
}))

import { GET } from '@/app/api/admin/latency/route'

describe('admin latency route', () => {
  beforeEach(() => {
    mocks.rpc.mockReset()
  })

  it('returns a zeroed success response for zero-volume windows', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        message: 'division by zero',
      },
    })

    const response = await GET(new Request('http://localhost/api/admin/latency?hours=24'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      p50_latency: 0,
      p95_latency: 0,
      avg_latency: 0,
      total_operations: 0,
      success_rate: 100,
      timeWindowHours: 24,
      alertThresholdExceeded: false,
    })
    expect(typeof payload.timestampGenerated).toBe('string')
  })

  it('preserves 500 responses for non-zero-volume RPC failures', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        message: 'permission denied',
      },
    })

    const response = await GET(new Request('http://localhost/api/admin/latency?hours=24'))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({
      error: 'Failed to retrieve latency statistics',
    })
  })
})
