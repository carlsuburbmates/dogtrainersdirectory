import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

import { POST } from '@/app/api/admin/reviews/[id]/route'

describe('admin review manual route', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.AI_GLOBAL_MODE = 'live'
    process.env.MODERATION_AI_MODE = 'live'
  })

  it('preserves the moderation recommendation while recording the final operator action', async () => {
    const reviewSingle = vi.fn().mockResolvedValue({
      data: { id: 42, is_approved: false, is_rejected: false },
      error: null
    })
    const reviewSelect = {
      eq: vi.fn().mockReturnValue({ single: reviewSingle })
    }
    const reviewUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const reviewUpdate = vi.fn().mockReturnValue({ eq: reviewUpdateEq })

    const decisionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        review_id: 42,
        ai_decision: 'auto_reject',
        confidence: 0.92,
        reason: 'Contains spam or outbound link content',
        decision_source: 'deterministic',
        ai_mode: 'live',
        ai_provider: 'deterministic',
        ai_model: null,
        ai_prompt_version: 'moderation-rules-v1',
        metadata: {
          moderationRecommendation: {
            action: 'auto_reject',
            reason: 'Contains spam or outbound link content',
            confidence: 0.92,
            source: 'deterministic'
          },
          aiAutomationAudit: {
            approvalState: 'pending'
          }
        }
      },
      error: null
    })
    const decisionSelect = {
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: decisionMaybeSingle
        })
      })
    }
    const decisionUpsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue(reviewSelect),
          update: reviewUpdate
        }
      }

      if (table === 'ai_review_decisions') {
        return {
          select: vi.fn().mockReturnValue(decisionSelect),
          upsert: decisionUpsert
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const request = new Request('http://localhost/api/admin/reviews/42', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        reason: 'Confirmed spam after operator review'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: '42' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ success: true })

    const upsertPayload = decisionUpsert.mock.calls[0][0]
    expect(upsertPayload).toMatchObject({
      review_id: 42,
      ai_decision: 'auto_reject',
      decision_source: 'manual_override',
      ai_mode: 'live'
    })
    expect(upsertPayload.metadata).toMatchObject({
      moderationRecommendation: {
        action: 'auto_reject',
        source: 'deterministic'
      },
      finalAction: {
        action: 'reject',
        reason: 'Confirmed spam after operator review',
        actor: 'operator'
      },
      operatorVisibleState: {
        outputType: 'final_approved_action',
        finalState: 'rejected',
        reviewStateChanged: true
      },
      aiAutomationAudit: {
        workflowFamily: 'moderation',
        approvalState: 'rejected',
        decisionSource: 'manual_override'
      }
    })
  })
})
