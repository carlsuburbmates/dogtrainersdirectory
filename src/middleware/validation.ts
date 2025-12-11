import { NextRequest, NextResponse } from 'next/server'
import { validateAgeSpecialtiesArray, validateBehaviorIssuesArray } from '@/types/database'
import { normalizePhone, normalizeEmail,normalizeAddress } from '@/utils/normalize'

// Validation middleware to ensure clean, consistent profile data
// Used in onboarding and profile update flows

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
  normalized?: {
    phone?: string
    email?: string
    address?: string
  }
}

/**
 * Middleware to validate and normalize trainer profile submission data
 * Returns early with 400 status if validation fails
 */
export async function validateProfileData(
  data: Record<string, any>
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const normalized: Record<string, string> = {}

  // 1. Phone number validation + normalization
  if (data.phone) {
    const phoneResult = normalizePhone(data.phone)
    if (!phoneResult.valid) {
      errors.push({
        field: 'phone',
        message: phoneResult.reason || 'Invalid phone number',
        code: 'INVALID_PHONE'
      })
    } else {
      normalized.phone = phoneResult.value!
    }
  }

  // 2. Email validation + normalization
  if (data.email) {
    const emailResult = normalizeEmail(data.email)
    if (!emailResult.valid) {
      errors.push({
        field: 'email',
        message: 'Invalid email address',
        code: 'INVALID_EMAIL'
      })
    } else {
      normalized.email = emailResult.value!
    }
  }

  // 3. Address validation + normalization
  if (data.address) {
    const addressResult = normalizeAddress(data.address)
    if (!addressResult.valid) {
      errors.push({
        field: 'address',
        message: 'Invalid address format',
        code: 'INVALID_ADDRESS'
      })
    } else {
      normalized.address = addressResult.value!
    }
  }

  // 4. Age specialties validation (array)
  if (data.age_specialties && Array.isArray(data.age_specialties)) {
    try {
      validateAgeSpecialtiesArray(data.age_specialties)
    } catch (e: any) {
      errors.push({
        field: 'age_specialties',
        message: e.message || 'Invalid age specialty',
        code: 'INVALID_AGE_SPECIALTY'
      })
      
      // Log validation error
      try {
        const { logValidationError } = await import('../lib/errorLog')
        await logValidationError('age_specialties', e.message || 'Invalid age specialty', data.age_specialties)
      } catch (logError) {
        console.error('Failed to log validation error:', logError)
      }
    }
  }

  // 5. Behavior issues validation (array)
  if (data.behaviour_issues && Array.isArray(data.behaviour_issues)) {
    try {
      validateBehaviorIssuesArray(data.behaviour_issues)
    } catch (e: any) {
      errors.push({
        field: 'behaviour_issues',
        message: e.message || 'Invalid behavior issue',
        code: 'INVALID_BEHAVIOR_ISSUE'
      })
      
      // Log validation error
      try {
        const { logValidationError } = await import('../lib/errorLog')
        await logValidationError('behaviour_issues', e.message || 'Invalid behavior issue', data.behaviour_issues)
      } catch (logError) {
        console.error('Failed to log validation error:', logError)
      }
    }
  }

  // 6. Service type validation
  if (data.service_type_primary) {
    try {
      const serviceTypes = Array.isArray(data.service_type_primary) 
        ? data.service_type_primary 
        : [data.service_type_primary]
      for (const service of serviceTypes) {
        // Check against valid service types
        const validServices = ['puppy_training', 'obedience_training', 'behaviour_consultations', 'group_classes', 'private_training']
        if (!validServices.includes(service)) {
          throw new Error(`Invalid service type: ${service}`)
        }
      }
    } catch (e: any) {
      errors.push({
        field: 'service_type_primary',
        message: e.message || 'Invalid service type',
        code: 'INVALID_SERVICE_TYPE'
      })
      
      // Log validation error
      try {
        const { logValidationError } = await import('../lib/errorLog')
        await logValidationError('service_type_primary', e.message || 'Invalid service type', data.service_type_primary)
      } catch (logError) {
        console.error('Failed to log validation error:', logError)
      }
    }
  }

  // Return results
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      normalized
    }
  }

  return {
    valid: true,
    normalized
  }
}

/**
 * Next.js middleware to intercept and validate profile submissions
 */
export function withValidation() {
  return async function (request: NextRequest) {
    // Only apply to profile update or creation routes
    const { pathname } = request.nextUrl
    if (!pathname.startsWith('/api/trainer') || !(pathname.endsWith('/route.ts') || pathname.includes('/profile'))) {
      return NextResponse.next()
    }

    if (request.method !== 'POST' && request.method !== 'PUT') {
      return NextResponse.next()
    }

    // Clone the request body to be able to read it
    const contentType = request.headers.get('content-type') ?? ''
    let body: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      try {
        const bodyText = await request.text()
        body = JSON.parse(bodyText)
      } catch (error) {
        return Response.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        )
      }
    }

    // Validate the data
    const validation = await validateProfileData(body)

    if (!validation.valid) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validation.errors,
          normalized: validation.normalized
        },
        { status: 400 }
      )
    }

    // Add normalized data to request headers for downstream processing
    const requestHeaders = new Headers(request.headers)
    if (validation.normalized) {
      requestHeaders.set('x-normalized-phone', JSON.stringify(validation.normalized))
    }

    // Return the modified request with normalized data
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }
}
