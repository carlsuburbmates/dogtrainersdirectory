import { supabaseAdmin } from './supabase'
import {
  mergeAiAutomationAuditMetadata
} from './ai-automation'
import { getAiAutomationRuntimeResolution } from './ai-rollouts'
import type { DecisionMode, DecisionSource } from './ai-types'

export type ReviewRecord = {
  id: number
  business_id: number
  reviewer_name: string
  rating: number
  title?: string | null
  content?: string | null
  created_at: string
}

const SPAM_PATTERNS = [/http/gi, /www\./gi, /buy now/gi, /call\s+\d/gi, /viagra/gi, /crypto/gi]
const SAFE_PHRASES = ['great', 'helped', 'training', 'session', 'recommend', 'patient', 'kind', 'progress']

const evaluateReview = (review: ReviewRecord) => {
  const body = `${review.title ?? ''} ${review.content ?? ''}`.trim().toLowerCase()
  if (!body) {
    return {
      action: 'manual' as const,
      reason: 'Empty review body requires manual validation',
      confidence: 0.4
    }
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(body))) {
    return {
      action: 'auto_reject' as const,
      reason: 'Contains spam or outbound link content',
      confidence: 0.92
    }
  }

  if (review.rating >= 4 && body.length > 60 && SAFE_PHRASES.some((word) => body.includes(word))) {
    return {
      action: 'auto_approve' as const,
      reason: 'Detailed positive feedback with no risky terms',
      confidence: 0.88
    }
  }

  if (review.rating <= 2) {
    return {
      action: 'manual' as const,
      reason: 'Low-star review, keep for human moderation',
      confidence: 0.55
    }
  }

  return {
    action: 'manual' as const,
    reason: 'Borderline sentiment — leaving for manual moderation',
    confidence: 0.6
  }
}

type ModeratePendingReviewsOptions = {
  mode?: DecisionMode
}

const MODERATION_PROMPT_VERSION = 'moderation-rules-v1'

function buildEmptyModerationSummary() {
  return {
    processed: 0,
    autoApproved: 0,
    autoRejected: 0,
    recommendedApprove: 0,
    recommendedReject: 0,
    manualFlagged: 0
  }
}

export async function moderatePendingReviews(
  limit = 30,
  options: ModeratePendingReviewsOptions = {}
) {
  // If the server service role key is not present, don't attempt admin operations
  // (this can happen in developer machines pointing to remote Supabase without a service-role).
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('moderatePendingReviews: SUPABASE_SERVICE_ROLE_KEY not set — skipping moderation operations')
    return buildEmptyModerationSummary()
  }

  if (options.mode === 'disabled') {
    return buildEmptyModerationSummary()
  }

  const rolloutResolution = await getAiAutomationRuntimeResolution('moderation')
  const effectiveMode = options.mode ?? rolloutResolution.finalRuntimeMode

  if (effectiveMode === 'disabled') {
    return buildEmptyModerationSummary()
  }

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('id, business_id, reviewer_name, rating, title, content, created_at')
    .eq('is_approved', false)
    .eq('is_rejected', false)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error || !reviews?.length) {
    return buildEmptyModerationSummary()
  }

  const reviewsTyped = reviews as ReviewRecord[]
  const existingIds = reviewsTyped.map((review) => review.id)
  const { data: existingDecisions } = await supabaseAdmin
    .from('ai_review_decisions')
    .select('review_id')
    .in('review_id', existingIds)

  const alreadyDecided = new Set(
    (existingDecisions ?? []).map((item: { review_id: number }) => item.review_id)
  )

  let autoApproved = 0
  let autoRejected = 0
  let recommendedApprove = 0
  let recommendedReject = 0
  let manualFlagged = 0
  let processed = 0

  for (const review of reviewsTyped) {
    if (alreadyDecided.has(review.id)) continue
    const decision = evaluateReview(review)
    const decisionSource: DecisionSource = 'deterministic'
    const approvalState = 'pending'

    if (decision.action === 'auto_approve') {
      recommendedApprove += 1
    } else if (decision.action === 'auto_reject') {
      recommendedReject += 1
    } else if (decision.action === 'manual') {
      manualFlagged += 1
    }

    await supabaseAdmin
      .from('ai_review_decisions')
      .upsert({
        review_id: review.id,
        ai_decision: decision.action,
        confidence: decision.confidence,
        reason: decision.reason,
        decision_source: decisionSource,
        ai_mode: effectiveMode,
        ai_provider: 'deterministic',
        ai_model: null,
        ai_prompt_version: MODERATION_PROMPT_VERSION,
        metadata: mergeAiAutomationAuditMetadata(
          undefined,
          {
            workflowFamily: 'moderation',
            actorClass: rolloutResolution.actorClass,
            effectiveMode,
            approvalState,
            resultState: 'result',
            decisionSource,
            routeOrJob: '/api/admin/moderation/run',
            summary:
              effectiveMode === 'shadow'
                ? 'Shadow moderation recommendation recorded without changing review publication state.'
                : 'Moderation recommendation recorded for operator approval.',
            resultingRecordReferences: [
              { table: 'reviews', id: review.id, field: 'review_id' }
            ]
          },
          {
            moderationRecommendation: {
              action: decision.action,
              reason: decision.reason,
              confidence: decision.confidence,
              source: decisionSource
            },
            finalAction: null,
            operatorVisibleState: {
              outputType:
                effectiveMode === 'shadow' ? 'shadow_evaluation' : 'draft_recommendation',
              finalState: 'pending_operator_approval',
              reviewStateChanged: false
            },
            review: {
              businessId: review.business_id,
              rating: review.rating
            },
            shadowTrace: effectiveMode === 'shadow'
          }
        )
      }, { onConflict: 'review_id' })

    processed += 1
  }

  return {
    processed,
    autoApproved,
    autoRejected,
    recommendedApprove,
    recommendedReject,
    manualFlagged
  }
}
