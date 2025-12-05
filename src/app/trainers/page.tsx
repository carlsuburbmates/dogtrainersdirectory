'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiService, SearchResult, SuburbResult, TriageRequest } from '@/lib/api'
import {
  AGE_STAGE_OPTIONS,
  ISSUE_OPTIONS,
  AgeStageValue,
  stageToSpecialties,
  formatSuburbLabel
} from '@/lib/triage'
import { BehaviorIssue, DistanceFilter, ServiceType } from '@/types/database'

const SERVICE_OPTIONS: { value: ServiceType | ''; label: string }[] = [
  { value: '', label: 'Any service' },
  { value: 'puppy_training', label: 'Puppy training' },
  { value: 'obedience_training', label: 'Obedience training' },
  { value: 'behaviour_consultations', label: 'Behaviour consultations' },
  { value: 'group_classes', label: 'Group classes' },
  { value: 'private_training', label: 'Private training' }
]

const DISTANCE_CHOICES: { value: DistanceFilter; label: string }[] = [
  { value: '0-5', label: '0–5 km' },
  { value: '5-15', label: '5–15 km' },
  { value: 'greater', label: 'Greater Melbourne' }
]

export default function TrainersPage() {
  const [suburbQuery, setSuburbQuery] = useState('')
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [ageStage, setAgeStage] = useState<AgeStageValue>('2-6')
  const [issues, setIssues] = useState<BehaviorIssue[]>([])
  const [serviceType, setServiceType] = useState<ServiceType | ''>('')
  const [distance, setDistance] = useState<DistanceFilter>('0-5')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (suburbQuery.trim().length < 2) {
      setSuburbSuggestions([])
      return
    }

    let isCurrent = true
    apiService
      .searchSuburbs(suburbQuery.trim())
      .then((items) => {
        if (isCurrent) setSuburbSuggestions(items)
      })
      .catch(() => {
        if (isCurrent) setSuburbSuggestions([])
      })

    return () => {
      isCurrent = false
    }
  }, [suburbQuery])

  const selectedAgeOption = useMemo(() => AGE_STAGE_OPTIONS.find((item) => item.value === ageStage), [ageStage])

  const toggleIssue = (issue: BehaviorIssue) => {
    setIssues((prev) => (prev.includes(issue) ? prev.filter((value) => value !== issue) : [...prev, issue]))
  }

  const resetResultsIfEmpty = () => {
    setResults([])
    setHasSearched(false)
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedSuburb) {
      setError('Select a suburb to find trainers nearby.')
      resetResultsIfEmpty()
      return
    }
    setError(null)
    setLoading(true)
    try {
      const request: TriageRequest = {
        ageFilters: stageToSpecialties(ageStage) ?? undefined,
        issues: issues.length ? issues : undefined,
        suburbId: selectedSuburb.id,
        distanceFilter: distance,
        serviceType: serviceType || undefined,
        verifiedOnly: true,
        limit: 100
      }
      const data = await apiService.getTriageResults(request)
      setResults(data)
      setHasSearched(true)
    } catch (err) {
      console.error(err)
      setError('Unable to load trainers right now. Please try again in a moment.')
      resetResultsIfEmpty()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Browse directory</p>
          <h1 className="text-4xl font-bold text-gray-900">Browse verified trainers across Melbourne</h1>
          <p className="text-gray-600">
            Choose your suburb and focus areas. Results pull directly from Supabase—no AI or inferred content.
          </p>
        </header>
        <form onSubmit={handleSearch} className="card space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Suburb*</label>
            <input
              type="text"
              value={suburbQuery}
              onChange={(event) => {
                setSuburbQuery(event.target.value)
                setSelectedSuburb(null)
              }}
              placeholder="Start typing..."
              className="input-field"
            />
            {suburbSuggestions.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white">
                {suburbSuggestions.map((suburb) => (
                  <button
                    key={suburb.id}
                    type="button"
                    onClick={() => {
                      setSelectedSuburb(suburb)
                      setSuburbQuery(formatSuburbLabel(suburb))
                      setSuburbSuggestions([])
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {formatSuburbLabel(suburb)}
                  </button>
                ))}
              </div>
            )}
            {selectedSuburb && (
              <p className="text-xs text-gray-500">Searching near {selectedSuburb.name}. Change above to adjust.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-700">Dog age / stage</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {AGE_STAGE_OPTIONS.map((option) => (
                  <label key={option.value} className={`rounded-lg border p-3 text-sm ${ageStage === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="ageStage"
                      className="sr-only"
                      value={option.value}
                      checked={ageStage === option.value}
                      onChange={() => setAgeStage(option.value)}
                    />
                    <span className="font-semibold text-gray-900">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Service type</label>
              <select
                className="input-field mt-2"
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value as ServiceType | '')}
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-sm font-semibold text-gray-700">Distance</label>
              <select className="input-field mt-2" value={distance} onChange={(event) => setDistance(event.target.value as DistanceFilter)}>
                {DISTANCE_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Behaviour focus (optional)</label>
              {issues.length > 0 && (
                <button type="button" className="text-xs text-blue-600" onClick={() => setIssues([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ISSUE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => toggleIssue(option.value)}
                  className={`rounded-lg border px-4 py-2 text-left text-sm ${issues.includes(option.value) ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-200 text-gray-700'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search trainers'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!selectedSuburb && <p className="text-sm text-gray-500">Select a suburb to enable search.</p>}
          </div>
        </form>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Results</h2>
            {selectedSuburb && (
              <p className="text-sm text-gray-500">Showing trainers near {selectedSuburb.name}</p>
            )}
          </div>
          {!hasSearched && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
              Start by choosing a suburb and tapping “Search trainers”.
            </div>
          )}
          {hasSearched && results.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
              No trainers matched those filters. Try widening the distance range or removing some behaviour filters.
            </div>
          )}
          <div className="grid gap-4">
            {results.map((trainer) => (
              <article key={trainer.business_id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{trainer.business_name}</h3>
                    <p className="text-sm text-gray-600">{trainer.suburb_name} · {trainer.region}</p>
                  </div>
                  <Link href={`/trainers/${trainer.business_id}`} className="btn-secondary self-start md:self-auto">
                    View profile
                  </Link>
                </div>
                <p className="mt-2 text-sm text-gray-700">{trainer.business_bio || 'Profile details coming soon.'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trainer.behavior_issues.slice(0, 3).map((issue) => (
                    <span key={`${trainer.business_id}-issue-${issue}`} className="badge badge-orange">
                      {issue.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {trainer.services.slice(0, 2).map((service) => (
                    <span key={`${trainer.business_id}-service-${service}`} className="badge badge-purple">
                      {service.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
