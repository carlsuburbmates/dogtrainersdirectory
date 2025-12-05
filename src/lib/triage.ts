import { AgeSpecialty, BehaviorIssue, DistanceFilter, isValidBehaviorIssue } from '../types/database'
import { SuburbResult } from './api'

export type AgeStageValue =
  | '0-2'
  | '2-6'
  | '6-12'
  | '12-18'
  | '18-36'
  | '36-84'
  | '84-120'
  | '120-plus'
  | 'not-sure'

export const AGE_STAGE_OPTIONS: { value: AgeStageValue; label: string; description: string; specialties: AgeSpecialty[] | null }[] = [
  { value: '0-2', label: '0–2 months', description: 'Newborn puppies just home', specialties: ['puppies_0_6m'] },
  { value: '2-6', label: '2–6 months (Puppy)', description: 'Classic puppy school stage', specialties: ['puppies_0_6m'] },
  { value: '6-12', label: '6–12 months (Teen)', description: 'Adolescent energy spike', specialties: ['adolescent_6_18m'] },
  { value: '12-18', label: '12–18 months (Young adult)', description: 'Still finishing adolescence', specialties: ['adolescent_6_18m'] },
  { value: '18-36', label: '18 months – 3 years', description: 'Young adult dogs', specialties: ['adult_18m_7y'] },
  { value: '36-84', label: '3 – 7 years (Prime adult)', description: 'Adult routine support', specialties: ['adult_18m_7y'] },
  { value: '84-120', label: '7 – 10 years (Senior)', description: 'Support for ageing dogs', specialties: ['senior_7y_plus'] },
  { value: '120-plus', label: '10+ years (Very senior)', description: 'Mobility + medical aware', specialties: ['senior_7y_plus'] },
  { value: 'not-sure', label: "I'm not sure", description: 'Show trainers for every age', specialties: null }
]

export const ISSUE_OPTIONS: { value: BehaviorIssue; label: string }[] = [
  { value: 'pulling_on_lead', label: 'Pulling on lead' },
  { value: 'separation_anxiety', label: 'Separation anxiety' },
  { value: 'excessive_barking', label: 'Excessive barking' },
  { value: 'dog_aggression', label: 'Dog aggression' },
  { value: 'leash_reactivity', label: 'Leash reactivity' },
  { value: 'jumping_up', label: 'Jumping up' },
  { value: 'destructive_behaviour', label: 'Destructive behaviour' },
  { value: 'recall_issues', label: 'Recall issues' },
  { value: 'anxiety_general', label: 'General anxiety' },
  { value: 'resource_guarding', label: 'Resource guarding' },
  { value: 'mouthing_nipping_biting', label: 'Mouthing / nipping / biting' },
  { value: 'rescue_dog_support', label: 'Rescue dog support' },
  { value: 'socialisation', label: 'Socialisation' }
]

export const DISTANCE_OPTIONS: { value: DistanceFilter; label: string; description: string }[] = [
  { value: '0-5', label: '0–5 km', description: 'Same suburb or neighbouring areas' },
  { value: '5-15', label: '5–15 km', description: 'Short drive within your region' },
  { value: 'greater', label: 'Greater Melbourne (28 councils)', description: 'Show all trainers across metro Melbourne' }
]

export const RESULTS_SESSION_KEY = 'searchResults'
export const FILTERS_SESSION_KEY = 'searchFilters'

export const formatSuburbLabel = (suburb: SuburbResult) =>
  `${suburb.name} (${suburb.postcode}) • ${suburb.council_name}`

export const stageToSpecialties = (stage: AgeStageValue): AgeSpecialty[] | null => {
  const match = AGE_STAGE_OPTIONS.find((option) => option.value === stage)
  return match?.specialties ?? null
}

export const isValidIssueValue = (value: string): value is BehaviorIssue => isValidBehaviorIssue(value)
