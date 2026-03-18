export interface ReviewLoopReview {
  id: number
  created_at: string
  is_approved?: boolean
  is_rejected?: boolean
  ai_decision?: string | null
  ai_reason?: string | null
  ai_confidence?: number | null
  ai_output_type?: string | null
  ai_final_action?: string | null
  ai_final_reason?: string | null
}

export interface ReviewLoopPresentation {
  stageLabel: string
  stageClassName: string
  nextAction: string
  operatorNote: string
  priority: number
}

export interface ReviewLoopSummary {
  pendingTotal: number
  draftRejectCount: number
  draftApproveCount: number
  shadowCount: number
  manualCount: number
  completedCount: number
  summary: string
}

function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function isRejectRecommendation(decision?: string | null) {
  return decision === 'auto_reject' || decision === 'manual_reject'
}

function isApproveRecommendation(decision?: string | null) {
  return decision === 'auto_approve' || decision === 'manual_approve'
}

export function getReviewLoopPresentation(review: ReviewLoopReview): ReviewLoopPresentation {
  const isCompleted = Boolean(review.is_approved || review.is_rejected || review.ai_final_action)

  if (isCompleted) {
    return {
      stageLabel: 'Completed',
      stageClassName: 'bg-slate-100 text-slate-800 border-slate-200',
      nextAction: 'No further moderation action is needed unless a new policy concern is raised.',
      operatorNote: 'Final moderation outcome was already confirmed by an operator.',
      priority: 6,
    }
  }

  if (review.ai_output_type === 'shadow_evaluation') {
    if (isRejectRecommendation(review.ai_decision)) {
      return {
        stageLabel: 'Shadow review',
        stageClassName: 'bg-amber-50 text-amber-900 border-amber-200',
        nextAction:
          'Read the shadow recommendation, then reject only if the spam or abuse concern is confirmed. The live review state is still pending.',
        operatorNote: 'Shadow output is advisory only and did not change the live review state.',
        priority: 3,
      }
    }

    if (isApproveRecommendation(review.ai_decision)) {
      return {
        stageLabel: 'Shadow review',
        stageClassName: 'bg-amber-50 text-amber-900 border-amber-200',
        nextAction:
          'Read the shadow recommendation, then approve only if the review looks genuine and policy-safe. The live review state is still pending.',
        operatorNote: 'Shadow output is advisory only and did not change the live review state.',
        priority: 3,
      }
    }

    return {
      stageLabel: 'Shadow review',
      stageClassName: 'bg-amber-50 text-amber-900 border-amber-200',
      nextAction:
        'Review this item manually and keep it pending until you are satisfied. Shadow output did not make a final moderation call.',
      operatorNote: 'Shadow output is advisory only and did not change the live review state.',
      priority: 3,
    }
  }

  if (isRejectRecommendation(review.ai_decision)) {
    return {
      stageLabel: 'Reject-ready draft',
      stageClassName: 'bg-rose-50 text-rose-800 border-rose-200',
      nextAction:
        'Check the flagged content against policy, then reject only if the spam, abuse, or trust concern is confirmed.',
      operatorNote: 'Draft recommendation is internal guidance only. Final rejection still requires your explicit action.',
      priority: 1,
    }
  }

  if (isApproveRecommendation(review.ai_decision)) {
    return {
      stageLabel: 'Approve-ready draft',
      stageClassName: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      nextAction:
        'Confirm the review looks genuine, relevant, and policy-safe, then approve it explicitly.',
      operatorNote: 'Draft recommendation is internal guidance only. Final approval still requires your explicit action.',
      priority: 2,
    }
  }

  if (review.ai_reason) {
    return {
      stageLabel: 'Manual check',
      stageClassName: 'bg-blue-50 text-blue-800 border-blue-200',
      nextAction:
        'Use the draft notes to inspect the review, then choose approve or reject explicitly once you have checked the content.',
      operatorNote: 'The system has provided draft context, but it has not approved or rejected this review.',
      priority: 4,
    }
  }

  return {
    stageLabel: 'Manual check',
    stageClassName: 'bg-slate-100 text-slate-800 border-slate-200',
    nextAction:
      'Review the content manually and decide whether to approve or reject it. No draft recommendation is available for this item.',
    operatorNote: 'No assistive recommendation is available, so the moderation decision remains fully manual.',
    priority: 5,
  }
}

export function compareReviewLoopPriority(a: ReviewLoopReview, b: ReviewLoopReview) {
  const aPresentation = getReviewLoopPresentation(a)
  const bPresentation = getReviewLoopPresentation(b)

  if (aPresentation.priority !== bPresentation.priority) {
    return aPresentation.priority - bPresentation.priority
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export function summariseReviewLoop(reviews: ReviewLoopReview[]): ReviewLoopSummary {
  let draftRejectCount = 0
  let draftApproveCount = 0
  let shadowCount = 0
  let manualCount = 0
  let completedCount = 0

  for (const review of reviews) {
    const presentation = getReviewLoopPresentation(review)

    if (presentation.stageLabel === 'Completed') {
      completedCount += 1
    } else if (presentation.stageLabel === 'Reject-ready draft') {
      draftRejectCount += 1
    } else if (presentation.stageLabel === 'Approve-ready draft') {
      draftApproveCount += 1
    } else if (presentation.stageLabel === 'Shadow review') {
      shadowCount += 1
    } else {
      manualCount += 1
    }
  }

  const pendingTotal = reviews.length - completedCount

  if (pendingTotal === 0) {
    return {
      pendingTotal,
      draftRejectCount,
      draftApproveCount,
      shadowCount,
      manualCount,
      completedCount,
      summary: 'The weekly moderation exception loop is clear for the current filters.',
    }
  }

  const steps = []

  if (draftRejectCount > 0) {
    steps.push(`Start with ${pluralise(draftRejectCount, 'reject-ready draft')}`)
  }
  if (draftApproveCount > 0) {
    steps.push(`then clear ${pluralise(draftApproveCount, 'approve-ready draft')}`)
  }
  if (manualCount > 0) {
    steps.push(`then finish ${pluralise(manualCount, 'manual check')}`)
  }

  let summary = steps.join(', ')
  if (!summary) {
    summary = `Review ${pluralise(pendingTotal, 'pending moderation item')} in operator order.`
  } else {
    summary += '.'
  }

  if (shadowCount > 0) {
    summary += ` ${pluralise(shadowCount, 'shadow-only item')} still need operator review, but the visible moderation state did not change.`
  }

  return {
    pendingTotal,
    draftRejectCount,
    draftApproveCount,
    shadowCount,
    manualCount,
    completedCount,
    summary,
  }
}
