import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [reviewsRes, abnRes, flaggedRes] = await Promise.all([
      supabaseAdmin
        .from('reviews')
        .select('id, business_id, reviewer_name, rating, title, content, created_at')
        .eq('is_approved', false)
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
        .limit(20)
    ])

    if (reviewsRes.error || abnRes.error || flaggedRes.error) {
      return NextResponse.json(
        { error: 'Failed to load admin queues' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reviews: reviewsRes.data,
      abn_verifications: abnRes.data,
      flagged_businesses: flaggedRes.data
    })
  } catch (error: any) {
    console.error('Admin queues error', error)
    return NextResponse.json({ error: 'Internal error', message: error?.message }, { status: 500 })
  }
}

export const config = {
  runtime: 'edge'
}
