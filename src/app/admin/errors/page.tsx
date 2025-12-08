'use client'
import React, { useState, useEffect } from 'react'
import ErrorMetricsChart from '@/components/admin/ErrorMetricsChart'

interface ErrorMetrics {
  totalErrors: number
  errorsPerMinute: number
  levelBreakdown: Record<string, number>
  categoryBreakdown: Record<string, number>
  topErrors: { message: string; level: string; category: string; route?: string; frequency: number }[]
}

export default function AdminErrorDashboard() {
  const [errorData, setErrorData] = useState<ErrorMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h')
  const [detailed, setDetailed] = useState(false)

  useEffect(() => {
    fetchErrorMetrics()
  }, [period, detailed])

  const fetchErrorMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/errors/stats?period=${period}&detailed=${detailed}`)
      if (!response.ok) throw new Error('Failed to fetch error metrics')
      
      const data = await response.json()
      setErrorData(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !errorData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Error Monitoring Dashboard</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading error metrics...</div>
        </div>
      </div>
    )
  }

  if (!errorData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Error Monitoring Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Failed to load error metrics. Please try refreshing the page.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Period:</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value as '24h' | '7d' | '30d')}
              className="rounded border px-3 py-1"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="detailed" 
              checked={detailed} 
              onChange={(e) => setDetailed(e.target.checked)}
            />
            <label htmlFor="detailed" className="text-sm">Detailed</label>
          </div>
          <button 
            onClick={() => fetchErrorMetrics()} 
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex space-x-4">
        <a href="/admin/triage" className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Triage Dashboard
        </a>
        <a href="/api/admin/errors/trigger-alert" className="inline-block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
          Trigger Alert Test
        </a>
        <a href="/api/test/errors/" target="_blank" className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Test Error Logging
        </a>
        <a href="/api/test/triage" target="_blank" className="inline-block px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Test Triage
        </a>
      </div>

      <ErrorMetricsChart data={errorData} />
      
      {detailed && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded ${errorData.levelBreakdown.critical > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <h3 className="font-medium">Critical</h3>
              <p className="text-2xl font-bold">{errorData.levelBreakdown.critical || 0}</p>
            </div>
            <div className={`p-4 rounded ${errorData.levelBreakdown.error > 10 ? 'bg-orange-100' : 'bg-yellow-100'}`}>
              <h3 className="font-medium">Error</h3>
              <p className="text-2xl font-bold">{errorData.levelBreakdown.error || 0}</p>
            </div>
            <div className={`p-4 rounded ${errorData.levelBreakdown.warn > 20 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <h3 className="font-medium">Warning</h3>
              <p className="text-2xl font-bold">{errorData.levelBreakdown.warn || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}