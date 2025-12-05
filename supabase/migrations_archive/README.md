# supabase/migrations_archive — archived SQL artifacts

This directory contains archived SQL artifacts (seeds, full-schema exports, historical snapshots) that are intentionally NOT picked up by automated migration runners (`supabase db push` / `supabase db migrate`).

Purpose:
- Keep large seed files and historical full-schema exports out of the active migrations folder so they are only applied manually by ops.
- Provide a reference history for past one-off operations and backfills.

Important notes:
- Files here are not automatically executed by migration tooling.
- If you need to apply a seed or full-schema dump from this folder, run it manually after taking a backup and reviewing the SQL.
- Do NOT move files from `migrations_archive/` into `migrations/` without a code review and confirmation that they are intended as repeatable migrations.

Examples in this repo:
- `20250207150000_phase5_emergency_seed.sql` — data seed (council contacts + emergency resources) — ops-only.
- `20251129095232_remote_schema.sql` — placeholder legacy export (empty/placeholder) — kept for traceability.
- `20251202101000_create_full_schema.sql` — full schema dump (idempotent) — reference only.
