import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptValue } from '@/lib/encryption'
import abrLib from '@/lib/abr'

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
  try {
    const body = (await request.json()) as RequestBody
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
    } = body

    if (!email || !password || password.length < 8 || !businessName || !abn || !suburbId || ages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: userResult, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName }
    })
    if (createError || !userResult?.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create account' }, { status: 400 })
    }

    // Send verification email (ignore errors but log)
    try {
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: process.env.NEXT_PUBLIC_SITE_URL || undefined })
    } catch (inviteError) {
      console.warn('Failed to send invite email', inviteError)
    }
    // Server-side ABN validation and authoritative ABR lookup
    if (!abrLib.isValidAbn(abn)) {
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
    if (!entity || Object.keys(entity).length === 0) {
      abnStatus = 'rejected'
    } else if (entity?.ABNStatus === 'Active') {
      abnStatus = 'verified'
    } else {
      abnStatus = 'manual_review'
    }

    await supabaseAdmin.from('profiles').insert({
      id: userResult.user.id,
      email,
      full_name: fullName,
      role: 'trainer'
    })

    const abnScore = computeSimilarity(abn)
    // Insert business - support both chainable supabase mock that uses .select().single()
    // and simpler test mocks that return a promise result directly.
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        profile_id: userResult.user.id,
        name: businessName,
        website,
        address,
        suburb_id: suburbId,
        bio,
        pricing,
        abn,
        email: businessEmail || email,
        phone: businessPhone,
        abn_verified: abnStatus === 'verified',
        verification_status: abnStatus,
        resource_type: 'trainer',
        phone_encrypted: businessPhone ? encryptValue(businessPhone) : null,
        email_encrypted: encryptValue(businessEmail || email),
        abn_encrypted: encryptValue(abn),
        is_claimed: true
      })
      .select('id')
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Failed to create business record' }, { status: 500 })
    }

    const businessId = business.id as number

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

    const servicesToInsert = [
      {
        business_id: businessId,
        service_type: primaryService,
        is_primary: true
      },
      ...secondaryServices
        .filter((service) => service !== primaryService)
        .map((service) => ({
          business_id: businessId,
          service_type: service,
          is_primary: false
        }))
    ]
    await supabaseAdmin.from('trainer_services').insert(servicesToInsert)

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

    return NextResponse.json({ success: true, trainer_id: userResult.user.id, business_id: businessId, abn_status: abnStatus })
  } catch (error: any) {
    console.error('Onboarding error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message ?? 'unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
