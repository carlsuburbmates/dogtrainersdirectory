import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function makeRequest(bodyObj: any) {
  return new Request('http://localhost/api/admin/reviews/1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj),
  })
}

describe('admin review override API (unit)', () => {
  let envBackup: any

  beforeEach(() => {
    envBackup = { ...process.env }
    // Reset module/import cache so vi.mock takes effect per-test
    vi.resetModules()
    // Provide dummy public supabase keys to avoid real client initialization
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
  })

  afterEach(() => {
    process.env = envBackup
    vi.resetAllMocks()
    vi.resetModules()
  })

  it('returns 401 when SUPABASE_SERVICE_ROLE_KEY missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    // Add a minimal mock for supabaseAdmin to satisfy module import (route checks env first)
    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }) }
    }))
    const { POST } = await import('../../app/api/admin/reviews/[id]/route')
    const res: any = await POST(makeRequest({ action: 'approve' }), { params: { id: '1' } } as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Server service role key required')
  })

  it('returns 404 when review not found', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'

    // mock supabaseAdmin so the handler sees no review
    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => {
          if (table === 'reviews') {
            return {
              select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'not found' } } ) }) })
            }
          }
          return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }
        }
      }
    }))

    const { POST } = await import('../../app/api/admin/reviews/[id]/route')
    const res: any = await POST(makeRequest({ action: 'approve' }), { params: { id: '9999' } } as any)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Review not found')
  })

  it('applies approve and upserts ai decision', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'

    const mockUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })

    // mock supabaseAdmin and capture update/upsert calls
    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => {
          if (table === 'reviews') {
            return {
              select: () => ({ eq: () => ({ single: async () => ({ data: { id: 1, is_approved: false }, error: null } ) }) }),
              update: () => ({ eq: mockUpdate })
            }
          }

          if (table === 'ai_review_decisions') {
            return {
              select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
              upsert: mockUpsert
            }
          }

          return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }
        }
      }
    }))

    const { POST } = await import('../../app/api/admin/reviews/[id]/route')

    const res: any = await POST(makeRequest({ action: 'approve' }), { params: { id: '1' } } as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
  })
})
