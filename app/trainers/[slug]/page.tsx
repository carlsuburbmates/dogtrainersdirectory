import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import {
  formatServiceType,
  formatBehaviorIssue,
  formatAgeSpecialty,
  getInitials,
} from "@/lib/utils"
import {
  Star,
  MapPin,
  BadgeCheck,
  Phone,
  Mail,
  Globe,
  Clock,
  Award,
  Zap,
  ChevronLeft,
  Languages,
  Car,
} from "lucide-react"
import Link from "next/link"

interface Props {
  params: Promise<{ slug: string }>
}

async function getTrainer(slug: string) {
  const [trainer] = await sql`
    SELECT
      b.*,
      s.name as suburb_name,
      s.postcode,
      c.name as council_name,
      c.region as council_region,
      ARRAY(SELECT ts.service_type FROM trainer_services ts WHERE ts.business_id = b.id) as services,
      ARRAY(SELECT tbi.behavior_issue FROM trainer_behavior_issues tbi WHERE tbi.business_id = b.id) as behavior_issues,
      ARRAY(SELECT tsp.age_specialty FROM trainer_specializations tsp WHERE tsp.business_id = b.id) as age_specialties
    FROM businesses b
    LEFT JOIN suburbs s ON b.suburb_id = s.id
    LEFT JOIN councils c ON s.council_id = c.id
    WHERE b.slug = ${slug} AND b.is_active = true
  `
  return trainer
}

async function getReviews(businessId: number) {
  return sql`
    SELECT * FROM reviews
    WHERE business_id = ${businessId} AND is_approved = true
    ORDER BY created_at DESC
    LIMIT 20
  `
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trainer = await getTrainer(slug)
  if (!trainer) return { title: "Trainer Not Found" }
  return {
    title: `${trainer.name} | Dog Trainer Melbourne`,
    description: trainer.short_bio || `${trainer.name} - professional dog trainer in ${trainer.suburb_name}, Melbourne.`,
  }
}

export default async function TrainerProfilePage({ params }: Props) {
  const { slug } = await params
  const trainer = await getTrainer(slug)
  if (!trainer) notFound()

  const reviews = await getReviews(trainer.id)
  const isVerified = trainer.verification_status === "verified"

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Back link */}
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </div>

        {/* Profile Header */}
        <section className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary md:h-32 md:w-32">
              {trainer.photo_url ? (
                <img
                  src={trainer.photo_url}
                  alt={trainer.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                getInitials(trainer.name)
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  {trainer.name}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
                {trainer.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    Featured
                  </span>
                )}
              </div>

              {trainer.short_bio && (
                <p className="text-muted-foreground">{trainer.short_bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {trainer.suburb_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {trainer.suburb_name}, {trainer.postcode}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  {Number(trainer.average_rating).toFixed(1)} ({trainer.review_count} reviews)
                </span>
                {trainer.years_experience && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {trainer.years_experience} years experience
                  </span>
                )}
              </div>

              {/* Contact buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                {trainer.phone && (
                  <a
                    href={`tel:${trainer.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                )}
                {trainer.email && (
                  <a
                    href={`mailto:${trainer.email}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {trainer.website && (
                  <a
                    href={trainer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Details Grid */}
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="flex flex-col gap-6 md:col-span-2">
              {/* About */}
              {trainer.bio && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-3 text-lg font-semibold text-card-foreground">
                    About
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {trainer.bio}
                  </p>
                </div>
              )}

              {/* Services */}
              {trainer.services?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-3 text-lg font-semibold text-card-foreground">
                    Services
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {trainer.services.map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                      >
                        {formatServiceType(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Behaviour Issues */}
              {trainer.behavior_issues?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-3 text-lg font-semibold text-card-foreground">
                    Behaviour Issues Handled
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {trainer.behavior_issues.map((i: string) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
                      >
                        {formatBehaviorIssue(i)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                  Reviews ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review: Record<string, unknown>) => (
                      <div
                        key={Number(review.id)}
                        className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-card-foreground">
                              {String(review.reviewer_name)}
                            </span>
                            <div className="flex">
                              {Array.from({ length: Number(review.rating) }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3.5 w-3.5 fill-secondary text-secondary"
                                  />
                                )
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              String(review.created_at)
                            ).toLocaleDateString("en-AU", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {review.title && (
                          <p className="mt-1 text-sm font-medium text-card-foreground">
                            {String(review.title)}
                          </p>
                        )}
                        {review.content && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {String(review.content)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Quick Info */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">
                  Quick Info
                </h3>
                <div className="flex flex-col gap-3 text-sm">
                  {trainer.pricing && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Pricing
                      </span>
                      <p className="mt-0.5 text-card-foreground">
                        {trainer.pricing}
                      </p>
                    </div>
                  )}
                  {trainer.response_time_hours && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Responds within {trainer.response_time_hours}h
                    </div>
                  )}
                  {trainer.is_mobile && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="h-4 w-4" />
                      Mobile service
                      {trainer.service_radius_km &&
                        ` (${trainer.service_radius_km}km radius)`}
                    </div>
                  )}
                  {trainer.languages?.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      {trainer.languages.join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {trainer.certifications?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                    Qualifications
                  </h3>
                  <div className="flex flex-col gap-2">
                    {trainer.certifications.map((cert: string) => (
                      <div
                        key={cert}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Specialties */}
              {trainer.age_specialties?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                    Dog Age Specialties
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.age_specialties.map((a: string) => (
                      <span
                        key={a}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {formatAgeSpecialty(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
