import { describe, it, expect } from 'vitest'
import { tinyPredictor, scoreAgainstGold } from '../../lib/eval'

describe('eval helpers', () => {
  it('tinyPredictor categorizes triage emergency correctly', () => {
    const c = { text: 'My dog is bleeding badly', gold_label: 'emergency' }
    expect(tinyPredictor(c as any, 'triage')).toBe('emergency')
  })

  it('tinyPredictor categorizes triage advice correctly', () => {
    const c = { text: 'I need help with housetraining', gold_label: 'advice' }
    expect(tinyPredictor(c as any, 'triage')).toBe('advice')
  })

  it('tinyPredictor returns non-emergency for neutral text', () => {
    const c = { text: 'Looking for classes', gold_label: 'non-emergency' }
    expect(tinyPredictor(c as any, 'triage')).toBe('non-emergency')
  })

  it('scoreAgainstGold computes accuracy and errors', () => {
    const preds = ['emergency', 'advice', 'non-emergency', 'approve']
    const golds = ['emergency', 'advice', 'non-emergency', 'reject']
    const { total, correct, accuracy, falsePos, falseNeg } = scoreAgainstGold(preds, golds)
    expect(total).toBe(4)
    expect(correct).toBe(3)
    expect(Math.round(accuracy)).toBe(75)
    // last case: predicted approve (non-positive) but gold is reject (positive) -> FN
    expect(falseNeg).toBe(1)
    expect(falsePos).toBe(0)
  })
})
