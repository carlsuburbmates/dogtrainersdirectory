'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HealthStatus } from './AiHealthDashboard'
import { TelemetryOverrideToggle } from './TelemetryOverrideToggle'

interface CronMetrics {
  successRate: number
  avgLatency: number
  errorTrend: number
  totalRuns: number
}

export interface CronHealthSnapshot {
  status: HealthStatus
  metrics: CronMetrics
  message?: string
  scheduleSummary?: string[]
}

const DEFAULT_METRICS: CronMetrics = { successRate: 0, avgLatency: 0, errorTrend: 0, totalRuns: 0 }

interface CronHealthDashboardProps {
  initialSnapshot?: CronHealthSnapshot
  initialRefreshMs?: number
}

type OverrideState = {
  service: string
  status: string
  reason?: string | null
  expires_at?: string
} | null

export function CronHealthDashboard({
  initialSnapshot = { status: 'unknown', metrics: DEFAULT_METRICS, message: 'Awaiting heartbeat', scheduleSummary: [] },
  initialRefreshMs = 60000
}: CronHealthDashboardProps) {
  const [cronStatus, setCronStatus] = useState<HealthStatus>(initialSnapshot.status)
  const [metrics, setMetrics] = useState<CronMetrics>(initialSnapshot.metrics)
  const [statusMessage, setStatusMessage] = useState(initialSnapshot.message || 'Loading')
  const [scheduleNotes, setScheduleNotes] = useState(initialSnapshot.scheduleSummary || [])
  const [refreshTime] = useState(initialRefreshMs)
  const [override, setOverride] = useState<OverrideState>(null)

  const fetchCronHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/health')
      const health = await response.json()
      const cronComponent = health.components?.cron

      if (cronComponent) {
        setCronStatus(isValidStatus(cronComponent.status) ? cronComponent.status : 'unknown')
        setStatusMessage(cronComponent.message || 'Cron job heartbeat received')
      } else {
        setCronStatus(isValidStatus(health.overall) ? health.overall : 'unknown')
        setStatusMessage(health.summary || 'Overall summary from admin health endpoint')
      }
      setMetrics((prev) => ({
        successRate: health.metrics?.successRate ?? prev.successRate,
        avgLatency: health.metrics?.avgLatency ?? prev.avgLatency,
        errorTrend: health.metrics?.errorTrend ?? prev.errorTrend,
        totalRuns: health.metrics?.totalRuns ?? prev.totalRuns
      }))
      setScheduleNotes(health.schedule ?? DEFAULT_SCHEDULE)
    } catch (error) {
      console.error('Failed to fetch cron health status:', error)
      setCronStatus('down')
      setStatusMessage('Cron health endpoint unavailable')
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchCronHealth, 0)
    const interval = setInterval(fetchCronHealth, refreshTime)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchCronHealth, refreshTime])

  const effectiveStatus = useMemo<HealthStatus>(() => {
    if (override?.status === 'temporarily_down') return 'down'
    if (override?.status === 'investigating') return 'degraded'
    return cronStatus
  }, [cronStatus, override])

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Cron Job Health Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Cron Status</h3>
            <div className="text-sm text-gray-600 mb-2">
              Service status:{' '}
              <span className={`font-medium ${getCronStatusColor(effectiveStatus)}`}>{effectiveStatus.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-500">
              {statusMessage}
            </p>
            {override && (
              <p className="mt-2 text-xs text-amber-600">
                Override: {override.reason || override.status} (expires {override.expires_at ? new Date(override.expires_at).toLocaleTimeString() : 'soon'})
              </p>
            )}
          </div>

          <div className="card-border p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.successRate}%</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.avgLatency}ms</p>
              </div>
              <div>
                <p className="text-gray-600">Error Trend</p>
                <p className={`text-2xl font-medium ${getTrendColor(metrics.errorTrend)}`}>
                  {metrics.errorTrend > 0 ? '+' : ''}{Math.abs(metrics.errorTrend)}%{metrics.errorTrend < 0 ? ' error↓' : 'error↑'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Runs (24h)</p>
                <p className="text-2xl font-medium">{metrics.totalRuns}</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <div className="card-border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <div className="text-sm text-gray-500 mb-4">
                <p>
                  Activity log shows cron job executions, errors, and performance trends. Synthetic events for smoke tests
                  are captured through the error logging harness.
                </p>
              </div>
              <div className="h-48 overflow-y-auto bg-gray-50 rounded p-4">
                <div className="space-y-2">
                  <div className="text-sm bg-white rounded p-2">
                    <em>Live job telemetry will be streamed once the Vercel cron webhooks are re-enabled.</em>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <div className="card-border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Scheduled Jobs</h3>
              <div className="space-y-2 text-sm">
                {(scheduleNotes.length ? scheduleNotes : DEFAULT_SCHEDULE).map((note) => (
                  <div key={note} className="flex items-center justify-between">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{note.split('—')[0]}</span>
                    <span className="text-gray-600">{note.split('—')[1]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <button onClick={fetchCronHealth} className="btn-primary">
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <TelemetryOverrideToggle
              service="emergency_cron"
              label="Emergency cron"
              onOverrideChange={setOverride}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_SCHEDULE = [
  '*/5 * * * * — Moderation Queue Processing',
  '*/10 * * * * — Featured Placement Management',
  '0 0 * * * — Daily Report Generation'
]

function isValidStatus(status: unknown): status is HealthStatus {
  return status === 'healthy' || status === 'degraded' || status === 'down' || status === 'unknown'
}

function getCronStatusColor(status: HealthStatus) {
  switch (status) {
    case 'healthy':
      return 'text-green-600'
    case 'degraded':
      return 'text-yellow-600'
    case 'down':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

function getTrendColor(trend: number) {
  if (trend > 0) return 'text-red-600'
  if (trend < 0) return 'text-green-600'
  return 'text-gray-600'
}
