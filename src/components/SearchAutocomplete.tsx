'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgeStageValue, AGE_STAGE_OPTIONS, ISSUE_OPTIONS } from '@/lib/triage'
import type { BehaviorIssue } from '@/types/database'

type TrainerSuggestion = { type: 'trainer'; id: number; name: string }
type IssueSuggestion = { type: 'issue'; value: BehaviorIssue; label: string }
type SuburbSuggestion = { type: 'suburb'; id: number; name: string; postcode: string; council_name: string; region: string }
type AgeSuggestion = { type: 'age'; value: AgeStageValue; label: string }

type Suggestion = TrainerSuggestion | IssueSuggestion | SuburbSuggestion | AgeSuggestion

export type SearchNavigatePayload = Suggestion | { type: 'search'; query: string }

const DEFAULT_ISSUE_SUGGESTIONS: IssueSuggestion[] = ISSUE_OPTIONS.slice(0, 3).map((issue) => ({
  type: 'issue',
  value: issue.value,
  label: issue.label
}))

const DEFAULT_AGE_SUGGESTIONS: AgeSuggestion[] = AGE_STAGE_OPTIONS.slice(0, 2).map((age) => ({
  type: 'age',
  value: age.value,
  label: age.label
}))

interface SearchAutocompleteProps {
  placeholder?: string
  defaultValue?: string
  className?: string
  inputClassName?: string
  onNavigate?: (payload: SearchNavigatePayload) => void
}

export function SearchAutocomplete({
  placeholder = 'Search trainers, issues, suburbs...',
  defaultValue = '',
  className = '',
  inputClassName = '',
  onNavigate
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    trainers: TrainerSuggestion[]
    issues: IssueSuggestion[]
    suburbs: SuburbSuggestion[]
    ages: AgeSuggestion[]
  }>({ trainers: [], issues: DEFAULT_ISSUE_SUGGESTIONS, suburbs: [], ages: DEFAULT_AGE_SUGGESTIONS })

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ trainers: [], issues: DEFAULT_ISSUE_SUGGESTIONS, suburbs: [], ages: DEFAULT_AGE_SUGGESTIONS })
      return
    }

    setLoading(true)
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current)

    fetchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/public/autocomplete?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Autocomplete failed')
        const data = await response.json()
        setSuggestions({
          trainers: (data.suggestions.trainers || []).map((trainer: any) => ({
            type: 'trainer',
            id: trainer.id,
            name: trainer.name
          })),
          issues: (data.suggestions.issues || []).map((issue: any) => ({
            type: 'issue',
            value: issue.value,
            label: issue.label
          })),
          suburbs: (data.suggestions.suburbs || []).map((suburb: any) => ({
            type: 'suburb',
            id: suburb.id,
            name: suburb.name,
            postcode: suburb.postcode,
            council_name: suburb.council_name,
            region: suburb.region
          })),
          ages: (data.suggestions.ages || []).map((age: any) => ({
            type: 'age',
            value: age.value,
            label: age.label
          }))
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [query])

  const navigateToSuggestion = (suggestion: Suggestion) => {
    if (onNavigate) {
      onNavigate(suggestion)
      setOpen(false)
      return
    }

    switch (suggestion.type) {
      case 'trainer':
        router.push(`/trainer/${suggestion.id}`)
        break
      case 'issue':
        router.push(`/search?issues=${suggestion.value}`)
        break
      case 'suburb': {
        const params = new URLSearchParams({
          suburbId: suggestion.id.toString(),
          suburbLabel: `${suggestion.name} (${suggestion.postcode}) • ${suggestion.council_name}`,
          distance: '0-5'
        })
        router.push(`/search?${params.toString()}`)
        break
      }
      case 'age':
        router.push(`/search?stage=${suggestion.value}`)
        break
    }
    setOpen(false)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (query.trim().length === 0) return
    if (onNavigate) {
      onNavigate({ type: 'search', query })
    } else {
      router.push(`/search?search=${encodeURIComponent(query)}`)
    }
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`input-field ${inputClassName}`}
        />
      </form>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
          )}
          {!loading && (
            <div className="divide-y">
              {suggestions.trainers.length > 0 && (
                <Section title="Trainers">
                  {suggestions.trainers.map((trainer) => (
                    <button
                      key={`trainer-${trainer.id}`}
                      type="button"
                      onClick={() => navigateToSuggestion(trainer)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      {trainer.name}
                    </button>
                  ))}
                </Section>
              )}
              {suggestions.suburbs.length > 0 && (
                <Section title="Suburbs">
                  {suggestions.suburbs.map((suburb) => (
                    <button
                      key={`suburb-${suburb.id}`}
                      type="button"
                      onClick={() => navigateToSuggestion(suburb)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <p className="font-semibold">{suburb.name} ({suburb.postcode})</p>
                      <p className="text-xs text-gray-500">{suburb.council_name} • {suburb.region}</p>
                    </button>
                  ))}
                </Section>
              )}
              {suggestions.issues.length > 0 && (
                <Section title="Behaviour focus">
                  {suggestions.issues.map((issue) => (
                    <button
                      key={`issue-${issue.value}`}
                      type="button"
                      onClick={() => navigateToSuggestion(issue)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      {issue.label}
                    </button>
                  ))}
                </Section>
              )}
              {suggestions.ages.length > 0 && (
                <Section title="Dog age / stage">
                  {suggestions.ages.map((age) => (
                    <button
                      key={`age-${age.value}`}
                      type="button"
                      onClick={() => navigateToSuggestion(age)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      {age.label}
                    </button>
                  ))}
                </Section>
              )}
              {suggestions.trainers.length === 0 &&
                suggestions.suburbs.length === 0 &&
                suggestions.issues.length === 0 &&
                suggestions.ages.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No matches found. Press Enter to search for “{query}”.</div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
