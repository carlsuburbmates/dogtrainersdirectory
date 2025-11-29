'use client'

import { useState } from 'react'
import { apiService } from '@/lib/api'
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
  const [form, setForm] = useState({
    email: '',
    password: '',
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
    ages: [] as AgeSpecialty[],
    issues: [] as BehaviorIssue[],
    primaryService: 'puppy_training',
    secondaryServices: [] as string[],
    abn: ''
  })
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (!form.ages.length) {
      setMessage('Please select at least one age specialty.')
      return
    }
    if (!form.suburbId) {
      setMessage('Please select a valid suburb before continuing.')
      return
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-3xl font-semibold mb-4">Trainer Onboarding (Manual only)</h1>
          <p className="text-gray-600 mb-6">
            Create your account, register your business, and verify your ABN.
          </p>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold">Account email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Full name</label>
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="input-field mt-2"
              />
            </div>
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
              <label className="text-sm font-semibold">Suburb ID (pick from search)</label>
              <input
                type="number"
                min={1}
                value={form.suburbId || ''}
                onChange={(event) => setForm({ ...form, suburbId: Number(event.target.value) })}
                className="input-field mt-2"
              />
              <small className="text-xs text-gray-500">Use the triage search to copy a suburb ID (Phase 1 override).</small>
            </div>
            <div>
              <label className="text-sm font-semibold">Bio</label>
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                className="input-field mt-2 min-h-[80px]"
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ageOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleToggleAge(option.value)}
                    className={`rounded-md border px-3 py-2 text-sm text-left ${form.ages.includes(option.value) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Behaviour issues (optional)</label>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {issueOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleToggleIssue(option.value)}
                    className={`rounded-md border px-3 py-2 text-sm text-left ${form.issues.includes(option.value) ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
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
                className="input-field mt-2"
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
              <div className="flex flex-wrap gap-2 mt-2">
                {serviceOptions.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleSecondaryService(service)}
                    className={`rounded-full border px-3 py-1 text-xs ${form.secondaryServices.includes(service) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {formatLabel(service)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">ABN</label>
              <input
                required
                value={form.abn}
                onChange={(event) => setForm({ ...form, abn: event.target.value })}
                className="input-field mt-2"
              />
            </div>
            {message && <div className="text-sm text-red-600">{message}</div>}
            <button
              type="submit"
              className="btn-primary w-full text-center"
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Submit onboarding'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
