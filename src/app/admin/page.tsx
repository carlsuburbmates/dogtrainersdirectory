'use client'

import { useEffect, useState } from 'react'
import { EnhancedAdminDashboard } from './enhanced-dashboard'
import { QueueCard } from './queue-card'
import { buildWeeklyAdminExceptions } from './weekly-exceptions'

type QueuePayload = {
  verification_abn_loop: Array<{
    id: number | string
    title: string
    meta: string
    body: string
    kindLabel: string
    nextAction: string
    action?: 'review'
  }>
  verification_abn_summary: {
    totalItems: number
    abnManualReviewCount: number
    resourceVerificationCount: number
    fallbackCount: number
    verificationCount: number
    fallbackRate: number
    windowHours: number
    note: string
  }
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
  aiEnabled?: boolean
}

type ScaffoldedItem = {
  id: number
  name: string
  verification_status: string
  bio?: string
  guidance_checks?: string[]
  next_action?: string
  guidance_source?: 'shadow_trace'
}

type ScaffoldedResponse = {
  success?: boolean
  scaffolded?: ScaffoldedItem[]
  error?: string
  message?: string
}

const EMPTY_QUEUE_PAYLOAD: QueuePayload = {
  verification_abn_loop: [],
  verification_abn_summary: {
    totalItems: 0,
    abnManualReviewCount: 0,
    resourceVerificationCount: 0,
    fallbackCount: 0,
    verificationCount: 0,
    fallbackRate: 0,
    windowHours: 7 * 24,
    note: 'The weekly verification and ABN exception loop is clear.'
  },
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)

      const [queueResult, scaffoldedResult] =
        await Promise.allSettled([
          fetchJson<QueuePayload>('/api/admin/queues'),
          fetchJson<ScaffoldedResponse>('/api/admin/scaffolded'),
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

      setIsLoading(false)
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const hasLoadError = Boolean(queuesError || scaffoldedError)
  const reviewCount = queues.reviews.length
  const flaggedCount = queues.flagged_businesses.length
  const scaffoldedCount = scaffolded.length
  const verificationLoopCount = queues.verification_abn_summary.totalItems

  return (
    <>
      {/* Traditional Queue Interface */}
      <main className="container mx-auto px-4 py-8">
        <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-950">Weekly exception review</h1>
          <p className="text-sm text-gray-600">
            Work top-down through the exception loops. Guidance is assistive only; protected outcomes still require explicit operator action.
          </p>
        </header>
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
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-700">Action this week</div>
                <div className="flex flex-wrap items-center gap-2">
                  <a className="btn-secondary" href="/admin/ai-health">AI health</a>
                  <a className="btn-secondary" href="/admin/errors">Errors</a>
                  <a className="btn-secondary" href="/admin/cron-health">Cron health</a>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {buildWeeklyAdminExceptions({
                  verificationLoopCount,
                  reviewCount,
                  scaffoldedCount,
                  flaggedCount,
                }).map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Step {item.order}</div>
                        <div className="text-base font-semibold text-gray-950">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.note}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-semibold text-gray-950">{item.count}</div>
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
                  </a>
                ))}
              </div>
            </div>
            {queuesError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {queuesError}
              </div>
            )}
            <div id="verification-abn">
              <QueueCard
                resolveHref="#verification-abn"
                resolveLabel="Jump to loop"
                title="Verification & ABN Weekly Loop"
                description="One bounded weekly exception pass for resource verification and ABN manual reviews. Guidance stays advisory; final verification and ABN outcomes still require explicit operator action."
                summary={`${queues.verification_abn_summary.note} ${queues.verification_abn_summary.verificationCount > 0 ? `ABN fallback rate ${(queues.verification_abn_summary.fallbackRate * 100).toFixed(1)}% (${queues.verification_abn_summary.fallbackCount}/${queues.verification_abn_summary.verificationCount}) over the last ${queues.verification_abn_summary.windowHours}h.` : ''}`.trim()}
                items={queues.verification_abn_loop}
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
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3" id="moderation">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Review moderation loop</h2>
                  <p className="text-sm text-gray-600">
                    Work the ordered moderation queue on the dedicated surface. Draft recommendations are advisory until you approve or reject explicitly.
                  </p>
                </div>
                <a className="btn-secondary whitespace-nowrap" href="/admin/reviews">
                  Open moderation queue
                </a>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Pending reviews to moderate: <span className="font-semibold">{reviewCount}</span>
              </div>
            </div>

            {flaggedCount > 0 ? (
              <div id="flagged-profiles">
                <QueueCard
                  resolveHref="#flagged-profiles"
                  resolveLabel="Jump to queue"
                  title="Flagged Profiles"
                  description="Operator-side flagged profiles. Review carefully; do not change protected outcomes unless the explicit operator path requires it."
                  items={queues.flagged_businesses.map((item) => ({
                    id: item.id,
                    title: item.name,
                    meta: `Status ${item.verification_status}`,
                    body: `Active: ${item.is_active} • Featured until: ${item.featured_until || 'N/A'}`
                  }))}
                />
              </div>
            ) : null}
            {scaffoldedError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {scaffoldedError}
              </div>
            )}
            <div id="scaffolded">
              <QueueCard
                resolveHref="#scaffolded"
                resolveLabel="Jump to queue"
                title="Scaffolded Listings"
                description="Use the recorded scaffold-review guidance at the point of decision. Guidance is assistive only; final approval or rejection still requires an explicit operator action, and approval may also trigger the standard owner email when delivery is configured."
                summary={
                  scaffolded.length > 0
                    ? `Start with the listings that still look incomplete or placeholder-like, then clear the remainder. Shadow guidance stays visible here, but it does not change publication or verification state by itself. Approving a listing also attempts the standard owner email when outbound delivery is configured.`
                    : undefined
                }
                items={scaffolded.map((item) => ({
                  id: item.id,
                  title: item.name,
                  meta: `Status ${item.verification_status}`,
                  body: item.bio || 'Scaffolded listing with limited source content.',
                  kindLabel: item.guidance_source === 'shadow_trace' ? 'Shadow guidance' : undefined,
                  advisoryNote:
                    [
                      item.guidance_source === 'shadow_trace'
                        ? 'Shadow guidance only.'
                        : null,
                      'Approval or rejection still requires your explicit operator action.',
                      'Approving also attempts the standard owner email when outbound delivery is configured.'
                    ]
                      .filter(Boolean)
                      .join(' '),
                  checks: item.guidance_checks,
                  nextAction:
                    item.next_action ||
                    'Review the scaffolded listing details, then approve only if the business looks real, complete, and safe to publish.',
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

            <details className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700">
                Diagnostics and snapshots (lower priority)
              </summary>
              <div className="mt-4">
                <EnhancedAdminDashboard />
              </div>
            </details>
          </div>
        )}
      </section>
      </main>
    </>
  )
}
