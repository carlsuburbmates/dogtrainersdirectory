import type { DecisionMode, DecisionSource, LlmPipeline } from './ai-types'

export type AiAutomationWorkflow = LlmPipeline
export type AiAutomationActorClass = 'owner' | 'business' | 'operator'
export type AiAutomationApprovalState =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
export type AiAutomationResultState = 'result' | 'no_result' | 'error'
export type AiAutomationVisibilityState =
  | 'connected'
  | 'degraded'
  | 'not_connected'

export type AiAutomationRecordReference = {
  table: string
  id?: string | number | null
  field?: string
}

export type AiAutomationAuditEvent = {
  workflowFamily: AiAutomationWorkflow
  actorClass: AiAutomationActorClass
  effectiveMode: DecisionMode
  approvalState: AiAutomationApprovalState
  resultState: AiAutomationResultState
  decisionSource: DecisionSource
  routeOrJob: string
  summary?: string | null
  errorMessage?: string | null
  resultingRecordReferences?: AiAutomationRecordReference[]
  notes?: string[]
}

type WorkflowConfig = {
  label: string
  actorClass: AiAutomationActorClass
  overrideEnvVar: keyof Pick<
    NodeJS.ProcessEnv,
    'TRIAGE_AI_MODE' | 'MODERATION_AI_MODE' | 'VERIFICATION_AI_MODE' | 'DIGEST_AI_MODE'
  >
  usesLlm: boolean
  auditStorage: string | null
}

const DEFAULT_MODE: DecisionMode = 'live'

const WORKFLOW_CONFIG: Record<AiAutomationWorkflow, WorkflowConfig> = {
  triage: {
    label: 'Emergency Triage',
    actorClass: 'owner',
    overrideEnvVar: 'TRIAGE_AI_MODE',
    usesLlm: true,
    auditStorage: 'emergency_triage_logs'
  },
  moderation: {
    label: 'Review Moderation',
    actorClass: 'operator',
    overrideEnvVar: 'MODERATION_AI_MODE',
    usesLlm: false,
    auditStorage: 'ai_review_decisions'
  },
  verification: {
    label: 'Resource Verification',
    actorClass: 'operator',
    overrideEnvVar: 'VERIFICATION_AI_MODE',
    usesLlm: true,
    auditStorage: 'emergency_resource_verification_events'
  },
  ops_digest: {
    label: 'Ops Digest',
    actorClass: 'operator',
    overrideEnvVar: 'DIGEST_AI_MODE',
    usesLlm: true,
    auditStorage: 'daily_ops_digests'
  }
}

export type AiAutomationModeResolution = {
  workflow: AiAutomationWorkflow
  label: string
  actorClass: AiAutomationActorClass
  globalMode: DecisionMode
  overrideMode: DecisionMode | null
  effectiveMode: DecisionMode
  overrideEnvVar: WorkflowConfig['overrideEnvVar']
  usesLlm: boolean
  auditStorage: string | null
  killSwitchActive: boolean
  usesGlobalDefault: boolean
}

export type AiAutomationVisibility = {
  state: AiAutomationVisibilityState
  label: string
  note: string
}

export type AiAutomationOperatorControl = {
  outputLabel: string
  approvalBoundaryLabel: string
  rollbackLabel: string
}

function isDecisionMode(value: string | undefined | null): value is DecisionMode {
  return value === 'disabled' || value === 'shadow' || value === 'live'
}

export function normaliseDecisionMode(
  value: string | undefined | null,
  fallback: DecisionMode = DEFAULT_MODE
): DecisionMode {
  return isDecisionMode(value) ? value : fallback
}

export function resolveAiAutomationMode(
  workflow: AiAutomationWorkflow,
  env: NodeJS.ProcessEnv = process.env
): AiAutomationModeResolution {
  const config = WORKFLOW_CONFIG[workflow]
  const globalMode = normaliseDecisionMode(env.AI_GLOBAL_MODE, DEFAULT_MODE)
  const overrideRaw = env[config.overrideEnvVar]
  const overrideMode = isDecisionMode(overrideRaw) ? overrideRaw : null
  const effectiveMode = overrideMode ?? globalMode

  return {
    workflow,
    label: config.label,
    actorClass: config.actorClass,
    globalMode,
    overrideMode,
    effectiveMode,
    overrideEnvVar: config.overrideEnvVar,
    usesLlm: config.usesLlm,
    auditStorage: config.auditStorage,
    killSwitchActive: effectiveMode === 'disabled',
    usesGlobalDefault: overrideMode === null
  }
}

export function getAiAutomationModeResolutions(
  env: NodeJS.ProcessEnv = process.env
): AiAutomationModeResolution[] {
  return (Object.keys(WORKFLOW_CONFIG) as AiAutomationWorkflow[]).map((workflow) =>
    resolveAiAutomationMode(workflow, env)
  )
}

export function getAiAutomationVisibility(
  resolution: AiAutomationModeResolution,
  options: {
    auditConnected?: boolean
    llmConfigured?: boolean
  } = {}
): AiAutomationVisibility {
  const auditConnected = options.auditConnected ?? Boolean(resolution.auditStorage)

  if (!auditConnected) {
    return {
      state: 'not_connected',
      label: 'Not connected',
      note: 'Mode is visible, but audit traces are not yet wired for this workflow.'
    }
  }

  if (resolution.killSwitchActive) {
    return {
      state: 'connected',
      label: 'Kill switch active',
      note: 'This workflow is disabled by the effective mode.'
    }
  }

  if (resolution.usesLlm && options.llmConfigured === false) {
    return {
      state: 'degraded',
      label: 'Degraded',
      note: 'AI mode is enabled, but the LLM provider is not configured. Deterministic fallback will be used.'
    }
  }

  return {
    state: 'connected',
    label: 'Connected',
    note: resolution.usesGlobalDefault
      ? 'Using the global AI mode.'
      : `Using ${resolution.overrideEnvVar}.`
  }
}

export function buildAiAutomationAuditEvent(
  event: AiAutomationAuditEvent
): Record<string, unknown> {
  return {
    version: 1,
    workflowFamily: event.workflowFamily,
    actorClass: event.actorClass,
    effectiveMode: event.effectiveMode,
    approvalState: event.approvalState,
    resultState: event.resultState,
    decisionSource: event.decisionSource,
    routeOrJob: event.routeOrJob,
    summary: event.summary ?? null,
    errorMessage: event.errorMessage ?? null,
    resultingRecordReferences: event.resultingRecordReferences ?? [],
    notes: event.notes ?? []
  }
}

export function mergeAiAutomationAuditMetadata(
  baseMetadata: Record<string, unknown> | null | undefined,
  event: AiAutomationAuditEvent,
  extraMetadata?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(baseMetadata ?? {}),
    ...(extraMetadata ?? {}),
    aiAutomationAudit: buildAiAutomationAuditEvent(event)
  }
}

export function describeModeSource(resolution: AiAutomationModeResolution): string {
  return resolution.usesGlobalDefault ? 'Global default' : resolution.overrideEnvVar
}

export function getAiAutomationOperatorControl(
  workflow: AiAutomationWorkflow
): AiAutomationOperatorControl | null {
  switch (workflow) {
    case 'moderation':
      return {
        outputLabel: 'Draft recommendation',
        approvalBoundaryLabel:
          'Final review approval or rejection still requires an operator action.',
        rollbackLabel:
          'Disable with MODERATION_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Existing recommendations remain drafts until an operator acts.'
      }
    case 'verification':
      return {
        outputLabel: 'Draft recommendation',
        approvalBoundaryLabel:
          'Verification status changes still require an operator action.',
        rollbackLabel:
          'Disable with VERIFICATION_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Existing candidate checks remain audit records only.'
      }
    case 'ops_digest':
      return {
        outputLabel: 'Advisory output',
        approvalBoundaryLabel:
          'No external action is executed from the digest by itself; operators decide what to do next.',
        rollbackLabel:
          'Disable with DIGEST_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Re-run the digest to replace an advisory summary if needed.'
      }
    default:
      return null
  }
}
