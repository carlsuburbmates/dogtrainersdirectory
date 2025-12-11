import { supabaseAdmin } from './supabase'
import { getLatencySnapshot, type LatencyArea, type LatencySummary } from './telemetryLatency'
import { isE2ETestMode } from './e2eTestUtils'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertState {
  id: string
  area: string
  severity: AlertSeverity
  message: string
  triggeredAt: string
  suppressed: boolean
  override?: OpsOverride | null
  meta?: Record<string, unknown>
}

export interface AlertSnapshot {
  generatedAt: string
  alerts: AlertState[]
}

type OpsOverride = {
  service: string
  status: string
  reason?: string | null
  expires_at?: string
}

type CronSnapshot = {
  lastSuccess: string | null
  lastFailure: string | null
}

type FallbackStats = {
  fallbackCount: number
  verificationCount: number
  rate: number
}

type MonetizationStats = {
  failureRate: number
  failureCount: number
  syncErrorCount: number
  totalEvents: number
}

const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

type AlertDependencies = {
  fetchOverrides: () => Promise<OpsOverride[]>
  fetchCronSnapshot: (jobName: string) => Promise<CronSnapshot>
  fetchFallbackStats: () => Promise<FallbackStats>
  fetchLatency: (area: LatencyArea) => Promise<LatencySummary | null>
  fetchMonetizationStats: () => Promise<MonetizationStats>
  now: () => Date
}

const defaultDependencies: AlertDependencies = {
  fetchOverrides: async () => {
    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabaseAdmin
        .from('ops_overrides')
        .select('service, status, reason, expires_at')
        .gt('expires_at', nowIso)
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Failed to fetch overrides', error)
      return []
    }
  },
  fetchCronSnapshot: async (jobName: string) => {
    try {
      const { data: successData } = await supabaseAdmin
        .from('cron_job_runs')
        .select('completed_at')
        .eq('job_name', jobName)
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: failureData } = await supabaseAdmin
        .from('cron_job_runs')
        .select('started_at')
        .eq('job_name', jobName)
        .eq('status', 'failed')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        lastSuccess: successData?.completed_at ?? null,
        lastFailure: failureData?.started_at ?? null
      }
    } catch (error) {
      console.warn(`Failed to fetch cron snapshot for ${jobName}`, error)
      return { lastSuccess: null, lastFailure: null }
    }
  },
  fetchFallbackStats: async () => {
    try {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const [fallbacks, verifications] = await Promise.all([
        supabaseAdmin
          .from('abn_fallback_events')
          .select('id')
          .gte('created_at', sinceIso),
        supabaseAdmin
          .from('abn_verifications')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sinceIso)
      ])

      const fallbackCount = fallbacks.data?.length ?? 0
      const verificationCount = verifications.count ?? 0
      const rate = verificationCount === 0 ? 0 : fallbackCount / verificationCount

      return { fallbackCount, verificationCount, rate }
    } catch (error) {
      console.warn('Failed to fetch fallback stats', error)
      return { fallbackCount: 0, verificationCount: 0, rate: 0 }
    }
  },
  fetchLatency: (area: LatencyArea) => getLatencySnapshot(area),
  fetchMonetizationStats: async () => {
    try {
      if (!hasServiceRole) {
        return { failureRate: 0, failureCount: 0, syncErrorCount: 0, totalEvents: 0 }
      }
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabaseAdmin
        .from('payment_audit')
        .select('event_type, status')
        .gte('created_at', sinceIso)
      if (error) throw error
      type PaymentAuditRow = { event_type: string; status: string }
      const rows = (data ?? []) as PaymentAuditRow[]
      const failureCount = rows.filter(
        (row) =>
          row.status === 'failed' ||
          row.event_type === 'invoice.payment_failed' ||
          row.event_type === 'customer.subscription.deleted'
      ).length
      const syncErrorCount = rows.filter(
        (row) => row.status === 'sync_error' || row.event_type === 'subscription_sync_error'
      ).length
      const totalEvents = rows.length
      return {
        failureRate: totalEvents === 0 ? 0 : Number((failureCount / totalEvents).toFixed(2)),
        failureCount,
        syncErrorCount,
        totalEvents
      }
    } catch (error) {
      console.warn('Failed to load monetization stats for alerts', error)
      return { failureRate: 0, failureCount: 0, syncErrorCount: 0, totalEvents: 0 }
    }
  },
  now: () => new Date()
}

const THRESHOLDS = {
  emergencyCronMinutes: 30,
  fallbackRate: 0.3,
  aiHealthSuccessRate: 0.75,
  cronHealthSuccessRate: 0.8,
  searchP95Ms: 3000,
  emergencyVerifyP95Ms: 5000,
  abnVerifyP95Ms: 3500,
  monetizationFailureRate: 0.15,
  monetizationSyncErrors: 3
}

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2
}

export async function evaluateAlerts(overrides?: Partial<AlertDependencies>): Promise<AlertSnapshot> {
  if (isE2ETestMode()) {
    return {
      generatedAt: new Date().toISOString(),
      alerts: []
    }
  }
  const deps: AlertDependencies = { ...defaultDependencies, ...overrides }
  const now = deps.now()
  const overrideList = await deps.fetchOverrides()
  const overrideMap = new Map(overrideList.map((entry) => [entry.service, entry]))

  const [cronSnapshot, fallbackStats, searchLatency, trainerLatency, emergencyTriageLatency, emergencyVerifyLatency, adminHealthLatency, aiHealthLatency, abnVerifyLatency, onboardingLatency, monetizationStats] = await Promise.all([
    deps.fetchCronSnapshot('emergency/verify'),
    deps.fetchFallbackStats(),
    deps.fetchLatency('search_triage'),
    deps.fetchLatency('trainer_profile_page'),
    deps.fetchLatency('emergency_triage_api'),
    deps.fetchLatency('emergency_verify_api'),
    deps.fetchLatency('admin_health_endpoint'),
    deps.fetchLatency('ai_health_endpoint'),
    deps.fetchLatency('abn_verify_api'),
    deps.fetchLatency('onboarding_api'),
    deps.fetchMonetizationStats()
  ])

  const alerts: AlertState[] = []

  const pushAlert = (
    id: string,
    area: string,
    severity: AlertSeverity,
    message: string,
    service?: string,
    meta?: Record<string, unknown>
  ) => {
    const override = service ? overrideMap.get(service) ?? null : null
    alerts.push({
      id,
      area,
      severity,
      message,
      triggeredAt: now.toISOString(),
      suppressed: Boolean(override),
      override,
      meta: meta ? { ...meta } : undefined
    })
  }

  // Emergency cron stale
  if (cronSnapshot.lastSuccess) {
    const minutesSinceSuccess = (now.getTime() - new Date(cronSnapshot.lastSuccess).getTime()) / 60000
    if (minutesSinceSuccess > THRESHOLDS.emergencyCronMinutes) {
      pushAlert(
        'emergency-cron-stale',
        'emergency_cron',
        'critical',
        `Emergency cron last success ${minutesSinceSuccess.toFixed(1)}m ago`,
        'emergency_cron',
        { lastSuccess: cronSnapshot.lastSuccess }
      )
    }
  } else {
    pushAlert(
      'emergency-cron-missing',
      'emergency_cron',
      'critical',
      'Emergency cron has no recorded successes',
      'emergency_cron'
    )
  }

  // AI health degrade (success rate low or no data)
  if (aiHealthLatency && aiHealthLatency.successRate < THRESHOLDS.aiHealthSuccessRate) {
    pushAlert(
      'ai-health-degraded',
      'telemetry',
      'warning',
      `AI health success rate ${(aiHealthLatency.successRate * 100).toFixed(0)}%`,
      'telemetry',
      { successRate: aiHealthLatency.successRate }
    )
  }

  // Cron health degrade (admin health endpoint failing)
  if (adminHealthLatency && adminHealthLatency.successRate < THRESHOLDS.cronHealthSuccessRate) {
    pushAlert(
      'cron-health-degraded',
      'telemetry',
      'warning',
      `Admin health endpoint success ${(adminHealthLatency.successRate * 100).toFixed(0)}%`,
      'telemetry',
      { successRate: adminHealthLatency.successRate }
    )
  }

  // ABN fallback rate high
  if (fallbackStats.verificationCount > 0 && fallbackStats.rate > THRESHOLDS.fallbackRate) {
    pushAlert(
      'abn-fallback-rate',
      'abn_pipeline',
      'warning',
      `ABN fallback rate ${(fallbackStats.rate * 100).toFixed(1)}% over last 24h`,
      'abn_recheck',
      { ...fallbackStats }
    )
  }

  // Latency thresholds for search / emergency verify / onboarding ABN
  if (searchLatency && searchLatency.p95Ms > THRESHOLDS.searchP95Ms) {
    pushAlert(
      'search-latency',
      'search',
      'warning',
      `Search P95 ${searchLatency.p95Ms}ms`,
      undefined,
      { ...searchLatency }
    )
  }

  if (emergencyVerifyLatency && emergencyVerifyLatency.p95Ms > THRESHOLDS.emergencyVerifyP95Ms) {
    pushAlert(
      'emergency-verify-latency',
      'emergency_verify',
      'warning',
      `Emergency verify P95 ${emergencyVerifyLatency.p95Ms}ms`,
      'emergency_cron',
      { ...emergencyVerifyLatency }
    )
  }

  if (abnVerifyLatency && abnVerifyLatency.p95Ms > THRESHOLDS.abnVerifyP95Ms) {
    pushAlert(
      'abn-verify-latency',
      'abn_verify',
      'warning',
      `ABN verify P95 ${abnVerifyLatency.p95Ms}ms`,
      'abn_recheck',
      { ...abnVerifyLatency }
    )
  }

  if (!alerts.some((alert) => alert.id === 'search-latency') && trainerLatency && trainerLatency.p95Ms > THRESHOLDS.searchP95Ms) {
    pushAlert(
      'trainer-profile-latency',
      'trainer_profile',
      'warning',
      `Trainer profile SSR P95 ${trainerLatency.p95Ms}ms`,
      undefined,
      { ...trainerLatency }
    )
  }

  if (onboardingLatency && onboardingLatency.p95Ms > THRESHOLDS.abnVerifyP95Ms) {
    pushAlert(
      'onboarding-latency',
      'onboarding',
      'warning',
      `Onboarding P95 ${onboardingLatency.p95Ms}ms`,
      undefined,
      { ...onboardingLatency }
    )
  }

  if (monetizationStats.failureCount > 0 && monetizationStats.failureRate > THRESHOLDS.monetizationFailureRate) {
    pushAlert(
      'monetization-payment-failures',
      'monetization',
      monetizationStats.failureRate > 0.35 ? 'critical' : 'warning',
      `Payment failures ${(monetizationStats.failureRate * 100).toFixed(1)}% (${monetizationStats.failureCount}/${monetizationStats.totalEvents})`,
      'monetization',
      { failureRate: monetizationStats.failureRate }
    )
  }

  if (monetizationStats.syncErrorCount >= THRESHOLDS.monetizationSyncErrors) {
    pushAlert(
      'monetization-sync-errors',
      'monetization',
      'critical',
      `Subscription sync errors: ${monetizationStats.syncErrorCount} / 24h`,
      'monetization'
    )
  }

  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return {
    generatedAt: now.toISOString(),
    alerts
  }
}
