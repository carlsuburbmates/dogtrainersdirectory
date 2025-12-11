'use client'

import { useEffect, useMemo, useState } from 'react'

type TelemetryStatus = {
  overall: string
  timestamp?: string
  components?: Record<string, { status: string; message: string }>
  summary?: string
  telemetry?: {
    overrides: any[]
    abnRecheck: CronSnapshot | null
    emergencyCron: CronSnapshot | null
  }
}

type CronSnapshot = {
  jobName: string
  checkedAt?: string
  lastSuccess: string | null
  lastFailure: string | null
  failureMessage?: string | null
}

export function AdminStatusStrip() {
  const [status, setStatus] = useState<TelemetryStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchStatus = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/health?extended=1', { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json?.error || 'Failed to load health')
        if (active) {
          setStatus(json)
          setError(null)
        }
      } catch (err: any) {
        console.error('Status strip load failed', err)
        if (active) setError(err?.message || 'Unable to load status')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchStatus()
    const id = setInterval(fetchStatus, 60_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const telemetryState = useMemo(() => {
    const overrideLookup = new Map(
      status?.telemetry?.overrides?.map((entry: any) => [entry.service, entry]) ?? []
    )

    const formatCron = (snapshot?: CronSnapshot | null) => {
      if (!snapshot) return { label: 'Unknown', detail: 'No data' }
      const lastSuccess = snapshot.lastSuccess
        ? new Date(snapshot.lastSuccess).toLocaleString()
        : '—'
      const lastFailure = snapshot.lastFailure
        ? new Date(snapshot.lastFailure).toLocaleString()
        : 'Never'
      return {
        label: lastSuccess,
        detail: `Last failure: ${lastFailure}`
      }
    }

    return {
      overall: overrideLookup.get('telemetry')?.status ?? status?.overall ?? 'unknown',
      overrideMessage: overrideLookup.get('telemetry')?.reason ?? null,
      abnRecheck: formatCron(status?.telemetry?.abnRecheck),
      abnOverride: overrideLookup.get('abn_recheck') || null,
      emergencyCron: formatCron(status?.telemetry?.emergencyCron),
      emergencyOverride: overrideLookup.get('emergency_cron') || null
    }
  }, [status])

  return (
    <footer className="border-t border-gray-200 bg-white text-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4">
          <StatusBadge
            label="Telemetry"
            value={
              loading
                ? 'Loading…'
                : error
                  ? 'Unavailable'
                  : telemetryState.overall === 'temporarily_down'
                    ? 'Temporarily Down'
                    : telemetryState.overall === 'investigating'
                      ? 'Under Investigation'
                      : telemetryState.overall.toUpperCase()
            }
            variant={getVariant(telemetryState.overall)}
            tooltip={telemetryState.overrideMessage || status?.summary}
          />
          <StatusBadge
            label="ABN recheck"
            value={telemetryState.abnRecheck.label}
            subtext={telemetryState.abnRecheck.detail}
            variant={telemetryState.abnOverride ? 'warning' : 'neutral'}
            tooltip={telemetryState.abnOverride?.reason}
          />
          <StatusBadge
            label="Emergency cron"
            value={telemetryState.emergencyCron.label}
            subtext={telemetryState.emergencyCron.detail}
            variant={telemetryState.emergencyOverride ? 'warning' : 'neutral'}
            tooltip={telemetryState.emergencyOverride?.reason}
          />
        </div>
        <a
          href="https://github.com/carlsuburbmates/dogtrainersdirectory/blob/main/scripts/preprod_verify.sh"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Pre-prod verification instructions
        </a>
      </div>
    </footer>
  )
}

function StatusBadge({
  label,
  value,
  subtext,
  variant,
  tooltip
}: {
  label: string
  value: string
  subtext?: string
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  tooltip?: string | null
}) {
  const colors =
    variant === 'danger'
      ? 'bg-red-50 text-red-800 border-red-200'
      : variant === 'warning'
        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
        : variant === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-gray-50 text-gray-700 border-gray-200'

  return (
    <div className={`rounded-md border px-3 py-2 ${colors}`} title={tooltip || undefined}>
      <div className="text-xs uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium">{value}</div>
      {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
    </div>
  )
}

function getVariant(status?: string) {
  if (!status) return 'neutral'
  if (status === 'healthy' || status === 'ok') return 'success'
  if (status === 'temporarily_down') return 'danger'
  if (status === 'investigating' || status === 'degraded') return 'warning'
  if (status === 'down') return 'danger'
  return 'neutral'
}

export default AdminStatusStrip
