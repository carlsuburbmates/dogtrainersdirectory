import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import {
  buildBusinessListingQualityShadowTrace,
  runBusinessListingQualityShadow,
  BUSINESS_LISTING_QUALITY_PROMPT_VERSION
} from '@/lib/businessListingQualityShadow'
import {
  parseBusinessProfileUpdatePayload,
  saveOwnedBusinessProfile
} from '@/lib/businessProfileManagement'
import { resolveAiAutomationMode } from '@/lib/ai-automation'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

const API_ROUTE = '/api/account/business/[businessId]'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const started = Date.now()
  let shadowTrace: Record<string, unknown> | null = null
  let aiProvider: string | null = null
  let aiModel: string | null = null
  let aiPromptVersion: string | null = null

  const finish = async (status: number, success: boolean, metadata?: Record<string, unknown>) => {
    await recordLatencyMetric({
      area: 'business_profile_api',
      route: API_ROUTE,
      durationMs: Date.now() - started,
      statusCode: status,
      success,
      metadata
    })
  }

  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      await finish(401, false, { reason: 'unauthenticated' })
      return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 })
    }

    const resolvedParams = await params
    const businessId = Number(resolvedParams.businessId)
    if (!Number.isInteger(businessId) || businessId <= 0) {
      await finish(400, false, { reason: 'invalid_business_id' })
      return NextResponse.json({ error: 'Invalid businessId.' }, { status: 400 })
    }

    const parsedBody = parseBusinessProfileUpdatePayload(await request.json())
    if (!parsedBody.ok) {
      await finish(400, false, {
        reason: parsedBody.error.code,
        fields: parsedBody.error.fields,
        invalidValues: parsedBody.error.invalidValues
      })
      return NextResponse.json(
        {
          error: parsedBody.error.message,
          fields: parsedBody.error.fields,
          invalidValues: parsedBody.error.invalidValues
        },
        { status: 400 }
      )
    }

    const updatedProfile = await saveOwnedBusinessProfile(userId, businessId, parsedBody.data)
    if (!updatedProfile) {
      await finish(404, false, {
        reason: 'owned_business_not_found',
        businessId
      })
      return NextResponse.json(
        { error: 'Business profile not found for this account.' },
        { status: 404 }
      )
    }

    const modeResolution = resolveAiAutomationMode('business_listing_quality')

    if (modeResolution.effectiveMode === 'shadow') {
      const shadowRun = await runBusinessListingQualityShadow(updatedProfile)
      aiProvider = shadowRun.provider
      aiModel = shadowRun.model
      aiPromptVersion = BUSINESS_LISTING_QUALITY_PROMPT_VERSION
      shadowTrace = buildBusinessListingQualityShadowTrace({
        profile: updatedProfile,
        resultState: shadowRun.resultState,
        decisionSource: shadowRun.decisionSource,
        errorMessage: shadowRun.errorMessage,
        candidate: shadowRun.candidate
      })
    }

    await finish(200, true, {
      businessId: updatedProfile.businessId,
      profileCompletenessScore: updatedProfile.completeness.score,
      businessListingQualityShadow: shadowTrace,
      businessListingQualityAiProvider: aiProvider,
      businessListingQualityAiModel: aiModel,
      businessListingQualityPromptVersion: aiPromptVersion
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('Business profile update failed', error)
    await finish(500, false, {
      error: message,
      businessListingQualityShadow: shadowTrace,
      businessListingQualityAiProvider: aiProvider,
      businessListingQualityAiModel: aiModel,
      businessListingQualityPromptVersion: aiPromptVersion
    })
    return NextResponse.json(
      { error: 'Business profile update failed.', message },
      { status: 500 }
    )
  }
}
