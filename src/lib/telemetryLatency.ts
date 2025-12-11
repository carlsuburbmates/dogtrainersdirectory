import { supabaseAdmin } from './supabase'
import { isE2ETestMode } from './e2eTestUtils'

export type LatencyArea =
  | 'search_suburbs'
  | 'search_triage'
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

const LATENCY_SAMPLE_LIMIT = 500

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
