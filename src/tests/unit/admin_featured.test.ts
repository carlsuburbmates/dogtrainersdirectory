import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

async function callPostRoute(importPath: string, reqOptions: any = {}, params: any = {}) {
  const { POST } = await import(importPath)
  const headers = new Headers(reqOptions.headers || {})
  const req = new Request('http://localhost' + (reqOptions.path || '/'), { method: 'POST', headers, body: reqOptions.body ? JSON.stringify(reqOptions.body) : undefined })
  return POST(req, { params })
}

describe('admin featured endpoints (unit)', () => {
  let envBackup: any

  beforeEach(() => {
    envBackup = { ...process.env }
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
  })

  afterEach(() => {
    process.env = envBackup
    vi.resetAllMocks()
    vi.resetModules()
  })

  it('GET /api/admin/featured/list returns 401 when missing service role', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    // Ensure route import does not fail — mock supabase minimally
    vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [] }) }) }) }) } }))

    const { GET } = await import('../../app/api/admin/featured/list/route')
    const res: any = await GET()
    const data = await res.json()
    expect(res.status).toBe(401)
    expect(data.error).toBe('Server service role key required')
  })

  it('GET /api/admin/featured/list returns data when authorized', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'

    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => ({
          select: () => ({ eq: () => ({ order: () => ({ data: table === 'featured_placements' ? [{ id: 1 }] : [] }) }) })
        })
      }
    }))

    const { GET } = await import('../../app/api/admin/featured/list/route')
    const res: any = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.active).toBeDefined()
    expect(json.queued).toBeDefined()
  })

  it('POST /api/admin/featured/[id]/promote unauthorized without role', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const resp: any = await callPostRoute('../../app/api/admin/featured/[id]/promote/route', { body: {} }, { id: '1' })
    const data = await resp.json()
    expect(resp.status).toBe(401)
  })

  it('POST /api/admin/featured/[id]/promote succeeds when authorized', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    const mockUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => {
          if (table === 'featured_placements') return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 10, active: false }, error: null }) }) }),
            update: () => ({ eq: mockUpdate })
          }
          if (table === 'featured_placement_events') return { insert: mockInsert }
          return {}
        }
      }
    }))

    const res: any = await callPostRoute('../../app/api/admin/featured/[id]/promote/route', { body: { days: 7 } }, { id: '10' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('POST /api/admin/featured/[id]/demote works when authorized', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    const mockUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => {
          if (table === 'featured_placements') return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 5, active: true }, error: null }) }) }),
            update: () => ({ eq: mockUpdate })
          }
          if (table === 'featured_placement_events') return { insert: mockInsert }
          return {}
        }
      }
    }))

    const res: any = await callPostRoute('../../app/api/admin/featured/[id]/demote/route', {}, { id: '5' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('POST /api/admin/featured/[id]/extend 404 when missing', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    // Simulate not found by returning null row for select.maybeSingle
    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }) }
    }))

    const res: any = await callPostRoute('../../app/api/admin/featured/[id]/extend/route', { body: { days: 3 } }, { id: '99' })
    const json = await res.json()
    expect(res.status).toBe(404)
    expect(json.error).toBe('Not found')
  })

  it('POST /api/admin/featured/[id]/extend succeeds when found', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    const mockUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    vi.doMock('@/lib/supabase', () => ({
      supabaseAdmin: {
        from: (table: string) => {
          if (table === 'featured_placements') {
            return {
              select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: { expiry_date: new Date().toISOString() } }) }) }) }),
              update: () => ({ eq: mockUpdate })
            }
          }
          if (table === 'featured_placement_events') return { insert: mockInsert }
          return {}
        }
      }
    }))

    const res: any = await callPostRoute('../../app/api/admin/featured/[id]/extend/route', { body: { days: 5 } }, { id: '5' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })
})
