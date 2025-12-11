'use client'

import { useEffect, useState } from 'react'

type AdminOverview = {
  digest: {
    summary: string
    metrics: Record<string, any>
  }
  trainerSummary: {
    total: number
    verified: number
  }
  emergencySummary: {
    resources: number
    pendingVerification: number
    lastVerificationRun: any
  }
  triageSummary: {
    weeklyMetrics: any
    pendingLogs: any[]
  }
  dlqSummary: {
    failedJobs: any[]
    totalEvents: number
    recentFailures: number
    webhookFailures: any[]
  }
  cronHealth?: {
    jobs: any[]
  }
}

type LatencyMetricResponse = {
  generatedAt: string
  metrics: Record<
    string,
    {
      label: string
      summary: {
        p95Ms: number
        avgMs: number
        successRate: number
        count: number
      } | null
    }
  >
} | null

type MonetizationOverview = {
  summary: {
    counts: {
      active: number
      past_due: number
      cancelled: number
      inactive: number
      other: number
    }
    failureRate: number
    failureCount: number
    syncErrorCount: number
    totalEvents: number
    health: 'ok' | 'attention' | 'down'
  }
  statuses: Array<{
    business_id: number
    plan_id: string | null
    status: string
    current_period_end: string | null
    last_event_received: string | null
    updated_at: string | null
    business: { name?: string; verification_status?: string } | null
  }>
  recentFailures: Array<{
    id: string
    business_id: number | null
    plan_id: string
    event_type: string
    status: string
    created_at: string
  }>
  syncErrors: Array<{
    id: string
    business_id: number | null
    plan_id: string
    event_type: string
    status: string
    created_at: string
  }>
}

const isMonetizationFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED === '1'

export function EnhancedAdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'dlq' | 'cron' | 'monetization'>('overview')
  const [latencySnapshot, setLatencySnapshot] = useState<LatencyMetricResponse>(null)
  const [monetizationOverview, setMonetizationOverview] = useState<MonetizationOverview | null>(null)
  const [monetizationError, setMonetizationError] = useState<string | null>(null)
  const [resyncingId, setResyncingId] = useState<number | null>(null)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const requests: Array<Promise<Response>> = [
        fetch('/api/admin/overview'),
        fetch('/api/admin/telemetry/latency')
      ]
      if (isMonetizationFeatureEnabled) {
        requests.push(fetch('/api/admin/monetization/overview'))
      }

      const responses = await Promise.all(requests)
      const overviewRes = responses[0]
      const latencyRes = responses[1]
      const monetizationRes = isMonetizationFeatureEnabled ? responses[2] : null
      if (!overviewRes.ok) throw new Error('Failed to fetch admin overview')
      if (latencyRes.ok) {
        setLatencySnapshot(await latencyRes.json())
      } else {
        setLatencySnapshot(null)
      }
      const overviewData = await overviewRes.json()
      setOverview(overviewData)
      if (monetizationRes) {
        if (monetizationRes.ok) {
          setMonetizationOverview(await monetizationRes.json())
          setMonetizationError(null)
        } else {
          setMonetizationOverview(null)
          setMonetizationError('Unable to load monetization snapshot')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      if (isMonetizationFeatureEnabled) {
        setMonetizationOverview(null)
        setMonetizationError('Unable to load monetization snapshot')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResync = async (businessId: number) => {
    if (!isMonetizationFeatureEnabled) return
    setResyncingId(businessId)
    try {
      const res = await fetch('/api/admin/monetization/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })
      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error || 'Resync failed')
      }
      await fetchOverview()
    } catch (err) {
      console.error('Monetization resync error', err)
      setMonetizationError(err instanceof Error ? err.message : 'Resync failed')
    } finally {
      setResyncingId(null)
    }
  }

  const replayJob = async (jobName: string, failedId?: number) => {
    try {
      const res = await fetch(`/api/admin/dlq/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobName, failedId })
      })
      if (res.ok) {
        await fetchOverview()
      }
    } catch (err) {
      console.error('Replay failed:', err)
    }
  }

  if (loading) return <div className="p-8">Loading admin dashboard...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!overview) return <div className="p-8">No data available</div>

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {(isMonetizationFeatureEnabled ? ['overview', 'monetization', 'dlq', 'cron'] : ['overview', 'dlq', 'cron']).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Ops Digest Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 space-y-3">
            <h2 className="text-2xl font-bold text-blue-900">Daily Ops Digest</h2>
            <p className="text-gray-700">{overview.digest.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {Object.entries(overview.digest.metrics).map(([key, value]) => (
                <div key={key} className="bg-white rounded p-3 border border-blue-100">
                  <div className="text-xs font-semibold text-gray-600 uppercase">{key}</div>
                  <div className="text-2xl font-bold text-blue-600">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Trainers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-2">
              <h3 className="font-semibold text-gray-700">Trainers</h3>
              <div className="text-4xl font-bold text-green-600">{overview.trainerSummary.total}</div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">{overview.trainerSummary.verified}</span> verified
              </div>
            </div>

            {/* Emergency Resources */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-2">
              <h3 className="font-semibold text-gray-700">Emergency Resources</h3>
              <div className="text-4xl font-bold text-orange-600">{overview.emergencySummary.resources}</div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-orange-600">{overview.emergencySummary.pendingVerification}</span> pending verification
              </div>
            </div>

            {/* Triage Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-2">
              <h3 className="font-semibold text-gray-700">Weekly Triage</h3>
              <div className="text-4xl font-bold text-purple-600">
                {overview.triageSummary.weeklyMetrics?.total_triages || 0}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-purple-600">
                  {overview.triageSummary.weeklyMetrics?.accuracy_percentage || 0}%
                </span> accuracy
              </div>
            </div>
          </div>

          {latencySnapshot && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Latency snapshot (24h)</h3>
                <span className="text-xs text-gray-500">
                  Updated {new Date(latencySnapshot.generatedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(latencySnapshot.metrics).map(([key, entry]) => (
                  <div key={key} className="border border-gray-100 rounded-lg p-3">
                    <div className="text-xs uppercase text-gray-500 font-semibold">{entry.label}</div>
                    {entry.summary ? (
                      <>
                        <div className="text-2xl font-bold text-blue-600">{entry.summary.p95Ms}ms</div>
                        <div className="text-xs text-gray-500">
                          Avg {entry.summary.avgMs}ms · Success {(entry.summary.successRate * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">No data collected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMonetizationFeatureEnabled && monetizationOverview && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-700">Subscription health (24h)</h3>
                  <p className="text-xs text-gray-500">Feature flag gated monetization snapshot</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    monetizationOverview.summary.health === 'ok'
                      ? 'bg-green-100 text-green-700'
                      : monetizationOverview.summary.health === 'attention'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {monetizationOverview.summary.health.toUpperCase()}
                </span>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(monetizationOverview.summary.counts).map(([key, value]) => (
                  <div key={key} className="border border-gray-100 rounded-lg p-3">
                    <div className="text-xs uppercase text-gray-500 font-semibold">{key.replace('_', ' ')}</div>
                    <div className="text-2xl font-bold text-blue-600">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 text-sm text-gray-600">
                <div>Failures: {monetizationOverview.summary.failureCount}</div>
                <div>Failure rate: {(monetizationOverview.summary.failureRate * 100).toFixed(1)}%</div>
                <div>Sync errors: {monetizationOverview.summary.syncErrorCount}</div>
              </div>
              {monetizationError && (
                <div className="text-sm text-red-600">Monetization snapshot note: {monetizationError}</div>
              )}
            </div>
          )}

          {/* Pending Triage Logs */}
          {overview.triageSummary.pendingLogs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-700">Pending Emergency Logs</h3>
              <div className="space-y-2">
                {overview.triageSummary.pendingLogs.map((log) => (
                  <div key={log.id} className="text-sm p-2 bg-gray-50 rounded border border-gray-100">
                    <div className="font-medium">{log.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Predicted: {log.predicted_category} • Created: {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DLQ Tab */}
      {activeTab === 'dlq' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Dead Letter Queue</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-red-100">
                <div className="text-3xl font-bold text-red-600">{overview.dlqSummary.totalEvents}</div>
                <div className="text-sm text-gray-600 mt-1">Failed Events (7d)</div>
              </div>
              <div className="bg-white p-4 rounded border border-red-100">
                <div className="text-3xl font-bold text-red-600">{overview.dlqSummary.webhookFailures.length}</div>
                <div className="text-sm text-gray-600 mt-1">Failed Webhooks</div>
              </div>
            </div>
          </div>

          {/* Failed Jobs */}
          {overview.dlqSummary.failedJobs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-700">Failed Jobs</h3>
              <div className="space-y-3">
                {overview.dlqSummary.failedJobs.map((job, idx) => (
                  <div key={idx} className="border border-red-200 rounded p-4 bg-red-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{job.job_name}</div>
                        <div className="text-xs text-gray-600 mt-1">{job.error_message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(job.started_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => replayJob(job.job_name)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook Failures */}
          {overview.dlqSummary.webhookFailures.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-700">Webhook Failures</h3>
              <div className="space-y-3">
                {overview.dlqSummary.webhookFailures.map((webhook, idx) => (
                  <div key={idx} className="border border-orange-200 rounded p-4 bg-orange-50">
                    <div className="font-semibold text-gray-900">{webhook.event_type}</div>
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded font-mono">
                      {JSON.stringify(webhook.metadata, null, 2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(webhook.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'monetization' && isMonetizationFeatureEnabled && (
        <div className="space-y-6">
          {monetizationError && (
            <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              {monetizationError}
            </div>
          )}
          {!monetizationOverview ? (
            <div className="text-gray-500">Loading monetization overview…</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-xs uppercase text-gray-500 font-semibold">Active subscriptions</div>
                  <div className="text-3xl font-bold text-green-600">{monetizationOverview.summary.counts.active}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-xs uppercase text-gray-500 font-semibold">Past due</div>
                  <div className="text-3xl font-bold text-orange-600">{monetizationOverview.summary.counts.past_due}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-xs uppercase text-gray-500 font-semibold">Cancelled</div>
                  <div className="text-3xl font-bold text-red-600">{monetizationOverview.summary.counts.cancelled}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-700">Subscription ledger</h3>
                    <p className="text-xs text-gray-500">Feature flagged monetization tab (24h snapshot)</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    Failure rate {(monetizationOverview.summary.failureRate * 100).toFixed(1)}% • Sync errors {monetizationOverview.summary.syncErrorCount}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium text-gray-600">Business</th>
                        <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                        <th className="px-3 py-2 font-medium text-gray-600">Plan</th>
                        <th className="px-3 py-2 font-medium text-gray-600">Current period end</th>
                        <th className="px-3 py-2 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monetizationOverview.statuses.slice(0, 20).map((row) => (
                        <tr key={row.business_id}>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-gray-900">{row.business?.name || `Business #${row.business_id}`}</div>
                            <div className="text-xs text-gray-500">#{row.business_id}</div>
                          </td>
                          <td className="px-3 py-2 capitalize">{row.status}</td>
                          <td className="px-3 py-2">{row.plan_id || '—'}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleResync(row.business_id)}
                              disabled={resyncingId === row.business_id}
                              className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60"
                            >
                              {resyncingId === row.business_id ? 'Re-syncing…' : 'Re-sync'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-700">Recent failures</h3>
                  {monetizationOverview.recentFailures.length === 0 && (
                    <p className="text-xs text-gray-500">No failures in the last 24h.</p>
                  )}
                  {monetizationOverview.recentFailures.map((failure) => (
                    <div key={failure.id} className="text-xs border border-red-100 rounded p-2 bg-red-50">
                      <div className="font-semibold text-red-700">{failure.event_type}</div>
                      <div>Business #{failure.business_id ?? 'n/a'} · Plan {failure.plan_id}</div>
                      <div>{new Date(failure.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-700">Sync errors</h3>
                  {monetizationOverview.syncErrors.length === 0 && (
                    <p className="text-xs text-gray-500">No sync errors recorded.</p>
                  )}
                  {monetizationOverview.syncErrors.map((failure) => (
                    <div key={failure.id} className="text-xs border border-yellow-100 rounded p-2 bg-yellow-50">
                      <div className="font-semibold text-yellow-700">{failure.event_type}</div>
                      <div>Business #{failure.business_id ?? 'n/a'} · Status {failure.status}</div>
                      <div>{new Date(failure.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cron Health Tab */}
      {activeTab === 'cron' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Cron Job Health</h2>
            <p className="text-sm text-gray-700">Status of all scheduled jobs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {['emergency/verify', 'emergency/triage/weekly', 'admin/ops-digest', 'admin/moderation/run'].map(
              (job) => (
                <div key={job} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="font-semibold text-gray-900">{job}</div>
                  <div className="mt-2 text-xs space-y-1">
                    <div>Status: <span className="text-green-600 font-bold">✓ OK</span></div>
                    <div>Last run: <span className="text-gray-600">-</span></div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
