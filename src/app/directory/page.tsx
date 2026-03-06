import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import SearchAutocomplete from '@/components/SearchAutocomplete'
import { Badge, Card, Chip, StateCard } from '@/components/ui/primitives'
import { SearchResult } from '@/lib/api'

export const revalidate = 600

type DirectoryRegion = {
  name: string
  trainers: SearchResult[]
}

type DirectoryFetchResult =
  | {
      status: 'success'
      regions: DirectoryRegion[]
    }
  | {
      status: 'failure'
      error: string
    }

export async function fetchDirectoryRegions(): Promise<DirectoryFetchResult> {
  let data: SearchResult[] | null = null

  try {
    const response = await supabaseAdmin.rpc('search_trainers', {
      user_lat: null,
      user_lng: null,
      distance_filter: 'any',
      result_limit: 500,
      result_offset: 0,
      p_key: process.env.SUPABASE_PGCRYPTO_KEY ?? null
    })

    if (response.error) {
      console.error('Directory query failed', response.error)
      return {
        status: 'failure',
        error: 'We could not load directory listings right now.'
      }
    }

    data = response.data as SearchResult[] | null
  } catch (error) {
    console.error('Directory query failed before data could load', error)
    return {
      status: 'failure',
      error: 'We could not load directory listings right now.'
    }
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

  return {
    status: 'success',
    regions: sections
  }
}

const formatTag = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default async function DirectoryPage() {
  const directoryResult = await fetchDirectoryRegions()

  return (
    <main className="public-page-shell">
      <div className="shell-container py-8 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <Card as="section" className="shell-surface p-6 sm:p-8 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--ds-accent-primary))] font-semibold">
              Browse by area
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[hsl(var(--ds-text-primary))]">
              Melbourne Dog Trainers Directory
            </h1>
            <p className="mt-3 text-base text-[hsl(var(--ds-text-secondary))]">
              Browse verified trainers by region, explore featured placements, or jump straight to a profile.
            </p>
            <div className="mx-auto mt-5 max-w-2xl">
              <SearchAutocomplete />
            </div>
          </Card>

          {directoryResult.status === 'failure' ? (
            <StateCard
              title="Directory temporarily unavailable"
              description={directoryResult.error}
              tone="error"
              actions={
                <>
                  <Link
                    href="/directory"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Reload directory
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[hsl(var(--ds-border-subtle))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-border-strong))]"
                  >
                    Search trainers
                  </Link>
                </>
              }
            />
          ) : directoryResult.regions.length === 0 ? (
            <StateCard
              title="No directory listings yet"
              description="Try a suburb search to check nearby options, or add your business to create the next listing."
              actions={
                <>
                  <Link
                    href="/search"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Try search instead
                  </Link>
                  <Link
                    href="/onboarding"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[hsl(var(--ds-border-subtle))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-border-strong))]"
                  >
                    Add your business
                  </Link>
                </>
              }
            />
          ) : (
            directoryResult.regions.map((region) => (
              <details
                key={region.name}
                open
                className="rounded-[var(--ds-radius-xl)] border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface)/0.96)] px-6 py-5 shadow-[0_18px_45px_-32px_hsl(var(--ds-shadow-card)/0.45)]"
              >
                <summary className="cursor-pointer text-xl font-semibold text-[hsl(var(--ds-text-primary))] flex items-center justify-between">
                  <span>{region.name}</span>
                  <Badge className="normal-case tracking-[0.04em]">{region.trainers.length} trainers</Badge>
                </summary>
                <div className="mt-5 space-y-4">
                  {region.trainers.map((trainer) => (
                    <Card key={trainer.business_id} tone="muted" className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[hsl(var(--ds-text-primary))]">
                            {trainer.business_name}
                            {trainer.is_featured ? <Badge tone="warning">Featured</Badge> : null}
                            {trainer.abn_verified ? <Badge tone="success">Verified</Badge> : null}
                          </div>
                          <p className="text-sm text-[hsl(var(--ds-text-secondary))]">
                            {trainer.suburb_name} · {trainer.council_name}
                          </p>
                        </div>
                        <div className="text-right text-sm text-[hsl(var(--ds-text-muted))]">
                          ⭐ {trainer.average_rating?.toFixed(1) ?? 'N/A'} ({trainer.review_count} reviews)
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {trainer.age_specialties.slice(0, 3).map((age) => (
                          <Chip key={age} asSpan tone="info">
                            {formatTag(age)}
                          </Chip>
                        ))}
                        {trainer.behavior_issues.slice(0, 3).map((issue) => (
                          <Chip key={issue} asSpan tone="warning">
                            {formatTag(issue)}
                          </Chip>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/trainers/${trainer.business_id}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                          View profile
                        </Link>
                        {trainer.business_website ? (
                          <a
                            href={trainer.business_website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[hsl(var(--ds-border-subtle))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-border-strong))]"
                          >
                            Website
                          </a>
                        ) : null}
                        {trainer.business_phone ? (
                          <a
                            href={`tel:${trainer.business_phone}`}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.62)] px-4 py-2 text-sm font-semibold text-[hsl(var(--ds-text-secondary))] transition-colors hover:border-[hsl(var(--ds-border-strong))]"
                          >
                            Call
                          </a>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
