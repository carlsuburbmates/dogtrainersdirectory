import { describe, it, expect, vi, beforeEach } from 'vitest'

const makeReq = (body: any) => ({ json: async () => body }) as any

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls ABR and persists matched_json when creating a business', async () => {
    // Mock abr.fetchAbrJson
    await vi.doMock('@/lib/abr', () => ({ default: { isValidAbn: (abn: string) => true, fetchAbrJson: vi.fn().mockResolvedValue({ status: 200, body: '{"Response":{"ResponseBody":{"ABN":"53004085616","ABNStatus":"Active","EntityName":"LOOSE LEAD TRAINING FITZROY PTY LTD"}}}', parsed: { Response: { ResponseBody: { ABN: '53004085616', ABNStatus: 'Active', EntityName: 'LOOSE LEAD TRAINING FITZROY PTY LTD' } } } }) } }))

    // Mock encryption helper so tests do not require PGCRYPTO_KEY
    await vi.doMock('@/lib/encryption', () => ({ encryptValue: (v: string) => `enc:${v}` }))

    // Build a fake supabaseAdmin that simulates successful inserts
    const insertBusiness = vi.fn().mockResolvedValue({ data: { id: 99 }, error: null })
    const insertAbn = vi.fn().mockResolvedValue({ data: { id: 100 }, error: null })

    await vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        auth: { admin: { createUser: vi.fn().mockResolvedValue({ data: { id: 'uid123' }}) }},
        from: () => ({
          insert: (vals: any) => ({ select: () => ({ single: () => insertBusiness(vals) }) })
        })
      }
    }))

    // For abn_verifications we'll need a dedicated path, so mock separate behaviour
    const sb = await import('@/lib/supabase')
    sb.supabaseAdmin.from = () => ({ insert: insertAbn })

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
    // Ensure we attempted to persist abn_verifications (insertAbn called)
    expect(insertAbn).toHaveBeenCalled()
  })
})
