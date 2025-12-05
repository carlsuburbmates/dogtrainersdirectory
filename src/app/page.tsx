'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiService, SuburbResult, TriageRequest } from '../lib/api'
import {
  AGE_STAGE_OPTIONS,
  DISTANCE_OPTIONS,
  FILTERS_SESSION_KEY,
  ISSUE_OPTIONS,
  RESULTS_SESSION_KEY,
  AgeStageValue,
  formatSuburbLabel,
  stageToSpecialties
} from '../lib/triage'
import { BehaviorIssue, DistanceFilter } from '../types/database'

export default function HomePage() {
  const router = useRouter()
  const [ageStage, setAgeStage] = useState<AgeStageValue>('2-6')
  const [includeRescue, setIncludeRescue] = useState(false)
  const [issues, setIssues] = useState<BehaviorIssue[]>([])
  const [suburbQuery, setSuburbQuery] = useState('')
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [distance, setDistance] = useState<DistanceFilter>('0-5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!selectedSuburb) {
      setDistance('greater')
    }
  }, [selectedSuburb])

  const selectedAgeOption = useMemo(() => AGE_STAGE_OPTIONS.find((option) => option.value === ageStage), [ageStage])

  const toggleIssue = (issue: BehaviorIssue) => {
    setIssues((prev) =>
      prev.includes(issue) ? prev.filter((value) => value !== issue) : [...prev, issue]
    )
  }

  const handleSuburbSelect = (suburb: SuburbResult) => {
    setSelectedSuburb(suburb)
    setSuburbQuery(`${suburb.name} (${suburb.postcode})`)
    setSuburbSuggestions([])
  }

  const buildQueryParams = (request: TriageRequest) => {
    const params = new URLSearchParams()
    params.set('stage', ageStage)
    if (includeRescue) params.set('rescue', '1')
    if (issues.length) params.set('issues', issues.join(','))
    if (selectedSuburb) {
      params.set('suburbId', String(selectedSuburb.id))
      params.set('suburbLabel', formatSuburbLabel(selectedSuburb))
    }
    if (request.distanceFilter) params.set('distance', request.distanceFilter)
    return params
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selectedAgeOption) {
      setError('Please tell us how old your dog is')
      return
    }

    const ageFilters = stageToSpecialties(ageStage) ?? undefined
    const request: TriageRequest = {
      ageFilters,
      includeRescue,
      issues: issues.length ? issues : undefined,
      suburbId: selectedSuburb?.id,
      distanceFilter: selectedSuburb ? distance : 'greater',
      limit: 100
    }

    setLoading(true)
    try {
      const trainers = await apiService.getTriageResults(request)
      sessionStorage.setItem(RESULTS_SESSION_KEY, JSON.stringify(trainers))
      sessionStorage.setItem(
        FILTERS_SESSION_KEY,
        JSON.stringify({
          stage: ageStage,
          includeRescue,
          issues,
          suburbId: selectedSuburb?.id ?? null,
          suburbLabel: selectedSuburb ? formatSuburbLabel(selectedSuburb) : null,
          distance: selectedSuburb ? distance : 'greater'
        })
      )

      const params = buildQueryParams(request)
      router.push(`/search?${params.toString()}`)
    } catch (err) {
      console.error(err)
      setError('Unable to fetch trainers right now. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <section className="grid gap-6 rounded-2xl bg-white p-8 shadow-sm md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Melbourne-wide coverage</p>
            <h1 className="text-4xl font-bold text-gray-900">Find a trusted dog trainer in minutes</h1>
            <p className="text-lg text-gray-600">
              Browse verified trainers across 28 Melbourne councils or publish your own services. No AI tricks—just real profiles on top of the locked dataset you approved.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/trainers" className="btn-primary">
                Find a trainer
              </Link>
              <Link href="/onboarding" className="btn-secondary">
                List your services
              </Link>
            </div>
          </div>
          <div className="self-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Emergency? Skip the search.</p>
            <p className="mt-2">
              Head to the dedicated <Link href="/emergency" className="font-semibold text-red-600">Emergency Help</Link> page for 24/7 vets, stray intake contacts, and crisis behaviour specialists. The emergency classifier logs every request for manual review—no AI decision-making required.
            </p>
          </div>
        </section>
        <div className="space-y-4">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold">Triage + results</p>
            <h2 className="text-3xl font-bold text-gray-900">Prefer guided matching? Answer a few quick questions.</h2>
            <p className="text-gray-600">
              Tell us about your dog and we&apos;ll filter the trainers automatically. Results still open on the `/trainers` page for anyone who wants to browse manually.
            </p>
          </header>

        <form onSubmit={handleSearch} className="space-y-8">
          <section className="card space-y-4">
            <p className="text-sm font-semibold text-gray-500">Step 1 · Dog&apos;s age / stage (required)</p>
            <div className="grid gap-3 md:grid-cols-2">
              {AGE_STAGE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    ageStage === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="ageStage"
                    className="sr-only"
                    value={option.value}
                    checked={ageStage === option.value}
                    onChange={() => setAgeStage(option.value)}
                  />
                  <p className="font-semibold text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </label>
              ))}
            </div>
          </section>

          <section className="card space-y-4">
            <p className="text-sm font-semibold text-gray-500">Step 2 · Rescue status (optional)</p>
            <label className="flex items-start space-x-3 text-gray-800">
              <input
                type="checkbox"
                checked={includeRescue}
                onChange={(event) => setIncludeRescue(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                My dog is a rescue / rehomed dog
                <span className="block text-sm text-gray-500">
                  We prioritise trainers who selected the dedicated rescue_dogs specialty but will still show others nearby.
                </span>
              </span>
            </label>
          </section>

          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Step 3 · Behaviour focus (optional)</p>
                <p className="text-sm text-gray-600">Tap as many as you like. Or browse all trainers if you&apos;re just exploring.</p>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 underline"
                onClick={() => setIssues([])}
              >
                Browse all trainers
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ISSUE_OPTIONS.map((option) => {
                const isSelected = issues.includes(option.value)
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => toggleIssue(option.value)}
                    className={`rounded-lg px-3 py-2 text-left text-sm border ${
                      isSelected ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="card space-y-4">
            <p className="text-sm font-semibold text-gray-500">Step 4 · Suburb (optional but recommended)</p>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="suburb">
                Where are you located?
              </label>
              <input
                id="suburb"
                value={suburbQuery}
                onChange={(event) => {
                  setSuburbQuery(event.target.value)
                  setSelectedSuburb(null)
                }}
                placeholder="Start typing a Melbourne suburb…"
                className="mt-2 w-full border rounded-md px-3 py-2"
              />
              {suburbSuggestions.length > 0 && (
                <ul className="border border-gray-200 rounded-md mt-2 bg-white max-h-60 overflow-y-auto divide-y">
                  {suburbSuggestions.map((suburb) => (
                    <li
                      key={suburb.id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSuburbSelect(suburb)}
                    >
                      <p className="font-semibold">{suburb.name} ({suburb.postcode})</p>
                      <p className="text-xs text-gray-500">{suburb.council_name} · {suburb.region}</p>
                    </li>
                  ))}
                </ul>
              )}
              {selectedSuburb && (
                <p className="text-xs text-green-600 mt-2">Location locked to {formatSuburbLabel(selectedSuburb)}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Distance filter</p>
              <div className="grid gap-3 md:grid-cols-3 mt-2">
                {DISTANCE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`border rounded-lg p-3 text-sm cursor-pointer ${
                      distance === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    } ${!selectedSuburb && option.value !== 'greater' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="distance"
                      value={option.value}
                      className="sr-only"
                      disabled={!selectedSuburb && option.value !== 'greater'}
                      checked={distance === option.value}
                      onChange={() => setDistance(option.value)}
                    />
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3 rounded-md text-white font-semibold" disabled={loading}>
            {loading ? 'Finding trainers…' : 'Search trainers'}
          </button>
        </form>
        </div>
      </div>
    </main>
  )
}
