import { describe, expect, it } from 'vitest'
import { normalizeDecisionSourceCounts, toAiPercentage } from '@/app/admin/ai-health/model'

describe('ai-health model helpers', () => {
  it('combines manual and manual_override into manualOverrides', () => {
    const result = normalizeDecisionSourceCounts({
      llm: 10,
      deterministic: 4,
      manual: 2,
      manualOverride: 3
    })

    expect(result).toEqual({
      aiDecisions: 10,
      deterministicDecisions: 4,
      manualOverrides: 5
    })
  })

  it('returns 0 ai percentage when there are no decisions', () => {
    expect(toAiPercentage(0, 0, 0)).toBe(0)
  })

  it('calculates ai percentage from all decision sources', () => {
    // 5 / (5 + 3 + 2) = 50%
    expect(toAiPercentage(5, 3, 2)).toBe(50)
  })
})
