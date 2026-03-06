import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  isE2ETestMode: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: mocks.requireAdmin,
}))

vi.mock('@/lib/e2eTestUtils', () => ({
  isE2ETestMode: mocks.isE2ETestMode,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

import { POST } from '@/app/api/test/seed-review/route'

describe('/api/test/seed-review', () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset()
    mocks.isE2ETestMode.mockReset()
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  })

  it('rejects unauthorised callers', async () => {
    mocks.isE2ETestMode.mockReturnValue(false)
    mocks.requireAdmin.mockResolvedValue({ authorized: false, userId: null })

    const request = new Request('http://localhost/api/test/seed-review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ businessId: 1, rating: 5 }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload).toMatchObject({
      success: false,
      error: 'Forbidden',
    })
  })

  it('inserts a schema-compatible pending review for authorised callers', async () => {
    mocks.isE2ETestMode.mockReturnValue(false)
    mocks.requireAdmin.mockResolvedValue({ authorized: true, userId: 'admin-user' })

    const single = vi.fn().mockResolvedValue({
      data: { id: 10, business_id: 2 },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })

    mocks.from.mockReturnValue({ insert })

    const request = new Request('http://localhost/api/test/seed-review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        businessId: 2,
        rating: 4,
        title: 'Great session',
        content: 'Calm and practical advice.',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      review: { id: 10, business_id: 2 },
    })

    expect(mocks.from).toHaveBeenCalledWith('reviews')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: 2,
        rating: 4,
        reviewer_name: expect.any(String),
        reviewer_email: expect.any(String),
        is_approved: false,
      })
    )
  })
})

