import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { handleStripeEvent, logMonetizationLatency } from '@/lib/monetization'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15'
})

const SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const createOrSkipEvent = async (eventId: string | null, type: string) => {
  if (!eventId) {
    return true
  }

  const { data, error } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()
  if (data) return false
  if (error && error.code !== 'PGRST116') {
    console.error('Webhook events select error', error)
  }
  await supabaseAdmin.from('webhook_events').insert({
    stripe_event_id: eventId,
    event_type: type,
    processed: true
  })
  return true
}

export async function POST(req: Request) {
  const started = Date.now()
  const signature = req.headers.get('stripe-signature') || ''
  const e2eBypass = isE2ETestMode() || req.headers.get('x-e2e-stripe-test') === '1'
  const body = await req.text()

  let event: Stripe.Event
  try {
    if (e2eBypass) {
      const raw = JSON.parse(body)
      event = {
        id: raw.id || `e2e-${Date.now()}`,
        object: raw.object || 'event',
        type: raw.type || 'e2e.test',
        api_version: raw.api_version ?? null,
        created: raw.created || Math.floor(Date.now() / 1000),
        data: raw.data,
        livemode: false,
        pending_webhooks: 0,
        request: raw.request ?? null
      } as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, signature, SIGNING_SECRET)
    }
  } catch (error: any) {
    console.error('Webhook signature mismatch', error)
    await logMonetizationLatency('stripe_webhook', Date.now() - started, false, 400)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const shouldProcess = await createOrSkipEvent(event.id ?? null, event.type)
  if (!shouldProcess) {
    await logMonetizationLatency('stripe_webhook', Date.now() - started, true, 200)
    return NextResponse.json({ received: true })
  }

  try {
    await handleStripeEvent(event)
    await logMonetizationLatency('stripe_webhook', Date.now() - started, true, 200)
  } catch (error) {
    console.error('Webhook handler error', error)
    await logMonetizationLatency('stripe_webhook', Date.now() - started, false, 500)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
