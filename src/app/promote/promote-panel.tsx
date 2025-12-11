'use client'

import { useState } from 'react'

type PromoteBusiness = {
  id: number
  name: string
  suburb: string
  abnVerified: boolean
  verificationStatus: string
  featuredUntil: string | null
}

type PromotePanelProps = {
  business: PromoteBusiness | null
  businessId?: number
  statusParam?: 'success' | 'cancelled' | null
}

export function PromotePanel({ business, businessId, statusParam }: PromotePanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutPreview, setCheckoutPreview] = useState<string | null>(null)
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1'

  const handleUpgrade = async () => {
    if (!business?.id) return
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id })
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Checkout creation failed')
      }
      const payload = await response.json()
      if (payload.checkoutUrl) {
        if (isE2E) {
          setCheckoutPreview(payload.checkoutUrl)
        } else {
          window.location.href = payload.checkoutUrl
        }
      } else {
        throw new Error('Stripe checkout URL missing')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200 bg-white/80 px-8 py-10 shadow-sm backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Monetization beta</p>
          <h1 className="text-4xl font-bold text-gray-900">Promote my listing</h1>
          <p className="text-gray-600">
            Feature-flagged upgrade flow for ABN-verified providers. Launch-ready but hidden until the monetization flag is enabled.
          </p>
        </div>
        {statusParam === 'success' && (
          <div className="mt-6 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            Checkout complete. Subscription status will update as soon as Stripe confirms the payment.
          </div>
        )}
        {statusParam === 'cancelled' && (
          <div className="mt-6 rounded-lg border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Checkout cancelled. You can resume the upgrade whenever you’re ready.
          </div>
        )}
        {!business && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Provide a <code>businessId</code> query string (?businessId=123) for the listing you wish to upgrade.
          </div>
        )}
        {business && (
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Listing</p>
              <h2 className="text-2xl font-semibold text-gray-900">{business.name}</h2>
              <p className="text-gray-600">{business.suburb}</p>
              <p className="text-xs text-gray-500 mt-1">
                Verification: {business.abnVerified ? 'ABN verified' : business.verificationStatus}
              </p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-4 text-center">
              <p className="text-sm font-semibold text-indigo-700">Featured placement</p>
              <p className="text-4xl font-bold text-indigo-900">A$149</p>
              <p className="text-xs text-indigo-700">per 30 days</p>
            </div>
          </div>
        )}
        {business && !business.abnVerified && (
          <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Complete ABN verification before accessing the upgrade.
          </div>
        )}
        {business && business.abnVerified && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white/70 p-6">
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Featured search placement across Melbourne councils</li>
              <li>• Early access to analytics (profile views + search insights)</li>
              <li>• Priority review moderation + telemetry alerts</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Preparing checkout…' : 'Upgrade now'}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {checkoutPreview && (
              <p className="mt-3 text-xs text-indigo-700">
                E2E preview: would redirect to <span className="font-mono">{checkoutPreview}</span>
              </p>
            )}
          </div>
        )}
      </div>
      {businessId && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
          Checkout API will use business ID <span className="font-mono text-gray-800">{businessId}</span>. E2E mode
          automatically stubs Stripe responses.
        </div>
      )}
    </div>
  )
}
