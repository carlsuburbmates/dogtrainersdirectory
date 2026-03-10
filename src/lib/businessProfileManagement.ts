import {
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPE_LABELS,
  isValidAgeSpecialty,
  isValidBehaviorIssue,
  isValidServiceType
} from '@/lib/constants/taxonomies'
import { decryptValue, encryptValue } from '@/lib/encryption'
import { supabaseAdmin } from '@/lib/supabase'
import type {
  AgeSpecialty,
  BehaviorIssue,
  ServiceType,
  VerificationStatus
} from '@/types/database'

const EDITABLE_FIELDS = [
  'businessName',
  'businessPhone',
  'businessEmail',
  'website',
  'address',
  'bio',
  'pricing',
  'primaryService',
  'secondaryServices',
  'ages',
  'issues'
] as const

type EditableField = (typeof EDITABLE_FIELDS)[number]

type RawBusinessProfileUpdatePayload = Partial<Record<EditableField, unknown>> & Record<string, unknown>

export type BusinessProfileUpdateError = {
  code:
    | 'forbidden_fields'
    | 'missing_fields'
    | 'invalid_primary_service'
    | 'invalid_ages'
    | 'invalid_issues'
    | 'invalid_secondary_services'
  message: string
  fields: string[]
  invalidValues?: unknown[]
}

export type BusinessProfileUpdateInput = {
  businessName: string
  businessPhone?: string
  businessEmail?: string
  website?: string
  address?: string
  bio?: string
  pricing?: string
  primaryService: ServiceType
  secondaryServices: ServiceType[]
  ages: AgeSpecialty[]
  issues: BehaviorIssue[]
}

export type OwnedBusinessSummary = {
  id: number
  name: string
  verificationStatus: VerificationStatus
  isActive: boolean
  updatedAt: string | null
}

export type BusinessProfileCompleteness = {
  score: number
  completedChecks: number
  totalChecks: number
  summary: string
  missingItems: string[]
  completedItems: string[]
}

export type OwnedBusinessProfile = {
  businessId: number
  businessName: string
  businessPhone: string
  businessEmail: string
  website: string
  address: string
  suburbName: string
  suburbPostcode: string
  bio: string
  pricing: string
  verificationStatus: VerificationStatus
  abnVerified: boolean
  featuredUntil: string | null
  isActive: boolean
  updatedAt: string | null
  primaryService: ServiceType
  secondaryServices: ServiceType[]
  ages: AgeSpecialty[]
  issues: BehaviorIssue[]
  completeness: BusinessProfileCompleteness
}

type BusinessRow = {
  id: number
  name: string
  website: string | null
  address: string | null
  suburb_id: number | null
  bio: string | null
  pricing: string | null
  verification_status: VerificationStatus
  abn_verified: boolean | null
  featured_until: string | null
  is_active: boolean | null
  updated_at: string | null
  email_encrypted: string | null
  phone_encrypted: string | null
  service_type_primary: ServiceType | null
}

const COMPLETENESS_CHECKS = [
  {
    label: 'business name',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.businessName.trim().length > 0
  },
  {
    label: 'public email',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.businessEmail.trim().length > 0
  },
  {
    label: 'public phone',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.businessPhone.trim().length > 0
  },
  {
    label: 'website',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.website.trim().length > 0
  },
  {
    label: 'address',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.address.trim().length > 0
  },
  {
    label: 'bio',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.bio.trim().length >= 60
  },
  {
    label: 'pricing guidance',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.pricing.trim().length > 0
  },
  {
    label: 'primary service',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) =>
      profile.primaryService.trim().length > 0
  },
  {
    label: 'age specialties',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) => profile.ages.length > 0
  },
  {
    label: 'behaviour issues',
    complete: (profile: Omit<OwnedBusinessProfile, 'completeness'>) => profile.issues.length > 0
  }
] as const

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const readOptionalString = (value: unknown) => {
  const normalized = readString(value)
  return normalized || undefined
}

const dedupe = <T extends string>(values: T[]) => Array.from(new Set(values))

const readStringArray = (value: unknown) => {
  if (value === undefined) {
    return { values: [] as string[], invalidValues: [] as unknown[] }
  }

  if (!Array.isArray(value)) {
    return { values: [] as string[], invalidValues: [value] }
  }

  const values: string[] = []
  const invalidValues: unknown[] = []

  for (const item of value) {
    if (typeof item !== 'string') {
      invalidValues.push(item)
      continue
    }

    const normalized = item.trim()
    if (!normalized) {
      invalidValues.push(item)
      continue
    }

    values.push(normalized)
  }

  return { values, invalidValues }
}

export function parseBusinessProfileUpdatePayload(
  body: unknown
): { ok: true; data: BusinessProfileUpdateInput } | { ok: false; error: BusinessProfileUpdateError } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: {
        code: 'missing_fields',
        message: 'Business profile updates must be a JSON object.',
        fields: ['body']
      }
    }
  }

  const record = body as RawBusinessProfileUpdatePayload
  const forbiddenFields = Object.keys(record).filter(
    (key) => !(EDITABLE_FIELDS as readonly string[]).includes(key)
  )

  if (forbiddenFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'forbidden_fields',
        message:
          'This business profile surface does not accept verification, publication, monetisation, or admin-only fields.',
        fields: forbiddenFields
      }
    }
  }

  const businessName = readString(record.businessName)
  const businessPhone = readOptionalString(record.businessPhone)
  const businessEmail = readOptionalString(record.businessEmail)
  const website = readOptionalString(record.website)
  const address = readOptionalString(record.address)
  const bio = readOptionalString(record.bio)
  const pricing = readOptionalString(record.pricing)
  const primaryService = readString(record.primaryService)
  const rawAges = readStringArray(record.ages)
  const rawIssues = readStringArray(record.issues)
  const rawSecondaryServices = readStringArray(record.secondaryServices)

  const missingFields = [
    !businessName && 'businessName',
    !primaryService && 'primaryService',
    rawAges.values.length === 0 && 'ages'
  ].filter(Boolean) as string[]

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'missing_fields',
        message: 'Missing required business profile fields.',
        fields: missingFields
      }
    }
  }

  if (!isValidServiceType(primaryService)) {
    return {
      ok: false,
      error: {
        code: 'invalid_primary_service',
        message: 'Invalid primaryService.',
        fields: ['primaryService'],
        invalidValues: [primaryService]
      }
    }
  }

  const invalidAges = [...rawAges.invalidValues, ...rawAges.values.filter((value) => !isValidAgeSpecialty(value))]
  if (invalidAges.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_ages',
        message: 'Invalid ages.',
        fields: ['ages'],
        invalidValues: invalidAges
      }
    }
  }

  const invalidIssues = [
    ...rawIssues.invalidValues,
    ...rawIssues.values.filter((value) => !isValidBehaviorIssue(value))
  ]
  if (invalidIssues.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_issues',
        message: 'Invalid issues.',
        fields: ['issues'],
        invalidValues: invalidIssues
      }
    }
  }

  const invalidSecondaryServices = [
    ...rawSecondaryServices.invalidValues,
    ...rawSecondaryServices.values.filter((value) => !isValidServiceType(value))
  ]
  if (invalidSecondaryServices.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_secondary_services',
        message: 'Invalid secondaryServices.',
        fields: ['secondaryServices'],
        invalidValues: invalidSecondaryServices
      }
    }
  }

  const normalizedSecondaryServices = dedupe(
    rawSecondaryServices.values.filter(
      (value): value is ServiceType => isValidServiceType(value) && value !== primaryService
    )
  )

  return {
    ok: true,
    data: {
      businessName,
      businessPhone,
      businessEmail,
      website,
      address,
      bio,
      pricing,
      primaryService,
      secondaryServices: normalizedSecondaryServices,
      ages: dedupe(rawAges.values as AgeSpecialty[]),
      issues: dedupe(rawIssues.values.filter((value): value is BehaviorIssue => isValidBehaviorIssue(value)))
    }
  }
}

export function evaluateBusinessProfileCompleteness(
  profile: Omit<OwnedBusinessProfile, 'completeness'>
): BusinessProfileCompleteness {
  const completedItems: string[] = []
  const missingItems: string[] = []

  for (const check of COMPLETENESS_CHECKS) {
    if (check.complete(profile)) {
      completedItems.push(check.label)
    } else {
      missingItems.push(check.label)
    }
  }

  const completedChecks = completedItems.length
  const totalChecks = COMPLETENESS_CHECKS.length
  const score = Math.round((completedChecks / totalChecks) * 100)

  return {
    score,
    completedChecks,
    totalChecks,
    summary:
      missingItems.length === 0
        ? 'Your profile meets the current deterministic quality baseline.'
        : `Your profile currently covers ${completedChecks} of ${totalChecks} deterministic quality checks.`,
    completedItems,
    missingItems
  }
}

export async function listOwnedBusinesses(userId: string): Promise<OwnedBusinessSummary[]> {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('id, name, verification_status, is_active, updated_at')
    .eq('profile_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load owned businesses: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{
    id: number
    name: string
    verification_status: VerificationStatus
    is_active: boolean | null
    updated_at: string | null
  }>

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    verificationStatus: row.verification_status,
    isActive: row.is_active !== false,
    updatedAt: row.updated_at
  }))
}

async function loadBusinessRelations(businessId: number) {
  const [servicesResult, agesResult, issuesResult] = await Promise.all([
    supabaseAdmin
      .from('trainer_services')
      .select('service_type, is_primary')
      .eq('business_id', businessId),
    supabaseAdmin
      .from('trainer_specializations')
      .select('age_specialty')
      .eq('business_id', businessId),
    supabaseAdmin
      .from('trainer_behavior_issues')
      .select('behavior_issue')
      .eq('business_id', businessId)
  ])

  if (servicesResult.error) {
    throw new Error(`Failed to load trainer services: ${servicesResult.error.message}`)
  }

  if (agesResult.error) {
    throw new Error(`Failed to load trainer specialisations: ${agesResult.error.message}`)
  }

  if (issuesResult.error) {
    throw new Error(`Failed to load trainer behaviour issues: ${issuesResult.error.message}`)
  }

  return {
    services: (servicesResult.data ?? []) as Array<{
      service_type: ServiceType
      is_primary: boolean | null
    }>,
    ages: (agesResult.data ?? []) as Array<{ age_specialty: AgeSpecialty }>,
    issues: (issuesResult.data ?? []) as Array<{ behavior_issue: BehaviorIssue }>
  }
}

export async function getOwnedBusinessProfile(
  userId: string,
  businessId: number
): Promise<OwnedBusinessProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select(
      'id, name, website, address, suburb_id, bio, pricing, verification_status, abn_verified, featured_until, is_active, updated_at, email_encrypted, phone_encrypted, service_type_primary'
    )
    .eq('id', businessId)
    .eq('profile_id', userId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load business profile: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const row = data as BusinessRow
  const [{ services, ages, issues }, suburbResult, businessEmail, businessPhone] =
    await Promise.all([
      loadBusinessRelations(businessId),
      row.suburb_id
        ? supabaseAdmin
            .from('suburbs')
            .select('name, postcode')
            .eq('id', row.suburb_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.email_encrypted ? decryptValue(row.email_encrypted) : Promise.resolve(null),
      row.phone_encrypted ? decryptValue(row.phone_encrypted) : Promise.resolve(null)
    ])

  if (suburbResult.error) {
    throw new Error(`Failed to load business suburb: ${suburbResult.error.message}`)
  }

  const primaryService =
    row.service_type_primary ??
    services.find((service) => service.is_primary)?.service_type ??
    services[0]?.service_type

  if (!primaryService) {
    throw new Error('Owned business profile is missing a primary service.')
  }

  const profileWithoutCompleteness = {
    businessId: row.id,
    businessName: row.name,
    businessPhone: businessPhone ?? '',
    businessEmail: businessEmail ?? '',
    website: row.website ?? '',
    address: row.address ?? '',
    suburbName: suburbResult.data?.name ?? '',
    suburbPostcode: suburbResult.data?.postcode ?? '',
    bio: row.bio ?? '',
    pricing: row.pricing ?? '',
    verificationStatus: row.verification_status,
    abnVerified: row.abn_verified === true,
    featuredUntil: row.featured_until ?? null,
    isActive: row.is_active !== false,
    updatedAt: row.updated_at ?? null,
    primaryService,
    secondaryServices: services
      .map((service) => service.service_type)
      .filter((service) => service !== primaryService),
    ages: ages.map((age) => age.age_specialty),
    issues: issues.map((issue) => issue.behavior_issue)
  }

  return {
    ...profileWithoutCompleteness,
    completeness: evaluateBusinessProfileCompleteness(profileWithoutCompleteness)
  }
}

export async function saveOwnedBusinessProfile(
  userId: string,
  businessId: number,
  input: BusinessProfileUpdateInput
): Promise<OwnedBusinessProfile | null> {
  const [encryptedEmail, encryptedPhone] = await Promise.all([
    input.businessEmail ? encryptValue(input.businessEmail) : Promise.resolve(null),
    input.businessPhone ? encryptValue(input.businessPhone) : Promise.resolve(null)
  ])

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .update({
      name: input.businessName,
      website: input.website ?? null,
      address: input.address ?? null,
      bio: input.bio ?? null,
      pricing: input.pricing ?? null,
      email: null,
      phone: null,
      email_encrypted: encryptedEmail,
      phone_encrypted: encryptedPhone,
      service_type_primary: input.primaryService
    })
    .eq('id', businessId)
    .eq('profile_id', userId)
    .eq('is_deleted', false)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update business profile: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const replaceRelationRows = async (
    table: 'trainer_services' | 'trainer_specializations' | 'trainer_behavior_issues',
    rows: Record<string, unknown>[]
  ) => {
    const deleteResult = await supabaseAdmin.from(table).delete().eq('business_id', businessId)
    if (deleteResult.error) {
      throw new Error(`Failed to reset ${table}: ${deleteResult.error.message}`)
    }

    if (rows.length === 0) {
      return
    }

    const insertResult = await supabaseAdmin.from(table).insert(rows)
    if (insertResult.error) {
      throw new Error(`Failed to save ${table}: ${insertResult.error.message}`)
    }
  }

  await Promise.all([
    replaceRelationRows(
      'trainer_services',
      [
        { business_id: businessId, service_type: input.primaryService, is_primary: true },
        ...input.secondaryServices.map((serviceType) => ({
          business_id: businessId,
          service_type: serviceType,
          is_primary: false
        }))
      ]
    ),
    replaceRelationRows(
      'trainer_specializations',
      input.ages.map((age) => ({
        business_id: businessId,
        age_specialty: age
      }))
    ),
    replaceRelationRows(
      'trainer_behavior_issues',
      input.issues.map((issue) => ({
        business_id: businessId,
        behavior_issue: issue
      }))
    )
  ])

  return getOwnedBusinessProfile(userId, businessId)
}

export function formatServiceLabel(value: ServiceType): string {
  return SERVICE_TYPE_LABELS[value]
}

export function formatAgeLabel(value: AgeSpecialty): string {
  return AGE_SPECIALTY_LABELS[value]
}

export function formatIssueLabel(value: BehaviorIssue): string {
  return BEHAVIOR_ISSUE_LABELS[value]
}
