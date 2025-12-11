import { supabaseAdmin } from './supabase'

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

export async function moderatePendingReviews(limit = 30) {
  // If the server service role key is not present, don't attempt admin operations
  // (this can happen in developer machines pointing to remote Supabase without a service-role).
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('moderatePendingReviews: SUPABASE_SERVICE_ROLE_KEY not set — skipping moderation operations')
    return { processed: 0, autoApproved: 0, autoRejected: 0, manualFlagged: 0 }
  }

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('id, business_id, reviewer_name, rating, title, content, created_at')
    .eq('is_approved', false)
    .eq('is_rejected', false)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error || !reviews?.length) {
    return { processed: 0, autoApproved: 0, autoRejected: 0, manualFlagged: 0 }
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
  let manualFlagged = 0

  for (const review of reviewsTyped) {
    if (alreadyDecided.has(review.id)) continue
    const decision = evaluateReview(review)

    if (decision.action === 'auto_approve') {
      await supabaseAdmin
        .from('reviews')
        .update({ is_approved: true, rejection_reason: null, is_rejected: false })
        .eq('id', review.id)
      autoApproved += 1
    } else if (decision.action === 'auto_reject') {
      await supabaseAdmin
        .from('reviews')
        .update({ is_rejected: true, rejection_reason: decision.reason })
        .eq('id', review.id)
      autoRejected += 1
    } else {
      manualFlagged += 1
    }

    await supabaseAdmin
      .from('ai_review_decisions')
      .upsert({
        review_id: review.id,
        ai_decision: decision.action,
        confidence: decision.confidence,
        reason: decision.reason
      }, { onConflict: 'review_id' })
  }

  return {
    processed: autoApproved + autoRejected + manualFlagged,
    autoApproved,
    autoRejected,
    manualFlagged
  }
}
