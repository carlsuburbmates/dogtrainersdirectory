// Test endpoint for triage logging functionality

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}