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

import { GET } from '@/app/api/trainer/dashboard/route'

describe('/api/trainer/dashboard', () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset()
    mocks.isE2ETestMode.mockReset()
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  })

  it('returns an honest unsupported response for unauthorised callers', async () => {
    mocks.isE2ETestMode.mockReturnValue(false)
    mocks.requireAdmin.mockResolvedValue({ authorized: false, userId: null })

    const response = await GET(new Request('http://localhost/api/trainer/dashboard?businessId=1'))
    const payload = await response.json()

    expect(response.status).toBe(501)
    expect(payload).toEqual({
      success: false,
      error: 'Not implemented',
      message: 'Trainer dashboard analytics are not available yet.',
    })
  })

  it('returns deterministic review metrics and nulls for unsupported analytics', async () => {
    mocks.isE2ETestMode.mockReturnValue(false)
    mocks.requireAdmin.mockResolvedValue({ authorized: true, userId: 'admin-user' })

    const businessSingle = vi.fn().mockResolvedValue({
      data: {
        id: 7,
        name: 'Example trainer',
        abn_verified: true,
        verification_status: 'verified',
        featured_until: null,
        suburb_id: 1,
      },
      error: null,
    })
    const businessEq = vi.fn().mockReturnValue({ single: businessSingle })
    const businessSelect = vi.fn().mockReturnValue({ eq: businessEq })

    const reviewsSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }],
          error: null,
        }),
      }),
    })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'businesses') return { select: businessSelect }
      if (table === 'reviews') return { select: reviewsSelect }
      throw new Error(`Unexpected table: ${table}`)
    })

    const response = await GET(new Request('http://localhost/api/trainer/dashboard?businessId=7'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      business: { id: 7, name: 'Example trainer' },
      analytics: {
        totalViews: null,
        totalProfileClicks: null,
        totalInquiries: null,
        averageRating: 4.5,
        reviewCount: 2,
      },
    })
  })
})

