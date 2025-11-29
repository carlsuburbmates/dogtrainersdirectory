import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptValue } from '@/lib/encryption'

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

    if (!email || !password || !businessName || !abn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError || !user) {
      return NextResponse.json({ error: 'Unable to create user', details: createError?.message }, { status: 400 })
    }

    await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email,
      full_name: fullName,
      role: 'trainer'
    })

    const abnScore = computeSimilarity(abn)
    const abnStatus = abnScore >= 0.85 ? 'verified' : 'manual_review'
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .insert({
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
        phone_encrypted: businessPhone ? encryptValue(businessPhone) : null,
        email_encrypted: businessEmail ? encryptValue(businessEmail) : encryptValue(email),
        abn_encrypted: encryptValue(abn)
      })
      .select('id')
      .single()

    if (!business) {
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

    const services = [
      { business_id: businessId, service_type: primaryService, is_primary: true },
      ...secondaryServices
        .filter((service) => service !== primaryService)
        .map((service) => ({ business_id: businessId, service_type: service, is_primary: false }))
    ]

    if (services.length > 0) {
      await supabaseAdmin.from('trainer_services').insert(services)
    }

    await supabaseAdmin.from('abn_verifications').insert({
      business_id: businessId,
      abn,
      business_name: businessName,
      matched_name: businessName,
      similarity_score: abnScore,
      verification_method: 'api',
      status: abnStatus
    })

    return NextResponse.json({ success: true, trainer_id: user.id, business_id: businessId, abn_status: abnStatus })
  } catch (error: any) {
    console.error('Onboarding error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message ?? 'unknown' }, { status: 500 })
  }
}

export const config = {
  runtime: 'nodejs'
}
