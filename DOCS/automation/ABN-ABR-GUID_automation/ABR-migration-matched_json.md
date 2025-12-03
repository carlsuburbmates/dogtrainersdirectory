# Runbook — Apply `matched_json` migration to remote DB (Supabase Dashboard)

Purpose: safely add the `matched_json` jsonb column to the `abn_verifications` table in the remote Supabase/Postgres database.

Files & SQL in repo
- Migration file: `supabase/migrations/20251130000001_add_abn_matched_json.sql`
- SQL contained in the migration file:

```sql
-- Migration: add matched_json jsonb column to abn_verifications
ALTER TABLE abn_verifications
  ADD COLUMN IF NOT EXISTS matched_json jsonb DEFAULT NULL;
```

Why this is safe
- The migration is non-destructive — it only adds a single NULLable `jsonb` column.
- No existing data will be modified. This column stores the raw ABR API payload (SOAP/XML or parsed JSON) for audit and re-check.

Important constraints (read-first)
- Do NOT enable `AUTO_APPLY=true` until this migration is applied and manually verified on the remote DB.
- ABR raw payloads are public; we do not store secrets here (store only ABR responses).
- The column is nullable and should not be used by write paths until it exists everywhere required.

Pre-flight checks (before touching the remote DB)
1. Confirm the migration file in the repo matches the intended change (see SQL snippet above).
2. Confirm there are no pending DDLs or migrations on the remote DB that would conflict.
3. Ensure a complete SQL backup or a snapshot is taken in Supabase before applying the migration.

How to create a backup/snapshot in Supabase (UI)
1. Log into https://app.supabase.com and authenticate.
2. Select the correct Supabase project (confirm project's name and ID match staging/production as appropriate).
3. Open the **Database** > **Backups** page. Choose **Create new manual snapshot** (or use CSV/pg_dump from a trusted environment if preferred).
4. Wait for the snapshot to complete — confirm it is present and downloadable.

How to apply the migration using Supabase Dashboard SQL editor (manual apply)
1. In the Supabase project UI, go to **Database** → **SQL** (SQL editor).
2. Paste the migration SQL (see snippet above) into the editor.
3. Double-check: ensure the SQL is exactly the ALTER TABLE ... ADD COLUMN statement and **does not** contain any DROP/DELETE/ALTER statements affecting unrelated tables or columns.
4. If you have concerns, prefix the command with `BEGIN;` and run the migration inside a transaction, then `ROLLBACK;` to dry-run or `COMMIT;` to apply.
5. Click **Run** and confirm the SQL succeeds. Note any warnings or messages.

Post-apply verification (confirm column presence + smoke-test)
1. Confirm column present:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'abn_verifications' AND column_name = 'matched_json';
```
 - Expect: a single row with column_name = matched_json, data_type = jsonb, is_nullable = YES.
2. Simple read/write smoke-test (use SQL editor or psql):
```sql
-- create a small test row (if you have a safe test id)
-- UPDATE an existing abn_verifications row (use an ID you understand)
UPDATE abn_verifications
SET matched_json = '{"test": "hello"}'::jsonb
WHERE id = 1; -- <--- pick a safe test row id or do this in a non-prod environment first

SELECT id, matched_json
FROM abn_verifications
WHERE id = 1;
```
 - Confirm the data stores and reads back correctly.

Rollback strategy / failure handling
1. If the SQL fails or reports errors, read the error closely — it's likely syntax or permissions-related.
2. If a larger issue is detected after apply (unexpected side effects):
   - Follow the rollback path: restore the earlier snapshot created in the Pre-flight step.
   - In the Supabase UI, choose **Backups**, select the snapshot, and click **Restore**.
3. If the `ALTER TABLE` succeeded but you need a precise manual rollback (rare), you can run:
```sql
ALTER TABLE abn_verifications DROP COLUMN IF EXISTS matched_json;
```
   - Only run the above if you have confirmed restore/snapshot, and you understand how this will affect any code that may write to that column.

Post-apply checklist (verify & follow-ups)
1. Confirm `matched_json` column exists and smoke tests pass.
2. Confirm the runtime environment(s) expecting this column are updated or ready to write to it (e.g., set `AUTO_APPLY` still false until all tests pass).
3. Notify on-call/relevant team(s) that migration is applied and ready for testing.
4. Run a small controlled run of ABN re-check job in dry-run mode; verify writes remain disabled.

Paste-ready GitHub issue / PR checklist
------------------------------------
Copy this into a GitHub issue or PR description when you intend to run the migration manually from the Supabase Dashboard:

```
Runbook for applying the `matched_json` migration (manual Supabase Dashboard)

- [ ] Confirm migration file: `supabase/migrations/20251130000001_add_abn_matched_json.sql` (adds `matched_json jsonb DEFAULT NULL`).
- [ ] Create manual DB snapshot in Supabase. (Database → Backups → Create manual snapshot)
- [ ] Paste migration SQL into Supabase SQL editor and run. (DB → SQL)
- [ ] Verify column exists:
      SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'abn_verifications' AND column_name = 'matched_json';
- [ ] Run a safe smoke test update/read on a non-critical row to validate storing JSONB works.
- [ ] If any issues, restore snapshot from Backups and escalate.
- [ ] After successful verification, coordinate next steps (enable AUTO_APPLY in CI only when ready).
```

Notes
- The purpose of `matched_json` is to persist the raw ABR payload (for audit and later re-checks). Do not use it for derived, enforced profile data.
