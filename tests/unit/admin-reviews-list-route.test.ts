import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getAiAutomationRuntimeResolution: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

vi.mock('@/lib/ai-rollouts', () => ({
  getAiAutomationRuntimeResolution: mocks.getAiAutomationRuntimeResolution
}))

import { POST } from '@/app/api/admin/reviews/list/route'

describe('/api/admin/reviews/list', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.getAiAutomationRuntimeResolution.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  })

  it('suppresses stored draft recommendations when moderation is disabled', async () => {
    mocks.getAiAutomationRuntimeResolution.mockResolvedValue({
      finalRuntimeMode: 'disabled'
    })

    const reviewQuery = {
      data: [
        {
          id: 11,
          business_id: 7,
          reviewer_name: 'Jordan',
          reviewer_email: 'jordan@example.com',
          rating: 5,
          title: 'Helpful trainer',
          content: 'Very clear and calm session',
          is_approved: false,
          is_rejected: false,
          rejection_reason: null,
          created_at: '2026-03-18T10:00:00.000Z',
          updated_at: '2026-03-18T10:00:00.000Z',
          businesses: {
            name: 'Calm Dogs'
          }
        }
      ],
      error: null,
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
      limit: vi.fn()
    }
    reviewQuery.eq.mockReturnValue(reviewQuery)
    reviewQuery.or.mockReturnValue(reviewQuery)
    reviewQuery.order.mockReturnValue(reviewQuery)
    reviewQuery.limit.mockReturnValue(reviewQuery)

    const decisionsIn = vi.fn().mockResolvedValue({
      data: [
        {
          review_id: 11,
          ai_decision: 'auto_approve',
          confidence: 0.88,
          reason: 'Detailed positive feedback with no risky terms',
          decision_source: 'deterministic',
          ai_mode: 'live',
          metadata: {
            moderationRecommendation: {
              action: 'auto_approve',
              confidence: 0.88,
              reason: 'Detailed positive feedback with no risky terms',
              source: 'deterministic'
            },
            operatorVisibleState: {
              outputType: 'draft_recommendation'
            },
            aiAutomationAudit: {
              approvalState: 'pending'
            }
          }
        }
      ],
      error: null
    })

    mocks.from.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue(reviewQuery)
        }
      }

      if (table === 'ai_review_decisions') {
        return {
          select: vi.fn().mockReturnValue({
            in: decisionsIn
          })
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const request = new Request('http://localhost/api/admin/reviews/list', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'pending', rating: null })
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.reviews[0]).toMatchObject({
      id: 11,
      business_name: 'Calm Dogs',
      ai_decision: null,
      ai_reason: null,
      ai_mode: null,
      ai_output_type: null
    })
  })
})
