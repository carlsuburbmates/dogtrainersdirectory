'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import type { SuburbResult } from '@/lib/api'

interface SuburbAutocompleteProps {
  value: SuburbResult | null
  onChange: (suburb: SuburbResult | null) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
}

const QUERY_DEBOUNCE_MS = 250
const MIN_CHARS_FOR_QUERY = 2

export const SuburbAutocomplete = ({
  value,
  onChange,
  placeholder = 'Start typing a suburb…',
  disabled = false,
  autoFocus = false
}: SuburbAutocompleteProps) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SuburbResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounce local query
  const debouncedQuery = React.useMemo(() => {
    let timer: NodeJS.Timeout
    return (newValue: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fetchSuggestions(newValue)
      }, QUERY_DEBOUNCE_MS)
    }
  }, [])

  const fetchSuggestions = async (search: string) => {
    if (search.length < MIN_CHARS_FOR_QUERY) {
      setSuggestions([])
      setShowSuggestions(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Cancel previous request if any
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      // Reuse existing edge function for now; later move to a pure /api/suburbs route
      const response = await fetch('/api/v1/suburbs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search }),
        signal: abortRef.current.signal
      })
      if (!response.ok) throw new Error('Failed to fetch suburbs')
      const data = await response.json()
      const suburbs = (data?.suburbs || []) as SuburbResult[]
      setSuggestions(suburbs)
      setShowSuggestions(true)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Suburb search error:', err)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset query when external value changes
  useEffect(() => {
    if (value) {
      setQuery(`${value.name} (${value.postcode})`)
    } else {
      setQuery('')
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    debouncedQuery(v)
    if (value) onChange(null) // Clear external selection on typing
    if (!showSuggestions && v.length >= MIN_CHARS_FOR_QUERY) setShowSuggestions(true)
  }

  const handleSelect = (suburb: SuburbResult) => {
    onChange(suburb)
    setQuery(`${suburb.name} (${suburb.postcode})`)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleBlur = () => {
    // Delay dismissal to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false)
      setLoading(false)
    }, 200)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0 || query.length >= MIN_CHARS_FOR_QUERY) setShowSuggestions(true)
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && <LoadingSpinner size="sm" />}
        {query && !loading && (
          <Button type="button" variant="ghost" size="icon" onClick={handleClear}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {suggestions.length === 0 && query.length >= MIN_CHARS_FOR_QUERY && !loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">No suburbs found</div>
          ) : (
            suggestions.map((suburb) => (
              <button
                key={suburb.id}
                type="button"
                onClick={() => handleSelect(suburb)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                <div className="font-medium">{suburb.name}</div>
                <div className="text-xs text-gray-500">
                  {suburb.postcode} • {suburb.latitude.toFixed(3)}, {suburb.longitude.toFixed(3)}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}