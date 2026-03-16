import { supabaseAdmin } from '@/lib/supabase'
import {
  describeModeSource,
  getAiAutomationOperatorControl,
  getAiAutomationRolloutStateSourceSummary,
  getAiAutomationVisibility,
  type AiAutomationRolloutResolution,
  type AiAutomationVisibility,
  type AiAutomationWorkflow
} from '@/lib/ai-automation'
import { getAiAutomationRuntimeResolutions } from '@/lib/ai-rollouts'
import {
  summarizeBusinessListingQualityHealth,
  summarizeDigestHealth,
  summarizeModerationHealth,
  summarizeOnboardingHealth,
  summarizeScheduledShadowEvidence,
  summarizeScaffoldReviewGuidanceHealth,
  summarizeTriageHealth,
  summarizeVerificationHealth,
  toAiPercentage,
  type NormalizedDecisionCounts
} from './model'
import { RolloutControls } from './rollout-controls'

type WithChildren = { children: React.ReactNode }
type WithChildrenAndClassName = { children: React.ReactNode; className?: string }

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={['rounded-xl border border-gray-200 bg-white shadow-sm', className].filter(Boolean).join(' ')}>{children}</div>
}

function CardHeader({ children, className }: WithChildrenAndClassName) {
  return <div className={['border-b border-gray-100 px-5 py-4', className].filter(Boolean).join(' ')}>{children}</div>
}

function CardTitle({ children, className }: WithChildrenAndClassName) {
  return <h2 className={['text-lg font-semibold text-gray-950', className].filter(Boolean).join(' ')}>{children}</h2>
}

function CardDescription({ children, className }: WithChildrenAndClassName) {
  return <p className={['mt-1 text-sm text-gray-600', className].filter(Boolean).join(' ')}>{children}</p>
}

function CardContent({ children, className }: WithChildrenAndClassName) {
  return <div className={['px-5 py-4', className].filter(Boolean).join(' ')}>{children}</div>
}

function Badge({
  children,
  tone = 'neutral'
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success'
}) {
  const tones: Record<string, string> = {
    neutral: 'border-gray-300 bg-white text-gray-700',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  return (
    <span className={['inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone]].join(' ')}>
      {children}
    </span>
  )
}

type WorkflowStatusCard = {
  workflow: AiAutomationWorkflow
  label: string
  resolution: AiAutomationRolloutResolution
  visibility: AiAutomationVisibility
  lastTrace: string | null
  counts: NormalizedDecisionCounts
  shadowTraceCount: number
  errors24h: number
  disagreements24h: number
  note: string
  readiness: {
    label: string
    tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success'
    note: string
    observed: number
    required: number
  }
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return 'Never'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatTimestamp(isoString: string | null): string {
  if (!isoString) return 'Not reviewed yet'
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne'
  }).format(new Date(isoString))
}

function toneForVisibility(state: AiAutomationVisibility['state']) {
  switch (state) {
    case 'connected':
      return 'success'
    case 'degraded':
      return 'warning'
    default:
      return 'neutral'
  }
}

function toneForMode(mode: string) {
  switch (mode) {
    case 'live':
      return 'success'
    case 'shadow':
      return 'info'
    default:
      return 'neutral'
  }
}

function toneForRolloutState(state: AiAutomationRolloutResolution['rolloutState']) {
  switch (state) {
    case 'controlled_live':
      return 'success'
    case 'shadow_live_ready':
      return 'info'
    case 'paused_after_review':
    case 'disabled':
      return 'warning'
    case 'shadow_only':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function buildReadiness(
  resolution: AiAutomationRolloutResolution,
  input: {
    observed: number
    required: number
    hasErrors: boolean
    ready: boolean
    note: string
  }
): WorkflowStatusCard['readiness'] {
  if (resolution.shadowCapped) {
    return {
      label: 'Shadow-capped by canon',
      tone: 'neutral',
      note: 'This workflow cannot move beyond shadow in Phase 12.',
      observed: 0,
      required: 0
    }
  }

  if (resolution.rolloutStateSource === 'registry_unavailable') {
    return {
      label: 'Registry unavailable',
      tone: 'warning',
      note:
        resolution.rolloutRegistryNote ??
        'Persisted rollout control state could not be read. The supervision surface is showing the implicit fallback state only.',
      observed: input.observed,
      required: input.required
    }
  }

  if (!resolution.controlledLiveCandidate) {
    return {
      label: 'Later candidate',
      tone: 'neutral',
      note: 'This workflow is live-capable in canon but is not in the current controlled-live cycle.',
      observed: input.observed,
      required: input.required
    }
  }

  if (resolution.rolloutState === 'controlled_live') {
    return {
      label: 'Controlled live enabled',
      tone: 'success',
      note: 'Controlled live is active under operator supervision. Keep rollback guidance visible.',
      observed: input.observed,
      required: input.required
    }
  }

  if (resolution.rolloutState === 'paused_after_review') {
    return {
      label: 'Paused after review',
      tone: 'warning',
      note: 'A reviewed pause is active. Investigate before returning to shadow or live review.',
      observed: input.observed,
      required: input.required
    }
  }

  if (resolution.rolloutState === 'disabled') {
    return {
      label: 'Disabled',
      tone: 'warning',
      note: 'Rollout is disabled. Return to shadow before collecting more evidence.',
      observed: input.observed,
      required: input.required
    }
  }

  if (resolution.rolloutState === 'shadow_live_ready') {
    return {
      label: 'Ready for review',
      tone: 'info',
      note: 'Evidence threshold is met, but human approval is still required before any controlled-live move.',
      observed: input.observed,
      required: input.required
    }
  }

  if (input.hasErrors) {
    return {
      label: 'Not ready',
      tone: 'danger',
      note: input.note,
      observed: input.observed,
      required: input.required
    }
  }

  if (input.ready) {
    return {
      label: 'Evidence ready',
      tone: 'info',
      note: input.note,
      observed: input.observed,
      required: input.required
    }
  }

  return {
    label: 'Collecting shadow evidence',
    tone: 'neutral',
    note: input.note,
    observed: input.observed,
    required: input.required
  }
}

async function buildWorkflowStatusCards(): Promise<WorkflowStatusCard[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const llmConfigured = Boolean(process.env.ZAI_API_KEY)
  const resolutions = new Map(
    (await getAiAutomationRuntimeResolutions()).map((resolution) => [resolution.workflow, resolution])
  )

  const [
    triageRows,
    moderationRows,
    verificationRows,
    digestRows,
    onboardingRows,
    businessListingRows,
    scaffoldRows
  ] = await Promise.all([
    supabaseAdmin
      .from('emergency_triage_logs')
      .select('created_at, ai_mode, decision_source, classification, metadata')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('ai_review_decisions')
      .select('created_at, decision_source')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('emergency_resource_verification_events')
      .select('created_at, details')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('daily_ops_digests')
      .select('created_at, ai_mode, decision_source, ci_summary')
      .order('created_at', { ascending: false })
      .limit(14),
    supabaseAdmin
      .from('latency_metrics')
      .select('created_at, metadata')
      .eq('area', 'onboarding_api')
      .eq('route', '/api/onboarding')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('latency_metrics')
      .select('created_at, metadata')
      .eq('area', 'business_profile_api')
      .eq('route', '/api/account/business/[businessId]')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('latency_metrics')
      .select('created_at, metadata')
      .eq('area', 'admin_scaffolded_queue')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
  ])

  const triageSummary = triageRows.error
    ? null
    : summarizeTriageHealth(triageRows.data ?? [])
  const moderationSummary = moderationRows.error
    ? null
    : summarizeModerationHealth(moderationRows.data ?? [])
  const verificationSummary = verificationRows.error
    ? null
    : summarizeVerificationHealth(verificationRows.data ?? [])
  const digestSummary = digestRows.error
    ? null
    : summarizeDigestHealth(digestRows.data ?? [])
  const onboardingSummary = onboardingRows.error
    ? null
    : summarizeOnboardingHealth(onboardingRows.data ?? [])
  const businessListingSummary = businessListingRows.error
    ? null
    : summarizeBusinessListingQualityHealth(businessListingRows.data ?? [])
  const scaffoldSummary = scaffoldRows.error
    ? null
    : summarizeScaffoldReviewGuidanceHealth(scaffoldRows.data ?? [])

  const scheduledEvidence = digestRows.error
    ? { observedRuns: 0, requiredRuns: 7, ready: false, note: 'Digest audit traces are not available yet.' }
    : summarizeScheduledShadowEvidence(digestRows.data ?? [], 7)
  const digestEvidenceNote = `${scheduledEvidence.note} Reviewable evidence comes from distinct persisted /api/admin/ops-digest runs in a service-role-backed environment. Cached reads do not count as new evidence.`

  const buildCard = (
    workflow: AiAutomationWorkflow,
    label: string,
    input:
      | {
          counts: NormalizedDecisionCounts
          shadowTraceCount: number
          errors24h: number
          disagreements24h?: number
          lastTrace: string | null
          note: string
          auditConnected?: boolean
          readinessObserved?: number
          readinessRequired?: number
          readinessReady?: boolean
          readinessNote?: string
        }
      | null
  ): WorkflowStatusCard => {
    const resolution = resolutions.get(workflow)
    if (!resolution) {
      throw new Error(`Missing runtime resolution for workflow ${workflow}`)
    }

    return {
      workflow,
      label,
      resolution,
      visibility: getAiAutomationVisibility(resolution, {
        auditConnected: input?.auditConnected ?? false,
        llmConfigured
      }),
      lastTrace: input?.lastTrace ?? null,
      counts:
        input?.counts ?? {
          aiDecisions: 0,
          deterministicDecisions: 0,
          manualOverrides: 0
        },
      shadowTraceCount: input?.shadowTraceCount ?? 0,
      errors24h: input?.errors24h ?? 0,
      disagreements24h: input?.disagreements24h ?? 0,
      note: input?.note ?? 'Audit traces are not available yet.',
      readiness: buildReadiness(resolution, {
        observed: input?.readinessObserved ?? 0,
        required: input?.readinessRequired ?? 0,
        hasErrors: (input?.errors24h ?? 0) > 0,
        ready: input?.readinessReady ?? false,
        note: input?.readinessNote ?? 'No readiness evidence is available yet.'
      })
    }
  }

  return [
    buildCard('triage', 'Emergency Triage', triageSummary
      ? {
          counts: triageSummary.counts,
          shadowTraceCount:
            triageSummary.shadowTraceCount + triageSummary.handoffShadowTraceCount,
          errors24h: triageSummary.shadowErrorCount + triageSummary.handoffShadowErrorCount,
          disagreements24h: triageSummary.shadowDisagreementCount,
          lastTrace: triageSummary.lastTrace,
          note: triageSummary.note,
          auditConnected: true,
          readinessObserved: triageSummary.shadowTraceCount,
          readinessRequired: 25,
          readinessReady: triageSummary.shadowTraceCount >= 25,
          readinessNote:
            triageSummary.shadowTraceCount >= 25
              ? 'Minimum request-driven shadow evidence is available. Human review is still required before any live move.'
              : 'Need at least 25 recent shadow traces before triage can be reviewed for any future live change.'
        }
      : null),
    buildCard('moderation', 'Review Moderation', moderationSummary
      ? {
          counts: moderationSummary.counts,
          shadowTraceCount: moderationSummary.shadowTraceCount,
          errors24h: moderationSummary.errorCount,
          lastTrace: moderationSummary.lastTrace,
          note: moderationSummary.note,
          auditConnected: true
        }
      : null),
    buildCard('verification', 'Resource Verification', verificationSummary
      ? {
          counts: verificationSummary.counts,
          shadowTraceCount: verificationSummary.shadowTraceCount,
          errors24h: verificationSummary.errorCount,
          lastTrace: verificationSummary.lastTrace,
          note: verificationSummary.note,
          auditConnected: true
        }
      : null),
    buildCard('ops_digest', 'Ops Digest', digestSummary
      ? {
          counts: digestSummary.counts,
          shadowTraceCount: digestSummary.shadowTraceCount,
          errors24h: digestSummary.errorCount,
          lastTrace: digestSummary.lastTrace,
          note: digestSummary.note,
          auditConnected: true,
          readinessObserved: scheduledEvidence.observedRuns,
          readinessRequired: scheduledEvidence.requiredRuns,
          readinessReady: scheduledEvidence.ready,
          readinessNote: digestEvidenceNote
        }
      : null),
    buildCard('onboarding', 'Business Onboarding', onboardingSummary
      ? {
          counts: onboardingSummary.counts,
          shadowTraceCount: onboardingSummary.shadowTraceCount,
          errors24h: onboardingSummary.errorCount,
          lastTrace: onboardingSummary.lastTrace,
          note: onboardingSummary.note,
          auditConnected: true
        }
      : null),
    buildCard('business_listing_quality', 'Business Listing Quality', businessListingSummary
      ? {
          counts: businessListingSummary.counts,
          shadowTraceCount: businessListingSummary.shadowTraceCount,
          errors24h: businessListingSummary.errorCount,
          lastTrace: businessListingSummary.lastTrace,
          note: businessListingSummary.note,
          auditConnected: true
        }
      : null),
    buildCard('scaffold_review_guidance', 'Scaffold Review Guidance', scaffoldSummary
      ? {
          counts: scaffoldSummary.counts,
          shadowTraceCount: scaffoldSummary.shadowTraceCount,
          errors24h: scaffoldSummary.errorCount,
          lastTrace: scaffoldSummary.lastTrace,
          note: scaffoldSummary.note,
          auditConnected: true
        }
      : null)
  ]
}

export default async function AIHealthPage() {
  let cards: WorkflowStatusCard[]
  try {
    cards = await buildWorkflowStatusCards()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return (
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-950">AI supervision</h1>
          <p className="max-w-3xl text-sm text-gray-600">
            The automation supervision surface is currently unavailable.
          </p>
        </header>
        <Card>
          <CardContent className="space-y-3">
            <Badge tone="danger">Supervision unavailable</Badge>
            <p className="text-sm text-gray-700">
              Rollout state and audit summaries could not be loaded. Retry after checking service-role access and admin telemetry dependencies.
            </p>
            <p className="text-xs text-gray-500">{message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summaryCounts = {
    shadowCapped: cards.filter((card) => card.resolution.shadowCapped).length,
    readyForReview: cards.filter((card) => card.resolution.rolloutState === 'shadow_live_ready').length,
    controlledLive: cards.filter((card) => card.resolution.rolloutState === 'controlled_live').length,
    paused: cards.filter((card) => card.resolution.rolloutState === 'paused_after_review').length,
    registryUnavailable: cards.filter((card) => card.resolution.rolloutStateSource === 'registry_unavailable').length
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-950">AI supervision</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          This surface shows the env ceiling, rollout state, and current runtime truth for each automation family.
          Shadow traces remain non-visible outcomes unless a workflow is explicitly approved for controlled live use.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shadow-capped</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950">{summaryCounts.shadowCapped}</div>
            <p className="mt-1 text-sm text-gray-600">Canon keeps these workflows below live in Phase 12.</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Ready for review</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950">{summaryCounts.readyForReview}</div>
            <p className="mt-1 text-sm text-gray-600">Evidence threshold met, but still not approved for live use.</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Controlled live</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950">{summaryCounts.controlledLive}</div>
            <p className="mt-1 text-sm text-gray-600">Only approved operator-controlled live workflows appear here.</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Paused</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950">{summaryCounts.paused}</div>
            <p className="mt-1 text-sm text-gray-600">Reviewed pauses take precedence over ordinary shadow collection.</p>
          </div>
        </CardContent>
      </Card>

      {summaryCounts.registryUnavailable > 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <Badge tone="warning">Rollout registry unavailable</Badge>
            <p className="text-sm text-gray-700">
              One or more workflow cards are showing the implicit fallback state only because the rollout registry could not be read.
              Do not treat those cards as confirmation of the persisted rollout control state until registry access is restored.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Control model</CardTitle>
          <CardDescription>
            Dashboard-first supervision is the normal operator path. Env vars remain the hard ceiling, while rollout controls
            stage, pause, or disable workflows inside that ceiling.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-950">Low-noise supervision</div>
            <p className="mt-2">
              Review exceptions and rollout readiness here first. Use off-dashboard escalation only for critical failures or unsafe outcomes.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-950">Approval boundary</div>
            <p className="mt-2">
              Evidence sufficiency is necessary, not sufficient. Human review approval is still required before any controlled-live move.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => {
          const aiPercentage = toAiPercentage(
            card.counts.aiDecisions,
            card.counts.deterministicDecisions,
            card.counts.manualOverrides
          )
          const operatorControl = getAiAutomationOperatorControl(card.workflow)
          const rolloutSource = getAiAutomationRolloutStateSourceSummary(card.resolution)

          return (
            <Card key={card.workflow}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{card.label}</CardTitle>
                    <CardDescription>{card.note}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={toneForMode(card.resolution.effectiveMode)}>
                      Env {card.resolution.effectiveMode}
                    </Badge>
                    <Badge tone={toneForRolloutState(card.resolution.rolloutState)}>
                      Rollout {card.resolution.rolloutState}
                    </Badge>
                    <Badge tone={toneForMode(card.resolution.finalRuntimeMode)}>
                      Runtime {card.resolution.finalRuntimeMode}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Visibility</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={toneForVisibility(card.visibility.state)}>{card.visibility.label}</Badge>
                      {card.resolution.shadowCapped ? <Badge>Shadow-only</Badge> : null}
                      {card.resolution.liveCapableButShadowed ? <Badge tone="info">Live-capable but shadowed</Badge> : null}
                      <Badge tone={rolloutSource.tone}>{rolloutSource.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{card.visibility.note}</p>
                    <p className="mt-2 text-sm text-gray-600">{rolloutSource.note}</p>
                    <p className="mt-2 text-xs text-gray-500">Mode source: {describeModeSource(card.resolution)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Review readiness</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={card.readiness.tone}>{card.readiness.label}</Badge>
                      {card.readiness.required > 0 ? (
                        <span className="text-xs text-gray-500">
                          {card.readiness.observed}/{card.readiness.required}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{card.readiness.note}</p>
                    <p className="mt-2 text-xs text-gray-500">Last review: {formatTimestamp(card.resolution.lastReviewedAt)}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Last trace</div>
                    <div className="mt-2 text-sm font-medium text-gray-950">{formatTimeAgo(card.lastTrace)}</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">24h errors</div>
                    <div className="mt-2 text-sm font-medium text-gray-950">{card.errors24h}</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shadow traces</div>
                    <div className="mt-2 text-sm font-medium text-gray-950">{card.shadowTraceCount}</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Disagreements</div>
                    <div className="mt-2 text-sm font-medium text-gray-950">{card.disagreements24h}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Decision mix</div>
                    <div className="text-sm text-gray-600">{aiPercentage}% visible AI</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${aiPercentage}%` }} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
                    <div>AI: {card.counts.aiDecisions}</div>
                    <div>Deterministic: {card.counts.deterministicDecisions}</div>
                    <div>Manual overrides: {card.counts.manualOverrides}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-950">Rollback and operator boundary</div>
                  <p className="mt-2">{operatorControl?.approvalBoundaryLabel}</p>
                  <p className="mt-2 text-gray-600">{operatorControl?.rollbackLabel}</p>
                </div>

                <RolloutControls resolution={card.resolution} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
