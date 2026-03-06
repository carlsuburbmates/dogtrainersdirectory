import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: mocks.rpc,
  },
}))

import { fetchDirectoryRegions } from '@/app/directory/page'

describe('fetchDirectoryRegions', () => {
  beforeEach(() => {
    mocks.rpc.mockReset()
  })

  it('returns a bounded failure state when the server admin client cannot initialise', async () => {
    mocks.rpc.mockRejectedValue(
      new Error(
        'supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in the environment (server-only).'
      )
    )

    await expect(fetchDirectoryRegions()).resolves.toEqual({
      status: 'failure',
      error: 'We could not load directory listings right now.'
    })
  })

  it('keeps the success path unchanged when listings load', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          business_id: 10,
          business_name: 'Calm Dogs',
          suburb_name: 'Richmond',
          council_name: 'City of Yarra',
          region: 'Inner City',
          distance_km: 2.5,
          review_count: 4,
          age_specialties: ['puppies_0_6m'],
          behavior_issues: ['socialisation'],
          services: ['private_training'],
          verified: true,
          is_featured: false,
          average_rating: 4.8,
          abn_verified: true,
        },
      ],
      error: null,
    })

    await expect(fetchDirectoryRegions()).resolves.toEqual({
      status: 'success',
      regions: [
        {
          name: 'Inner City',
          trainers: [
            expect.objectContaining({
              business_id: 10,
              business_name: 'Calm Dogs',
            }),
          ],
        },
      ],
    })
  })
})
