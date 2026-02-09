import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [trainerStats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
        COUNT(*) FILTER (WHERE verification_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE is_featured = true) as featured
      FROM businesses WHERE is_active = true
    `

    const [reviewStats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_approved = true) as approved,
        COUNT(*) FILTER (WHERE is_approved = false) as pending,
        ROUND(AVG(rating), 2) as avg_rating
      FROM reviews
    `

    const [searchStats] = await sql`
      SELECT
        COUNT(*) as total_searches,
        ROUND(AVG(latency_ms)) as avg_latency,
        COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as searches_24h
      FROM search_telemetry
    `

    const topSearches = await sql`
      SELECT query, COUNT(*) as count
      FROM search_telemetry
      WHERE query IS NOT NULL AND query != ''
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `

    const recentTrainers = await sql`
      SELECT b.id, b.name, b.slug, b.verification_status, b.created_at,
        s.name as suburb_name
      FROM businesses b
      LEFT JOIN suburbs s ON b.suburb_id = s.id
      WHERE b.is_active = true
      ORDER BY b.created_at DESC
      LIMIT 10
    `

    const pendingReviews = await sql`
      SELECT r.id, r.reviewer_name, r.rating, r.title, r.content, r.created_at,
        b.name as business_name, b.slug as business_slug
      FROM reviews r
      JOIN businesses b ON r.business_id = b.id
      WHERE r.is_approved = false
      ORDER BY r.created_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      trainers: trainerStats,
      reviews: reviewStats,
      searches: searchStats,
      topSearches,
      recentTrainers,
      pendingReviews,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Failed to load admin stats" },
      { status: 500 }
    )
  }
}
