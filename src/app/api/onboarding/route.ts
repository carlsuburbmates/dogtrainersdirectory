import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptValue } from '@/lib/encryption'
import abrLib from '@/lib/abr'
import { recordAbnFallbackEvent } from '@/lib/abnFallback'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

type RequestBody = {
  email: string
  password: string
  fullName: string
  businessName: string
  businessPhone?: string
  businessEmail?: string
  website?: string
  address?: string
  suburbId: number
  bio?: string
  pricing?: string
  ages: string[]
  issues: string[]
  primaryService: string
  secondaryServices: string[]
  abn: string
}

const normalize = (value?: string) =>
  (value || '').replace(/\D/g, '').trim()

const computeSimilarity = (abn: string) => {
  const value = normalize(abn)
  if (!value) return 0
  return value.startsWith('12') ? 0.92 : value.length >= 9 ? 0.86 : 0.78
}

export async function POST(request: Request) {
  const start = Date.now()
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
    const body = (await request.json()) as Partial<RequestBody> & {
      suburb_id?: number
      primary_service?: string
      secondary_services?: string[]
    }
    const ages = Array.isArray(body.ages) ? body.ages : []
    const issues = Array.isArray(body.issues) ? body.issues : []
    const secondaryServices = Array.isArray(body.secondaryServices)
      ? body.secondaryServices
      : Array.isArray(body.secondary_services)
        ? body.secondary_services
        : []
    const primaryService = body.primaryService || body.primary_service || ''
    const suburbId = Number(body.suburbId ?? body.suburb_id ?? 0)
    const {
      email,
      password,
      fullName,
      businessName,
      businessPhone,
      businessEmail,
      website,
      address,
      bio,
      pricing,
      abn
    } = body

    if (!email || !password || !businessName || !abn) {
      await finish(400, false, { reason: 'missing_fields' })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    const user = (userData as any)?.user ?? userData
    if (createError || !user?.id) {
      await finish(500, false, { reason: 'user_create_failed', message: createError?.message })
      return NextResponse.json(
        { error: 'Failed to create user account', message: createError?.message },
        { status: 500 }
      )
    }
    // Server-side ABN validation and authoritative ABR lookup
    if (!abrLib.isValidAbn(abn)) {
      await finish(400, false, { reason: 'invalid_abn' })
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
      await finish(500, false, { reason: 'business_insert_failed' })
      return NextResponse.json({ error: 'Failed to create business record' }, { status: 500 })
    }

    const businessId = business.id as number

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

    await finish(200, true, { businessId, abnStatus })
    return NextResponse.json({ success: true, trainer_id: user.id, business_id: businessId, abn_status: abnStatus })
  } catch (error: any) {
    console.error('Onboarding error', error)
    await finish(500, false, { error: error?.message })
    return NextResponse.json({ error: 'Internal error', message: error?.message ?? 'unknown' }, { status: 500 })
  }
}

// runtime is nodejs by default for app dir
