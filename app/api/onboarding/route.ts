import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      website,
      address,
      suburb,
      bio,
      shortBio,
      pricing,
      services,
      behaviorIssues,
      ageSpecialties,
      yearsExperience,
      certifications,
      languages,
      isMobile,
      serviceRadiusKm,
    } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email and phone are required" },
        { status: 400 }
      )
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Look up suburb
    let suburbId = null
    if (suburb) {
      const [found] = await sql`
        SELECT id FROM suburbs WHERE name ILIKE ${suburb} LIMIT 1
      `
      if (found) suburbId = found.id
    }

    // Insert business
    const [business] = await sql`
      INSERT INTO businesses (
        name, slug, email, phone, website, address, suburb_id,
        bio, short_bio, pricing, years_experience,
        certifications, languages, is_mobile, service_radius_km,
        verification_status, is_active, is_claimed
      ) VALUES (
        ${name}, ${slug}, ${email}, ${phone}, ${website || null},
        ${address || null}, ${suburbId},
        ${bio || null}, ${shortBio || null}, ${pricing || null},
        ${yearsExperience || null},
        ${certifications?.length ? certifications : null},
        ${languages?.length ? languages : ["English"]},
        ${isMobile || false}, ${serviceRadiusKm || null},
        'pending', true, true
      )
      RETURNING id
    `

    const businessId = business.id

    // Insert services
    if (services?.length) {
      for (const svc of services) {
        await sql`
          INSERT INTO trainer_services (business_id, service_type)
          VALUES (${businessId}, ${svc})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Insert behavior issues
    if (behaviorIssues?.length) {
      for (const issue of behaviorIssues) {
        await sql`
          INSERT INTO trainer_behavior_issues (business_id, behavior_issue)
          VALUES (${businessId}, ${issue})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Insert age specialties
    if (ageSpecialties?.length) {
      for (const age of ageSpecialties) {
        await sql`
          INSERT INTO trainer_specializations (business_id, age_specialty)
          VALUES (${businessId}, ${age})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return NextResponse.json({
      success: true,
      businessId,
      slug,
      message: "Your listing has been submitted for review.",
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    )
  }
}
