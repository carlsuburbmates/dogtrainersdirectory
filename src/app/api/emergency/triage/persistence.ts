import type { DecisionMode, DecisionSource } from '@/lib/ai-types'

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
  decisionSource: DecisionSource
  aiMode: DecisionMode
  aiProvider?: string | null
  aiModel?: string | null
  aiPromptVersion?: string | null
  metadata?: Record<string, unknown>
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
    ai_mode: input.aiMode,
    ai_provider: input.aiProvider ?? null,
    ai_model: input.aiModel ?? null,
    ai_prompt_version: input.aiPromptVersion ?? null,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString()
  }
}

export function normaliseEmergencyClassificationForPersistence(value: string) {
  return normaliseEmergencyClassification(value)
}
