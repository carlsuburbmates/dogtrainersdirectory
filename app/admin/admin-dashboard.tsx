"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import {
  LayoutDashboard,
  Users,
  Star,
  Search,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Zap,
  Trash2,
  Loader2,
  PawPrint,
  BarChart3,
  AlertTriangle,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Tab = "overview" | "trainers" | "reviews" | "analytics"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const { data, isLoading } = useSWR("/api/admin/stats", fetcher, {
    refreshInterval: 30000,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function performAction(action: string, id: number, extraData?: Record<string, unknown>) {
    setActionLoading(`${action}-${id}`)
    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data: extraData }),
      })
      mutate("/api/admin/stats")
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "trainers", label: "Trainers", icon: Users },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const trainers = data?.trainers || {}
  const reviews = data?.reviews || {}
  const searches = data?.searches || {}

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Admin Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Admin Panel</span>
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                Operator
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View Site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-background p-1 shadow-sm scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Trainers",
                  value: trainers.total || 0,
                  sub: `${trainers.verified || 0} verified`,
                  icon: Users,
                  color: "text-primary",
                },
                {
                  label: "Pending Reviews",
                  value: reviews.pending || 0,
                  sub: `${reviews.total || 0} total`,
                  icon: Star,
                  color: "text-secondary",
                },
                {
                  label: "Searches (24h)",
                  value: searches.searches_24h || 0,
                  sub: `${searches.avg_latency || 0}ms avg`,
                  icon: Search,
                  color: "text-primary",
                },
                {
                  label: "Pending Approval",
                  value: trainers.pending || 0,
                  sub: "trainer listings",
                  icon: Clock,
                  color: "text-destructive",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className={cn("mt-0.5", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-card-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity + Pending Reviews */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Trainers */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recent Listings
                </h3>
                <div className="flex flex-col gap-3">
                  {(data?.recentTrainers || []).slice(0, 5).map((t: Record<string, unknown>) => (
                    <div
                      key={Number(t.id)}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {String(t.name)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {String(t.suburb_name || "No suburb")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          t.verification_status === "verified"
                            ? "bg-primary/10 text-primary"
                            : t.verification_status === "pending"
                            ? "bg-secondary/20 text-secondary-foreground"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {String(t.verification_status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
                  <AlertTriangle className="h-4 w-4 text-secondary" />
                  Pending Reviews
                </h3>
                <div className="flex flex-col gap-3">
                  {(data?.pendingReviews || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No pending reviews
                    </p>
                  ) : (
                    (data?.pendingReviews || []).slice(0, 5).map((r: Record<string, unknown>) => (
                      <div
                        key={Number(r.id)}
                        className="flex items-start justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-card-foreground">
                              {String(r.reviewer_name)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {"for"} {String(r.business_name)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: Number(r.rating) }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-secondary text-secondary"
                                />
                              )
                            )}
                          </div>
                          {r.content && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {String(r.content)}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1 ml-2">
                          <button
                            onClick={() => performAction("approve_review", Number(r.id))}
                            disabled={actionLoading === `approve_review-${r.id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => performAction("reject_review", Number(r.id))}
                            disabled={actionLoading === `reject_review-${r.id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trainers Tab */}
        {activeTab === "trainers" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-card-foreground">
                All Trainers ({trainers.total || 0})
              </h3>
            </div>
            <div className="divide-y divide-border">
              {(data?.recentTrainers || []).map((t: Record<string, unknown>) => (
                <div
                  key={Number(t.id)}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground">
                        {String(t.name)}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          t.verification_status === "verified"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/20 text-secondary-foreground"
                        )}
                      >
                        {String(t.verification_status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {String(t.suburb_name || "No suburb")} | Created{" "}
                      {new Date(String(t.created_at)).toLocaleDateString("en-AU")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/trainers/${String(t.slug)}`}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                    {t.verification_status === "pending" && (
                      <>
                        <button
                          onClick={() => performAction("verify_trainer", Number(t.id))}
                          disabled={actionLoading === `verify_trainer-${t.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          {actionLoading === `verify_trainer-${t.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Shield className="h-3.5 w-3.5" />
                          )}
                          Verify
                        </button>
                        <button
                          onClick={() => performAction("reject_trainer", Number(t.id))}
                          disabled={actionLoading === `reject_trainer-${t.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {t.verification_status === "verified" && (
                      <button
                        onClick={() => performAction("feature_trainer", Number(t.id))}
                        disabled={actionLoading === `feature_trainer-${t.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-secondary/20 px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/30 disabled:opacity-50"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Feature
                      </button>
                    )}
                    <button
                      onClick={() => performAction("deactivate_trainer", Number(t.id))}
                      disabled={actionLoading === `deactivate_trainer-${t.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-card-foreground">
                Pending Reviews ({(data?.pendingReviews || []).length})
              </h3>
            </div>
            {(data?.pendingReviews || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-primary/50" />
                <p className="text-lg font-semibold text-card-foreground">
                  All caught up!
                </p>
                <p className="text-sm text-muted-foreground">
                  No reviews pending moderation
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(data?.pendingReviews || []).map((r: Record<string, unknown>) => (
                  <div key={Number(r.id)} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-card-foreground">
                            {String(r.reviewer_name)}
                          </span>
                          <Link
                            href={`/trainers/${String(r.business_slug)}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {String(r.business_name)}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {new Date(String(r.created_at)).toLocaleDateString("en-AU")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: Number(r.rating) }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 fill-secondary text-secondary"
                            />
                          ))}
                        </div>
                        {r.title && (
                          <p className="mt-2 text-sm font-medium text-card-foreground">
                            {String(r.title)}
                          </p>
                        )}
                        {r.content && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {String(r.content)}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex shrink-0 gap-2">
                        <button
                          onClick={() => performAction("approve_review", Number(r.id))}
                          disabled={actionLoading === `approve_review-${r.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          {actionLoading === `approve_review-${r.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => performAction("reject_review", Number(r.id))}
                          disabled={actionLoading === `reject_review-${r.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-6">
            {/* Search Analytics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Searches
                </p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {searches.total_searches || 0}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Latency
                </p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {searches.avg_latency || 0}
                  <span className="text-lg text-muted-foreground">ms</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Rating
                </p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {reviews.avg_rating || "N/A"}
                  <Star className="ml-1 inline h-5 w-5 fill-secondary text-secondary" />
                </p>
              </div>
            </div>

            {/* Top Searches */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
                <Search className="h-4 w-4 text-primary" />
                Top Search Queries
              </h3>
              {(data?.topSearches || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No search data yet
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(data?.topSearches || []).map(
                    (s: Record<string, unknown>, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <span className="text-sm text-card-foreground">
                          {String(s.query)}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {String(s.count)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
