import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import SearchAutocomplete from '@/components/SearchAutocomplete'
import { SearchResult } from '@/lib/api'

export const revalidate = 600

type DirectoryRegion = {
  name: string
  trainers: SearchResult[]
}

export async function fetchDirectoryRegions(): Promise<DirectoryRegion[]> {
  const { data, error } = await supabaseAdmin.rpc('search_trainers', {
    user_lat: null,
    user_lng: null,
    distance_filter: 'any',
    result_limit: 500,
    result_offset: 0,
    p_key: process.env.SUPABASE_PGCRYPTO_KEY ?? null
  })

  if (error) {
    console.error('Directory query failed', error)
    return []
  }

  const grouped = new Map<string, SearchResult[]>()

  for (const trainer of data || []) {
    const region = trainer.region || 'Greater Melbourne'
    if (!grouped.has(region)) grouped.set(region, [])
    grouped.get(region)!.push(trainer as SearchResult)
  }

  const sections: DirectoryRegion[] = Array.from(grouped.entries())
    .map(([name, trainers]) => ({
      name,
      trainers: trainers.sort((a, b) => {
        if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        }
        if ((b.abn_verified ? 1 : 0) !== (a.abn_verified ? 1 : 0)) {
          return (b.abn_verified ? 1 : 0) - (a.abn_verified ? 1 : 0)
        }
        return (b.average_rating || 0) - (a.average_rating || 0)
      })
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return sections
}

const formatTag = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default async function DirectoryPage() {
  const regions = await fetchDirectoryRegions()

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold">Browse by area</p>
          <h1 className="text-4xl font-bold text-gray-900">Melbourne Dog Trainers Directory</h1>
          <p className="text-lg text-gray-600">
            Browse verified trainers by region, explore featured placements, or jump straight to a profile using the search box below.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchAutocomplete />
          </div>
        </header>

        {regions.length === 0 ? (
          <div className="card text-center">
            <h2 className="text-2xl font-semibold text-gray-900">No directory listings yet</h2>
            <p className="mt-3 text-gray-600">
              There are no trainer profiles available to browse right now.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try a suburb search to check nearby options, or add your business to create the next
              listing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Try search instead
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Add your business
              </Link>
            </div>
          </div>
        ) : (
          regions.map((region) => (
            <details key={region.name} open className="card space-y-4">
              <summary className="cursor-pointer text-xl font-semibold text-gray-900 flex items-center justify-between">
                <span>{region.name}</span>
                <span className="text-sm text-gray-500">{region.trainers.length} trainers</span>
              </summary>
              <div className="space-y-4">
                {region.trainers.map((trainer) => (
                  <div key={trainer.business_id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                          {trainer.business_name}
                          {trainer.is_featured && <span className="badge badge-gold">🏆 Featured</span>}
                          {trainer.abn_verified && <span className="badge badge-blue">✓ Verified</span>}
                        </div>
                        <p className="text-sm text-gray-600">
                          {trainer.suburb_name} · {trainer.council_name}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        ⭐ {trainer.average_rating?.toFixed(1) ?? 'N/A'} ({trainer.review_count} reviews)
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {trainer.age_specialties.slice(0, 3).map((age) => (
                        <span key={age} className="badge badge-blue">
                          {formatTag(age)}
                        </span>
                      ))}
                      {trainer.behavior_issues.slice(0, 3).map((issue) => (
                        <span key={issue} className="badge badge-orange">
                          {formatTag(issue)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href={`/trainers/${trainer.business_id}`} className="btn-primary">
                        View profile
                      </Link>
                      {trainer.business_website && (
                        <a href={trainer.business_website} target="_blank" rel="noreferrer" className="btn-outline">
                          Website
                        </a>
                      )}
                      {trainer.business_phone && (
                        <a href={`tel:${trainer.business_phone}`} className="btn-secondary">
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </main>
  )
}
