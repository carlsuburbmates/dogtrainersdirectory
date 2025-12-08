'use client'

import { useEffect, useState } from 'react'

interface TriageMetricsPoint {
  hour: string
  total: number
  medical_count: number
  immediate_count: number
  avg_latency_ms: number
}

interface TriageMetricsChartProps {
  hours?: number
}

export default function TriageMetricsChart({ hours = 24 }: TriageMetricsChartProps) {
  const [metrics, setMetrics] = useState<TriageMetricsPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/triage/stats?hours=${hours}&hourly=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch triage metrics')
        }

        const data = await response.json()
        if (data.success && data.hourlyMetrics) {
          setMetrics(data.hourlyMetrics.slice(0, hours)) // Limit display to requested hours
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setMetrics([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [hours])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Triage Volume by Hour</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Triage Volume by Hour</h2>
        <div className="text-red-600">Error loading triage metrics: {error}</div>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Triage Volume by Hour (Last {hours}h)</h2>
        <div className="text-gray-500">No triage data available</div>
      </div>
    )
  }

  // Simple bar chart using CSS
  const maxVolume = Math.max(...metrics.map(m => m.total))
  const formatDate = (hourStr: string) => {
    const date = new Date(hourStr)
    return date.toLocaleDateString('en-AU', { 
      hour: '2-digit', 
      hour12: false,
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Triage Volume by Hour (Last {hours}h)</h2>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>Hour</span>
          <div className="flex space-x-6">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
              Total
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
              Medical
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
              Immediate
            </span>
          </div>
        </div>
        
        {metrics.map((point, idx) => (
          <div key={idx} className="flex items-center space-x-4">
            <div className="w-20 text-xs text-gray-600">
              {formatDate(point.hour)}
            </div>
            
            <div className="flex-1 flex items-center space-x-2">
              {/* Total volume bar */}
              <div 
                className="h-5 bg-blue-500 rounded"
                style={{ width: `${maxVolume > 0 ? (point.total / maxVolume) * 100 : 0}%` }}
                title={`Total: ${point.total}`}
              ></div>
              
              {/* Medical emergency indicator */}
              {point.medical_count > 0 && (
                <div 
                  className="h-5 bg-red-500 rounded"
                  style={{ width: `${maxVolume > 0 ? (point.medical_count / maxVolume) * 100 : 0}%` }}
                  title={`Medical: ${point.medical_count}`}
                ></div>
              )}
              
              {/* Immediate urgency indicator */}
              {point.immediate_count > 0 && (
                <div 
                  className="h-5 bg-orange-500 rounded"
                  style={{ width: `${maxVolume > 0 ? (point.immediate_count / maxVolume) * 100 : 0}%` }}
                  title={`Immediate: ${point.immediate_count}`}
                ></div>
              )}
            </div>
            
            <div className="w-16 text-right text-xs text-gray-600">
              {point.total}
            </div>
            
            <div className="w-16 text-right text-xs text-gray-600">
              {point.avg_latency_ms ? `${Math.round(point.avg_latency_ms)}ms` : '-'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
        <div>
          Highest volume period: {metrics.reduce((max, point) => 
            point.total > max.total ? point : max, metrics[0]
          ).total} calls
        </div>
        <div>
          Average latency: {Math.round(
            metrics.reduce((sum, point) => sum + (point.avg_latency_ms || 0), 0) / metrics.length
          )}ms
        </div>
      </div>
    </div>
  )
}