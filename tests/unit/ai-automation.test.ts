import { describe, expect, it } from 'vitest'
import {
  buildAiAutomationAuditEvent,
  getAiAutomationVisibility,
  resolveAiAutomationMode
} from '@/lib/ai-automation'

function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as unknown as NodeJS.ProcessEnv
}

describe('ai automation substrate', () => {
  it('uses the workflow override ahead of the global mode', () => {
    const resolution = resolveAiAutomationMode('triage', env({
      AI_GLOBAL_MODE: 'live',
      TRIAGE_AI_MODE: 'shadow'
    }))

    expect(resolution.globalMode).toBe('live')
    expect(resolution.overrideMode).toBe('shadow')
    expect(resolution.effectiveMode).toBe('shadow')
    expect(resolution.killSwitchActive).toBe(false)
  })

  it('treats disabled as the kill switch state', () => {
    const resolution = resolveAiAutomationMode('moderation', env({
      AI_GLOBAL_MODE: 'disabled'
    }))

    expect(resolution.effectiveMode).toBe('disabled')
    expect(resolution.killSwitchActive).toBe(true)
  })

  it('clamps onboarding to shadow even when the global mode is live', () => {
    const resolution = resolveAiAutomationMode('onboarding', env({
      AI_GLOBAL_MODE: 'live'
    }))

    expect(resolution.overrideMode).toBeNull()
    expect(resolution.effectiveMode).toBe('shadow')
    expect(resolution.auditStorage).toBe('latency_metrics')
    expect(resolution.usesGlobalDefault).toBe(true)
  })

  it('clamps business listing quality guidance to shadow even when the global mode is live', () => {
    const resolution = resolveAiAutomationMode('business_listing_quality', env({
      AI_GLOBAL_MODE: 'live'
    }))

    expect(resolution.overrideMode).toBeNull()
    expect(resolution.effectiveMode).toBe('shadow')
    expect(resolution.actorClass).toBe('business')
    expect(resolution.auditStorage).toBe('latency_metrics')
  })

  it('marks llm-backed workflows as degraded when the provider is not configured', () => {
    const resolution = resolveAiAutomationMode('ops_digest', env({
      AI_GLOBAL_MODE: 'shadow'
    }))

    const visibility = getAiAutomationVisibility(resolution, {
      auditConnected: true,
      llmConfigured: false
    })

    expect(visibility).toMatchObject({
      state: 'degraded',
      label: 'Degraded'
    })
  })

  it('builds the structured audit envelope expected by AA-702', () => {
    expect(
      buildAiAutomationAuditEvent({
        workflowFamily: 'triage',
        actorClass: 'owner',
        effectiveMode: 'shadow',
        approvalState: 'not_required',
        resultState: 'result',
        decisionSource: 'llm',
        routeOrJob: '/api/emergency/triage',
        summary: 'Shadow trace recorded.',
        resultingRecordReferences: [{ table: 'emergency_triage_logs', id: 42 }]
      })
    ).toEqual({
      version: 1,
      workflowFamily: 'triage',
      actorClass: 'owner',
      effectiveMode: 'shadow',
      approvalState: 'not_required',
      resultState: 'result',
      decisionSource: 'llm',
      routeOrJob: '/api/emergency/triage',
      summary: 'Shadow trace recorded.',
      errorMessage: null,
      resultingRecordReferences: [{ table: 'emergency_triage_logs', id: 42 }],
      notes: []
    })
  })
})
