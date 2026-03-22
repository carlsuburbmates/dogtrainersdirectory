import { describe, expect, it } from 'vitest'
import { buildWeeklyAdminExceptions } from '@/app/admin/weekly-exceptions'

describe('admin weekly exceptions helper', () => {
  it('returns a stable ordered exceptions-first drill-down list', () => {
    const actions = buildWeeklyAdminExceptions({
      verificationLoopCount: 2,
      reviewCount: 5,
      scaffoldedCount: 1,
      flaggedCount: 0,
    })

    expect(actions.map((action) => action.order)).toEqual(['1', '2', '3', '4'])
    expect(actions[0]).toMatchObject({
      label: 'Verification & ABN loop',
      count: 2,
      href: '#verification-abn',
    })
    expect(actions[1]).toMatchObject({
      label: 'Review moderation loop',
      count: 5,
      href: '/admin/reviews',
    })
    expect(actions[2]).toMatchObject({
      label: 'Scaffolded listings',
      count: 1,
      href: '#scaffolded',
    })
    expect(actions[3]).toMatchObject({
      label: 'Flagged profiles',
      count: 0,
      href: '#flagged-profiles',
    })
  })
})

