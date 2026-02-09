"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { TrainerCard, type TrainerCardData } from "@/components/trainer-card"
import { formatServiceType, formatBehaviorIssue, formatAgeSpecialty } from "@/lib/utils"

const SERVICE_TYPES = [
  "puppy_training",
  "obedience_training",
  "behaviour_consultations",
  "group_classes",
  "private_training",
]

const BEHAVIOR_ISSUES = [
  "pulling_on_lead",
  "separation_anxiety",
  "excessive_barking",
  "dog_aggression",
  "leash_reactivity",
  "jumping_up",
  "destructive_behaviour",
  "recall_issues",
  "anxiety_general",
  "resource_guarding",
  "mouthing_nipping_biting",
  "rescue_dog_support",
  "socialisation",
]

const AGE_SPECIALTIES = [
  "puppies_0_6m",
  "adolescent_6_18m",
  "adult_18m_7y",
  "senior_7y_plus",
  "rescue_dogs",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [suburb, setSuburb] = useState(searchParams.get("suburb") || "")
  const [service, setService] = useState(searchParams.get("service") || "")
  const [issue, setIssue] = useState(searchParams.get("issue") || "")
  const [age, setAge] = useState(searchParams.get("age") || "")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (suburb) params.set("suburb", suburb)
    if (service) params.set("service", service)
    if (issue) params.set("issue", issue)
    if (age) params.set("age", age)
    params.set("page", String(page))
    return `/api/search?${params.toString()}`
  }, [query, suburb, service, issue, age, page])

  const { data, isLoading } = useSWR(buildUrl(), fetcher, {
    keepPreviousData: true,
  })

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (suburb) params.set("suburb", suburb)
    if (service) params.set("service", service)
    if (issue) params.set("issue", issue)
    if (age) params.set("age", age)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }, [query, suburb, service, issue, age, router])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setQuery(searchInput)
    setPage(1)
  }

  function clearFilters() {
    setQuery("")
    setSuburb("")
    setService("")
    setIssue("")
    setAge("")
    setSearchInput("")
    setPage(1)
  }

  const hasFilters = query || suburb || service || issue || age
  const trainers: TrainerCardData[] = data?.trainers || []
  const total: number = data?.total || 0
  const totalPages: number = data?.totalPages || 1
  const latencyMs: number = data?.latencyMs || 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search trainers, suburbs, behaviour issues..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside
          className={`${
            showFilters ? "fixed inset-0 z-50 flex" : "hidden"
          } flex-col bg-background md:relative md:flex md:w-64 md:shrink-0`}
        >
          {/* Mobile filter header */}
          <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-0">
            <div className="flex flex-col gap-6">
              {/* Suburb Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Suburb
                </label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => { setSuburb(e.target.value); setPage(1) }}
                  placeholder="e.g. Carlton, Fitzroy..."
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Service Type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Service Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setService(service === s ? "" : s); setPage(1) }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        service === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {formatServiceType(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Behaviour Issue */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Behaviour Issue
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BEHAVIOR_ISSUES.map((i) => (
                    <button
                      key={i}
                      onClick={() => { setIssue(issue === i ? "" : i); setPage(1) }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        issue === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {formatBehaviorIssue(i)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dog Age */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Dog Age
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_SPECIALTIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAge(age === a ? "" : a); setPage(1) }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        age === a
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {formatAgeSpecialty(a)}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile apply button */}
          <div className="border-t border-border p-4 md:hidden">
            <button
              onClick={() => setShowFilters(false)}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Show {total} results
            </button>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Results header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {total} trainer{total !== 1 ? "s" : ""} found
              </span>
              {latencyMs > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {latencyMs}ms
                </span>
              )}
            </div>
            {/* Desktop filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent md:flex"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {isLoading && trainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Searching trainers...
              </p>
            </div>
          ) : trainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground">
                No trainers found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {trainers.map((trainer: TrainerCardData) => (
                  <TrainerCard key={trainer.id} trainer={trainer} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
