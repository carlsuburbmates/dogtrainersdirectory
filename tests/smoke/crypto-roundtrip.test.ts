import { describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import dns from 'node:dns/promises'

function getEnv(name: string): string | null {
  const value = process.env[name]
  if (!value) return null
  return value
}

describe('pgcrypto encrypt/decrypt roundtrip', () => {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') ?? getEnv('SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const cryptoKey = getEnv('SUPABASE_PGCRYPTO_KEY')

  const shouldRun = Boolean(supabaseUrl && serviceRoleKey && cryptoKey)

  const testFn = shouldRun ? it : it.skip

  testFn('encrypt_sensitive + decrypt_sensitive returns original plaintext', async () => {
    try {
      await dns.lookup(new URL(supabaseUrl!).hostname)
    } catch {
      console.warn('Skipping pgcrypto RPC smoke test: Supabase host not resolvable')
      return
    }

    const client = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false } })

    const plaintext = `e2e-${Date.now()}@example.com`

    const encrypted = await client.rpc('encrypt_sensitive', {
      p_input: plaintext,
      p_key: cryptoKey
    })

    expect(encrypted.error).toBeNull()
    expect(typeof encrypted.data).toBe('string')

    const decrypted = await client.rpc('decrypt_sensitive', {
      p_input: encrypted.data,
      p_key: cryptoKey
    })

    expect(decrypted.error).toBeNull()
    expect(decrypted.data).toBe(plaintext)
  })
})
