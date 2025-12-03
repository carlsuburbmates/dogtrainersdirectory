# Remote Supabase migrations — safe apply

This document explains how to confirm and apply Phase 5 (and any pending) migrations
against a remote Supabase project referenced by your local `.env.local`.

IMPORTANT: Do NOT commit or share secret keys. Use your secure credentials store.

---

## 1) Confirm which project your `.env.local` points at

Open `.env.local` and confirm these keys are set to the remote project you intend to modify:

- `SUPABASE_URL` — the project's HTTP URL
- `NEXT_PUBLIC_SUPABASE_URL` (optional) — the public URL used by clients
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (must be present to apply migrations and run admin writes)

Always double-check the host URL (the domain after `https://`) so you don't target production by accident.

## 2) How to apply all pending migrations to the remote project

Option A — Supabase CLI (recommended if you use the CLI tool):

1. Install and authenticate the Supabase CLI (see https://supabase.com/docs/guides/cli)
2. Ensure your `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set for the target project
3. Run (from repository root):

   ```bash
   # Push the schema or run migrations. Use your project-ref if needed.
   supabase db push --project-ref <project-ref>
   # or review and apply migrations via the migrate subcommands
   supabase db migrate status
   supabase db migrate up
   ```

Option B — Supabase Dashboard SQL editor (manual, low-risk):

1. Open Supabase project dashboard → SQL Editor
2. Find and run the SQL in `supabase/migrations/20250208103000_phase5_emergency_automation.sql` (or run missing migration files in chronological order)
3. Monitor the output for errors and address any migration failures before proceeding

## 3) Verify key tables & objects exist

After migration (use the SQL editor or the table list): confirm these objects exist:

- `emergency_triage_logs`
- `daily_ops_digests`
- `emergency_triage_weekly_metrics`
- `emergency_resource_verification_runs` and related events

Quick verification SQL examples (run in SQL editor or via psql / psql client):

```sql
-- check the table exists & count rows (last 24h)
SELECT COUNT(*) FROM emergency_triage_logs WHERE created_at >= now() - INTERVAL '24 hours';
SELECT COUNT(*) FROM daily_ops_digests;
```

## 4) Checklist

- [ ] Confirm `.env.local` points at the correct remote Supabase project
- [ ] Back up the remote database (use supabase backups / pg_dump if in doubt)
- [ ] Apply migrations (Supabase CLI or paste SQL into dashboard)
- [ ] Verify `emergency_triage_logs` & `daily_ops_digests` exist
- [ ] Trigger these endpoints and verify they succeed:
  - POST `/api/emergency/triage` (should log a row and return a `logId` if successful)
  - POST `/api/admin/ops-digest` (should persist into `daily_ops_digests` when service-role key is present)

---

If you run into permission errors or missing objects, check the migration logs and re-run the migration steps in order. If unsure which migration is pending, use `supabase db migrate status` or review the `supabase/migrations` directory.
