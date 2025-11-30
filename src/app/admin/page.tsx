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

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueuePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scaffolded, setScaffolded] = useState<ScaffoldedItem[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/queues').then((res) => res.json()),
      fetch('/api/admin/scaffolded').then((res) => res.json()),
    ])
      .then(([queuePayload, scaffoldPayload]: [QueuePayload, { scaffolded: ScaffoldedItem[] }]) => {
        setQueues(queuePayload)
        setScaffolded(scaffoldPayload.scaffolded || [])
      })
      .then((res) => res.json())
      .then((payload: QueuePayload) => setQueues(payload))
      .catch((err) => {
        console.error(err)
        setError('Unable to load admin queues right now.')
      })
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Moderation Queues</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!queues && !error && (
          <p className="text-gray-500">Loading queues…</p>
        )}
        {queues && (
          <div className="space-y-8">
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
  )
}

type QueueCardProps = {
  title: string
  items: { id: number; title: string; meta: string; body: string; action?: 'review' }[]
  onReview?: (id: number, action: 'approve' | 'reject') => Promise<void>
}

function QueueCard({ title, items }: QueueCardProps) {
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
              {item.action === 'review' && onReview && (
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onReview(item.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onReview(item.id, 'reject')}
                  >
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
