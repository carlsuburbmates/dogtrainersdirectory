import { supabaseAdmin } from './supabase'
import {
  mergeAiAutomationAuditMetadata
} from './ai-automation'
import { getAiAutomationRuntimeResolution } from './ai-rollouts'
import { fetchDigestMetrics, DailyDigestMetrics } from './emergency'
import { generateLLMResponse } from './llm'
import type { DecisionMode } from './ai-types'

export type DailyDigestRecord = {
  id: number
  digest_date: string
  summary: string
  metrics: DailyDigestMetrics
  model?: string | null
  generated_by?: string | null
  ai_mode?: DecisionMode | null
  created_at: string
}

export type DailyDigestRunResult = {
  digest: DailyDigestRecord
  runtimeMode: DecisionMode
  persisted: boolean
  evidenceReviewable: boolean
  countsAsNewEvidence: boolean
  usedCachedDigest: boolean
  persistenceNote: string
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

export async function runDailyDigest(force = false): Promise<DailyDigestRunResult> {
  const today = new Date().toISOString().slice(0, 10)
  const executionSource = force ? 'manual_force' : 'scheduled'
  if (!force && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data } = await supabaseAdmin
        .from('daily_ops_digests')
        .select('id, digest_date, summary, metrics, model, generated_by, ai_mode, created_at')
        .eq('digest_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        const digest = data as DailyDigestRecord
        return {
          digest,
          runtimeMode: digest.ai_mode ?? 'disabled',
          persisted: true,
          evidenceReviewable: digest.ai_mode === 'shadow',
          countsAsNewEvidence: false,
          usedCachedDigest: true,
          persistenceNote:
            digest.ai_mode === 'shadow'
              ? 'Showing the latest persisted shadow digest row for this digest date. Cached reads do not count as new reviewable evidence.'
              : 'Showing a persisted digest row, but it does not count toward shadow-evidence review because it was not stored in shadow mode.'
        }
      }
    } catch (error) {
      console.warn('runDailyDigest: failed to load existing persisted digest, continuing with a fresh run', error)
    }
  }

  const metrics = await fetchDigestMetrics()
  const rolloutResolution = await getAiAutomationRuntimeResolution('ops_digest')
  const runtimeMode = rolloutResolution.finalRuntimeMode
  const prompt = buildDigestPrompt(metrics)

  const deterministicSummary = buildDeterministicDigest(metrics)
  let visibleSummary = deterministicSummary
  let auditDecisionSource: 'llm' | 'deterministic' = 'deterministic'
  let aiProvider: string | null = null
  let aiModel: string | null = null
  let auditResultState: 'result' | 'no_result' | 'error' = 'no_result'
  let auditErrorMessage: string | null = null
  let shadowCandidate: string | null = null

  if (
    runtimeMode === 'live' ||
    runtimeMode === 'shadow'
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
      auditDecisionSource = 'llm'
      auditResultState = 'result'

      if (runtimeMode === 'live') {
        visibleSummary = llm.text
      } else {
        shadowCandidate = llm.text
      }
    }
  }

  const visibleDecisionSource: 'llm' | 'deterministic' =
    runtimeMode === 'live' && auditDecisionSource === 'llm'
      ? 'llm'
      : 'deterministic'

  // Store the digest — be tolerant to DB errors when running in a non-operator environment
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('daily_ops_digests')
        .insert({
          digest_date: today,
          summary: visibleSummary,
          metrics,
          model: aiModel,
          generated_by: aiProvider,
          decision_source: visibleDecisionSource,
          ai_mode: runtimeMode,
          ai_provider: aiProvider,
          ai_confidence: null,
          ai_prompt_version: DIGEST_PROMPT_VERSION,
          ci_summary: mergeAiAutomationAuditMetadata(
            undefined,
            {
              workflowFamily: 'ops_digest',
              actorClass: rolloutResolution.actorClass,
              effectiveMode: runtimeMode,
              approvalState: 'not_required',
              resultState: auditResultState,
              decisionSource: auditDecisionSource,
              routeOrJob: '/api/admin/ops-digest',
              summary:
                runtimeMode === 'shadow'
                  ? 'Shadow digest trace recorded while deterministic advisory remained visible.'
                  : 'Ops digest advisory stored.',
              errorMessage: auditErrorMessage,
              notes: [`digest_execution_source=${executionSource}`]
            },
            {
              shadowCandidate: shadowCandidate
                ? {
                    summary: shadowCandidate
                  }
                : undefined,
              executionContext: {
                source: executionSource
              },
              operatorVisibleState: {
                outputType:
                  runtimeMode === 'shadow'
                    ? 'shadow_evaluation'
                    : 'advisory',
                finalState: 'no_external_action'
              },
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

      if (!error && data) {
        const digest = data as DailyDigestRecord
        return {
          digest: {
            ...digest,
            ai_mode: runtimeMode
          },
          runtimeMode,
          persisted: true,
          evidenceReviewable: runtimeMode === 'shadow',
          countsAsNewEvidence: runtimeMode === 'shadow',
          usedCachedDigest: false,
          persistenceNote:
            runtimeMode === 'shadow'
              ? 'This run persisted a distinct shadow digest row in daily_ops_digests and counts as one reviewable run toward the seven-run evidence window.'
              : 'This run persisted a digest row, but it does not count toward shadow-evidence review because runtime mode was not shadow.'
        }
      }
      // otherwise fallthrough to the in-memory return
      console.warn('getOrCreateDailyDigest: insert failed, returning fallback digest (db error)', error)
    } else {
      console.warn('getOrCreateDailyDigest: SUPABASE_SERVICE_ROLE_KEY not present, skipping db write')
    }
  } catch (dbErr) {
    console.error('getOrCreateDailyDigest: DB write failed — continuing with in-memory digest', dbErr)
  }

  // If we couldn't persist, return a deterministic in-memory digest record (not persisted)
  return {
    digest: {
      id: -1,
      digest_date: today,
      summary: visibleSummary,
      metrics,
      model: aiModel || 'fallback',
      generated_by: aiProvider || 'deterministic',
      ai_mode: runtimeMode,
      created_at: new Date().toISOString()
    },
    runtimeMode,
    persisted: false,
    evidenceReviewable: false,
    countsAsNewEvidence: false,
    usedCachedDigest: false,
    persistenceNote: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'The digest could not be persisted, so this run does not count toward reviewable shadow evidence.'
      : 'SUPABASE_SERVICE_ROLE_KEY is not configured, so this digest run is local-only and does not count toward reviewable shadow evidence.'
  }
}

export async function getOrCreateDailyDigest(force = false): Promise<DailyDigestRecord> {
  const result = await runDailyDigest(force)
  return result.digest
}
