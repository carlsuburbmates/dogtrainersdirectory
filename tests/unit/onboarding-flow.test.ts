import { describe, expect, test } from 'vitest'
import { validateOnboardingStep } from '@/lib/onboardingFlow'
import type { OnboardingFormState } from '@/lib/onboardingFlow'

const baseForm: OnboardingFormState = {
  email: 'trainer@example.com',
  password: 'password123',
  fullName: 'Taylor Trainer',
  businessName: 'Paws Academy',
  businessPhone: '0400000000',
  businessEmail: 'hello@paws.example',
  website: '',
  address: '123 Example Street',
  suburbId: 101,
  bio: '',
  pricing: '',
  ages: ['adult_18m_7y'],
  issues: [],
  primaryService: 'puppy_training',
  secondaryServices: [],
  abn: '12345678901'
}

describe('validateOnboardingStep', () => {
  test('requires email and minimum password on account step', () => {
    expect(
      validateOnboardingStep('account', {
        ...baseForm,
        email: ''
      })
    ).toBe('Enter an account email before continuing.')

    expect(
      validateOnboardingStep('account', {
        ...baseForm,
        password: 'short'
      })
    ).toBe('Use a password with at least 8 characters.')
  })

  test('requires abn and suburb on business step', () => {
    expect(
      validateOnboardingStep('business', {
        ...baseForm,
        businessName: ''
      })
    ).toBe('Enter your business name before continuing.')

    expect(
      validateOnboardingStep('business', {
        ...baseForm,
        abn: ''
      })
    ).toBe('Enter your ABN before continuing.')

    expect(
      validateOnboardingStep('business', {
        ...baseForm,
        suburbId: 0
      })
    ).toBe('Select a valid suburb before continuing.')
  })

  test('requires at least one age specialty on services step', () => {
    expect(
      validateOnboardingStep('services', {
        ...baseForm,
        ages: []
      })
    ).toBe('Select at least one age specialty before continuing.')
  })

  test('accepts valid data for each step', () => {
    expect(validateOnboardingStep('account', baseForm)).toBeNull()
    expect(validateOnboardingStep('business', baseForm)).toBeNull()
    expect(validateOnboardingStep('services', baseForm)).toBeNull()
  })
})
