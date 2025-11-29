'use client'

import { useEffect, useState } from 'react'

type DashboardResponse = {
  business: {
    id: number
    name: string
    abn_verified: boolean
    verification_status: string
    featured_until: string | null
  }
  analytics: {
    totalViews: number
    totalProfileClicks: number
    totalInquiries: number
    averageRating: string
    reviewCount: number
  }
}

const DUMMY_BUSINESS_ID = 1

export default function TrainerDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/trainer/dashboard?businessId=${DUMMY_BUSINESS_ID}`)
      .then((res) => res.json())
      .then((payload) => setData(payload))
      .catch((err) => {
        console.error(err)
        setError('Unable to load your dashboard right now.')
      })
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!data && !error && <p>Loading dashboard…</p>}
        {data && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Profile status</h2>
              <p>
                Verification: <strong>{data.business.verification_status}</strong>{' '}
                {data.business.abn_verified && <span className="text-green-600">(ABN verified)</span>}
              </p>
              <p>Featured until: {data.business.featured_until || 'Not featured yet'}</p>
            </div>
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Key metrics</h2>
              <p>Profile views: {data.analytics.totalViews}</p>
              <p>Profile clicks: {data.analytics.totalProfileClicks}</p>
              <p>Inquiries: {data.analytics.totalInquiries}</p>
              <p>Avg rating: {data.analytics.averageRating} ({data.analytics.reviewCount} reviews)</p>
            </div>
          </div>
        )}
        <div className="card p-6 space-y-3">
          <h3 className="text-xl font-semibold">Actions</h3>
          <p className="text-sm text-gray-600">Use these once the manual boarding is complete.</p>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary">Edit profile</button>
            <button className="btn-secondary">Update ABN</button>
            <button className="btn-secondary">View featured analytics</button>
          </div>
        </div>
      </div>
    </main>
  )
}
