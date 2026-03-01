const EMERGENCY_CLASSIFICATIONS = new Set([
  'medical',
  'stray',
  'crisis',
  'normal',
  'manual_review'
] as const)

type EmergencyClassification = 'medical' | 'stray' | 'crisis' | 'normal' | 'manual_review'

type BuildEmergencyTriageLogInsertInput = {
  situation: string
  location: string | null
  contact: string | null
  dogAge: string | null
  issues: string[] | null
  classification: string
  priority: string
  followUpActions: string[]
  decisionSource: 'llm' | 'deterministic' | 'manual_override'
}

function normaliseEmergencyClassification(value: string): EmergencyClassification {
  const candidate = value.trim().toLowerCase()

  if (EMERGENCY_CLASSIFICATIONS.has(candidate as EmergencyClassification)) {
    return candidate as EmergencyClassification
  }

  return 'normal'
}

export function buildEmergencyTriageLogInsert(input: BuildEmergencyTriageLogInsertInput) {
  const persistedClassification = normaliseEmergencyClassification(input.classification)

  return {
    description: input.situation,
    predicted_category: persistedClassification,
    recommended_flow: persistedClassification,
    situation: input.situation,
    location: input.location,
    contact: input.contact,
    dog_age: input.dogAge,
    issues: input.issues,
    classification: input.classification,
    priority: input.priority,
    follow_up_actions: input.followUpActions,
    decision_source: input.decisionSource,
    created_at: new Date().toISOString()
  }
}

export function normaliseEmergencyClassificationForPersistence(value: string) {
  return normaliseEmergencyClassification(value)
}
