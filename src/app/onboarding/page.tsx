'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiService, SuburbResult } from '@/lib/api'
import { AgeSpecialty, BehaviorIssue } from '@/types/database'

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

export default function OnboardingPage() {
  const steps = [
    { title: 'Account', description: 'Create your trainer login' },
    { title: 'Business details', description: 'Business contact, address, and suburb' },
    { title: 'Age specialties', description: 'Select the dog life stages you serve' },
    { title: 'Service types', description: 'Choose primary and secondary services' },
    { title: 'Behaviour focus', description: 'Highlight the issues you solve' },
    { title: 'Bio, pricing & ABN', description: 'Tell us about your practice and verify your ABN' }
  ]

  const [currentStep, setCurrentStep] = useState(0)
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    address: '',
    suburbQuery: '',
    suburbId: 0,
    bio: '',
    pricing: '',
    ages: ageOptions.map((option) => option.value as AgeSpecialty),
    issues: [] as BehaviorIssue[],
    primaryService: 'puppy_training',
    secondaryServices: [] as string[],
    abn: ''
  })

  useEffect(() => {
    if (form.suburbQuery.trim().length < 2) {
      setSuburbSuggestions([])
      return
    }

    let isCurrent = true
    apiService
      .searchSuburbs(form.suburbQuery.trim())
      .then((results) => {
        if (isCurrent) setSuburbSuggestions(results)
      })
      .catch(() => {
        if (isCurrent) setSuburbSuggestions([])
      })

    return () => {
      isCurrent = false
    }
  }, [form.suburbQuery])

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

  const handleSuburbSelect = (suburb: SuburbResult) => {
    setForm((prev) => ({
      ...prev,
      suburbQuery: `${suburb.name} (${suburb.postcode})`,
      suburbId: suburb.id
    }))
    setSuburbSuggestions([])
  }

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!form.email || !form.password || !form.fullName) return 'Please complete all account fields.'
        if (form.password.length < 8) return 'Password must be at least 8 characters.'
        if (form.password !== form.confirmPassword) return 'Passwords do not match.'
        return null
      case 1:
        if (!form.businessName || !form.suburbId) return 'Business name and suburb are required.'
        return null
      case 2:
        if (form.ages.length === 0) return 'Select at least one age group.'
        return null
      case 3:
        if (!form.primaryService) return 'Choose a primary service.'
        return null
      case 5:
        if (!form.abn) return 'Enter your ABN before submitting.'
        return null
      default:
        return null
    }
  }

  const handleNext = () => {
    const error = validateStep(currentStep)
    if (error) {
      setMessage({ type: 'error', text: error })
      return
    }
    setMessage(null)
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setMessage(null)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    const error = validateStep(currentStep)
    if (error) {
      setMessage({ type: 'error', text: error })
      return
    }
    setLoading(true)
    setMessage(null)
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
        setMessage({ type: 'error', text: payload.error || 'Failed to onboard. Please try again.' })
        return
      }
      setMessage({
        type: 'success',
        text: 'Onboarding complete! Check your inbox for the verification email (valid for 24 hours).'
      })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  const completedSteps = useMemo(() => currentStep, [currentStep])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Account email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="input-field mt-2"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Password</label>
                <input
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="input-field mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  className="input-field mt-2"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Full name</label>
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="input-field mt-2"
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Business name</label>
              <input
                value={form.businessName}
                onChange={(event) => setForm({ ...form, businessName: event.target.value })}
                className="input-field mt-2"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Business phone</label>
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
              <input
                value={form.suburbQuery}
                onChange={(event) => setForm({ ...form, suburbQuery: event.target.value, suburbId: 0 })}
                placeholder="Start typing a suburb…"
                className="input-field mt-2"
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
              {form.suburbId !== 0 && (
                <p className="text-xs text-green-600 mt-2">Suburb selected · ID #{form.suburbId}</p>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select the dog life stages you currently support (uncheck any that don’t apply).</p>
            <div className="grid md:grid-cols-2 gap-3">
              {ageOptions.map((option) => (
                <label
                  key={option.value}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    form.ages.includes(option.value) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.ages.includes(option.value)}
                    onChange={() => handleToggleAge(option.value)}
                    className="mr-2"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Primary service type</p>
              <div className="mt-2 grid md:grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <label
                    key={service}
                    className={`border rounded-lg p-3 cursor-pointer ${
                      form.primaryService === service ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="primaryService"
                      value={service}
                      checked={form.primaryService === service}
                      onChange={() => setForm({ ...form, primaryService: service })}
                      className="mr-2"
                    />
                    {formatLabel(service)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Secondary services (optional)</p>
              <div className="mt-2 grid md:grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <label key={service} className="border rounded-lg p-3 cursor-pointer border-gray-200 hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={form.secondaryServices.includes(service)}
                      onChange={() => handleSecondaryService(service)}
                      className="mr-2"
                    />
                    {formatLabel(service)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Tap the behaviour issues you specialise in. Leave blank to appear under “generalist” filters.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {issueOptions.map((option) => {
                const selected = form.issues.includes(option.value)
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleToggleIssue(option.value)}
                    className={`rounded-lg px-3 py-2 text-left text-sm border ${
                      selected ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Bio (optional)</label>
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={4}
                className="input-field mt-2"
                placeholder="Share your training philosophy, experience, and location details."
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Pricing overview (optional)</label>
              <textarea
                value={form.pricing}
                onChange={(event) => setForm({ ...form, pricing: event.target.value })}
                rows={3}
                className="input-field mt-2"
                placeholder="1:1 in-home: $120/hr&#10;Group class: $45/week&#10;Remote consults: $80/session"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">ABN</label>
              <input
                value={form.abn}
                onChange={(event) => setForm({ ...form, abn: event.target.value })}
                className="input-field mt-2"
                placeholder="11 111 111 111"
              />
              <p className="text-xs text-gray-500 mt-1">
                We call the Australian Business Register (ABR) using the provided GUID to verify your ABN instantly.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold">Phase 4 · Manual onboarding</p>
          <h1 className="text-3xl font-bold text-gray-900">Add your training business</h1>
          <p className="text-gray-600">
            Complete the guided 6-step form. We’ll send a verification email and confirm your ABN automatically.
          </p>
        </header>

        <ol className="flex flex-wrap gap-3 text-sm">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`flex items-center gap-2 border px-3 py-2 rounded-full ${
                index === currentStep
                  ? 'border-blue-600 text-blue-700'
                  : index < completedSteps
                  ? 'border-green-500 text-green-600'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <span className="font-semibold">{index + 1}.</span>
              <span>{step.title}</span>
            </li>
          ))}
        </ol>

        <section className="card space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
          {renderStep()}
          {message && (
            <div className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {message.text}
            </div>
          )}
          <div className="flex justify-between">
            {currentStep > 0 ? (
              <button type="button" onClick={handleBack} className="btn-outline">
                Back
              </button>
            ) : (
              <span />
            )}
            {currentStep < steps.length - 1 && (
              <button type="button" onClick={handleNext} className="btn-primary ml-auto">
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button type="button" onClick={handleSubmit} className="btn-primary ml-auto" disabled={loading}>
                {loading ? 'Verifying ABN…' : 'Verify ABN & Finish'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
