import { describe, expect, it, vi } from 'vitest'

import {
  parseCanonicalSuburbId,
  rehydrateTriageLocation
} from '@/lib/triageLocation'
import type { SuburbResult } from '@/lib/api'

const richmond: SuburbResult = {
  id: 42,
  name: 'Richmond',
  postcode: '3121',
  latitude: -37.818,
  longitude: 144.998,
  council_id: 7
}

const fitzroy: SuburbResult = {
  id: 77,
  name: 'Fitzroy',
  postcode: '3065',
  latitude: -37.801,
  longitude: 144.979,
  council_id: 7
}

describe('triage location rehydration', () => {
  it('rehydrates the selected suburb from canonical suburbId', async () => {
    const getSuburbById = vi.fn().mockResolvedValue(richmond)

    const result = await rehydrateTriageLocation('42', getSuburbById)

    expect(getSuburbById).toHaveBeenCalledWith(42)
    expect(result).toEqual({
      suburbId: 42,
      selectedSuburb: richmond
    })
  })

  it('treats missing suburbId as incomplete and skips lookup', async () => {
    const getSuburbById = vi.fn()

    const result = await rehydrateTriageLocation(null, getSuburbById)

    expect(getSuburbById).not.toHaveBeenCalled()
    expect(result).toEqual({
      suburbId: null,
      selectedSuburb: null
    })
  })

  it('preserves canonical suburb identity across repeated rehydration', async () => {
    const getSuburbById = vi
      .fn()
      .mockResolvedValueOnce(richmond)
      .mockResolvedValueOnce(fitzroy)
      .mockResolvedValueOnce(null)

    const first = await rehydrateTriageLocation('42', getSuburbById)
    const second = await rehydrateTriageLocation('77', getSuburbById)
    const unresolved = await rehydrateTriageLocation('99999', getSuburbById)

    expect(first).toEqual({
      suburbId: 42,
      selectedSuburb: richmond
    })
    expect(second).toEqual({
      suburbId: 77,
      selectedSuburb: fitzroy
    })
    expect(unresolved).toEqual({
      suburbId: 99999,
      selectedSuburb: null
    })
  })

  it('rejects invalid suburb ids', () => {
    expect(parseCanonicalSuburbId(null)).toBeNull()
    expect(parseCanonicalSuburbId('')).toBeNull()
    expect(parseCanonicalSuburbId('0')).toBeNull()
    expect(parseCanonicalSuburbId('-4')).toBeNull()
    expect(parseCanonicalSuburbId('abc')).toBeNull()
  })
})
