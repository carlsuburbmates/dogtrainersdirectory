import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventType, recipient, data } = body
    
    if (!eventType || !recipient) {
      return NextResponse.json(
        { error: 'Missing eventType or recipient' },
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
      { error: 'Email event test failed', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'