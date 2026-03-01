import { NextResponse } from 'next/server'
import { createCheckoutSessionForBusiness, logMonetizationLatency } from '@/lib/monetization'
import { parseCheckoutPayload } from '@/lib/services/checkoutPayload'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const started = Date.now()
  try {
    let payload: unknown = {}
    try {
      payload = await request.json()
    } catch {
      payload = {}
    }
    const { businessId } = parseCheckoutPayload(payload)

    if (!businessId) {
      await logMonetizationLatency('stripe_create_checkout_session', Date.now() - started, false, 400)
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_ORIGIN ||
      'http://localhost:3005'

    const result = await createCheckoutSessionForBusiness({
      businessId,
      origin
    })

    await logMonetizationLatency('stripe_create_checkout_session', Date.now() - started, true, 200)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to create checkout session', error)
    await logMonetizationLatency('stripe_create_checkout_session', Date.now() - started, false, 500)
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 })
  }
}
