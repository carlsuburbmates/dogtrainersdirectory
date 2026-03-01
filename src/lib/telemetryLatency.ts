import { supabaseAdmin } from './supabase'
import { isE2ETestMode } from './e2eTestUtils'

export type LatencyArea =
  | 'search_suburbs'
  | 'search_triage'
  | 'commercial_funnel'
  | 'trainer_profile_page'
  | 'emergency_triage_api'
  | 'emergency_verify_api'
  | 'emergency_weekly_api'
  | 'admin_health_endpoint'
  | 'ai_health_endpoint'
  | 'abn_verify_api'
  | 'onboarding_api'
  | 'monetization_api'

export interface LatencyMetricPayload {
  area: LatencyArea
  route: string
  durationMs: number
  statusCode?: number
  success?: boolean
  metadata?: Record<string, unknown>
}

export interface LatencySummary {
  count: number
  avgMs: number
  p95Ms: number
  successRate: number
}

export interface SearchTelemetryPayload {
  operation: string
  suburbId?: number
  suburbName?: string
  resultCount?: number
  latencyMs?: number
  success?: boolean
  error?: string | null
}

export type CommercialFunnelStage =
  | 'triage_submit'
  | 'search_results'
  | 'trainer_profile_view'
  | 'promote_page_view'
  | 'promote_checkout_session'

export interface CommercialFunnelMetricPayload {
  stage: CommercialFunnelStage
  durationMs: number
  success?: boolean
  statusCode?: number
  metadata?: Record<string, unknown>
}

type CommercialFunnelRow = {
  route: string | null
  duration_ms: number | null
  success: boolean | null
  created_at: string | null
}

export interface CommercialFunnelStageSummary {
  stage: CommercialFunnelStage
  count: number
  avgMs: number
  p95Ms: number
  successRate: number
  lastSeen: string | null
}

export interface CommercialFunnelSummary {
  stages: CommercialFunnelStageSummary[]
  dropoff: Array<{
    from: CommercialFunnelStage
    to: CommercialFunnelStage
    fromCount: number
    toCount: number
    conversionRate: number
    dropoffCount: number
  }>
}

const LATENCY_SAMPLE_LIMIT = 500
const COMMERCIAL_FUNNEL_SAMPLE_LIMIT = 2000
const COMMERCIAL_FUNNEL_STAGES: CommercialFunnelStage[] = [
  'triage_submit',
  'search_results',
  'trainer_profile_view',
  'promote_page_view',
  'promote_checkout_session'
]

const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function recordLatencyMetric(payload: LatencyMetricPayload): Promise<void> {
  if (isE2ETestMode() || !hasServiceRole) return
  try {
    await supabaseAdmin.from('latency_metrics').insert({
      area: payload.area,
      route: payload.route,
      duration_ms: Math.round(payload.durationMs),
      status_code: payload.statusCode ?? null,
      success: payload.success !== false,
      metadata: payload.metadata ?? {}
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Failed to record latency metric', error)
    }
  }
}

export async function recordCommercialFunnelMetric(
  payload: CommercialFunnelMetricPayload
): Promise<void> {
  await recordLatencyMetric({
    area: 'commercial_funnel',
    route: payload.stage,
    durationMs: payload.durationMs,
    statusCode: payload.statusCode,
    success: payload.success,
    metadata: {
      stage: payload.stage,
      ...(payload.metadata ?? {})
    }
  })
}

export async function recordSearchTelemetry(payload: SearchTelemetryPayload): Promise<void> {
  if (isE2ETestMode() || !hasServiceRole) return
  try {
    const insertPayload = {
      operation: payload.operation,
      suburb_id: payload.suburbId ?? null,
      suburb_name: payload.suburbName ?? null,
      result_count: payload.resultCount ?? null,
      latency_ms: payload.latencyMs ?? null,
      success: payload.success !== false,
      error: payload.error ?? null,
      timestamp: new Date().toISOString()
    }

    await supabaseAdmin.from('search_telemetry').insert(insertPayload)

    const area: LatencyArea = payload.operation === 'triage_search' ? 'search_triage' : 'search_suburbs'
    if (payload.latencyMs !== undefined) {
      await recordLatencyMetric({
        area,
        route: `search:${payload.operation}`,
        durationMs: payload.latencyMs,
        success: payload.success !== false,
        metadata: {
          suburbId: payload.suburbId ?? null,
          resultCount: payload.resultCount ?? null
        }
      })
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Failed to record search telemetry', error)
    }
  }
}

export async function getLatencySnapshot(
  area: LatencyArea,
  minutes = 24 * 60
): Promise<LatencySummary | null> {
  if (isE2ETestMode() || !hasServiceRole) return null
  try {
    const sinceIso = new Date(Date.now() - minutes * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('latency_metrics')
      .select('duration_ms, success')
      .eq('area', area)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(LATENCY_SAMPLE_LIMIT)

    if (error) throw error
    if (!data || data.length === 0) return null

    type RawLatencyRow = { duration_ms: number | null; success: boolean | null }
    const rows = data as RawLatencyRow[]

    const durations = rows.map((row) => row.duration_ms ?? 0).sort((a, b) => a - b)
    const total = durations.reduce((sum, value) => sum + value, 0)
    const p95Index = Math.max(0, Math.floor(0.95 * (durations.length - 1)))

    const successCount = rows.filter((row) => row.success !== false).length

    return {
      count: data.length,
      avgMs: Math.round(total / durations.length),
      p95Ms: durations[p95Index],
      successRate: Number((successCount / data.length).toFixed(2))
    }
  } catch (error) {
    console.warn(`Failed to load latency snapshot for ${area}`, error)
    return null
  }
}

export function summarizeCommercialFunnelRows(
  rows: CommercialFunnelRow[]
): CommercialFunnelSummary {
  const stages = COMMERCIAL_FUNNEL_STAGES.map((stage) => {
    const stageRows = rows.filter((row) => row.route === stage)
    if (stageRows.length === 0) {
      return {
        stage,
        count: 0,
        avgMs: 0,
        p95Ms: 0,
        successRate: 0,
        lastSeen: null
      }
    }

    const durations = stageRows.map((row) => row.duration_ms ?? 0).sort((a, b) => a - b)
    const total = durations.reduce((sum, value) => sum + value, 0)
    const p95Index = Math.max(0, Math.floor(0.95 * (durations.length - 1)))
    const successCount = stageRows.filter((row) => row.success !== false).length

    return {
      stage,
      count: stageRows.length,
      avgMs: Math.round(total / durations.length),
      p95Ms: durations[p95Index],
      successRate: Number((successCount / stageRows.length).toFixed(2)),
      lastSeen: stageRows.reduce<string | null>((latest, row) => {
        if (!row.created_at) return latest
        if (!latest) return row.created_at
        return row.created_at > latest ? row.created_at : latest
      }, null)
    }
  })

  const dropoff = COMMERCIAL_FUNNEL_STAGES.slice(1).map((toStage, index) => {
    const previous = stages[index]
    const current = stages[index + 1]
    const conversionRate = previous.count === 0 ? 0 : Number((current.count / previous.count).toFixed(2))

    return {
      from: previous.stage,
      to: toStage,
      fromCount: previous.count,
      toCount: current.count,
      conversionRate,
      dropoffCount: Math.max(previous.count - current.count, 0)
    }
  })

  return { stages, dropoff }
}

export async function getCommercialFunnelSummary(
  minutes = 24 * 60
): Promise<CommercialFunnelSummary | null> {
  if (isE2ETestMode() || !hasServiceRole) return null
  try {
    const sinceIso = new Date(Date.now() - minutes * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('latency_metrics')
      .select('route, duration_ms, success, created_at')
      .eq('area', 'commercial_funnel')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(COMMERCIAL_FUNNEL_SAMPLE_LIMIT)

    if (error) throw error
    return summarizeCommercialFunnelRows((data ?? []) as CommercialFunnelRow[])
  } catch (error) {
    console.warn('Failed to load commercial funnel summary', error)
    return null
  }
}
