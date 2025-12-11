'use client'

import { useEffect, useState } from 'react'

type Override = {
  service: string
  status: string
  reason?: string | null
  expires_at?: string
}

interface Props {
  service: string
  label: string
  onOverrideChange?: (override: Override | null) => void
}

export function TelemetryOverrideToggle({ service, label, onOverrideChange }: Props) {
  const [override, setOverride] = useState<Override | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchOverrides = async () => {
      try {
        const response = await fetch('/api/admin/ops/overrides', { cache: 'no-store' })
        const json = await response.json()
        if (active) {
          const current = (json?.overrides || []).find((o: Override) => o.service === service) || null
          setOverride(current)
          setReason(current?.reason || '')
          onOverrideChange?.(current)
        }
      } catch (err) {
        console.warn('Failed to load overrides', err)
      }
    }
    fetchOverrides()
    return () => {
      active = false
    }
  }, [service, onOverrideChange])

  const updateOverride = async (status: 'temporarily_down' | 'investigating') => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/ops/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, status, reason })
      })
      if (!response.ok) {
        const json = await response.json()
        throw new Error(json?.error || 'Override failed')
      }
      const json = await response.json()
      setOverride(json.override)
      onOverrideChange?.(json.override)
    } catch (err: any) {
      setError(err?.message || 'Unable to apply override')
    } finally {
      setLoading(false)
    }
  }

  const clearOverride = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`/api/admin/ops/overrides?service=${service}`, {
        method: 'DELETE'
      })
      setOverride(null)
      setReason('')
      onOverrideChange?.(null)
    } catch (err: any) {
      setError(err?.message || 'Unable to clear override')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{label} override</p>
          <p className="text-xs text-gray-500">
            {override
              ? `Active until ${override.expires_at ? new Date(override.expires_at).toLocaleTimeString() : 'expiry'}.`
              : 'No override active.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-outline text-xs"
            disabled={loading}
            onClick={() => updateOverride('investigating')}
          >
            Mark Investigating
          </button>
          <button
            className="btn-secondary text-xs"
            disabled={loading}
            onClick={() => updateOverride('temporarily_down')}
          >
            Mark Down
          </button>
          {override && (
            <button className="btn-ghost text-xs text-red-600" disabled={loading} onClick={clearOverride}>
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-gray-600 block mb-1" htmlFor={`reason-${service}`}>
          Reason / notes (optional)
        </label>
        <input
          id={`reason-${service}`}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={reason}
          disabled={loading}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
