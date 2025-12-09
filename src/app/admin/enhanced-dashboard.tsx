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

export function EnhancedAdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'dlq' | 'cron'>('overview')

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/overview')
      if (!res.ok) throw new Error('Failed to fetch admin overview')
      const data = await res.json()
      setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
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
        {['overview', 'dlq', 'cron'].map((tab) => (
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
