import { describe, expect, it } from 'vitest'
import {
  normalizeDecisionSourceCounts,
  summarizeTriageHealth,
  toAiPercentage
} from '@/app/admin/ai-health/model'

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

  it('summarises triage shadow traces from audit metadata without counting them as visible ai decisions', () => {
    const summary = summarizeTriageHealth([
      {
        created_at: '2026-03-07T10:00:00.000Z',
        ai_mode: 'shadow',
        decision_source: 'deterministic',
        classification: 'normal',
        metadata: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          },
          shadowCandidate: {
            classification: 'normal'
          }
        }
      },
      {
        created_at: '2026-03-07T10:15:00.000Z',
        ai_mode: 'live',
        decision_source: 'llm',
        classification: 'medical',
        metadata: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          }
        }
      },
      {
        created_at: '2026-03-07T10:30:00.000Z',
        ai_mode: 'shadow',
        decision_source: 'deterministic',
        classification: 'normal',
        metadata: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'error'
          }
        }
      },
      {
        created_at: '2026-03-07T10:45:00.000Z',
        ai_mode: 'shadow',
        decision_source: 'deterministic',
        classification: 'normal',
        metadata: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          },
          shadowCandidate: {
            classification: 'medical'
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 1,
      deterministicDecisions: 3,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(3)
    expect(summary.shadowErrorCount).toBe(1)
    expect(summary.shadowDisagreementCount).toBe(1)
    expect(summary.lastTrace).toBe('2026-03-07T10:45:00.000Z')
    expect(summary.note).toContain('Visible decision counts come from emergency_triage_logs.decision_source.')
    expect(summary.note).toContain('3 shadow traces recorded')
    expect(summary.note).toContain('1 differed from the visible deterministic outcome')
    expect(summary.note).toContain('1 ended in an AI error')
    expect(summary.note).toContain('did not change the visible outcome')
  })
})
