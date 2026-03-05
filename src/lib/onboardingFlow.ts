import type { AgeSpecialty, BehaviorIssue } from '@/types/database'

export type OnboardingStepKey = 'account' | 'business' | 'services' | 'review'

export type OnboardingFormState = {
  email: string
  password: string
  fullName: string
  businessName: string
  businessPhone: string
  businessEmail: string
  website: string
  address: string
  suburbId: number
  bio: string
  pricing: string
  ages: AgeSpecialty[]
  issues: BehaviorIssue[]
  primaryService: string
  secondaryServices: string[]
  abn: string
}

export const onboardingSteps: Array<{ key: OnboardingStepKey; label: string; helper: string }> = [
  { key: 'account', label: 'Account', helper: 'Set your sign-in details' },
  { key: 'business', label: 'Business', helper: 'Add listing and location details' },
  { key: 'services', label: 'Service profile', helper: 'Describe fit and services' },
  { key: 'review', label: 'Review', helper: 'Check and submit your listing' }
]

export const validateOnboardingStep = (
  step: OnboardingStepKey,
  form: OnboardingFormState
): string | null => {
  if (step === 'account') {
    if (!form.email.trim()) return 'Enter an account email before continuing.'
    if (!form.password || form.password.length < 8) {
      return 'Use a password with at least 8 characters.'
    }
    return null
  }

  if (step === 'business') {
    if (!form.businessName.trim()) return 'Enter your business name before continuing.'
    if (!form.abn.trim()) return 'Enter your ABN before continuing.'
    if (!form.suburbId) return 'Select a valid suburb before continuing.'
    return null
  }

  if (step === 'services') {
    if (!form.ages.length) return 'Select at least one age specialty before continuing.'
    return null
  }

  return null
}
