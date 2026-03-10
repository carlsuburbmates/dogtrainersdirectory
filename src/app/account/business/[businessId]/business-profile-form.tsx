'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS
} from '@/lib/constants/taxonomies'
import type {
  BusinessProfileCompleteness,
  OwnedBusinessProfile
} from '@/lib/businessProfileManagement'
import type { AgeSpecialty, BehaviorIssue, ServiceType } from '@/types/database'

type FormState = {
  businessName: string
  businessPhone: string
  businessEmail: string
  website: string
  address: string
  bio: string
  pricing: string
  primaryService: ServiceType
  secondaryServices: ServiceType[]
  ages: AgeSpecialty[]
  issues: BehaviorIssue[]
}

type Props = {
  profile: OwnedBusinessProfile
}

function toFormState(profile: OwnedBusinessProfile): FormState {
  return {
    businessName: profile.businessName,
    businessPhone: profile.businessPhone,
    businessEmail: profile.businessEmail,
    website: profile.website,
    address: profile.address,
    bio: profile.bio,
    pricing: profile.pricing,
    primaryService: profile.primaryService,
    secondaryServices: profile.secondaryServices,
    ages: profile.ages,
    issues: profile.issues
  }
}

function CompletenessCard({ completeness }: { completeness: BusinessProfileCompleteness }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Deterministic profile completeness</h2>
          <p className="mt-1 text-sm text-slate-600">{completeness.summary}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-white">
          <div className="text-2xl font-semibold">{completeness.score}%</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Current score</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Completed
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {completeness.completedItems.length > 0 ? (
              completeness.completedItems.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• No completed checks yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Missing next
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {completeness.missingItems.length > 0 ? (
              completeness.missingItems.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• No missing items in the current baseline.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function BusinessProfileForm({ profile }: Props) {
  const [form, setForm] = useState<FormState>(() => toFormState(profile))
  const [completeness, setCompleteness] = useState(profile.completeness)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleValue = <T extends string>(values: T[], value: T) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/account/business/${profile.businessId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'We could not save your business profile right now.')
        return
      }

      const updatedProfile = payload.profile as OwnedBusinessProfile
      setForm(toFormState(updatedProfile))
      setCompleteness(updatedProfile.completeness)
      setMessage('Your business profile was updated.')
    } catch (requestError) {
      console.error(requestError)
      setError('We could not save your business profile right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <CompletenessCard completeness={completeness} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Managed here</h2>
            <p className="mt-2 text-sm text-slate-600">
              Update your owned profile details, services, and fit signals. The quality score above
              updates from the deterministic saved record.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Read-only platform status
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Verification: {profile.verificationStatus}</li>
              <li>• Public listing: {profile.isActive ? 'active' : 'inactive'}</li>
              <li>• Featured placement: {profile.featuredUntil ? 'managed elsewhere' : 'not active'}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Out of scope here
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Verification and ABN state</li>
              <li>• Publication and scaffold review</li>
              <li>• Featured placement, billing, and checkout</li>
            </ul>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Business details</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Business name
              <input
                value={form.businessName}
                onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Public email
              <input
                type="email"
                value={form.businessEmail}
                onChange={(event) => setForm((current) => ({ ...current, businessEmail: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Public phone
              <input
                value={form.businessPhone}
                onChange={(event) => setForm((current) => ({ ...current, businessPhone: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Website
              <input
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="https://"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Address
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Location remains tied to {profile.suburbName || 'your saved suburb'}
              {profile.suburbPostcode ? ` ${profile.suburbPostcode}` : ''} for this first slice.
            </div>
            <label className="text-sm font-medium text-slate-700">
              Pricing guidance
              <input
                value={form.pricing}
                onChange={(event) => setForm((current) => ({ ...current, pricing: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Bio
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Service profile</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Primary service
              <select
                value={form.primaryService}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    primaryService: event.target.value as ServiceType,
                    secondaryServices: current.secondaryServices.filter(
                      (service) => service !== event.target.value
                    )
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                {SERVICE_TYPES.map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {SERVICE_TYPE_LABELS[serviceType]}
                  </option>
                ))}
              </select>
            </label>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-700">Additional services</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SERVICE_TYPES.filter((serviceType) => serviceType !== form.primaryService).map((serviceType) => (
                  <label
                    key={serviceType}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.secondaryServices.includes(serviceType)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          secondaryServices: toggleValue(current.secondaryServices, serviceType)
                        }))
                      }
                    />
                    <span>{SERVICE_TYPE_LABELS[serviceType]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700">Age specialties</h3>
              <div className="mt-3 space-y-2">
                {AGE_SPECIALTIES.map((age) => (
                  <label
                    key={age}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.ages.includes(age)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          ages: toggleValue(current.ages, age)
                        }))
                      }
                    />
                    <span>{AGE_SPECIALTY_LABELS[age]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-700">Behaviour issues</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {BEHAVIOR_ISSUES.map((issue) => (
                  <label
                    key={issue}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.issues.includes(issue)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          issues: toggleValue(current.issues, issue)
                        }))
                      }
                    />
                    <span>{BEHAVIOR_ISSUE_LABELS[issue]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving profile…' : 'Save profile changes'}
          </Button>
          <p className="text-sm text-slate-500">
            Saves are deterministic. Any listing-quality guidance runs in shadow mode only and does
            not change publication, verification, or monetisation outcomes.
          </p>
        </div>
      </form>
    </div>
  )
}
