import type { DecisionMode, DecisionSource } from './ai-types'

export type AiAutomationWorkflow =
  | 'triage'
  | 'moderation'
  | 'verification'
  | 'ops_digest'
  | 'onboarding'
  | 'business_listing_quality'
  | 'scaffold_review_guidance'

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
export type AiAutomationEvidenceMode = 'request_driven' | 'scheduled'
export type AiAutomationRolloutRegistryStatus =
  | 'available'
  | 'not_configured'
  | 'read_failed'
export type AiAutomationRolloutStateSource =
  | 'persisted_control'
  | 'implicit_default'
  | 'registry_unavailable'
export type AiAutomationRolloutState =
  | 'disabled'
  | 'shadow'
  | 'shadow_only'
  | 'shadow_live_ready'
  | 'controlled_live'
  | 'paused_after_review'

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

export type AiAutomationRolloutControl = {
  workflow: AiAutomationWorkflow
  rolloutState: AiAutomationRolloutState
  reason?: string | null
  reviewOwner?: string | null
  approvedBy?: string | null
  updatedByUserId?: string | null
  lastReviewedAt?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string | null
  updatedAt?: string | null
}

type WorkflowConfig = {
  label: string
  actorClass: AiAutomationActorClass
  overrideEnvVar: keyof Pick<
    NodeJS.ProcessEnv,
    'TRIAGE_AI_MODE' | 'MODERATION_AI_MODE' | 'VERIFICATION_AI_MODE' | 'DIGEST_AI_MODE'
  > | null
  usesLlm: boolean
  auditStorage: string | null
  maxMode: DecisionMode
  evidenceMode: AiAutomationEvidenceMode
  controlledLiveCandidate: boolean
}

const DEFAULT_MODE: DecisionMode = 'live'

const AI_AUTOMATION_WORKFLOWS: AiAutomationWorkflow[] = [
  'triage',
  'moderation',
  'verification',
  'ops_digest',
  'onboarding',
  'business_listing_quality',
  'scaffold_review_guidance'
]

const AI_AUTOMATION_ROLLOUT_STATES: AiAutomationRolloutState[] = [
  'disabled',
  'shadow',
  'shadow_only',
  'shadow_live_ready',
  'controlled_live',
  'paused_after_review'
]

const WORKFLOW_CONFIG: Record<AiAutomationWorkflow, WorkflowConfig> = {
  triage: {
    label: 'Emergency Triage',
    actorClass: 'owner',
    overrideEnvVar: 'TRIAGE_AI_MODE',
    usesLlm: true,
    auditStorage: 'emergency_triage_logs',
    maxMode: 'live',
    evidenceMode: 'request_driven',
    controlledLiveCandidate: false
  },
  moderation: {
    label: 'Review Moderation',
    actorClass: 'operator',
    overrideEnvVar: 'MODERATION_AI_MODE',
    usesLlm: false,
    auditStorage: 'ai_review_decisions',
    maxMode: 'live',
    evidenceMode: 'scheduled',
    controlledLiveCandidate: false
  },
  verification: {
    label: 'Resource Verification',
    actorClass: 'operator',
    overrideEnvVar: 'VERIFICATION_AI_MODE',
    usesLlm: true,
    auditStorage: 'emergency_resource_verification_events',
    maxMode: 'live',
    evidenceMode: 'scheduled',
    controlledLiveCandidate: false
  },
  ops_digest: {
    label: 'Ops Digest',
    actorClass: 'operator',
    overrideEnvVar: 'DIGEST_AI_MODE',
    usesLlm: true,
    auditStorage: 'daily_ops_digests',
    maxMode: 'live',
    evidenceMode: 'scheduled',
    controlledLiveCandidate: true
  },
  onboarding: {
    label: 'Business Onboarding',
    actorClass: 'business',
    overrideEnvVar: null,
    usesLlm: true,
    auditStorage: 'latency_metrics',
    maxMode: 'shadow',
    evidenceMode: 'request_driven',
    controlledLiveCandidate: false
  },
  business_listing_quality: {
    label: 'Business Listing Quality',
    actorClass: 'business',
    overrideEnvVar: null,
    usesLlm: true,
    auditStorage: 'latency_metrics',
    maxMode: 'shadow',
    evidenceMode: 'request_driven',
    controlledLiveCandidate: false
  },
  scaffold_review_guidance: {
    label: 'Scaffold Review Guidance',
    actorClass: 'operator',
    overrideEnvVar: null,
    usesLlm: false,
    auditStorage: 'latency_metrics',
    maxMode: 'shadow',
    evidenceMode: 'request_driven',
    controlledLiveCandidate: false
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
  maxMode: DecisionMode
  evidenceMode: AiAutomationEvidenceMode
  controlledLiveCandidate: boolean
}

export type AiAutomationRolloutResolution = AiAutomationModeResolution & {
  rolloutRegistryStatus: AiAutomationRolloutRegistryStatus
  rolloutRegistryNote: string | null
  rolloutStateSource: AiAutomationRolloutStateSource
  implicitRolloutState: AiAutomationRolloutState
  configuredRolloutState: AiAutomationRolloutState | null
  rolloutState: AiAutomationRolloutState
  finalRuntimeMode: DecisionMode
  shadowCapped: boolean
  liveCapable: boolean
  liveCapableButShadowed: boolean
  reason: string | null
  reviewOwner: string | null
  approvedBy: string | null
  updatedByUserId: string | null
  lastReviewedAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string | null
  updatedAt: string | null
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

export type AiAutomationRolloutStateSourceSummary = {
  label: string
  note: string
  tone: 'neutral' | 'info' | 'warning' | 'success'
}

function isDecisionMode(value: string | undefined | null): value is DecisionMode {
  return value === 'disabled' || value === 'shadow' || value === 'live'
}

export function isAiAutomationWorkflow(value: string | undefined | null): value is AiAutomationWorkflow {
  return typeof value === 'string' && AI_AUTOMATION_WORKFLOWS.includes(value as AiAutomationWorkflow)
}

export function isAiAutomationRolloutState(
  value: string | undefined | null
): value is AiAutomationRolloutState {
  return (
    typeof value === 'string' &&
    AI_AUTOMATION_ROLLOUT_STATES.includes(value as AiAutomationRolloutState)
  )
}

export function normaliseDecisionMode(
  value: string | undefined | null,
  fallback: DecisionMode = DEFAULT_MODE
): DecisionMode {
  return isDecisionMode(value) ? value : fallback
}

export function normaliseAiAutomationRolloutState(
  value: string | undefined | null,
  fallback: AiAutomationRolloutState
): AiAutomationRolloutState {
  return isAiAutomationRolloutState(value) ? value : fallback
}

export function getAiAutomationWorkflows(): AiAutomationWorkflow[] {
  return [...AI_AUTOMATION_WORKFLOWS]
}

export function resolveAiAutomationMode(
  workflow: AiAutomationWorkflow,
  env: NodeJS.ProcessEnv = process.env
): AiAutomationModeResolution {
  const config = WORKFLOW_CONFIG[workflow]
  const globalMode = normaliseDecisionMode(env.AI_GLOBAL_MODE, DEFAULT_MODE)
  const overrideRaw = config.overrideEnvVar ? env[config.overrideEnvVar] : null
  const overrideMode = isDecisionMode(overrideRaw) ? overrideRaw : null
  const requestedMode = overrideMode ?? globalMode
  const effectiveMode =
    config.maxMode === 'shadow' && requestedMode === 'live' ? 'shadow' : requestedMode

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
    usesGlobalDefault: overrideMode === null,
    maxMode: config.maxMode,
    evidenceMode: config.evidenceMode,
    controlledLiveCandidate: config.controlledLiveCandidate
  }
}

export function getAiAutomationModeResolutions(
  env: NodeJS.ProcessEnv = process.env
): AiAutomationModeResolution[] {
  return AI_AUTOMATION_WORKFLOWS.map((workflow) => resolveAiAutomationMode(workflow, env))
}

export function getImplicitAiAutomationRolloutState(
  workflowOrResolution: AiAutomationWorkflow | AiAutomationModeResolution
): AiAutomationRolloutState {
  const resolution =
    typeof workflowOrResolution === 'string'
      ? resolveAiAutomationMode(workflowOrResolution)
      : workflowOrResolution

  return resolution.maxMode === 'shadow' ? 'shadow_only' : 'shadow'
}

function toMetadataRecord(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

export function resolveAiAutomationRolloutResolution(
  modeResolution: AiAutomationModeResolution,
  control: AiAutomationRolloutControl | null | undefined,
  options: {
    rolloutRegistryStatus?: AiAutomationRolloutRegistryStatus
    rolloutRegistryNote?: string | null
  } = {}
): AiAutomationRolloutResolution {
  const rolloutRegistryStatus = options.rolloutRegistryStatus ?? 'available'
  const rolloutRegistryNote = options.rolloutRegistryNote ?? null
  const implicitRolloutState = getImplicitAiAutomationRolloutState(modeResolution)
  const configuredRolloutState = control?.rolloutState ?? null
  const rolloutStateSource: AiAutomationRolloutStateSource =
    rolloutRegistryStatus === 'available'
      ? control
        ? 'persisted_control'
        : 'implicit_default'
      : 'registry_unavailable'

  let rolloutState = implicitRolloutState

  if (configuredRolloutState === 'disabled') {
    rolloutState = 'disabled'
  } else if (modeResolution.maxMode === 'shadow') {
    rolloutState = implicitRolloutState
  } else if (configuredRolloutState) {
    rolloutState = configuredRolloutState
  }

  let finalRuntimeMode: DecisionMode
  if (modeResolution.effectiveMode === 'disabled') {
    finalRuntimeMode = 'disabled'
  } else if (rolloutState === 'disabled' || rolloutState === 'paused_after_review') {
    finalRuntimeMode = 'disabled'
  } else if (rolloutState === 'controlled_live' && modeResolution.effectiveMode === 'live') {
    finalRuntimeMode = 'live'
  } else {
    finalRuntimeMode = 'shadow'
  }

  const shadowCapped = implicitRolloutState === 'shadow_only'
  const liveCapable = !shadowCapped

  return {
    ...modeResolution,
    rolloutRegistryStatus,
    rolloutRegistryNote,
    rolloutStateSource,
    implicitRolloutState,
    configuredRolloutState,
    rolloutState,
    finalRuntimeMode,
    shadowCapped,
    liveCapable,
    liveCapableButShadowed: liveCapable && rolloutState !== 'controlled_live',
    reason: control?.reason ?? null,
    reviewOwner: control?.reviewOwner ?? null,
    approvedBy: control?.approvedBy ?? null,
    updatedByUserId: control?.updatedByUserId ?? null,
    lastReviewedAt: control?.lastReviewedAt ?? null,
    metadata: toMetadataRecord(control?.metadata),
    createdAt: control?.createdAt ?? null,
    updatedAt: control?.updatedAt ?? null
  }
}

export function getAiAutomationRolloutStateSourceSummary(
  resolution: Pick<
    AiAutomationRolloutResolution,
    'rolloutRegistryStatus' | 'rolloutRegistryNote' | 'rolloutStateSource'
  >
): AiAutomationRolloutStateSourceSummary {
  if (resolution.rolloutStateSource === 'persisted_control') {
    return {
      label: 'Persisted control',
      note: 'Showing the current rollout control stored in the rollout registry.',
      tone: 'success'
    }
  }

  if (resolution.rolloutStateSource === 'implicit_default') {
    return {
      label: 'Implicit default',
      note: 'No rollout control row is stored for this workflow. The supervision surface is showing the canonical default inside the env ceiling.',
      tone: 'neutral'
    }
  }

  return {
    label:
      resolution.rolloutRegistryStatus === 'not_configured'
        ? 'Registry unavailable'
        : 'Registry read failed',
    note:
      resolution.rolloutRegistryNote ??
      'The rollout registry could not be read. The supervision surface is showing the implicit fallback state only.',
    tone: 'warning'
  }
}

export function getAiAutomationVisibility(
  resolution: AiAutomationModeResolution | AiAutomationRolloutResolution,
  options: {
    auditConnected?: boolean
    llmConfigured?: boolean
  } = {}
): AiAutomationVisibility {
  const auditConnected = options.auditConnected ?? Boolean(resolution.auditStorage)
  const runtimeMode =
    'finalRuntimeMode' in resolution ? resolution.finalRuntimeMode : resolution.effectiveMode

  if (!auditConnected) {
    return {
      state: 'not_connected',
      label: 'Not connected',
      note: 'Mode is visible, but audit traces are not yet wired for this workflow.'
    }
  }

  if (runtimeMode === 'disabled') {
    const note =
      'finalRuntimeMode' in resolution && resolution.rolloutState === 'paused_after_review'
        ? 'This workflow is paused after review. Env ceiling remains separate from the rollout state.'
        : 'This workflow is disabled by the current effective mode or rollout state.'

    return {
      state: 'connected',
      label: 'Disabled',
      note
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
    label: runtimeMode === 'live' ? 'Live-capable' : 'Shadowed',
    note: resolution.usesGlobalDefault
      ? 'Env ceiling uses the global AI mode.'
      : `Env ceiling uses ${resolution.overrideEnvVar}.`
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
  if (resolution.usesGlobalDefault || !resolution.overrideEnvVar) {
    return 'Global default'
  }

  return resolution.overrideEnvVar
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
          'Pause or disable from /admin/ai-health, or set MODERATION_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Existing recommendations remain drafts until an operator acts.'
      }
    case 'verification':
      return {
        outputLabel: 'Draft recommendation',
        approvalBoundaryLabel:
          'Verification status changes still require an operator action.',
        rollbackLabel:
          'Pause or disable from /admin/ai-health, or set VERIFICATION_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Existing candidate checks remain audit records only.'
      }
    case 'ops_digest':
      return {
        outputLabel: 'Advisory output',
        approvalBoundaryLabel:
          'No external action is executed from the digest by itself; operators decide what to do next.',
        rollbackLabel:
          'Pause or disable from /admin/ai-health, or set DIGEST_AI_MODE=disabled or AI_GLOBAL_MODE=disabled. Re-run the digest to replace an advisory summary if needed.'
      }
    default:
      return null
  }
}
