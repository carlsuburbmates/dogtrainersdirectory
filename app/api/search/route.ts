import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get("q") || ""
  const suburb = searchParams.get("suburb") || ""
  const service = searchParams.get("service") || ""
  const issue = searchParams.get("issue") || ""
  const age = searchParams.get("age") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 12
  const offset = (page - 1) * limit

  try {
    const startTime = Date.now()

    // Build dynamic query
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
        ARRAY(SELECT tbi.behavior_issue FROM trainer_behavior_issues tbi WHERE tbi.business_id = b.id) as behavior_issues,
        ARRAY(SELECT tsp.age_specialty FROM trainer_specializations tsp WHERE tsp.business_id = b.id) as age_specialties,
        c.region as council_region
      FROM businesses b
      LEFT JOIN suburbs s ON b.suburb_id = s.id
      LEFT JOIN councils c ON s.council_id = c.id
      WHERE b.is_active = true
        AND (${q} = '' OR (
          b.name ILIKE '%' || ${q} || '%'
          OR b.short_bio ILIKE '%' || ${q} || '%'
          OR b.bio ILIKE '%' || ${q} || '%'
          OR s.name ILIKE '%' || ${q} || '%'
          OR EXISTS (
            SELECT 1 FROM trainer_behavior_issues tbi
            WHERE tbi.business_id = b.id
            AND tbi.behavior_issue::text ILIKE '%' || ${q} || '%'
          )
        ))
        AND (${suburb} = '' OR s.name ILIKE '%' || ${suburb} || '%')
        AND (${service} = '' OR EXISTS (
          SELECT 1 FROM trainer_services ts
          WHERE ts.business_id = b.id AND ts.service_type::text = ${service}
        ))
        AND (${issue} = '' OR EXISTS (
          SELECT 1 FROM trainer_behavior_issues tbi
          WHERE tbi.business_id = b.id AND tbi.behavior_issue::text = ${issue}
        ))
        AND (${age} = '' OR EXISTS (
          SELECT 1 FROM trainer_specializations tsp
          WHERE tsp.business_id = b.id AND tsp.age_specialty::text = ${age}
        ))
      ORDER BY
        b.is_featured DESC,
        b.average_rating DESC,
        b.review_count DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM businesses b
      LEFT JOIN suburbs s ON b.suburb_id = s.id
      WHERE b.is_active = true
        AND (${q} = '' OR (
          b.name ILIKE '%' || ${q} || '%'
          OR b.short_bio ILIKE '%' || ${q} || '%'
          OR b.bio ILIKE '%' || ${q} || '%'
          OR s.name ILIKE '%' || ${q} || '%'
        ))
        AND (${suburb} = '' OR s.name ILIKE '%' || ${suburb} || '%')
        AND (${service} = '' OR EXISTS (
          SELECT 1 FROM trainer_services ts
          WHERE ts.business_id = b.id AND ts.service_type::text = ${service}
        ))
        AND (${issue} = '' OR EXISTS (
          SELECT 1 FROM trainer_behavior_issues tbi
          WHERE tbi.business_id = b.id AND tbi.behavior_issue::text = ${issue}
        ))
        AND (${age} = '' OR EXISTS (
          SELECT 1 FROM trainer_specializations tsp
          WHERE tsp.business_id = b.id AND tsp.age_specialty::text = ${age}
        ))
    `

    const latencyMs = Date.now() - startTime
    const total = Number(countResult.total)

    // Log telemetry
    await sql`
      INSERT INTO search_telemetry (query, filters, result_count, latency_ms)
      VALUES (${q}, ${JSON.stringify({ suburb, service, issue, age })}::jsonb, ${total}, ${latencyMs})
    `

    return NextResponse.json({
      trainers: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      latencyMs,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search trainers" },
      { status: 500 }
    )
  }
}
