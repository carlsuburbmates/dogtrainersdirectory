'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TelemetryOverrideToggle } from './TelemetryOverrideToggle'

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

type OverrideState = {
  service: string
  status: string
  reason?: string | null
  expires_at?: string
} | null

export interface AiHealthSnapshot {
  status: HealthStatus
  metrics: {
    successRate: number
    avgLatency: number
    errorTrend: number
    totalCalls: number
  }
  message?: string
  lastCheck?: string
}

interface AiHealthDashboardProps {
  providerName: string
  baseUrl: string
  model: string
  initialRefreshMs?: number
  initialSnapshot?: AiHealthSnapshot
}

const DEFAULT_SNAPSHOT: AiHealthSnapshot = {
  status: 'unknown',
  metrics: { successRate: 0, avgLatency: 0, errorTrend: 0, totalCalls: 0 },
  message: 'Awaiting first heartbeat'
}

export function AiHealthDashboard({
  providerName,
  baseUrl,
  model,
  initialRefreshMs = 60000,
  initialSnapshot = DEFAULT_SNAPSHOT
}: AiHealthDashboardProps) {
  const [llmStatus, setLlmStatus] = useState<HealthStatus>(initialSnapshot.status)
  const [metrics, setMetrics] = useState(initialSnapshot.metrics)
  const [refreshTime] = useState(initialRefreshMs)
  const [statusMessage, setStatusMessage] = useState(initialSnapshot.message || 'Loading...')
  const [lastChecked, setLastChecked] = useState(initialSnapshot.lastCheck || null)
  const [override, setOverride] = useState<OverrideState>(null)

  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/llm')
      const health = await response.json()
      setLlmStatus(isValidStatus(health.status) ? health.status : 'unknown')
      setMetrics(health.metrics || DEFAULT_SNAPSHOT.metrics)
      setStatusMessage(health.message || 'LLM health updated')
      setLastChecked(health.lastCheck || new Date().toISOString())
    } catch (error) {
      console.error('Failed to fetch LLM health status:', error)
      setLlmStatus('down')
      setMetrics(DEFAULT_SNAPSHOT.metrics)
      setStatusMessage('Service unavailable – fallback triggered')
      setLastChecked(new Date().toISOString())
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchHealthStatus, 0)
    const interval = setInterval(fetchHealthStatus, refreshTime)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchHealthStatus, refreshTime])

  const effectiveStatus = useMemo<HealthStatus>(() => {
    if (override?.status === 'temporarily_down') return 'down'
    if (override?.status === 'investigating') return 'degraded'
    return llmStatus
  }, [llmStatus, override])

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">AI Integration Health Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-border p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">LLM Status</h3>
            <div className="text-sm text-gray-600 mb-2">
              Service status:{' '}
              <span className={`font-medium ${getLlmStatusColor(effectiveStatus)}`}>{effectiveStatus.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-500">
              {statusMessage}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Last checked: <span className="font-mono">{lastChecked ? new Date(lastChecked).toLocaleTimeString() : 'pending'}</span>
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
                <p className="text-gray-600">Total Calls (24h)</p>
                <p className="text-2xl font-medium">{metrics.totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <div className="card-border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <div className="text-sm text-gray-500 mb-4">
                <p>Activity log shows LLM API calls, errors, and latency trends.</p>
              </div>
              <div className="h-48 overflow-y-auto bg-gray-50 rounded p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Time</span>
                    <span>Type</span>
                    <span>Message</span>
                  </div>
                  <div className="text-sm bg-white rounded p-2">
                    <em>Live streaming reserved for Phase 2 of ops hardening.</em>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <div className="card-border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LLM Provider</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{providerName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{baseUrl}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{model}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Refresh</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">Every {refreshTime / 1000}s</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <button onClick={fetchHealthStatus} className="btn-primary">
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <TelemetryOverrideToggle
              service="telemetry"
              label="Telemetry"
              onOverrideChange={setOverride}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function isValidStatus(status: unknown): status is HealthStatus {
  return status === 'healthy' || status === 'degraded' || status === 'down' || status === 'unknown'
}

function getLlmStatusColor(status: HealthStatus) {
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
