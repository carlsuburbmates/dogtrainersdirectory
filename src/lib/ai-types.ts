// AI type definitions for the Dog Trainers Directory project

export type LlmPipeline = 'triage' | 'moderation' | 'verification' | 'ops_digest'

export type DecisionSource = 'llm' | 'deterministic' | 'manual_override'

export type DecisionMode = 'live' | 'shadow' | 'disabled'

export interface AISummary {
  pipeline: string
  totalDecisions: number
  aiDecisions: number
  deterministicDecisions: number
  manualOverrides: number
errors24h: number
  lastSuccess: string | null
}