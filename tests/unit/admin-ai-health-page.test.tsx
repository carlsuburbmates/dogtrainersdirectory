import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const mocks = vi.hoisted(() => ({
  getAiAutomationRuntimeResolutions: vi.fn()
}))

function makeQueryResult(data: unknown[] = []) {
  return {
    data,
    error: null
  }
}

function makeTableChain(data: unknown[] = []) {
  return {
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        order: vi.fn(async () => makeQueryResult(data))
      })),
      order: vi.fn(() => ({
        limit: vi.fn(async () => makeQueryResult(data))
      })),
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(async () => makeQueryResult(data))
          }))
        })),
        gte: vi.fn(() => ({
          order: vi.fn(async () => makeQueryResult(data))
        }))
      }))
    }))
  }
}

vi.mock('@/lib/ai-rollouts', () => ({
  getAiAutomationRuntimeResolutions: mocks.getAiAutomationRuntimeResolutions
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => makeTableChain())
  }
}))

vi.mock('@/app/admin/ai-health/rollout-controls', () => ({
  RolloutControls: () => React.createElement('div', null, 'controls')
}))

import AIHealthPage from '@/app/admin/ai-health/page'

const baseResolution = {
  globalMode: 'live',
  overrideMode: null,
  effectiveMode: 'live',
  overrideEnvVar: null,
  usesLlm: false,
  auditStorage: 'table',
  killSwitchActive: false,
  usesGlobalDefault: true,
  maxMode: 'live',
  evidenceMode: 'scheduled',
  controlledLiveCandidate: false,
  rolloutRegistryStatus: 'available',
  rolloutRegistryNote: null,
  rolloutStateSource: 'implicit_default',
  implicitRolloutState: 'shadow',
  configuredRolloutState: null,
  rolloutState: 'shadow',
  finalRuntimeMode: 'shadow',
  shadowCapped: false,
  liveCapable: true,
  liveCapableButShadowed: true,
  reason: null,
  reviewOwner: null,
  approvedBy: null,
  updatedByUserId: null,
  lastReviewedAt: null,
  metadata: null,
  createdAt: null,
  updatedAt: null
}

describe('/admin/ai-health rollout truthfulness', () => {
  it('shows registry-unavailable state instead of presenting it as an ordinary implicit shadow', async () => {
    mocks.getAiAutomationRuntimeResolutions.mockResolvedValue([
      {
        ...baseResolution,
        workflow: 'triage',
        label: 'Emergency Triage',
        actorClass: 'owner',
        overrideEnvVar: 'TRIAGE_AI_MODE',
        usesLlm: true,
        auditStorage: 'emergency_triage_logs',
        evidenceMode: 'request_driven'
      },
      {
        ...baseResolution,
        workflow: 'moderation',
        label: 'Review Moderation',
        actorClass: 'operator',
        overrideEnvVar: 'MODERATION_AI_MODE',
        auditStorage: 'ai_review_decisions'
      },
      {
        ...baseResolution,
        workflow: 'verification',
        label: 'Resource Verification',
        actorClass: 'operator',
        overrideEnvVar: 'VERIFICATION_AI_MODE',
        usesLlm: true,
        auditStorage: 'emergency_resource_verification_events'
      },
      {
        ...baseResolution,
        workflow: 'ops_digest',
        label: 'Ops Digest',
        actorClass: 'operator',
        overrideEnvVar: 'DIGEST_AI_MODE',
        usesLlm: true,
        controlledLiveCandidate: true,
        auditStorage: 'daily_ops_digests',
        rolloutRegistryStatus: 'read_failed',
        rolloutRegistryNote:
          'The rollout registry could not be read. Showing the implicit fallback state only until registry access is restored.',
        rolloutStateSource: 'registry_unavailable'
      },
      {
        ...baseResolution,
        workflow: 'onboarding',
        label: 'Business Onboarding',
        actorClass: 'business',
        maxMode: 'shadow',
        evidenceMode: 'request_driven',
        controlledLiveCandidate: false,
        shadowCapped: true,
        liveCapable: false,
        liveCapableButShadowed: false,
        implicitRolloutState: 'shadow_only',
        rolloutState: 'shadow_only',
        rolloutStateSource: 'implicit_default'
      },
      {
        ...baseResolution,
        workflow: 'business_listing_quality',
        label: 'Business Listing Quality',
        actorClass: 'business',
        maxMode: 'shadow',
        evidenceMode: 'request_driven',
        controlledLiveCandidate: false,
        shadowCapped: true,
        liveCapable: false,
        liveCapableButShadowed: false,
        implicitRolloutState: 'shadow_only',
        rolloutState: 'shadow_only',
        rolloutStateSource: 'implicit_default'
      },
      {
        ...baseResolution,
        workflow: 'scaffold_review_guidance',
        label: 'Scaffold Review Guidance',
        actorClass: 'operator',
        maxMode: 'shadow',
        evidenceMode: 'request_driven',
        controlledLiveCandidate: false,
        shadowCapped: true,
        liveCapable: false,
        liveCapableButShadowed: false,
        implicitRolloutState: 'shadow_only',
        rolloutState: 'shadow_only',
        rolloutStateSource: 'implicit_default'
      }
    ])

    const element = await AIHealthPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Registry unavailable')
    expect(html).toContain('implicit fallback state only')
  })
})
