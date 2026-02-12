'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuburbAutocomplete } from '@/components/ui/SuburbAutocomplete'
import type { SuburbResult } from '@/lib/api'
import { AgeSpecialty, BehaviorIssue } from '@/types/database'

const ageOptions: { value: AgeSpecialty; label: string }[] = [
  { value: 'puppies_0_6m', label: 'Puppies (0–6 months)' },
  { value: 'adolescent_6_18m', label: 'Adolescent (6–18 months)' },
  { value: 'adult_18m_7y', label: 'Adult (18 months–7 years)' },
  { value: 'senior_7y_plus', label: 'Senior (7+ years)' },
  { value: 'rescue_dogs', label: 'Rescue/Rehomed (any age)' }
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
      setError('Please select a suburb from the list below')
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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold mb-4">Find a Melbourne dog trainer</h1>
          <p className="text-gray-600 mb-6">Age-first triage ensures you get matched to trainers who specialise in your dog&apos;s current stage.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-semibold text-sm" htmlFor="age">Dog&apos;s age/stage</label>
              <select
                id="age"
                value={age}
                onChange={(event) => setAge(event.target.value as AgeSpecialty)}
                className="mt-2 w-full border rounded-md px-3 py-2"
              >
                {ageOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-sm">Behaviour issues (optional)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {issueOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleIssueToggle(option.value)}
                    className={`rounded-md border px-3 py-2 text-sm text-left ${
                      issues.includes(option.value)
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'bg-gray-100 text-gray-700 border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-sm" htmlFor="suburb">Suburb</label>
              <div className="mt-2">
                <SuburbAutocomplete
                  value={selectedSuburb}
                  onChange={setSelectedSuburb}
                />
              </div>
              {selectedSuburb && (
                <p className="text-xs text-green-600 mt-1">Selected suburb: {selectedSuburb.name}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-sm" htmlFor="radius">Search radius (km)</label>
              <input
                id="radius"
                type="number"
                min={5}
                max={100}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-2 w-full border rounded-md px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              className="w-full btn-primary px-4 py-3 text-white rounded-md font-semibold"
            >
              Find trainers
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
