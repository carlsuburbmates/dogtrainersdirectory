/**
 * Locked taxonomy constants per SSOT.
 * Do not edit without also updating database migrations and backend validation.
 */
import type { AgeSpecialty, BehaviorIssue, ServiceType, ResourceType, Region } from '@/types/database'

// Age/Stage Taxonomy — order matches SSOT
export const AGE_SPECIALTIES: readonly AgeSpecialty[] = [
  'puppies_0_6m',
  'adolescent_6_18m',
  'adult_18m_7y',
  'senior_7y_plus',
  'rescue_dogs'
] as const

// Labels for UI (keeps display logic separate from raw value)
export const AGE_SPECIALTY_LABELS: Record<AgeSpecialty, string> = {
  puppies_0_6m: 'Puppies (0–6 months)',
  adolescent_6_18m: 'Adolescent (6–18 months)',
  adult_18m_7y: 'Adult (18 months–7 years)',
  senior_7y_plus: 'Senior (7+ years)',
  rescue_dogs: 'Rescue/Rehomed (any age)'
} as const

// Behavior Issue Taxonomy — order matches SSOT
export const BEHAVIOR_ISSUES: readonly BehaviorIssue[] = [
  'pulling_on_lead',
  'separation_anxiety',
  'excessive_barking',
  'dog_aggression',
  'leash_reactivity',
  'jumping_up',
  'destructive_behaviour',
  'recall_issues',
  'anxiety_general',
  'resource_guarding',
  'mouthing_nipping_biting',
  'rescue_dog_support',
  'socialisation'
] as const

export const BEHAVIOR_ISSUE_LABELS: Record<BehaviorIssue, string> = {
  pulling_on_lead: 'Pulling on the lead',
  separation_anxiety: 'Separation anxiety',
  excessive_barking: 'Excessive barking',
  dog_aggression: 'Dog aggression',
  leash_reactivity: 'Leash reactivity',
  jumping_up: 'Jumping up',
  destructive_behaviour: 'Destructive behaviour',
  recall_issues: 'Recall issues',
  anxiety_general: 'General anxiety',
  resource_guarding: 'Resource guarding',
  mouthing_nipping_biting: 'Mouthing/nipping/biting',
  rescue_dog_support: 'Rescue dog support',
  socialisation: 'Socialisation'
} as const

// Service Type Taxonomy
export const SERVICE_TYPES: readonly ServiceType[] = [
  'puppy_training',
  'obedience_training',
  'behaviour_consultations',
  'group_classes',
  'private_training'
] as const

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  puppy_training: 'Puppy training',
  obedience_training: 'Obedience training',
  behaviour_consultations: 'Behaviour consultations',
  group_classes: 'Group classes',
  private_training: 'Private training'
} as const

// Emergency/Resource Type Taxonomy
export const RESOURCE_TYPES: readonly ResourceType[] = [
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter'
] as const

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  trainer: 'Trainer',
  behaviour_consultant: 'Behaviour consultant',
  emergency_vet: 'Emergency vet',
  urgent_care: 'Urgent care',
  emergency_shelter: 'Emergency shelter'
} as const

// Regional Taxonomy (Melbourne LGA Regions)
export const REGIONS: readonly Region[] = [
  'Inner City',
  'Northern',
  'Eastern',
  'South Eastern',
  'Western'
] as const

// Map of council names to regions (authoritative list per SSOT)
export const COUNCIL_REGIONS: Record<string, Region> = {
  // Inner City
  'City of Melbourne': 'Inner City',
  'City of Port Phillip': 'Inner City',
  'City of Yarra': 'Inner City',
  // Northern
  'Banyule City Council': 'Northern',
  'Brimbank City Council': 'Northern',
  'Darebin City Council': 'Northern',
  'Hume City Council': 'Northern',
  'Merri-bek City Council': 'Northern',
  'Moreland City Council': 'Northern',
  'Whittlesea City Council': 'Northern',
  // Eastern
  'Boroondara City Council': 'Eastern',
  'Knox City Council': 'Eastern',
  'Manningham City Council': 'Eastern',
  'Maroondah City Council': 'Eastern',
  'Whitehorse City Council': 'Eastern',
  'Yarra Ranges Council': 'Eastern',
  // South Eastern
  'Cardinia Shire Council': 'South Eastern',
  'Casey City Council': 'South Eastern',
  'Frankston City Council': 'South Eastern',
  'Greater Dandenong City Council': 'South Eastern',
  'Kingston City Council': 'South Eastern',
  'Mornington Peninsula Shire': 'South Eastern',
  // Western
  'Hobsons Bay City Council': 'Western',
  'Maribyrnong City Council': 'Western',
  'Melton City Council': 'Western',
  'Moonee Valley City Council': 'Western',
  'Wyndham City Council': 'Western'
} as const

// Helper to format label for display (lowercase underscored to title case)
export const formatLabel = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Runtime validation helpers to enforce source-of-truth at boundaries
export const isValidAgeSpecialty = (value: unknown): value is AgeSpecialty => {
  return AGE_SPECIALTIES.includes(value as AgeSpecialty)
}

export const isValidBehaviorIssue = (value: unknown): value is BehaviorIssue => {
  return BEHAVIOR_ISSUES.includes(value as BehaviorIssue)
}

export const isValidServiceType = (value: unknown): value is ServiceType => {
  return SERVICE_TYPES.includes(value as ServiceType)
}

export const isValidResourceType = (value: unknown): value is ResourceType => {
  return RESOURCE_TYPES.includes(value as ResourceType)
}

export const isValidRegion = (value: unknown): value is Region => {
  return REGIONS.includes(value as Region)
}