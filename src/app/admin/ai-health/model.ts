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
  lastTrace: string | null
  note: string
}

type TriageAuditRecord = {
  decisionSource?: string
  resultState?: string
}

type TriageShadowCandidate = {
  classification?: string
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

function getTriageAuditRecord(row: TriageHealthRow): TriageAuditRecord | null {
  const metadata = asRecord(row.metadata)
  const audit = asRecord(metadata?.aiAutomationAudit)

  if (!audit) {
    return null
  }

  return {
    decisionSource: typeof audit.decisionSource === 'string' ? audit.decisionSource : undefined,
    resultState: typeof audit.resultState === 'string' ? audit.resultState : undefined
  }
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

function buildTriageHealthNote(summary: {
  shadowTraceCount: number
  shadowErrorCount: number
  shadowDisagreementCount: number
}): string {
  const intro =
    'Visible decision counts come from emergency_triage_logs.decision_source. Shadow AI traces are summarised separately from audit metadata.'

  if (summary.shadowTraceCount <= 0) {
    return `${intro} No triage shadow traces were recorded in the last 24h.`
  }

  const parts = [`${summary.shadowTraceCount} shadow trace${summary.shadowTraceCount === 1 ? '' : 's'} recorded`]

  if (summary.shadowDisagreementCount > 0) {
    parts.push(
      `${summary.shadowDisagreementCount} differed from the visible deterministic outcome`
    )
  }

  if (summary.shadowErrorCount > 0) {
    parts.push(`${summary.shadowErrorCount} ended in an AI error`)
  }

  return `${intro} ${parts.join('; ')}. Shadow traces did not change the visible outcome.`
}

export function summarizeTriageHealth(rows: TriageHealthRow[]): TriageHealthSummary {
  let llm = 0
  let deterministic = 0
  let manual = 0
  let manualOverride = 0
  let shadowTraceCount = 0
  let shadowErrorCount = 0
  let shadowDisagreementCount = 0
  let lastTrace: string | null = null

  for (const row of rows) {
    const decisionSource = row.decision_source
    const audit = getTriageAuditRecord(row)
    const shadowCandidate = getShadowCandidate(row)

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
    lastTrace,
    note: buildTriageHealthNote({
      shadowTraceCount,
      shadowErrorCount,
      shadowDisagreementCount
    })
  }
}
