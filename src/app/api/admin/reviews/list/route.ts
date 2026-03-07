import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { status, rating } = body

    // Must have service-role key for admin operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server service role key required' }, { status: 401 })
    }

    // Build query based on filters
    let query = supabaseAdmin
      .from('reviews')
      .select(`
        id,
        business_id,
        reviewer_name,
        reviewer_email,
        rating,
        title,
        content,
        is_approved,
        is_rejected,
        rejection_reason,
        created_at,
        updated_at,
        businesses!inner (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    // Apply status filter
    if (status === 'pending') {
      // Default schema only has is_approved, but API code expects is_rejected too
      // For pending, we look for NOT approved (is_rejected might not exist in base schema)
      query = query.eq('is_approved', false)
      // Try to filter out rejected if the column exists
      try {
        query = query.or('is_rejected.is.null,is_rejected.eq.false')
      } catch (e) {
        // Column might not exist, ignore
      }
    } else if (status === 'approved') {
      query = query.eq('is_approved', true)
    } else if (status === 'rejected') {
      // This field might not exist in base schema
      try {
        query = query.eq('is_rejected', true)
      } catch (e) {
        // Return empty if column doesn't exist
        return NextResponse.json({ reviews: [] })
      }
    }

    // Apply rating filter
    if (rating) {
      query = query.eq('rating', rating)
    }

    const { data: reviewsData, error: reviewsError } = await query

    if (reviewsError) {
      console.error('Failed to fetch reviews:', reviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviews', message: reviewsError.message },
        { status: 500 }
      )
    }

    // Fetch AI decisions for these reviews
    type ReviewRow = { id: number | string }
    const reviewIds = ((reviewsData ?? []) as ReviewRow[]).map((r) => r.id)
    let aiDecisions: Record<number, any> = {}

    if (reviewIds.length > 0) {
      try {
        const { data: decisionsData } = await supabaseAdmin
          .from('ai_review_decisions')
          .select('review_id, ai_decision, confidence, reason, decision_source, ai_mode, metadata')
          .in('review_id', reviewIds)

        if (decisionsData) {
          type ReviewDecisionRow = {
            review_id: number
            ai_decision: string | null
            confidence: number | null
            reason: string | null
            decision_source: string | null
            ai_mode: string | null
            metadata?: Record<string, any> | null
          }
          aiDecisions = (decisionsData as ReviewDecisionRow[]).reduce((acc: Record<number, any>, d) => {
            const recommendation =
              d.metadata?.moderationRecommendation &&
              typeof d.metadata.moderationRecommendation === 'object'
                ? d.metadata.moderationRecommendation
                : null
            const finalAction =
              d.metadata?.finalAction && typeof d.metadata.finalAction === 'object'
                ? d.metadata.finalAction
                : null
            const operatorVisibleState =
              d.metadata?.operatorVisibleState &&
              typeof d.metadata.operatorVisibleState === 'object'
                ? d.metadata.operatorVisibleState
                : null
            const audit =
              d.metadata?.aiAutomationAudit &&
              typeof d.metadata.aiAutomationAudit === 'object'
                ? d.metadata.aiAutomationAudit
                : null

            acc[d.review_id] = {
              ai_decision: recommendation?.action ?? d.ai_decision,
              ai_confidence: recommendation?.confidence ?? d.confidence,
              ai_reason: recommendation?.reason ?? d.reason,
              ai_mode: d.ai_mode,
              ai_decision_source: recommendation?.source ?? d.decision_source,
              ai_approval_state: audit?.approvalState ?? null,
              ai_output_type: operatorVisibleState?.outputType ?? null,
              ai_final_action: finalAction?.action ?? null,
              ai_final_reason: finalAction?.reason ?? null
            }
            return acc
          }, {} as Record<number, any>)
        }
      } catch (e) {
        // ai_review_decisions table might not exist, continue without it
        console.warn('ai_review_decisions table not available')
      }
    }

    // Combine reviews with business names and AI decisions
    const reviews = (reviewsData || []).map((review: any) => ({
      id: review.id,
      business_id: review.business_id,
      reviewer_name: review.reviewer_name,
      reviewer_email: review.reviewer_email,
      rating: review.rating,
      title: review.title,
      content: review.content,
      is_approved: review.is_approved,
      is_rejected: review.is_rejected,
      rejection_reason: review.rejection_reason,
      created_at: review.created_at,
      updated_at: review.updated_at,
      business_name: review.businesses?.name || `Business #${review.business_id}`,
      ai_decision: aiDecisions[review.id]?.ai_decision || null,
      ai_confidence: aiDecisions[review.id]?.ai_confidence || null,
      ai_reason: aiDecisions[review.id]?.ai_reason || null,
      ai_mode: aiDecisions[review.id]?.ai_mode || null,
      ai_decision_source: aiDecisions[review.id]?.ai_decision_source || null,
      ai_approval_state: aiDecisions[review.id]?.ai_approval_state || null,
      ai_output_type: aiDecisions[review.id]?.ai_output_type || null,
      ai_final_action: aiDecisions[review.id]?.ai_final_action || null,
      ai_final_reason: aiDecisions[review.id]?.ai_final_reason || null
    }))

    return NextResponse.json({ reviews })
  } catch (error: any) {
    console.error('Admin reviews list error:', error)
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
