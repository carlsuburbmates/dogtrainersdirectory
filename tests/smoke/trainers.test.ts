import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => {
  const mockClient = {
    rpc: vi.fn(),
    from: vi.fn()
  }
  return { supabaseAdmin: mockClient, supabase: mockClient }
})

import { supabaseAdmin } from '@/lib/supabase'
import { getTrainerProfile } from '@/app/trainers/[id]/page'
import type { TriageRequest } from '@/lib/api'
import { apiService } from '@/lib/api'

const sampleTrainer = {
  business_id: 42,
  business_name: 'Calm Tails Training',
  abn_verified: true,
  verification_status: 'verified',
  address: '123 Bark St',
  website: 'https://calmtails.test',
  email: 'hello@calmtails.test',
  phone: '+61 3 5555 1111',
  bio: 'Certified trainer focused on evidence-based methods.',
  pricing: 'Sessions from $120/hr',
  featured_until: null,
  suburb_name: 'Richmond',
  suburb_postcode: '3121',
  council_name: 'City of Yarra',
  region: 'Inner City',
  average_rating: 4.8,
  review_count: 18,
  age_specialties: ['adult_18m_7y'],
  behavior_issues: ['separation_anxiety'],
  services: ['private_training']
}

describe('trainer profile smoke flow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    supabaseAdmin.rpc.mockResolvedValue({ data: [sampleTrainer], error: null })
    vi.spyOn(apiService, 'getTriageResults').mockResolvedValue([
      {
        business_id: sampleTrainer.business_id,
        business_name: sampleTrainer.business_name,
        business_email: sampleTrainer.email!,
        business_phone: sampleTrainer.phone!,
        business_website: sampleTrainer.website!,
        business_address: sampleTrainer.address!,
        business_bio: sampleTrainer.bio!,
        business_pricing: sampleTrainer.pricing!,
        suburb_name: sampleTrainer.suburb_name,
        council_name: sampleTrainer.council_name,
        region: sampleTrainer.region,
        distance_km: 5,
        average_rating: sampleTrainer.average_rating,
        review_count: sampleTrainer.review_count,
        age_specialties: sampleTrainer.age_specialties,
        behavior_issues: sampleTrainer.behavior_issues,
        services: sampleTrainer.services,
        verified: true,
        is_featured: false,
        featured_until: null,
        abn_verified: true
      }
    ])
  })

  it('loads trainer profile data via RPC', async () => {
    const profile = await getTrainerProfile(sampleTrainer.business_id)
    expect(profile?.business_name).toBe(sampleTrainer.business_name)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_trainer_profile', expect.any(Object))
  })

  it('search → trainer flow keeps IDs consistent', async () => {
    const triagePayload: TriageRequest = {
      age: 'adult_18m_7y',
      issues: ['separation_anxiety'],
      suburbId: 99,
      radius: 25
    }

    const results = await apiService.getTriageResults(triagePayload)
    expect(results).toHaveLength(1)
    const selected = results[0]
    const profile = await getTrainerProfile(selected.business_id)

    expect(`/trainers/${selected.business_id}`).toBe(`/trainers/${profile?.business_id}`)
    expect(profile?.business_name).toBe(sampleTrainer.business_name)
  })
})
