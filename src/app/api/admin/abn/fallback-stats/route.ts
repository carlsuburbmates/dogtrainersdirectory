import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const HOURS = 24

export async function GET() {
  try {
    const sinceIso = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString()

    const [fallbacks, verifications] = await Promise.all([
      supabaseAdmin
        .from('abn_fallback_events')
        .select('business_id, reason, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('abn_verifications')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
    ])

    const fallbackCount = fallbacks.data?.length ?? 0
    const verificationCount = verifications.count ?? 0
    const rate = verificationCount === 0 ? 0 : fallbackCount / verificationCount

    return NextResponse.json({
      fallbackCount,
      verificationCount,
      rate,
      windowHours: HOURS,
      events: fallbacks.data?.slice(0, 20) ?? []
    })
  } catch (error) {
    console.error('Failed to load ABN fallback stats', error)
    return NextResponse.json({ error: 'Unable to load fallback stats' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
