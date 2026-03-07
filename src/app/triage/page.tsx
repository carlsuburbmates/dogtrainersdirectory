'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AGE_SPECIALTIES, AGE_SPECIALTY_LABELS, BEHAVIOR_ISSUES, BEHAVIOR_ISSUE_LABELS } from '@/lib/constants/taxonomies'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import type { BehaviorIssue, AgeSpecialty } from '@/types/database'
import { TriageRequestSchema } from '@/lib/contracts'
import { EmergencyGate } from '@/components/triage/EmergencyGate'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import { apiService, type SuburbResult } from '@/lib/api'
import { hasEmergencyEscalation } from '@/lib/triageEmergency'
import {
  parseCanonicalSuburbId,
  rehydrateTriageLocation
} from '@/lib/triageLocation'
import { buildTriageSearchHandoffParams } from '@/lib/triageSearchHandoff'
import {
  Badge,
  Capsule,
  Card,
  Chip,
  Divider,
  Field,
  StateCard
} from '@/components/ui/primitives'

// URL keys for step state
const STEP_PARAM = 'step'
const AGE_PARAM = 'age'
const ISSUES_PARAM = 'issues'
const SUBURB_ID_PARAM = 'suburbId'
const RADIUS_PARAM = 'radius'

// Steps per SSOT: age -> issues -> location -> review
const steps = ['age', 'issues', 'location', 'review'] as const

const stepLabels: Record<(typeof steps)[number], string> = {
  age: 'Age',
  issues: 'Issues',
  location: 'Location',
  review: 'Review'
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
  const urlSuburbId = params.get(SUBURB_ID_PARAM)

  // Initialize from URL on mount/param change
  useEffect(() => {
    const urlAge = params.get(AGE_PARAM) as AgeSpecialty | null
    if (urlAge && AGE_SPECIALTIES.includes(urlAge)) setAge(urlAge)

    const urlIssues = params.get(ISSUES_PARAM)
    if (urlIssues) {
      const parsed = urlIssues.split(',').filter(Boolean) as BehaviorIssue[]
      const valid = parsed.filter((value) => BEHAVIOR_ISSUES.includes(value))
      setIssues(valid)
    }

    const urlRadius = params.get(RADIUS_PARAM)
    if (urlRadius) setRadius(Math.min(50, Math.max(5, Number(urlRadius))))
  }, [params])

  useEffect(() => {
    let isCurrent = true

    const syncSelectedSuburb = async () => {
      const canonicalSuburbId = parseCanonicalSuburbId(urlSuburbId)

      if (canonicalSuburbId === null) {
        if (isCurrent) {
          setSuburbId(null)
          setSelectedSuburb(null)
        }
        return
      }

      if (isCurrent) {
        setSuburbId(canonicalSuburbId)
        setSelectedSuburb((current) =>
          current?.id === canonicalSuburbId ? current : null
        )
      }

      try {
        const locationState = await rehydrateTriageLocation(
          urlSuburbId,
          apiService.getSuburbById
        )

        if (isCurrent) {
          setSuburbId(locationState.suburbId)
          setSelectedSuburb(locationState.selectedSuburb)
        }
      } catch {
        if (isCurrent) {
          setSuburbId(canonicalSuburbId)
          setSelectedSuburb(null)
        }
      }
    }

    syncSelectedSuburb()

    return () => {
      isCurrent = false
    }
  }, [urlSuburbId])

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
    const next = has ? issues.filter((item) => item !== issue) : [...issues, issue]
    setIssues(next)
    updateParam(ISSUES_PARAM, next.join(','))
  }

  const handleContinueFromIssues = () => {
    if (hasEmergencyEscalation(issues)) {
      setShowEmergencyGate(true)
    } else {
      goToStep('location')
    }
  }

  const canContinueFromAge = !!age
  const canContinueFromIssues = true // optional
  const canContinueFromLocation = selectedSuburb !== null && radius >= 5

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

      const qs = buildTriageSearchHandoffParams({
        age: payload.age,
        issues: payload.issues,
        radius: payload.radius,
        suburb: selectedSuburb
      })

      router.push(`/search?${qs.toString()}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch results. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="public-page-shell">
      <div className="shell-container py-8 sm:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {submitting ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
              <Card className="w-[min(92vw,28rem)]">
                <div className="flex items-center space-x-4">
                  <LoadingSpinner size="md" />
                  <div>
                    <p className="font-medium text-gray-900">Finding trainers...</p>
                    <p className="text-sm text-gray-500">Please wait a moment</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          <Capsule
            kicker="Guided triage"
            title="Tell us what your dog needs"
            actions={<Badge className="normal-case tracking-[0.04em]">Step {steps.indexOf(currentStep) + 1} of {steps.length}</Badge>}
          >
            <nav className="mt-2" aria-label="Triage steps">
              <ol className="flex flex-wrap items-center gap-2">
                {steps.map((step, idx) => (
                  <React.Fragment key={step}>
                    <li>
                      <Button
                        variant={currentStep === step ? 'primary' : 'ghost'}
                        size="sm"
                        className="min-h-[44px]"
                        onClick={() => goToStep(step)}
                      >
                        {stepLabels[step]}
                      </Button>
                    </li>
                    {idx < steps.length - 1 ? (
                      <li aria-hidden="true" className="text-[hsl(var(--ds-text-muted))]">/</li>
                    ) : null}
                  </React.Fragment>
                ))}
              </ol>
            </nav>
          </Capsule>

          {error ? (
            <StateCard
              title="There was a problem"
              description={error}
              tone="error"
              align="left"
            />
          ) : null}

          {currentStep === 'age' ? (
            <Card as="section">
              <h1 className="text-2xl font-bold mb-4">Your dog’s age or stage</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AGE_SPECIALTIES.map((option) => (
                  <Chip
                    key={option}
                    onClick={() => {
                      setAge(option)
                      updateParam(AGE_PARAM, option)
                    }}
                    selected={age === option}
                    tone="neutral"
                    className="w-full justify-start rounded-xl px-4 py-3 text-left text-sm"
                  >
                    {AGE_SPECIALTY_LABELS[option]}
                  </Chip>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  disabled={!canContinueFromAge}
                  onClick={() => goToStep('issues')}
                  className="min-h-[44px]"
                >
                  Continue
                </Button>
              </div>
            </Card>
          ) : null}

          {currentStep === 'issues' ? (
            <Card as="section">
              <h2 className="text-2xl font-bold mb-2">Behaviour issues (optional)</h2>
              <p className="text-sm text-[hsl(var(--ds-text-secondary))] mb-4">
                Choose any behaviour concerns you want to prioritise.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BEHAVIOR_ISSUES.map((issue) => (
                  <Chip
                    key={issue}
                    onClick={() => toggleIssue(issue)}
                    selected={issues.includes(issue)}
                    tone="info"
                    className="w-full justify-start rounded-xl px-4 py-3 text-left text-sm"
                  >
                    {BEHAVIOR_ISSUE_LABELS[issue]}
                  </Chip>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => goToStep('age')} className="min-h-[44px]">
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!canContinueFromIssues}
                  onClick={handleContinueFromIssues}
                  className="min-h-[44px]"
                >
                  Continue
                </Button>
              </div>
            </Card>
          ) : null}

          {currentStep === 'location' ? (
            <Card as="section">
              <h2 className="text-2xl font-bold mb-2">Your location</h2>
              <p className="text-[hsl(var(--ds-text-secondary))] mb-4">
                Select your suburb and radius to find nearby trainers.
              </p>
              <div className="grid gap-4">
                <Field label="Your suburb">
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
                </Field>
                <Field label="Radius (km)">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={radius}
                    onChange={(e) => {
                      const value = Math.min(50, Math.max(5, Number(e.target.value)))
                      setRadius(value)
                      updateParam(RADIUS_PARAM, value)
                    }}
                  />
                </Field>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => goToStep('issues')} className="min-h-[44px]">
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!canContinueFromLocation}
                  onClick={() => goToStep('review')}
                  className="min-h-[44px]"
                >
                  Continue
                </Button>
              </div>
            </Card>
          ) : null}

          {currentStep === 'review' ? (
            <Card as="section">
              <h2 className="text-2xl font-bold mb-4">Review your selections</h2>
              <Card tone="muted" padding="sm">
                <ul className="text-sm text-gray-800 space-y-2">
                  <li><span className="font-medium">Age:</span> {age ? AGE_SPECIALTY_LABELS[age] : 'Not set'}</li>
                  <li><span className="font-medium">Issues:</span> {issues.length > 0 ? issues.map((issue) => BEHAVIOR_ISSUE_LABELS[issue]).join(', ') : 'None'}</li>
                  <li><span className="font-medium">Suburb:</span> {selectedSuburb ? `${selectedSuburb.name} (${selectedSuburb.postcode})` : 'Not set'}</li>
                  <li><span className="font-medium">Radius:</span> {radius} km</li>
                </ul>
              </Card>
              <Divider className="my-5" />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => goToStep('location')} className="min-h-[44px]">
                  Back
                </Button>
                <Button variant="primary" onClick={submit} loading={submitting} className="min-h-[44px]">
                  See matching trainers
                </Button>
              </div>
            </Card>
          ) : null}

          {showEmergencyGate ? (
            <EmergencyGate
              selectedIssues={issues}
              onContinueNormal={() => {
                setShowEmergencyGate(false)
                goToStep('location')
              }}
              onEmergencyFlow={(type) => {
                setShowEmergencyGate(false)
                router.push(`/emergency?flow=${encodeURIComponent(type)}`)
              }}
              onClose={() => setShowEmergencyGate(false)}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default function TriagePage() {
  return (
    <Suspense
      fallback={
        <div className="public-page-shell shell-container py-8 text-sm text-gray-500">
          Loading triage experience...
        </div>
      }
    >
      <TriageContent />
    </Suspense>
  )
}
