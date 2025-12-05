'use client'

import { useEffect, useState } from 'react'

type QueuePayload = {
  reviews: Array<{
    id: number
    business_id: number
    reviewer_name: string
    rating: number
    title: string
    content?: string
    created_at: string
    ai_reason?: string | null
    ai_decision?: string | null
  }>
  abn_verifications: Array<{
    id: number
    business_id: number
    abn: string
    similarity_score: number
    status: string
    created_at: string
  }>
  flagged_businesses: Array<{
    id: number
    name: string
    verification_status: string
    is_active: boolean
    featured_until: string | null
  }>
  emergency_verifications: Array<{
    id: number
    name: string
    resource_type: string
    emergency_phone: string | null
    emergency_hours: string | null
    emergency_verification_notes: string | null
    suburbs: { name: string; postcode: string; councils?: { name: string } | null } | null
  }>
}

type ScaffoldedItem = {
  id: number
  name: string
  verification_status: string
  bio?: string
}

type OverviewPayload = {
  digest: {
    summary: string
    metrics: {
      onboarding_today: number
      pending_abn_manual: number
      emergency_logs_today: number
      emergency_accuracy_pct: number
      emergency_pending_verifications: number
      errors_last24h: number
    }
  }
  trainerSummary: { total: number; verified: number }
  emergencySummary: { resources: number; pendingVerification: number; lastVerificationRun?: { started_at: string; completed_at: string; total_resources: number; auto_updates: number; flagged_manual: number } | null }
  triageSummary: { weeklyMetrics?: { total_logs: number; accuracy_pct: number } | null; pendingLogs: Array<{ id: number; description: string; predicted_category: string; created_at: string }> }
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueuePayload | null>(null)
  const [scaffolded, setScaffolded] = useState<ScaffoldedItem[]>([])
  const [overview, setOverview] = useState<OverviewPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [digestRefreshing, setDigestRefreshing] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [queuesRes, scaffoldRes, overviewRes] = await Promise.all([
          fetch('/api/admin/queues'),
          fetch('/api/admin/scaffolded'),
          fetch('/api/admin/overview')
        ])

        if (!queuesRes.ok || !scaffoldRes.ok || !overviewRes.ok) {
          throw new Error('Admin endpoints failed')
        }

        const [queuePayload, scaffoldPayload, overviewPayload] = await Promise.all([
          queuesRes.json(),
          scaffoldRes.json(),
          overviewRes.json()
        ])

        setQueues(queuePayload)
        setScaffolded(scaffoldPayload.scaffolded || [])
        setOverview(overviewPayload)
      } catch (err) {
        console.error(err)
        setError('Unable to load admin queues right now.')
      }
    }
    load()
  }, [])

  const refreshDigest = async () => {
    try {
      setDigestRefreshing(true)
      const response = await fetch('/api/admin/overview?force=1')
      if (!response.ok) throw new Error('Digest refresh failed')
      const payload = await response.json()
      setOverview(payload)
    } catch (err) {
      console.error(err)
    } finally {
      setDigestRefreshing(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Moderation + Ops</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {overview && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase text-gray-500">Daily Ops Digest</p>
                <button type="button" className="text-xs text-blue-600 underline" onClick={refreshDigest} disabled={digestRefreshing}>
                  {digestRefreshing ? 'Refreshing…' : 'Regenerate'}
                </button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-line">{overview.digest.summary}</p>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <Metric label="Onboarding (24h)" value={overview.digest.metrics.onboarding_today} />
                <Metric label="ABN manual" value={overview.digest.metrics.pending_abn_manual} />
                <Metric label="Emergency logs" value={overview.digest.metrics.emergency_logs_today} />
                <Metric label="Classifier accuracy" value={`${overview.digest.metrics.emergency_accuracy_pct}%`} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
              <p className="text-sm font-semibold uppercase text-gray-500">System snapshot</p>
              <Metric label="Verified trainers" value={`${overview.trainerSummary.verified}/${overview.trainerSummary.total}`} />
              <Metric label="Emergency resources" value={overview.emergencySummary.resources} />
              <Metric label="Verification queue" value={overview.emergencySummary.pendingVerification} highlight />
              {overview.emergencySummary.lastVerificationRun && (
                <p className="text-xs text-gray-500">Last check touched {overview.emergencySummary.lastVerificationRun.total_resources} resources ({overview.emergencySummary.lastVerificationRun.flagged_manual} flagged).</p>
              )}
            </div>
          </div>
        )}
        {!queues && !error && <p className="text-gray-500">Loading queues…</p>}
        {queues && (
          <div className="space-y-8">
            <QueueCard title="Pending Reviews" items={queues.reviews.map((item) => ({
              id: item.id,
              title: item.title,
              meta: `Rating ${item.rating} • Business ${item.business_id}`,
              body: item.content || 'No message provided',
              ai_reason: item.ai_reason ?? null
            }))} />
            <QueueCard
              title="ABN Manual Reviews"
              items={queues.abn_verifications.map((item) => ({
                id: item.id,
                title: item.abn,
                meta: `Business ${item.business_id} • Score ${item.similarity_score}`,
                body: `Status: ${item.status}`,
                action: 'review'
              }))}
              onReview={async (id, action) => {
                const res = await fetch(`/api/admin/abn/${id}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action })
                })
                if (res.ok) window.location.reload()
              }}
            />
            <QueueCard title="Emergency Verification" items={queues.emergency_verifications.map((item) => ({
              id: item.id,
              title: item.name,
              meta: `${item.resource_type} • ${item.suburbs?.name ?? 'Unknown'} ${item.suburbs?.postcode ?? ''}`,
              body: item.emergency_verification_notes || item.emergency_hours || 'Needs manual verification'
            }))} />
            <QueueCard title="Flagged Profiles" items={queues.flagged_businesses.map((item) => ({
              id: item.id,
              title: item.name,
              meta: `Status ${item.verification_status}`,
              body: `Active: ${item.is_active} • Featured until: ${item.featured_until || 'N/A'}`
            }))} />
            <QueueCard
              title="Scaffolded Listings"
              items={scaffolded.map((item) => ({
                id: item.id,
                title: item.name,
                meta: `Status ${item.verification_status}`,
                body: item.bio || 'Scaffolded listing',
                action: 'review'
              }))}
              onReview={async (id, action) => {
                await fetch('/api/admin/scaffolded', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id, action })
                })
                window.location.reload()
              }}
            />
          </div>
        )}
        {overview?.triageSummary.pendingLogs?.length ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 space-y-3">
            <p className="text-sm font-semibold text-yellow-800">Emergency triage watchlist ({overview.triageSummary.pendingLogs.length})</p>
            <ul className="space-y-2 text-sm text-yellow-900">
              {overview.triageSummary.pendingLogs.map((log) => (
                <li key={log.id}>
                  <span className="text-xs font-semibold uppercase text-yellow-600 mr-2">{log.predicted_category}</span>
                  {log.description.slice(0, 160)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  )
}

type QueueCardProps = {
  title: string
  items: { id: number; title: string; meta: string; body: string; action?: 'review'; ai_reason?: string | null }[]
  onReview?: (id: number, action: 'approve' | 'reject') => Promise<void>
}

function QueueCard({ title, items, onReview }: QueueCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing pending at the moment.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-lg border border-dashed border-gray-200 p-4 space-y-1">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-xs text-gray-500 uppercase">{item.meta}</p>
            <p className="text-sm text-gray-600">{item.body}</p>
            {item.ai_reason && <p className="text-xs text-gray-500">AI note: {item.ai_reason}</p>}
            {item.action === 'review' && onReview && (
              <div className="flex gap-3 mt-2">
                <button type="button" className="btn-secondary" onClick={() => onReview(item.id, 'approve')}>
                  Approve
                </button>
                <button type="button" className="btn-secondary" onClick={() => onReview(item.id, 'reject')}>
                  Reject
                </button>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  )
}

function Metric({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'text-red-600 font-semibold' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  )
}
