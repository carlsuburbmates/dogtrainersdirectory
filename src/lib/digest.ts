import { supabaseAdmin } from './supabase'
import { fetchDigestMetrics, DailyDigestMetrics } from './emergency'
import { callLlm } from './llm'

export type DailyDigestRecord = {
  id: number
  digest_date: string
  summary: string
  metrics: DailyDigestMetrics
  model?: string | null
  generated_by?: string | null
  created_at: string
}

function buildDigestPrompt(metrics: DailyDigestMetrics) {
  return `Metrics snapshot:
- Onboarding submissions (last 24h): ${metrics.onboarding_today}
- Pending ABN manual reviews: ${metrics.pending_abn_manual}
- Emergency triage logs (last 24h): ${metrics.emergency_logs_today}
- Emergency classifier accuracy (weekly %): ${metrics.emergency_accuracy_pct}
- Emergency resources flagged for verification: ${metrics.emergency_pending_verifications}
- Errors reported last 24h: ${metrics.errors_last24h}

Summarise the operational situation for the admin in 3-5 sentences, highlight blockers, and end with one actionable next step.`
}

export async function getOrCreateDailyDigest(force = false): Promise<DailyDigestRecord> {
  const today = new Date().toISOString().slice(0, 10)
  if (!force) {
    const { data } = await supabaseAdmin
      .from('daily_ops_digests')
      .select('id, digest_date, summary, metrics, model, generated_by, created_at')
      .eq('digest_date', today)
      .maybeSingle()
    if (data) return data as DailyDigestRecord
  }

  const metrics = await fetchDigestMetrics()
  const prompt = buildDigestPrompt(metrics)
  const llm = await callLlm({
    purpose: 'ops_digest',
    systemPrompt: 'Summarise operational health for a solo operator keeping an eye on onboarding, emergency queries, and verification tooling.',
    userPrompt: prompt,
    responseFormat: 'text',
    temperature: 0.3,
    maxTokens: 400
  })

  // If AI disabled or there was an error, provide deterministic fallback
  if (!llm.ok) {
    if (llm.reason === 'ai_disabled') {
      console.warn('getOrCreateDailyDigest: AI disabled — using deterministic fallback')
      llm.text = `Ops digest: ${prompt.slice(0, 140)}...` // cheap fallback
      llm.model = 'fallback'
      llm.provider = llm.provider || 'deterministic'
    } else {
      console.error('getOrCreateDailyDigest: LLM call failed', llm.errorMessage)
      llm.text = `Ops digest: ${prompt.slice(0, 140)}...` // fallback
      llm.model = llm.model || 'error'
      llm.provider = llm.provider || 'deterministic'
    }
  }

  // Store the digest — be tolerant to DB errors when running in a non-operator environment
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('daily_ops_digests')
        .upsert({
          digest_date: today,
          summary: llm.text ?? '' ,
          metrics,
          model: llm.model,
          generated_by: llm.provider
        })
        .select('id, digest_date, summary, metrics, model, generated_by, created_at')
        .single()

      if (!error && data) return data as DailyDigestRecord
      // otherwise fallthrough to the in-memory return
      console.warn('getOrCreateDailyDigest: upsert failed, returning fallback digest (db error)', error)
    } else {
      console.warn('getOrCreateDailyDigest: SUPABASE_SERVICE_ROLE_KEY not present, skipping db write')
    }
  } catch (dbErr) {
    console.error('getOrCreateDailyDigest: DB write failed — continuing with in-memory digest', dbErr)
  }

  // If we couldn't persist, return a deterministic in-memory digest record (not persisted)
  return {
    id: -1,
    digest_date: today,
    summary: llm.text ?? '',
    metrics,
    model: llm.model || 'fallback',
    generated_by: llm.provider || 'deterministic',
    created_at: new Date().toISOString()
  }
}
