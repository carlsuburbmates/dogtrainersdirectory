import { describe, expect, it } from 'vitest'
import {
  getEmergencyIssueFlowMap,
  hasEmergencyEscalation,
  inferEmergencyFlow
} from '@/lib/triageEmergency'
import type { BehaviorIssue } from '@/types/database'

describe('triage emergency mapping', () => {
  it('returns the expected branch for every emergency-mapped issue', () => {
    const emergencyMappings = Object.entries(getEmergencyIssueFlowMap()).filter(
      (entry): entry is [BehaviorIssue, 'medical' | 'stray' | 'crisis'] => entry[1] !== null
    )

    expect(emergencyMappings.length).toBeGreaterThan(0)

    for (const [issue, flow] of emergencyMappings) {
      expect(hasEmergencyEscalation([issue])).toBe(true)
      expect(inferEmergencyFlow([issue])).toBe(flow)
    }
  })

  it('does not escalate non-emergency issues', () => {
    expect(hasEmergencyEscalation(['pulling_on_lead'])).toBe(false)
    expect(inferEmergencyFlow(['pulling_on_lead'])).toBeNull()
  })

  it('uses canonical priority when multiple emergency issues are selected', () => {
    expect(inferEmergencyFlow(['resource_guarding', 'dog_aggression'])).toBe('medical')
    expect(inferEmergencyFlow(['rescue_dog_support', 'anxiety_general'])).toBe('stray')
  })
})
