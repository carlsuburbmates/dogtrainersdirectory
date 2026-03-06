import { describe, expect, it } from 'vitest'
import {
  buildEmergencyTriageLogInsert,
  normaliseEmergencyClassificationForPersistence
} from '@/app/api/emergency/triage/persistence'

describe('emergency triage persistence payload', () => {
  it('includes required schema columns for emergency_triage_logs', () => {
    const payload = buildEmergencyTriageLogInsert({
      situation: 'Dog is anxious around visitors',
      location: 'Melbourne',
      contact: '0400000000',
      dogAge: 'adult',
      issues: ['anxiety_general'],
      classification: 'normal',
      priority: 'low',
      followUpActions: ['Monitor situation'],
      decisionSource: 'deterministic',
      aiMode: 'shadow',
      aiProvider: 'deterministic',
      aiModel: null,
      aiPromptVersion: 'emergency-triage-v1',
      metadata: { test: true }
    })

    expect(payload.description).toBe('Dog is anxious around visitors')
    expect(payload.predicted_category).toBe('normal')
    expect(payload.recommended_flow).toBe('normal')
    expect(payload.situation).toBe('Dog is anxious around visitors')
    expect(payload.classification).toBe('normal')
    expect(payload.ai_mode).toBe('shadow')
    expect(payload.ai_prompt_version).toBe('emergency-triage-v1')
    expect(payload.metadata).toEqual({ test: true })
  })

  it('preserves deterministic visible outcome fields for shadow triage writes alongside shadow audit metadata', () => {
    const payload = buildEmergencyTriageLogInsert({
      situation: 'Dog looks lost near the oval',
      location: 'Melbourne',
      contact: '0400000000',
      dogAge: 'adult',
      issues: ['lost_dog'],
      classification: 'stray',
      priority: 'medium',
      followUpActions: ['Check for ID tags'],
      decisionSource: 'deterministic',
      aiMode: 'shadow',
      aiProvider: 'zai',
      aiModel: 'glm-4.6',
      aiPromptVersion: 'emergency-triage-v1',
      metadata: {
        aiAutomationAudit: {
          effectiveMode: 'shadow',
          decisionSource: 'llm',
          resultState: 'result'
        },
        shadowCandidate: {
          classification: 'crisis',
          priority: 'high'
        }
      }
    })

    expect(payload.ai_mode).toBe('shadow')
    expect(payload.decision_source).toBe('deterministic')
    expect(payload.metadata).toMatchObject({
      aiAutomationAudit: {
        effectiveMode: 'shadow',
        decisionSource: 'llm',
        resultState: 'result'
      },
      shadowCandidate: {
        classification: 'crisis',
        priority: 'high'
      }
    })
  })

  it('normalises unsupported categories to a schema-safe value', () => {
    expect(normaliseEmergencyClassificationForPersistence('unexpected')).toBe('normal')
    expect(normaliseEmergencyClassificationForPersistence('MEDICAL')).toBe('medical')
  })
})
