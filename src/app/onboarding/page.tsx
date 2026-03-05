'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import type { SuburbResult } from '@/lib/api'
import {
  onboardingSteps,
  type OnboardingStepKey,
  validateOnboardingStep
} from '@/lib/onboardingFlow'
import type { AgeSpecialty, BehaviorIssue } from '@/types/database'

const ageOptions: { value: AgeSpecialty; label: string }[] = [
  { value: 'puppies_0_6m', label: 'Puppies (0–6 months)' },
  { value: 'adolescent_6_18m', label: 'Adolescent (6–18 months)' },
  { value: 'adult_18m_7y', label: 'Adult (18 months–7 years)' },
  { value: 'senior_7y_plus', label: 'Senior (7+ years)' },
  { value: 'rescue_dogs', label: 'Rescue/Rehomed' }
]

const issueOptions: { value: BehaviorIssue; label: string }[] = [
  { value: 'pulling_on_lead', label: 'Pulling on the lead' },
  { value: 'separation_anxiety', label: 'Separation anxiety' },
  { value: 'excessive_barking', label: 'Excessive barking' },
  { value: 'dog_aggression', label: 'Dog aggression' },
  { value: 'leash_reactivity', label: 'Leash reactivity' },
  { value: 'jumping_up', label: 'Jumping up' },
  { value: 'destructive_behaviour', label: 'Destructive behaviour' },
  { value: 'recall_issues', label: 'Recall issues' },
  { value: 'anxiety_general', label: 'General anxiety' },
  { value: 'resource_guarding', label: 'Resource guarding' },
  { value: 'mouthing_nipping_biting', label: 'Mouthing/nipping/biting' },
  { value: 'rescue_dog_support', label: 'Rescue dog support' },
  { value: 'socialisation', label: 'Socialisation' }
]

const serviceOptions = [
  'puppy_training',
  'obedience_training',
  'behaviour_consultations',
  'group_classes',
  'private_training'
]

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const stepIndexByKey = new Map<OnboardingStepKey, number>(
  onboardingSteps.map((step, index) => [step.key, index])
)

export default function OnboardingPage() {
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    address: '',
    suburbId: 0,
    bio: '',
    pricing: '',
    ages: [] as AgeSpecialty[],
    issues: [] as BehaviorIssue[],
    primaryService: 'puppy_training',
    secondaryServices: [] as string[],
    abn: ''
  })

  const currentStep = onboardingSteps[currentStepIndex]
  const isFinalStep = currentStep.key === 'review'

  const selectedAgeLabels = useMemo(
    () => ageOptions.filter((option) => form.ages.includes(option.value)).map((option) => option.label),
    [form.ages]
  )
  const selectedIssueLabels = useMemo(
    () => issueOptions.filter((option) => form.issues.includes(option.value)).map((option) => option.label),
    [form.issues]
  )

  const handleToggleAge = (value: AgeSpecialty) => {
    setForm((prev) => ({
      ...prev,
      ages: prev.ages.includes(value)
        ? prev.ages.filter((item) => item !== value)
        : [...prev.ages, value]
    }))
  }

  const handleToggleIssue = (value: BehaviorIssue) => {
    setForm((prev) => ({
      ...prev,
      issues: prev.issues.includes(value)
        ? prev.issues.filter((item) => item !== value)
        : [...prev.issues, value]
    }))
  }

  const handleSecondaryService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      secondaryServices: prev.secondaryServices.includes(service)
        ? prev.secondaryServices.filter((item) => item !== service)
        : [...prev.secondaryServices, service]
    }))
  }

  const handleGoToStep = (stepKey: OnboardingStepKey) => {
    const targetIndex = stepIndexByKey.get(stepKey)
    if (targetIndex === undefined || targetIndex > currentStepIndex) return
    setStepError(null)
    setCurrentStepIndex(targetIndex)
  }

  const handleNextStep = () => {
    const validationError = validateOnboardingStep(currentStep.key, form)
    if (validationError) {
      setStepError(validationError)
      return
    }

    setStepError(null)
    setCurrentStepIndex((prev) => Math.min(prev + 1, onboardingSteps.length - 1))
  }

  const handleBackStep = () => {
    setStepError(null)
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setMessage(null)
    setStepError(null)

    const requiredSteps: OnboardingStepKey[] = ['account', 'business', 'services']
    for (const step of requiredSteps) {
      const validationError = validateOnboardingStep(step, form)
      if (validationError) {
        setStepError(validationError)
        const index = stepIndexByKey.get(step) ?? 0
        setCurrentStepIndex(index)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          businessName: form.businessName,
          businessPhone: form.businessPhone,
          businessEmail: form.businessEmail,
          website: form.website,
          address: form.address,
          suburbId: form.suburbId,
          bio: form.bio,
          pricing: form.pricing,
          ages: form.ages,
          issues: form.issues,
          primaryService: form.primaryService,
          secondaryServices: form.secondaryServices,
          abn: form.abn
        })
      })
      const payload = await response.json()
      if (!response.ok) {
        setMessage(payload.error || 'Failed to onboard. Please try again.')
        return
      }
      setMessage('Onboarding complete! Check your inbox to confirm your account.')
      setForm((prev) => ({ ...prev, password: '' }))
    } catch (error) {
      console.error(error)
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isFinalStep) {
      await handleSubmit()
      return
    }
    handleNextStep()
  }

  return (
    <main className="public-page-shell px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="shell-surface p-6">
          <h1 className="text-3xl font-semibold text-slate-950">Trainer onboarding</h1>
          <p className="mt-2 text-slate-600">
            Work through each step to create your account and publish your listing details.
          </p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {onboardingSteps.map((step, index) => {
              const isCurrent = index === currentStepIndex
              const isComplete = index < currentStepIndex
              return (
                <li key={step.key}>
                  <button
                    type="button"
                    onClick={() => handleGoToStep(step.key)}
                    disabled={index > currentStepIndex}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isComplete
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                    } disabled:cursor-not-allowed disabled:opacity-80`}
                  >
                    <span className="font-semibold">{step.label}</span>
                    <span className="text-xs">{isComplete ? 'Done' : `Step ${index + 1}`}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current step
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">{currentStep.label}</p>
            <p className="mt-1 text-sm text-slate-600">{currentStep.helper}</p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleFormSubmit}>
            {currentStep.key === 'account' && (
              <>
                <div>
                  <label className="text-sm font-semibold">Account email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <input
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="input-field mt-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Full name</label>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
              </>
            )}

            {currentStep.key === 'business' && (
              <>
                <div>
                  <label className="text-sm font-semibold">Business name</label>
                  <input
                    value={form.businessName}
                    onChange={(event) => setForm({ ...form, businessName: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Phone</label>
                    <input
                      value={form.businessPhone}
                      onChange={(event) => setForm({ ...form, businessPhone: event.target.value })}
                      className="input-field mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Business email</label>
                    <input
                      value={form.businessEmail}
                      onChange={(event) => setForm({ ...form, businessEmail: event.target.value })}
                      className="input-field mt-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Website (optional)</label>
                  <input
                    value={form.website}
                    onChange={(event) => setForm({ ...form, website: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Address</label>
                  <input
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Suburb</label>
                  <div className="mt-2">
                    <SuburbAutocomplete
                      value={selectedSuburb}
                      onChange={(suburb) => {
                        setSelectedSuburb(suburb)
                        setForm((prev) => ({ ...prev, suburbId: suburb?.id ?? 0 }))
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Select a suburb to attach your listing to the correct council and region.
                  </p>
                  {selectedSuburb && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Selected: {selectedSuburb.name} ({selectedSuburb.postcode})
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold">ABN</label>
                  <input
                    value={form.abn}
                    onChange={(event) => setForm({ ...form, abn: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
              </>
            )}

            {currentStep.key === 'services' && (
              <>
                <div>
                  <label className="text-sm font-semibold">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })}
                    className="input-field mt-2 min-h-[90px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Pricing (optional)</label>
                  <input
                    value={form.pricing}
                    onChange={(event) => setForm({ ...form, pricing: event.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Age specialties (min 1)</label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ageOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => handleToggleAge(option.value)}
                        className={`min-h-[44px] rounded-md border px-3 py-2 text-left text-sm ${
                          form.ages.includes(option.value)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Behaviour issues (optional)</label>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {issueOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => handleToggleIssue(option.value)}
                        className={`min-h-[44px] rounded-md border px-3 py-2 text-left text-sm ${
                          form.issues.includes(option.value)
                            ? 'border-orange-600 bg-orange-600 text-white'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Primary service type</label>
                  <select
                    value={form.primaryService}
                    onChange={(event) => setForm({ ...form, primaryService: event.target.value })}
                    className="input-field mt-2 min-h-[44px]"
                  >
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {formatLabel(service)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Additional service types</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleSecondaryService(service)}
                        className={`min-h-[44px] rounded-full border px-3 py-1 text-xs ${
                          form.secondaryServices.includes(service)
                            ? 'border-violet-600 bg-violet-600 text-white'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {formatLabel(service)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep.key === 'review' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">Review your details</h2>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-700">Account email</dt>
                      <dd className="text-slate-600">{form.email || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Business name</dt>
                      <dd className="text-slate-600">{form.businessName || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">ABN</dt>
                      <dd className="text-slate-600">{form.abn || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Suburb</dt>
                      <dd className="text-slate-600">
                        {selectedSuburb
                          ? `${selectedSuburb.name} (${selectedSuburb.postcode})`
                          : 'Not selected'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-700">Age specialties</dt>
                      <dd className="text-slate-600">
                        {selectedAgeLabels.length > 0 ? selectedAgeLabels.join(', ') : 'None selected'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-700">Behaviour issues</dt>
                      <dd className="text-slate-600">
                        {selectedIssueLabels.length > 0 ? selectedIssueLabels.join(', ') : 'None selected'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <p className="text-sm text-slate-600">
                  Submit to create your account and send your listing for verification before it goes live.
                </p>
              </div>
            )}

            {stepError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {stepError}
              </div>
            )}

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  message.includes('complete')
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {currentStepIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleBackStep}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
              )}

              {!isFinalStep && (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="min-h-[44px]"
                >
                  Continue
                </Button>
              )}

              {isFinalStep && (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="min-h-[44px]"
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Submit onboarding'}
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
