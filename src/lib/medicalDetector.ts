// Medical Detector - Enhanced for Phase A-B of AI Automation
// Determines whether an emergency description indicates a medical urgency requiring 24-hour vet

import { generateLLMResponseWithRetry } from '@/lib/llm'
import { logLLMError } from '@/lib/errorLog'

export interface MedicalResult {
  is_medical: boolean
  severity: 'life_threatening' | 'serious' | 'moderate' | 'minor'
  symptoms: string[]
  recommended_resources: ('24hr_vet' | 'poison_control' | 'emergency_clinic')[]
  vet_wait_time_critical: boolean
}

const MEDICAL_PROMPT = `
You are a veterinary triage assistant. Analyze the dog emergency description:

Determine:
1. Is this medically urgent (needs immediate vet)?
2. What is the severity (life_threatening, serious, moderate, minor)?
3. List the most concerning symptoms
4. What resources are most needed (24hr_vet, poison_control, emergency_clinic)?

Respond strictly in JSON with keys: is_medical, severity, symptoms, recommended_resources, vet_wait_time_critical
`

export async function detectMedicalEmergency(description: string): Promise<MedicalResult> {
  const start = Date.now()
  try {
    const resp = await generateLLMResponseWithRetry(
      {
        systemPrompt: MEDICAL_PROMPT,
        userPrompt: description,
        maxTokens: 200,
        temperature: 0
      },
      2
    )

    // Try parsing JSON from response
    let parsed: any
    try {
      parsed = JSON.parse(resp.text)
    } catch (e) {
      const match = resp.text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('LLM response not valid JSON')
      }
    }

    // Validate and default fields
    const is_medical = parsed.is_medical === true || false
    const severityOptions: MedicalResult['severity'][] = ['life_threatening','serious','moderate','minor']
    const severity = severityOptions.includes(parsed.severity) ? parsed.severity : 'moderate'
    const symptoms = Array.isArray(parsed.symptoms) ? parsed.symptoms : []
    const allowedResources: MedicalResult['recommended_resources'][number][] = ['24hr_vet','poison_control','emergency_clinic']
    const resources = Array.isArray(parsed.recommended_resources) 
      ? parsed.recommended_resources.filter(
        (resource: unknown): resource is MedicalResult['recommended_resources'][number] =>
          typeof resource === 'string' && allowedResources.includes(resource as MedicalResult['recommended_resources'][number])
        )
      : []
    const waitCritical = parsed.vet_wait_time_critical === true || false

    return { is_medical, severity, symptoms, recommended_resources: resources, vet_wait_time_critical: waitCritical }
  } catch (error) {
    // Log LLM-related errors
    try {
      await logLLMError(description, { error: (error as Error).message }, Date.now() - start, error)
    } catch {}

    // Enhanced fallback based on keyword detection
    const text = description.toLowerCase()
    
    // Life-threatening keywords
    const lifeThreatening = [
      'bleeding heavily', 'not breathing', 'no pulse', 'unconscious', 'seizure', 'poison', 'hit by car',
      'choking', 'broken bone', 'bloat', 'difficulty breathing', 'pale gums', 'collapsed'
    ]
    
    // Serious but not immediately life-threatening
    const serious = [
      'vomiting', 'diarrhea', 'lethargic', 'significant pain', 'injury', 'wound', 'swelling',
      'limp', 'lameness', 'unable to walk', 'depressed', 'refusing food'
    ]
    
    // Symptoms to extract
    const symptomsMatch = []
    if (/bleed|blood|cut/.test(text)) symptomsMatch.push('bleeding')
    if (/vomit|diarrhea|throw up/.test(text)) symptomsMatch.push('vomiting/diarrhea')
    if (/pale|white|blue/.test(text + 'gums')) symptomsMatch.push('pale gums')
    if (/seizure|tremor|convulsion/.test(text)) symptomsMatch.push('seizure')
    if (/injur|wound|scratch|fracture/.test(text)) symptomsMatch.push('injury')
    if (/swell|lump|bloat/.test(text)) symptomsMatch.push('swelling')
    if (/pain|hurt难受|crying/.test(text)) symptomsMatch.push('pain')
    if (/panting|dystressed|whining/.test(text)) symptomsMatch.push('distress')
    
    // Determine resources needed
    const resources = ['24hr_vet'] as const
    const additionalResources: ('poison_control'|'emergency_clinic')[] = []
    
    // Check for poisoning indicators
    if (/poison|toxic|chemical|substance/.test(text)) {
      additionalResources.push('poison_control')
    }
    if (/trauma|hit by|collision|accident/.test(text)) {
      additionalResources.push('emergency_clinic')
    }
    
    // Determine medical urgency
    const isMedical = 
      lifeThreatening.some(kw => text.includes(kw)) ||
      serious.some(kw => text.includes(kw)) ||
      symptomsMatch.length > 0
    
    let severity: MedicalResult['severity']
    let waitCritical = false
    
    if (lifeThreatening.some(kw => text.includes(kw))) {
      severity = 'life_threatening'
      waitCritical = true
    } else if (serious.some(kw => text.includes(kw))) {
      severity = 'serious'
      waitCritical = false
    } else if (isMedical) {
      severity = 'moderate'
      waitCritical = false
    } else {
      // Return non-medical fallback with default values
      await logLLMError(description, { error: 'Medical detector fallback' }, Date.now() - start, error, { route: 'lib/medicalDetector' })
      return { is_medical: false, severity: 'minor', symptoms: [], recommended_resources: [], vet_wait_time_critical: false }
    }
    
    return {
      is_medical: isMedical,
      severity,
      symptoms: [...new Set(symptomsMatch)], // Remove duplicates
      recommended_resources: [...resources, ...new Set(additionalResources)],
      vet_wait_time_critical: waitCritical
    }
  }
}
