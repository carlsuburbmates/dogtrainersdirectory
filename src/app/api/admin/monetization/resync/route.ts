import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getStripeClient, logMonetizationLatency, logPaymentAudit, upsertSubscriptionStatus } from '@/lib/monetization'
import { isE2ETestMode } from '@/lib/e2eTestUtils'

export const runtime = 'nodejs'

type ResyncPayload = {
  businessId?: number
}

export async function POST(request: Request) {
  const started = Date.now()
  try {
    const payload = (await request.json()) as ResyncPayload
    const businessId = Number(payload?.businessId)

    if (!businessId) {
      await logMonetizationLatency('admin_resync_subscription', Date.now() - started, false, 400)
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    const { data: statusRow, error } = await supabaseAdmin
      .from('business_subscription_status')
      .select('business_id, plan_id, stripe_subscription_id, stripe_customer_id')
      .eq('business_id', businessId)
      .maybeSingle()

    if (error) throw error
    if (!statusRow?.stripe_subscription_id) {
      await logMonetizationLatency('admin_resync_subscription', Date.now() - started, false, 404)
      return NextResponse.json({ error: 'No subscription on record' }, { status: 404 })
    }

    if (isE2ETestMode()) {
      await upsertSubscriptionStatus(businessId, {
        stripeCustomerId: statusRow.stripe_customer_id,
        stripeSubscriptionId: statusRow.stripe_subscription_id,
        planId: statusRow.plan_id,
        status: 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      })
      await logPaymentAudit({
        businessId,
        planId: statusRow.plan_id ?? 'unknown',
        eventType: 'admin_resync_subscription',
        status: 'stubbed',
        metadata: { reason: 'e2e_mode' }
      })
      await logMonetizationLatency('admin_resync_subscription', Date.now() - started, true, 200)
      return NextResponse.json({ status: 'stubbed' })
    }

    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(statusRow.stripe_subscription_id)

    await upsertSubscriptionStatus(businessId, {
      stripeCustomerId: subscription.customer ? String(subscription.customer) : null,
      stripeSubscriptionId: subscription.id,
      planId: subscription.items?.data?.[0]?.price?.id ?? statusRow.plan_id,
      status: subscription.status || 'active',
      currentPeriodEnd: subscription.current_period_end ?? null
    })

    await logPaymentAudit({
      businessId,
      planId: subscription.items?.data?.[0]?.price?.id ?? statusRow.plan_id ?? 'unknown',
      eventType: 'admin_resync_subscription',
      status: subscription.status || 'active',
      stripeCustomerId: subscription.customer ? String(subscription.customer) : null,
      stripeSubscriptionId: subscription.id,
      metadata: { triggeredBy: 'admin_resync' }
    })

    await logMonetizationLatency('admin_resync_subscription', Date.now() - started, true, 200)
    return NextResponse.json({ status: subscription.status })
  } catch (error: any) {
    console.error('Admin monetization resync failed', error)
    await logMonetizationLatency('admin_resync_subscription', Date.now() - started, false, 500)
    return NextResponse.json({ error: 'Unable to resync subscription' }, { status: 500 })
  }
}
