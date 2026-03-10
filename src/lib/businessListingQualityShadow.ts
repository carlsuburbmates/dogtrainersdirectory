import { generateLLMResponse } from '@/lib/llm'
import {
  buildAiAutomationAuditEvent,
  type AiAutomationAuditEvent,
  type AiAutomationResultState
} from '@/lib/ai-automation'
import type {
  BusinessProfileCompleteness,
  OwnedBusinessProfile
} from '@/lib/businessProfileManagement'

export const BUSINESS_LISTING_QUALITY_PROMPT_VERSION = 'business-listing-quality-shadow-v1'

export type BusinessListingQualityShadowCandidate = {
  summary: string
  suggestedImprovements: string[]
  trustSignals: string[]
}

export type BusinessListingQualityShadowTrace = {
  aiAutomationAudit: Record<string, unknown>
  advisoryCandidate?: BusinessListingQualityShadowCandidate
  deterministicCompleteness: BusinessProfileCompleteness
  visibleOutcome: {
    profileFieldsSaved: true
    publicationOutcomeChanged: false
    verificationOutcomeChanged: false
    featuredStateChanged: false
    spotlightStateChanged: false
    monetizationOutcomeChanged: false
    rankingOutcomeChanged: false
  }
}

type ShadowRunResult = {
  candidate: BusinessListingQualityShadowCandidate | null
  decisionSource: 'llm' | 'deterministic'
  provider: string | null
  model: string | null
  resultState: AiAutomationResultState
  errorMessage: string | null
}

function toStringArray(candidate: unknown) {
  if (!Array.isArray(candidate)) {
    return []
  }

  return candidate
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
}

export function parseBusinessListingQualityShadowCandidate(
  value: unknown
): BusinessListingQualityShadowCandidate | null {
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

  return {
    summary,
    suggestedImprovements: toStringArray(record.suggestedImprovements),
    trustSignals: toStringArray(record.trustSignals)
  }
}

export function buildBusinessListingQualityShadowPrompt(profile: OwnedBusinessProfile): string {
  const completeness = profile.completeness

  return `Review this saved dog trainer business profile and create an audit-only listing-quality advisory candidate.

Business name: ${profile.businessName}
Surface route: /account/business/${profile.businessId}
Public email: ${profile.businessEmail ? 'provided' : 'missing'}
Public phone: ${profile.businessPhone ? 'provided' : 'missing'}
Website: ${profile.website ? 'provided' : 'missing'}
Address: ${profile.address ? 'provided' : 'missing'}
Bio length: ${profile.bio.trim().length}
Pricing: ${profile.pricing ? 'provided' : 'missing'}
Primary service: ${profile.primaryService}
Secondary services: ${profile.secondaryServices.join(', ') || 'none supplied'}
Age specialties: ${profile.ages.join(', ') || 'none supplied'}
Behaviour issues: ${profile.issues.join(', ') || 'none supplied'}
Completeness score: ${completeness.score}
Completed checks: ${completeness.completedItems.join(', ') || 'none'}
Missing checks: ${completeness.missingItems.join(', ') || 'none'}

Return JSON with keys:
- summary: string
- suggestedImprovements: string[]
- trustSignals: string[]

Rules:
- This output is shadow-only and audit-only.
- Do not propose publication, verification, ABN, featured placement, spotlight, billing, checkout, or ranking changes.
- Keep suggestedImprovements and trustSignals to at most three short items each.
- Avoid repeating raw contact details or ABN values.
- Focus on profile clarity, completeness, and trust-signalling for the business-owned surface.`
}

export async function runBusinessListingQualityShadow(
  profile: OwnedBusinessProfile
): Promise<ShadowRunResult> {
  const llmResponse = await generateLLMResponse({
    systemPrompt:
      'You are assessing a saved dog trainer business profile for audit-only listing-quality advice. Respond with JSON only.',
    userPrompt: buildBusinessListingQualityShadowPrompt(profile)
  })

  if (llmResponse.provider === 'deterministic') {
    return {
      candidate: null,
      decisionSource: 'deterministic',
      provider: llmResponse.provider ?? null,
      model: llmResponse.model ?? null,
      resultState: 'no_result',
      errorMessage: llmResponse.text
    }
  }

  try {
    const parsed = JSON.parse(llmResponse.text)
    const candidate = parseBusinessListingQualityShadowCandidate(parsed)

    return {
      candidate,
      decisionSource: 'llm',
      provider: llmResponse.provider ?? null,
      model: llmResponse.model ?? null,
      resultState: candidate ? 'result' : 'no_result',
      errorMessage: candidate ? null : 'No business listing-quality advisory candidate was produced.'
    }
  } catch {
    return {
      candidate: null,
      decisionSource: 'llm',
      provider: llmResponse.provider ?? null,
      model: llmResponse.model ?? null,
      resultState: 'error',
      errorMessage: 'Invalid JSON response from business listing-quality shadow assistant'
    }
  }
}

export function buildBusinessListingQualityShadowTrace(input: {
  profile: OwnedBusinessProfile
  resultState: AiAutomationResultState
  decisionSource: 'llm' | 'deterministic'
  errorMessage: string | null
  candidate: BusinessListingQualityShadowCandidate | null
}): BusinessListingQualityShadowTrace {
  const auditEvent: AiAutomationAuditEvent = {
    workflowFamily: 'business_listing_quality',
    actorClass: 'business',
    effectiveMode: 'shadow',
    approvalState: 'not_required',
    resultState: input.resultState,
    decisionSource: input.decisionSource,
    routeOrJob: `/account/business/${input.profile.businessId}`,
    summary:
      input.resultState === 'result'
        ? 'Shadow business listing-quality guidance recorded while the business-owned profile save remained deterministic.'
        : input.resultState === 'error'
          ? 'Shadow business listing-quality guidance failed while the business-owned profile save remained deterministic.'
          : 'Shadow business listing-quality guidance produced no candidate while the business-owned profile save remained deterministic.',
    errorMessage: input.errorMessage,
    resultingRecordReferences: [
      {
        table: 'latency_metrics',
        field: 'metadata.businessListingQualityShadow'
      },
      { table: 'businesses', id: input.profile.businessId }
    ],
    notes: [
      'The saved business-owned profile fields came from the deterministic request payload.',
      'Publication, verification, featured, spotlight, billing, checkout, and ranking outcomes remained unchanged.'
    ]
  }

  return {
    aiAutomationAudit: buildAiAutomationAuditEvent(auditEvent),
    ...(input.candidate ? { advisoryCandidate: input.candidate } : {}),
    deterministicCompleteness: input.profile.completeness,
    visibleOutcome: {
      profileFieldsSaved: true,
      publicationOutcomeChanged: false,
      verificationOutcomeChanged: false,
      featuredStateChanged: false,
      spotlightStateChanged: false,
      monetizationOutcomeChanged: false,
      rankingOutcomeChanged: false
    }
  }
}
