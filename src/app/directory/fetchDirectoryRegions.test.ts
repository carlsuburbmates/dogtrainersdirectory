import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => vi.resetModules())

describe('fetchDirectoryRegions RPC call', () => {
  it('passes p_key from env when SUPABASE_PGCRYPTO_KEY is set', async () => {
    process.env.SUPABASE_PGCRYPTO_KEY = 'dir-secret'

    const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null })
    await vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { rpc: rpcMock } }))

    const { fetchDirectoryRegions } = await import('./page')

    await fetchDirectoryRegions()

    expect(rpcMock).toHaveBeenCalled()
    const calledArgs = rpcMock.mock.calls[0][1]
    expect(calledArgs.p_key).toBe('dir-secret')
  })

  it('sends p_key null when SUPABASE_PGCRYPTO_KEY not set', async () => {
    delete process.env.SUPABASE_PGCRYPTO_KEY

    const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null })
    await vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { rpc: rpcMock } }))

    const { fetchDirectoryRegions } = await import('./page')

    await fetchDirectoryRegions()

    expect(rpcMock).toHaveBeenCalled()
    const calledArgs = rpcMock.mock.calls[0][1]
    expect(calledArgs.p_key).toBeNull()
  })
})
