import { describe, expect, it } from 'vitest'

import {
  evaluateLaunchInventoryGate,
  isPlaceholderDemoOnlyBusinessName,
  type LaunchInventoryEnrichmentRow,
  type LiveSearchInventoryRow,
} from '../../scripts/launch_inventory_gate'

const INNER_CITY_COUNCILS = [
  'City of Melbourne',
  'City of Port Phillip',
  'City of Yarra',
]

const INNER_CITY_SUBURBS = [
  'Carlton',
  'Docklands',
  'North Melbourne',
  'Parkville',
  'Southbank',
  'South Melbourne',
  'Albert Park',
  'St Kilda',
  'Abbotsford',
  'Collingwood',
  'Richmond',
]

const AGE_SPECIALTIES = ['puppies_0_6m', 'adolescent_6_18m', 'adult_18m_7y']
const SERVICE_TYPES = ['puppy_training', 'group_classes', 'private_training', 'obedience_training']
const BEHAVIOR_ISSUES = [
  'anxiety_general',
  'jumping_up',
  'pulling_on_lead',
  'leash_reactivity',
  'recall_issues',
]

function buildLiveRow(id: number, overrides: Partial<LiveSearchInventoryRow> = {}): LiveSearchInventoryRow {
  return {
    business_id: id,
    business_name: `Trainer ${id}`,
    business_email: null,
    business_phone: `0400000${String(id).padStart(3, '0')}`,
    business_website: `https://trainer-${id}.example.com`,
    business_address: `${id} Test Street`,
    abn_verified: false,
    verification_status: 'pending',
    suburb_name: INNER_CITY_SUBURBS[(id - 1) % INNER_CITY_SUBURBS.length],
    council_name: INNER_CITY_COUNCILS[(id - 1) % INNER_CITY_COUNCILS.length],
    region: 'Inner City',
    age_specialties: [AGE_SPECIALTIES[(id - 1) % AGE_SPECIALTIES.length]],
    behavior_issues: [BEHAVIOR_ISSUES[(id - 1) % BEHAVIOR_ISSUES.length]],
    services: [SERVICE_TYPES[(id - 1) % SERVICE_TYPES.length]],
    ...overrides,
  }
}

function buildEnrichmentRow(id: number, overrides: Partial<LaunchInventoryEnrichmentRow> = {}): LaunchInventoryEnrichmentRow {
  const suburbName = overrides.suburb_name ?? INNER_CITY_SUBURBS[(id - 1) % INNER_CITY_SUBURBS.length]
  const councilName = overrides.council_name ?? INNER_CITY_COUNCILS[(id - 1) % INNER_CITY_COUNCILS.length]
  return {
    business_id: id,
    business_name: `Trainer ${id}`,
    resource_type: 'trainer',
    profile_id: null,
    is_scaffolded: false,
    is_claimed: false,
    verification_status: 'pending',
    abn_verified: false,
    website: `https://trainer-${id}.example.com`,
    has_phone_encrypted: true,
    has_email_encrypted: false,
    suburb_id: id,
    suburb_name: suburbName,
    council_name: councilName,
    region: 'Inner City',
    age_specialties: [AGE_SPECIALTIES[(id - 1) % AGE_SPECIALTIES.length]],
    behavior_issues: [BEHAVIOR_ISSUES[(id - 1) % BEHAVIOR_ISSUES.length]],
    services: [SERVICE_TYPES[(id - 1) % SERVICE_TYPES.length]],
    ...overrides,
  }
}

describe('evaluateLaunchInventoryGate', () => {
  it('passes when 30 real live searchable listings satisfy the frozen gate thresholds', () => {
    const liveRows = Array.from({ length: 30 }, (_, index) => {
      const id = index + 1
      return buildLiveRow(id)
    })

    const enrichmentRows = Array.from({ length: 30 }, (_, index) => {
      const id = index + 1
      return buildEnrichmentRow(id, id === 1 ? { is_scaffolded: true, is_claimed: false } : {})
    })

    const packet = evaluateLaunchInventoryGate(liveRows, enrichmentRows)

    expect(packet.status).toBe('PASS')
    expect(packet.summary.countedListings).toBe(30)
    expect(packet.summary.representedCouncils).toEqual([...INNER_CITY_COUNCILS].sort())
    expect(packet.summary.representedSuburbs.length).toBeGreaterThanOrEqual(11)
    expect(packet.summary.ageSpecialties.length).toBeGreaterThanOrEqual(3)
    expect(packet.summary.serviceTypes.length).toBeGreaterThanOrEqual(4)
    expect(packet.summary.behaviorIssues.length).toBeGreaterThanOrEqual(5)
  })

  it('excludes placeholder/demo-only rows and scaffolded truth conflicts from the counted set', () => {
    const realLiveRows = Array.from({ length: 29 }, (_, index) => buildLiveRow(index + 1))
    const demoLiveRow = buildLiveRow(30, {
      business_name: 'DTD Demo Trainer Carlton Foundation',
      suburb_name: 'Carlton',
      council_name: 'City of Melbourne',
    })

    const realEnrichmentRows = Array.from({ length: 29 }, (_, index) => buildEnrichmentRow(index + 1))
    const demoEnrichmentRow = buildEnrichmentRow(30, {
      business_name: 'DTD Demo Trainer Carlton Foundation',
      is_scaffolded: true,
      is_claimed: true,
    })

    const packet = evaluateLaunchInventoryGate([...realLiveRows, demoLiveRow], [...realEnrichmentRows, demoEnrichmentRow])

    expect(packet.status).toBe('FAIL')
    expect(packet.summary.countedListings).toBe(29)
    expect(
      packet.exclusions.find(record => record.businessName === 'DTD Demo Trainer Carlton Foundation')?.exclusionReasons,
    ).toEqual(expect.arrayContaining(['placeholder_demo_only_inventory', 'scaffolded_truth_state_conflict']))
  })

  it('counts only businesses proven live-searchable and leaves non-duplicates mapping-ready when thresholds are otherwise met', () => {
    const liveRows = Array.from({ length: 30 }, (_, index) => buildLiveRow(index + 1))
    const enrichmentRows = Array.from({ length: 31 }, (_, index) => buildEnrichmentRow(index + 1))
    const packet = evaluateLaunchInventoryGate(liveRows, enrichmentRows)

    expect(packet.summary.countedListings).toBe(30)
    expect(packet.countedRecords.some(record => record.businessId === 31)).toBe(false)
    expect(packet.status).toBe('PASS')
  })
})

describe('isPlaceholderDemoOnlyBusinessName', () => {
  it('detects current controlled verification/demo rows', () => {
    expect(isPlaceholderDemoOnlyBusinessName('DTD Verification Trainer PH205')).toBe(true)
    expect(isPlaceholderDemoOnlyBusinessName('DTD Demo Trainer Fitzroy Social')).toBe(true)
    expect(isPlaceholderDemoOnlyBusinessName('Real Trainer Co')).toBe(false)
  })
})
