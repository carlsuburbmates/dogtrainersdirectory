'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Suggestion = {
  business_id: number
  business_name: string
  suburb_name: string
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (value: string) => {
    setQuery(value)

    if (value.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
      if (!res.ok) throw new Error('Search failed')

      const data = await res.json()
      setSuggestions(data.results || [])
      setIsOpen(true)
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search trainers by name..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.business_id}
              href={`/trainers/${suggestion.business_id}`}
              className="block px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{suggestion.business_name}</div>
              <div className="text-sm text-gray-600">{suggestion.suburb_name}</div>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No trainers found
        </div>
      )}
    </div>
  )
}
