import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { moderatePendingReviews } from '@/lib/moderation'

export async function GET() {
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY)

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
    const reviewIds = reviewsRes.data?.map((item) => item.id) ?? []
    if (reviewIds.length > 0) {
      const { data: decisionRows } = await supabaseAdmin
        .from('ai_review_decisions')
        .select('review_id, ai_decision, reason')
        .in('review_id', reviewIds)
      reviewDecisions = (decisionRows || []).reduce((acc, row) => {
        acc[row.review_id] = { ai_decision: row.ai_decision, reason: row.reason }
        return acc
      }, {} as Record<number, { ai_decision: string | null; reason: string | null }>)
    }

    const reviews = (reviewsRes.data || []).map((item) => ({
      ...item,
      ai_decision: reviewDecisions[item.id]?.ai_decision ?? null,
      ai_reason: reviewDecisions[item.id]?.reason ?? null
    }))

    return NextResponse.json({
      reviews,
      abn_verifications: abnRes.data,
      flagged_businesses: flaggedRes.data,
      emergency_verifications: emergencyRes.data || []
    })
  } catch (error: any) {
    console.error('Admin queues error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message }, { status: 500 })
  }
}

export const config = {
  runtime: 'edge'
}
