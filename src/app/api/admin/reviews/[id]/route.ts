import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export type ManualAction = 'approve' | 'reject'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)
if (isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }

    const body = await request.json()
    const action = body?.action as ManualAction | undefined
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Must have service-role or server-only key to perform this operation
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server service role key required' }, { status: 401 })
    }

    // Fetch existing review
    const { data: reviewRow, error: reviewErr } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', idNum)
      .single()

    if (reviewErr || !reviewRow) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Update review status
    if (action === 'approve') {
      await supabaseAdmin.from('reviews').update({ is_approved: true, is_rejected: false, rejection_reason: null }).eq('id', idNum)
    } else {
      await supabaseAdmin.from('reviews').update({ is_rejected: true, is_approved: false, rejection_reason: body?.reason ?? 'Manual rejection' }).eq('id', idNum)
    }

    // Try to reuse existing ai decision metadata if present
    const { data: existingDecision } = await supabaseAdmin
      .from('ai_review_decisions')
      .select('*')
      .eq('review_id', idNum)
      .limit(1)
      .maybeSingle()

    const payload: any = {
      review_id: id,
      ai_decision: action === 'approve' ? 'manual_approve' : 'manual_reject',
      confidence: 1.0,
      reason: body?.reason ?? (action === 'approve' ? 'Manually approved by admin' : 'Manually rejected by admin'),
      decision_source: 'manual_override',
      ai_mode: existingDecision?.ai_mode ?? null,
      ai_provider: existingDecision?.ai_provider ?? null,
      ai_model: existingDecision?.ai_model ?? null,
      ai_prompt_version: existingDecision?.ai_prompt_version ?? null,
      raw_response: body?.raw_response ?? null
    }

    await supabaseAdmin.from('ai_review_decisions').upsert({ ...payload, review_id: idNum }, { onConflict: 'review_id' })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Manual review override failed', err)
    return NextResponse.json({ success: false, error: err?.message ?? 'Unknown' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
