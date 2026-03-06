import { NextResponse } from 'next/server'
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

export async function POST(request: Request) {
  try {
    const gate = await enforceTestAccess()
    if (gate) return gate

    const body = await request.json()
    const { eventType, recipient, data } = body
    
    if (!eventType || !recipient) {
      return NextResponse.json(
        { success: false, error: 'Missing eventType or recipient' },
        { status: 400 }
      )
    }
    
    // Placeholder for email event testing
    console.log(`Email event test - Type: ${eventType}, Recipient: ${recipient}`)
    
    return NextResponse.json({
      success: true,
      message: `Email event test logged (no actual email sent)`,
      eventId: `test-${Date.now()}`
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Email event test failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
