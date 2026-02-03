import { supabaseAdmin } from './supabase'

export async function encryptValue(value: string): Promise<string> {
  const key = process.env.SUPABASE_PGCRYPTO_KEY
  if (!key) {
    throw new Error('SUPABASE_PGCRYPTO_KEY is required for encryption')
  }

  const { data, error } = await supabaseAdmin.rpc('encrypt_sensitive', {
    p_input: value,
    p_key: key
  })

  if (error) {
    throw new Error(`encrypt_sensitive failed: ${error.message}`)
  }

  if (!data || typeof data !== 'string') {
    throw new Error('encrypt_sensitive returned no data')
  }

  return data
}
