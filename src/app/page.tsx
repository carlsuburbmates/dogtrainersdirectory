'use client'

import { useState, useEffect } from 'react'
import { apiService, SearchResult, SuburbResult } from '../lib/api'
import { AgeSpecialty, BehaviorIssue, validateAgeSpecialty, validateBehaviorIssue } from '../types/database'

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

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function HomePage() {
  const [age, setAge] = useState<AgeSpecialty>(ageOptions[0].value)
  const [issues, setIssues] = useState<BehaviorIssue[]>([])
  const [suburbQuery, setSuburbQuery] = useState('')
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(15)

  useEffect(() => {
    if (suburbQuery.length < 2) {
      setSuburbSuggestions([])
      return
    }

    let isCurrent = true
    apiService
      .searchSuburbs(suburbQuery)
      .then((items) => {
        if (isCurrent) {
          setSuburbSuggestions(items)
        }
      })
      .catch(() => {
        if (isCurrent) setSuburbSuggestions([])
      })

    return () => {
      isCurrent = false
    }
  }, [suburbQuery])

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

    setLoading(true)
    try {
      const response = await apiService.getTriageResults({
        age: validateAgeSpecialty(age),
        issues,
        suburbId: selectedSuburb.id,
        radius
      })
      setResults(response)
    } catch (err) {
      console.error(err)
      setError('Unable to fetch results right now; please try again later.')
    } finally {
      setLoading(false)
    }
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
              <input
                id="suburb"
                value={suburbQuery}
                onChange={(event) => {
                  setSuburbQuery(event.target.value)
                  setSelectedSuburb(null)
                }}
                placeholder="Start typing a suburb…"
                className="mt-2 w-full border rounded-md px-3 py-2"
              />
              {suburbSuggestions.length > 0 && (
                <ul className="border border-gray-200 rounded-md mt-2 bg-white max-h-60 overflow-y-auto">
                  {suburbSuggestions.map((suburb) => (
                    <li
                      key={suburb.id}
                      onClick={() => {
                        setSelectedSuburb(suburb)
                        setSuburbQuery(`${suburb.name} (${suburb.postcode})`)
                        setSuburbSuggestions([])
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-semibold">{suburb.name}</div>
                      <div className="text-xs text-gray-500">{suburb.postcode} • {suburb.latitude.toFixed(3)}, {suburb.longitude.toFixed(3)}</div>
                    </li>
                  ))}
                </ul>
              )}
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
              {loading ? 'Searching...' : 'Find trainers'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Search results</h2>
          {loading && (
            <div className="text-center py-8 text-gray-600">Fetching trainers near your pup…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-gray-600">No results yet. Fill out the form above.</div>
          )}
          <div className="space-y-6">
            {results.map((trainer) => (
              <article key={trainer.business_id} className="card border p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                <header className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{trainer.business_name}</h3>
                    <p className="text-sm text-gray-600">{trainer.suburb_name} • {trainer.distance_km.toFixed(1)} km away</p>
                  </div>
                  <div className="text-right space-y-1">
                    {trainer.verified && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        ✓ Verified
                      </span>
                    )}
                    <div className="flex items-center justify-end text-sm text-gray-500">
                      <span className="mr-1">⭐</span>
                      <span>{trainer.average_rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-400">{trainer.review_count} reviews</p>
                  </div>
                </header>

                <div className="grid gap-3 md:grid-cols-3 md:gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-500">Specialties</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trainer.age_specialties.map((tag) => (
                        <span key={tag} className="badge badge-blue">{formatLabel(tag)}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-500">Issues</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trainer.behavior_issues.map((tag) => (
                        <span key={tag} className="badge badge-orange">{formatLabel(tag)}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-500">Services</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trainer.services.map((tag) => (
                        <span key={tag} className="badge badge-purple">{formatLabel(tag)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-700 space-y-2">
                  {trainer.business_phone && <p>📞 {trainer.business_phone}</p>}
                  {trainer.business_email && <p>✉ {trainer.business_email}</p>}
                  {trainer.business_website && <p>🌐 <a href={trainer.business_website} className="text-blue-600 underline" target="_blank" rel="noreferrer">{trainer.business_website}</a></p>}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="btn-secondary" type="button" onClick={() => window.alert(`Contacting ${trainer.business_name}`)}>
                    Contact trainer
                  </button>
                  <button className="btn-outline" type="button" onClick={() => window.alert(`Viewing profile for ${trainer.business_name}`)}>
                    View profile
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
