import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { callLlm } from '@/lib/llm'

export async function POST(request: Request) {
  try {
    // Only admin/service-role allowed — be tolerant and informative when missing
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY required to run ops digest' }, { status: 400 })
    }

    // Build time window
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Collect several useful metrics (best-effort, non-fatal per query)
    const settled = await Promise.allSettled([
      // New trainers count
      supabaseAdmin
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('resource_type', 'trainer')
        .gte('created_at', since),

      // Reviews submitted
      supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since),

      // Emergency triage logs in last 24h (we'll fetch rows to group client-side)
      supabaseAdmin
        .from('emergency_triage_logs')
        .select('predicted_category')
        .gte('created_at', since),

      // ABN verifications statuses in last 24h
      supabaseAdmin
        .from('abn_verifications')
        .select('status')
        .gte('created_at', since)
    ])

    const safeGetCount = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        if (!r.value || r.value.error) return 0
        return r.value.count ?? 0
      }
      return 0
    }

    const safeGetRows = (r: PromiseSettledResult<any>) => {
      if (r.status === 'fulfilled') {
        if (!r.value || r.value.error) return []
        return r.value.data ?? []
      }
      return []
    }

    const new_trainers_count = safeGetCount(settled[0])
    const reviews_submitted_count = safeGetCount(settled[1])
    const triageRows = safeGetRows(settled[2]) as Array<{ predicted_category?: string }>
    const abnRows = safeGetRows(settled[3]) as Array<{ status?: string }>

    const emergency_triage_counts: Record<string, number> = { medical: 0, stray: 0, crisis: 0, normal: 0 }
    for (const r of triageRows) {
      const cat = (r?.predicted_category || 'normal').toString().toLowerCase()
      if (!emergency_triage_counts[cat]) emergency_triage_counts[cat] = 0
      emergency_triage_counts[cat] += 1
    }

    const abn_verifications = { success: 0, failed: 0 }
    for (const row of abnRows) {
      const s = (row?.status || '').toString().toLowerCase()
      if (s === 'verified' || s === 'success') abn_verifications.success += 1
      else abn_verifications.failed += 1
    }

    const metrics = {
      new_trainers_count,
      reviews_submitted_count,
      emergency_triage_counts,
      abn_verifications
    }

    // Call LLM via adapter
    const llm = await callLlm({
      purpose: 'ops_digest',
      systemPrompt:
        'You are an operations analyst for a dog trainers directory. Produce a short (3–6 sentence) summary of the metrics provided, highlight any anomalies, and present one suggested next action for the operations team.',
      userPrompt: JSON.stringify(metrics),
      responseFormat: 'text',
      temperature: 0.6,
      maxTokens: 400
    })

    // If AI disabled
    if (!llm.ok && llm.reason === 'ai_disabled') {
      return NextResponse.json(
        {
          digest: 'AI digest disabled. See raw metrics on the dashboard.',
          aiEnabled: false,
          metrics
        },
        { status: 200 }
      )
    }

    // Any other LLM error -> 500
    if (!llm.ok) {
      return NextResponse.json({ error: 'LLM error', message: llm.errorMessage ?? 'unknown' }, { status: 500 })
    }

    // Persist digest if DB table exists (best-effort). The Phase 5 migration creates daily_ops_digests
    try {
      await supabaseAdmin
        .from('daily_ops_digests')
        .insert({ digest_date: new Date().toISOString().slice(0, 10), summary: llm.text, metrics, model: llm.model, generated_by: llm.provider })
    } catch (err) {
      // ignore persistence errors — route still returns the LLM output
      console.warn('ops-digest: persistence failed (ignored)', err)
    }

    return NextResponse.json({ digest: llm.text ?? '', aiEnabled: true, metrics }, { status: 200 })
  } catch (error: any) {
    console.error('ops-digest error', error)
    return NextResponse.json({ error: 'Unable to create ops digest' }, { status: 500 })
  }
}

export const config = { runtime: 'edge' }
