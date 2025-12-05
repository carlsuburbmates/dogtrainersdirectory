import { describe, it, expect } from 'vitest'

const hasPgConn = !!process.env.SUPABASE_CONNECTION_STRING
const hasKey = !!process.env.SUPABASE_PGCRYPTO_KEY

if (!hasPgConn || !hasKey) {
  // Skip these tests unless the CI or local environment provides both
  describe.skip('integration: decrypt (requires SUPABASE_CONNECTION_STRING and SUPABASE_PGCRYPTO_KEY)', () => {
    it('skipped — set SUPABASE_CONNECTION_STRING and SUPABASE_PGCRYPTO_KEY to run integration tests', () => {})
  })
} else {
  describe('integration: decrypt (end-to-end)', () => {
    it('stores pgp_sym encrypted values and decrypts via get_trainer_profile(p_key)', async () => {
      // lazy import pg so tests gracefully fail/skip if dependency isn't installed
      const { Client } = await import('pg')
      const client = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING })
      await client.connect()

      // Insert a short-lived business row encrypted with the provided key
      const key = process.env.SUPABASE_PGCRYPTO_KEY!
      const insertSql = `INSERT INTO businesses (profile_id, name, email_encrypted, phone_encrypted, suburb_id, resource_type, is_active, is_deleted)
        VALUES (NULL, 'Integration Test', pgp_sym_encrypt($1::text, $3), pgp_sym_encrypt($2::text, $3), (SELECT id FROM suburbs LIMIT 1), 'trainer', true, false)
        RETURNING id`;
      const email = 'int-test@example.com'
      const phone = '0411999888'
      const r = await client.query(insertSql, [email, phone, key])
      const id = r.rows[0].id

      try {
        // Call get_trainer_profile with the key — should return decrypted values
        const resWithKey = await client.query('SELECT email, phone FROM get_trainer_profile($1, $2)', [id, key])
        expect(resWithKey.rows.length).toBe(1)
        expect(resWithKey.rows[0].email).toBe(email)
        expect(resWithKey.rows[0].phone).toBe(phone)

        // Call get_trainer_profile without key — should return NULL for decrypted fields
        const resWithoutKey = await client.query('SELECT email, phone FROM get_trainer_profile($1, NULL)', [id])
        expect(resWithoutKey.rows.length).toBe(1)
        expect(resWithoutKey.rows[0].email).toBeNull()
        expect(resWithoutKey.rows[0].phone).toBeNull()
      } finally {
        // cleanup - delete test row
        await client.query('DELETE FROM businesses WHERE id = $1', [id])
        await client.end()
      }
    })
  })
}
