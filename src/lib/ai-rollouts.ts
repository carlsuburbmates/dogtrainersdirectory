import { supabaseAdmin } from './supabase'
import {
  getAiAutomationModeResolutions,
  getAiAutomationWorkflows,
  isAiAutomationRolloutState,
  isAiAutomationWorkflow,
  resolveAiAutomationMode,
  resolveAiAutomationRolloutResolution,
  type AiAutomationRolloutControl,
  type AiAutomationRolloutRegistryStatus,
  type AiAutomationRolloutResolution,
  type AiAutomationRolloutState,
  type AiAutomationWorkflow
} from './ai-automation'

type RolloutControlRow = {
  workflow: string
  rollout_state: string
  reason: string | null
  review_owner: string | null
  approved_by: string | null
  updated_by_user_id: string | null
  last_reviewed_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

type RolloutEventRow = {
  id: string
  workflow: string
  from_rollout_state: string | null
  to_rollout_state: string
  reason: string
  review_owner: string | null
  approved_by: string | null
  acted_by_user_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type RolloutRegistryReadResult = {
  controls: Map<AiAutomationWorkflow, AiAutomationRolloutControl>
  status: AiAutomationRolloutRegistryStatus
  note: string | null
}

export type AiAutomationRolloutMutationInput = {
  targetState: AiAutomationRolloutState
  reason: string
  reviewOwner?: string | null
  metadata?: Record<string, unknown> | null
}

export type AiAutomationRolloutMutationResult = {
  control: AiAutomationRolloutControl
  resolution: AiAutomationRolloutResolution
  event: RolloutEventRow
}

type TransitionValidationResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

function trimOrNull(value: string | null | undefined) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toRolloutControl(row: RolloutControlRow): AiAutomationRolloutControl | null {
  if (!isAiAutomationWorkflow(row.workflow) || !isAiAutomationRolloutState(row.rollout_state)) {
    return null
  }

  return {
    workflow: row.workflow,
    rolloutState: row.rollout_state,
    reason: row.reason,
    reviewOwner: row.review_owner,
    approvedBy: row.approved_by,
    updatedByUserId: row.updated_by_user_id,
    lastReviewedAt: row.last_reviewed_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function fetchControlRows(): Promise<RolloutRegistryReadResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      controls: new Map(),
      status: 'not_configured',
      note:
        'SUPABASE_SERVICE_ROLE_KEY is not configured, so persisted rollout control state cannot be read. Showing the implicit fallback state only.'
    }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_automation_rollout_controls')
      .select(
        'workflow, rollout_state, reason, review_owner, approved_by, updated_by_user_id, last_reviewed_at, metadata, created_at, updated_at'
      )

    if (error) {
      throw error
    }

    const controls = new Map<AiAutomationWorkflow, AiAutomationRolloutControl>()
    for (const row of (data ?? []) as RolloutControlRow[]) {
      const control = toRolloutControl(row)
      if (control) {
        controls.set(control.workflow, control)
      }
    }

    return {
      controls,
      status: 'available',
      note: null
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Failed to load ai automation rollout controls', error)
    }
    return {
      controls: new Map(),
      status: 'read_failed',
      note:
        'The rollout registry could not be read. Showing the implicit fallback state only until registry access is restored.'
    }
  }
}

export async function getAiAutomationRuntimeResolution(
  workflow: AiAutomationWorkflow,
  env: NodeJS.ProcessEnv = process.env
): Promise<AiAutomationRolloutResolution> {
  const modeResolution = resolveAiAutomationMode(workflow, env)
  const registry = await fetchControlRows()
  return resolveAiAutomationRolloutResolution(
    modeResolution,
    registry.controls.get(workflow) ?? null,
    {
      rolloutRegistryStatus: registry.status,
      rolloutRegistryNote: registry.note
    }
  )
}

export async function getAiAutomationRuntimeResolutions(
  env: NodeJS.ProcessEnv = process.env
): Promise<AiAutomationRolloutResolution[]> {
  const registry = await fetchControlRows()
  return getAiAutomationModeResolutions(env).map((modeResolution) =>
    resolveAiAutomationRolloutResolution(
      modeResolution,
      registry.controls.get(modeResolution.workflow) ?? null,
      {
        rolloutRegistryStatus: registry.status,
        rolloutRegistryNote: registry.note
      }
    )
  )
}

export async function listAiAutomationRolloutEvents(
  workflow: AiAutomationWorkflow,
  limit = 10
): Promise<RolloutEventRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_automation_rollout_events')
      .select(
        'id, workflow, from_rollout_state, to_rollout_state, reason, review_owner, approved_by, acted_by_user_id, metadata, created_at'
      )
      .eq('workflow', workflow)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data ?? []) as RolloutEventRow[]
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`Failed to load ai automation rollout events for ${workflow}`, error)
    }
    return []
  }
}

async function validateTransition(
  resolution: AiAutomationRolloutResolution,
  input: AiAutomationRolloutMutationInput
): Promise<TransitionValidationResult> {
  const reason = trimOrNull(input.reason)
  const reviewOwner = trimOrNull(input.reviewOwner)

  if (!reason) {
    return { ok: false, status: 400, error: 'reason is required' }
  }

  if (input.targetState === resolution.rolloutState) {
    return { ok: false, status: 409, error: 'workflow already has the requested rollout state' }
  }

  if (input.targetState === 'disabled') {
    return { ok: true }
  }

  if (resolution.shadowCapped) {
    if (input.targetState === 'shadow_only') {
      return { ok: true }
    }

    return {
      ok: false,
      status: 409,
      error: 'shadow-capped workflows cannot move beyond shadow_only'
    }
  }

  if (input.targetState === 'shadow') {
    return { ok: true }
  }

  if (input.targetState === 'shadow_live_ready') {
    if (!resolution.controlledLiveCandidate || resolution.workflow !== 'ops_digest') {
      return {
        ok: false,
        status: 409,
        error: 'only ops_digest can enter shadow_live_ready in the current Phase 12 cycle'
      }
    }

    if (!reviewOwner) {
      return { ok: false, status: 400, error: 'reviewOwner is required when marking a workflow ready for review' }
    }

    const evidence = await hasOpsDigestShadowEvidence()
    if (!evidence.ok) {
      return {
        ok: false,
        status: 409,
        error: evidence.error
      }
    }

    return { ok: true }
  }

  if (input.targetState === 'controlled_live') {
    if (!resolution.controlledLiveCandidate || resolution.workflow !== 'ops_digest') {
      return {
        ok: false,
        status: 409,
        error: 'only ops_digest can move to controlled_live in Phase 12'
      }
    }

    if (resolution.effectiveMode !== 'live') {
      return {
        ok: false,
        status: 409,
        error: 'controlled_live requires the env ceiling to resolve to live'
      }
    }

    if (
      resolution.rolloutState !== 'shadow_live_ready' &&
      resolution.rolloutState !== 'paused_after_review'
    ) {
      return {
        ok: false,
        status: 409,
        error:
          'controlled_live requires the workflow to be marked ready for review or resumed from paused_after_review first'
      }
    }

    return { ok: true }
  }

  if (input.targetState === 'paused_after_review') {
    return { ok: true }
  }

  return { ok: false, status: 400, error: 'unsupported rollout transition' }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function getAuditResultState(value: unknown): string | null {
  const summary = asRecord(value)
  const audit = asRecord(summary?.aiAutomationAudit)
  return typeof audit?.resultState === 'string' ? audit.resultState : null
}

async function hasOpsDigestShadowEvidence(requiredRuns = 7): Promise<{
  ok: boolean
  error: string
}> {
  const { data, error } = await supabaseAdmin
    .from('daily_ops_digests')
    .select('ai_mode, ci_summary, created_at')
    .order('created_at', { ascending: false })
    .limit(requiredRuns)

  if (error) {
    return {
      ok: false,
      error: 'Unable to verify ops_digest shadow evidence'
    }
  }

  let observedRuns = 0
  for (const row of (data ?? []) as Array<{ ai_mode?: string | null; ci_summary?: unknown }>) {
    if (row.ai_mode !== 'shadow') {
      continue
    }

    if (getAuditResultState(row.ci_summary) === 'error') {
      return {
        ok: false,
        error: 'ops_digest shadow evidence includes an error trace and is not ready for review'
      }
    }

    observedRuns += 1
    if (observedRuns >= requiredRuns) {
      return { ok: true, error: '' }
    }
  }

  return {
    ok: false,
    error: `ops_digest requires ${requiredRuns} distinct reviewable shadow runs without critical errors before it can be marked ready for review`
  }
}

export async function updateAiAutomationRolloutState(input: {
  workflow: AiAutomationWorkflow
  mutation: AiAutomationRolloutMutationInput
  actingAdminUserId: string
  env?: NodeJS.ProcessEnv
}): Promise<AiAutomationRolloutMutationResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for rollout control writes')
  }

  const registry = await fetchControlRows()
  const modeResolution = resolveAiAutomationMode(input.workflow, input.env)
  const currentResolution = resolveAiAutomationRolloutResolution(
    modeResolution,
    registry.controls.get(input.workflow) ?? null,
    {
      rolloutRegistryStatus: registry.status,
      rolloutRegistryNote: registry.note
    }
  )
  const validation = await validateTransition(currentResolution, input.mutation)

  if (!validation.ok) {
    const error = new Error(validation.error)
    ;(error as Error & { status?: number }).status = validation.status
    throw error
  }

  const nowIso = new Date().toISOString()
  const reviewOwner = trimOrNull(input.mutation.reviewOwner) ?? currentResolution.reviewOwner
  const reason = trimOrNull(input.mutation.reason)
  const approvedBy =
    input.mutation.targetState === 'controlled_live' ? input.actingAdminUserId : null

  const upsertPayload = {
    workflow: input.workflow,
    rollout_state: input.mutation.targetState,
    reason,
    review_owner: reviewOwner,
    approved_by: approvedBy,
    updated_by_user_id: input.actingAdminUserId,
    last_reviewed_at:
      input.mutation.targetState === 'shadow_live_ready' ||
      input.mutation.targetState === 'controlled_live' ||
      input.mutation.targetState === 'paused_after_review'
        ? nowIso
        : currentResolution.lastReviewedAt,
    metadata: input.mutation.metadata ?? {},
    updated_at: nowIso
  }

  const { data: controlData, error: controlError } = await supabaseAdmin
    .from('ai_automation_rollout_controls')
    .upsert(upsertPayload, { onConflict: 'workflow' })
    .select(
      'workflow, rollout_state, reason, review_owner, approved_by, updated_by_user_id, last_reviewed_at, metadata, created_at, updated_at'
    )
    .single()

  if (controlError) {
    throw controlError
  }

  const control = toRolloutControl(controlData as RolloutControlRow)
  if (!control) {
    throw new Error('Unable to normalise rollout control row')
  }

  const { data: eventData, error: eventError } = await supabaseAdmin
    .from('ai_automation_rollout_events')
    .insert({
      workflow: input.workflow,
      from_rollout_state: currentResolution.rolloutState,
      to_rollout_state: input.mutation.targetState,
      reason,
      review_owner: reviewOwner,
      approved_by: approvedBy,
      acted_by_user_id: input.actingAdminUserId,
      metadata: input.mutation.metadata ?? {}
    })
    .select(
      'id, workflow, from_rollout_state, to_rollout_state, reason, review_owner, approved_by, acted_by_user_id, metadata, created_at'
    )
    .single()

  if (eventError) {
    throw eventError
  }

  const resolution = resolveAiAutomationRolloutResolution(modeResolution, control, {
    rolloutRegistryStatus: 'available',
    rolloutRegistryNote: null
  })

  return {
    control,
    resolution,
    event: eventData as RolloutEventRow
  }
}
