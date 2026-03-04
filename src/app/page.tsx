'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import type { SuburbResult } from '@/lib/api'
import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS
} from '@/lib/constants/taxonomies'
import type { AgeSpecialty, BehaviorIssue } from '@/types/database'

const ageOptions = AGE_SPECIALTIES.map((value) => ({
  value,
  label: AGE_SPECIALTY_LABELS[value]
}))

const issueOptions = BEHAVIOR_ISSUES.map((value) => ({
  value,
  label: BEHAVIOR_ISSUE_LABELS[value]
}))

const reassurancePoints = [
  'Guided triage when you are not sure what help fits.',
  'Suburb-based matching for practical Melbourne comparisons.',
  'Fast access to urgent support when the situation cannot wait.'
]

const quickRoutes = [
  { href: '/triage', label: 'Need guidance? Start triage' },
  { href: '/directory', label: 'Prefer browsing? Open the directory' },
  { href: '/emergency', label: 'Need urgent help? Emergency support' }
]

const mapRadiusToDistance = (radius: number) => {
  if (radius <= 5) return '0-5'
  if (radius <= 15) return '5-15'
  return 'greater'
}

export default function HomePage() {
  const router = useRouter()
  const [age, setAge] = useState<AgeSpecialty>(ageOptions[0].value)
  const [issues, setIssues] = useState<BehaviorIssue[]>([])
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(15)

  const handleIssueToggle = (issue: BehaviorIssue) => {
    setIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selectedSuburb) {
      setError('Select a suburb from the suggestion list before continuing.')
      return
    }

    const qs = new URLSearchParams()
    qs.set('age_specialties', age)
    if (issues.length > 0) qs.set('behavior_issues', issues.join(','))
    qs.set('distance', mapRadiusToDistance(radius))
    qs.set('lat', String(selectedSuburb.latitude))
    qs.set('lng', String(selectedSuburb.longitude))
    qs.set('suburbId', String(selectedSuburb.id))
    qs.set('suburbName', selectedSuburb.name)
    qs.set('postcode', selectedSuburb.postcode)
    qs.set('councilId', String(selectedSuburb.council_id))

    router.push(`/search?${qs.toString()}`)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_28%),linear-gradient(180deg,#f7fafc_0%,#eef4ff_42%,#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.22),_transparent_34%)]" />
              <div className="relative">
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                    Local Melbourne support
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    Guided trainer matching
                  </span>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                    Urgent help when needed
                  </span>
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">
                  Find the right Melbourne dog trainer without guessing first.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Start with your dog&apos;s stage, suburb, and key behaviour needs to build a
                  sharper shortlist from the start.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {reassurancePoints.map((point) => (
                    <div
                      key={point}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-100"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Other ways in
                  </p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
                    {quickRoutes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className="inline-flex items-center gap-2 transition-colors hover:text-white"
                      >
                        <span>{route.label}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Find your shortlist
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Start with the essentials
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Best for
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    first-time comparisons
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="age">
                    Dog&apos;s age or stage
                  </label>
                  <select
                    id="age"
                    value={age}
                    onChange={(event) => setAge(event.target.value as AgeSpecialty)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {ageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-800">
                      Behaviour issues (optional)
                    </label>
                    <span className="text-xs text-slate-500">
                      Pick the most important concerns
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {issueOptions.map((option) => {
                      const selected = issues.includes(option.value)
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleIssueToggle(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            selected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="suburb">
                    Suburb
                  </label>
                  <div className="mt-2">
                    <SuburbAutocomplete value={selectedSuburb} onChange={setSelectedSuburb} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500">
                      Select a real suburb so distance filtering stays accurate.
                    </span>
                    {selectedSuburb && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                        {selectedSuburb.name} selected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="radius">
                      Search radius
                    </label>
                    <span className="text-sm font-semibold text-slate-700">{radius} km</span>
                  </div>
                  <input
                    id="radius"
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={radius}
                    onChange={(event) => setRadius(Number(event.target.value))}
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-700"
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>Local</span>
                    <span>Broader Melbourne</span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button type="submit" size="lg" className="w-full justify-center">
                    Find trainers
                  </Button>
                  <p className="text-center text-xs leading-5 text-slate-500">
                    Your shortlist opens with your suburb, distance, and key needs already applied.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
