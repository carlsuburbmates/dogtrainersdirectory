'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import EmergencyE2EControls from '@/components/e2e/EmergencyE2EControls'

interface EmergencyResource {
  id: number
  name: string
  resource_type: string
  phone: string
  email?: string
  website?: string
  address?: string
  hours?: string
  services?: string
  created_at: string
}

interface TriageResponse {
  success: boolean
  classification?: {
    classification: string
    priority: string
    followUpActions: string[]
  }
  triage?: {
    classification: string
    priority: string
    followUpActions: string[]
    decisionSource: string
    triageId: string
  }
  medical?: {
    isMedical: boolean
    confidence: number
    symptoms: string[]
  }
  error?: string
}

export default function EmergencyPage() {
  const searchParams = useSearchParams()
  // Emergency Resources state
  const [location, setLocation] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')

  // AI Triage state
  const [situation, setSituation] = useState('')
  const [triageLocation, setTriageLocation] = useState('')
  const [contact, setContact] = useState('')
  const [dogAge, setDogAge] = useState('')
  const [triageResponse, setTriageResponse] = useState<TriageResponse | null>(null)
  const [triageLoading, setTriageLoading] = useState(false)
  const [triageError, setTriageError] = useState('')

  useEffect(() => {
    const flow = searchParams.get('flow')
    if (!flow) return
    const flowMap: Record<string, string> = {
      medical: 'emergency_vet',
      stray: 'emergency_shelter',
      crisis: 'behaviour_consultant'
    }
    const nextResourceType = flowMap[flow]
    if (nextResourceType) {
      setResourceType(nextResourceType)
    }
  }, [searchParams])

  const handleResourceSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setResourcesLoading(true)
    setResourcesError('')
    setResources([])

    try {
      const response = await fetch('/api/emergency/resources')
      const data = await response.json()

      if (response.ok) {
        // Filter resources based on location or type if provided
        let filtered = data.resources || []
        if (location) {
          filtered = filtered.filter((r: EmergencyResource) =>
            r.address?.toLowerCase().includes(location.toLowerCase()) ||
            r.name?.toLowerCase().includes(location.toLowerCase())
          )
        }
        if (resourceType) {
          filtered = filtered.filter((r: EmergencyResource) =>
            r.resource_type?.toLowerCase() === resourceType.toLowerCase()
          )
        }
        setResources(filtered)
      } else {
        setResourcesError(data.error || 'Failed to fetch resources')
      }
    } catch (error: any) {
      setResourcesError(error.message || 'Failed to fetch resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTriageLoading(true)
    setTriageError('')
    setTriageResponse(null)

    try {
      const response = await fetch('/api/emergency/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          location: triageLocation,
          contact,
          dog_age: dogAge ? parseInt(dogAge) : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTriageResponse(data)
      } else {
        setTriageError(data.error || 'Failed to get triage response')
      }
    } catch (error: any) {
      setTriageError(error.message || 'Failed to submit triage request')
    } finally {
      setTriageLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Emergency Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-red-900">⚠️ Important Disclaimer</h3>
            <div className="mt-2 text-sm text-red-800">
              <p className="mb-2">
                <strong>This is NOT a substitute for professional veterinary care or emergency services.</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>If your dog is in immediate danger or experiencing a life-threatening emergency, call your veterinarian or emergency vet clinic immediately.</li>
                <li>For aggressive or dangerous situations, contact local animal control authorities.</li>
                <li>The AI triage tool provides general guidance only and should not replace professional judgment.</li>
                <li>Always prioritize the safety of yourself, your dog, and others around you.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-gray-900">Emergency Dog Assistance</h1>
      <p className="text-gray-600 mb-8">Find emergency resources and get immediate guidance for urgent dog-related situations.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Emergency Resources Lookup Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Find Emergency Resources</h2>
          <p className="text-gray-600 mb-4">Search for veterinary clinics, shelters, and emergency services in your area.</p>

          <form onSubmit={handleResourceSearch} className="space-y-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location (City, Suburb, or Postcode)
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Melbourne, 3000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type (Optional)
              </label>
              <select
                id="resourceType"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="emergency_vet">Emergency vet</option>
                <option value="urgent_care">Urgent care</option>
                <option value="emergency_shelter">Emergency shelter</option>
                <option value="trainer">Trainer</option>
                <option value="behaviour_consultant">Behaviour consultant</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={resourcesLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {resourcesLoading ? 'Searching...' : 'Search Resources'}
            </button>
          </form>

          {resourcesError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{resourcesError}</p>
            </div>
          )}

          {resources.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Found {resources.length} resource(s):</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resources.map((resource) => (
                  <div key={resource.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                    <p className="text-sm text-gray-600 capitalize mt-1">{resource.resource_type?.replace('_', ' ')}</p>
                    {resource.phone && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Phone:</span>{' '}
                        <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">
                          {resource.phone}
                        </a>
                      </p>
                    )}
                    {resource.email && (
                      <p className="text-sm">
                        <span className="font-medium">Email:</span>{' '}
                        <a href={`mailto:${resource.email}`} className="text-blue-600 hover:underline">
                          {resource.email}
                        </a>
                      </p>
                    )}
                    {resource.website && (
                      <p className="text-sm">
                        <span className="font-medium">Website:</span>{' '}
                        <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </p>
                    )}
                    {resource.address && (
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {resource.address}
                      </p>
                    )}
                    {resource.hours && (
                      <p className="text-sm">
                        <span className="font-medium">Hours:</span> {resource.hours}
                      </p>
                    )}
                    {resource.services && (
                      <p className="text-sm">
                        <span className="font-medium">Services:</span> {resource.services}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resources.length === 0 && !resourcesLoading && !resourcesError && location && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">No resources found matching your search. Try a different location or remove filters.</p>
            </div>
          )}
        </div>

        {/* AI Triage Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">🤖 AI Emergency Triage</h2>
          <p className="text-gray-600 mb-4">Describe your situation and get immediate AI-powered guidance on next steps.</p>

          <form onSubmit={handleTriageSubmit} className="space-y-4">
            <div>
              <label htmlFor="situation" className="block text-sm font-medium text-gray-700 mb-1">
                Describe the Situation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                required
                rows={4}
                placeholder="e.g., My dog is bleeding from a cut on his paw..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="triageLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Your Location
              </label>
              <input
                id="triageLocation"
                type="text"
                value={triageLocation}
                onChange={(e) => setTriageLocation(e.target.value)}
                placeholder="e.g., Melbourne CBD"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information (Optional)
              </label>
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone or email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="dogAge" className="block text-sm font-medium text-gray-700 mb-1">
                Dog&apos;s age (years)
              </label>
              <input
                id="dogAge"
                type="number"
                min="0"
                max="30"
                value={dogAge}
                onChange={(e) => setDogAge(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={triageLoading || !situation}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {triageLoading ? 'Analyzing...' : 'Get Emergency Guidance'}
            </button>
          </form>

          {triageError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{triageError}</p>
            </div>
          )}

          {triageResponse && triageResponse.success && (
            <div className="mt-6 space-y-4">
              <div className={`rounded-lg p-4 border-2 ${getPriorityColor(triageResponse.triage?.priority || '')}`}>
                <h3 className="font-bold text-lg mb-2">
                  Priority Level: {triageResponse.triage?.priority?.toUpperCase()}
                </h3>
                <p className="text-sm mb-2">
                  <span className="font-medium">Classification:</span>{' '}
                  <span className="capitalize">{triageResponse.triage?.classification}</span>
                </p>
                {triageResponse.medical && triageResponse.medical.isMedical && (
                  <div className="mt-2 bg-white bg-opacity-50 rounded p-2">
                    <p className="text-sm font-medium">Medical Emergency Detected</p>
                    <p className="text-xs">Confidence: {(triageResponse.medical.confidence * 100).toFixed(0)}%</p>
                    {triageResponse.medical.symptoms && triageResponse.medical.symptoms.length > 0 && (
                      <p className="text-xs">Symptoms: {triageResponse.medical.symptoms.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>

              {triageResponse.triage?.followUpActions && triageResponse.triage.followUpActions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions:</h4>
                  <ul className="space-y-2">
                    {triageResponse.triage.followUpActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                        <span className="text-sm text-gray-800">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Decision Source: {triageResponse.triage?.decisionSource === 'llm' ? 'AI Analysis' : 'Rule-Based System'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Triage ID: {triageResponse.triage?.triageId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Emergency Contacts */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">🚨 Emergency Contacts</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">RSPCA Victoria</h3>
            <p className="text-sm text-gray-600">24/7 Emergency</p>
            <a href="tel:1300477722" className="text-blue-600 hover:underline font-medium">1300 4 RSPCA</a>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Animal Referral Hospital</h3>
            <p className="text-sm text-gray-600">Emergency & Critical Care</p>
            <a href="tel:0398053900" className="text-blue-600 hover:underline font-medium">(03) 9805 3900</a>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Lost Dogs Home</h3>
            <p className="text-sm text-gray-600">Lost & Found Pets</p>
            <a href="tel:0396267344" className="text-blue-600 hover:underline font-medium">(03) 9626 7344</a>
          </div>
        </div>
      </div>

      {process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1' && (
        <div className="mt-6">
          <EmergencyE2EControls />
        </div>
      )}
    </div>
  )
}
