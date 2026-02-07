// Emergency Triage Classification
// Classifies user-submitted emergency descriptions into actionable categories
// Categories: medical, stray, crisis, normal

import { generateLLMResponseWithRetry } from '@/lib/llm'
import { logLLMError, logError } from '@/lib/errorLog'

export type TriageCategory = 'medical' | 'stray' | 'crisis' | 'normal'

export interface TriageResult {
  classification: TriageCategory
  confidence: number
  summary: string
  recommended_action: 'vet' | 'shelter' | 'trainer' | 'other'
  urgency: 'immediate' | 'urgent' | 'moderate' | 'low'
}

const SYSTEM_PROMPT = `
You are an emergency dispatcher for dog owners. Classify the emergency message into one of these categories:
- medical: Health or injury issues requiring a veterinarian (e.g., bleeding, choking, seizures)
- stray: Found a dog without an owner, lost dog, captured stray
- crisis: Behavioral crisis such as aggression, extreme fear, sudden dangerous behavior
- normal: Everything else that is not above

Respond strictly in JSON with keys: classification, confidence, summary, recommended_action, urgency
`

export async function classifyEmergency(message: string): Promise<TriageResult> {
  const start = Date.now()
  try {
    const resp = await generateLLMResponseWithRetry({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: message,
      maxTokens: 150,
      temperature: 0
    }, 2)

    // Try parsing JSON from response
    let parsed: any
    try {
      parsed = JSON.parse(resp.text)
    } catch (e) {
      // If parsing fails, attempt to extract JSON substring
      const match = resp.text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('LLM did not return valid JSON')
      }
    }

    // Validate fields and coerce to types
    const classification: TriageCategory = ['medical','stray','crisis','normal'].includes(parsed.classification) ? parsed.classification : 'normal'
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5))
    const summary = typeof parsed.summary === 'string' ? parsed.summary : 'No summary provided'
    const action: TriageResult['recommended_action'] = ['vet','shelter','trainer','other'].includes(parsed.recommended_action) ? parsed.recommended_action : 'other'
    const urgency: TriageResult['urgency'] = ['immediate','urgent','moderate','low'].includes(parsed.urgency) ? parsed.urgency : 'moderate'

    return { classification, confidence, summary, recommended_action: action, urgency }
  } catch (error) {
    // Log LLM-related errors for diagnostics
    try {
      await logLLMError(message, { error: (error as Error).message }, Date.now() - start, error)
    } catch {}

    // Fallback: naive rules
    const text = message.toLowerCase()
    if (/bleed|seizure|chok|poison|hit by car|unconscious|vomit|collapse/.test(text)) {
      return { classification: 'medical', confidence: 0.8, summary: 'Likely medical emergency', recommended_action: 'vet', urgency: 'immediate' }
    }
    if (/found|stray|lost dog|no collar|wandering/.test(text)) {
      return { classification: 'stray', confidence: 0.7, summary: 'Likely stray situation', recommended_action: 'shelter', urgency: 'urgent' }
    }
    if (/bite|attack|aggress|lung|snarl|fear|panic|uncontrollable/.test(text)) {
      return { classification: 'crisis', confidence: 0.7, summary: 'Likely behavioral crisis', recommended_action: 'trainer', urgency: 'urgent' }
    }
    await logError('Emergency triage fallback used', { route: 'lib/emergencyTriage', method: 'classifyEmergency' }, 'warn', 'other')
    return { classification: 'normal', confidence: 0.5, summary: 'Unclear emergency', recommended_action: 'other', urgency: 'moderate' }
  }
}
