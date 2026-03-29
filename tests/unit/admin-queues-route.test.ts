import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from
  }
}))

import { GET } from '@/app/api/admin/queues/route'

function createReviewsQuery(data: unknown[]) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data, error: null }))
          }))
        }))
      }))
    }))
  }
}

function createAbnVerificationsQuery(rows: unknown[], count: number) {
  return {
    select: vi.fn((_: string, options?: { count?: string; head?: boolean }) => {
      if (options?.count === 'exact' && options?.head) {
        return {
          gte: vi.fn(async () => ({ count, error: null }))
        }
      }

      return {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: rows, error: null }))
          }))
        }))
      }
    }),
    update: vi.fn()
  }
}

function createBusinessesQuery(flaggedRows: unknown[], emergencyRows: unknown[], nameRows: unknown[]) {
  return {
    select: vi.fn((columns: string) => {
      if (columns.includes('verification_status, is_active, featured_until')) {
        return {
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: flaggedRows, error: null }))
            }))
          }))
        }
      }

      if (columns.includes('emergency_verification_status')) {
        return {
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({ data: emergencyRows, error: null }))
                }))
              }))
            }))
          }))
        }
      }

      return {
        in: vi.fn(async () => ({ data: nameRows, error: null }))
      }
    })
  }
}

function createReviewDecisionsQuery(rows: unknown[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(async () => ({ data: rows, error: null }))
    }))
  }
}

function createFallbackEventsQuery(rows: unknown[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(async () => ({ data: rows, error: null }))
        }))
      })),
      gte: vi.fn(() => ({
        order: vi.fn(async () => ({ data: rows, error: null }))
      }))
    }))
  }
}

function createVerificationEventsQuery(rows: unknown[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() => ({
        order: vi.fn(async () => ({ data: rows, error: null }))
      }))
    }))
  }
}

describe('/api/admin/queues verification + ABN loop', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.OPENAI_API_KEY = 'test-openai-key'
  })

  it('returns a combined weekly verification loop with explicit next-safe-action guidance', async () => {
    mocks.from.mockImplementation((table: string) => {
      switch (table) {
        case 'reviews':
          return createReviewsQuery([
            {
              id: 91,
              business_id: 8,
              reviewer_name: 'Casey',
              rating: 5,
              title: 'Helpful trainer',
              content: 'Very clear session',
              created_at: '2026-03-18T12:00:00.000Z'
            }
          ])
        case 'abn_verifications':
          return createAbnVerificationsQuery(
            [
              {
                id: 12,
                business_id: 7,
                abn: '12 345 678 901',
                similarity_score: 0.93,
                status: 'manual_review',
                created_at: '2026-03-18T10:00:00.000Z'
              }
            ],
            4
          )
        case 'businesses':
          return createBusinessesQuery(
            [
              {
                id: 55,
                name: 'Flagged profile',
                verification_status: 'manual_review',
                is_active: true,
                featured_until: null
              }
            ],
            [
              {
                id: 31,
                name: 'Northside Emergency Vet',
                resource_type: 'emergency_vet',
                emergency_phone: '03 9999 0000',
                emergency_hours: '24/7',
                emergency_verification_status: 'manual_review',
                emergency_verification_notes: 'Phone changed recently',
                suburbs: {
                  name: 'Carlton',
                  postcode: '3053',
                  councils: { name: 'City of Melbourne' }
                }
              }
            ],
            [
              {
                id: 7,
                name: 'Calm Dogs Pty Ltd'
              }
            ]
          )
        case 'ai_review_decisions':
          return createReviewDecisionsQuery([])
        case 'abn_fallback_events':
          return createFallbackEventsQuery([
            {
              business_id: 7,
              reason: 'abn_verify_manual_review',
              created_at: '2026-03-18T09:30:00.000Z'
            },
            {
              business_id: 11,
              reason: 'onboarding_manual_review',
              created_at: '2026-03-17T09:30:00.000Z'
            }
          ])
        case 'emergency_resource_verification_events':
          return createVerificationEventsQuery([
            {
              business_id: 31,
              result: 'valid',
              created_at: '2026-03-18T08:00:00.000Z',
              details: {
                verificationMethod: 'deterministic',
                isValid: true,
                aiAutomationAudit: {
                  decisionSource: 'llm',
                  resultState: 'result'
                },
                shadowCandidate: {
                  isValid: false
                }
              }
            }
          ])
        default:
          throw new Error(`Unexpected table ${table}`)
      }
    })

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.aiEnabled).toBe(true)
    expect(payload.verification_abn_summary).toMatchObject({
      totalItems: 2,
      abnManualReviewCount: 1,
      resourceVerificationCount: 1,
      fallbackCount: 2,
      verificationCount: 4,
      windowHours: 168
    })
    expect(payload.verification_abn_summary.note).toContain('Start with 1 ABN manual review')
    expect(payload.verification_abn_loop).toHaveLength(2)
    expect(payload.verification_abn_loop[0]).toMatchObject({
      id: 12,
      kindLabel: 'ABN',
      title: 'Calm Dogs Pty Ltd (12 345 678 901)',
      action: 'review'
    })
    expect(payload.verification_abn_loop[0].nextAction).toContain('approve only if the ABN record lines up cleanly')
    expect(payload.verification_abn_loop[1]).toMatchObject({
      id: 'verification-31',
      kindLabel: 'Verification',
      title: 'Northside Emergency Vet'
    })
    expect(payload.verification_abn_loop[1].body).toContain('Phone changed recently')
    expect(payload.verification_abn_loop[1].nextAction).toContain('draft verification trace flagged the resource as risky')
  })

  it('returns an explicit degraded weekly loop when service-role access is unavailable', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.verification_abn_loop).toEqual([])
    expect(payload.verification_abn_summary.note).toContain('cannot be loaded')
  })
})
