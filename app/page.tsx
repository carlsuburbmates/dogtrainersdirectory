import { sql } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { HeroSearch } from "@/components/hero-search"
import { TrainerCard, type TrainerCardData } from "@/components/trainer-card"
import {
  PawPrint,
  Shield,
  MapPin,
  Users,
  Star,
  ArrowRight,
  Phone,
  Heart,
} from "lucide-react"
import Link from "next/link"

async function getFeaturedTrainers(): Promise<TrainerCardData[]> {
  const rows = await sql`
    SELECT
      b.id,
      b.name,
      b.slug,
      b.short_bio,
      b.photo_url,
      s.name as suburb_name,
      s.postcode,
      b.average_rating,
      b.review_count,
      (b.verification_status = 'verified') as is_verified,
      b.is_featured,
      b.is_mobile,
      b.years_experience,
      ARRAY(SELECT ts.service_type FROM trainer_services ts WHERE ts.business_id = b.id) as services
    FROM businesses b
    LEFT JOIN suburbs s ON b.suburb_id = s.id
    WHERE b.is_active = true AND b.is_featured = true
    ORDER BY b.average_rating DESC
    LIMIT 6
  `
  return rows as TrainerCardData[]
}

async function getStats() {
  const [trainerCount] = await sql`SELECT COUNT(*) as count FROM businesses WHERE is_active = true`
  const [suburbCount] = await sql`SELECT COUNT(DISTINCT s.id) as count FROM suburbs s JOIN businesses b ON b.suburb_id = s.id`
  const [reviewCount] = await sql`SELECT COUNT(*) as count FROM reviews WHERE is_approved = true`
  const [avgRating] = await sql`SELECT ROUND(AVG(average_rating), 1) as avg FROM businesses WHERE is_active = true AND review_count > 0`

  return {
    trainers: Number(trainerCount.count),
    suburbs: Number(suburbCount.count),
    reviews: Number(reviewCount.count),
    avgRating: Number(avgRating.avg) || 4.8,
  }
}

export default async function HomePage() {
  const [featured, stats] = await Promise.all([
    getFeaturedTrainers(),
    getStats(),
  ])

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background px-4 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <PawPrint className="h-4 w-4" />
              Melbourne{"'"}s Trusted Dog Training Directory
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Find the perfect trainer
              <span className="text-primary"> for your dog</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Search verified, force-free trainers and behaviour consultants
              across all Melbourne suburbs. From puppy basics to complex
              behaviour cases.
            </p>
            <div className="mt-8">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-card px-4 py-8">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                label: "Verified Trainers",
                value: `${stats.trainers}+`,
                icon: Shield,
              },
              {
                label: "Melbourne Suburbs",
                value: `${stats.suburbs}+`,
                icon: MapPin,
              },
              {
                label: "Owner Reviews",
                value: `${stats.reviews}+`,
                icon: Users,
              },
              {
                label: "Average Rating",
                value: `${stats.avgRating}`,
                icon: Star,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <stat.icon className="mb-1 h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Trainers */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Featured Trainers
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Top-rated professionals chosen for excellence
                </p>
              </div>
              <Link
                href="/directory"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:flex"
              >
                View all trainers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>

            <div className="mt-6 flex justify-center md:hidden">
              <Link
                href="/directory"
                className="flex items-center gap-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View all trainers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted/50 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Search & Filter",
                  description:
                    "Find trainers by suburb, behaviour issue, dog age, or service type. Our AI-powered search understands natural language.",
                  icon: MapPin,
                },
                {
                  step: "2",
                  title: "Compare & Choose",
                  description:
                    "Read verified reviews, compare pricing, and check qualifications. Every trainer is vetted for force-free methods.",
                  icon: Star,
                },
                {
                  step: "3",
                  title: "Connect & Train",
                  description:
                    "Contact your chosen trainer directly. Book an initial consultation and start your dog's training journey.",
                  icon: Heart,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center gap-4 rounded-xl bg-card p-6 text-center shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Emergency CTA */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5 p-6 md:p-10">
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Phone className="h-7 w-7 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Need Emergency Help?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If your dog is in immediate danger or showing sudden severe
                    behaviour changes, find 24/7 emergency vets and urgent
                    resources.
                  </p>
                </div>
                <Link
                  href="/emergency"
                  className="shrink-0 rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  Emergency Resources
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA for Trainers */}
        <section className="bg-primary px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
              Are You a Dog Trainer?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Join Melbourne{"'"}s fastest-growing dog training directory. Get
              discovered by thousands of dog owners searching for qualified
              trainers.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-card/90"
            >
              List Your Business Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
