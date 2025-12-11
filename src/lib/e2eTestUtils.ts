import type { SearchResult } from './api'
import type { LatencySummary } from './telemetryLatency'

export const isE2ETestMode = () =>
  process.env.E2E_TEST_MODE === '1' || process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1'

export const e2eTrainerProfile = {
  business_id: 101,
  business_name: 'Calm Companion Canines',
  abn_verified: true,
  verification_status: 'verified',
  address: '123 Bark Lane, Richmond VIC',
  website: 'https://calm-companion.example',
  email: 'hello@calm-companion.example',
  phone: '+61 3 5555 1111',
  bio: 'Evidence-based training for anxious and reactive dogs across Melbourne.',
  pricing: 'Initial consult $180 • Follow-up $120',
  featured_until: null,
  suburb_name: 'Richmond',
  suburb_postcode: '3121',
  council_name: 'City of Yarra',
  region: 'Inner City',
  average_rating: 4.9,
  review_count: 42,
  age_specialties: ['puppy_8w_6m', 'adult_18m_7y'],
  behavior_issues: ['separation_anxiety', 'reactivity_on_leash'],
  services: ['in_home_training', 'virtual_sessions']
}

export const e2eSearchResults: SearchResult[] = [
  {
    business_id: e2eTrainerProfile.business_id,
    business_name: e2eTrainerProfile.business_name,
    business_email: e2eTrainerProfile.email ?? undefined,
    business_phone: e2eTrainerProfile.phone ?? undefined,
    business_website: e2eTrainerProfile.website ?? undefined,
    business_address: e2eTrainerProfile.address ?? undefined,
    business_bio: e2eTrainerProfile.bio ?? undefined,
    business_pricing: e2eTrainerProfile.pricing ?? undefined,
    suburb_name: e2eTrainerProfile.suburb_name,
    council_name: e2eTrainerProfile.council_name,
    region: e2eTrainerProfile.region,
    distance_km: 4.2,
    average_rating: e2eTrainerProfile.average_rating,
    review_count: e2eTrainerProfile.review_count,
    age_specialties: e2eTrainerProfile.age_specialties,
    behavior_issues: e2eTrainerProfile.behavior_issues,
    services: e2eTrainerProfile.services,
    verified: true,
    is_featured: true,
    featured_until: null,
    abn_verified: true
  }
]

export const e2eLatencySummary: LatencySummary = {
  count: 12,
  avgMs: 1200,
  p95Ms: 1800,
  successRate: 0.96
}
