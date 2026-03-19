import { buildAiAutomationAuditEvent } from './ai-automation'
import { getAiAutomationRuntimeResolution } from './ai-rollouts'
import { recordLatencyMetric } from './telemetryLatency'

export type ScaffoldReviewQueueItem = {
  id: number
  name: string
  verification_status: string
  is_scaffolded: boolean
  bio: string | null
}

export type OperatorScaffoldReviewGuidanceCandidate = {
  summary: string
  queueSize: number
  sample: Array<{
    businessId: number
    checks: string[]
  }>
}

export type OperatorScaffoldReviewGuidanceForListing = {
  checks: string[]
  nextAction: string
}

export type OperatorScaffoldReviewGuidanceShadowTrace = {
  aiAutomationAudit: Record<string, unknown>
  advisoryCandidate?: OperatorScaffoldReviewGuidanceCandidate
  visibleOutcome: {
    queuePayloadChanged: false
    scaffoldApprovalBehaviourChanged: false
    publicationOutcomeChanged: false
    verificationOutcomeChanged: false
    featuredOutcomeChanged: false
    spotlightOutcomeChanged: false
    monetizationOutcomeChanged: false
    rankingOutcomeChanged: false
  }
}

export function buildChecksForListing(listing: Pick<ScaffoldReviewQueueItem, 'name' | 'bio'>): string[] {
  const checks: string[] = []
  const bio = listing.bio?.trim() ?? ''

  if (bio.length === 0) {
    checks.push('Bio is missing. Confirm service scope, experience, and any credentials before approving.')
  } else if (bio.length < 80) {
    checks.push('Bio is very short. Confirm services offered, locality, and contact expectations before approving.')
  }

  const lowerName = listing.name.trim().toLowerCase()
  if (lowerName.includes('test') || lowerName.includes('demo')) {
    checks.push('Business name looks like a placeholder. Confirm this is not a test or spam record.')
  }

  if (checks.length === 0) {
    checks.push('No obvious content gaps detected from the scaffold snapshot. Confirm details match the business website before approving.')
  }

  return checks.slice(0, 3)
}

export function buildOperatorScaffoldReviewGuidanceForListing(
  listing: Pick<ScaffoldReviewQueueItem, 'name' | 'bio'>
): OperatorScaffoldReviewGuidanceForListing {
  const checks = buildChecksForListing(listing)
  const combined = checks.join(' ').toLowerCase()

  const nextAction = combined.includes('placeholder') || combined.includes('test or spam')
    ? 'Confirm the listing is a real business first. Reject it or keep it pending if the record still looks like a placeholder or spam.'
    : combined.includes('bio is missing') || combined.includes('bio is very short')
      ? 'Check the business website or source record for services, locality, and trust signals before approving. Keep it pending if the listing is still too thin.'
      : 'Use the guidance checks below, then approve only if the scaffolded listing looks real, complete, and safe to publish.'

  return {
    checks,
    nextAction,
  }
}

export function buildOperatorScaffoldReviewGuidanceCandidate(
  queue: ScaffoldReviewQueueItem[]
): OperatorScaffoldReviewGuidanceCandidate | null {
  if (!queue.length) return null

  const sample = queue.slice(0, 5).map((listing) => ({
    businessId: listing.id,
    checks: buildOperatorScaffoldReviewGuidanceForListing({ name: listing.name, bio: listing.bio }).checks
  }))

  return {
    summary:
      'Shadow-only operator guidance candidate generated for scaffold-review. This does not change the scaffold queue payload or any approval outcomes.',
    queueSize: queue.length,
    sample
  }
}

function buildShadowTrace(input: {
  effectiveMode: 'shadow'
  resultState: 'result' | 'no_result' | 'error'
  decisionSource: 'deterministic'
  errorMessage: string | null
  candidate: OperatorScaffoldReviewGuidanceCandidate | null
  queueSize: number
}): OperatorScaffoldReviewGuidanceShadowTrace {
  const summary =
    input.resultState === 'result'
      ? `Shadow scaffold-review guidance recorded for ${input.queueSize} scaffolded listing${input.queueSize === 1 ? '' : 's'} while approval, publication, verification, featured/spotlight, billing, and ranking outcomes remained deterministic.`
      : input.resultState === 'error'
        ? 'Shadow scaffold-review guidance failed while approval, publication, verification, featured/spotlight, billing, and ranking outcomes remained deterministic.'
        : 'Shadow scaffold-review guidance produced no candidate (empty queue) while approval, publication, verification, featured/spotlight, billing, and ranking outcomes remained deterministic.'

  return {
    aiAutomationAudit: buildAiAutomationAuditEvent({
      workflowFamily: 'scaffold_review_guidance',
      actorClass: 'operator',
      effectiveMode: input.effectiveMode,
      approvalState: 'not_required',
      resultState: input.resultState,
      decisionSource: input.decisionSource,
      routeOrJob: '/api/admin/scaffolded',
      summary,
      errorMessage: input.errorMessage,
      resultingRecordReferences: [
        {
          table: 'latency_metrics',
          field: 'metadata.operatorScaffoldReviewGuidance'
        }
      ],
      notes: [
        'Operator-side workflow only; this is not a business-owned listing-quality surface.',
        'Shadow guidance does not change the visible scaffold queue payload.',
        'Shadow guidance does not change scaffold approval behaviour or any downstream state.'
      ]
    }),
    ...(input.candidate ? { advisoryCandidate: input.candidate } : {}),
    visibleOutcome: {
      queuePayloadChanged: false,
      scaffoldApprovalBehaviourChanged: false,
      publicationOutcomeChanged: false,
      verificationOutcomeChanged: false,
      featuredOutcomeChanged: false,
      spotlightOutcomeChanged: false,
      monetizationOutcomeChanged: false,
      rankingOutcomeChanged: false
    }
  }
}

export async function recordOperatorScaffoldReviewGuidanceShadowTrace(input: {
  route: string
  durationMs: number
  scaffoldedQueue: ScaffoldReviewQueueItem[]
  errorMessage?: string | null
}): Promise<void> {
  const rolloutResolution = await getAiAutomationRuntimeResolution('scaffold_review_guidance')
  if (rolloutResolution.finalRuntimeMode !== 'shadow') return

  let resultState: 'result' | 'no_result' | 'error' = 'no_result'
  let candidate: OperatorScaffoldReviewGuidanceCandidate | null = null
  let errorMessage: string | null = input.errorMessage ?? null

  if (errorMessage) {
    resultState = 'error'
  }

  try {
    if (resultState !== 'error') {
      candidate = buildOperatorScaffoldReviewGuidanceCandidate(input.scaffoldedQueue)
      resultState = candidate ? 'result' : 'no_result'
    }
    if (resultState === 'no_result' && input.scaffoldedQueue.length === 0) {
      errorMessage = errorMessage ?? 'No scaffolded listings were returned for review.'
    }
  } catch (error: any) {
    resultState = 'error'
    candidate = null
    errorMessage = errorMessage ?? (error?.message || 'Unknown scaffold-review guidance error')
  }

  await recordLatencyMetric({
    area: 'admin_scaffolded_queue',
    route: input.route,
    durationMs: input.durationMs,
    success: resultState !== 'error',
    statusCode: resultState === 'error' ? 500 : 200,
    metadata: {
      operatorScaffoldReviewGuidance: buildShadowTrace({
        effectiveMode: 'shadow',
        resultState,
        decisionSource: 'deterministic',
        errorMessage,
        candidate,
        queueSize: input.scaffoldedQueue.length
      }),
      aiProvider: 'deterministic',
      aiModel: null,
      aiPromptVersion: 'operator-scaffold-review-guidance-v1',
      shadowTrace: true
    }
  })
}
