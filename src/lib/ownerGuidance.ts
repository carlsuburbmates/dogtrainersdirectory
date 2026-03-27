import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS
} from '@/lib/constants/taxonomies'

const ageSpecialtySet = new Set<string>(AGE_SPECIALTIES)
const behaviorIssueSet = new Set<string>(BEHAVIOR_ISSUES)
const serviceTypeSet = new Set<string>(SERVICE_TYPES)

const distanceLabels: Record<string, string> = {
  any: 'any distance',
  '0-5': 'within 5 km',
  '5-15': 'within 15 km',
  greater: '15 km or more'
}

const lowerFirst = (value: string) => {
  if (!value) {
    return value
  }

  return value.charAt(0).toLowerCase() + value.slice(1)
}

const parseAllowedList = (params: URLSearchParams, key: string, allowedValues: Set<string>) => {
  const rawValue = params.get(key)

  if (!rawValue) {
    return []
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value && allowedValues.has(value))
}

const buildListSummary = (values: string[]) => {
  if (values.length === 0) {
    return null
  }

  if (values.length === 1) {
    return values[0]
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }

  return `${values[0]}, ${values[1]}, and ${values.length - 2} more`
}

export type OwnerSearchContext = {
  flowSource: string | null
  query: string | null
  suburbName: string | null
  distanceLabel: string | null
  serviceType: string | null
  serviceLabel: string | null
  ageSpecialties: string[]
  ageLabels: string[]
  behaviorIssues: string[]
  behaviorLabels: string[]
  verifiedOnly: boolean
  rescueOnly: boolean
}

export type OwnerSearchExplanation = {
  reflected: string[]
  confirmNext: string[]
}

export type OwnerSearchRefinementPatch = {
  distance?: string
  ageSpecialties?: string[]
  behaviorIssues?: string[]
  serviceType?: string
  verifiedOnly?: boolean
  rescueOnly?: boolean
}

export type OwnerSearchRefinementSuggestion = {
  id: string
  title: string
  reason: string
  changeSummary: string
  actionLabel: string
  patch: OwnerSearchRefinementPatch
}

export type OwnerSearchRefinementInput = OwnerSearchContext & {
  resultCount: number
  hasMoreResults: boolean
  hasSelectedLocation: boolean
  verifiedResultCount: number
  unverifiedResultCount: number
}

export type TrainerGuidanceInput = {
  services?: string[] | null
  ageSpecialties?: string[] | null
  behaviorIssues?: string[] | null
  pricing?: string | null
  reviewCount?: number | null
  abnVerified?: boolean | null
  contactMethodCount?: number | null
}

export type TrainerFitGuidance = {
  reflected: string[]
  confirmNext: string[]
}

export type OwnerEnquiryDraftInput = {
  trainerName: string
  trainerSuburb?: string | null
  pricing?: string | null
}

export type OwnerEnquiryDraftGuidance = {
  draftMessage: string
  suggestedQuestions: string[]
}

export function getOwnerSearchContext(params: URLSearchParams): OwnerSearchContext {
  const serviceType = params.get('service_type')
  const ageSpecialties = parseAllowedList(params, 'age_specialties', ageSpecialtySet)
  const behaviorIssues = parseAllowedList(params, 'behavior_issues', behaviorIssueSet)
  const distance = params.get('distance')

  return {
    flowSource: params.get('flow_source'),
    query: (params.get('q') || params.get('query') || '').trim() || null,
    suburbName: (params.get('suburbName') || '').trim() || null,
    distanceLabel: distance ? distanceLabels[distance] || null : null,
    serviceType: serviceType && serviceTypeSet.has(serviceType) ? serviceType : null,
    serviceLabel:
      serviceType && serviceTypeSet.has(serviceType)
        ? SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS]
        : null,
    ageSpecialties,
    ageLabels: ageSpecialties.map(
      (value) => AGE_SPECIALTY_LABELS[value as keyof typeof AGE_SPECIALTY_LABELS]
    ),
    behaviorIssues,
    behaviorLabels: behaviorIssues.map(
      (value) => BEHAVIOR_ISSUE_LABELS[value as keyof typeof BEHAVIOR_ISSUE_LABELS]
    ),
    verifiedOnly: params.get('verified_only') === 'true',
    rescueOnly: params.get('rescue_only') === 'true'
  }
}

export function buildOwnerSearchExplanation(context: OwnerSearchContext): OwnerSearchExplanation {
  const reflected: string[] = []
  const confirmNext: string[] = []

  if (context.suburbName) {
    reflected.push(`This shortlist is already centred on ${context.suburbName}.`)
  }

  if (context.distanceLabel && context.distanceLabel !== 'any distance') {
    reflected.push(`Distance is already narrowed to ${context.distanceLabel}.`)
  }

  if (context.serviceLabel) {
    reflected.push(`Profiles are already filtered for ${lowerFirst(context.serviceLabel)}.`)
  }

  const ageSummary = buildListSummary(context.ageLabels.map(lowerFirst))
  if (ageSummary) {
    reflected.push(`Age support is already narrowed to ${ageSummary}.`)
  }

  const behaviourSummary = buildListSummary(context.behaviorLabels.map(lowerFirst))
  if (behaviourSummary) {
    reflected.push(`Behaviour support is already narrowed to ${behaviourSummary}.`)
  }

  if (context.verifiedOnly) {
    reflected.push('Only verified listings are included in this shortlist.')
  }

  if (context.rescueOnly) {
    reflected.push('This shortlist is already limited to rescue-friendly support.')
  }

  if (reflected.length === 0) {
    reflected.push('This shortlist already reflects the filters currently shown on the page.')
  }

  if (context.query) {
    confirmNext.push(`Use each profile to confirm how it handles "${context.query}" in practice.`)
  }

  if (context.serviceLabel || ageSummary || behaviourSummary) {
    const requestedFocus = [context.serviceLabel, ageSummary, behaviourSummary]
      .filter((value): value is string => Boolean(value))
      .map(lowerFirst)
    const focusSummary = buildListSummary(requestedFocus)

    if (focusSummary) {
      confirmNext.push(`Check that the profile clearly lists ${focusSummary}, not just general training support.`)
    }
  }

  confirmNext.push('Confirm whether pricing, availability, and the best first contact path are shown before you reach out.')

  if (!context.query && !context.serviceLabel && !ageSummary && !behaviourSummary) {
    confirmNext.push('Open two or three profiles to compare fit signals before you choose who to contact.')
  }

  return { reflected, confirmNext }
}

export function buildOwnerSearchRefinementSuggestions(
  input: OwnerSearchRefinementInput
): OwnerSearchRefinementSuggestion[] {
  const suggestions: OwnerSearchRefinementSuggestion[] = []
  const hasTopicRefinements =
    Boolean(input.serviceType) ||
    input.ageSpecialties.length > 0 ||
    input.behaviorIssues.length > 0 ||
    input.verifiedOnly ||
    input.rescueOnly
  const shortlistIsBroad = input.hasMoreResults || input.resultCount >= 8

  if (input.resultCount === 0) {
    if (input.hasSelectedLocation && input.distanceLabel && input.distanceLabel !== 'any distance') {
      suggestions.push({
        id: 'broaden-distance',
        title: 'Broaden the distance first',
        reason: 'Nothing matched inside the current distance band.',
        changeSummary: 'Keep the current suburb and topic filters, but remove the distance cap.',
        actionLabel: 'Apply broader distance',
        patch: { distance: 'any' }
      })
    }

    if (hasTopicRefinements) {
      suggestions.push({
        id: 'clear-extra-filters',
        title: 'Keep the suburb, remove extra filters',
        reason: 'The current fit filters may be too tight for this location.',
        changeSummary:
          'Keep the current suburb and search text, but clear service, age, behaviour, verified-only, and rescue-only filters.',
        actionLabel: 'Clear extra filters',
        patch: {
          ageSpecialties: [],
          behaviorIssues: [],
          serviceType: '',
          verifiedOnly: false,
          rescueOnly: false
        }
      })
    }

    return suggestions.slice(0, 2)
  }

  if (!shortlistIsBroad) {
    return suggestions
  }

  if (input.hasSelectedLocation && (!input.distanceLabel || input.distanceLabel === 'any distance')) {
    suggestions.push({
      id: 'narrow-distance',
      title: 'Start with closer trainers',
      reason: 'This shortlist is broad enough to focus nearby first.',
      changeSummary: 'Keep the current focus, but show trainers within 15 km first.',
      actionLabel: 'Limit to 15 km',
      patch: { distance: '5-15' }
    })
  }

  if (!input.verifiedOnly && input.verifiedResultCount > 0 && input.unverifiedResultCount > 0) {
    suggestions.push({
      id: 'verified-only',
      title: 'Review verified listings first',
      reason: 'This shortlist already includes verified options.',
      changeSummary: 'Keep the current focus, but hide unverified listings for the first review pass.',
      actionLabel: 'Show verified only',
      patch: { verifiedOnly: true }
    })
  }

  return suggestions.slice(0, 2)
}

export function buildOwnerEnquiryDraftGuidance(
  context: OwnerSearchContext,
  input: OwnerEnquiryDraftInput
): OwnerEnquiryDraftGuidance {
  const ageSummary = buildListSummary(context.ageLabels.map(lowerFirst))
  const behaviourSummary = buildListSummary(context.behaviorLabels.map(lowerFirst))
  const focusParts = [context.serviceLabel, ageSummary, behaviourSummary]
    .filter((value): value is string => Boolean(value))
    .map(lowerFirst)
  const focusSummary = buildListSummary(focusParts)
  const locationPhrase = input.trainerSuburb
    ? ` in or near ${input.trainerSuburb}`
    : context.suburbName
      ? ` in or near ${context.suburbName}`
      : ''

  const openingParts = [
    `Hi ${input.trainerName},`,
    '',
    `I am looking for help${locationPhrase}${
      focusSummary ? ` with ${focusSummary}` : ''
    }${context.query ? `, especially around "${context.query}"` : ''}.`,
    'I found your profile on Dog Trainers Directory and I am comparing a few options.',
    '',
    `Could you let me know whether this sounds like a good fit, what the first step would look like${
      input.pricing ? '' : ', and what your pricing looks like'
    }?`,
    '',
    'Thanks,'
  ]

  const suggestedQuestions: string[] = []

  if (context.query) {
    suggestedQuestions.push(`Have you worked with dogs needing help with "${context.query}"?`)
  }

  if (context.serviceLabel) {
    suggestedQuestions.push(`Do you offer ${lowerFirst(context.serviceLabel)} for cases like this?`)
  }

  if (ageSummary) {
    suggestedQuestions.push(`How do you tailor the work for ${ageSummary}?`)
  }

  if (behaviourSummary) {
    suggestedQuestions.push(`What approach do you use for ${behaviourSummary}?`)
  }

  if (!input.pricing) {
    suggestedQuestions.push('What does the first session cost, and what is included?')
  }

  suggestedQuestions.push('What should I prepare before the first session?')

  return {
    draftMessage: openingParts.join('\n'),
    suggestedQuestions
  }
}

export function buildTrainerFitGuidance(
  context: OwnerSearchContext,
  trainer: TrainerGuidanceInput
): TrainerFitGuidance {
  const reflected: string[] = []
  const confirmNext: string[] = []

  const trainerServices = new Set((trainer.services || []).filter(Boolean))
  const trainerAges = new Set((trainer.ageSpecialties || []).filter(Boolean))
  const trainerIssues = new Set((trainer.behaviorIssues || []).filter(Boolean))

  if (context.serviceType) {
    reflected.push(
      trainerServices.has(context.serviceType)
        ? `This profile explicitly lists ${lowerFirst(context.serviceLabel || context.serviceType)}.`
        : `This profile does not explicitly list ${lowerFirst(context.serviceLabel || context.serviceType)}.`
    )
  }

  context.ageSpecialties.forEach((value, index) => {
    const label = context.ageLabels[index]
    reflected.push(
      trainerAges.has(value)
        ? `This profile lists ${lowerFirst(label)} support.`
        : `This profile does not list ${lowerFirst(label)} support.`
    )
  })

  context.behaviorIssues.forEach((value, index) => {
    const label = context.behaviorLabels[index]
    reflected.push(
      trainerIssues.has(value)
        ? `This profile lists ${lowerFirst(label)} support.`
        : `This profile does not list ${lowerFirst(label)} support.`
    )
  })

  if (reflected.length === 0) {
    reflected.push('Use the listed services, age support, and behaviour details below to judge fit.')
  }

  if (context.query) {
    confirmNext.push(`Ask how the trainer would approach "${context.query}" for your dog.`)
  }

  if (!trainer.pricing) {
    confirmNext.push('Pricing is not shown here, so confirm cost and session format before you commit.')
  }

  if ((trainer.reviewCount || 0) === 0) {
    confirmNext.push('There are no public reviews here yet, so use profile detail and direct conversation as your proof points.')
  }

  if (!trainer.abnVerified) {
    confirmNext.push('ABN verification is not shown on this listing, so rely on the listed evidence and your direct checks.')
  }

  if ((trainer.contactMethodCount || 0) === 0) {
    confirmNext.push('Direct phone, email, or website details are not shown, so use the enquiry form if the fit still looks right.')
  } else {
    confirmNext.push('Choose the contact path that suits you best once the fit looks right.')
  }

  return { reflected, confirmNext }
}

export function buildTrainerProfileSearchParams(params: URLSearchParams): URLSearchParams {
  const nextParams = new URLSearchParams()
  const allowedKeys = [
    'q',
    'query',
    'flow_source',
    'suburbId',
    'suburbName',
    'postcode',
    'lat',
    'lng',
    'councilId',
    'distance',
    'service_type',
    'age_specialties',
    'behavior_issues',
    'verified_only',
    'rescue_only'
  ]

  allowedKeys.forEach((key) => {
    const value = params.get(key)
    if (value) {
      nextParams.set(key, value)
    }
  })

  return nextParams
}
