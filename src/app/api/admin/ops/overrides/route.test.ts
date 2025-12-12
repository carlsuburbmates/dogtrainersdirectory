import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args)
  }
}))

describe('/api/admin/ops/overrides route', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFrom.mockReset()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('caps override expiry to two hours by default', async () => {
    const baseTime = new Date('2025-12-10T00:00:00Z')
    vi.setSystemTime(baseTime)

    let insertedPayload: any = null
    mockFrom.mockReturnValue({
      insert: (payload: any) => {
        insertedPayload = payload
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { ...payload, id: 'override-1' },
                error: null
              })
          })
        }
      }
    })

    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/admin/ops/overrides', {
      method: 'POST',
      body: JSON.stringify({ service: 'telemetry', status: 'temporarily_down', reason: 'test' })
    } as any)

    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(insertedPayload).toBeTruthy()
    const expiresAt = new Date(insertedPayload.expires_at).getTime()
    const deltaMs = expiresAt - baseTime.getTime()
    expect(deltaMs).toBeLessThanOrEqual(2 * 60 * 60 * 1000)
    expect(deltaMs).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 1000)
  })

  it('filters expired overrides when fetching', async () => {
    const gtSpy = vi.fn().mockReturnThis()
    const orderSpy = vi.fn().mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue({
      select: () => ({ gt: gtSpy, order: orderSpy })
    })

    const { GET } = await import('./route')
    const response = await GET()
    expect(response.status).toBe(200)
    expect(gtSpy).toHaveBeenCalledTimes(1)
    const args = gtSpy.mock.calls[0]
    expect(args[0]).toBe('expires_at')
    const expiresParam = args[1]
    const expiresDate = new Date(expiresParam)
    expect(expiresDate.getTime()).toBeGreaterThan(Date.now() - 1000)
  })
})
