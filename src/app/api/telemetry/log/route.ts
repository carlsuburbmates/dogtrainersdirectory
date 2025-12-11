import { NextResponse } from 'next/server'
import { recordSearchTelemetry, type SearchTelemetryPayload } from '@/lib/telemetryLatency'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SearchTelemetryPayload
    if (!payload?.operation) {
      return NextResponse.json({ error: 'Missing operation' }, { status: 400 })
    }

    await recordSearchTelemetry(payload)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to ingest telemetry payload', error)
    return NextResponse.json({ error: 'Unable to record telemetry' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
