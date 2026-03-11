import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAiAutomationRuntimeResolutions: vi.fn(),
  updateAiAutomationRolloutState: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: mocks.requireAdmin
}))

vi.mock('@/lib/ai-rollouts', () => ({
  getAiAutomationRuntimeResolutions: mocks.getAiAutomationRuntimeResolutions,
  updateAiAutomationRolloutState: mocks.updateAiAutomationRolloutState
}))

import { GET } from '@/app/api/admin/ai-rollouts/route'
import { PATCH } from '@/app/api/admin/ai-rollouts/[workflow]/route'

describe('admin ai rollout routes', () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset()
    mocks.getAiAutomationRuntimeResolutions.mockReset()
    mocks.updateAiAutomationRolloutState.mockReset()
  })

  it('rejects non-admin rollout reads', async () => {
    mocks.requireAdmin.mockResolvedValue({ authorized: false, userId: null })

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns rollout resolutions for admin reads', async () => {
    mocks.requireAdmin.mockResolvedValue({ authorized: true, userId: 'admin-1' })
    mocks.getAiAutomationRuntimeResolutions.mockResolvedValue([
      {
        workflow: 'ops_digest',
        rolloutState: 'shadow',
        finalRuntimeMode: 'shadow'
      }
    ])

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.workflows).toEqual([
      expect.objectContaining({
        workflow: 'ops_digest',
        rolloutState: 'shadow',
        finalRuntimeMode: 'shadow'
      })
    ])
  })

  it('rejects invalid rollout target states', async () => {
    mocks.requireAdmin.mockResolvedValue({ authorized: true, userId: 'admin-1' })

    const request = new Request('http://localhost/api/admin/ai-rollouts/ops_digest', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetState: 'invalid_state',
        reason: 'Nope'
      })
    })

    const response = await PATCH(request as any, {
      params: Promise.resolve({ workflow: 'ops_digest' })
    })

    expect(response.status).toBe(400)
  })

  it('passes acting admin identity into rollout mutations', async () => {
    mocks.requireAdmin.mockResolvedValue({ authorized: true, userId: 'admin-9' })
    mocks.updateAiAutomationRolloutState.mockResolvedValue({
      control: { workflow: 'ops_digest', rolloutState: 'shadow_live_ready' },
      resolution: { workflow: 'ops_digest', rolloutState: 'shadow_live_ready' },
      event: { id: 'evt-1' }
    })

    const request = new Request('http://localhost/api/admin/ai-rollouts/ops_digest', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetState: 'shadow_live_ready',
        reason: 'Reviewed shadow evidence',
        reviewOwner: 'main-control'
      })
    })

    const response = await PATCH(request as any, {
      params: Promise.resolve({ workflow: 'ops_digest' })
    })

    expect(response.status).toBe(200)
    expect(mocks.updateAiAutomationRolloutState).toHaveBeenCalledWith({
      workflow: 'ops_digest',
      mutation: {
        targetState: 'shadow_live_ready',
        reason: 'Reviewed shadow evidence',
        reviewOwner: 'main-control',
        metadata: null
      },
      actingAdminUserId: 'admin-9'
    })
  })
})
