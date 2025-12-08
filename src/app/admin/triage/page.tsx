import TriageMetricsChart from '@/components/admin/TriageMetricsChart'
import Link from 'next/link'

async function fetchStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/triage/stats?hours=24`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function fetchLogs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/triage/logs?limit=20`, { cache: 'no-store' })
  if (!res.ok) return { logs: [], total: 0 }
  return res.json()
}

export default async function AdminTriagePage() {
  const [statsData, logsData] = await Promise.all([fetchStats(), fetchLogs()])
  const stats = statsData?.stats
  const logs = logsData?.logs || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Emergency Triage</h1>
        <Link href="/api/emergency/triage" className="text-blue-600 hover:underline">Open Test Page</Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total (24h)</div>
          <div className="text-2xl font-semibold">{stats?.total ?? '-'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Medical</div>
          <div className="text-2xl font-semibold">{stats?.medical_count ?? '-'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Immediate</div>
          <div className="text-2xl font-semibold">{stats?.immediate_count ?? '-'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Avg Latency</div>
          <div className="text-2xl font-semibold">{stats?.avg_latency_ms ? Math.round(stats.avg_latency_ms) + 'ms' : '-'}</div>
        </div>
      </div>

      <TriageMetricsChart hours={24} />

      {/* Logs table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Triage Logs</h2>
          <Link href="/admin/errors" className="text-sm text-blue-600 hover:underline">Error Dashboard</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Class</th>
                <th className="py-2 pr-4">Urgency</th>
                <th className="py-2 pr-4">Confidence</th>
                <th className="py-2 pr-4">Summary</th>
                <th className="py-2 pr-4">Medical</th>
                <th className="py-2 pr-4">Latency</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>No logs yet</td>
                </tr>
              )}
              {logs.map((log: any) => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-gray-600">{new Date(log.created_at).toLocaleString('en-AU')}</td>
                  <td className="py-2 pr-4 font-medium">{log.classification}</td>
                  <td className="py-2 pr-4">{log.urgency}</td>
                  <td className="py-2 pr-4">{Math.round((log.confidence || 0) * 100)}%</td>
                  <td className="py-2 pr-4 text-gray-700 max-w-md truncate" title={log.summary}>{log.summary}</td>
                  <td className="py-2 pr-4">{log.medical?.severity || '-'}</td>
                  <td className="py-2 pr-4">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
