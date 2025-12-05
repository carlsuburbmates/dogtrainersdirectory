import { supabaseAdmin } from './supabase'
import { callLlm } from './llm'

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

  const pendingReviews: ReviewRecord[] = reviews as ReviewRecord[]
  const existingIds = pendingReviews.map((review) => review.id)
  const { data: existingDecisions } = await supabaseAdmin
    .from('ai_review_decisions')
    .select('review_id')
    .in('review_id', existingIds)

  type ExistingDecisionRow = { review_id: number }
  const decisionRows: ExistingDecisionRow[] = existingDecisions ?? []
  const alreadyDecided = new Set(decisionRows.map((item) => item.review_id))

  let autoApproved = 0
  let autoRejected = 0
  let manualFlagged = 0

  for (const review of pendingReviews) {
    if (alreadyDecided.has(review.id)) continue

    // Default heuristic decision (fallback)
    let decision = evaluateReview(review)
    let usedLlm = false
    let llmRaw: unknown = null
    let llmProvider: string | null = null
    let llmModel: string | null = null

    // Only attempt LLM moderation if a provider is configured and keys are present
    try {
      const prompt = `Review title: ${review.title ?? ''}\nReview content: ${review.content ?? ''}\nRating: ${review.rating}\nReviewer: ${review.reviewer_name}\n
Return a JSON object with shape { action: 'auto_approve'|'auto_reject'|'manual', reason: string, confidence: number } where confidence is 0.0-1.0 and a short explanation in reason.`

      const llm = await callLlm({
        purpose: 'moderation',
        systemPrompt:
          'You are a concise content moderation assistant that classifies user product/service reviews into one of: auto_approve, auto_reject, or manual. Be strict with spam/bad content. Output exactly a JSON object as described.',
        userPrompt: prompt,
        responseFormat: 'json',
        temperature: 0,
        maxTokens: 400
      })

      llmRaw = llm.raw
      llmProvider = llm.provider ?? null
      llmModel = llm.model ?? null

      if (llm.ok && llm.json && typeof llm.json === 'object') {
        // Expecting { action, reason, confidence }
        const parsed: any = llm.json as any
        if (
          parsed.action &&
          (parsed.action === 'auto_approve' || parsed.action === 'auto_reject' || parsed.action === 'manual')
        ) {
          decision = {
            action: parsed.action,
            reason: parsed.reason || 'LLM moderation',
            confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6))
          }
          usedLlm = true
        } else {
          console.warn('moderatePendingReviews: unexpected LLM moderation shape, falling back to heuristic', parsed)
        }
      } else if (llm.reason === 'ai_disabled') {
        // AI not available — fall back to heuristic and continue
        // Nothing to do — decision stays as heuristic
      } else if (!llm.ok) {
        console.error('moderatePendingReviews: LLM call failed, falling back to heuristics', llm.errorMessage)
      }
    } catch (err) {
      console.error('moderatePendingReviews: LLM moderation attempt threw — using heuristic', err)
    }

    // Perform the DB updates but be tolerant — don't let DB shape issues crash the loop
    try {
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
    } catch (err) {
      console.warn('moderatePendingReviews: write to reviews table failed (ignored)', err)
    }

    try {
      // Try to persist AI decision metadata — if schema missing, ignore and move on
      const upsertBody: any = {
        review_id: review.id,
        ai_decision: decision.action,
        confidence: decision.confidence,
        reason: decision.reason
      }

      // If we used the LLM, include provider/model/raw if available (best-effort)
      if (usedLlm) {
        upsertBody.ai_provider = llmProvider
        upsertBody.ai_model = llmModel
        upsertBody.raw_response = llmRaw ?? null
      }

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
