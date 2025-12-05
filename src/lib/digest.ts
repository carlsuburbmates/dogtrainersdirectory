import { supabaseAdmin } from './supabase'
import { fetchDigestMetrics, DailyDigestMetrics } from './emergency'
import { callLlm, runAiOperation } from './llm'

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

  // Use runAiOperation for robustness
  const aiResult = await runAiOperation<string>({
    purpose: 'ops_digest',
    llmArgs: {
      systemPrompt: 'Summarise operational health for a solo operator keeping an eye on onboarding, emergency queries, and verification tooling.',
      userPrompt: prompt,
      responseFormat: 'text',
      temperature: 0.3,
      maxTokens: 400
    },
    heuristicActions: async () => {
      // Deterministic fallback: just a raw list of metrics
      return {
        action: `Ops digest (fallback): ${prompt.replace('Summarise the operational situation for the admin in 3-5 sentences, highlight blockers, and end with one actionable next step.', '').trim()}`,
        reason: 'Deterministic fallback (AI disabled or failed)',
        confidence: 1.0
      }
    },
    validator: (llm) => {
      const text = typeof llm.data === 'string' ? llm.data : JSON.stringify(llm.data)
      if (text && text.length > 10) {
        return {
          action: text,
          reason: 'AI Generated',
          confidence: 1.0
        }
      }
      return null
    }
  })

  // Store the digest — be tolerant to DB errors when running in a non-operator environment
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('daily_ops_digests')
        .upsert({
          digest_date: today,
          summary: aiResult.action,
          metrics,
          model: aiResult.meta?.model || (aiResult.source === 'heuristic' ? 'fallback' : 'unknown'),
          generated_by: aiResult.source, // Legacy
          // New Metadata
          decision_source: aiResult.source === 'heuristic' ? 'deterministic' : 
                           aiResult.source === 'manual' ? 'manual_override' : 
                           aiResult.source || 'deterministic',
          ai_mode: aiResult.meta?.mode || 'live',
          ai_provider: aiResult.meta?.llmProvider || 'unknown',
          ai_confidence: aiResult.confidence
        } as any)
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
    summary: aiResult.action,
    metrics,
    model: aiResult.llm_log?.model || 'fallback',
    generated_by: aiResult.source,
    created_at: new Date().toISOString()
  }
}
