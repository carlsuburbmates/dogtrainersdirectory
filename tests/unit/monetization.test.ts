import { beforeEach, describe, expect, it, vi } from 'vitest'

const paymentAuditInsert = vi.fn().mockResolvedValue({ error: null })
const subscriptionUpsert = vi.fn().mockResolvedValue({ data: null, error: null })
const businessesSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: {
        id: 42,
        name: 'Calm Companion',
        abn_verified: true,
        verification_status: 'verified',
        email: 'trainer@example.com'
      },
      error: null
    })
  })
})

vi.mock('@/lib/supabase', () => {
  const mockClient = {
    from: (table: string) => {
      if (table === 'payment_audit') {
        return { insert: paymentAuditInsert }
      }
      if (table === 'business_subscription_status') {
        return { upsert: subscriptionUpsert }
      }
      if (table === 'businesses') {
        return {
          select: businessesSelect
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      }
    }
  }
  return { supabaseAdmin: mockClient, supabase: mockClient }
})

import { createCheckoutSessionForBusiness, handleStripeEvent } from '@/lib/monetization'

describe('monetization helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    paymentAuditInsert.mockResolvedValue({ error: null })
    subscriptionUpsert.mockResolvedValue({ data: null, error: null })
    businessesSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 42,
            name: 'Calm Companion',
            abn_verified: true,
            verification_status: 'verified',
            email: 'trainer@example.com'
          },
          error: null
        })
      })
    })
    process.env.FEATURE_MONETIZATION_ENABLED = '1'
    process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED = '1'
    process.env.STRIPE_PRICE_FEATURED = 'price_test'
    process.env.E2E_TEST_MODE = '1'
  })

  it('creates stubbed checkout session in E2E mode and logs audit entry', async () => {
    const result = await createCheckoutSessionForBusiness({
      businessId: 42,
      origin: 'http://localhost:3000'
    })

    expect(result.checkoutUrl).toContain('checkout.stripe.com/test-e2e')
    expect(paymentAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'checkout_session_created',
        status: 'stubbed',
        business_id: 42
      })
    )
  })

  it('marks subscription active when checkout session completes', async () => {
    const event = {
      id: 'evt_1',
      object: 'event',
      type: 'checkout.session.completed',
      api_version: '2022-11-15',
      created: Date.now() / 1000,
      data: {
        object: {
          id: 'cs_test',
          metadata: { business_id: '42', plan_id: 'price_test' },
          customer: 'cus_123',
          subscription: 'sub_123',
          status: 'complete'
        }
      },
      livemode: false,
      pending_webhooks: 0,
      request: null
    } as any

    await handleStripeEvent(event)

    expect(subscriptionUpsert).toHaveBeenCalledTimes(1)
    expect(subscriptionUpsert.mock.calls[0][0]).toEqual(expect.objectContaining({ business_id: 42, status: 'active' }))
    expect(paymentAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'checkout.session.completed',
        status: 'active'
      })
    )
  })

  it('captures payment failures as past_due status', async () => {
    const event = {
      id: 'evt_fail',
      object: 'event',
      type: 'invoice.payment_failed',
      api_version: '2022-11-15',
      created: Date.now() / 1000,
      data: {
        object: {
          id: 'in_test',
          metadata: { business_id: '42', plan_id: 'price_test' },
          customer: 'cus_123',
          subscription: 'sub_123'
        }
      },
      livemode: false,
      pending_webhooks: 0,
      request: null
    } as any

    await handleStripeEvent(event)

    expect(subscriptionUpsert).toHaveBeenCalledTimes(1)
    expect(subscriptionUpsert.mock.calls[0][0]).toEqual(expect.objectContaining({ business_id: 42, status: 'past_due' }))
    expect(paymentAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        event_type: 'invoice.payment_failed'
      })
    )
  })
})
