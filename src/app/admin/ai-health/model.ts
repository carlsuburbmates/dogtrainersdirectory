export type DecisionSourceCounts = {
  llm: number
  deterministic: number
  manual: number
  manualOverride: number
}

export type NormalizedDecisionCounts = {
  aiDecisions: number
  deterministicDecisions: number
  manualOverrides: number
}

export type TriageHealthRow = {
  created_at: string | null
  ai_mode?: string | null
  decision_source?: string | null
  classification?: string | null
  metadata?: unknown
}

export type TriageHealthSummary = {
  counts: NormalizedDecisionCounts
  shadowTraceCount: number
  shadowErrorCount: number
  shadowDisagreementCount: number
  handoffShadowTraceCount: number
  handoffShadowErrorCount: number
  lastTrace: string | null
  note: string
}

export type VerificationHealthRow = {
  created_at: string | null
  details?: unknown
}

export type ModerationHealthRow = {
  created_at: string | null
  decision_source?: string | null
}

export type DigestHealthRow = {
  created_at: string | null
  ai_mode?: string | null
  decision_source?: string | null
  ci_summary?: unknown
}

export type OnboardingHealthRow = {
  created_at: string | null
  metadata?: unknown
}

export type BusinessListingQualityHealthRow = {
  created_at: string | null
  metadata?: unknown
}

export type ScaffoldReviewGuidanceHealthRow = {
  created_at: string | null
  metadata?: unknown
}

export type OperatorWorkflowHealthSummary = {
  counts: NormalizedDecisionCounts
  shadowTraceCount: number
  errorCount: number
  lastTrace: string | null
  note: string
}

export type ScheduledRolloutEvidenceSummary = {
  observedRuns: number
  requiredRuns: number
  ready: boolean
  note: string
}

type TriageAuditRecord = {
  decisionSource?: string
  resultState?: string
}

type TriageShadowCandidate = {
  classification?: string
}

type OwnerSearchHandoffTrace = {
  resultState?: string
}

export function normalizeDecisionSourceCounts(counts: DecisionSourceCounts): NormalizedDecisionCounts {
  return {
    aiDecisions: counts.llm,
    deterministicDecisions: counts.deterministic,
    // Keep backwards compatibility for older rows that used `manual`.
    manualOverrides: counts.manual + counts.manualOverride
  }
}

export function toAiPercentage(aiDecisions: number, deterministicDecisions: number, manualOverrides: number): number {
  const total = aiDecisions + deterministicDecisions + manualOverrides
  if (total <= 0) return 0
  return Math.round((aiDecisions / total) * 100)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function getAiAutomationAudit(value: unknown): TriageAuditRecord | null {
  const metadata = asRecord(value)
  const audit = asRecord(metadata?.aiAutomationAudit)

  if (!audit) {
    return null
  }

  return {
    decisionSource: typeof audit.decisionSource === 'string' ? audit.decisionSource : undefined,
    resultState: typeof audit.resultState === 'string' ? audit.resultState : undefined
  }
}

function getTriageAuditRecord(row: TriageHealthRow): TriageAuditRecord | null {
  return getAiAutomationAudit(row.metadata)
}

function getShadowCandidate(row: TriageHealthRow): TriageShadowCandidate | null {
  const metadata = asRecord(row.metadata)
  const candidate = asRecord(metadata?.shadowCandidate)

  if (!candidate) {
    return null
  }

  return {
    classification:
      typeof candidate.classification === 'string' ? candidate.classification : undefined
  }
}

function getOwnerSearchHandoffTrace(row: TriageHealthRow): OwnerSearchHandoffTrace | null {
  const metadata = asRecord(row.metadata)
  const handoff = asRecord(metadata?.ownerSearchHandoff)
  const audit = asRecord(handoff?.aiAutomationAudit)

  if (!audit) {
    return null
  }

  return {
    resultState: typeof audit.resultState === 'string' ? audit.resultState : undefined
  }
}

function buildTriageHealthNote(summary: {
  shadowTraceCount: number
  shadowErrorCount: number
  shadowDisagreementCount: number
  handoffShadowTraceCount: number
  handoffShadowErrorCount: number
}): string {
  const intro =
    'Visible decision counts come from emergency_triage_logs.decision_source. Shadow AI traces are summarised separately from audit metadata.'

  if (summary.shadowTraceCount <= 0 && summary.handoffShadowTraceCount <= 0) {
    return `${intro} No triage shadow traces were recorded in the last 24h.`
  }

  const parts: string[] = []

  if (summary.shadowTraceCount > 0) {
    parts.push(
      `${summary.shadowTraceCount} emergency triage shadow trace${summary.shadowTraceCount === 1 ? '' : 's'} recorded`
    )
  }

  if (summary.shadowDisagreementCount > 0) {
    parts.push(
      `${summary.shadowDisagreementCount} differed from the visible deterministic outcome`
    )
  }

  if (summary.shadowErrorCount > 0) {
    parts.push(`${summary.shadowErrorCount} ended in an AI error`)
  }

  if (summary.handoffShadowTraceCount > 0) {
    parts.push(
      `${summary.handoffShadowTraceCount} triage-to-search advisory shadow trace${summary.handoffShadowTraceCount === 1 ? '' : 's'} recorded`
    )
  }

  if (summary.handoffShadowErrorCount > 0) {
    parts.push(
      `${summary.handoffShadowErrorCount} triage-to-search advisory trace${summary.handoffShadowErrorCount === 1 ? '' : 's'} ended in an AI error`
    )
  }

  return `${intro} ${parts.join('; ')}. Shadow traces did not change the visible outcome. Triage-to-search advisories did not change visible search params or results.`
}

export function summarizeTriageHealth(rows: TriageHealthRow[]): TriageHealthSummary {
  let llm = 0
  let deterministic = 0
  let manual = 0
  let manualOverride = 0
  let shadowTraceCount = 0
  let shadowErrorCount = 0
  let shadowDisagreementCount = 0
  let handoffShadowTraceCount = 0
  let handoffShadowErrorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const decisionSource = row.decision_source
    const audit = getTriageAuditRecord(row)
    const shadowCandidate = getShadowCandidate(row)
    const ownerSearchHandoff = getOwnerSearchHandoffTrace(row)

    if (decisionSource === 'llm') {
      llm += 1
    } else if (decisionSource === 'deterministic') {
      deterministic += 1
    } else if (decisionSource === 'manual') {
      manual += 1
    } else if (decisionSource === 'manual_override') {
      manualOverride += 1
    }

    if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
      lastTrace = row.created_at
    }

    if (row.ai_mode === 'shadow' && (audit || shadowCandidate)) {
      shadowTraceCount += 1

      if (audit?.resultState === 'error') {
        shadowErrorCount += 1
      }

      if (
        shadowCandidate?.classification &&
        row.classification &&
        shadowCandidate.classification !== row.classification
      ) {
        shadowDisagreementCount += 1
      }
    }

    if (row.ai_mode === 'shadow' && ownerSearchHandoff) {
      handoffShadowTraceCount += 1

      if (ownerSearchHandoff.resultState === 'error') {
        handoffShadowErrorCount += 1
      }
    }
  }

  const counts = normalizeDecisionSourceCounts({
    llm,
    deterministic,
    manual,
    manualOverride
  })

  return {
    counts,
    shadowTraceCount,
    shadowErrorCount,
    shadowDisagreementCount,
    handoffShadowTraceCount,
    handoffShadowErrorCount,
    lastTrace,
    note: buildTriageHealthNote({
      shadowTraceCount,
      shadowErrorCount,
      shadowDisagreementCount,
      handoffShadowTraceCount,
      handoffShadowErrorCount
    })
  }
}

function buildOperatorWorkflowNote(input: {
  familyLabel: string
  outputLabel: string
  approvalBoundaryLabel: string
  shadowTraceCount: number
  errorCount: number
  includeVisibleDeterministicNote?: boolean
}): string {
  const parts = [
    `${input.outputLabel}. ${input.approvalBoundaryLabel}`
  ]

  if (input.shadowTraceCount > 0) {
    parts.push(
      `${input.shadowTraceCount} shadow trace${input.shadowTraceCount === 1 ? '' : 's'} recorded from audit metadata.`
    )
  }

  if (input.errorCount > 0) {
    parts.push(
      `${input.errorCount} ${input.familyLabel.toLowerCase()} trace${input.errorCount === 1 ? '' : 's'} ended in an error.`
    )
  }

  if (input.includeVisibleDeterministicNote) {
    parts.push('Shadow traces did not replace the visible deterministic outcome.')
  }

  return parts.join(' ')
}

export function summarizeVerificationHealth(rows: VerificationHealthRow[]): OperatorWorkflowHealthSummary {
  let aiVisible = 0
  let deterministicVisible = 0
  let shadowTraceCount = 0
  let errorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const details = asRecord(row.details)
    const audit = getAiAutomationAudit(details)
    const verificationMethod = details?.verificationMethod
    const shadowCandidate = asRecord(details?.shadowCandidate)

    if (verificationMethod === 'ai') {
      aiVisible += 1
    } else if (verificationMethod === 'deterministic') {
      deterministicVisible += 1
    }

    if (shadowCandidate || audit?.resultState === 'error') {
      shadowTraceCount += 1
    }

    if (audit?.resultState === 'error') {
      errorCount += 1
    }

    if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
      lastTrace = row.created_at
    }
  }

  return {
    counts: {
      aiDecisions: aiVisible,
      deterministicDecisions: deterministicVisible,
      manualOverrides: 0
    },
    shadowTraceCount,
    errorCount,
    lastTrace,
    note: buildOperatorWorkflowNote({
      familyLabel: 'Verification',
      outputLabel:
        'Draft verification candidates are stored in emergency_resource_verification_events.details',
      approvalBoundaryLabel:
        'Verification status changes still require an operator action.',
      shadowTraceCount,
      errorCount,
      includeVisibleDeterministicNote: shadowTraceCount > 0
    })
  }
}

export function summarizeModerationHealth(rows: ModerationHealthRow[]): OperatorWorkflowHealthSummary {
  let llm = 0
  let deterministic = 0
  let manual = 0
  let manualOverride = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    if (row.decision_source === 'llm') {
      llm += 1
    } else if (row.decision_source === 'deterministic') {
      deterministic += 1
    } else if (row.decision_source === 'manual') {
      manual += 1
    } else if (row.decision_source === 'manual_override') {
      manualOverride += 1
    }

    if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
      lastTrace = row.created_at
    }
  }

  return {
    counts: normalizeDecisionSourceCounts({
      llm,
      deterministic,
      manual,
      manualOverride
    }),
    shadowTraceCount: 0,
    errorCount: 0,
    lastTrace,
    note:
      'Draft moderation recommendations are recorded in ai_review_decisions. Final review approval or rejection still requires an operator action.'
  }
}

export function summarizeDigestHealth(rows: DigestHealthRow[]): OperatorWorkflowHealthSummary {
  let aiVisible = 0
  let deterministicVisible = 0
  let shadowTraceCount = 0
  let errorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const summary = asRecord(row.ci_summary)
    const audit = getAiAutomationAudit(summary)
    const shadowCandidate = asRecord(summary?.shadowCandidate)

    if (row.decision_source === 'llm') {
      aiVisible += 1
    } else if (row.decision_source === 'deterministic') {
      deterministicVisible += 1
    }

    if ((row.ai_mode === 'shadow' && audit) || shadowCandidate) {
      shadowTraceCount += 1
    }

    if (audit?.resultState === 'error') {
      errorCount += 1
    }

    if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
      lastTrace = row.created_at
    }
  }

  return {
    counts: {
      aiDecisions: aiVisible,
      deterministicDecisions: deterministicVisible,
      manualOverrides: 0
    },
    shadowTraceCount,
    errorCount,
    lastTrace,
    note: buildOperatorWorkflowNote({
      familyLabel: 'Digest',
      outputLabel: 'Ops digest output is advisory only',
      approvalBoundaryLabel:
        'No external action is executed from the digest by itself.',
      shadowTraceCount,
      errorCount,
      includeVisibleDeterministicNote: shadowTraceCount > 0
    })
  }
}

export function summarizeScheduledShadowEvidence(
  rows: Array<{ ai_mode?: string | null; created_at: string | null; metadata?: unknown; ci_summary?: unknown }>,
  requiredRuns = 7
): ScheduledRolloutEvidenceSummary {
  let observedRuns = 0

  for (const row of rows) {
    const auditSource = row.ci_summary ?? row.metadata
    const audit = getAiAutomationAudit(auditSource)

    if (row.ai_mode !== 'shadow') {
      continue
    }

    if (audit?.resultState === 'error') {
      return {
        observedRuns,
        requiredRuns,
        ready: false,
        note: 'Recent shadow evidence includes an error state. Review the failed trace before any live approval.'
      }
    }

    observedRuns += 1

    if (observedRuns >= requiredRuns) {
      return {
        observedRuns,
        requiredRuns,
        ready: true,
        note: 'Minimum scheduled shadow evidence is available. Human review is still required before any live move.'
      }
    }
  }

  return {
    observedRuns,
    requiredRuns,
    ready: false,
    note: `Need ${requiredRuns} consecutive shadow runs without critical errors before live review can start.`
  }
}

export function summarizeOnboardingHealth(rows: OnboardingHealthRow[]): OperatorWorkflowHealthSummary {
  let deterministicVisible = 0
  let shadowTraceCount = 0
  let errorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const shadowTrace = asRecord(metadata?.onboardingShadowAssistance)
    const audit = getAiAutomationAudit(shadowTrace)

    if (shadowTrace) {
      deterministicVisible += 1
      shadowTraceCount += 1

      if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
        lastTrace = row.created_at
      }
    }

    if (audit?.resultState === 'error') {
      errorCount += 1
    }
  }

  return {
    counts: {
      aiDecisions: 0,
      deterministicDecisions: deterministicVisible,
      manualOverrides: 0
    },
    shadowTraceCount,
    errorCount,
    lastTrace,
    note: buildOperatorWorkflowNote({
      familyLabel: 'Onboarding',
      outputLabel:
        'Business onboarding assistance is recorded as a shadow-only advisory trace in latency_metrics.metadata',
      approvalBoundaryLabel:
        'Submission payload, publication state, verification state, featured or spotlight state, and billing outcomes still follow the deterministic onboarding path.',
      shadowTraceCount,
      errorCount,
      includeVisibleDeterministicNote: shadowTraceCount > 0
    })
  }
}

export function summarizeBusinessListingQualityHealth(
  rows: BusinessListingQualityHealthRow[]
): OperatorWorkflowHealthSummary {
  let deterministicVisible = 0
  let shadowTraceCount = 0
  let errorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const shadowTrace = asRecord(metadata?.businessListingQualityShadow)
    const audit = getAiAutomationAudit(shadowTrace)

    if (shadowTrace) {
      deterministicVisible += 1
      shadowTraceCount += 1

      if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
        lastTrace = row.created_at
      }
    }

    if (audit?.resultState === 'error') {
      errorCount += 1
    }
  }

  return {
    counts: {
      aiDecisions: 0,
      deterministicDecisions: deterministicVisible,
      manualOverrides: 0
    },
    shadowTraceCount,
    errorCount,
    lastTrace,
    note: buildOperatorWorkflowNote({
      familyLabel: 'Business listing quality',
      outputLabel:
        'Business listing-quality guidance is recorded as a business-facing shadow-only advisory trace in latency_metrics.metadata',
      approvalBoundaryLabel:
        'The owned profile save stays deterministic, and publication, verification, featured or spotlight state, billing, checkout, and ranking outcomes remain unchanged.',
      shadowTraceCount,
      errorCount,
      includeVisibleDeterministicNote: shadowTraceCount > 0
    })
  }
}

export function summarizeScaffoldReviewGuidanceHealth(
  rows: ScaffoldReviewGuidanceHealthRow[]
): OperatorWorkflowHealthSummary {
  let deterministicVisible = 0
  let shadowTraceCount = 0
  let errorCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const shadowTrace = asRecord(metadata?.operatorScaffoldReviewGuidance)
    const audit = getAiAutomationAudit(shadowTrace)

    if (shadowTrace) {
      deterministicVisible += 1
      shadowTraceCount += 1

      if (row.created_at && (!lastTrace || row.created_at > lastTrace)) {
        lastTrace = row.created_at
      }
    }

    if (audit?.resultState === 'error') {
      errorCount += 1
    }
  }

  return {
    counts: {
      aiDecisions: 0,
      deterministicDecisions: deterministicVisible,
      manualOverrides: 0
    },
    shadowTraceCount,
    errorCount,
    lastTrace,
    note: buildOperatorWorkflowNote({
      familyLabel: 'Scaffold review guidance',
      outputLabel:
        'Scaffold review guidance is an operator-only shadow trace recorded in latency_metrics.metadata',
      approvalBoundaryLabel:
        'The visible scaffold queue, approval decisions, publication state, verification state, spotlight state, billing state, and ranking remain unchanged.',
      shadowTraceCount,
      errorCount,
      includeVisibleDeterministicNote: shadowTraceCount > 0
    })
  }
}
