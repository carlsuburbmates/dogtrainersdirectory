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

describe('moderation live mode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.MODERATION_AI_MODE = 'live'
  })

  it('records draft recommendations without auto-publishing a review', async () => {
    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const reviewUpdate = { eq: updateEq }
    const reviewSelect = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 11,
            business_id: 8,
            reviewer_name: 'Jordan',
            rating: 5,
            title: 'Patient trainer',
            content: 'Great trainer with patient, kind advice and obvious progress across several sessions.',
            created_at: '2026-03-07T00:00:00.000Z'
          }
        ],
        error: null
      })
    }
    const aiDecisionSelect = {
      in: vi.fn().mockResolvedValue({ data: [], error: null })
    }
    const aiDecisionUpsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue(reviewSelect),
          update: vi.fn().mockReturnValue(reviewUpdate)
        }
      }

      if (table === 'ai_review_decisions') {
        return {
          select: vi.fn().mockReturnValue(aiDecisionSelect),
          upsert: aiDecisionUpsert
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const result = await moderatePendingReviews(30, { mode: 'live' })

    expect(result).toMatchObject({
      processed: 1,
      autoApproved: 0,
      autoRejected: 0,
      recommendedApprove: 1,
      recommendedReject: 0,
      manualFlagged: 0
    })
    expect(updateEq).not.toHaveBeenCalled()
    expect(aiDecisionUpsert).toHaveBeenCalledOnce()

    const payload = aiDecisionUpsert.mock.calls[0][0]
    expect(payload.metadata.aiAutomationAudit).toMatchObject({
      workflowFamily: 'moderation',
      effectiveMode: 'live',
      approvalState: 'pending',
      resultState: 'result'
    })
    expect(payload.metadata.operatorVisibleState).toMatchObject({
      outputType: 'draft_recommendation',
      finalState: 'pending_operator_approval',
      reviewStateChanged: false
    })
  })
})
