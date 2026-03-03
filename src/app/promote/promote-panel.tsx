'use client'

import { useState } from 'react'

type PromoteBusiness = {
  id: number
  name: string
  suburb: string | null
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
  const hasActiveFeaturedPlacement = Boolean(
    business?.featuredUntil && new Date(business.featuredUntil) > new Date()
  )

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
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Featured placement</p>
          <h1 className="text-4xl font-bold text-gray-900">Promote my listing</h1>
          <p className="text-gray-600">
            Pay once to add visible featured status to your listing for 30 days. This offer is for
            ABN-verified providers and uses the current Stripe checkout flow.
          </p>
        </div>
        {statusParam === 'success' && (
          <div className="mt-6 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            Checkout complete. Your featured placement will update as soon as Stripe confirms the
            payment.
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
              <p className="text-gray-600">{business.suburb || 'Suburb not listed yet'}</p>
              <p className="text-xs text-gray-500 mt-1">
                Verification: {business.abnVerified ? 'ABN verified' : business.verificationStatus}
              </p>
              {hasActiveFeaturedPlacement && (
                <p className="mt-2 text-xs font-semibold text-green-700">
                  Featured placement active until {new Date(business.featuredUntil as string).toLocaleDateString('en-AU')}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-4 text-center">
              <p className="text-sm font-semibold text-indigo-700">One-time payment</p>
              <p className="text-4xl font-bold text-indigo-900">A$20</p>
              <p className="text-xs text-indigo-700">for 30 days of featured visibility</p>
            </div>
          </div>
        )}
        {business && !business.abnVerified && (
          <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Complete ABN verification before accessing featured placement.
          </div>
        )}
        {business && business.abnVerified && (
          <div className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white/70 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
                <p className="text-sm font-semibold text-indigo-800">What buyers will see</p>
                <ul className="mt-3 space-y-2 text-sm text-indigo-900">
                  <li>• A Featured badge in the public directory.</li>
                  <li>• Featured listings are shown before standard listings in each directory region.</li>
                  <li>• A Featured listing label on your trainer profile.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">What this does not include</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• No guaranteed ranking in every search result.</li>
                  <li>• No analytics dashboard, lead counts, or impression reporting yet.</li>
                  <li>• No change to your reviews, verification status, or contact options.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">What happens after payment</p>
              <ol className="mt-3 space-y-2 text-sm text-gray-700">
                <li>1. Stripe Checkout opens for a one-time A$20 payment.</li>
                <li>2. Once Stripe confirms payment, your featured placement activates for the 30-day window.</li>
                <li>3. Buyers see the featured label where it is currently supported in the public product.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-white p-5">
              <p className="text-sm font-semibold text-gray-900">
                {hasActiveFeaturedPlacement ? 'Extend your current featured placement' : 'Start your featured placement'}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                This keeps the purchase simple: one checkout, one featured placement window, no subscription change.
              </p>
            </div>
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
