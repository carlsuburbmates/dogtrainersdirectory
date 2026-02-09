import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { action, id, data } = await request.json()

    switch (action) {
      case "verify_trainer": {
        await sql`
          UPDATE businesses
          SET verification_status = 'verified', updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer verified" })
      }

      case "reject_trainer": {
        await sql`
          UPDATE businesses
          SET verification_status = 'rejected', updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer rejected" })
      }

      case "feature_trainer": {
        await sql`
          UPDATE businesses
          SET is_featured = true, featured_until = now() + interval '30 days', updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer featured" })
      }

      case "unfeature_trainer": {
        await sql`
          UPDATE businesses
          SET is_featured = false, featured_until = NULL, updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer unfeatured" })
      }

      case "deactivate_trainer": {
        await sql`
          UPDATE businesses
          SET is_active = false, updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer deactivated" })
      }

      case "approve_review": {
        const [review] = await sql`
          UPDATE reviews SET is_approved = true, updated_at = now()
          WHERE id = ${id}
          RETURNING business_id
        `
        if (review) {
          // Recalculate business average
          await sql`
            UPDATE businesses
            SET
              average_rating = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE business_id = ${review.business_id} AND is_approved = true),
              review_count = (SELECT COUNT(*) FROM reviews WHERE business_id = ${review.business_id} AND is_approved = true),
              updated_at = now()
            WHERE id = ${review.business_id}
          `
        }
        return NextResponse.json({ success: true, message: "Review approved" })
      }

      case "reject_review": {
        await sql`DELETE FROM reviews WHERE id = ${id}`
        return NextResponse.json({ success: true, message: "Review deleted" })
      }

      case "update_trainer": {
        if (!data) return NextResponse.json({ error: "No data" }, { status: 400 })
        await sql`
          UPDATE businesses
          SET
            name = COALESCE(${data.name || null}, name),
            short_bio = COALESCE(${data.shortBio || null}, short_bio),
            is_featured = COALESCE(${data.isFeatured ?? null}, is_featured),
            updated_at = now()
          WHERE id = ${id}
        `
        return NextResponse.json({ success: true, message: "Trainer updated" })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Admin action error:", error)
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    )
  }
}
