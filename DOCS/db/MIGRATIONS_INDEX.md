# Migrations index (supabase/migrations)

This page summarizes the SQL migration files stored under `supabase/migrations/` and explains the role of `supabase/migrations_archive/`.

> Note: The "Applied to remote?" column is set to **Yes** for the baseline project migrations in this index (these migrations correspond to the recent remote migration pushes used during Phase rollout). Always verify remote state before applying more migrations (see `DOCS/automation/REMOTE_DB_MIGRATIONS.md`).

| Filename | Category | Applied to remote? | Notes |
| --- | --- | ---: | --- |
| `20250205120000_update_search_trainers.sql` | RPC / search function update (Phase 2) | Yes | Implements triage + filtering logic for `search_trainers`.
| `20250207121500_phase3_profiles.sql` | RPC / profile functions (Phase 3) | Yes | Adds `get_trainer_profile` and profile support.
| `20250207145000_phase5_emergency_schema.sql` | Schema additions (Phase 5 emergency) | Yes | Adds emergency-related columns, `council_contacts`, and `search_emergency_resources` RPC.
| `20250208103000_phase5_emergency_automation.sql` | Schema & automation tables (Phase 5) | Yes | Adds ops/automation tables used by emergency triage, digests, and verification runs.
| `20250208132000_fix_search_trainers_review_count.sql` | Fix / maintenance (Phase 5) | Yes | Repair of trainer search review-count logic.
| `20250210140000_restore_search_trainers_signature.sql` | Fix / maintenance | Yes | Restores signature handling for search trainers RPC.
| `20250210141000_fix_decrypt_sensitive.sql` | Fix / maintenance | Yes | First of several decrypt_sensitive / key changes.
| `20250210143000_fix_decrypt_sensitive_nullsafe.sql` | Fix / maintenance | Yes | Null-safe handling for decrypt_sensitive.
| `20250210152000_add_decrypt_sensitive_key_arg.sql` | RPC update | Yes | Adds `p_key` argument to decrypt_sensitive where needed.
| `20250210153000_search_trainers_accept_key.sql` | RPC update | Yes | Make `search_trainers` accept optional `p_key` for decryption.
| `20250210160000_get_trainer_profile_accept_key.sql` | RPC update | Yes | Make `get_trainer_profile` accept optional `p_key` for decrypt.
| `20251130000001_add_abn_matched_json.sql` | Schema / ABN | Yes | Adds `matched_json` jsonb column to `abn_verifications`.
| `20251202093000_create_abn_and_business_abn_columns.sql` | Schema / ABN | Yes | Creates `abn_verifications` table and `business.abn` columns.

---

## Migrations archive (`supabase/migrations_archive/`)

The `migrations_archive/` directory contains archived SQL files and exports that are kept for historical reference, data seeds, or full-schema dumps. Files in this folder are intentionally not included in `supabase db push` and should not be moved back into `supabase/migrations/` without a manual review and approval.

Key archive entries in this repo (DO NOT apply automatically):

- `20250207150000_phase5_emergency_seed.sql` — Phase 5 seed data (council contacts + emergency resources). This is a data seed and should be applied manually by ops when necessary; do not include it in automated migration flows.
- `20251129095232_remote_schema.sql` — Placeholder/legacy remote schema export (currently empty or placeholder). Kept for traceability — DO NOT reintroduce into active migrations without manual review.
- `20251202101000_create_full_schema.sql` — Full canonical schema dump (idempotent). Use for reference or manual restores; not for automated migration tooling.

**Archive policy:**
- Active migrations live under `supabase/migrations/` and are the source-of-truth for CI/`supabase db` flows.
- Archive files are historical snapshots, seed scripts, or dumps; they are intentionally excluded from automated migrations and require manual review to re-use.
- If a file in `migrations_archive/` needs to be promoted to active migrations, run a change control PR with a clear justification and update `DOCS/db/MIGRATIONS_INDEX.md` accordingly.

---

## Workflow reminder

- Use `supabase db push` or `supabase db migrate` for applying schema changes that live in `supabase/migrations/`.
- Keep seeds and large canonical dumps in `supabase/migrations_archive/` and apply them manually when needed (ops-only).
- Always back up remote DB before applying large changes and consult `DOCS/automation/REMOTE_DB_MIGRATIONS.md` for a safe apply checklist.

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
