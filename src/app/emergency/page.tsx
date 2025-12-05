'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiService, SuburbResult, SearchResult } from '@/lib/api'
import type { EmergencyFlow } from '@/lib/emergency'

const FLOW_OPTIONS: { key: EmergencyFlow; title: string; description: string }[] = [
  { key: 'medical', title: 'Medical emergency', description: 'Injury, poisoning, collapse, choking, seizures or trauma.' },
  { key: 'stray', title: 'Found a stray dog', description: 'Lost or wandering dog that needs shelter or reunification.' },
  { key: 'crisis', title: 'Behaviour crisis', description: 'Sudden aggression or safety risk that needs expert triage.' }
]

type ClassificationState = {
  category: EmergencyFlow
  confidence: number
  guidance: string
  logId?: number | null
}

type EmergencyResource = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  suburb?: string | null
  council?: string | null
  region?: string | null
  emergency_hours?: string | null
  emergency_services?: string[] | null
  cost_indicator?: string | null
  capacity_notes?: string | null
  distance_km?: number | null
}

type CouncilContact = {
  council_id: number
  council_name: string
  phone: string | null
  after_hours_phone: string | null
  report_url: string | null
}

export default function EmergencyPage() {
  const [description, setDescription] = useState('')
  const [classification, setClassification] = useState<ClassificationState | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<EmergencyFlow>('medical')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suburbQuery, setSuburbQuery] = useState('')
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([])
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbResult | null>(null)
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [council, setCouncil] = useState<CouncilContact | null>(null)
  const [crisisResults, setCrisisResults] = useState<SearchResult[]>([])
  const [resourceLoading, setResourceLoading] = useState(false)

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
    const controller = new AbortController()
    const fetchResources = async () => {
      setResourceLoading(true)
      try {
        const params = new URLSearchParams({ flow: selectedFlow })
        if (selectedSuburb) params.set('suburbId', String(selectedSuburb.id))
        const response = await fetch(`/api/emergency/resources?${params.toString()}`, {
          signal: controller.signal
        })
        if (!response.ok) throw new Error('Failed to load resources')
        const payload = await response.json()
        if (payload.data?.trainers) {
          setCrisisResults(payload.data.trainers)
          setResources([])
          setCouncil(null)
        } else {
          setResources(payload.data?.resources ?? [])
          setCouncil(payload.data?.council ?? null)
          setCrisisResults([])
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err)
          setResources([])
          setCrisisResults([])
        }
      } finally {
        if (!controller.signal.aborted) setResourceLoading(false)
      }
    }

    fetchResources()
    return () => controller.abort()
  }, [selectedFlow, selectedSuburb])

  const handleClassify = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (description.trim().length < 10) {
      setError('Please describe the situation with at least a sentence so we can triage it properly.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/emergency/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, suburbId: selectedSuburb?.id ?? null })
      })
      if (!response.ok) throw new Error('Classification failed')
      const payload = await response.json()
      const result: ClassificationState = {
        category: payload.category,
        confidence: payload.confidence,
        guidance: payload.guidance,
        logId: payload.logId
      }
      setClassification(result)
      setSelectedFlow(payload.category as EmergencyFlow)
    } catch (err) {
      console.error(err)
      setError('Unable to classify this request right now. Please choose the flow manually.')
    } finally {
      setLoading(false)
    }
  }

  const handleFlowSelect = async (flow: EmergencyFlow) => {
    setSelectedFlow(flow)
    if (classification?.logId) {
      try {
        await fetch('/api/emergency/triage/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logId: classification.logId, selectedFlow: flow, predictedFlow: classification.category })
        })
      } catch (err) {
        console.warn('Failed to send triage feedback', err)
      }
    }
  }

  const primaryMessage = useMemo(() => {
    if (!classification) return 'Tell us what is happening and we will route you to the right emergency option.'
    return `${classification.guidance}`
  }, [classification])

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Emergency help</p>
        <h1 className="text-4xl font-bold text-gray-900">Get the right help in under a minute</h1>
        <p className="text-gray-600 max-w-3xl">
          This tool routes you to vetted 24/7 hospitals, council stray lines, or behaviour consultants. It logs the request so the weekly accuracy report can keep improving. If someone is in immediate danger, dial 000.
        </p>
      </header>

      <section className="card space-y-6">
        <form onSubmit={handleClassify} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-700">Describe what&apos;s happening*</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="input-field min-h-[120px]"
              placeholder="e.g. Found a small dog wandering on Sydney Road with no collar..."
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-700">Where are you?</span>
            <input
              type="text"
              value={suburbQuery}
              onChange={(event) => setSuburbQuery(event.target.value)}
              placeholder="Start typing your suburb"
              className="input-field"
            />
            {suburbSuggestions.length > 0 && (
              <div className="border rounded-lg divide-y">
                {suburbSuggestions.map((suburb) => (
                  <button
                    key={suburb.id}
                    type="button"
                    onClick={() => {
                      setSelectedSuburb(suburb)
                      setSuburbQuery(`${suburb.name} (${suburb.postcode})`)
                      setSuburbSuggestions([])
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {suburb.name} ({suburb.postcode}) • {suburb.council_name}
                  </button>
                ))}
              </div>
            )}
            {selectedSuburb && (
              <p className="text-xs text-gray-500">We&apos;ll prioritise resources near {selectedSuburb.name}. Not right? Pick a new suburb.</p>
            )}
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Classifying…' : 'Classify and route me'}
          </button>
        </form>
      </section>

      <section className="card space-y-4">
        <p className="text-sm uppercase font-semibold text-gray-500">AI triage recommendation</p>
        <p className="text-base text-gray-800">{primaryMessage}</p>
        {classification && (
          <p className="text-xs text-gray-500">Confidence: {(classification.confidence * 100).toFixed(0)}%</p>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          {FLOW_OPTIONS.map((option) => {
            const isActive = selectedFlow === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleFlowSelect(option.key)}
                className={`rounded-xl border p-4 text-left transition ${
                  isActive ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <p className="font-semibold text-lg">{option.title}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
                {classification?.category === option.key && (
                  <p className="mt-2 text-xs font-semibold text-red-500">Suggested route</p>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{selectedFlow === 'crisis' ? 'Crisis behaviour consultants' : 'Emergency contacts'}</h2>
          {resourceLoading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        {selectedFlow === 'crisis' && (
          <div className="space-y-3">
            {crisisResults.length === 0 && !resourceLoading && (
              <p className="text-sm text-gray-500">No trainers matched yet. Adjust filters on the main search page if needed.</p>
            )}
            {crisisResults.map((trainer) => (
              <article key={trainer.business_id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold">{trainer.business_name}</h3>
                  <p className="text-sm text-gray-600">{trainer.suburb_name} • {trainer.region}</p>
                  {trainer.business_phone && (
                    <a href={`tel:${trainer.business_phone}`} className="text-sm text-blue-600">Call {trainer.business_phone}</a>
                  )}
                  <p className="text-sm text-gray-700">{trainer.business_bio}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trainer.behavior_issues?.slice(0, 3).map((issue) => (
                      <span key={issue} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{issue.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedFlow !== 'crisis' && (
          <div className="space-y-4">
            {council && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">Council Animal Control ({council.council_name})</p>
                <p className="text-sm text-blue-800">Phone: {council.phone || 'Not listed'}{council.after_hours_phone ? ` • After hours ${council.after_hours_phone}` : ''}</p>
                {council.report_url && (
                  <a href={council.report_url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
                    Report online
                  </a>
                )}
              </div>
            )}
            {resources.length === 0 && !resourceLoading && (
              <p className="text-sm text-gray-500">No emergency resources found nearby yet. Try selecting a suburb for better results.</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {resources.map((resource) => (
                <article key={resource.id} className="rounded-xl border border-gray-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{resource.name}</h3>
                      <p className="text-sm text-gray-600">{resource.suburb} • {resource.region}</p>
                    </div>
                    {resource.distance_km && (
                      <p className="text-xs text-gray-500">{resource.distance_km.toFixed(1)} km</p>
                    )}
                  </div>
                  {resource.emergency_hours && (
                    <p className="text-sm text-gray-700">Hours: {resource.emergency_hours}</p>
                  )}
                  {resource.emergency_services && (
                    <p className="text-xs text-gray-500">Services: {resource.emergency_services.join(', ')}</p>
                  )}
                  {resource.capacity_notes && (
                    <p className="text-xs text-gray-500">Capacity: {resource.capacity_notes}</p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {resource.phone && (
                      <a href={`tel:${resource.phone}`} className="btn-secondary">Call now</a>
                    )}
                    {resource.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        Directions
                      </a>
                    )}
                    {resource.website && (
                      <a href={resource.website} target="_blank" rel="noreferrer" className="btn-secondary">
                        Website
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
