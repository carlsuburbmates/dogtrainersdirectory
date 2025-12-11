'use client'

import { useEffect, useState } from 'react'
import { EnhancedAdminDashboard } from './enhanced-dashboard'
import { QueueCard } from './queue-card'

type QueuePayload = {
  reviews: Array<{
    id: number
    business_id: number
    reviewer_name: string
    rating: number
    title: string
    content?: string
    created_at: string
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
}

type ScaffoldedItem = {
  id: number
  name: string
  verification_status: string
  bio?: string
}

type FallbackStats = {
  fallbackCount: number
  verificationCount: number
  rate: number
  windowHours: number
  events: Array<{ business_id: number | null; reason: string; created_at: string }>
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueuePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scaffolded, setScaffolded] = useState<ScaffoldedItem[]>([])
  const [fallbackStats, setFallbackStats] = useState<FallbackStats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/queues').then((res) => res.json()),
      fetch('/api/admin/scaffolded').then((res) => res.json()),
      fetch('/api/admin/abn/fallback-stats').then((res) => res.json())
    ])
      .then(([queuePayload, scaffoldPayload, fallbackPayload]: [QueuePayload, { scaffolded: ScaffoldedItem[] }, FallbackStats]) => {
        setQueues(queuePayload)
        setScaffolded(scaffoldPayload.scaffolded || [])
        setFallbackStats(fallbackPayload || null)
      })
      .catch((err) => {
        console.error(err)
        setError('Unable to load admin queues right now.')
      })
  }, [])

  return (
    <>
      {/* Enhanced Dashboard */}
      <div className="mb-8">
        <EnhancedAdminDashboard />
      </div>

      {/* Traditional Queue Interface */}
      <main className="container mx-auto px-4 py-8">
        <section className="space-y-6">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!queues && !error && (
          <p className="text-gray-500">Loading queues…</p>
        )}
        {queues && (
          <div className="space-y-8">
            {fallbackStats && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-900">ABN fallback rate (last {fallbackStats.windowHours}h)</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(fallbackStats.rate * 100).toFixed(1)}%
                  <span className="ml-2 text-sm text-blue-900">
                    ({fallbackStats.fallbackCount}/{fallbackStats.verificationCount || 1})
                  </span>
                </p>
                <p className="text-xs text-blue-900">Monitoring fallback pipeline closes telemetry gap #3.</p>
                {fallbackStats.events?.length > 0 && (
                  <ul className="mt-2 text-xs text-blue-900">
                    {fallbackStats.events.slice(0, 3).map((evt, idx) => (
                      <li key={`${evt.business_id ?? 'na'}-${idx}`}>
                        {new Date(evt.created_at).toLocaleTimeString()} – {evt.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <QueueCard title="Pending Reviews" items={queues.reviews.map((item) => ({
              id: item.id,
              title: item.title,
              meta: `Rating ${item.rating} • Business ${item.business_id}`,
              body: item.content || 'No message provided'
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
                if (res.ok) {
                  window.location.reload()
                }
              }}
            />
            <QueueCard title="Flagged Profiles" items={queues.flagged_businesses.map((item) => ({
              id: item.id,
              title: item.name,
              meta: `Status ${item.verification_status}`,
              body: `Active: ${item.is_active} • Featured until: ${item.featured_until || 'N/A'}`
            }))} />
            <QueueCard title="Scaffolded Listings" items={scaffolded.map((item) => ({
              id: item.id,
              title: item.name,
              meta: `Status ${item.verification_status}`,
              body: item.bio || 'Scaffolded listing',
              action: 'review'
            }))} onReview={async (id, action) => {
              await fetch('/api/admin/scaffolded', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
              })
              window.location.reload()
            }} />
          </div>
        )}
      </section>
      </main>
    </>
  )
}
