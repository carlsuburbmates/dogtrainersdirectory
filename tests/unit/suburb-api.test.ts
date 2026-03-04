import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  recordSearchTelemetry: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
  supabaseAdmin: {},
}))

vi.mock('@/lib/telemetryLatency', () => ({
  recordSearchTelemetry: mocks.recordSearchTelemetry,
}))

import { apiService } from '@/lib/api'

describe('suburb api service', () => {
  beforeEach(() => {
    mocks.invoke.mockReset()
    mocks.recordSearchTelemetry.mockReset()
  })

  it('keeps the existing suburb search path unchanged', async () => {
    const suburb = {
      id: 1,
      name: 'Collingwood',
      postcode: '3066',
      latitude: -37.8,
      longitude: 144.9,
      council_id: 10,
    }

    mocks.invoke.mockResolvedValue({
      data: { suburbs: [suburb] },
      error: null,
    })

    const result = await apiService.searchSuburbs('  Collingwood  ')

    expect(result).toEqual([suburb])
    expect(mocks.invoke).toHaveBeenCalledWith('suburbs', {
      body: { query: 'Collingwood' },
    })
  })

  it('returns a single suburb for id lookups', async () => {
    const suburb = {
      id: 42,
      name: 'Carlton',
      postcode: '3053',
      latitude: -37.8,
      longitude: 144.96,
      council_id: 11,
    }

    mocks.invoke.mockResolvedValue({
      data: { suburbs: [suburb] },
      error: null,
    })

    const result = await apiService.getSuburbById(42)

    expect(result).toEqual(suburb)
    expect(mocks.invoke).toHaveBeenCalledWith('suburbs', {
      body: { id: 42 },
    })
  })

  it('returns null when an id lookup has no match', async () => {
    mocks.invoke.mockResolvedValue({
      data: { suburbs: [] },
      error: null,
    })

    const result = await apiService.getSuburbById(99999)

    expect(result).toBeNull()
  })
})
