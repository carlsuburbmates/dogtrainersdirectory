export type EvalCase = { id?: string | number; text: string; gold_label: string }

/**
 * Evaluation Configuration
 */
export interface EvalConfig {
  positiveLabels?: string[]
}

// Default positive labels per pipeline
const DEFAULT_POSITIVE_LABELS: Record<string, string[]> = {
  triage: ['emergency'],
  moderation: ['reject']
}

/**
 * Simple baseline predictor for evaluation purposes.
 * 
 * NOTE: This is a simplified baseline for evaluation only.
 * The actual production triage logic is in the moderation.ts and
 * other service modules. This predictor uses basic keyword matching
 * to establish a performance baseline for comparison.
 * 
 * @param caseItem - The case to evaluate
 * @param pipeline - The pipeline type (triage, moderation, etc.)
 * @returns Predicted label
 */
export function tinyPredictor(caseItem: EvalCase, pipeline: string): string {
  const text = (caseItem.text || '').toLowerCase()
  if (pipeline === 'triage') {
    // Simplified baseline - actual production logic is more sophisticated
    if (text.includes('bleeding') || text.includes('choking') || text.includes('danger') || text.includes('urgent')) return 'emergency'
    if (text.includes('help') || text.includes('assist') || text.includes('advice')) return 'advice'
    return 'non-emergency'
  }

  if (pipeline === 'moderation') {
    // Simplified baseline - actual production logic is more sophisticated
    if (text.includes('spam') || text.includes('buy now') || text.includes('subscribe')) return 'reject'
    return 'approve'
  }

  return 'unknown'
}

export function scoreAgainstGold(predictions: string[], golds: string[], config?: EvalConfig) {
  if (predictions.length !== golds.length) throw new Error('predictions/gold length mismatch')
  let total = predictions.length
  let correct = 0
  let falsePos = 0
  let falseNeg = 0

  // Use configured positive labels or default set
  const positiveSet = new Set(config?.positiveLabels || ['emergency', 'reject'])

  for (let i = 0; i < total; i++) {
    if (predictions[i] === golds[i]) {
      correct++
    } else {
      const predPos = positiveSet.has(predictions[i])
      const goldPos = positiveSet.has(golds[i])
      if (predPos && !goldPos) falsePos++
      if (!predPos && goldPos) falseNeg++
    }
  }

  const accuracy = total > 0 ? (correct / total) * 100 : 0
  return { total, correct, accuracy, falsePos, falseNeg }
}
