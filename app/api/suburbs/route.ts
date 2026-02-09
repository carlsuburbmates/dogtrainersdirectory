import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || ""

  try {
    const suburbs = await sql`
      SELECT s.id, s.name, s.postcode, c.name as council_name, c.region
      FROM suburbs s
      LEFT JOIN councils c ON s.council_id = c.id
      WHERE ${q} = '' OR s.name ILIKE ${q + "%"} OR s.postcode LIKE ${q + "%"}
      ORDER BY s.name
      LIMIT 20
    `
    return NextResponse.json(suburbs)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
