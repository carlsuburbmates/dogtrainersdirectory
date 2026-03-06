// Test endpoint for triage logging functionality

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

async function enforceTestAccess() {
  if (isE2ETestMode()) return null

  const { authorized } = await requireAdmin()
  if (authorized) return null

  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden',
      message: 'This endpoint is restricted to operators.',
    },
    { status: 403 }
  )
}

export async function GET(request: NextRequest) {
  try {
    const gate = await enforceTestAccess()
    if (gate) return gate

    const { searchParams } = new URL(request.url)
    const message = searchParams.get('message') || "My dog is bleeding after being hit by a car"
    const suburbId = searchParams.get('suburbId') ? Number(searchParams.get('suburbId')) : undefined

    // Call the triage endpoint
    const triageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emergency/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, suburbId })
    })

    if (!triageResponse.ok) {
      throw new Error(`Triage API returned ${triageResponse.status}`)
    }

    const triageResult = await triageResponse.json()

    return NextResponse.json({
      success: true,
      message: "Triage classification test completed",
      original: { message, suburbId },
      result: triageResult
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
