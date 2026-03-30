import { Client } from 'pg'

export interface LiveSearchInventoryRow {
  business_id: number
  business_name: string
  business_email: string | null
  business_phone: string | null
  business_website: string | null
  business_address: string | null
  abn_verified: boolean | null
  verification_status: string | null
  suburb_name: string | null
  council_name: string | null
  region: string | null
  age_specialties: string[]
  behavior_issues: string[]
  services: string[]
}

export interface LaunchInventoryEnrichmentRow {
  business_id: number
  business_name: string
  resource_type: string | null
  profile_id: string | null
  is_scaffolded: boolean
  is_claimed: boolean
  verification_status: string | null
  abn_verified: boolean | null
  website: string | null
  has_phone_encrypted: boolean
  has_email_encrypted: boolean
  suburb_id: number | null
  suburb_name: string | null
  council_name: string | null
  region: string | null
  age_specialties: string[]
  behavior_issues: string[]
  services: string[]
}

export interface LaunchInventoryGateRecord {
  businessId: number
  businessName: string
  resourceType: string | null
  suburbName: string | null
  councilName: string | null
  region: string | null
  verificationStatus: string | null
  isScaffolded: boolean
  isClaimed: boolean
  counted: boolean
  exclusionReasons: string[]
}

export interface LaunchInventoryGateThreshold {
  name: string
  required: number | string[]
  actual: number | string[]
  passed: boolean
}

export interface LaunchInventoryGatePacket {
  status: 'PASS' | 'FAIL'
  source: {
    searchSurface: 'public.search_trainers'
    failClosed: true
    totalLiveSearchRows: number
    uniqueLiveSearchBusinesses: number
    enrichedBusinesses: number
  }
  summary: {
    countedListings: number
    representedCouncils: string[]
    representedSuburbs: string[]
    ageSpecialties: string[]
    serviceTypes: string[]
    behaviorIssues: string[]
  }
  thresholds: LaunchInventoryGateThreshold[]
  exclusions: LaunchInventoryGateRecord[]
  countedRecords: LaunchInventoryGateRecord[]
}

export const REQUIRED_INNER_CITY_COUNCILS = [
  'City of Melbourne',
  'City of Port Phillip',
  'City of Yarra',
] as const

export const LAUNCH_GATE_THRESHOLDS = {
  minimumListings: 30,
  minimumDistinctInnerCitySuburbs: 11,
  minimumAgeSpecialties: 3,
  minimumServiceTypes: 4,
  minimumBehaviorIssues: 5,
} as const

const PLACEHOLDER_DEMO_ONLY_NAMES = new Set([
  'DTD Verification Trainer PH205',
  'DTD Demo Trainer Carlton Foundation',
  'DTD Demo Trainer South Melbourne Reactive',
  'DTD Demo Trainer Fitzroy Social',
])

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function isPlaceholderDemoOnlyBusinessName(name: string | null | undefined): boolean {
  if (!name) {
    return false
  }
  const normalized = name.trim()
  return PLACEHOLDER_DEMO_ONLY_NAMES.has(normalized) || normalized.startsWith('DTD Demo Trainer ')
}

export async function readLiveSearchInventory(
  client: Client,
  pgcryptoKey: string | null,
  pageSize = 100,
): Promise<LiveSearchInventoryRow[]> {
  const deduped = new Map<number, LiveSearchInventoryRow>()

  for (let offset = 0; ; offset += pageSize) {
    const query = await client.query(
      `
        select *
        from public.search_trainers(
          null,
          null,
          null,
          null,
          null,
          false,
          false,
          'any',
          null,
          null,
          $1::integer,
          $2::integer,
          $3::text
        )
      `,
      [pageSize, offset, pgcryptoKey],
    )

    const rows = query.rows.map((row): LiveSearchInventoryRow => ({
      business_id: Number(row.business_id),
      business_name: String(row.business_name ?? ''),
      business_email: row.business_email ?? null,
      business_phone: row.business_phone ?? null,
      business_website: row.business_website ?? null,
      business_address: row.business_address ?? null,
      abn_verified: row.abn_verified ?? null,
      verification_status: row.verification_status ?? null,
      suburb_name: row.suburb_name ?? null,
      council_name: row.council_name ?? null,
      region: row.region ?? null,
      age_specialties: normalizeTextArray(row.age_specialties),
      behavior_issues: normalizeTextArray(row.behavior_issues),
      services: normalizeTextArray(row.services),
    }))

    for (const row of rows) {
      deduped.set(row.business_id, row)
    }

    if (rows.length < pageSize) {
      break
    }
  }

  return [...deduped.values()].sort((a, b) => a.business_id - b.business_id)
}

export async function readLaunchInventoryEnrichment(
  client: Client,
  businessIds: number[],
): Promise<LaunchInventoryEnrichmentRow[]> {
  if (businessIds.length === 0) {
    return []
  }

  const query = await client.query(
    `
      select
        b.id as business_id,
        b.name as business_name,
        b.resource_type,
        b.profile_id::text as profile_id,
        b.is_scaffolded,
        b.is_claimed,
        b.verification_status::text as verification_status,
        b.abn_verified,
        b.website,
        (b.phone_encrypted is not null) as has_phone_encrypted,
        (b.email_encrypted is not null) as has_email_encrypted,
        b.suburb_id,
        s.name as suburb_name,
        c.name as council_name,
        c.region::text as region,
        coalesce(array_remove(array_agg(distinct ts.age_specialty::text), null), '{}'::text[]) as age_specialties,
        coalesce(array_remove(array_agg(distinct tsvc.service_type::text), null), '{}'::text[]) as services,
        coalesce(array_remove(array_agg(distinct tbi.behavior_issue::text), null), '{}'::text[]) as behavior_issues
      from businesses b
      join suburbs s on s.id = b.suburb_id
      join councils c on c.id = s.council_id
      left join trainer_specializations ts on ts.business_id = b.id
      left join trainer_services tsvc on tsvc.business_id = b.id
      left join trainer_behavior_issues tbi on tbi.business_id = b.id
      where b.id = any($1::int[])
      group by
        b.id,
        b.name,
        b.resource_type,
        b.profile_id,
        b.is_scaffolded,
        b.is_claimed,
        b.verification_status,
        b.abn_verified,
        b.website,
        b.phone_encrypted,
        b.email_encrypted,
        b.suburb_id,
        s.name,
        c.name,
        c.region
      order by b.id asc
    `,
    [businessIds],
  )

  return query.rows.map((row): LaunchInventoryEnrichmentRow => ({
    business_id: Number(row.business_id),
    business_name: String(row.business_name ?? ''),
    resource_type: row.resource_type ?? null,
    profile_id: row.profile_id ?? null,
    is_scaffolded: Boolean(row.is_scaffolded),
    is_claimed: Boolean(row.is_claimed),
    verification_status: row.verification_status ?? null,
    abn_verified: row.abn_verified ?? null,
    website: row.website ?? null,
    has_phone_encrypted: Boolean(row.has_phone_encrypted),
    has_email_encrypted: Boolean(row.has_email_encrypted),
    suburb_id: row.suburb_id === null ? null : Number(row.suburb_id),
    suburb_name: row.suburb_name ?? null,
    council_name: row.council_name ?? null,
    region: row.region ?? null,
    age_specialties: normalizeTextArray(row.age_specialties),
    behavior_issues: normalizeTextArray(row.behavior_issues),
    services: normalizeTextArray(row.services),
  }))
}

function hasTruthfulContactPath(searchRow: LiveSearchInventoryRow, enrichmentRow: LaunchInventoryEnrichmentRow): boolean {
  return Boolean(
    searchRow.business_phone ||
      searchRow.business_email ||
      searchRow.business_website ||
      enrichmentRow.website
  )
}

export function evaluateLaunchInventoryGate(
  liveRows: LiveSearchInventoryRow[],
  enrichmentRows: LaunchInventoryEnrichmentRow[],
): LaunchInventoryGatePacket {
  const enrichmentById = new Map(enrichmentRows.map(row => [row.business_id, row]))
  const countedRecords: LaunchInventoryGateRecord[] = []
  const exclusions: LaunchInventoryGateRecord[] = []
  const representedCouncils = new Set<string>()
  const representedSuburbs = new Set<string>()
  const ageSpecialties = new Set<string>()
  const serviceTypes = new Set<string>()
  const behaviorIssues = new Set<string>()

  for (const liveRow of liveRows) {
    const enrichmentRow = enrichmentById.get(liveRow.business_id)
    const exclusionReasons: string[] = []

    if (!enrichmentRow) {
      exclusionReasons.push('missing_inventory_enrichment')
    } else {
      if (isPlaceholderDemoOnlyBusinessName(liveRow.business_name)) {
        exclusionReasons.push('placeholder_demo_only_inventory')
      }
      if (enrichmentRow.region !== 'Inner City') {
        exclusionReasons.push('outside_inner_city_catchment')
      }
      if (!enrichmentRow.suburb_id) {
        exclusionReasons.push('missing_suburb_id')
      }
      if (enrichmentRow.age_specialties.length === 0) {
        exclusionReasons.push('missing_trainer_specialization')
      }
      if (!hasTruthfulContactPath(liveRow, enrichmentRow)) {
        exclusionReasons.push('missing_truthful_contact_path')
      }
      if (enrichmentRow.verification_status === 'manual_review' || enrichmentRow.verification_status === 'rejected') {
        exclusionReasons.push('excluded_verification_status')
      }
      if (
        enrichmentRow.is_scaffolded &&
        (
          enrichmentRow.is_claimed ||
          enrichmentRow.abn_verified === true ||
          enrichmentRow.verification_status === 'verified' ||
          enrichmentRow.profile_id !== null
        )
      ) {
        exclusionReasons.push('scaffolded_truth_state_conflict')
      }
    }

    const record: LaunchInventoryGateRecord = {
      businessId: liveRow.business_id,
      businessName: liveRow.business_name,
      resourceType: enrichmentRow?.resource_type ?? null,
      suburbName: enrichmentRow?.suburb_name ?? liveRow.suburb_name,
      councilName: enrichmentRow?.council_name ?? liveRow.council_name,
      region: enrichmentRow?.region ?? liveRow.region,
      verificationStatus: enrichmentRow?.verification_status ?? liveRow.verification_status,
      isScaffolded: enrichmentRow?.is_scaffolded ?? false,
      isClaimed: enrichmentRow?.is_claimed ?? false,
      counted: exclusionReasons.length === 0,
      exclusionReasons,
    }

    if (record.counted && enrichmentRow) {
      countedRecords.push(record)
      if (enrichmentRow.council_name) {
        representedCouncils.add(enrichmentRow.council_name)
      }
      if (enrichmentRow.suburb_name) {
        representedSuburbs.add(enrichmentRow.suburb_name)
      }
      enrichmentRow.age_specialties.forEach(value => ageSpecialties.add(value))
      enrichmentRow.services.forEach(value => serviceTypes.add(value))
      enrichmentRow.behavior_issues.forEach(value => behaviorIssues.add(value))
    } else {
      exclusions.push(record)
    }
  }

  const thresholdResults: LaunchInventoryGateThreshold[] = [
    {
      name: 'Minimum real searchable trainer listings',
      required: LAUNCH_GATE_THRESHOLDS.minimumListings,
      actual: countedRecords.length,
      passed: countedRecords.length >= LAUNCH_GATE_THRESHOLDS.minimumListings,
    },
    {
      name: 'Required Inner City councils',
      required: [...REQUIRED_INNER_CITY_COUNCILS],
      actual: [...representedCouncils].sort(),
      passed: REQUIRED_INNER_CITY_COUNCILS.every(council => representedCouncils.has(council)),
    },
    {
      name: 'Minimum distinct Inner City suburbs',
      required: LAUNCH_GATE_THRESHOLDS.minimumDistinctInnerCitySuburbs,
      actual: representedSuburbs.size,
      passed: representedSuburbs.size >= LAUNCH_GATE_THRESHOLDS.minimumDistinctInnerCitySuburbs,
    },
    {
      name: 'Minimum distinct age specialties',
      required: LAUNCH_GATE_THRESHOLDS.minimumAgeSpecialties,
      actual: ageSpecialties.size,
      passed: ageSpecialties.size >= LAUNCH_GATE_THRESHOLDS.minimumAgeSpecialties,
    },
    {
      name: 'Minimum distinct service types',
      required: LAUNCH_GATE_THRESHOLDS.minimumServiceTypes,
      actual: serviceTypes.size,
      passed: serviceTypes.size >= LAUNCH_GATE_THRESHOLDS.minimumServiceTypes,
    },
    {
      name: 'Minimum distinct behavior issues',
      required: LAUNCH_GATE_THRESHOLDS.minimumBehaviorIssues,
      actual: behaviorIssues.size,
      passed: behaviorIssues.size >= LAUNCH_GATE_THRESHOLDS.minimumBehaviorIssues,
    },
  ]

  return {
    status: thresholdResults.every(threshold => threshold.passed) ? 'PASS' : 'FAIL',
    source: {
      searchSurface: 'public.search_trainers',
      failClosed: true,
      totalLiveSearchRows: liveRows.length,
      uniqueLiveSearchBusinesses: liveRows.length,
      enrichedBusinesses: enrichmentRows.length,
    },
    summary: {
      countedListings: countedRecords.length,
      representedCouncils: [...representedCouncils].sort(),
      representedSuburbs: [...representedSuburbs].sort(),
      ageSpecialties: [...ageSpecialties].sort(),
      serviceTypes: [...serviceTypes].sort(),
      behaviorIssues: [...behaviorIssues].sort(),
    },
    thresholds: thresholdResults,
    exclusions,
    countedRecords,
  }
}
