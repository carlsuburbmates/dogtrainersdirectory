import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type RequestBody = {
  action: 'approve' | 'reject'
  notes?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
const idNum = Number(id)
    if (isNaN(idNum)) {
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
    }).eq('id', idNum)

    await supabaseAdmin.from('businesses').update({
      abn_verified: status === 'verified',
      verification_status: status
    }).eq('id', data.business_id)

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 })
  }
}

export const runtime = 'edge'
