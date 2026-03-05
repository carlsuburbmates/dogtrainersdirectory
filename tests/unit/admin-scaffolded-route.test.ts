import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

import { GET, POST } from '@/app/api/admin/scaffolded/route'

describe('admin scaffolded route', () => {
  beforeEach(() => {
    mocks.from.mockReset()
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
})
