import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

import { loadBusiness } from '@/app/promote/page'

describe('loadBusiness', () => {
  beforeEach(() => {
    mocks.from.mockReset()
  })

  it('returns null when supabaseAdmin cannot initialise', async () => {
    mocks.from.mockImplementation(() => {
      throw new Error(
        'supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in the environment (server-only).'
      )
    })

    await expect(loadBusiness(42)).resolves.toBeNull()
  })

  it('preserves the success path when the business and suburb load', async () => {
    const maybeSingleBusiness = vi.fn().mockResolvedValue({
      data: {
        id: 42,
        name: 'Promote Test',
        abn_verified: true,
        verification_status: 'verified',
        suburb_id: 7,
        featured_until: null,
      },
      error: null,
    })
    const businessEq = vi.fn().mockReturnValue({ maybeSingle: maybeSingleBusiness })
    const businessSelect = vi.fn().mockReturnValue({ eq: businessEq })

    const maybeSingleSuburb = vi.fn().mockResolvedValue({
      data: { name: 'Richmond' },
      error: null,
    })
    const suburbEq = vi.fn().mockReturnValue({ maybeSingle: maybeSingleSuburb })
    const suburbSelect = vi.fn().mockReturnValue({ eq: suburbEq })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'businesses') return { select: businessSelect }
      if (table === 'suburbs') return { select: suburbSelect }
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(loadBusiness(42)).resolves.toEqual({
      id: 42,
      name: 'Promote Test',
      abn_verified: true,
      verification_status: 'verified',
      suburb_id: 7,
      featured_until: null,
      suburb_name: 'Richmond',
    })
  })
})
