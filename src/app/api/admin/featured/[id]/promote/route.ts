import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_PLACEMENT_DURATION_DAYS } from '@/lib/featured-constants'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role required' }, { status: 401 })
    const { id } = await params
    const idNum = Number(id)
    if (isNaN(idNum)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Fetch the placement first to ensure it exists
    const { data: placement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('id', idNum)
      .maybeSingle()

    if (fetchError || !placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const days = Number(body?.days || DEFAULT_PLACEMENT_DURATION_DAYS)
    const expiry = new Date(); expiry.setDate(expiry.getDate() + days)

    await supabaseAdmin.from('featured_placements').update({ active: true, expiry_date: expiry.toISOString() }).eq('id', idNum)

    await supabaseAdmin.from('featured_placement_events').insert({ placement_id: idNum, event_type: 'promoted', previous_status: 'queued', new_status: 'active', triggered_by: 'manual', metadata: { expiry_date: expiry.toISOString(), days } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Promote failed', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
