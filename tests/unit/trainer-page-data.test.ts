import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: mocks.rpc,
    from: mocks.from,
  },
}))

import { loadTrainerPageData } from '@/app/trainers/[id]/page'

describe('loadTrainerPageData', () => {
  beforeEach(() => {
    mocks.rpc.mockReset()
    mocks.from.mockReset()
  })

  it('returns a bounded failure state when the profile RPC throws', async () => {
    mocks.rpc.mockRejectedValue(
      new Error(
        'supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in the environment (server-only).'
      )
    )

    await expect(loadTrainerPageData(9)).resolves.toEqual({
      status: 'failure',
      error: 'We could not load this trainer profile right now.',
      trainer: null,
      reviews: [],
    })
  })

  it('returns a bounded failure state when approved reviews cannot be loaded', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ business_name: 'Calm Dogs' }],
      error: null,
    })

    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'reviews unavailable' },
    })
    const order = vi.fn().mockReturnValue({ limit })
    const approvedEq = vi.fn().mockReturnValue({ order })
    const businessEq = vi.fn().mockReturnValue({ eq: approvedEq })
    const select = vi.fn().mockReturnValue({ eq: businessEq })
    mocks.from.mockReturnValue({ select })

    await expect(loadTrainerPageData(9)).resolves.toEqual({
      status: 'failure',
      error: 'We could not load this trainer profile right now.',
      trainer: null,
      reviews: [],
    })
  })
})
