import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  controls: [] as Array<Record<string, unknown>>,
  upsertPayloads: [] as Array<Record<string, unknown>>,
  eventPayloads: [] as Array<Record<string, unknown>>
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'ai_automation_rollout_controls') {
        return {
          select: vi.fn(async () => ({ data: state.controls, error: null })),
          upsert: vi.fn((payload: Record<string, unknown>) => {
            state.upsertPayloads.push(payload)
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    workflow: payload.workflow,
                    rollout_state: payload.rollout_state,
                    reason: payload.reason,
                    review_owner: payload.review_owner,
                    approved_by: payload.approved_by,
                    updated_by_user_id: payload.updated_by_user_id,
                    last_reviewed_at: payload.last_reviewed_at,
                    metadata: payload.metadata,
                    created_at: '2026-03-11T00:00:00.000Z',
                    updated_at: payload.updated_at
                  },
                  error: null
                }))
              }))
            }
          })
        }
      }

      if (table === 'ai_automation_rollout_events') {
        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.eventPayloads.push(payload)
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'event-1',
                    workflow: payload.workflow,
                    from_rollout_state: payload.from_rollout_state,
                    to_rollout_state: payload.to_rollout_state,
                    reason: payload.reason,
                    review_owner: payload.review_owner,
                    approved_by: payload.approved_by,
                    acted_by_user_id: payload.acted_by_user_id,
                    metadata: payload.metadata,
                    created_at: '2026-03-11T00:00:00.000Z'
                  },
                  error: null
                }))
              }))
            }
          })
        }
      }

      if (table === 'daily_ops_digests') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({
                data: Array.from({ length: 7 }, (_, index) => ({
                  ai_mode: 'shadow',
                  ci_summary: {
                    aiAutomationAudit: {
                      resultState: 'result'
                    }
                  },
                  created_at: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`
                })),
                error: null
              }))
            }))
          }))
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })
  }
}))

import {
  getAiAutomationRuntimeResolution,
  updateAiAutomationRolloutState
} from '@/lib/ai-rollouts'

function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return {
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    ...values
  } as unknown as NodeJS.ProcessEnv
}

describe('ai rollout registry', () => {
  beforeEach(() => {
    state.controls = []
    state.upsertPayloads = []
    state.eventPayloads = []
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test'
  })

  it('falls back to implicit shadow state when no control row exists for a live-capable workflow', async () => {
    const resolution = await getAiAutomationRuntimeResolution(
      'ops_digest',
      env({ AI_GLOBAL_MODE: 'live' })
    )

    expect(resolution.implicitRolloutState).toBe('shadow')
    expect(resolution.rolloutState).toBe('shadow')
    expect(resolution.finalRuntimeMode).toBe('shadow')
  })

  it('blocks shadow-capped workflows from moving to shadow_live_ready', async () => {
    await expect(
      updateAiAutomationRolloutState({
        workflow: 'onboarding',
        mutation: {
          targetState: 'shadow_live_ready',
          reason: 'Attempt to promote',
          reviewOwner: 'ops'
        },
        actingAdminUserId: 'admin-1',
        env: env({ AI_GLOBAL_MODE: 'live' })
      })
    ).rejects.toMatchObject({
      message: 'shadow-capped workflows cannot move beyond shadow_only',
      status: 409
    })
  })

  it('blocks controlled_live when the env ceiling is not live', async () => {
    state.controls = [
      {
        workflow: 'ops_digest',
        rollout_state: 'shadow_live_ready',
        reason: 'Ready',
        review_owner: 'ops',
        approved_by: null,
        updated_by_user_id: 'admin-1',
        last_reviewed_at: '2026-03-11T00:00:00.000Z',
        metadata: {},
        created_at: '2026-03-11T00:00:00.000Z',
        updated_at: '2026-03-11T00:00:00.000Z'
      }
    ]

    await expect(
      updateAiAutomationRolloutState({
        workflow: 'ops_digest',
        mutation: {
          targetState: 'controlled_live',
          reason: 'Trying to enable',
          reviewOwner: 'ops'
        },
        actingAdminUserId: 'admin-1',
        env: env({ AI_GLOBAL_MODE: 'shadow', DIGEST_AI_MODE: 'shadow' })
      })
    ).rejects.toMatchObject({
      message: 'controlled_live requires the env ceiling to resolve to live',
      status: 409
    })
  })

  it('records acting admin identity on a successful rollout mutation', async () => {
    const result = await updateAiAutomationRolloutState({
      workflow: 'ops_digest',
      mutation: {
        targetState: 'shadow_live_ready',
        reason: 'Shadow evidence reviewed',
        reviewOwner: 'main-control'
      },
      actingAdminUserId: 'admin-42',
      env: env({ AI_GLOBAL_MODE: 'live', DIGEST_AI_MODE: 'live' })
    })

    expect(result.control.rolloutState).toBe('shadow_live_ready')
    expect(result.resolution.rolloutState).toBe('shadow_live_ready')
    expect(state.eventPayloads[0]).toMatchObject({
      workflow: 'ops_digest',
      from_rollout_state: 'shadow',
      to_rollout_state: 'shadow_live_ready',
      acted_by_user_id: 'admin-42',
      review_owner: 'main-control'
    })
  })
})
