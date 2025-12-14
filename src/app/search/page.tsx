'use client'

import { useState } from 'react'

// Simple UI components for search page
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default function SearchPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search Trainers</h1>
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
          <p className="text-sm text-gray-500">
            Current query: {query || "No query entered"}
          </p>
        </div>
      </Card>
    </div>
  )
}