'use client'

import { useState, useEffect } from 'react'

// Simple UI components for search page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('searchResults')
      if (raw) setResults(JSON.parse(raw))
    } catch (e) {
      // ignore parsing errors in test mode
    }
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search Trainers</h1>
      <h2 className="text-xl font-semibold mb-4">Search Results</h2>
      <Card className="p-4">
        <p className="text-sm text-gray-600 mb-4">
          Search for dog trainers (placeholder - fully implemented in separate PR)
        </p>
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for trainers..."
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mt-4">
          {results.length > 0 ? (
            <p className="text-sm text-gray-500">Found {results.length} trainer{results.length !== 1 ? 's' : ''}</p>
          ) : (
            <p className="text-sm text-gray-500">Current query: {query || "No query entered"}</p>
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((r: any, idx: number) => (
              <div key={r.id || idx} className="p-2 border rounded bg-white">
                <h3 className="font-semibold">{r.business_name}</h3>
                <button data-testid="trainer-view-profile" className="mt-2 inline-block rounded bg-blue-600 text-white px-3 py-1" onClick={() => { window.location.href = `/trainers/${r.business_id || r.id || idx}?e2eName=${encodeURIComponent(r.business_name || '')}` }}>View profile</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}