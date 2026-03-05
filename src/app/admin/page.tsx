'use client'

import { useEffect, useState } from 'react'
import { EnhancedAdminDashboard } from './enhanced-dashboard'
import { QueueCard } from './queue-card'

type QueuePayload = {
  emergency_verifications: Array<{
    id: number
    name: string
    resource_type: string
    emergency_phone?: string | null
    emergency_hours?: string | null
    emergency_verification_status?: string | null
    emergency_verification_notes?: string | null
    suburbs?: {
      name?: string | null
      postcode?: string | null
      councils?: { name?: string | null }[] | { name?: string | null }
    } | null
  }>
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

type ScaffoldedResponse = {
  success?: boolean
  scaffolded?: ScaffoldedItem[]
  error?: string
  message?: string
}

const EMPTY_QUEUE_PAYLOAD: QueuePayload = {
  emergency_verifications: [],
  reviews: [],
  abn_verifications: [],
  flagged_businesses: [],
}

const READABLE_ERRORS = {
  queues:
    'Queue data is temporarily unavailable. Please refresh shortly.',
  scaffolded:
    'Scaffolded listings are temporarily unavailable. Please refresh shortly.',
  fallback:
    'ABN fallback telemetry is temporarily unavailable. Please refresh shortly.',
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  let payload: any = null

  try {
    payload = await response.json()
  } catch (_error) {
    payload = null
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as T
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueuePayload>(EMPTY_QUEUE_PAYLOAD)
  const [queuesError, setQueuesError] = useState<string | null>(null)
  const [scaffolded, setScaffolded] = useState<ScaffoldedItem[]>([])
  const [scaffoldedError, setScaffoldedError] = useState<string | null>(null)
  const [fallbackStats, setFallbackStats] = useState<FallbackStats | null>(null)
  const [fallbackStatsError, setFallbackStatsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)

      const [queueResult, scaffoldedResult, fallbackResult] =
        await Promise.allSettled([
          fetchJson<QueuePayload>('/api/admin/queues'),
          fetchJson<ScaffoldedResponse>('/api/admin/scaffolded'),
          fetchJson<FallbackStats>('/api/admin/abn/fallback-stats'),
        ])

      if (isCancelled) return

      if (queueResult.status === 'fulfilled') {
        setQueues(queueResult.value)
        setQueuesError(null)
      } else {
        console.error(queueResult.reason)
        setQueues(EMPTY_QUEUE_PAYLOAD)
        setQueuesError(READABLE_ERRORS.queues)
      }

      if (scaffoldedResult.status === 'fulfilled') {
        const payload = scaffoldedResult.value
        if (payload.success === false) {
          setScaffolded([])
          setScaffoldedError(READABLE_ERRORS.scaffolded)
        } else {
          setScaffolded(payload.scaffolded || [])
          setScaffoldedError(null)
        }
      } else {
        console.error(scaffoldedResult.reason)
        setScaffolded([])
        setScaffoldedError(READABLE_ERRORS.scaffolded)
      }

      if (fallbackResult.status === 'fulfilled') {
        setFallbackStats(fallbackResult.value || null)
        setFallbackStatsError(null)
      } else {
        console.error(fallbackResult.reason)
        setFallbackStats(null)
        setFallbackStatsError(READABLE_ERRORS.fallback)
      }

      setIsLoading(false)
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const hasLoadError = Boolean(
    queuesError || scaffoldedError || fallbackStatsError
  )

  return (
    <>
      {/* Enhanced Dashboard */}
      <div className="mb-8">
        <EnhancedAdminDashboard />
      </div>

      {/* Traditional Queue Interface */}
      <main className="container mx-auto px-4 py-8">
        <section className="space-y-6">
        {hasLoadError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Some queue sections could not be loaded. You can still action the available sections, then refresh to retry.
          </div>
        )}
        {isLoading && (
          <p className="text-gray-500">Loading queues…</p>
        )}
        {!isLoading && (
          <div className="space-y-8">
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <div className="text-sm font-semibold text-gray-700">Operator task summary</div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                  { label: 'Emergency', count: queues.emergency_verifications.length },
                  { label: 'ABN', count: queues.abn_verifications.length },
                  { label: 'Reviews', count: queues.reviews.length },
                  { label: 'Flagged', count: queues.flagged_businesses.length },
                  { label: 'Scaffolded', count: scaffolded.length }
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-gray-200 px-3 py-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">{item.label}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{item.count}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.count > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.count > 0 ? 'Action' : 'OK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {queuesError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {queuesError}
              </div>
            )}
            {fallbackStatsError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {fallbackStatsError}
              </div>
            )}
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
            <QueueCard
              title="Emergency Verification"
              items={queues.emergency_verifications.map((item) => {
                const suburbs = Array.isArray(item.suburbs)
                  ? item.suburbs[0]
                  : item.suburbs
                const council =
                  Array.isArray(suburbs?.councils)
                    ? suburbs?.councils[0]?.name
                    : suburbs?.councils?.name
                const meta = [
                  item.resource_type,
                  suburbs?.name ? `${suburbs.name}${suburbs.postcode ? ` (${suburbs.postcode})` : ''}` : null,
                  council ? `Council: ${council}` : null
                ]
                  .filter(Boolean)
                  .join(' • ')
                const bodyParts = [
                  item.emergency_phone ? `Phone: ${item.emergency_phone}` : null,
                  item.emergency_hours ? `Hours: ${item.emergency_hours}` : null,
                  item.emergency_verification_notes ? `Notes: ${item.emergency_verification_notes}` : null
                ].filter(Boolean)
                return {
                  id: item.id,
                  title: item.name,
                  meta: meta || 'Emergency resource review',
                  body: bodyParts.length > 0 ? bodyParts.join(' | ') : 'Review required'
                }
              })}
            />
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
            {scaffoldedError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {scaffoldedError}
              </div>
            )}
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
