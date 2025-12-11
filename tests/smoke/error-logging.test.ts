import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseHoist = vi.hoisted(() => {
  const insertMock = vi.fn(async () => ({ data: null, error: null }))
  const fromMock = vi.fn(() => ({ insert: insertMock }))
  return { insertMock, fromMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: supabaseHoist.fromMock
  }
}))

import { flushLogs, logAPIError, logError } from '@/lib/errorLog'

describe('error logging payloads', () => {
  beforeEach(() => {
    supabaseHoist.insertMock.mockClear()
    supabaseHoist.fromMock.mockClear()
  })

  it('sends API failure payload with required context fields', async () => {
    await logAPIError('/api/emergency/triage', 'POST', 503, new Error('LLM unavailable'), {
      userId: 'ops-user',
      env: 'staging',
      extra: { emergencyGate: 'medical', attempt: 2 }
    })

    await flushLogs()

    expect(supabaseHoist.fromMock).toHaveBeenCalledWith('error_logs')
    expect(supabaseHoist.insertMock).toHaveBeenCalledTimes(1)
    const calls = supabaseHoist.insertMock.mock.calls as unknown[][]
    expect(calls.length).toBeGreaterThan(0)
    const firstCallArgs = calls[0] as unknown[] | undefined
    const batch = (firstCallArgs?.[0] as unknown as any[]) ?? []
    expect(batch.length).toBeGreaterThan(0)
    const entry = batch[0]
    expect(entry).toMatchObject({
      route: '/api/emergency/triage',
      method: 'POST',
      statusCode: 503,
      level: 'error',
      category: 'api',
      user_id: 'ops-user',
      env: 'staging'
    })
    expect(entry.context.emergencyGate).toBe('medical')
    expect(typeof entry.context.timestamp).toBe('string')
  })

  it('records synthetic errors for dashboards when manual logError is invoked', async () => {
    await logError('Cron health degraded: emergency triage backlog', {
      route: '/admin/cron-health',
      method: 'GET',
      statusCode: 200,
      extra: { backlogSize: 7 }
    }, 'warn', 'other')

    await flushLogs()

    const calls = supabaseHoist.insertMock.mock.calls as unknown[][]
    expect(calls.length).toBeGreaterThan(0)
    const firstCallArgs = calls[0] as unknown[] | undefined
    const batch = (firstCallArgs?.[0] as unknown as any[]) ?? []
    expect(batch.length).toBeGreaterThan(0)
    const entry = batch[0]
    expect(entry).toMatchObject({
      message: 'Cron health degraded: emergency triage backlog',
      category: 'other',
      level: 'warn',
      route: '/admin/cron-health'
    })
    expect(entry.context.backlogSize).toBe(7)
  })
})
