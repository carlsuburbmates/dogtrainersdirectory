import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

import { moderatePendingReviews } from '@/lib/moderation'

describe('moderation disabled mode', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.MODERATION_AI_MODE = 'disabled'
  })

  it('returns without reading reviews or writing draft recommendations', async () => {
    const result = await moderatePendingReviews(30, { mode: 'disabled' })

    expect(result).toEqual({
      processed: 0,
      autoApproved: 0,
      autoRejected: 0,
      recommendedApprove: 0,
      recommendedReject: 0,
      manualFlagged: 0
    })
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
