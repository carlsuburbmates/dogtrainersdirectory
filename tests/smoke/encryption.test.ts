import { describe, expect, it } from 'vitest'
import dns from 'node:dns/promises'

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_PGCRYPTO_KEY
)

const maybeDescribe = hasSupabase ? describe : describe.skip

maybeDescribe('pgcrypto encrypt/decrypt', () => {
  it('round-trips via encrypt_sensitive/decrypt_sensitive', async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    try {
      await dns.lookup(new URL(supabaseUrl).hostname)
    } catch {
      // Environment is configured but the Supabase host is not resolvable (deleted project, offline DNS, etc).
      // Treat as a no-op so local dev is not blocked; CI can still run this when pointing at a real project.
      console.warn('Skipping pgcrypto RPC smoke test: Supabase host not resolvable')
      return
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const key = process.env.SUPABASE_PGCRYPTO_KEY as string
    const plaintext = `e2e-${Date.now()}@example.com`

    const { data: encrypted, error: encErr } = await supabaseAdmin.rpc('encrypt_sensitive', {
      p_input: plaintext,
      p_key: key
    })

    expect(encErr).toBeNull()
    expect(typeof encrypted).toBe('string')
    expect(encrypted).not.toBe(plaintext)

    const { data: decrypted, error: decErr } = await supabaseAdmin.rpc('decrypt_sensitive', {
      p_input: encrypted,
      p_key: key
    })

    expect(decErr).toBeNull()
    expect(decrypted).toBe(plaintext)
  })
})
