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
      decisionSource: 'deterministic'
    })

    expect(payload.description).toBe('Dog is anxious around visitors')
    expect(payload.predicted_category).toBe('normal')
    expect(payload.recommended_flow).toBe('normal')
    expect(payload.situation).toBe('Dog is anxious around visitors')
    expect(payload.classification).toBe('normal')
  })

  it('normalises unsupported categories to a schema-safe value', () => {
    expect(normaliseEmergencyClassificationForPersistence('unexpected')).toBe('normal')
    expect(normaliseEmergencyClassificationForPersistence('MEDICAL')).toBe('medical')
  })
})
