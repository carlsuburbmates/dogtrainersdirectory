# Migrations index (supabase/migrations)

This page summarizes the SQL migration files stored under `supabase/migrations/` and explains the role of `supabase/migrations_archive/`.

> Note: The "Applied to remote?" column is set to **Yes** for the baseline project migrations in this index (these migrations correspond to the recent remote migration pushes used during Phase rollout). Always verify remote state before applying more migrations (see `DOCS/automation/REMOTE_DB_MIGRATIONS.md`).

| Filename | Category | Applied to remote? | Notes |
| --- | --- | ---: | --- |
| `20250205120000_update_search_trainers.sql` | RPC / search function update (Phase 2) | Yes | Implements triage + filtering logic for `search_trainers`.
| `20250207121500_phase3_profiles.sql` | RPC / profile functions (Phase 3) | Yes | Adds `get_trainer_profile` and profile support.
| `20250207145000_phase5_emergency_schema.sql` | Schema additions (Phase 5 emergency) | Yes | Adds emergency columns, `council_contacts`, and `search_emergency_resources` RPC.
| `20250208103000_phase5_emergency_automation.sql` | Schema & automation tables (Phase 5) | Yes | New types and multiple AI/ops tables (triage logs, verification runs, daily digests).
| `20251130000001_add_abn_matched_json.sql` | ABN patch (jsonb column) | Yes | Adds `matched_json` jsonb column to `abn_verifications` (nullable).
| `20251202093000_create_abn_and_business_abn_columns.sql` | ABN feature (table + columns) | Yes | Creates `abn_verifications` table and ABN columns on `businesses`.

---

## Migrations archive (`supabase/migrations_archive/`)

The `migrations_archive/` directory contains archived SQL files and exports that are kept for historical reference, data seeds, or full-schema dumps. Files in this folder are intentionally not included in `supabase db push` and should not be moved back into `supabase/migrations/` without a manual review and approval.

Key archive entries in this repo:

- `20250207150000_phase5_emergency_seed.sql` — Phase 5 seed data (council contacts + emergency resources). This is a data seed and is typically applied manually or via an ops-runner, not via automatic migration pushes.
- `20251129095232_remote_schema.sql` — Placeholder/legacy remote schema export (currently empty or placeholder). Kept for traceability — DO NOT reintroduce without review.
- `20251202101000_create_full_schema.sql` — Full canonical schema dump (idempotent). Useful as a reference or for manual applies when migrating remote databases, but not used by automated migration tooling.

---

## Workflow reminder

- Use `supabase db push` or `supabase db migrate` for applying schema changes that live in `supabase/migrations/`.
- Keep seeds and large canonical dumps in `supabase/migrations_archive/` and apply them manually when needed (ops-only).
- Always back up remote DB before applying big changes (see `DOCS/automation/REMOTE_DB_MIGRATIONS.md`).
