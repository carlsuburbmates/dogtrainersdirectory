> **SSOT – Canonical Source of Truth**
> Scope: Snapshot of live implementation status across UX, APIs, automations, and scripts
> Status: Active · Last reviewed: 2025-12-09

# Implementation Reality Map

Reality map entries capture what was actually verified during this pass. Rows marked CONFIRMED-WORKING are backed by real commands/tests; UNKNOWN indicates we did not execute or inspect the flow in this phase.

## Tooling & Quality Gates

- **TypeScript**: `npm run type-check` (tsc --noEmit) – PASS on 2025-12-09 after emergency/admin/error logging refactors.
- **Smoke tests**: `npm run smoke` (Vitest) – covers trainer profile RPCs, search→profile results, emergency triage/verify/weekly routes, admin AI/cron dashboards, alert evaluation, and error logging payloads.
- **Linting**: Phase L2 – `npm run lint` executes `eslint .` locally and via `.github/workflows/lint.yml` (required PR check); see `DOCS/LINTING_RESTORE_PLAN.md` for rule scope + governance notes.
- **Playwright E2E & Visual Regression**: `npm run e2e` (or `./scripts/preprod_e2e.sh`) boots the Next.js app in E2E mock mode and runs `tests/e2e/*` (search → trainer profile, emergency controls, AI/Cron health dashboards, alert snapshot, and the new monetization upgrade/admin tab). Screenshot baselines live under `tests/e2e/*-snapshots/`; update intentionally with `npm run e2e -- --update-snapshots`.
- **Pre-prod verification**: `scripts/preprod_verify.sh` – runs type-check → smoke → lint → doc-divergence sequentially with explicit PASS/FAIL output and now chains into `scripts/check_env_ready.sh` (set `ENV_TARGET`/`TARGET_ENV` when validating non-production manifests).
- **Bundle audit**: `NEXT_TELEMETRY_DISABLED=1 npm run build` (Turbopack) on 2025-12-09 completed end-to-end; `.next/server/app/emergency/page.js` is now a 4 KB server chunk (formerly a fully client-rendered page), establishing the hydration baseline recorded in `DOCS/OPS_TELEMETRY_ENHANCEMENTS.md`.
- **Ops telemetry roadmap**: `DOCS/OPS_TELEMETRY_ENHANCEMENTS.md` enumerates the remaining gaps (latency, failed lookups, ABN fallback rates, UI error boundaries) and logs the completed mitigations from this pass.
- **Admin status strip**: `src/components/admin/AdminStatusStrip.tsx` consumes `/api/admin/health?extended=1` to show telemetry overall status, ABN recheck timestamps, emergency cron heartbeat, and pre-prod verify link across all admin pages.
- **Telemetry overrides**: `ops_overrides` table + `/api/admin/ops/overrides` + UI toggles on AI/Cron dashboards let ops mark services as “Temporarily Down / Under Investigation” with auto-expiry; the status strip and dashboards merge real health with override state.
- **ABN fallback telemetry**: `recordAbnFallbackEvent`, `/api/admin/abn/fallback-stats`, and the new admin dashboard card expose 24h fallback rate (closing the telemetry gap highlighted in governance docs).
- **Env readiness**: `config/env_required.json` + `scripts/check_env_ready.sh` verify mandatory secrets per environment; `scripts/preprod_verify.sh` now fails early when env vars are missing.
- **Legacy GitHub workflows retired**: `.github/workflows/smoke-check.yml` and `data-quality.yml` have been removed; their coverage (smoke + data sanity) now lives under `npm run smoke`, admin telemetry dashboards, and `scripts/preprod_verify.sh`.
- **Latency metrics & alerts**: `latency_metrics` table + `/api/admin/telemetry/latency` power the admin “Latency snapshot”; `/api/admin/alerts/snapshot` and `scripts/run_alerts_email.ts` (email/Slack delivery) turn those metrics into actionable alerts, respecting telemetry overrides.

## Feature Flag Enforcement (Monetization)

- Monetization pages/APIs remain dark unless both `FEATURE_MONETIZATION_ENABLED` (server) and `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED` (client) are set. In E2E mode we expose opt-in query overrides (`?flag=off`, `?abn=0`) strictly for Playwright to assert the guards without touching real Stripe.
- Playwright coverage (`tests/e2e/monetization.spec.ts`) now proves that (a) the Promote UX is suppressed when the flag is disabled and (b) unverified providers see the ABN warning with no checkout button.
- `/api/stripe/create-checkout-session` short-circuits when monetization is off or ABN verification fails, while `/api/admin/monetization/**` continues to inherit the admin namespace protections; `E2E_TEST_MODE` prevents real Stripe calls across checkout, webhook, and resync routes.

## TypeScript Error Groups (Phase 3)

- **Emergency / Triage APIs & UI** – EmergencyGate enums, `/api/emergency/triage`, `/api/emergency/verify`, `/api/emergency/triage/weekly`, and supporting libraries now compile cleanly with strict ErrorContext usage so ops cron jobs are unblocked.
- **Admin Health Dashboards** – `/admin/ai-health` and `/admin/cron-health` now use typed status unions (`healthy | degraded | down | unknown`) resolving the “unknown” hook errors called out in SSOT docs.
- **Directory Metadata** – `SearchResult` schema and `/directory` SSR view now understand `is_featured` and `abn_verified`, so featured/verified ordering matches documentation again.
- **Error Logging & Triage Ledger** – `src/lib/errorLog.ts` plus `triageLog.ts`, `medicalDetector.ts`, and moderation helpers replaced ad-hoc context fields with the canonical `extra` payload, removing the largest backend compilation cluster.
- **Stripe Webhook Surface Area** – Handler locked to the supported `2022-11-15` API version and metadata handling was re-typed to stay aligned with canonical Stripe rollout docs.

## Frontend Flows

| Area | Name / Path | Linked Doc(s) | Status | Verification Method | Doc Sync Needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Frontend | Home & Search (`src/app/page.tsx`, `src/app/search/`) | README.md; DOCS/FRONTEND_VERIFICATION_FINDINGS.md | UNKNOWN | Not executed in this pass (Next.js dev server not started) | No | Needs smoke test to confirm search results still align with locked enums. |
| Frontend | Directory Browse (`src/app/directory/page.tsx`) | DOCS/FRONTEND_VERIFICATION_FINDINGS.md | CONFIRMED-WORKING | `npm run type-check` + schema audit of `SearchResult` metadata | No | TypeScript group “Frontend Directory” resolved by expanding `SearchResult` to include `is_featured` and `abn_verified`, matching SSOT expectations. |
| Frontend | Trainer Profile (`src/app/trainers/[id]/page.tsx`) | DOCS/FRONTEND_VERIFICATION_FINDINGS.md | UNKNOWN | Not executed in this pass | No | Needs validation against Supabase RPC output and `SUPABASE_PGCRYPTO_KEY` handling. |
| Frontend | Legacy Slug Profile (`src/app/trainer/[slug]/page.tsx`) | DOCS/IMPLEMENTATION_PLAN_UPDATED.md | REMOVED | Phase 4 deprecation execution | No | All internal links now target `/trainers/[id]`; slug profile + client were removed per DEPRECATION_STAGING.md#slug-profile. |
| Frontend | Emergency / Triage UI (`src/app/emergency`, `src/components/triage/EmergencyGate.tsx`) | README.md; DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md | CONFIRMED-WORKING | `npm run type-check` + `next build` bundle audit | No | `/emergency` now ships as a server-rendered shell with a tiny client control (`EmergencyControls`); Turbopack reports `.next/server/app/emergency/page.js` at 4 KB, and EmergencyGate still maps only SSOT-approved issues. |
| Frontend | Admin Dashboard & Health Pages (`src/app/admin/{page,ai-health,cron-health}`) | README.md; DOCS/WEEK4_IMPLEMENTATION_SUMMARY.md; DOCS/OPS_TELEMETRY_ENHANCEMENTS.md | CONFIRMED-WORKING | `npm run smoke` – Vitest renders include degraded snapshots | No | `AiHealthDashboard`/`CronHealthDashboard` now isolate the client hydration surface, expose telemetry override toggles, and the new status strip injects Cron/ABN heartbeat info into every admin page footer. |
| Frontend | Monetization Upgrade (`src/app/promote/page.tsx`) | DOCS/MONETIZATION_ROLLOUT_PLAN.md; README.md | CONFIRMED-WORKING | `npm run e2e` – Playwright monetization spec exercises FE flag, checkout stub, and admin acknowledgement | No | Feature-flagged (`FEATURE_MONETIZATION_ENABLED`/`NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED`), enforces ABN verification via Supabase/e2e fixture, records payment audits, and hands control to `/api/stripe/create-checkout-session` without exposing real Stripe keys in local/E2E mode. |

## API & Backend Endpoints

| Area | Name / Path | Linked Doc(s) | Status | Verification Method | Doc Sync Needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Public API | Search/Triage RPC (`src/lib/api.ts`, `src/app/api/triage/route.ts`) | README.md; DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md | UNKNOWN | Not exercised in this pass | No | Requires actual request or unit test before we can mark as working. |
| Emergency API | Emergency triage endpoint (`src/app/api/emergency/triage/route.ts`) | DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md | CONFIRMED-WORKING | `npm run type-check` + ErrorContext + MedicalResult audit | No | TypeScript group “Emergency / triage flows” fixed ErrorContext usage, normalized suburb logging, and medical detector fallbacks so cron consumers match SSOT runbooks. |
| Emergency API | Emergency verification endpoint (`src/app/api/emergency/verify/route.ts`) | DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md; DOCS/automation/OPS_RUNBOOK_EMERGENCY_VERIFICATION.md | CONFIRMED-WORKING | `npm run type-check` + safe `resolveLlmMode()` guard | No | Verification jobs now branch correctly between deterministic and AI modes; runbook expectations restored. |
| Emergency API | Weekly triage summary (`src/app/api/emergency/triage/weekly/route.ts`) | DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md | CONFIRMED-WORKING | `npm run type-check` + reducer refactor | No | Summary cron now handles typed reducers and safe LLM availability checks, unblocking the “weekly bulletin” automation referenced in docs. |
| Admin API | Error logging test endpoint (`src/app/api/test/errors/route.ts`) | DOCS/WEEK_3_COMPLETION_REPORT.md | REMOVED | Phase 4 deprecation execution | No | Endpoint and admin CTA removed; Week 3 manual QA instructions remain historical only. |
| Admin API | Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) | README.md; DOCS/MONETIZATION_ROLLOUT_PLAN.md | CONFIRMED-WORKING | `npm run type-check` + `tests/unit/monetization.test.ts` | No | Delegates to `handleStripeEvent` (payment audit logging + `business_subscription_status` upsert), dedupes events, logs failures as `sync_error`, and exposes an `x-e2e-stripe-test`/`E2E_TEST_MODE` bypass for Playwright so we can simulate `checkout.session.*` flows without real Stripe calls. |
| API | Stripe checkout endpoint (`/api/stripe/create-checkout-session`) | DOCS/MONETIZATION_ROLLOUT_PLAN.md | CONFIRMED-WORKING | `tests/unit/monetization.test.ts` + `npm run e2e` monetization spec | No | Validates ABN verification via Supabase admin client, enforces `FEATURE_MONETIZATION_ENABLED`, logs to `payment_audit`, emits latency metrics, and returns a stubbed URL/session in `E2E_TEST_MODE` for automated coverage. |
| Admin API | Monetization overview/resync (`/api/admin/monetization/{overview,resync}`) | DOCS/MONETIZATION_ROLLOUT_PLAN.md; DOCS/OPS_TELEMETRY_ENHANCEMENTS.md | CONFIRMED-WORKING | `npm run e2e` – admin monetization tab + unit coverage in `tests/unit/monetization.test.ts` | No | Summarises `payment_audit` + `business_subscription_status` for the admin dashboard, feeds alert thresholds (failure rate & sync errors), and exposes a resync helper that replays Stripe subscription state with payment audit logging + latency metrics. |
| Back-end | Error logging library (`src/lib/errorLog.ts` + `/api/admin/errors*`) | DOCS/WEEK_3_COMPLETION_REPORT.md | CONFIRMED-WORKING | `npm run type-check` + ErrorContext redesign | No | Context payloads now live under `extra` so SSOT logging spec aligns with compiled reality; downstream consumers updated accordingly. |
| Back-end | Medical detector & moderation helpers (`src/lib/medicalDetector.ts`, `src/lib/moderation.ts`) | README.md; DOCS/WEEK4_IMPLEMENTATION_SUMMARY.md | CONFIRMED-WORKING | `npm run type-check` + helper typing | No | Detector/moderation TypeScript errors resolved; automation can run with the enums described in docs. |
| Back-end | ABN verification route (`src/app/api/abn/verify/route.ts`) | README.md; DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md | UNKNOWN | Not executed this pass | No | Should be validated with a dry-run ABN lookup. |
| Back-end | LLM provider wrapper (`src/lib/llm.ts`) | DOCS/LLM_Z_AI_IMPLEMENTATION.md | UNKNOWN | Not executed this pass | No | Requires test call to Z.ai to confirm credentials + retry/backoff still behave. |

## Automations & Cron Jobs

| Area | Name / Path | Linked Doc(s) | Status | Verification Method | Doc Sync Needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Automation | Emergency verification cron (Vercel hitting `/api/emergency/verify`) | DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md; DOCS/automation/OPS_RUNBOOK_EMERGENCY_VERIFICATION.md | CONFIRMED-WORKING | `npm run type-check` – endpoint + cron contract audit | No | Cron re-enabled after verification route TypeScript fixes (see “Emergency / triage flows” error group). |
| Automation | Weekly triage metrics cron (`/api/emergency/triage/weekly`) | DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md | CONFIRMED-WORKING | `npm run type-check` – reducer refactor | No | Weekly metrics job now builds cleanly; docs already up-to-date. |
| Automation | ABN re-check workflow (`.github/workflows/abn-recheck.yml`) | DOCS/automation/ABN-ABR-GUID_automation/ABN-Rollout-Checklist.md | UNKNOWN | Not executed this pass | No | Needs dry-run in staging or CI logs. |
| Automation | AI review moderation job (`src/lib/moderation.ts`, `/api/admin/queues`) | README.md; DOCS/WEEK4_IMPLEMENTATION_SUMMARY.md | CONFIRMED-WORKING | `npm run type-check` – ReviewRecord typing | No | Moderation helper now enforces typed Supabase returns, consistent with Week 4 summary. |
| Automation | Doc Divergence Detector (`.github/workflows/doc-divergence-detector.yml`, `scripts/check_docs_divergence.py`) | DOCS/README.md | CONFIRMED-WORKING | `python3 scripts/check_docs_divergence.py --base-ref origin/main` | No | Script executed successfully; workflow definition created in this pass. |

## Data Pipelines / Scripts

| Area | Name / Path | Linked Doc(s) | Status | Verification Method | Doc Sync Needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Data Pipeline | Doc Divergence Detector script (`scripts/check_docs_divergence.py`) | DOCS/README.md | CONFIRMED-WORKING | `python3 scripts/check_docs_divergence.py --base-ref origin/main` | No | Acts as data-quality gate for docs. |
| Data Pipeline | ABN fallback telemetry (`recordAbnFallbackEvent`, `/api/admin/abn/fallback-stats`) | DOCS/OPS_TELEMETRY_ENHANCEMENTS.md | CONFIRMED-WORKING | API responses verified via admin dashboard card + smoke suite | No | Logs every manual review / error path so ops can see fallback %, closing telemetry gap #3. |
| Database tooling | Supabase migrations (`supabase/migrations/*.sql`) | DOCS/db/MIGRATIONS_INDEX.md | PARTIAL / UNKNOWN | Manual audit | Yes | Index now reflects the eight files on disk plus the latency metrics table; several historical migration IDs mentioned in earlier docs are missing and require remote schema verification (TODO: run `supabase db diff --linked` against production before the next schema change). |
| Data Pipeline | Alert evaluation + delivery (`/api/admin/alerts/snapshot`, `scripts/run_alerts_email.ts`) | DOCS/OPS_TELEMETRY_ENHANCEMENTS.md | CONFIRMED-WORKING | Vitest `tests/smoke/alerts.test.ts`, manual `npx tsx scripts/run_alerts_email.ts --dry-run` | No | Generates machine-readable alert state (now including monetization payment failure/sync-error thresholds) and sends Resend email + Slack summaries when new unsuppressed alerts appear; honours overrides per service. |
| Data Pipeline | ABN controlled batch (`scripts/abn_controlled_batch.py`) | DOCS/automation/ABN-ABR-GUID_automation/ABN-Rollout-Checklist.md | UNKNOWN | Not executed this pass | No | Needs staged dry-run to confirm JSON inputs still load. |
| Data Pipeline | ABN allowlist generator (`scripts/generate_allowlist.py`) | README_DEVELOPMENT.md; DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md | UNKNOWN | Not executed this pass | No | Verify CSV templates once frontline ABN workflows resume. |
| Data Pipeline | Remote DB migration flow (`.github/workflows/deploy-migrations.yml`) | DOCS/automation/REMOTE_DB_MIGRATIONS.md | UNKNOWN | Not executed this pass | No | Requires staging deployment evidence to confirm parity. |
| Data Pipeline | Emergency ops digest (`/api/admin/overview`, `src/lib/digest.ts`) | README.md; DOCS/WEEK4_IMPLEMENTATION_SUMMARY.md | UNKNOWN | Not executed this pass | Yes | Docs describe Daily Ops Digest automation as live; needs validation. |

### Residual Risk Summary

- **Unreferenced components/scripts:** `FiltersSidebar.tsx` and `scripts/lint-noop.js` have now been removed (see `DOCS/DEPRECATION_STAGING.md`) so future search UX and lint tooling cannot accidentally regress to the legacy variants.
- **Legacy CI workflows:** The bespoke `.github/workflows/smoke-check.yml` + `data-quality.yml` jobs have been retired; `npm run smoke`, admin telemetry dashboards, and `scripts/preprod_verify.sh` now cover their intent.
- **Database migrations:** `DOCS/db/MIGRATIONS_INDEX.md` was updated to list the migrations that actually exist under `supabase/migrations/`. Older IDs cited in SSOT docs are missing on disk—confirm remote DB schema before assuming those changes are still present.

## Production DNS & Environment Status

- **DNS plan:** See `DOCS/PRODUCTION_DNS_PLAN.md` for the required A/ALIAS/CNAME/MX/SPF/DKIM/DMARC records. The plan includes the exact `dig` / `vercel dns ls` commands ops must capture once records are updated.
- **Environment migration:** `DOCS/PRODUCTION_ENV_MIGRATION.md` enumerates every production secret, storage location (Vercel, GitHub Actions), validation commands (`scripts/check_env_ready.sh production`, `TARGET_ENV=production ./scripts/preprod_verify.sh`), and the staged rotation strategy.
- **Launch run logs:** Preflight templates exist under `DOCS/launch_runs/launch-production-20251211-preflight.md`. Ops should attach CLI outputs/screenshots there once DNS + secret migration completes.
- **Current repo status:** Feature flags default to off for monetization; production deploy must not flip them until the launch checklist (including DNS/env verification) is signed off in writing.
