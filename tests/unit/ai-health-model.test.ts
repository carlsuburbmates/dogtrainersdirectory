import { describe, expect, it } from 'vitest'
import {
  normalizeDecisionSourceCounts,
  summarizeBusinessListingQualityHealth,
  summarizeModerationHealth,
  summarizeDigestHealth,
  summarizeOnboardingHealth,
  summarizeScheduledShadowEvidence,
  summarizeScaffoldReviewGuidanceHealth,
  summarizeTriageHealth,
  summarizeVerificationHealth,
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
          },
          ownerSearchHandoff: {
            aiAutomationAudit: {
              resultState: 'result'
            },
            advisoryCandidate: {
              summary: 'Audit-only owner handoff advice'
            }
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
    expect(summary.handoffShadowTraceCount).toBe(1)
    expect(summary.handoffShadowErrorCount).toBe(0)
    expect(summary.lastTrace).toBe('2026-03-07T10:45:00.000Z')
    expect(summary.note).toContain('Visible decision counts come from emergency_triage_logs.decision_source.')
    expect(summary.note).toContain('3 emergency triage shadow traces recorded')
    expect(summary.note).toContain('1 differed from the visible deterministic outcome')
    expect(summary.note).toContain('1 ended in an AI error')
    expect(summary.note).toContain('did not change the visible outcome')
    expect(summary.note).toContain('1 triage-to-search advisory shadow trace recorded')
    expect(summary.note).toContain('did not change visible search params or results')
  })

  it('summarises verification traces from audit metadata as draft recommendations', () => {
    const summary = summarizeVerificationHealth([
      {
        created_at: '2026-03-07T09:00:00.000Z',
        details: {
          verificationMethod: 'deterministic',
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          },
          shadowCandidate: {
            isValid: false
          }
        }
      },
      {
        created_at: '2026-03-07T10:00:00.000Z',
        details: {
          verificationMethod: 'ai',
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          }
        }
      },
      {
        created_at: '2026-03-07T11:00:00.000Z',
        details: {
          verificationMethod: 'deterministic',
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'error'
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 1,
      deterministicDecisions: 2,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(2)
    expect(summary.errorCount).toBe(1)
    expect(summary.note).toContain('Draft verification candidates')
    expect(summary.note).toContain('Verification status changes still require an operator action')
    expect(summary.note).toContain('Shadow traces did not replace the visible deterministic outcome')
  })

  it('uses deterministic moderation draft traces for the moderation last-trace summary', () => {
    const summary = summarizeModerationHealth([
      {
        created_at: '2026-03-07T09:00:00.000Z',
        decision_source: 'deterministic'
      },
      {
        created_at: '2026-03-07T10:00:00.000Z',
        decision_source: 'manual_override'
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 0,
      deterministicDecisions: 1,
      manualOverrides: 1
    })
    expect(summary.lastTrace).toBe('2026-03-07T10:00:00.000Z')
    expect(summary.note).toContain('Draft moderation recommendations are recorded in ai_review_decisions')
    expect(summary.note).toContain('Final review approval or rejection still requires an operator action')
  })

  it('summarises digest shadow traces as advisory-only output', () => {
    const summary = summarizeDigestHealth([
      {
        created_at: '2026-03-07T09:00:00.000Z',
        ai_mode: 'shadow',
        decision_source: 'deterministic',
        ci_summary: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          },
          shadowCandidate: {
            summary: 'AI candidate'
          }
        }
      },
      {
        created_at: '2026-03-07T10:00:00.000Z',
        ai_mode: 'live',
        decision_source: 'llm',
        ci_summary: {
          aiAutomationAudit: {
            decisionSource: 'llm',
            resultState: 'result'
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 1,
      deterministicDecisions: 1,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(1)
    expect(summary.errorCount).toBe(0)
    expect(summary.note).toContain('Ops digest output is advisory only')
    expect(summary.note).toContain('No external action is executed from the digest by itself')
  })

  it('requires seven clean scheduled shadow runs before rollout evidence is ready', () => {
    const insufficient = summarizeScheduledShadowEvidence(
      Array.from({ length: 6 }, (_, index) => ({
        ai_mode: 'shadow',
        created_at: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
        ci_summary: {
          aiAutomationAudit: {
            resultState: 'result'
          }
        }
      })),
      7
    )

    expect(insufficient.ready).toBe(false)
    expect(insufficient.observedRuns).toBe(6)

    const ready = summarizeScheduledShadowEvidence(
      Array.from({ length: 7 }, (_, index) => ({
        ai_mode: 'shadow',
        created_at: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
        ci_summary: {
          aiAutomationAudit: {
            resultState: 'result'
          }
        }
      })),
      7
    )

    expect(ready.ready).toBe(true)
    expect(ready.observedRuns).toBe(7)
  })

  it('summarises onboarding shadow traces as non-outcome-changing business assistance', () => {
    const summary = summarizeOnboardingHealth([
      {
        created_at: '2026-03-07T08:30:00.000Z',
        metadata: {
          requestPath: '/api/onboarding',
          step: 'submit'
        }
      },
      {
        created_at: '2026-03-07T09:00:00.000Z',
        metadata: {
          onboardingShadowAssistance: {
            aiAutomationAudit: {
              resultState: 'result'
            },
            advisoryCandidate: {
              summary: 'Add a clearer bio and public website.'
            }
          }
        }
      },
      {
        created_at: '2026-03-07T10:00:00.000Z',
        metadata: {
          onboardingShadowAssistance: {
            aiAutomationAudit: {
              resultState: 'error'
            }
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 0,
      deterministicDecisions: 2,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(2)
    expect(summary.errorCount).toBe(1)
    expect(summary.lastTrace).toBe('2026-03-07T10:00:00.000Z')
    expect(summary.note).toContain('Business onboarding assistance is recorded as a shadow-only advisory trace')
    expect(summary.note).toContain('publication state, verification state, featured or spotlight state, and billing outcomes still follow the deterministic onboarding path')
    expect(summary.note).toContain('Shadow traces did not replace the visible deterministic outcome')
  })

  it('uses only real onboarding shadow traces for the onboarding last-trace summary', () => {
    const summary = summarizeOnboardingHealth([
      {
        created_at: '2026-03-07T11:30:00.000Z',
        metadata: {
          requestPath: '/api/onboarding',
          step: 'submit'
        }
      },
      {
        created_at: '2026-03-07T10:45:00.000Z',
        metadata: {
          onboardingShadowAssistance: {
            aiAutomationAudit: {
              resultState: 'result'
            },
            advisoryCandidate: {
              summary: 'Clarify service areas before publication review.'
            }
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 0,
      deterministicDecisions: 1,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(1)
    expect(summary.errorCount).toBe(0)
    expect(summary.lastTrace).toBe('2026-03-07T10:45:00.000Z')
  })

  it('summarises business listing-quality shadow traces as business-facing advisory output', () => {
    const summary = summarizeBusinessListingQualityHealth([
      {
        created_at: '2026-03-10T11:00:00.000Z',
        metadata: {
          businessListingQualityShadow: {
            aiAutomationAudit: {
              resultState: 'result'
            },
            advisoryCandidate: {
              summary: 'Add clearer pricing guidance.'
            }
          }
        }
      },
      {
        created_at: '2026-03-10T12:00:00.000Z',
        metadata: {
          businessListingQualityShadow: {
            aiAutomationAudit: {
              resultState: 'error'
            }
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 0,
      deterministicDecisions: 2,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(2)
    expect(summary.errorCount).toBe(1)
    expect(summary.lastTrace).toBe('2026-03-10T12:00:00.000Z')
    expect(summary.note).toContain('Business listing-quality guidance is recorded as a business-facing shadow-only advisory trace')
    expect(summary.note).toContain('publication, verification, featured or spotlight state, billing, checkout, and ranking outcomes remain unchanged')
    expect(summary.note).toContain('Shadow traces did not replace the visible deterministic outcome')
  })

  it('summarises scaffold review guidance traces as operator-only shadow output', () => {
    const summary = summarizeScaffoldReviewGuidanceHealth([
      {
        created_at: '2026-03-10T11:00:00.000Z',
        metadata: {
          operatorScaffoldReviewGuidance: {
            aiAutomationAudit: {
              resultState: 'result'
            }
          }
        }
      }
    ])

    expect(summary.counts).toEqual({
      aiDecisions: 0,
      deterministicDecisions: 1,
      manualOverrides: 0
    })
    expect(summary.shadowTraceCount).toBe(1)
    expect(summary.note).toContain('operator-only shadow trace')
    expect(summary.note).toContain('visible scaffold queue')
  })
})
