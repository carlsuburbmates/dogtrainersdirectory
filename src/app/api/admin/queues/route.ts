import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { moderatePendingReviews } from '@/lib/moderation'
import { isAiEnabled } from '@/lib/llm'

type SupabaseReviewRow = {
  id: number
  business_id: number
  reviewer_name: string
  rating: number
  title: string
  content?: string | null
  created_at: string
}

type ReviewDecisionRow = {
  review_id: number
  ai_decision: string | null
  reason: string | null
}

type ReviewQueueItem = SupabaseReviewRow & {
  ai_decision: string | null
  ai_reason: string | null
}

export async function GET() {
  const aiEnabled = isAiEnabled()

  try {
    // If server-side service-role key is not set, return a gracefully degraded response
    // (we can't run admin queries without a service role; avoid throwing)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('/api/admin/queues: SUPABASE_SERVICE_ROLE_KEY missing — returning degraded admin queues (no admin DB access)')
      return NextResponse.json({
        reviews: [],
        abn_verifications: [],
        flagged_businesses: [],
        emergency_verifications: [],
        aiEnabled
      })
    }

    // Attempt moderation (these functions will also no-op if missing environment)
    try {
      await moderatePendingReviews()
    } catch (modErr) {
      console.warn('moderatePendingReviews failed (continuing):', modErr)
    }

    // Use Promise.allSettled to avoid hard-failing when a single query errors
    const settled = await Promise.allSettled([
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

    const getDataOrEmpty = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        if (!r.value || r.value.error) {
          console.warn('/api/admin/queues: supabase query returned error', r.value?.error)
          return []
        }
        return r.value.data ?? []
      }
      console.warn('/api/admin/queues: supabase query failed', r.reason)
      return []
    }

    const reviewRows: SupabaseReviewRow[] = getDataOrEmpty(settled[0])
    const abnData = getDataOrEmpty(settled[1])
    const flaggedData = getDataOrEmpty(settled[2])
    const emergencyData = getDataOrEmpty(settled[3])

    let reviewDecisions: Record<number, { ai_decision: string | null; reason: string | null }> = {}
    const reviewIds = reviewRows.map((item) => item.id)
    if (reviewIds.length > 0) {
      const { data: decisionRows } = await supabaseAdmin
        .from('ai_review_decisions')
        .select('review_id, ai_decision, reason')
        .in('review_id', reviewIds)
      const rows: ReviewDecisionRow[] = decisionRows ?? []
      reviewDecisions = rows.reduce((acc, row) => {
        acc[row.review_id] = { ai_decision: row.ai_decision, reason: row.reason }
        return acc
      }, {} as Record<number, { ai_decision: string | null; reason: string | null }>)
    }

    const reviews: ReviewQueueItem[] = reviewRows.map((item): ReviewQueueItem => ({
      ...item,
      ai_decision: reviewDecisions[item.id]?.ai_decision ?? null,
      ai_reason: reviewDecisions[item.id]?.reason ?? null
    }))

    return NextResponse.json({
      reviews,
      abn_verifications: abnData,
      flagged_businesses: flaggedData,
      emergency_verifications: emergencyData || [],
      aiEnabled
    })
  } catch (error: any) {
    console.error('Admin queues error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message }, { status: 500 })
  }
}

export const runtime = 'edge'
