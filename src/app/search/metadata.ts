import { AGE_SPECIALTY_LABELS, BEHAVIOR_ISSUE_LABELS } from '@/lib/constants/taxonomies'
import type { AgeSpecialty, BehaviorIssue } from '@/types/database'
import type { Metadata } from 'next'

export interface SearchParams {
  age?: string
  issues?: string
  suburbId?: string
  radius?: string
  sortBy?: string
}

// Server-side SEO metadata based on query params
export function generateSearchMetadata(params: URLSearchParams): Metadata {
  const age = params.get('age') as AgeSpecialty | null
  const issuesStr = params.get('issues') || ''
  const suburbId = params.get('suburbId') ? Number(params.get('suburbId')) : null
  const radius = params.get('radius') ? Number(params.get('radius')) : 15

  const issues = issuesStr.split(',').filter(Boolean) as BehaviorIssue[]
  const titleParts = []
  const descriptionParts = []

  if (age && AGE_SPECIALTY_LABELS[age]) {
    titleParts.push(`${AGE_SPECIALTY_LABELS[age]} trainers`)
    descriptionParts.push(AGE_SPECIALTY_LABELS[age])
  }
  if (issues.length > 0) {
    const issueLabels = issues.slice(0, 3).map(i => BEHAVIOR_ISSUE_LABELS[i].toLowerCase())
    titleParts.push(issueLabels.join(', '))
    descriptionParts.push(issueLabels.join(', '))
  }
  if (suburbId) {
    // TODO: fetch suburb name from API or include cache; for now keep generic
    titleParts.push('near Melbourne')
  }
  const title = titleParts.length ? titleParts.join(' – ') : 'Dog Trainers Directory Melbourne'
  const description = descriptionParts.length
    ? `Find qualified dog trainers in Melbourne specializing in ${descriptionParts.join(' and ')} within ${radius} km. Verified ratings, reviews, and contact info.`
    : 'Find qualified dog trainers, behavior consultants, and emergency resources across Melbourne metropolitan area.'

  const url = `/search${params.toString() ? `?${params.toString()}` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'Dog Trainers Directory Melbourne',
    },
    alternates: {
      canonical: url,
    },
  }
}

// JSON-LD for results aggregation (SEO)
export function generateResultsStructuredData(count: number, suburbId?: number | null) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  const offers = Array.from({ length: count }, (_, i) => ({
    '@type': 'Offer',
    priceCurrency: 'AUD',
    price: '100', // placeholder; should come from data
    itemOffered: {
      '@type': 'Service',
      name: 'Dog training services',
      areaServed: suburbId ? { '@type': 'Place', identifier: suburbId } : undefined,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    priceCurrency: 'AUD',
    lowPrice: '80',
    highPrice: '250',
    itemOffered: {
      '@type': 'Service',
      name: 'Dog Training Services in Melbourne',
      offers: offers,
    },
    areaServed: suburbId ? { '@type': 'Place', identifier: suburbId } : undefined,
  }
}