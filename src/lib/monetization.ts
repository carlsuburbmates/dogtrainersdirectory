import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { recordLatencyMetric } from './telemetryLatency'
import { isE2ETestMode } from './e2eTestUtils'

const STRIPE_VERSION: Stripe.LatestApiVersion = '2022-11-15'

export function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('Stripe secret key not configured')
  }
  return new Stripe(secret, { apiVersion: STRIPE_VERSION })
}

export const isMonetizationEnabled = () => process.env.FEATURE_MONETIZATION_ENABLED === '1'

export interface CheckoutRequestContext {
  businessId: number
  origin: string
}

export interface CheckoutResult {
  checkoutUrl: string
  sessionId: string
}

export async function logPaymentAudit(entry: {
  businessId: number | null
  planId: string
  eventType: string
  status: string
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  metadata?: Record<string, unknown>
  originatingRoute?: string
}) {
  try {
    await supabaseAdmin.from('payment_audit').insert({
      business_id: entry.businessId ?? null,
      plan_id: entry.planId,
      event_type: entry.eventType,
      status: entry.status,
      stripe_customer_id: entry.stripeCustomerId ?? null,
      stripe_subscription_id: entry.stripeSubscriptionId ?? null,
      metadata: entry.metadata ?? {},
      originating_route: entry.originatingRoute ?? null
    })
  } catch (error) {
    console.warn('Failed to insert payment audit entry', error)
  }
}

async function ensureBusinessEligible(businessId: number) {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('id, abn_verified, verification_status, name, email_encrypted, pgp_sym_decrypt(email_encrypted::text, current_setting(\'pgcrypto.key\')) as email')
    .eq('id', businessId)
    .single()

  if (error || !data) {
    throw new Error('Business not found')
  }

  if (!data.abn_verified) {
    throw new Error('Business must complete ABN verification before upgrading')
  }

  return data
}

export async function createCheckoutSessionForBusiness({ businessId, origin }: CheckoutRequestContext): Promise<CheckoutResult> {
  if (!isMonetizationEnabled()) {
    throw new Error('Monetization is not enabled')
  }

  const planId = process.env.STRIPE_PRICE_FEATURED
  if (!planId) {
    throw new Error('STRIPE_PRICE_FEATURED is not configured')
  }

  const business = await ensureBusinessEligible(businessId)

  if (isE2ETestMode()) {
    await logPaymentAudit({
      businessId,
      planId,
      eventType: 'checkout_session_created',
      status: 'stubbed',
      metadata: { origin },
      originatingRoute: '/api/stripe/create-checkout-session'
    })
    return {
      checkoutUrl: `https://checkout.stripe.com/test-e2e?business=${businessId}`,
      sessionId: 'test_e2e_session'
    }
  }

  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${origin}/promote?businessId=${businessId}&status=success`,
    cancel_url: `${origin}/promote?businessId=${businessId}&status=cancelled`,
    customer_email: business.email || undefined,
    metadata: {
      business_id: `${businessId}`,
      plan_id: planId
    },
    line_items: [
      {
        price: planId,
        quantity: 1
      }
    ]
  })

  await logPaymentAudit({
    businessId,
    planId,
    eventType: 'checkout_session_created',
    status: 'pending',
    stripeCustomerId: session.customer ? String(session.customer) : null,
    metadata: { session: session.id, origin },
    originatingRoute: '/api/stripe/create-checkout-session'
  })

  return {
    checkoutUrl: session.url ?? '',
    sessionId: session.id
  }
}

export async function upsertSubscriptionStatus(businessId: number, payload: {
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  planId?: string | null
  status: string
  currentPeriodEnd?: number | null
}) {
  const now = new Date().toISOString()
  const updates = {
    business_id: businessId,
    stripe_customer_id: payload.stripeCustomerId ?? null,
    stripe_subscription_id: payload.stripeSubscriptionId ?? null,
    plan_id: payload.planId ?? null,
    status: payload.status,
    current_period_end: payload.currentPeriodEnd ? new Date(payload.currentPeriodEnd * 1000).toISOString() : null,
    last_event_received: now,
    updated_at: now
  }

  const { error } = await supabaseAdmin
    .from('business_subscription_status')
    .upsert(updates, { onConflict: 'business_id' })

  if (error) {
    console.error('Failed to upsert subscription status', error)
    await logPaymentAudit({
      businessId,
      planId: payload.planId ?? 'unknown',
      eventType: 'subscription_sync_error',
      status: 'sync_error',
      metadata: { reason: error.message }
    })
  }
}

export async function handleStripeEvent(event: Stripe.Event) {
  const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice
  const metadata = (object as any)?.metadata ?? {}
  const businessId = metadata?.business_id ? Number(metadata.business_id) : null
  const planId = metadata?.plan_id || (object as any)?.items?.data?.[0]?.price?.id || process.env.STRIPE_PRICE_FEATURED || 'unknown'

  if (!businessId) {
    console.warn('Stripe event missing business_id metadata', event.id)
    await logPaymentAudit({
      businessId: null,
      planId,
      eventType: event.type,
      status: 'sync_error',
      metadata: { reason: 'missing_business_id', stripe_event_id: event.id }
    })
    return
  }

  const subscriptionId = (object as any)?.subscription ?? (object as any)?.id ?? null
  const customerId = (object as any)?.customer ?? null
  const currentPeriodEnd = (object as any)?.current_period_end ?? (object as any)?.lines?.data?.[0]?.period?.end ?? null

  if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    await upsertSubscriptionStatus(businessId, {
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      planId,
      status: event.type === 'checkout.session.completed' ? 'active' : (object as any)?.status ?? 'active',
      currentPeriodEnd
    })

    await logPaymentAudit({
      businessId,
      planId,
      eventType: event.type,
      status: 'active',
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      metadata
    })
    return
  }

  if (event.type === 'invoice.payment_failed') {
    await upsertSubscriptionStatus(businessId, {
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      planId,
      status: 'past_due',
      currentPeriodEnd
    })

    await logPaymentAudit({
      businessId,
      planId,
      eventType: event.type,
      status: 'failed',
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      metadata
    })
    return
  }

  if (event.type === 'customer.subscription.deleted') {
    await upsertSubscriptionStatus(businessId, {
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      planId,
      status: 'cancelled',
      currentPeriodEnd
    })

    await logPaymentAudit({
      businessId,
      planId,
      eventType: event.type,
      status: 'cancelled',
      stripeCustomerId: customerId ? String(customerId) : null,
      stripeSubscriptionId: subscriptionId ? String(subscriptionId) : null,
      metadata
    })
  }
}

export async function logMonetizationLatency(label: string, durationMs: number, success: boolean, statusCode: number) {
  await recordLatencyMetric({
    area: 'monetization_api',
    route: label,
    durationMs,
    success,
    statusCode,
    metadata: { monetization: true }
  })
}
