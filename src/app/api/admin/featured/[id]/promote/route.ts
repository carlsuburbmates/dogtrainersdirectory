import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role required' }, { status: 401 })
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const days = Number(body?.days || 30)
    const expiry = new Date(); expiry.setDate(expiry.getDate() + days)

    await supabaseAdmin.from('featured_placements').update({ active: true, expiry_date: expiry.toISOString() }).eq('id', id)

    await supabaseAdmin.from('featured_placement_events').insert({ placement_id: id, event_type: 'promoted', previous_status: 'queued', new_status: 'active', triggered_by: 'manual', metadata: { expiry_date: expiry.toISOString(), days } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Promote failed', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
