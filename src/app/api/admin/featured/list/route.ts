import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server service role key required' }, { status: 401 })
  }

  // Active placements
  const { data: active } = await supabaseAdmin
    .from('featured_placements')
    .select('id, business_id, slot_type, expiry_date, priority, status, active')
    .eq('active', true)
    .order('expiry_date', { ascending: true })

  // Queue (inactive & not expired)
  const { data: queued } = await supabaseAdmin
    .from('featured_placements')
    .select('id, business_id, slot_type, priority, created_at')
    .eq('active', false)
    .order('priority', { ascending: true })

  return NextResponse.json({ active: active || [], queued: queued || [] })
}

export const runtime = 'nodejs'
