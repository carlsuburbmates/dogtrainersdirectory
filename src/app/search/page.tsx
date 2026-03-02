import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'
import {
  generateResultsStructuredData,
  generateSearchMetadata
} from './metadata'

type SearchPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>
}

const toUrlSearchParams = (searchParams?: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === 'string') {
          params.append(key, entry)
        }
      })
      continue
    }

    if (typeof value === 'string') {
      params.set(key, value)
    }
  }

  return params
}

const resolveSearchParams = async (
  searchParams?: SearchPageProps['searchParams']
) => {
  return (await Promise.resolve(searchParams as any)) || {}
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await resolveSearchParams(searchParams)
  return generateSearchMetadata(toUrlSearchParams(resolvedSearchParams))
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams)
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams)
  const structuredData = generateResultsStructuredData(urlSearchParams)

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SearchPageClient />
    </>
  )
}
