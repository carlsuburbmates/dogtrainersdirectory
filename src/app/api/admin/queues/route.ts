import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { moderatePendingReviews } from '@/lib/moderation'

const WEEKLY_EXCEPTION_WINDOW_HOURS = 7 * 24

type ReviewRow = {
  id: number
  business_id: number
  reviewer_name: string
  rating: number
  title: string
  content?: string | null
  created_at: string
}

type AbnVerificationRow = {
  id: number
  business_id: number
  abn: string
  similarity_score: number
  status: string
  created_at: string
}

type FlaggedBusinessRow = {
  id: number
  name: string
  verification_status: string
  is_active: boolean
  featured_until: string | null
}

type EmergencyVerificationRow = {
  id: number
  name: string
  resource_type: string
  emergency_phone?: string | null
  emergency_hours?: string | null
  emergency_verification_status?: string | null
  emergency_verification_notes?: string | null
  suburbs?:
    | {
        name?: string | null
        postcode?: string | null
        councils?: { name?: string | null }[] | { name?: string | null }
      }
    | null
}

type BusinessNameRow = {
  id: number
  name: string | null
}

type AbnFallbackEventRow = {
  business_id: number | null
  reason: string
  created_at: string
}

type VerificationEventRow = {
  business_id: number | null
  result: string | null
  details: unknown
  created_at: string
}

type QueueLoopItem = {
  id: number | string
  title: string
  meta: string
  body: string
  kindLabel: string
  nextAction: string
  action?: 'review'
}

type VerificationAbnSummary = {
  totalItems: number
  abnManualReviewCount: number
  resourceVerificationCount: number
  fallbackCount: number
  verificationCount: number
  fallbackRate: number
  windowHours: number
  note: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function formatSimilarityScore(score: number | null | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 'N/A'
  }

  const percentage = score > 1 ? score : score * 100
  return `${Math.round(percentage)}%`
}

function formatResourceLocation(row: EmergencyVerificationRow) {
  const suburb = row.suburbs
  const council = Array.isArray(suburb?.councils)
    ? suburb?.councils[0]?.name
    : suburb?.councils?.name

  return [
    row.resource_type,
    suburb?.name ? `${suburb.name}${suburb.postcode ? ` (${suburb.postcode})` : ''}` : null,
    council ? `Council: ${council}` : null
  ]
    .filter(Boolean)
    .join(' • ')
}

function buildAbnNextAction(record: AbnVerificationRow, fallbackEvents: AbnFallbackEventRow[]) {
  const latestReason = fallbackEvents[0]?.reason ?? null

  if (latestReason === 'abn_verify_inactive') {
    return 'Confirm the ABR response is still inactive, then reject unless the business provides corrected ABN evidence.'
  }

  if (record.similarity_score >= 0.9) {
    return 'Compare the ABR match against the business legal name, then approve only if the ABN record lines up cleanly.'
  }

  if (record.similarity_score >= 0.75) {
    return 'Open the matched ABN details, verify the legal entity manually, and approve only if the identity match is defensible.'
  }

  return 'Review the matched ABN payload and business identity manually, then reject if the record does not clearly match.'
}

function buildAbnBody(record: AbnVerificationRow, fallbackEvents: AbnFallbackEventRow[]) {
  if (fallbackEvents.length === 0) {
    return 'Manual review is queued with no recent fallback event in the last 7 days.'
  }

  const latestFallback = fallbackEvents[0]
  return `Manual review is queued after recent fallback reason: ${latestFallback.reason}.`
}

function buildVerificationNextAction(
  row: EmergencyVerificationRow,
  latestEvent: VerificationEventRow | null
) {
  const details = asRecord(latestEvent?.details)
  const audit = asRecord(details?.aiAutomationAudit)
  const shadowCandidate = asRecord(details?.shadowCandidate)

  if (audit?.resultState === 'error') {
    return 'Check the phone, website, and operator notes manually before changing verification status because the latest verification trace ended in an error.'
  }

  if (details?.verificationMethod === 'ai' && details?.isValid === true) {
    return 'Confirm the live AI recommendation against the current contact details, then apply the explicit verification update if it is still correct.'
  }

  if (shadowCandidate?.isValid === false) {
    return 'Inspect the contact details and recent notes because the draft verification trace flagged the resource as risky before you approve it.'
  }

  if (details?.isValid === false) {
    return 'Review the contact details manually and reject or correct the verification status if the listing is incomplete or invalid.'
  }

  if (row.emergency_verification_notes) {
    return 'Review the operator notes first, then confirm the resource contact details before making the explicit verification decision.'
  }

  return 'Review the resource contact details and make the explicit verification decision from the operator surface.'
}

function buildVerificationBody(
  row: EmergencyVerificationRow,
  latestEvent: VerificationEventRow | null
) {
  const details = asRecord(latestEvent?.details)
  const audit = asRecord(details?.aiAutomationAudit)
  const parts = [
    row.emergency_phone ? `Phone: ${row.emergency_phone}` : null,
    row.emergency_hours ? `Hours: ${row.emergency_hours}` : null,
    row.emergency_verification_notes ? `Notes: ${row.emergency_verification_notes}` : null
  ].filter(Boolean)

  if (audit?.resultState === 'error') {
    parts.push('Latest verification trace ended in an error.')
  } else if (details?.verificationMethod === 'ai') {
    parts.push('Latest verification trace produced a visible AI recommendation.')
  } else if (asRecord(details?.shadowCandidate)) {
    parts.push('Latest verification trace stayed deterministic while recording a draft candidate.')
  } else if (latestEvent) {
    parts.push('Latest verification trace is available for operator review.')
  }

  return parts.length > 0 ? parts.join(' | ') : 'Manual verification review required.'
}

function buildWeeklyLoopNote(summary: VerificationAbnSummary) {
  if (summary.totalItems === 0) {
    return 'The weekly verification and ABN exception loop is clear.'
  }

  const parts = [
    `${summary.abnManualReviewCount} ABN manual review${summary.abnManualReviewCount === 1 ? '' : 's'}`,
    `${summary.resourceVerificationCount} verification exception${summary.resourceVerificationCount === 1 ? '' : 's'}`
  ]

  if (summary.verificationCount > 0) {
    parts.push(
      `ABN fallback rate ${(summary.fallbackRate * 100).toFixed(1)}% over the last ${summary.windowHours}h`
    )
  }

  return `Start with ${parts.join(', ')}, then clear the remaining exception items from the same weekly loop.`
}

export async function GET() {
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY)

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('/api/admin/queues: SUPABASE_SERVICE_ROLE_KEY missing — returning degraded admin queues (no admin DB access)')
      return NextResponse.json({
        reviews: [],
        abn_verifications: [],
        flagged_businesses: [],
        emergency_verifications: [],
        verification_abn_loop: [],
        verification_abn_summary: {
          totalItems: 0,
          abnManualReviewCount: 0,
          resourceVerificationCount: 0,
          fallbackCount: 0,
          verificationCount: 0,
          fallbackRate: 0,
          windowHours: WEEKLY_EXCEPTION_WINDOW_HOURS,
          note: 'Admin database access is unavailable, so the verification and ABN exception loop cannot be loaded.'
        },
        aiEnabled
      })
    }

    try {
      await moderatePendingReviews()
    } catch (modErr) {
      console.warn('moderatePendingReviews failed (continuing):', modErr)
    }

    const [reviewsRes, abnRes, flaggedRes, emergencyRes] = await Promise.all([
      supabaseAdmin
        .from('reviews')
        .select('id, business_id, reviewer_name, rating, title, content, created_at')
        .eq('is_approved', false)
        .eq('is_rejected', false)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('abn_verifications')
        .select('id, business_id, abn, similarity_score, status, created_at')
        .eq('status', 'manual_review')
        .order('created_at', { ascending: true })
        .limit(20),
      supabaseAdmin
        .from('businesses')
        .select('id, name, verification_status, is_active, featured_until')
        .eq('verification_status', 'manual_review')
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('businesses')
        .select('id, name, resource_type, emergency_phone, emergency_hours, emergency_verification_status, emergency_verification_notes, suburbs ( name, postcode, councils ( name ) )')
        .in('resource_type', ['emergency_vet', 'urgent_care', 'emergency_shelter'])
        .eq('emergency_verification_status', 'manual_review')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: true })
        .limit(20)
    ])

    if (reviewsRes.error || abnRes.error || flaggedRes.error || emergencyRes.error) {
      return NextResponse.json(
        { error: 'Failed to load admin queues' },
        { status: 500 }
      )
    }

    let reviewDecisions: Record<number, { ai_decision: string | null; reason: string | null }> = {}
    const reviewIds = reviewsRes.data?.map((item: { id: number }) => item.id) ?? []
    if (reviewIds.length > 0) {
      const { data: decisionRows } = await supabaseAdmin
        .from('ai_review_decisions')
        .select('review_id, ai_decision, reason')
        .in('review_id', reviewIds)
      reviewDecisions = (decisionRows || []).reduce((acc: Record<number, { ai_decision: string | null; reason: string | null }>, row: any) => {
        acc[row.review_id] = { ai_decision: row.ai_decision, reason: row.reason }
        return acc
      }, {} as Record<number, { ai_decision: string | null; reason: string | null }>)
    }

    const reviews = ((reviewsRes.data || []) as ReviewRow[]).map((item: any) => ({
      ...item,
      ai_decision: reviewDecisions[item.id]?.ai_decision ?? null,
      ai_reason: reviewDecisions[item.id]?.reason ?? null
    }))

    const abnVerifications = (abnRes.data || []) as AbnVerificationRow[]
    const emergencyVerifications = (emergencyRes.data || []) as EmergencyVerificationRow[]

    const abnBusinessIds = Array.from(new Set(abnVerifications.map((item) => item.business_id).filter(Boolean)))
    const emergencyBusinessIds = Array.from(new Set(emergencyVerifications.map((item) => item.id).filter(Boolean)))
    const sinceIso = new Date(Date.now() - WEEKLY_EXCEPTION_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

    const [businessNamesResult, fallbackEventsResult, fallbackCountResult, verificationCountResult, verificationEventsResult] =
      await Promise.allSettled([
        abnBusinessIds.length > 0
          ? supabaseAdmin
              .from('businesses')
              .select('id, name')
              .in('id', abnBusinessIds)
          : Promise.resolve({ data: [], error: null }),
        abnBusinessIds.length > 0
          ? supabaseAdmin
              .from('abn_fallback_events')
              .select('business_id, reason, created_at')
              .in('business_id', abnBusinessIds)
              .gte('created_at', sinceIso)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabaseAdmin
          .from('abn_fallback_events')
          .select('business_id, reason, created_at')
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('abn_verifications')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sinceIso),
        emergencyBusinessIds.length > 0
          ? supabaseAdmin
              .from('emergency_resource_verification_events')
              .select('business_id, result, details, created_at')
              .in('business_id', emergencyBusinessIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null })
      ])

    const businessNameById = new Map<number, string>()
    if (businessNamesResult.status === 'fulfilled' && !businessNamesResult.value.error) {
      for (const row of (businessNamesResult.value.data ?? []) as BusinessNameRow[]) {
        if (typeof row.id === 'number' && row.name) {
          businessNameById.set(row.id, row.name)
        }
      }
    }

    const fallbackEventsByBusiness = new Map<number, AbnFallbackEventRow[]>()
    if (fallbackEventsResult.status === 'fulfilled' && !fallbackEventsResult.value.error) {
      for (const row of (fallbackEventsResult.value.data ?? []) as AbnFallbackEventRow[]) {
        if (typeof row.business_id !== 'number') continue
        const existing = fallbackEventsByBusiness.get(row.business_id) ?? []
        existing.push(row)
        fallbackEventsByBusiness.set(row.business_id, existing)
      }
    }

    const latestVerificationEventByBusiness = new Map<number, VerificationEventRow>()
    if (verificationEventsResult.status === 'fulfilled' && !verificationEventsResult.value.error) {
      for (const row of (verificationEventsResult.value.data ?? []) as VerificationEventRow[]) {
        if (typeof row.business_id !== 'number' || latestVerificationEventByBusiness.has(row.business_id)) {
          continue
        }

        latestVerificationEventByBusiness.set(row.business_id, row)
      }
    }

    const fallbackCount =
      fallbackCountResult.status === 'fulfilled' && !fallbackCountResult.value.error
        ? fallbackCountResult.value.data?.length ?? 0
        : 0
    const verificationCount =
      verificationCountResult.status === 'fulfilled' && !verificationCountResult.value.error
        ? verificationCountResult.value.count ?? 0
        : 0
    const fallbackRate = verificationCount === 0 ? 0 : fallbackCount / verificationCount

    const abnLoopItems: QueueLoopItem[] = abnVerifications.map((item) => {
      const businessName = businessNameById.get(item.business_id)
      const fallbackEvents = fallbackEventsByBusiness.get(item.business_id) ?? []

      return {
        id: item.id,
        title: businessName ? `${businessName} (${item.abn})` : item.abn,
        meta: [
          `ABN manual review`,
          `Business ${item.business_id}`,
          `Similarity ${formatSimilarityScore(item.similarity_score)}`
        ].join(' • '),
        body: buildAbnBody(item, fallbackEvents),
        kindLabel: 'ABN',
        nextAction: buildAbnNextAction(item, fallbackEvents),
        action: 'review'
      }
    })

    const verificationLoopItems: QueueLoopItem[] = emergencyVerifications.map((item) => {
      const latestEvent = latestVerificationEventByBusiness.get(item.id) ?? null

      return {
        id: `verification-${item.id}`,
        title: item.name,
        meta: formatResourceLocation(item) || 'Resource verification review',
        body: buildVerificationBody(item, latestEvent),
        kindLabel: 'Verification',
        nextAction: buildVerificationNextAction(item, latestEvent)
      }
    })

    const verificationAbnSummary: VerificationAbnSummary = {
      totalItems: abnLoopItems.length + verificationLoopItems.length,
      abnManualReviewCount: abnLoopItems.length,
      resourceVerificationCount: verificationLoopItems.length,
      fallbackCount,
      verificationCount,
      fallbackRate,
      windowHours: WEEKLY_EXCEPTION_WINDOW_HOURS,
      note: ''
    }
    verificationAbnSummary.note = buildWeeklyLoopNote(verificationAbnSummary)

    return NextResponse.json({
      reviews,
      abn_verifications: abnVerifications,
      flagged_businesses: flaggedRes.data as FlaggedBusinessRow[],
      emergency_verifications: emergencyVerifications,
      verification_abn_loop: [...abnLoopItems, ...verificationLoopItems],
      verification_abn_summary: verificationAbnSummary,
      aiEnabled
    })
  } catch (error: any) {
    console.error('Admin queues error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message }, { status: 500 })
  }
}
