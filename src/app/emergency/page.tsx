'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge, Card, Chip, Divider, Field, StateCard } from '@/components/ui/primitives'
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

function EmergencyPageContent() {
  const searchParams = useSearchParams()
  const [location, setLocation] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')

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

  const runResourceSearch = async () => {
    setResourcesLoading(true)
    setResourcesError('')
    setResources([])

    try {
      const response = await fetch('/api/emergency/resources')
      const data = await response.json()

      if (!response.ok) {
        setResourcesError(data.error || 'Failed to fetch resources')
        return
      }

      let filtered = data.resources || []
      if (location) {
        filtered = filtered.filter(
          (resource: EmergencyResource) =>
            resource.address?.toLowerCase().includes(location.toLowerCase()) ||
            resource.name?.toLowerCase().includes(location.toLowerCase())
        )
      }

      if (resourceType) {
        filtered = filtered.filter(
          (resource: EmergencyResource) =>
            resource.resource_type?.toLowerCase() === resourceType.toLowerCase()
        )
      }

      setResources(filtered)
    } catch (error: any) {
      setResourcesError(error.message || 'Failed to fetch resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  const runTriageRequest = async () => {
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
          dog_age: dogAge ? parseInt(dogAge, 10) : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setTriageError(data.error || 'Failed to get triage response')
        return
      }

      setTriageResponse(data)
    } catch (error: any) {
      setTriageError(error.message || 'Failed to submit triage request')
    } finally {
      setTriageLoading(false)
    }
  }

  const handleResourceSearch = (event: React.FormEvent) => {
    event.preventDefault()
    void runResourceSearch()
  }

  const handleTriageSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runTriageRequest()
  }

  const clearResourceFilters = () => {
    setLocation('')
    setResourceType('')
    setResources([])
    setResourcesError('')
  }

  const getPriorityTone = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'muted'
    }
  }

  return (
    <main className="public-page-shell">
      <div className="shell-container max-w-6xl py-8 space-y-6">
        <Card as="section" tone="warning" className="shell-surface">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning" className="normal-case tracking-[0.06em]">
              Urgent-first support
            </Badge>
            <Chip asSpan tone="warning">Act now, then refine</Chip>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-[hsl(var(--ds-text-primary))] sm:text-4xl">
            Emergency dog assistance
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[hsl(var(--ds-text-secondary))] sm:text-base">
            If your dog is in immediate danger, call a vet first. Use this page to find local emergency resources and then request triage guidance.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <a
              href="tel:0398053900"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[hsl(var(--ds-accent-warning))] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--ds-accent-warning)/0.92)]"
            >
              Call emergency vet now
            </a>
            <a
              href="tel:1300477722"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[hsl(var(--ds-accent-warning)/0.45)] bg-white px-4 py-3 text-sm font-semibold text-[hsl(var(--ds-text-primary))] transition-colors hover:bg-[hsl(var(--ds-accent-warning)/0.12)]"
            >
              Call RSPCA Victoria
            </a>
            <a
              href="#resource-search"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface))] px-4 py-3 text-sm font-semibold text-[hsl(var(--ds-text-primary))] transition-colors hover:border-[hsl(var(--ds-accent-primary)/0.45)]"
            >
              Find local resources
            </a>
          </div>
        </Card>

        <Card as="section" tone="muted" padding="sm">
          <p className="text-sm font-medium text-[hsl(var(--ds-text-primary))]">
            Safety notice: this guidance supports, but does not replace, urgent veterinary judgement.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-[hsl(var(--ds-accent-primary))] underline-offset-2 hover:underline">
              Read full safety guidance
            </summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--ds-text-secondary))]">
              <li>If your dog is in immediate danger, call your veterinarian or emergency clinic immediately.</li>
              <li>For aggressive or dangerous situations, contact local animal control authorities.</li>
              <li>The triage tool gives general guidance and should not replace professional judgement.</li>
              <li>Prioritise the safety of yourself, your dog, and others around you.</li>
            </ul>
          </details>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card as="section" id="resource-search">
            <div className="flex items-center gap-2">
              <Badge tone="primary" className="normal-case tracking-[0.06em]">Step 1</Badge>
              <h2 className="text-2xl font-bold text-[hsl(var(--ds-text-primary))]">Find emergency resources</h2>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--ds-text-secondary))]">
              Start with nearby clinics and support services so you have immediate contact options.
            </p>

            <form onSubmit={handleResourceSearch} className="mt-5 space-y-4">
              <Field label="Location" htmlFor="location" hint="City, suburb, or postcode.">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g., Melbourne, 3000"
                  className="w-full rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                />
              </Field>

              <Field label="Resource type" htmlFor="resourceType" hint="Optional.">
                <select
                  id="resourceType"
                  value={resourceType}
                  onChange={(event) => setResourceType(event.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                >
                  <option value="">All types</option>
                  <option value="emergency_vet">Emergency vet</option>
                  <option value="urgent_care">Urgent care</option>
                  <option value="emergency_shelter">Emergency shelter</option>
                  <option value="trainer">Trainer</option>
                  <option value="behaviour_consultant">Behaviour consultant</option>
                </select>
              </Field>

              <Button type="submit" loading={resourcesLoading} className="w-full min-h-[44px]">
                {resourcesLoading ? 'Searching...' : 'Search resources'}
              </Button>
            </form>

            {resourcesError ? (
              <StateCard
                title="Resource search failed"
                description={resourcesError}
                tone="error"
                align="left"
                className="mt-4"
                actions={
                  <>
                    <Button type="button" onClick={() => void runResourceSearch()} className="min-h-[44px]">
                      Retry search
                    </Button>
                    <a
                      href="#triage-assist"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[hsl(var(--ds-border-subtle))] px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-primary))]"
                    >
                      Go to triage guidance
                    </a>
                  </>
                }
              />
            ) : null}

            {resources.length > 0 ? (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-[hsl(var(--ds-text-primary))]">
                  Found {resources.length} resource(s)
                </h3>
                <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                  {resources.map((resource) => (
                    <Card key={resource.id} tone="muted" padding="sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-[hsl(var(--ds-text-primary))]">{resource.name}</h4>
                        <Badge className="normal-case tracking-[0.04em]">
                          {resource.resource_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1.5 text-sm text-[hsl(var(--ds-text-secondary))]">
                        {resource.phone ? (
                          <p>
                            <span className="font-semibold">Phone:</span>{' '}
                            <a href={`tel:${resource.phone}`} className="text-[hsl(var(--ds-accent-primary))] hover:underline">
                              {resource.phone}
                            </a>
                          </p>
                        ) : null}
                        {resource.email ? (
                          <p>
                            <span className="font-semibold">Email:</span>{' '}
                            <a href={`mailto:${resource.email}`} className="text-[hsl(var(--ds-accent-primary))] hover:underline">
                              {resource.email}
                            </a>
                          </p>
                        ) : null}
                        {resource.website ? (
                          <p>
                            <span className="font-semibold">Website:</span>{' '}
                            <a
                              href={resource.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[hsl(var(--ds-accent-primary))] hover:underline"
                            >
                              Visit website
                            </a>
                          </p>
                        ) : null}
                        {resource.address ? (
                          <p>
                            <span className="font-semibold">Address:</span> {resource.address}
                          </p>
                        ) : null}
                        {resource.hours ? (
                          <p>
                            <span className="font-semibold">Hours:</span> {resource.hours}
                          </p>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {resources.length === 0 && !resourcesLoading && !resourcesError && location ? (
              <StateCard
                title="No matching resources"
                description="Try another suburb, broaden the resource type, or call the emergency vet line now."
                tone="warning"
                className="mt-4"
                actions={
                  <>
                    <Button type="button" variant="outline" onClick={clearResourceFilters} className="min-h-[44px]">
                      Clear filters
                    </Button>
                    <a
                      href="tel:0398053900"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[hsl(var(--ds-accent-warning))] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Call emergency vet now
                    </a>
                  </>
                }
              />
            ) : null}
          </Card>

          <Card as="section" id="triage-assist">
            <div className="flex items-center gap-2">
              <Badge tone="primary" className="normal-case tracking-[0.06em]">Step 2</Badge>
              <h2 className="text-2xl font-bold text-[hsl(var(--ds-text-primary))]">Get triage guidance</h2>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--ds-text-secondary))]">
              After contacting urgent support, share your situation for structured next actions.
            </p>

            <form onSubmit={handleTriageSubmit} className="mt-5 space-y-4">
              <Field label="Describe the situation" htmlFor="situation" required>
                <textarea
                  id="situation"
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                  required
                  rows={4}
                  placeholder="e.g., My dog is bleeding from a cut on his paw..."
                  className="w-full resize-none rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                />
              </Field>

              <Field label="Your location" htmlFor="triageLocation">
                <input
                  id="triageLocation"
                  type="text"
                  value={triageLocation}
                  onChange={(event) => setTriageLocation(event.target.value)}
                  placeholder="e.g., Melbourne CBD"
                  className="w-full rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                />
              </Field>

              <Field label="Contact information" htmlFor="contact" hint="Optional.">
                <input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Phone or email"
                  className="w-full rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                />
              </Field>

              <Field label="Dog's age (years)" htmlFor="dogAge">
                <input
                  id="dogAge"
                  type="number"
                  min="0"
                  max="30"
                  value={dogAge}
                  onChange={(event) => setDogAge(event.target.value)}
                  placeholder="e.g., 5"
                  className="w-full rounded-xl border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.5)] px-4 py-3 text-sm text-[hsl(var(--ds-text-primary))] outline-none transition focus:border-[hsl(var(--ds-accent-primary))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--ds-accent-primary)/0.2)]"
                />
              </Field>

              <Button
                type="submit"
                loading={triageLoading}
                disabled={!situation}
                variant="danger"
                className="w-full min-h-[44px]"
              >
                {triageLoading ? 'Analysing...' : 'Get emergency guidance'}
              </Button>
            </form>

            {triageError ? (
              <StateCard
                title="Triage request failed"
                description={triageError}
                tone="error"
                align="left"
                className="mt-4"
                actions={
                  <>
                    <Button type="button" onClick={() => void runTriageRequest()} className="min-h-[44px]">
                      Retry triage
                    </Button>
                    <a
                      href="tel:0398053900"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[hsl(var(--ds-accent-warning)/0.45)] px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-primary))]"
                    >
                      Call emergency vet now
                    </a>
                  </>
                }
              />
            ) : null}

            {triageResponse?.success ? (
              <div className="mt-6 space-y-4">
                <Card tone={getPriorityTone(triageResponse.triage?.priority || '')} padding="sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-[hsl(var(--ds-text-primary))]">
                      Priority level: {triageResponse.triage?.priority?.toUpperCase()}
                    </h3>
                    <Badge tone="warning" className="normal-case tracking-[0.04em]">
                      {triageResponse.triage?.classification || 'Classification pending'}
                    </Badge>
                  </div>

                  {triageResponse.medical?.isMedical ? (
                    <Card tone="warning" padding="sm" className="mt-3 shadow-none">
                      <p className="text-sm font-semibold text-[hsl(var(--ds-text-primary))]">Medical emergency detected</p>
                      <p className="mt-1 text-sm text-[hsl(var(--ds-text-secondary))]">
                        Confidence: {(triageResponse.medical.confidence * 100).toFixed(0)}%
                      </p>
                      {triageResponse.medical.symptoms?.length ? (
                        <p className="mt-1 text-sm text-[hsl(var(--ds-text-secondary))]">
                          Symptoms: {triageResponse.medical.symptoms.join(', ')}
                        </p>
                      ) : null}
                    </Card>
                  ) : null}
                </Card>

                {triageResponse.triage?.followUpActions?.length ? (
                  <Card tone="info" padding="sm">
                    <h4 className="font-semibold text-[hsl(var(--ds-text-primary))]">Recommended actions</h4>
                    <ul className="mt-3 space-y-2">
                      {triageResponse.triage.followUpActions.map((action, index) => (
                        <li
                          key={`${action}-${index}`}
                          className="flex items-start gap-2 text-sm text-[hsl(var(--ds-text-secondary))]"
                        >
                          <span aria-hidden className="pt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

                <Card tone="muted" padding="sm">
                  <p className="text-xs text-[hsl(var(--ds-text-secondary))]">
                    Decision source:{' '}
                    {triageResponse.triage?.decisionSource === 'llm' ? 'AI analysis' : 'Rule-based system'}
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--ds-text-secondary))]">
                    Triage ID: {triageResponse.triage?.triageId}
                  </p>
                </Card>
              </div>
            ) : null}
          </Card>
        </div>

        <Card as="section" tone="info" padding="md">
          <h2 className="text-xl font-bold text-[hsl(var(--ds-text-primary))]">Emergency contacts</h2>
          <p className="mt-2 text-sm text-[hsl(var(--ds-text-secondary))]">
            Keep these numbers handy in case your nearest option is busy.
          </p>
          <Divider className="my-4" />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-[hsl(var(--ds-text-primary))]">RSPCA Victoria</h3>
              <p className="text-sm text-[hsl(var(--ds-text-secondary))]">24/7 emergency</p>
              <a href="tel:1300477722" className="text-[hsl(var(--ds-accent-primary))] hover:underline font-medium">1300 4 RSPCA</a>
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--ds-text-primary))]">Animal Referral Hospital</h3>
              <p className="text-sm text-[hsl(var(--ds-text-secondary))]">Emergency & critical care</p>
              <a href="tel:0398053900" className="text-[hsl(var(--ds-accent-primary))] hover:underline font-medium">(03) 9805 3900</a>
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--ds-text-primary))]">Lost Dogs Home</h3>
              <p className="text-sm text-[hsl(var(--ds-text-secondary))]">Lost & found pets</p>
              <a href="tel:0396267344" className="text-[hsl(var(--ds-accent-primary))] hover:underline font-medium">(03) 9626 7344</a>
            </div>
          </div>
        </Card>

        {process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1' ? (
          <div className="mt-6">
            <EmergencyE2EControls />
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default function EmergencyPage() {
  return (
    <Suspense
      fallback={
        <div className="public-page-shell shell-container py-8 text-sm text-[hsl(var(--ds-text-muted))]">
          Loading emergency resources...
        </div>
      }
    >
      <EmergencyPageContent />
    </Suspense>
  )
}
