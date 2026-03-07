import type { OnboardingPayload } from '@/lib/services/onboardingPayload'

export type OnboardingShadowCandidate = {
  summary: string
  suggestedImprovements: string[]
  trustSignals: string[]
}

export function buildOnboardingShadowPrompt(payload: OnboardingPayload): string {
  const websiteState = payload.website ? 'provided' : 'missing'
  const pricingState = payload.pricing ? 'provided' : 'missing'
  const bioState = payload.bio ? 'provided' : 'missing'
  const businessEmailState = payload.businessEmail ? 'provided' : 'missing'
  const businessPhoneState = payload.businessPhone ? 'provided' : 'missing'

  return `Review this trainer onboarding submission and create an audit-only advisory candidate for listing-quality follow-up.

Business name: ${payload.businessName}
Primary service: ${payload.primaryService}
Secondary services: ${payload.secondaryServices.join(', ') || 'none supplied'}
Age specialties: ${payload.ages.join(', ') || 'none supplied'}
Behaviour issues: ${payload.issues.join(', ') || 'none supplied'}
Website: ${websiteState}
Pricing: ${pricingState}
Bio: ${bioState}
Business email: ${businessEmailState}
Business phone: ${businessPhoneState}

Return JSON with keys:
- summary: string
- suggestedImprovements: string[]
- trustSignals: string[]

Rules:
- This output is shadow-only and audit-only.
- Do not propose publication, verification, featured placement, spotlight changes, or billing actions.
- Keep suggestedImprovements and trustSignals to at most three short items each.
- Avoid repeating raw contact details, passwords, or ABN values.`
}

export function parseOnboardingShadowCandidate(value: unknown): OnboardingShadowCandidate | null {
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
    suggestedImprovements: toStringArray(record.suggestedImprovements),
    trustSignals: toStringArray(record.trustSignals)
  }
}
