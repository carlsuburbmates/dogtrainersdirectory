import {
  isValidAgeSpecialty,
  isValidBehaviorIssue,
  isValidServiceType
} from '@/lib/constants/taxonomies'

export type OnboardingPayloadError = {
  code:
    | 'missing_fields'
    | 'invalid_primary_service'
    | 'invalid_ages'
    | 'invalid_issues'
    | 'invalid_secondary_services'
  message: string
  fields: string[]
  invalidValues?: unknown[]
}

export type OnboardingPayload = {
  email: string
  password: string
  fullName?: string
  businessName: string
  businessPhone?: string
  businessEmail?: string
  website?: string
  address?: string
  suburbId: number
  bio?: string
  pricing?: string
  ages: string[]
  issues: string[]
  primaryService: string
  secondaryServices: string[]
  abn: string
}

type RawOnboardingPayload = Partial<{
  email: unknown
  password: unknown
  fullName: unknown
  businessName: unknown
  businessPhone: unknown
  businessEmail: unknown
  website: unknown
  address: unknown
  suburbId: unknown
  suburb_id: unknown
  bio: unknown
  pricing: unknown
  ages: unknown
  issues: unknown
  primaryService: unknown
  primary_service: unknown
  secondaryServices: unknown
  secondary_services: unknown
  abn: unknown
}>

const readString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const readOptionalString = (value: unknown) => {
  const normalized = readString(value)
  return normalized || undefined
}

const readStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return { values: [] as string[], invalidValues: [] as unknown[] }
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

const parseSuburbId = (primaryValue: unknown, aliasValue: unknown) => {
  const raw = primaryValue ?? aliasValue
  if (raw === undefined || raw === null || raw === '') {
    return 0
  }

  const numeric = Number(raw)
  return Number.isInteger(numeric) ? numeric : 0
}

const validateEnumArray = (
  values: string[],
  invalidValues: unknown[],
  validator: (value: string) => boolean
) => {
  const rejected: unknown[] = [...invalidValues]

  for (const value of values) {
    if (!validator(value)) {
      rejected.push(value)
    }
  }

  return rejected
}

export const parseOnboardingPayload = (
  body: RawOnboardingPayload
): { ok: true; data: OnboardingPayload } | { ok: false; error: OnboardingPayloadError } => {
  const email = readString(body.email)
  const password = readString(body.password)
  const fullName = readOptionalString(body.fullName)
  const businessName = readString(body.businessName)
  const businessPhone = readOptionalString(body.businessPhone)
  const businessEmail = readOptionalString(body.businessEmail)
  const website = readOptionalString(body.website)
  const address = readOptionalString(body.address)
  const suburbId = parseSuburbId(body.suburbId, body.suburb_id)
  const bio = readOptionalString(body.bio)
  const pricing = readOptionalString(body.pricing)
  const abn = readString(body.abn)
  const primaryService = readString(body.primaryService ?? body.primary_service)

  const rawAges = readStringArray(body.ages)
  const rawIssues = readStringArray(body.issues)
  const rawSecondaryServices = readStringArray(
    body.secondaryServices ?? body.secondary_services
  )

  const missingFields = [
    !email && 'email',
    !password && 'password',
    !businessName && 'businessName',
    !abn && 'abn',
    (!Number.isInteger(suburbId) || suburbId <= 0) && 'suburbId',
    !primaryService && 'primaryService'
  ].filter(Boolean) as string[]

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'missing_fields',
        message: 'Missing required fields',
        fields: missingFields
      }
    }
  }

  if (!isValidServiceType(primaryService)) {
    return {
      ok: false,
      error: {
        code: 'invalid_primary_service',
        message: 'Invalid primaryService',
        fields: ['primaryService'],
        invalidValues: [primaryService]
      }
    }
  }

  const invalidAges = validateEnumArray(
    rawAges.values,
    rawAges.invalidValues,
    isValidAgeSpecialty
  )
  if (invalidAges.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_ages',
        message: 'Invalid ages',
        fields: ['ages'],
        invalidValues: invalidAges
      }
    }
  }

  const invalidIssues = validateEnumArray(
    rawIssues.values,
    rawIssues.invalidValues,
    isValidBehaviorIssue
  )
  if (invalidIssues.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_issues',
        message: 'Invalid issues',
        fields: ['issues'],
        invalidValues: invalidIssues
      }
    }
  }

  const invalidSecondaryServices = validateEnumArray(
    rawSecondaryServices.values,
    rawSecondaryServices.invalidValues,
    isValidServiceType
  )
  if (invalidSecondaryServices.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_secondary_services',
        message: 'Invalid secondaryServices',
        fields: ['secondaryServices'],
        invalidValues: invalidSecondaryServices
      }
    }
  }

  return {
    ok: true,
    data: {
      email,
      password,
      fullName,
      businessName,
      businessPhone,
      businessEmail,
      website,
      address,
      suburbId,
      bio,
      pricing,
      ages: rawAges.values,
      issues: rawIssues.values,
      primaryService,
      secondaryServices: rawSecondaryServices.values,
      abn
    }
  }
}
