import { describe, expect, it } from 'vitest'
import { parseOnboardingPayload } from '@/lib/services/onboardingPayload'

describe('parseOnboardingPayload', () => {
  it('accepts canonical and alias fields after normalization', () => {
    const result = parseOnboardingPayload({
      email: ' owner@example.com ',
      password: 'secret',
      businessName: 'Calm Canines',
      suburb_id: 42,
      primary_service: 'private_training',
      secondary_services: ['group_classes'],
      ages: ['puppies_0_6m'],
      issues: ['socialisation'],
      abn: '12 345 678 901'
    })

    expect(result).toEqual({
      ok: true,
      data: {
        email: 'owner@example.com',
        password: 'secret',
        fullName: undefined,
        businessName: 'Calm Canines',
        businessPhone: undefined,
        businessEmail: undefined,
        website: undefined,
        address: undefined,
        suburbId: 42,
        bio: undefined,
        pricing: undefined,
        ages: ['puppies_0_6m'],
        issues: ['socialisation'],
        primaryService: 'private_training',
        secondaryServices: ['group_classes'],
        abn: '12 345 678 901'
      }
    })
  })

  it('fails fast when normalized required fields are missing', () => {
    const result = parseOnboardingPayload({
      email: 'owner@example.com',
      password: 'secret',
      businessName: 'Calm Canines',
      abn: '12345678901'
    })

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'missing_fields',
        message: 'Missing required fields',
        fields: ['suburbId', 'primaryService']
      }
    })
  })

  it('rejects invalid enum values before database writes', () => {
    const result = parseOnboardingPayload({
      email: 'owner@example.com',
      password: 'secret',
      businessName: 'Calm Canines',
      suburbId: 42,
      primaryService: 'invalid-service',
      abn: '12345678901'
    })

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'invalid_primary_service',
        message: 'Invalid primaryService',
        fields: ['primaryService'],
        invalidValues: ['invalid-service']
      }
    })
  })
})
