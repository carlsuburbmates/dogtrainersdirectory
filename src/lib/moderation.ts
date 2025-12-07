import { supabaseAdmin } from './supabase'
import { runAiOperation, AiResult } from './llm'

export type ReviewRecord = {
  id: number
  business_id: number
  reviewer_name: string
  rating: number
  title?: string | null
  content?: string | null
  created_at: string
}

export type ModerationAction = 'auto_approve' | 'auto_reject' | 'manual';

const SPAM_PATTERNS = [/http/gi, /www\./gi, /buy now/gi, /call\s+\d/gi, /viagra/gi, /crypto/gi]
const SAFE_PHRASES = ['great', 'helped', 'training', 'session', 'recommend', 'patient', 'kind', 'progress']

const evaluateReview = (review: ReviewRecord): { action: ModerationAction; reason: string; confidence: number } => {
  const body = `${review.title ?? ''} ${review.content ?? ''}`.trim().toLowerCase()
  if (!body) {
    return {
      action: 'manual',
      reason: 'Empty review body requires manual validation',
      confidence: 0.4
    }
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(body))) {
    return {
      action: 'auto_reject',
      reason: 'Contains spam or outbound link content',
      confidence: 0.92
    }
  }

  if (review.rating >= 4 && body.length > 60 && SAFE_PHRASES.some((word) => body.includes(word))) {
    return {
      action: 'auto_approve',
      reason: 'Detailed positive feedback with no risky terms',
      confidence: 0.88
    }
  }

  if (review.rating <= 2) {
    return {
      action: 'manual',
      reason: 'Low-star review, keep for human moderation',
      confidence: 0.55
    }
  }

  return {
    action: 'manual',
    reason: 'Borderline sentiment — leaving for manual moderation',
    confidence: 0.6
  }
}

type ModerateOptions =
  | { reviews: ReviewRecord[]; limit?: number }
  | { reviews?: undefined; limit: number }

export async function moderatePendingReviews(options: ModerateOptions = { limit: 30 }) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('moderatePendingReviews: SUPABASE_SERVICE_ROLE_KEY not set — skipping moderation operations')
    return { processed: 0, autoApproved: 0, autoRejected: 0, manualFlagged: 0 }
  }

  const limit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : 30

  let pendingReviews: ReviewRecord[] | null = Array.isArray(options.reviews) ? options.reviews : null

  if (!pendingReviews) {
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

    pendingReviews = reviews as ReviewRecord[]
  }

  const reviewsToProcess = pendingReviews

  if (!reviewsToProcess?.length) {
    return { processed: 0, autoApproved: 0, autoRejected: 0, manualFlagged: 0 }
  }
  const existingIds = reviewsToProcess.map((review) => review.id)
  const { data: existingDecisions } = await supabaseAdmin
    .from('ai_review_decisions')
    .select('review_id')
    .in('review_id', existingIds)

  const alreadyDecided = new Set(existingDecisions?.map((item: { review_id: number }) => item.review_id))

  let autoApproved = 0
  let autoRejected = 0
  let manualFlagged = 0

  for (const review of reviewsToProcess) {
    if (alreadyDecided.has(review.id)) continue

    const prompt = `Review title: ${review.title ?? ''}\nReview content: ${review.content ?? ''}\nRating: ${review.rating}\nReviewer: ${review.reviewer_name}\n
Return a JSON object with shape { action: 'auto_approve'|'auto_reject'|'manual', reason: string, confidence: number } where confidence is 0.0-1.0 and a short explanation in reason.`

    const aiResult: AiResult<ModerationAction> = await runAiOperation<ModerationAction>({
      purpose: 'moderation',
      llmArgs: {
        systemPrompt: 'You are a concise content moderation assistant that classifies user product/service reviews into one of: auto_approve, auto_reject, or manual. Be strict with spam/bad content. Output exactly a JSON object as described.',
        userPrompt: prompt,
        responseFormat: 'json',
        temperature: 0,
        maxTokens: 400
      },
      heuristicActions: async () => evaluateReview(review),
      validator: (llm) => {
        if (!llm.data || typeof llm.data !== 'object') return null
        const p = llm.data as any
        if (['auto_approve', 'auto_reject', 'manual'].includes(p.action)) {
          return {
            action: p.action,
            reason: p.reason || 'LLM decision',
            confidence: Number(p.confidence) || 0.6
          }
        }
        return null
      }
    })

    // 1. Enact the decision (tolerant of DB errors)
    try {
      // ... (keep existing enactment logic)
      if (aiResult.action === 'auto_approve') {
        await supabaseAdmin
          .from('reviews')
          .update({ is_approved: true, rejection_reason: null, is_rejected: false })
          .eq('id', review.id)
        autoApproved += 1
      } else if (aiResult.action === 'auto_reject') {
        await supabaseAdmin
          .from('reviews')
          .update({ is_rejected: true, rejection_reason: aiResult.reason })
          .eq('id', review.id)
        autoRejected += 1
      } else {
        manualFlagged += 1
      }
    } catch (err) {
      console.warn('moderatePendingReviews: write to reviews table failed (ignored)', err)
    }

    // 2. Persist decision metadata
    try {
      const upsertBody: any = {
        review_id: review.id,
        ai_decision: aiResult.action,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        // New Metadata
        decision_source: aiResult.source === 'heuristic' ? 'deterministic' : 
                         aiResult.source === 'manual' ? 'manual_override' : 
                         aiResult.source || 'deterministic',
        ai_mode: aiResult.meta?.mode || 'live',
        ai_provider: aiResult.meta?.llmProvider || 'unknown',
        ai_model: aiResult.meta?.model || 'unknown',
        raw_response: aiResult.llm_log?.raw ?? null
      }
      
      // If we are in shadow mode, we might want to explicitly note that? 
      // The table doesn't have a 'mode' column, but we can append to reason? 
      // Or just rely on the fact that if action != manual and confidence is high but source is heuristic... 
      // The current schema is minimal. Let's just store what we have.
      // Wait, 'ai_review_decisions' table is specifically for AI decisions. 
      // If source is heuristic, should we store it?
      // Yes, because we want to see what the system *did*.
      
      await supabaseAdmin.from('ai_review_decisions').upsert(upsertBody, { onConflict: 'review_id' })
    } catch (err) {
      console.warn('moderatePendingReviews: upsert to ai_review_decisions failed (ignored)', err)
    }
  }

  return {
    processed: autoApproved + autoRejected + manualFlagged,
    autoApproved,
    autoRejected,
    manualFlagged
  }
}
