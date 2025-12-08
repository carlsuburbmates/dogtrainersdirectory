import React from 'react'

interface ErrorMetrics {
  totalErrors: number
  errorsPerMinute: number
  levelBreakdown: Record<string, number>
  categoryBreakdown: Record<string, number>
  topErrors: { message: string; level: string; category: string; route?: string; frequency: number }[]
}

interface Props {
  data: ErrorMetrics
}

export function ErrorMetricsChart({ data }: Props) {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-semibold mb-2">Error Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Total Errors (period)</div>
          <div className="text-2xl font-bold">{data.totalErrors}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Avg Errors/Min</div>
          <div className="text-2xl font-bold">{data.errorsPerMinute}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Top Level</div>
          <div className="text-2xl font-bold">
            {Object.entries(data.levelBreakdown)
              .sort((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">By Level</h3>
          <ul className="text-sm">
            {Object.entries(data.levelBreakdown).map(([level, count]) => (
              <li key={level} className="flex justify-between py-1">
                <span className="capitalize">{level}</span>
                <span className="font-mono">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">By Category</h3>
          <ul className="text-sm">
            {Object.entries(data.categoryBreakdown).map(([cat, count]) => (
              <li key={cat} className="flex justify-between py-1">
                <span className="capitalize">{cat.replace('_', ' ')}</span>
                <span className="font-mono">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Top Errors</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Message</th>
                <th className="text-left p-2 border">Level</th>
                <th className="text-left p-2 border">Category</th>
                <th className="text-left p-2 border">Route</th>
                <th className="text-right p-2 border">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.topErrors.map((err, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 border">{err.message}</td>
                  <td className="p-2 border capitalize">{err.level}</td>
                  <td className="p-2 border capitalize">{err.category}</td>
                  <td className="p-2 border">{err.route || '-'}</td>
                  <td className="p-2 border text-right font-mono">{err.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ErrorMetricsChart
