'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import type { SuburbResult } from '@/lib/api'

type BusinessSuggestion = {
  type: 'business'
  display: string
  id: number
}

type SuburbSuggestion = {
  type: 'suburb'
  display: string
  id: number
  suburb: SuburbResult
}

type Suggestion = BusinessSuggestion | SuburbSuggestion

const QUERY_DEBOUNCE_MS = 250
const MIN_CHARS_FOR_QUERY = 2

export default function SearchAutocomplete() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const requestIdRef = useRef(0)

  const debouncedQuery = useMemo(() => {
    let timer: NodeJS.Timeout
    return (value: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fetchSuggestions(value)
      }, QUERY_DEBOUNCE_MS)
    }
  }, [])

  const fetchSuggestions = async (value: string) => {
    if (value.length < MIN_CHARS_FOR_QUERY) {
      requestIdRef.current += 1
      setSuggestions([])
      setShowSuggestions(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const requestId = ++requestIdRef.current

    try {
      const [autoCompleteResult, suburbsResult] = await Promise.allSettled([
        fetch(`/api/public/autocomplete?q=${encodeURIComponent(value)}`).then(async (response) => {
          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.message || 'Autocomplete failed')
          }
          return payload
        }),
        apiService.searchSuburbs(value)
      ])

      if (requestId !== requestIdRef.current) return

      const businessSuggestions: BusinessSuggestion[] =
        autoCompleteResult.status === 'fulfilled'
          ? ((autoCompleteResult.value?.suggestions || []) as any[])
              .filter((item) => item?.type === 'business' && typeof item?.id === 'number')
              .map((item) => ({ type: 'business', display: String(item.display), id: Number(item.id) }))
          : []

      const suburbSuggestions: SuburbSuggestion[] =
        suburbsResult.status === 'fulfilled'
          ? suburbsResult.value.map((suburb) => ({
              type: 'suburb',
              display: `${suburb.name} (${suburb.postcode})`,
              id: suburb.id,
              suburb
            }))
          : []

      setSuggestions([...businessSuggestions, ...suburbSuggestions])
      setShowSuggestions(true)
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      console.error('Autocomplete error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const handleSelect = (suggestion: Suggestion) => {
    setShowSuggestions(false)
    setSuggestions([])
    if (suggestion.type === 'business') {
      router.push(`/trainers/${suggestion.id}`)
      return
    }
    const qs = new URLSearchParams()
    qs.set('lat', String(suggestion.suburb.latitude))
    qs.set('lng', String(suggestion.suburb.longitude))
    qs.set('distance', '5-15')
    qs.set('suburbId', String(suggestion.suburb.id))
    qs.set('suburbName', suggestion.suburb.name)
    qs.set('postcode', suggestion.suburb.postcode)
    qs.set('councilId', String(suggestion.suburb.council_id))
    router.push(`/search?${qs.toString()}`)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  useEffect(() => {
    if (query.length >= MIN_CHARS_FOR_QUERY) {
      debouncedQuery(query)
      if (!showSuggestions) setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, debouncedQuery, showSuggestions])

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.length >= MIN_CHARS_FOR_QUERY) setShowSuggestions(true)
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search trainers or suburbs..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="btn-primary px-4 py-2"
          disabled={!query.trim() || loading}
        >
          Search
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {!loading && suggestions.length === 0 && query.length >= MIN_CHARS_FOR_QUERY && (
            <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
          )}
          {!loading && suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
            >
              <div className="text-sm font-medium">{suggestion.display}</div>
              <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
