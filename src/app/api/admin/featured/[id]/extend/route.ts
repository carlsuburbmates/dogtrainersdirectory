import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role required' }, { status: 401 })
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const days = Number(body?.days || 30)

    const { data: row } = await supabaseAdmin.from('featured_placements').select('expiry_date').eq('id', id).limit(1).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const current = row.expiry_date ? new Date(row.expiry_date) : new Date()
    current.setDate(current.getDate() + days)

    await supabaseAdmin.from('featured_placements').update({ expiry_date: current.toISOString() }).eq('id', id)
    await supabaseAdmin.from('featured_placement_events').insert({ placement_id: id, event_type: 'extended', previous_status: 'active', new_status: 'active', triggered_by: 'manual', metadata: { added_days: days, new_expiry: current.toISOString() } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Extend failed', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
