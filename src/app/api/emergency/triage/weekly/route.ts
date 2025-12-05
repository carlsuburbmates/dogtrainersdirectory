import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function getWeekStart(date: Date) {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export async function POST() {
  try {
    // Cron-only endpoint — require service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 400 })
    }

    const now = new Date()
    const weekStart = getWeekStart(now)
    type TriageLog = {
      id: number
      predicted_category: string | null
      resolution_category: string | null
      was_correct: boolean | null
    }

    const { data: logs, error } = await supabaseAdmin
      .from('emergency_triage_logs')
      .select('id, predicted_category, resolution_category, was_correct')
      .gte('created_at', weekStart.toISOString())

    if (error) {
      return NextResponse.json({ error: 'Unable to fetch logs' }, { status: 500 })
    }

    const triageLogs: TriageLog[] = logs ?? []
    const total = triageLogs.length
    const correct = triageLogs.filter((log) => log.was_correct === true).length
    const manual = triageLogs.filter((log) => log.resolution_category === 'manual_review' || log.was_correct === null).length
    const accuracyPct = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0

    // Optionally generate a short LLM summary of weekly trends
    let summaryText: string | null = null
    let aiEnabled = Boolean(process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY)

    try {
      if (aiEnabled) {
        const { callLlm } = await import('@/lib/llm')
        const resp = await callLlm({
          purpose: 'triage',
          systemPrompt: 'You are an operations analyst that creates a short summary for weekly emergency triage trends (2-4 sentences). Keep recommendations action-oriented.',
          userPrompt: JSON.stringify({ weekStart: weekStart.toISOString().slice(0,10), total, correct, manual, accuracyPct }),
          responseFormat: 'text',
          temperature: 0.3,
          maxTokens: 200
        })
        if (resp.ok) summaryText = resp.text ?? null
        else if (resp.reason === 'ai_disabled') aiEnabled = false
        else console.warn('Weekly triage LLM failed (ignored):', resp.errorMessage)
      }
    } catch (e) {
      console.warn('Weekly triage LLM call threw (ignored)', e)
      aiEnabled = Boolean(process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY)
    }

    // Persist metrics (upsert by week_start)
    let saved: any = null
    try {
      const { data } = await supabaseAdmin
        .from('emergency_triage_weekly_metrics')
        .upsert({
          week_start: weekStart.toISOString().slice(0, 10),
          total_logs: total,
          correct_predictions: correct,
          manual_reviews: manual,
          accuracy_pct: accuracyPct
        }, { onConflict: 'week_start' })
        .select('*')
        .single()
      saved = data
    } catch (err) {
      console.warn('Failed to persist weekly triage metrics (ignored)', err)
    }

    return NextResponse.json({ success: true, weekStart: weekStart.toISOString().slice(0,10), weekEnd: now.toISOString().slice(0,10), metrics: saved ?? { total, correct, manual, accuracyPct }, aiEnabled, summary: summaryText })
  } catch (error: any) {
    console.error('Weekly emergency summary failed', error)
    return NextResponse.json({ error: 'Unable to compute weekly metrics' }, { status: 500 })
  }
}
