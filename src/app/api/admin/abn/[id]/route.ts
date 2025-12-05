import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type RequestBody = {
  action: 'approve' | 'reject'
  notes?: string
}

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params
    const id = Number(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ABN ID' }, { status: 400 })
    }

    const { action } = (await request.json()) as RequestBody
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const status = action === 'approve' ? 'verified' : 'rejected'
    const { data, error } = await supabaseAdmin
      .from('abn_verifications')
      .select('business_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'ABN record not found' }, { status: 404 })
    }

    await supabaseAdmin.from('abn_verifications').update({
      status,
      admin_notes: action === 'reject' ? 'Manual rejection' : 'Manual approval'
    }).eq('id', id)

    await supabaseAdmin.from('businesses').update({
      abn_verified: status === 'verified',
      verification_status: status
    }).eq('id', data.business_id)

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 })
  }
}

export const config = {
  runtime: 'edge'
}
