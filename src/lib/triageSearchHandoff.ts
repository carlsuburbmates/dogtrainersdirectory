import type { AgeSpecialty, BehaviorIssue } from '@/types/database'

export type TriageSearchHandoffSuburb = {
  id: number
  name: string
  postcode: string
  council_id: number
  latitude: number
  longitude: number
}

export type TriageSearchHandoffInput = {
  age: AgeSpecialty
  issues: BehaviorIssue[]
  radius: number
  suburb: TriageSearchHandoffSuburb
}

export type OwnerSearchHandoffShadowCandidate = {
  summary: string
  suggestedSearchTerms: string[]
  focusAreas: string[]
}

export type TriageShadowEvaluationPromptInput = {
  situation: string
  location: string | null
  contact: string | null
  age: string | null
  issues: string[] | null
}

export function mapRadiusToDistance(radius: number) {
  if (radius <= 5) return '0-5'
  if (radius <= 15) return '5-15'
  return 'greater'
}

export function buildTriageSearchHandoffParams(
  input: TriageSearchHandoffInput
): URLSearchParams {
  const qs = new URLSearchParams()
  qs.set('age_specialties', input.age)

  if (input.issues.length > 0) {
    qs.set('behavior_issues', input.issues.join(','))
  }

  qs.set('distance', mapRadiusToDistance(input.radius))
  qs.set('lat', String(input.suburb.latitude))
  qs.set('lng', String(input.suburb.longitude))
  qs.set('suburbId', String(input.suburb.id))
  qs.set('suburbName', input.suburb.name)
  qs.set('postcode', input.suburb.postcode)
  qs.set('councilId', String(input.suburb.council_id))
  qs.set('flow_source', 'triage')

  return qs
}

export function buildTriageShadowEvaluationPrompt(
  input: TriageShadowEvaluationPromptInput
): string {
  const issueText =
    input.issues && input.issues.length > 0
      ? input.issues.join(', ')
      : 'none supplied'

  return `Classify this dog support request into one of these categories: "medical", "stray", "crisis", or "normal".

Situation: ${input.situation}
Location: ${input.location || 'Not provided'}
Contact: ${input.contact || 'Not provided'}
Dog age/stage: ${input.age || 'Not provided'}
Behaviour issues: ${issueText}

Return JSON with keys:
- classification: "medical" | "stray" | "crisis" | "normal"
- priority: "high" | "medium" | "low"
- followUpActions: string[]
- searchAdvisory: null OR {
    "summary": string,
    "suggestedSearchTerms": string[],
    "focusAreas": string[]
  }

Rules:
- Only include searchAdvisory when classification is "normal".
- searchAdvisory is audit-only. It must not say the user journey changed.
- Keep suggestedSearchTerms and focusAreas short and capped to three items each.`
}

export function parseOwnerSearchHandoffShadowCandidate(
  value: unknown
): OwnerSearchHandoffShadowCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const summary =
    typeof record.summary === 'string' && record.summary.trim().length > 0
      ? record.summary.trim()
      : null

  if (!summary) {
    return null
  }

  const toStringArray = (candidate: unknown) =>
    Array.isArray(candidate)
      ? candidate
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : []

  return {
    summary,
    suggestedSearchTerms: toStringArray(record.suggestedSearchTerms),
    focusAreas: toStringArray(record.focusAreas)
  }
}
