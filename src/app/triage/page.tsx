'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AGE_SPECIALTIES, AGE_SPECIALTY_LABELS, BEHAVIOR_ISSUES, BEHAVIOR_ISSUE_LABELS } from '@/lib/constants/taxonomies'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Callout'
import type { BehaviorIssue, AgeSpecialty } from '@/types/database'
import { TriageRequestSchema } from '@/lib/contracts'
import { EmergencyGate } from '@/components/triage/EmergencyGate'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import type { SuburbResult } from '@/lib/api'

// URL keys for step state
const STEP_PARAM = 'step'
const AGE_PARAM = 'age'
const ISSUES_PARAM = 'issues'
const SUBURB_ID_PARAM = 'suburbId'
const RADIUS_PARAM = 'radius'

// Steps per SSOT: age -> issues -> location -> review
const steps = ['age', 'issues', 'location', 'review'] as const

const mapRadiusToDistance = (radius: number) => {
  if (radius <= 5) return '0-5'
  if (radius <= 15) return '5-15'
  return 'greater'
}

const buildSituationSummary = (age: AgeSpecialty, issues: BehaviorIssue[]) => {
  const ageLabel = AGE_SPECIALTY_LABELS[age]
  const issueLabels = issues.map((issue) => BEHAVIOR_ISSUE_LABELS[issue])
  const issueText = issueLabels.length > 0 ? issueLabels.join(', ') : 'No specific behaviour issues'
  return `Dog age/stage: ${ageLabel}. Issues: ${issueText}.`
}

function TriageContent() {
  const router = useRouter()
  const params = useSearchParams()

  // URL-driven step
  const currentStep = useMemo(() => {
    const s = params.get(STEP_PARAM)
    return steps.includes((s as any)) ? (s as typeof steps[number]) : 'age'
  }, [params])

  // State from URL
  const [age, setAge] = useState<AgeSpecialty | null>(null)
  const [issues, setIssues] = useState<BehaviorIssue[]>([])
  const [suburbId, setSuburbId] = useState<number | null>(null)
  const [radius, setRadius] = useState<number>(15)
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmergencyGate, setShowEmergencyGate] = useState(false)

  // Initialize from URL on mount/param change
  useEffect(() => {
    const urlAge = params.get(AGE_PARAM) as AgeSpecialty | null
    if (urlAge && AGE_SPECIALTIES.includes(urlAge)) setAge(urlAge)

    const urlIssues = params.get(ISSUES_PARAM)
    if (urlIssues) {
      const parsed = urlIssues.split(',').filter(Boolean) as BehaviorIssue[]
      const valid = parsed.filter(v => BEHAVIOR_ISSUES.includes(v))
      setIssues(valid)
    }

    const urlSuburbId = params.get(SUBURB_ID_PARAM)
    if (urlSuburbId) setSuburbId(Number(urlSuburbId))

    const urlRadius = params.get(RADIUS_PARAM)
    if (urlRadius) setRadius(Math.min(50, Math.max(5, Number(urlRadius))))
  }, [params])

  // Helpers
  const updateParam = (key: string, value: string | number | null) => {
    const search = new URLSearchParams(params.toString())
    if (value === null || value === undefined || value === '') search.delete(key)
    else search.set(key, String(value))
    router.push(`/triage?${search.toString()}`)
  }

  const goToStep = (step: typeof steps[number]) => updateParam(STEP_PARAM, step)

  const toggleIssue = (issue: BehaviorIssue) => {
    const has = issues.includes(issue)
    const next = has ? issues.filter(i => i !== issue) : [...issues, issue]
    setIssues(next)
    updateParam(ISSUES_PARAM, next.join(','))
  }

  const handleContinueFromIssues = () => {
    // Show emergency gate if any of the selected issues suggest an emergency path
    const emergencySuggestions = ['dog_aggression', 'mouthing_nipping_biting', 'anxiety_general']
    const shouldShow = issues.some(i => emergencySuggestions.includes(i))
    if (shouldShow) {
      setShowEmergencyGate(true)
    } else {
      goToStep('location')
    }
  }

  const canContinueFromAge = !!age
  const canContinueFromIssues = true // optional
  const canContinueFromLocation = suburbId !== null && radius >= 5

  const submit = async () => {
    setError(null)
    if (!age || suburbId === null) {
      setError('Please complete all steps before submitting.')
      return
    }
    setSubmitting(true)
    try {
      // Validate request
      const payload = TriageRequestSchema.parse({ age, issues, suburbId, radius })

      if (!selectedSuburb) {
        setError('Please select a suburb from the list.')
        return
      }

      const triageResponse = await fetch('/api/emergency/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: buildSituationSummary(payload.age, payload.issues),
          location: `${selectedSuburb.name} ${selectedSuburb.postcode}`,
          age: payload.age,
          issues: payload.issues
        })
      })

      const triageData = await triageResponse.json()
      if (!triageResponse.ok) {
        throw new Error(triageData?.error || 'Triage classification failed')
      }

      const classification =
        triageData?.triage?.classification ??
        triageData?.classification?.classification ??
        'normal'

      if (classification && classification !== 'normal') {
        router.push(`/emergency?flow=${encodeURIComponent(classification)}`)
        return
      }

      const qs = new URLSearchParams()
      qs.set('age_specialties', payload.age)
      if (payload.issues.length > 0) qs.set('behavior_issues', payload.issues.join(','))
      qs.set('distance', mapRadiusToDistance(payload.radius))
      qs.set('lat', String(selectedSuburb.latitude))
      qs.set('lng', String(selectedSuburb.longitude))
      qs.set('suburbId', String(selectedSuburb.id))
      qs.set('suburbName', selectedSuburb.name)
      qs.set('postcode', selectedSuburb.postcode)
      qs.set('councilId', String(selectedSuburb.council_id))
      qs.set('flow_source', 'triage')

      router.push(`/search?${qs.toString()}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch results. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <LoadingSpinner size="md" />
                <div>
                  <p className="font-medium text-gray-900">Finding trainers...</p>
                  <p className="text-sm text-gray-500">Please wait a moment</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            {steps.map((s, idx) => (
              <li key={s} className="flex items-center">
                <button className={`underline-offset-2 ${currentStep === s ? 'font-semibold text-gray-900 underline' : 'text-blue-700 hover:underline'}`} onClick={() => goToStep(s)}>
                  {s === 'age' ? 'Age' : s === 'issues' ? 'Issues' : s === 'location' ? 'Location' : 'Review'}
                </button>
                {idx < steps.length - 1 && <span className="mx-2 text-gray-400">/</span>}
              </li>
            ))}
          </ol>
        </nav>

        {error && (
          <div className="mb-4">
            <Alert title="There was a problem">
              {error}
            </Alert>
          </div>
        )}

        {currentStep === 'age' && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Your dog’s age/stage</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AGE_SPECIALTIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAge(a); updateParam(AGE_PARAM, a) }}
                  className={`rounded-md border px-3 py-3 text-left ${age === a ? 'bg-blue-600 text-white border-transparent' : 'bg-gray-50 text-gray-800 border-gray-200'}`}
                >
                  <div className="font-medium">{AGE_SPECIALTY_LABELS[a]}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" disabled={!canContinueFromAge} onClick={() => goToStep('issues')}>Continue</Button>
            </div>
          </section>
        )}

        {currentStep === 'issues' && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Behaviour issues (optional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BEHAVIOR_ISSUES.map((issue) => (
                <button key={issue} type="button" onClick={() => toggleIssue(issue)}
                  className={`rounded-md border px-3 py-2 text-left ${issues.includes(issue) ? 'bg-blue-600 text-white border-transparent' : 'bg-gray-50 text-gray-800 border-gray-200'}`}
                >
                  {BEHAVIOR_ISSUE_LABELS[issue]}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => goToStep('age')}>Back</Button>
              <Button variant="primary" disabled={!canContinueFromIssues} onClick={handleContinueFromIssues}>Continue</Button>
            </div>
          </section>
        )}

        {currentStep === 'location' && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Your location</h2>
            <p className="text-gray-600 mb-3">Select your suburb and radius to find nearby trainers.</p>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Your suburb</label>
                <SuburbAutocomplete
                  value={selectedSuburb}
                  onChange={(suburb) => {
                    setSelectedSuburb(suburb)
                    const id = suburb ? suburb.id : null
                    setSuburbId(id)
                    updateParam(SUBURB_ID_PARAM, id ?? '')
                  }}
                  autoFocus={currentStep === 'location'}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Radius (km)</label>
                <input type="number" min={5} max={50} className="mt-1 w-full border rounded-md px-3 py-2" value={radius} onChange={(e) => { const v = Math.min(50, Math.max(5, Number(e.target.value))); setRadius(v); updateParam(RADIUS_PARAM, v) }} />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => goToStep('issues')}>Back</Button>
              <Button variant="primary" disabled={!canContinueFromLocation} onClick={() => goToStep('review')}>Continue</Button>
            </div>
          </section>
        )}

        {currentStep === 'review' && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Review your selections</h2>
            <ul className="text-sm text-gray-800 space-y-2">
              <li><span className="font-medium">Age:</span> {age ? AGE_SPECIALTY_LABELS[age] : 'Not set'}</li>
              <li><span className="font-medium">Issues:</span> {issues.length > 0 ? issues.map(i => BEHAVIOR_ISSUE_LABELS[i]).join(', ') : 'None'}</li>
              <li><span className="font-medium">Suburb:</span> {selectedSuburb ? `${selectedSuburb.name} (${selectedSuburb.postcode})` : 'Not set'}</li>
              <li><span className="font-medium">Radius:</span> {radius} km</li>
            </ul>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => goToStep('location')}>Back</Button>
              <Button variant="primary" onClick={submit} loading={submitting}>See matching trainers</Button>
            </div>
          </section>
        )}

        {/* Emergency gate overlay */}
        {showEmergencyGate && (
          <EmergencyGate
            selectedIssues={issues}
            onContinueNormal={() => { setShowEmergencyGate(false); goToStep('location') }}
            onEmergencyFlow={(type) => {
              setShowEmergencyGate(false)
              router.push(`/emergency?flow=${encodeURIComponent(type)}`)
            }}
            onClose={() => setShowEmergencyGate(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function TriagePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 text-sm text-gray-500">
          Loading triage experience...
        </div>
      }
    >
      <TriageContent />
    </Suspense>
  )
}
