import { describe, expect, it } from 'vitest'
import { parseCheckoutPayload } from '@/lib/services/checkoutPayload'

describe('parseCheckoutPayload', () => {
  it('accepts the canonical businessId field', () => {
    expect(parseCheckoutPayload({ businessId: 42 })).toEqual({ businessId: 42 })
  })

  it('accepts the business_id alias and coerces numeric strings', () => {
    expect(parseCheckoutPayload({ business_id: '7' })).toEqual({ businessId: 7 })
  })

  it('rejects missing or invalid values', () => {
    expect(parseCheckoutPayload({})).toEqual({ businessId: null })
    expect(parseCheckoutPayload({ businessId: 'not-a-number' })).toEqual({ businessId: null })
    expect(parseCheckoutPayload(null)).toEqual({ businessId: null })
  })
})
