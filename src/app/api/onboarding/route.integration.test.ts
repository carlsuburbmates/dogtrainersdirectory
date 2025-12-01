import { describe, it, expect, vi, beforeEach } from 'vitest'

const makeReq = (body: any) => ({ json: async () => body }) as any

describe('integration: POST /api/onboarding -> abn_verifications', () => {
  beforeEach(() => vi.resetModules())

  it('stores matched_json parsed object and status=verified for Active ABN', async () => {
    await vi.doMock('@/lib/abr', () => ({
      default: {
        isValidAbn: (_: string) => true,
        fetchAbrJson: vi.fn().mockResolvedValue({
          status: 200,
          body: JSON.stringify({ Response: { ResponseBody: { ABN: '53004085616', ABNStatus: 'Active', EntityName: 'Loose Lead Training' } } }),
          parsed: { Response: { ResponseBody: { ABN: '53004085616', ABNStatus: 'Active', EntityName: 'Loose Lead Training' } } }
        })
      }
    }))

    await vi.doMock('@/lib/encryption', () => ({ encryptValue: (v: string) => `enc:${v}` }))

    const insertAbn = vi.fn().mockResolvedValue({ data: { id: 999 }, error: null })

    // Mock supabaseAdmin implementation
    await vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        auth: { admin: { createUser: vi.fn().mockResolvedValue({ data: { id: 'u-1' } }) } },
        from: (table: string) => ({
          insert: (vals: any) => {
            if (table === 'businesses') return Promise.resolve({ data: { id: 42 }, error: null })
            if (table === 'profiles') return Promise.resolve({ data: null, error: null })
            if (table === 'abn_verifications') return insertAbn(vals)
            return Promise.resolve({ data: null, error: null })
          }
        })
      }
    }))

    const { POST } = await import('./route')

    const body = {
      email: 'e@example.com',
      password: 'pass',
      fullName: 'Owner',
      businessName: 'Loose Lead Training',
      suburbId: 1,
      ages: [],
      issues: [],
      primaryService: 'training',
      secondaryServices: [],
      abn: '53004085616'
    }

    const req = makeReq(body)
    const res = await POST(req as any)
    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(insertAbn).toHaveBeenCalled()
    const payload = insertAbn.mock.calls[0][0]
    expect(payload.status).toBe('verified')
    expect(payload.matched_json).toBeDefined()
    expect(payload.matched_json.Response.ResponseBody.ABNStatus).toBe('Active')
  })

  it('stores raw payload and status=rejected for no-entity ABR response', async () => {
    await vi.doMock('@/lib/abr', () => ({
      default: {
        isValidAbn: (_: string) => true,
        fetchAbrJson: vi.fn().mockResolvedValue({ status: 200, body: '<soap><Response></Response></soap>', parsed: null })
      }
    }))

    await vi.doMock('@/lib/encryption', () => ({ encryptValue: (v: string) => `enc:${v}` }))

    const insertAbn = vi.fn().mockResolvedValue({ data: { id: 1001 }, error: null })

    await vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        auth: { admin: { createUser: vi.fn().mockResolvedValue({ data: { id: 'u-2' } }) } },
        from: (table: string) => ({
          insert: (vals: any) => {
            if (table === 'businesses') return Promise.resolve({ data: { id: 43 }, error: null })
            if (table === 'profiles') return Promise.resolve({ data: null, error: null })
            if (table === 'abn_verifications') return insertAbn(vals)
            return Promise.resolve({ data: null, error: null })
          }
        })
      }
    }))

    const { POST } = await import('./route')

    const body = {
      email: 'x@example.com',
      password: 'pass',
      fullName: 'Owner',
      businessName: 'NoEntity Co',
      suburbId: 1,
      ages: [],
      issues: [],
      primaryService: 'training',
      secondaryServices: [],
      abn: '00000000000'
    }

    const req = makeReq(body)
    const res = await POST(req as any)
    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(insertAbn).toHaveBeenCalled()
    const payload = insertAbn.mock.calls[0][0]
    expect(payload.status).toBe('rejected')
    expect(payload.matched_json).toBeDefined()
    expect(payload.matched_json.raw).toContain('<soap')
  })
})
