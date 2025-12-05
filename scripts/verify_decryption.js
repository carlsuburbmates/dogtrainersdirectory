#!/usr/bin/env node
/*
Quick verification script to test PGP encryption/decryption end-to-end.
Requires environment variables:
 - SUPABASE_CONNECTION_STRING (postgres connection string)
 - SUPABASE_PGCRYPTO_KEY (the symmetric key to use)

Usage:
  SUPABASE_CONNECTION_STRING="..." SUPABASE_PGCRYPTO_KEY="..." node scripts/verify_decryption.js
*/

const conn = process.env.SUPABASE_CONNECTION_STRING
const key = process.env.SUPABASE_PGCRYPTO_KEY

if (!conn || !key) {
  console.error('Please set SUPABASE_CONNECTION_STRING and SUPABASE_PGCRYPTO_KEY in your environment')
  process.exit(1)
}

import('pg').then(async ({ Client }) => {
  const client = new Client({ connectionString: conn })
  await client.connect()
  try {
    console.log('Connected — inserting test row...')
    const email = 'verify-int@example.com'
    const phone = '0488000100'
    const insertSql = `INSERT INTO businesses (profile_id, name, email_encrypted, phone_encrypted, suburb_id, resource_type, is_active, is_deleted)
      VALUES (NULL, 'Verify Test', pgp_sym_encrypt($1::text, $3), pgp_sym_encrypt($2::text, $3), (SELECT id FROM suburbs LIMIT 1), 'trainer', true, false) RETURNING id`;
    const r = await client.query(insertSql, [email, phone, key])
    const id = r.rows[0].id
    console.log('Inserted test business id=', id)

    const withKey = await client.query('SELECT email, phone FROM get_trainer_profile($1, $2)', [id, key])
    console.log('get_trainer_profile WITH key ->', withKey.rows[0])

    const withoutKey = await client.query('SELECT email, phone FROM get_trainer_profile($1, NULL)', [id])
    console.log('get_trainer_profile WITHOUT key ->', withoutKey.rows[0])

    await client.query('DELETE FROM businesses WHERE id = $1', [id])
    console.log('Cleanup complete')
  } catch (err) {
    console.error('Error during verification', err)
    process.exitCode = 2
  } finally {
    await client.end()
  }
})
