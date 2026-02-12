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
