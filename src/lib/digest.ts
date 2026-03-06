import { supabaseAdmin } from './supabase'
import {
  mergeAiAutomationAuditMetadata,
  resolveAiAutomationMode
} from './ai-automation'
import { fetchDigestMetrics, DailyDigestMetrics } from './emergency'
import { generateLLMResponse } from './llm'

export type DailyDigestRecord = {
  id: number
  digest_date: string
  summary: string
  metrics: DailyDigestMetrics
  model?: string | null
  generated_by?: string | null
  created_at: string
}

const DIGEST_PROMPT_VERSION = 'ops-digest-v1'

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

function buildDeterministicDigest(metrics: DailyDigestMetrics) {
  const blockers: string[] = []

  if (metrics.pending_abn_manual > 0) {
    blockers.push(`${metrics.pending_abn_manual} ABN checks are waiting for manual review`)
  }

  if (metrics.emergency_pending_verifications > 0) {
    blockers.push(
      `${metrics.emergency_pending_verifications} emergency resources are waiting for verification`
    )
  }

  if (metrics.errors_last24h > 0) {
    blockers.push(`${metrics.errors_last24h} errors were recorded in the last 24 hours`)
  }

  const nextStep =
    blockers[0] ??
    'No urgent blockers were detected. Review onboarding and emergency activity for any outliers.'

  return [
    `DTD recorded ${metrics.onboarding_today} onboarding submissions and ${metrics.emergency_logs_today} emergency triage logs in the last 24 hours.`,
    `Emergency classifier accuracy is ${metrics.emergency_accuracy_pct}% for the current weekly window.`,
    blockers.length > 0
      ? `Current pressure points: ${blockers.join('; ')}.`
      : 'No major operator blockers were detected from the current metrics snapshot.',
    `Next step: ${nextStep}.`
  ].join(' ')
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
  const modeResolution = resolveAiAutomationMode('ops_digest')
  const prompt = buildDigestPrompt(metrics)

  let summary = buildDeterministicDigest(metrics)
  let decisionSource: 'llm' | 'deterministic' = 'deterministic'
  let aiProvider: string | null = null
  let aiModel: string | null = null
  let auditResultState: 'result' | 'no_result' | 'error' = 'no_result'
  let auditErrorMessage: string | null = null

  if (
    modeResolution.effectiveMode === 'live' ||
    modeResolution.effectiveMode === 'shadow'
  ) {
    const llm = await generateLLMResponse({
      systemPrompt:
        'Summarise operational health for a solo operator keeping an eye on onboarding, emergency queries, and verification tooling.',
      userPrompt: prompt
    })

    aiProvider = llm.provider ?? null
    aiModel = llm.model ?? null

    if (llm.provider === 'deterministic') {
      auditErrorMessage = llm.text
    } else {
      summary = llm.text
      decisionSource = 'llm'
      auditResultState = 'result'
    }
  }

  // Store the digest — be tolerant to DB errors when running in a non-operator environment
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('daily_ops_digests')
        .upsert({
          digest_date: today,
          summary,
          metrics,
          model: aiModel,
          generated_by: aiProvider,
          decision_source: decisionSource,
          ai_mode: modeResolution.effectiveMode,
          ai_provider: aiProvider,
          ai_confidence: null,
          ai_prompt_version: DIGEST_PROMPT_VERSION,
          ci_summary: mergeAiAutomationAuditMetadata(
            undefined,
            {
              workflowFamily: 'ops_digest',
              actorClass: modeResolution.actorClass,
              effectiveMode: modeResolution.effectiveMode,
              approvalState: 'not_required',
              resultState: auditResultState,
              decisionSource,
              routeOrJob: '/api/admin/ops-digest',
              summary:
                modeResolution.effectiveMode === 'shadow'
                  ? 'Ops digest stored while running in shadow mode.'
                  : 'Ops digest stored.',
              errorMessage: auditErrorMessage,
              resultingRecordReferences: [
                { table: 'daily_ops_digests', field: 'digest_date', id: today }
              ]
            },
            {
              metricsSnapshot: {
                onboardingToday: metrics.onboarding_today,
                pendingAbnManual: metrics.pending_abn_manual,
                emergencyLogsToday: metrics.emergency_logs_today,
                errorsLast24h: metrics.errors_last24h
              }
            }
          )
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
    summary,
    metrics,
    model: aiModel || 'fallback',
    generated_by: aiProvider || 'deterministic',
    created_at: new Date().toISOString()
  }
}
