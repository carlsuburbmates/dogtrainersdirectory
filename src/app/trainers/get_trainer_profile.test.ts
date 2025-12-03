import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

describe('getTrainerProfile RPC call', () => {
  it('passes p_key from env when SUPABASE_PGCRYPTO_KEY is set', async () => {
    process.env.SUPABASE_PGCRYPTO_KEY = 'my-secret-key'

    const rpcMock = vi.fn().mockResolvedValue({ data: [{ business_id: 1 }], error: null })
    await vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { rpc: rpcMock } }))

    const { getTrainerProfile } = await import('./[id]/page')

    await getTrainerProfile(1)

    expect(rpcMock).toHaveBeenCalled()
    const calledArgs = rpcMock.mock.calls[0][1]
    expect(calledArgs.p_key).toBe('my-secret-key')
  })

  it('sends p_key null when SUPABASE_PGCRYPTO_KEY not set', async () => {
    delete process.env.SUPABASE_PGCRYPTO_KEY

    const rpcMock = vi.fn().mockResolvedValue({ data: [{ business_id: 2 }], error: null })
    await vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { rpc: rpcMock } }))

    const { getTrainerProfile } = await import('./[id]/page')

    await getTrainerProfile(2)

    expect(rpcMock).toHaveBeenCalled()
    const calledArgs = rpcMock.mock.calls[0][1]
    expect(calledArgs.p_key).toBeNull()
  })
})
