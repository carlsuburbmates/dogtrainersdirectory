import type { Metadata } from "next"
import { sql } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { TrainerCard, type TrainerCardData } from "@/components/trainer-card"
import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Browse All Dog Trainers | Melbourne Directory",
  description:
    "Browse all verified dog trainers and behaviour consultants across Melbourne suburbs. Filter by region and find the right professional for your dog.",
}

async function getAllTrainers(): Promise<TrainerCardData[]> {
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
      ARRAY(SELECT ts.service_type FROM trainer_services ts WHERE ts.business_id = b.id) as services,
      c.region as council_region
    FROM businesses b
    LEFT JOIN suburbs s ON b.suburb_id = s.id
    LEFT JOIN councils c ON s.council_id = c.id
    WHERE b.is_active = true
    ORDER BY b.is_featured DESC, b.average_rating DESC
  `
  return rows as unknown as TrainerCardData[]
}

async function getRegions() {
  return sql`
    SELECT c.region, COUNT(DISTINCT b.id) as trainer_count, COUNT(DISTINCT s.id) as suburb_count
    FROM councils c
    LEFT JOIN suburbs s ON s.council_id = c.id
    LEFT JOIN businesses b ON b.suburb_id = s.id AND b.is_active = true
    GROUP BY c.region
    ORDER BY c.region
  `
}

export default async function DirectoryPage() {
  const [trainers, regions] = await Promise.all([
    getAllTrainers(),
    getRegions(),
  ])

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="border-b border-border bg-accent/30 px-4 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Melbourne Dog Trainers Directory
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse all {trainers.length} verified trainers and behaviour
              consultants across Melbourne. Every professional listed uses
              force-free, science-based methods.
            </p>

            {/* Region Quick Links */}
            <div className="mt-6 flex flex-wrap gap-2">
              {regions.map((region: Record<string, string | number>) => (
                <Link
                  key={String(region.region)}
                  href={`/search?q=${encodeURIComponent(String(region.region))}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {String(region.region)}
                  <span className="ml-0.5 rounded-full bg-muted px-1.5 text-xs">
                    {String(region.trainer_count)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Trainers Grid */}
        <section className="px-4 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                All Trainers ({trainers.length})
              </h2>
              <Link
                href="/search"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Advanced Search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
