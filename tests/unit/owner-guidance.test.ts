import { describe, expect, it } from 'vitest'
import {
  buildOwnerSearchExplanation,
  buildTrainerFitGuidance,
  buildTrainerProfileSearchParams,
  getOwnerSearchContext
} from '@/lib/ownerGuidance'

describe('owner guidance helpers', () => {
  it('explains what the current shortlist already reflects and what to confirm next', () => {
    const params = new URLSearchParams({
      flow_source: 'triage',
      suburbName: 'Richmond',
      distance: '5-15',
      service_type: 'private_training',
      age_specialties: 'puppies_0_6m',
      behavior_issues: 'separation_anxiety',
      verified_only: 'true'
    })

    const context = getOwnerSearchContext(params)
    const explanation = buildOwnerSearchExplanation(context)

    expect(explanation.reflected).toContain('This shortlist is already centred on Richmond.')
    expect(explanation.reflected).toContain('Distance is already narrowed to within 15 km.')
    expect(explanation.reflected).toContain('Profiles are already filtered for private training.')
    expect(explanation.reflected).toContain('Only verified listings are included in this shortlist.')
    expect(explanation.confirmNext.some((item) => item.includes('profile clearly lists'))).toBe(true)
    expect(explanation.confirmNext.some((item) => item.includes('best first contact path'))).toBe(true)
  })

  it('builds trainer fit guidance from display-only search context and listed profile fields', () => {
    const params = new URLSearchParams({
      q: 'lead pulling',
      service_type: 'private_training',
      age_specialties: 'puppies_0_6m',
      behavior_issues: 'separation_anxiety,pulling_on_lead'
    })

    const context = getOwnerSearchContext(params)
    const guidance = buildTrainerFitGuidance(context, {
      services: ['private_training'],
      ageSpecialties: [],
      behaviorIssues: ['pulling_on_lead'],
      pricing: null,
      reviewCount: 0,
      abnVerified: false,
      contactMethodCount: 0
    })

    expect(guidance.reflected).toContain('This profile explicitly lists private training.')
    expect(guidance.reflected).toContain('This profile does not list puppies (0–6 months) support.')
    expect(guidance.reflected).toContain('This profile lists pulling on the lead support.')
    expect(guidance.confirmNext).toContain('Pricing is not shown here, so confirm cost and session format before you commit.')
    expect(guidance.confirmNext).toContain('There are no public reviews here yet, so use profile detail and direct conversation as your proof points.')
    expect(guidance.confirmNext).toContain('Direct phone, email, or website details are not shown, so use the enquiry form if the fit still looks right.')
  })

  it('keeps trainer profile search params truthfully restorable for location-filtered shortlists', () => {
    const params = new URLSearchParams({
      q: 'puppy trainer',
      flow_source: 'triage',
      suburbName: 'Carlton',
      distance: '0-5',
      service_type: 'private_training',
      age_specialties: 'puppies_0_6m',
      behavior_issues: 'lead_pulling',
      verified_only: 'true',
      suburbId: '42',
      lat: '-37.8',
      lng: '144.9'
    })

    const nextParams = buildTrainerProfileSearchParams(params)

    expect(nextParams.toString()).toContain('q=puppy+trainer')
    expect(nextParams.toString()).toContain('flow_source=triage')
    expect(nextParams.toString()).toContain('service_type=private_training')
    expect(nextParams.toString()).toContain('suburbId=42')
    expect(nextParams.toString()).toContain('suburbName=Carlton')
    expect(nextParams.toString()).toContain('lat=-37.8')
    expect(nextParams.toString()).toContain('lng=144.9')
  })
})
