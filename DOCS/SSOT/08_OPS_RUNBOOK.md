# Ops Runbook — Post-launch Operations (Reality)

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Operating model (canonical)
Ops is **pull-based**:
- Status strip / dashboards show state
- Queues are action surfaces
There is **no support inbox** concept in code.

## 2. Admin surfaces (canonical)
- `/admin` — overview
- `/admin/ai-health` — AI mode + health visibility
- `/admin/cron-health` — cron monitoring
- `/admin/errors` — error monitoring
- `/admin/reviews` — moderation queues
- `/admin/triage` — triage monitoring

## 3. Key admin API capabilities (examples)
- Moderation run loop: `/api/admin/moderation/run` (cron every 10 minutes)
- Ops digest: `/api/admin/ops-digest` (daily)
- Monetisation resync/overview: `/api/admin/monetization/*`
- DLQ replay: `/api/admin/dlq/replay`

## 4. Known gaps / risks (from bundle)
- Admin auth is inconsistent across `/api/admin/**` endpoints (some TODO/no checks). Treat as a launch risk: tighten auth.
- No background worker framework is present; cron + request-driven work are primary.

## 5. Verification harnesses
- `scripts/verify_launch.ts` — launch gate checks
- `scripts/verify_phase9b.ts` — monetisation + build/test harness

## 6. Alerts
Env-driven alerts exist for email/Slack/webhook (see `ENV_VARS_INVENTORY.md` and `OPS_REALITY.md`).

## 7. Environment + connections (canonical)
- Remote-first: use a Supabase dev/staging project for daily development and ops testing.
- `.env.local` is required (copy from `.env.example`) and must never be committed.
- For ops scripts, prefer the **session pooler** connection string for `SUPABASE_CONNECTION_STRING` (avoids IPv6-only direct hosts).
- `config/env_required.json` is the definitive list of required environment variables.

## 8. Schema + migrations (canonical)
- **Source of truth:** `supabase/migrations/` (lexical order).
- `supabase/schema.sql` is a **derived snapshot**; refresh with `npm run schema:refresh`.
- Remote apply helper (ops-only): `scripts/try_remote_apply.sh` (prefer CI or Supabase dashboard).
- Data import validator: `npm run validate-import` (checks `supabase/schema.sql` and `supabase/data-import.sql`).
- Suburb/council source data lives in `data/suburbs_councils_mapping.csv` (regenerate from SQL via `npm run data:refresh`).

## 9. Local DB helpers (optional)
- `npm run db:start` — start local Postgres and apply migrations.
- `npm run db:seed` — apply seed data only.
- `npm run dev:local` — start local DB + Next dev server.
- Scripts: `scripts/local_db_start_apply.sh`, `scripts/local_db_stop.sh`, `scripts/local_db_verify.sh`, `scripts/test_apply_migrations.sh`.
- Local containers are aligned to **Postgres 17** to match Supabase.

## 10. ABN / ABR operations
- Controlled batch runner: `scripts/abn_controlled_batch.py` (dry-run by default; use `--apply` with `AUTO_APPLY=true`).
- Re-check job: `scripts/abn_recheck.py` (scheduled).
- Allowlist generation: `scripts/generate_allowlist.py` reads `data/abn_allowlist.{staging,prod}.csv` and writes `scripts/controlled_abn_list.*.json` (git-ignored).
- Required envs for writes: `ABR_GUID`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONNECTION_STRING`.
- Raw ABR matches are persisted in `abn_verifications.matched_json` for auditability.

## 11. Verification + health harnesses
- Launch gate: `scripts/verify_launch.ts`
- Phase 9B verifier: `scripts/verify_phase9b.ts`
- Smoke checks: `scripts/smoke_checks.sh`
- Tests: `npm test` (see `tests/smoke/*` for ops coverage)

## 12. AI evaluation harness
- Offline evaluation: `scripts/evaluate_ai.ts` (reads golden sets, prints metrics).
- Optional DB persistence when service role key is present.

## 13. Phase 2 scraper inputs (optional)
- Inputs live in `data/phase2_scraper_targets.csv`.
- Generator: `scripts/run_phase2_scraper.py` (writes `supabase/phase2_scraped.json`).
