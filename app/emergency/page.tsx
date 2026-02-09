import type { Metadata } from "next"
import { sql } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import {
  Phone,
  AlertTriangle,
  Clock,
  MapPin,
  Globe,
  DollarSign,
  Shield,
} from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Emergency Dog Resources | 24/7 Help Melbourne",
  description:
    "24/7 emergency veterinary hospitals, urgent care, and shelter resources across Melbourne. Get immediate help for your dog.",
}

async function getEmergencyResources() {
  return sql`
    SELECT * FROM emergency_resources
    WHERE is_active = true
    ORDER BY
      CASE resource_type
        WHEN 'emergency_vet' THEN 1
        WHEN 'urgent_care' THEN 2
        WHEN 'behaviour_consultant' THEN 3
        WHEN 'emergency_shelter' THEN 4
        ELSE 5
      END,
      is_24_hour DESC,
      name
  `
}

function ResourceTypeLabel({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    emergency_vet: {
      label: "Emergency Vet",
      className: "bg-destructive/10 text-destructive",
    },
    urgent_care: {
      label: "Urgent Care",
      className: "bg-secondary/20 text-secondary-foreground",
    },
    behaviour_consultant: {
      label: "Behaviour Consultant",
      className: "bg-primary/10 text-primary",
    },
    emergency_shelter: {
      label: "Emergency Shelter",
      className: "bg-accent text-accent-foreground",
    },
  }
  const c = config[type] || {
    label: type,
    className: "bg-muted text-muted-foreground",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  )
}

export default async function EmergencyPage() {
  const resources = await getEmergencyResources()

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Emergency Hero */}
        <section className="border-b border-destructive/20 bg-destructive/5 px-4 py-10 md:py-14">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  Emergency Dog Resources
                </h1>
                <p className="mt-2 text-muted-foreground">
                  If your dog is in immediate danger, experiencing a medical
                  emergency, or showing sudden severe behaviour changes, contact
                  one of these resources immediately.
                </p>
                <div className="mt-4 rounded-lg border border-destructive/20 bg-card p-4">
                  <p className="text-sm font-medium text-foreground">
                    <Shield className="mr-1 inline h-4 w-4 text-destructive" />
                    Disclaimer: This directory is for informational purposes
                    only. In a life-threatening emergency, contact your nearest
                    emergency veterinary hospital directly. We do not provide
                    medical or behavioural advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resource List */}
        <section className="px-4 py-10 md:py-14">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4">
              {resources.map((resource: Record<string, unknown>) => (
                <div
                  key={Number(resource.id)}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-card-foreground">
                          {String(resource.name)}
                        </h2>
                        <ResourceTypeLabel type={String(resource.resource_type)} />
                        {resource.is_24_hour && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <Clock className="h-3 w-3" />
                            24/7
                          </span>
                        )}
                      </div>

                      {resource.address && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {String(resource.address)}
                        </div>
                      )}

                      {resource.emergency_hours && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          {String(resource.emergency_hours)}
                        </div>
                      )}

                      {resource.cost_indicator && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 shrink-0" />
                          Cost: {String(resource.cost_indicator)}
                        </div>
                      )}

                      {(resource.emergency_services as string[])?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {(resource.emergency_services as string[]).map(
                            (svc: string) => (
                              <span
                                key={svc}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                              >
                                {svc}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {resource.phone && (
                        <a
                          href={`tel:${String(resource.phone).replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                          <Phone className="h-4 w-4" />
                          {String(resource.phone)}
                        </a>
                      )}
                      {resource.website && (
                        <a
                          href={String(resource.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Non-emergency CTA */}
        <section className="border-t border-border bg-muted/50 px-4 py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-bold text-foreground">
              Not an Emergency?
            </h2>
            <p className="mt-2 text-muted-foreground">
              If your dog has ongoing behaviour issues, find a qualified trainer
              or behaviour consultant who can help.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/search?service=behaviour_consultations"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Find a Behaviour Consultant
              </Link>
              <Link
                href="/search"
                className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
              >
                Search All Trainers
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
