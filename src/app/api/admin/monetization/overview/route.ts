import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logMonetizationLatency } from '@/lib/monetization'

export const runtime = 'nodejs'

const HOURS = 24

type SubscriptionStatusRow = {
  business_id: number
  plan_id: string | null
  status: string
  current_period_end: string | null
  last_event_received: string | null
  updated_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  businesses?: { name?: string; verification_status?: string } | { name?: string; verification_status?: string }[]
}

type PaymentAuditRow = {
  id: string
  business_id: number | null
  plan_id: string
  event_type: string
  status: string
  metadata?: Record<string, unknown>
  created_at: string
}

export async function GET() {
  const started = Date.now()
  try {
    const windowIso = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString()

    const [statusQuery, auditQuery] = await Promise.all([
      supabaseAdmin
        .from('business_subscription_status')
        .select('business_id, plan_id, status, current_period_end, last_event_received, updated_at, stripe_customer_id, stripe_subscription_id, businesses(name, verification_status)')
        .order('updated_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('payment_audit')
        .select('id, business_id, plan_id, event_type, status, metadata, created_at')
        .gte('created_at', windowIso)
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    if (statusQuery.error) throw statusQuery.error
    if (auditQuery.error) throw auditQuery.error

    const statuses = (statusQuery.data ?? []) as SubscriptionStatusRow[]
    const events = (auditQuery.data ?? []) as PaymentAuditRow[]

    const statusCounts = {
      active: 0,
      past_due: 0,
      cancelled: 0,
      inactive: 0,
      other: 0
    }
    statuses.forEach((row) => {
      const key = row.status as keyof typeof statusCounts
      if (statusCounts[key] !== undefined) {
        statusCounts[key] += 1
      } else {
        statusCounts.other += 1
      }
    })

    const failureEvents = events.filter(
      (event) =>
        event.status === 'failed' ||
        event.event_type === 'invoice.payment_failed' ||
        event.event_type === 'customer.subscription.deleted'
    )

    const syncErrors = events.filter(
      (event) => event.status === 'sync_error' || event.event_type === 'subscription_sync_error'
    )

    const totalEvents = events.length
    const failureRate = totalEvents === 0 ? 0 : Number((failureEvents.length / totalEvents).toFixed(2))

    let health: 'ok' | 'attention' | 'down' = 'ok'
    if (failureRate > 0.3 || syncErrors.length >= 5) {
      health = 'down'
    } else if (failureRate > 0.15 || syncErrors.length > 0) {
      health = 'attention'
    }

    const response = NextResponse.json({
      summary: {
        counts: statusCounts,
        failureRate,
        failureCount: failureEvents.length,
        syncErrorCount: syncErrors.length,
        totalEvents,
        health
      },
      statuses: statuses.map((row) => {
        const business =
          Array.isArray(row.businesses) ? row.businesses[0] ?? null : row.businesses ?? null
        return {
          business_id: row.business_id,
          plan_id: row.plan_id,
          status: row.status,
          current_period_end: row.current_period_end,
          last_event_received: row.last_event_received,
          updated_at: row.updated_at,
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: row.stripe_subscription_id,
          business
        }
      }),
      recentFailures: failureEvents.slice(0, 15),
      syncErrors: syncErrors.slice(0, 15)
    })
    await logMonetizationLatency('admin_monetization_overview', Date.now() - started, true, 200)
    return response
  } catch (error: any) {
    console.error('Monetization overview error', error)
    await logMonetizationLatency('admin_monetization_overview', Date.now() - started, false, 500)
    return NextResponse.json({ error: 'Unable to load monetization overview' }, { status: 500 })
  }
}
