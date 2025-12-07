export type EvalCase = { id?: string | number; text: string; gold_label: string }

export function tinyPredictor(caseItem: EvalCase, pipeline: string): string {
  const text = (caseItem.text || '').toLowerCase()
  if (pipeline === 'triage') {
    if (text.includes('bleeding') || text.includes('choking') || text.includes('danger') || text.includes('urgent')) return 'emergency'
    if (text.includes('help') || text.includes('assist') || text.includes('advice')) return 'advice'
    return 'non-emergency'
  }

  if (pipeline === 'moderation') {
    if (text.includes('spam') || text.includes('buy now') || text.includes('subscribe')) return 'reject'
    return 'approve'
  }

  return 'unknown'
}

export function scoreAgainstGold(predictions: string[], golds: string[]) {
  if (predictions.length !== golds.length) throw new Error('predictions/gold length mismatch')
  let total = predictions.length
  let correct = 0
  let falsePos = 0
  let falseNeg = 0

  for (let i = 0; i < total; i++) {
    if (predictions[i] === golds[i]) {
      correct++
    } else {
      const positiveSet = new Set(['emergency', 'reject'])
      const predPos = positiveSet.has(predictions[i])
      const goldPos = positiveSet.has(golds[i])
      if (predPos && !goldPos) falsePos++
      if (!predPos && goldPos) falseNeg++
    }
  }

  const accuracy = total > 0 ? (correct / total) * 100 : 0
  return { total, correct, accuracy, falsePos, falseNeg }
}
