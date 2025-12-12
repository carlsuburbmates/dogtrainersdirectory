# Migrations index (supabase/migrations)

This page tracks every SQL file under `supabase/migrations/` (current source of truth) and highlights any migration IDs that are referenced in docs but missing on disk. Use it alongside `DOCS/automation/REMOTE_DB_MIGRATIONS.md` when applying changes.

## Active migrations on disk

| Filename | Category | Applied to remote? | Notes |
| --- | --- | ---: | --- |
| `1702059300000_week_3_error_logging.sql` | Schema – error logging tables/RLS | Yes (Week 3 rollout) | Creates `error_logs`, `error_alerts`, and `error_alert_events` plus indexes. |
| `1702075200000_week_4_triage_logs.sql` | Schema – triage telemetry | Yes (Week 4 rollout) | Adds `triage_logs`/`triage_events` tables used by emergency ops. |
| `20241208020000_search_telemetry.sql` | Schema – search telemetry | Yes (Dec 2024) | Adds `search_telemetry` table + indexes for latency tracking. |
| `20250210143000_fix_decrypt_sensitive_nullsafe.sql` | RPC maintenance | Yes (Phase 5) | Makes `decrypt_sensitive` null-safe before key work. |
| `20250210152000_add_decrypt_sensitive_key_arg.sql` | RPC maintenance | Yes (Phase 5) | Adds key argument to helper functions. |
| `20250210153000_search_trainers_accept_key.sql` | RPC update | Yes (Phase 5) | Thread key arg through `search_trainers`. |
| `20250210160000_get_trainer_profile_accept_key.sql` | RPC update | Yes (Phase 5) | Key argument for `get_trainer_profile`. |
| `20251130000001_add_abn_matched_json.sql` | Schema – ABN improvements | Yes (Nov 2025) | Adds `matched_json` column to `abn_verifications`. |
| `20251209093000_add_latency_metrics.sql` | Telemetry – latency metrics | Pending apply | Creates `latency_metrics` table for request duration + success telemetry across search, emergency, admin, and ABN flows. |
| `20251209101000_create_payment_tables.sql` | Create `payment_audit` + `business_subscription_status` tables | Phase 9B | Applied in staging on 2025-12-11 — Evidence: `DOCS/launch_runs/launch-staging-20251211-monetization-preflight.md` |
| `20251212111500_create_abn_fallback_events.sql` | Telemetry – ABN fallback log | Pending apply | Creates `abn_fallback_events` table + indexes for override metrics + admin dashboards. |
| `20251212113000_secure_abn_tables.sql` | Security – ABN RLS | Pending apply | Enables RLS + service-role policy on `abn_verifications`. |
| `20251212114500_create_ops_overrides.sql` | Ops overrides table | Pending apply | Creates `ops_overrides` table with auto-expiring overrides for telemetry dashboards. |

> **Fresh DB bootstrap:** Apply these migrations in order with `supabase db push` or `supabase db remote commit`. After applying, run `scripts/test_abn_recheck.py` and `npm run type-check` to verify RPC compatibility.

## Referenced but missing migrations

Several filenames appear in older SSOT docs but are not present in `supabase/migrations/` today. They likely lived in older branches or were dropped during cleanup. Until we recover or rewrite them, treat the corresponding functionality as covered by newer migrations or manual seeds.

| Filename (missing) | Mentioned in | Action |
| --- | --- | --- |
| `20250205120000_update_search_trainers.sql` | Earlier versions of this doc (Phase 2) | Pending reconciliation – file not present on disk or in repo history; confirm whether `search_trainers` logic already lives in later migrations before next DB change. |
| `20250207121500_phase3_profiles.sql` | Same as above | Pending reconciliation – no historical file found; inspect remote RPC definitions to ensure profile features landed elsewhere. |
| `20250207145000_phase5_emergency_schema.sql` | Same | Pending reconciliation – verify remote emergency tables still match docs even though this migration is absent locally. |
| `20250208103000_phase5_emergency_automation.sql` | Same | Pending reconciliation – determine whether automation tables were applied manually or rolled into other migrations. |
| `20250208132000_fix_search_trainers_review_count.sql` | Same | Pending reconciliation – confirm RPC behaviour (review count) via Supabase history/tests before altering schema. |
| `20250210140000_restore_search_trainers_signature.sql` | Same | Pending reconciliation – likely merged into later 20250210 migrations; double-check remote schema diff before assuming redundancy. |
| `20250210141000_fix_decrypt_sensitive.sql` | Same | Pending reconciliation – ensure decrypt helper behaviour matches documentation despite missing file. |
| `20251202093000_create_abn_and_business_abn_columns.sql` | Earlier doc entries | Pending reconciliation – remote DB already shows `abn_verifications` columns, but capture provenance before future modifications. |

Until these historical IDs are reconciled, keep this section as a reminder during DB diffing.

## Migrations archive (`supabase/migrations_archive/`)

`supabase/migrations_archive/` currently contains:

| Filename | Purpose |
| --- | --- |
| `20251129095232_remote_schema.sql` | Legacy remote schema export (placeholder). |
| `README.md` | Archive policy notes. |

Older docs referenced `20250207150000_phase5_emergency_seed.sql` and `20251202101000_create_full_schema.sql`, but they are not present in the repo right now. If they resurface, log them here with a clear “manual apply only” warning.

## Workflow reminder

- Active migrations live in `supabase/migrations/`. Keep this index in sync whenever a new file is added or removed.
- Use `supabase db diff` or `supabase db remote commit` to regenerate/create migrations, and record the result in this doc plus `DOCS/CHANGE_CONTROL_LOG.md`.
- Archive-only files are reference/seed materials; do **not** push them via automated tooling without a change-control update.
- Before running migrations against remote environments, follow the checklist in `DOCS/automation/REMOTE_DB_MIGRATIONS.md` (backup, apply, verify RPCs).
