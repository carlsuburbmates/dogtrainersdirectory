import { describe, expect, it } from 'vitest'
import {
  compareReviewLoopPriority,
  getReviewLoopPresentation,
  summariseReviewLoop,
} from '@/app/admin/reviews/review-loop'

describe('review moderation loop helper', () => {
  it('marks live draft reject recommendations as reject-ready without changing final outcome', () => {
    const presentation = getReviewLoopPresentation({
      id: 41,
      created_at: '2026-03-19T02:00:00.000Z',
      ai_decision: 'auto_reject',
      ai_reason: 'Contains spam links',
      ai_output_type: 'draft_recommendation',
    })

    expect(presentation).toMatchObject({
      stageLabel: 'Reject-ready draft',
      priority: 1,
    })
    expect(presentation.nextAction).toContain('reject only if the spam, abuse, or trust concern is confirmed')
    expect(presentation.operatorNote).toContain('Final rejection still requires your explicit action')
  })

  it('keeps shadow evaluations clearly advisory', () => {
    const presentation = getReviewLoopPresentation({
      id: 42,
      created_at: '2026-03-19T03:00:00.000Z',
      ai_decision: 'auto_approve',
      ai_reason: 'Looks genuine',
      ai_output_type: 'shadow_evaluation',
    })

    expect(presentation).toMatchObject({
      stageLabel: 'Shadow review',
      priority: 3,
    })
    expect(presentation.nextAction).toContain('The live review state is still pending')
    expect(presentation.operatorNote).toContain('did not change the live review state')
  })

  it('summarises and sorts the weekly moderation pass in operator order', () => {
    const reviews = [
      {
        id: 1,
        created_at: '2026-03-19T01:00:00.000Z',
        ai_decision: 'auto_approve',
        ai_reason: 'Looks genuine',
        ai_output_type: 'draft_recommendation',
      },
      {
        id: 2,
        created_at: '2026-03-19T02:00:00.000Z',
        ai_decision: 'auto_reject',
        ai_reason: 'Spam pattern',
        ai_output_type: 'draft_recommendation',
      },
      {
        id: 3,
        created_at: '2026-03-19T03:00:00.000Z',
        ai_decision: 'manual',
        ai_reason: 'Needs manual context',
        ai_output_type: 'shadow_evaluation',
      },
      {
        id: 4,
        created_at: '2026-03-19T04:00:00.000Z',
      },
    ]

    const orderedIds = [...reviews].sort(compareReviewLoopPriority).map((review) => review.id)
    const summary = summariseReviewLoop(reviews)

    expect(orderedIds).toEqual([2, 1, 3, 4])
    expect(summary).toMatchObject({
      pendingTotal: 4,
      draftRejectCount: 1,
      draftApproveCount: 1,
      shadowCount: 1,
      manualCount: 1,
      completedCount: 0,
    })
    expect(summary.summary).toContain('Start with 1 reject-ready draft')
    expect(summary.summary).toContain('then clear 1 approve-ready draft')
    expect(summary.summary).toContain('then finish 1 manual check')
    expect(summary.summary).toContain('1 shadow-only item still need operator review')
  })
})
