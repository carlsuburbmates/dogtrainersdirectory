import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role required' }, { status: 401 })
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    await supabaseAdmin.from('featured_placements').update({ active: false }).eq('id', id)
    await supabaseAdmin.from('featured_placement_events').insert({ placement_id: id, event_type: 'demoted', previous_status: 'active', new_status: 'expired', triggered_by: 'manual' })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Demote failed', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
