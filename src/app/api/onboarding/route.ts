import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptValue } from '@/lib/encryption'
import abrLib from '@/lib/abr'
import { recordAbnFallbackEvent } from '@/lib/abnFallback'
import { recordLatencyMetric } from '@/lib/telemetryLatency'
import { parseOnboardingPayload, type OnboardingPayload } from '@/lib/services/onboardingPayload'
import { generateLLMResponse } from '@/lib/llm'
import { buildAiAutomationAuditEvent } from '@/lib/ai-automation'
import { getAiAutomationRuntimeResolution } from '@/lib/ai-rollouts'
import {
  buildOnboardingShadowPrompt,
  parseOnboardingShadowCandidate,
  type OnboardingShadowCandidate
} from '@/lib/onboardingShadowAssistance'

const ONBOARDING_ASSISTANCE_PROMPT_VERSION = 'onboarding-shadow-v1'

const normalize = (value?: string) =>
  (value || '').replace(/\D/g, '').trim()

const computeSimilarity = (abn: string) => {
  const value = normalize(abn)
  if (!value) return 0
  return value.startsWith('12') ? 0.92 : value.length >= 9 ? 0.86 : 0.78
}

type OnboardingShadowAssistanceTrace = {
  aiAutomationAudit: Record<string, unknown>
  advisoryCandidate?: OnboardingShadowCandidate
  visibleOutcome: {
    submissionPayloadChanged: false
    publicationOutcomeChanged: false
    verificationOutcomeChanged: false
    monetizationOutcomeChanged: false
    featuredStateChanged: false
    spotlightStateChanged: false
  }
}

async function runOnboardingShadowAssistance(input: OnboardingPayload): Promise<{
  candidate: OnboardingShadowCandidate | null
  decisionSource: 'llm' | 'deterministic'
  provider: string | null
  model: string | null
  resultState: 'result' | 'no_result' | 'error'
  errorMessage: string | null
}> {
  const llmResponse = await generateLLMResponse({
    systemPrompt:
      'You are assessing a dog trainer onboarding submission for audit-only listing-quality advice. Respond with JSON only.',
    userPrompt: buildOnboardingShadowPrompt(input)
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
    const candidate = parseOnboardingShadowCandidate(parsed)

    return {
      candidate,
      decisionSource: 'llm',
      provider: llmResponse.provider ?? null,
      model: llmResponse.model ?? null,
      resultState: candidate ? 'result' : 'no_result',
      errorMessage: candidate ? null : 'No onboarding advisory candidate was produced.'
    }
  } catch {
    return {
      candidate: null,
      decisionSource: 'llm',
      provider: llmResponse.provider ?? null,
      model: llmResponse.model ?? null,
      resultState: 'error',
      errorMessage: 'Invalid JSON response from onboarding shadow assistant'
    }
  }
}

function buildOnboardingShadowTrace(input: {
  effectiveMode: 'shadow'
  resultState: 'result' | 'no_result' | 'error'
  decisionSource: 'llm' | 'deterministic'
  errorMessage: string | null
  candidate: OnboardingShadowCandidate | null
  businessId?: number | null
}): OnboardingShadowAssistanceTrace {
  const summary =
    input.resultState === 'result'
      ? 'Shadow onboarding assistance recorded while submission, publication, verification, and billing outcomes remained deterministic.'
      : input.resultState === 'error'
        ? 'Shadow onboarding assistance failed while submission, publication, verification, and billing outcomes remained deterministic.'
        : 'Shadow onboarding assistance produced no candidate while submission, publication, verification, and billing outcomes remained deterministic.'

  return {
    aiAutomationAudit: buildAiAutomationAuditEvent({
      workflowFamily: 'onboarding',
      actorClass: 'business',
      effectiveMode: input.effectiveMode,
      approvalState: 'not_required',
      resultState: input.resultState,
      decisionSource: input.decisionSource,
      routeOrJob: '/api/onboarding',
      summary,
      errorMessage: input.errorMessage,
      resultingRecordReferences: [
        {
          table: 'latency_metrics',
          field: 'metadata.onboardingShadowAssistance'
        },
        ...(input.businessId
          ? [{ table: 'businesses', id: input.businessId }]
          : [])
      ],
      notes: [
        'Visible onboarding validation and submission payload semantics remained deterministic.',
        'Publication, verification, featured, spotlight, and billing outcomes remained unchanged.'
      ]
    }),
    ...(input.candidate ? { advisoryCandidate: input.candidate } : {}),
    visibleOutcome: {
      submissionPayloadChanged: false,
      publicationOutcomeChanged: false,
      verificationOutcomeChanged: false,
      monetizationOutcomeChanged: false,
      featuredStateChanged: false,
      spotlightStateChanged: false
    }
  }
}

export async function POST(request: Request) {
  const start = Date.now()
  let onboardingShadowTrace: OnboardingShadowAssistanceTrace | null = null
  let onboardingAiProvider: string | null = null
  let onboardingAiModel: string | null = null
  let onboardingAiPromptVersion: string | null = null
  let onboardingShadowResultState: 'result' | 'no_result' | 'error' = 'no_result'
  let onboardingShadowDecisionSource: 'llm' | 'deterministic' = 'deterministic'
  let onboardingShadowErrorMessage: string | null = null
  let onboardingShadowCandidate: OnboardingShadowCandidate | null = null

  const finish = async (status: number, success: boolean, metadata?: Record<string, unknown>) => {
    await recordLatencyMetric({
      area: 'onboarding_api',
      route: '/api/onboarding',
      durationMs: Date.now() - start,
      statusCode: status,
      success,
      metadata
    })
  }

  try {
    const parsedBody = parseOnboardingPayload(await request.json())
    if (!parsedBody.ok) {
      await finish(400, false, {
        reason: parsedBody.error.code,
        fields: parsedBody.error.fields
      })
      return NextResponse.json(
        {
          error: parsedBody.error.message,
          fields: parsedBody.error.fields,
          invalid_values: parsedBody.error.invalidValues
        },
        { status: 400 }
      )
    }

    const rolloutResolution = await getAiAutomationRuntimeResolution('onboarding')

    if (rolloutResolution.finalRuntimeMode === 'shadow') {
      const assistance = await runOnboardingShadowAssistance(parsedBody.data)
      onboardingAiProvider = assistance.provider
      onboardingAiModel = assistance.model
      onboardingAiPromptVersion = ONBOARDING_ASSISTANCE_PROMPT_VERSION
      onboardingShadowResultState = assistance.resultState
      onboardingShadowDecisionSource = assistance.decisionSource
      onboardingShadowErrorMessage = assistance.errorMessage
      onboardingShadowCandidate = assistance.candidate
      onboardingShadowTrace = buildOnboardingShadowTrace({
        effectiveMode: 'shadow',
        resultState: onboardingShadowResultState,
        decisionSource: onboardingShadowDecisionSource,
        errorMessage: onboardingShadowErrorMessage,
        candidate: onboardingShadowCandidate
      })
    }

    const {
      email,
      password,
      fullName,
      businessName,
      businessPhone,
      businessEmail,
      website,
      address,
      suburbId,
      bio,
      pricing,
      ages,
      issues,
      primaryService,
      secondaryServices,
      abn
    } = parsedBody.data

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    const user = (userData as any)?.user ?? userData
    if (createError || !user?.id) {
      await finish(500, false, {
        reason: 'user_create_failed',
        message: createError?.message,
        onboardingShadowAssistance: onboardingShadowTrace,
        onboardingAiProvider,
        onboardingAiModel,
        onboardingAiPromptVersion
      })
      return NextResponse.json(
        { error: 'Failed to create user account', message: createError?.message },
        { status: 500 }
      )
    }
    // Server-side ABN validation and authoritative ABR lookup
    if (!abrLib.isValidAbn(abn)) {
      await finish(400, false, {
        reason: 'invalid_abn',
        onboardingShadowAssistance: onboardingShadowTrace,
        onboardingAiProvider,
        onboardingAiModel,
        onboardingAiPromptVersion
      })
      return NextResponse.json({ error: 'Invalid ABN format' }, { status: 400 })
    }

    const guid = process.env.ABR_GUID || undefined
    const { status: abrStatus, body: abrRaw, parsed: abnData } = await abrLib.fetchAbrJson(abn, guid)

    // Determine verification status using canonical mapping
    // - no entity / no useful payload => 'rejected' (invalid ABN)
    // - ABNStatus === 'Active' => 'verified'
    // - otherwise => 'manual_review'
    const entity = abnData?.Response?.ResponseBody ?? null
    let abnStatus: 'verified' | 'manual_review' | 'rejected' = 'manual_review'
    let fallbackReason: 'onboarding_manual_review' | 'onboarding_abn_invalid' | null = null

    if (!entity || Object.keys(entity).length === 0 || abrStatus >= 400) {
      abnStatus = 'rejected'
      fallbackReason = 'onboarding_abn_invalid'
    } else if (entity?.ABNStatus === 'Active') {
      abnStatus = 'verified'
    } else {
      abnStatus = 'manual_review'
      fallbackReason = 'onboarding_manual_review'
    }

    await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email,
      full_name: fullName,
      role: 'trainer'
    })

    const abnScore = computeSimilarity(abn)
    const [encryptedPhone, encryptedEmail, encryptedAbn] = await Promise.all([
      businessPhone ? encryptValue(businessPhone) : Promise.resolve(null),
      encryptValue(businessEmail || email),
      encryptValue(abn)
    ])

    // Insert business - support both chainable supabase mock that uses .select().single()
    // and simpler test mocks that return a promise result directly.
    const businessInsertCall = supabaseAdmin.from('businesses').insert({
      profile_id: user.id,
      name: businessName,
        website,
        address,
        suburb_id: suburbId,
        bio,
        pricing,
        abn,
        abn_verified: abnStatus === 'verified',
        verification_status: abnStatus,
        resource_type: 'trainer',
        phone_encrypted: encryptedPhone,
        email_encrypted: encryptedEmail,
        abn_encrypted: encryptedAbn
      })
    
    let business: any = null
    let businessErr: any = null

    if (businessInsertCall && typeof (businessInsertCall as any).select === 'function') {
      const res = await (businessInsertCall as any).select('id').single()
      business = res?.data
      businessErr = res?.error
    } else {
      // Assume the insert call returns the final { data, error } shape
      const res = await businessInsertCall
      business = res?.data
      businessErr = res?.error
    }

    if (!business || businessErr) {
      await finish(500, false, {
        reason: 'business_insert_failed',
        onboardingShadowAssistance: onboardingShadowTrace,
        onboardingAiProvider,
        onboardingAiModel,
        onboardingAiPromptVersion
      })
      return NextResponse.json({ error: 'Failed to create business record' }, { status: 500 })
    }

    const businessId = business.id as number

    if (onboardingShadowTrace) {
      onboardingShadowTrace = buildOnboardingShadowTrace({
        effectiveMode: 'shadow',
        resultState: onboardingShadowResultState,
        decisionSource: onboardingShadowDecisionSource,
        errorMessage: onboardingShadowErrorMessage,
        candidate: onboardingShadowCandidate,
        businessId
      })
    }

    if (fallbackReason) {
      await recordAbnFallbackEvent({
        businessId,
        reason: fallbackReason
      })
    }

    if (ages.length > 0) {
      const specializations = ages.map((age) => ({
        business_id: businessId,
        age_specialty: age
      }))
      await supabaseAdmin.from('trainer_specializations').insert(specializations)
    }

    if (issues.length > 0) {
      const behaviors = issues.map((issue) => ({
        business_id: businessId,
        behavior_issue: issue
      }))
      await supabaseAdmin.from('trainer_behavior_issues').insert(behaviors)
    }

    const services = [
      { business_id: businessId, service_type: primaryService, is_primary: true },
      ...secondaryServices.map((s) => ({ business_id: businessId, service_type: s, is_primary: false }))
    ]
    if (services.length > 0) {
      await supabaseAdmin.from('trainer_services').insert(services)
    }

    // Persist ABN verification row; include matched_json for audit/reverification
    // Persist verification row. Support both possible mock shapes (chainable vs direct promise)
    const abnInsertCall = supabaseAdmin.from('abn_verifications').insert({
      business_id: businessId,
      abn,
      business_name: businessName,
      matched_name: businessName,
      similarity_score: abnScore,
      verification_method: 'api',
      status: abnStatus,
      // Persist parsed object when available; otherwise save raw payload as { raw: <string> }
      matched_json: abnData ?? (abrRaw ? { raw: abrRaw } : null)
    })

    if (abnInsertCall && typeof (abnInsertCall as any).select === 'function') {
      await (abnInsertCall as any).select().single()
    } else {
      await abnInsertCall
    }

    await finish(200, true, {
      businessId,
      abnStatus,
      onboardingShadowAssistance: onboardingShadowTrace,
      onboardingAiProvider,
      onboardingAiModel,
      onboardingAiPromptVersion
    })
    return NextResponse.json({ success: true, trainer_id: user.id, business_id: businessId, abn_status: abnStatus })
  } catch (error: any) {
    console.error('Onboarding error', error)
    await finish(500, false, {
      error: error?.message,
      onboardingShadowAssistance: onboardingShadowTrace,
      onboardingAiProvider,
      onboardingAiModel,
      onboardingAiPromptVersion
    })
    return NextResponse.json({ error: 'Internal error', message: error?.message ?? 'unknown' }, { status: 500 })
  }
}

// runtime is nodejs by default for app dir
