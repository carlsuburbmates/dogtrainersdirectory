# Ops Runbook — Post-launch Operations (Reality)

**Status:** Canonical (Tier-1)  
**Version:** v1.3
**Last Updated:** 2026-03-19

## 1. Operating model (canonical)
Ops is **pull-based**:
- Status strip / dashboards show state
- Queues are action surfaces
There is **no support inbox** concept in code.

### 1.1 Automation supervision model
Automation supervision is dashboard-first.

Canonical operator expectations:
- use `/admin/ai-health` as the primary automation supervision surface
- review exceptions, audit trails, and bounded overrides rather than clearing routine AI queues
- keep supervision mobile-friendly and low-noise by default
- rely on off-dashboard escalation only for critical exceptions, blocked review states, or explicit disable events

## 2. Admin surfaces (canonical)
- `/admin` — overview
- `/admin/ai-health` — AI mode, rollout state, health visibility, and supervised automation readiness
- `/admin/cron-health` — cron monitoring
- `/admin/errors` — error monitoring
- `/admin/reviews` — moderation queues
- `/admin/triage` — triage monitoring

### 2.1 Weekly verification and ABN loop
- The canonical weekly exception pass for verification and ABN-support work now starts on `/admin`.
- Verification exceptions and ABN manual reviews should be worked from one bounded operator loop rather than separate ad hoc checks across the queue, fallback telemetry, and verification traces.
- The loop may surface deterministic next-safe-action guidance and recent fallback context, but final ABN approval or rejection and any verification-state change still require the explicit operator action.
- A degraded or missing guidance trace must not block the queue from loading; operators should still be able to clear the available exception items.

### 2.2 Scaffold-review guidance at decision time
- The scaffolded listing queue on `/admin` may surface the existing shadow-only scaffold-review guidance candidate directly on each operator decision card.
- The operator should use that checklist and next-safe-action guidance to clear the weekly scaffold-review pass with lower switching cost.
- The guidance remains assistive only:
  - approval and rejection still happen only through the explicit scaffold-review operator action
  - the surfaced guidance does not by itself change publication, verification, featured/spotlight, billing, or ranking state
- If the shadow guidance trace is missing or degraded, the scaffold queue must still load and remain actionable through the deterministic operator path.

## 3. Key admin API capabilities (examples)
- Moderation run loop: `/api/admin/moderation/run` (cron daily at 01:00 AEST/AEDT on the current Vercel Hobby-compatible schedule)
- Ops digest: `/api/admin/ops-digest` (daily)
- Monetisation resync/overview: `/api/admin/monetization/*`
- DLQ replay: `/api/admin/dlq/replay`

### 3.1 Ops digest evidence collection
- The canonical review-evidence path for `ops_digest` is the persisted `daily_ops_digests` table.
- Reviewable shadow evidence is collected by:
  - the scheduled `/api/admin/ops-digest` run, or
  - a manual forced `POST /api/admin/ops-digest?force=true`
- A digest run only counts toward controlled-live review when it is persisted in `daily_ops_digests` with `ai_mode='shadow'`.
- The evidence threshold is `7` distinct reviewable shadow runs, not `7` calendar days.
- Multiple qualifying `ops_digest` runs may share the same `digest_date` when they are forced review runs, but each counted run must be separately persisted and reconstructable by row `id` and `created_at`.
- A cached re-read of an existing digest row does not count as a new reviewable run.
- Local-only or non-persisted fallback digests do not count toward the seven-run shadow evidence window.
- If the service-role-backed persistence path is unavailable, the operator surface must say so explicitly rather than presenting the digest as reviewable evidence.
- For the current bounded `ops_digest` live cycle, a reviewed pause may later resume to `controlled_live` only through the canonical rollout-control mutation path after a separate approval decision. Operators must not treat `paused_after_review` as an informal toggle back to live.

## 4. Known gaps / risks (from bundle)
- **Resolved:** Admin auth enforcement is now consistent across `/admin/**` and `/api/admin/**` (see `10_SECURITY_AND_PRIVACY.md`).
- No background worker framework is present; cron + request-driven work are primary.

## 5. Verification harnesses
- `scripts/verify_launch.ts` — launch gate checks
- `scripts/verify_phase9b.ts` — monetisation + build/test harness

## 6. Alerts
Env-driven alerts exist for email/Slack/webhook (see `ENV_VARS_INVENTORY.md` and `OPS_REALITY.md`).

Canonical alert posture:
- dashboard state is the default source of automation truth
- alerts should remain low-noise and critical-only
- alerts are appropriate for critical exceptions, repeated disable-worthy failures, or blocked operator review states
- non-critical shadow review and readiness signals should remain on-dashboard

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

## 14. Commercial Funnel Baseline (2026-03-01)
- Baseline type: controlled engineering sample, not organic production traffic.
- Environment: local Next.js dev server against the live-backed Supabase project `xqytwtmdilipxnjetvoe`.
- Sample path exercised, in order:
  - `POST /api/emergency/triage`
  - `GET /api/public/search?q=anxious&limit=1&flow_source=triage`
  - `GET /trainers/999999?flow_source=triage`
  - `GET /promote`
  - `POST /api/stripe/create-checkout-session` with an empty JSON body

### 14.1 Funnel stage baseline (24h window)
| Stage | Count | Avg ms | P95 ms | Success rate | Last seen (UTC) |
|---|---:|---:|---:|---:|---|
| `triage_submit` | 1 | 4155 | 4155 | 0.00 | `2026-03-01T14:24:44Z` |
| `search_results` | 1 | 520 | 520 | 0.00 | `2026-03-01T14:24:45Z` |
| `trainer_profile_view` | 1 | 368 | 368 | 0.00 | `2026-03-01T14:24:46Z` |
| `promote_page_view` | 1 | 0 | 0 | 0.00 | `2026-03-01T14:24:46Z` |
| `promote_checkout_session` | 1 | 283 | 283 | 0.00 | `2026-03-01T14:24:47Z` |

### 14.2 Supporting latency baseline (24h window)
| Area | Count | Avg ms | P95 ms | Success rate |
|---|---:|---:|---:|---:|
| `commercial_funnel` | 5 | 1065 | 4155 | 0.00 |
| `emergency_triage_api` | 1 | 3976 | 3976 | 0.00 |
| `search_suburbs` | 1 | 197 | 197 | 0.00 |
| `trainer_profile_page` | 1 | 209 | 209 | 0.00 |

### 14.3 Search responsiveness baseline (24h window)
- `search_telemetry` samples: `1`
- Average latency: `197 ms`
- Max latency: `197 ms`
- Success rate: `0.00`

### 14.4 Observed friction points from the first baseline pass
- `POST /api/emergency/triage` returned `500` with: `null value in column "description" of relation "emergency_triage_logs" violates not-null constraint`.
- `GET /api/public/search` returned `500` because the live API surface could not find `public.search_trainers(...)`.
- The live database also does not currently expose `public.get_trainer_profile(...)`, so trainer profile requests fall back instead of using the intended RPC path.
- `GET /promote` rendered successfully, but the controlled sample had no business context, so this is only a page-render baseline, not a commercial conversion baseline.
- `POST /api/stripe/create-checkout-session` returned `400` in the controlled sample because the request intentionally omitted `businessId`; this confirms instrumentation on invalid checkout attempts, not a successful payment path.

### 14.5 Operational interpretation
- The telemetry write path is working and the new `commercial_funnel` instrumentation is live.
- This baseline is useful as an engineering reference point only; it is not representative of real user demand or conversion.
- Market optimization can proceed, but this baseline should still be treated as controlled engineering traffic rather than organic demand.

### 14.6 Controlled live verification dataset (PH-205 + MO-307)
- The live project now uses a controlled demo baseline for directory verification and comparison depth.
- Current controlled records:
  - `business_id = 1` `DTD Verification Trainer PH205` (`Collingwood`, `City of Yarra`)
  - `business_id = 2` `DTD Demo Trainer Carlton Foundation` (`Carlton`, `City of Melbourne`)
  - `business_id = 3` `DTD Demo Trainer South Melbourne Reactive` (`South Melbourne`, `City of Port Phillip`)
  - `business_id = 4` `DTD Demo Trainer Fitzroy Social` (`Fitzroy`, `City of Yarra`)
- The controlled inventory now supports:
  - `4` active searchable listings total
  - `3` suburbs
  - `3` councils
  - multiple service types and non-homogeneous fit combinations
- Deterministic live verification query:
  - `GET /api/public/search?q=DTD%20Demo&limit=10`
  - expected result set: business IDs `2`, `4`, `3`
- These records are for controlled environment verification and product comparison only; they are not production-vetted customer businesses.
- Reproducibility path:
  - reuse `data/suburbs_councils_mapping.csv` for suburb/council linkage
  - apply a controlled `psql` transaction for the minimal additive business + trainer relation rows
  - preserve the `PH-205` verification fixture unless a later controlled import explicitly replaces it
  - avoid broad seed imports unless explicitly intended
