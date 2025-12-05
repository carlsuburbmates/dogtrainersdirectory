import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const config = {
  api: { bodyParser: false }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-08' as Stripe.LatestApiVersion
})

const SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const createOrSkipEvent = async (eventId: string, type: string) => {
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
  const signature = req.headers.get('stripe-signature') || ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, SIGNING_SECRET)
  } catch (error: any) {
    console.error('Webhook signature mismatch', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const shouldProcess = await createOrSkipEvent(event.id, event.type)
  if (!shouldProcess) {
    return NextResponse.json({ received: true })
  }

  try {
    const metadata = (event.data.object as any)?.metadata ?? {}
    const businessId = metadata?.business_id ? Number(metadata.business_id) : null
    const lgaId = metadata?.lga_id ? Number(metadata.lga_id) : null

    if (['checkout.session.completed', 'charge.succeeded'].includes(event.type)) {
      if (businessId && lgaId) {
        await supabaseAdmin.from('featured_placements').insert({
          business_id: businessId,
          lga_id: lgaId,
          stripe_checkout_session_id:
            (event.data.object as Stripe.Checkout.Session).id ??
            (event.data.object as Stripe.Charge).id,
          stripe_payment_intent_id: (event.data.object as any)?.payment_intent ?? null,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        })
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      await supabaseAdmin.from('featured_placements').update({
        status: 'active',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }).eq('stripe_payment_intent_id', metadata?.payment_intent ?? '')
    }

    if (event.type === 'invoice.payment_failed') {
      await supabaseAdmin.from('featured_placements').update({
        status: 'cancelled'
      }).eq('stripe_payment_intent_id', metadata?.payment_intent ?? '')
    }

    if (event.type === 'charge.refunded') {
      await supabaseAdmin.from('featured_placements').update({
        status: 'cancelled'
      }).eq('stripe_payment_intent_id', metadata?.payment_intent ?? '')
    }

    if (event.type === 'customer.subscription.deleted') {
      await supabaseAdmin.from('featured_placements').update({
        status: 'cancelled'
      }).eq('stripe_payment_intent_id', metadata?.payment_intent ?? '')
    }

    if (event.type === 'charge.dispute.created') {
      console.warn('charge dispute received:', event.id)
    }
  } catch (error) {
    console.error('Webhook handler error', error)
  }

  return NextResponse.json({ received: true })
}
