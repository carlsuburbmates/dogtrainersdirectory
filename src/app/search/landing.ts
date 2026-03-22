import {
  AGE_SPECIALTIES,
  AGE_SPECIALTY_LABELS,
  BEHAVIOR_ISSUES,
  BEHAVIOR_ISSUE_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS
} from '@/lib/constants/taxonomies'

export interface SearchLandingContent {
  eyebrow: string
  heading: string
  description: string
  resultsDescription: string
  metadataTitle: string
  metadataDescription: string
  canonicalPath: string
  contextLabel: string | null
  hasLandingIntent: boolean
  keywords: string[]
}

export interface SearchDiscoveryLink {
  href: string
  label: string
}

const ageSpecialtySet = new Set<string>(AGE_SPECIALTIES)
const behaviorIssueSet = new Set<string>(BEHAVIOR_ISSUES)
const serviceTypeSet = new Set<string>(SERVICE_TYPES)

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

const lowerFirst = (value: string) => {
  if (!value) {
    return value
  }

  return value.charAt(0).toLowerCase() + value.slice(1)
}

const summariseLabels = (labels: string[]) => {
  if (labels.length === 0) {
    return null
  }

  if (labels.length === 1) {
    return lowerFirst(labels[0])
  }

  if (labels.length === 2) {
    return `${lowerFirst(labels[0])} and ${lowerFirst(labels[1])}`
  }

  return `${lowerFirst(labels[0])}, ${lowerFirst(labels[1])}, and more`
}

const buildCanonicalPath = (params: URLSearchParams) => {
  const query = params.toString()
  return `/search${query ? `?${query}` : ''}`
}

export function getSearchLandingContent(params: URLSearchParams): SearchLandingContent {
  const query = (params.get('q') || params.get('query') || '').trim()
  const suburbName = (params.get('suburbName') || '').trim()
  const serviceType = params.get('service_type') || ''
  const flowSource = (params.get('flow_source') || '').trim()
  const ageSpecialties = parseAllowedList(params, 'age_specialties', ageSpecialtySet)
  const behaviorIssues = parseAllowedList(params, 'behavior_issues', behaviorIssueSet)

  const serviceLabel = serviceTypeSet.has(serviceType)
    ? SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS]
    : null
  const ageLabels = ageSpecialties.map(
    (value) => AGE_SPECIALTY_LABELS[value as keyof typeof AGE_SPECIALTY_LABELS]
  )
  const behaviorLabels = behaviorIssues.map(
    (value) => BEHAVIOR_ISSUE_LABELS[value as keyof typeof BEHAVIOR_ISSUE_LABELS]
  )
  const topicSummary = summariseLabels([...ageLabels, ...behaviorLabels])
  const hasLandingIntent = Boolean(suburbName || serviceLabel || topicSummary || query)

  const contextParts: string[] = []
  if (serviceLabel) {
    contextParts.push(serviceLabel)
  } else {
    contextParts.push('Dog trainers')
  }
  if (suburbName) {
    contextParts.push(`in ${suburbName}`)
  } else {
    contextParts.push('across Melbourne')
  }
  if (topicSummary) {
    contextParts.push(`for ${topicSummary}`)
  }

  const contextLabel = hasLandingIntent ? contextParts.join(' ') : null
  const isTriageFlow = flowSource === 'triage'
  const eyebrow = isTriageFlow
    ? 'Guided triage shortlist'
    : suburbName
      ? `${suburbName} search`
      : serviceLabel
        ? `${serviceLabel} search`
        : topicSummary
          ? 'Needs-based search'
          : 'Trainer discovery'
  const heading = query
    ? `Search results for "${query}"`
    : isTriageFlow && contextLabel
      ? `Triage narrowed this shortlist to ${lowerFirst(contextLabel)}`
      : contextLabel || 'Compare Melbourne trainers with your shortlist already narrowed.'

  const detailParts: string[] = []
  if (suburbName) {
    detailParts.push(`in ${suburbName}`)
  }
  if (serviceLabel) {
    detailParts.push(`for ${lowerFirst(serviceLabel)}`)
  }
  if (topicSummary) {
    detailParts.push(`with filters for ${topicSummary}`)
  }

  const focusSentence = detailParts.length > 0
    ? `This page is already focused ${detailParts.join(' ')}.`
    : 'Use the filters to tighten fit, then move quickly into a profile with clearer trust cues and direct contact options.'

  const description = isTriageFlow
    ? `${focusSentence} This shortlist started from guided triage and still uses the usual search route and ranking. Compare a few profiles, then open one to confirm fit and contact options.`
    : `${focusSentence} Review verification, ratings, and direct contact options before you reach out.`
  const resultsDescription = isTriageFlow
    ? contextLabel
      ? `This shortlist started from guided triage for ${lowerFirst(contextLabel)}. Compare a few profiles first, then open one to confirm fit and contact details.`
      : 'This shortlist started from guided triage. Compare a few profiles first, then open one to confirm fit and contact details.'
    : contextLabel
      ? `This shortlist is already filtered for ${lowerFirst(contextLabel)}. Prioritise verified fit, then move to a full profile for proof and contact details.`
      : 'Prioritise verified fit, then move to a full profile for contact details and proof.'
  const metadataTitle = contextLabel
    ? `${contextLabel} | Dog Trainers Directory Melbourne`
    : query
      ? `Search dog trainers for ${query} | Dog Trainers Directory Melbourne`
      : 'Dog Trainers Directory Melbourne'
  const metadataDescription = contextLabel
    ? `Compare ${lowerFirst(contextLabel)}. Review verification, ratings, and direct contact options before you reach out.`
    : query
      ? `Search Melbourne dog trainers for ${query}. Review verification, ratings, and direct contact options before you reach out.`
      : 'Find qualified dog trainers, behaviour consultants, and emergency resources across Melbourne metropolitan area.'
  const keywords = [suburbName, serviceLabel, ...ageLabels, ...behaviorLabels, query]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)

  return {
    eyebrow,
    heading,
    description,
    resultsDescription,
    metadataTitle,
    metadataDescription,
    canonicalPath: buildCanonicalPath(params),
    contextLabel,
    hasLandingIntent,
    keywords
  }
}

export function getSearchDiscoveryLinks(params: URLSearchParams): SearchDiscoveryLink[] {
  const links: SearchDiscoveryLink[] = []
  const suburbName = (params.get('suburbName') || '').trim()
  const serviceType = params.get('service_type') || ''
  const ageSpecialties = parseAllowedList(params, 'age_specialties', ageSpecialtySet)
  const behaviorIssues = parseAllowedList(params, 'behavior_issues', behaviorIssueSet)

  if (suburbName && params.get('lat') && params.get('lng')) {
    const suburbParams = new URLSearchParams()
    ;['suburbId', 'suburbName', 'postcode', 'lat', 'lng', 'councilId'].forEach((key) => {
      const value = params.get(key)
      if (value) {
        suburbParams.set(key, value)
      }
    })
    links.push({
      href: `/search?${suburbParams.toString()}`,
      label: `Browse all trainers in ${suburbName}`
    })
  }

  if (serviceTypeSet.has(serviceType)) {
    const serviceLabel = SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS]
    links.push({
      href: `/search?service_type=${encodeURIComponent(serviceType)}`,
      label: `Browse ${lowerFirst(serviceLabel)} across Melbourne`
    })
  }

  if (ageSpecialties.length > 0) {
    const firstAge = ageSpecialties[0] as keyof typeof AGE_SPECIALTY_LABELS
    links.push({
      href: `/search?age_specialties=${encodeURIComponent(ageSpecialties[0])}`,
      label: `See ${lowerFirst(AGE_SPECIALTY_LABELS[firstAge])} specialists`
    })
  }

  if (behaviorIssues.length > 0) {
    const firstIssue = behaviorIssues[0] as keyof typeof BEHAVIOR_ISSUE_LABELS
    links.push({
      href: `/search?behavior_issues=${encodeURIComponent(behaviorIssues[0])}`,
      label: `See help for ${lowerFirst(BEHAVIOR_ISSUE_LABELS[firstIssue])}`
    })
  }

  links.push({
    href: '/directory',
    label: 'Browse the full directory'
  })

  const seen = new Set<string>()
  return links.filter((link) => {
    if (seen.has(link.href)) {
      return false
    }
    seen.add(link.href)
    return true
  })
}
