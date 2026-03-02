import type { Metadata } from 'next'
import { getSearchLandingContent } from './landing'

export function generateSearchMetadata(params: URLSearchParams): Metadata {
  const landingContent = getSearchLandingContent(params)

  return {
    title: landingContent.metadataTitle,
    description: landingContent.metadataDescription,
    openGraph: {
      title: landingContent.metadataTitle,
      description: landingContent.metadataDescription,
      type: 'website',
      url: landingContent.canonicalPath,
      siteName: 'Dog Trainers Directory Melbourne'
    },
    alternates: {
      canonical: landingContent.canonicalPath
    }
  }
}

export function generateResultsStructuredData(params: URLSearchParams) {
  const landingContent = getSearchLandingContent(params)
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const fullUrl = baseUrl ? `${baseUrl}${landingContent.canonicalPath}` : landingContent.canonicalPath
  const suburbName = (params.get('suburbName') || '').trim()

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: landingContent.metadataTitle,
    description: landingContent.metadataDescription,
    url: fullUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Dog Trainers Directory Melbourne',
      url: baseUrl || undefined
    },
    about: {
      '@type': 'Service',
      name: landingContent.contextLabel || 'Dog training services'
    },
    areaServed: suburbName
      ? {
          '@type': 'Place',
          name: suburbName
        }
      : {
          '@type': 'AdministrativeArea',
          name: 'Melbourne'
        },
    keywords: landingContent.keywords
  }
}
