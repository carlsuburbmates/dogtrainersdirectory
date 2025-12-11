> **SSOT – Canonical Source of Truth**
> Scope: Ops telemetry enhancement plan
> Status: Active · Last reviewed: 2025-12-09

# Operations Telemetry Enhancements

This document captures the telemetry signals that are currently available across the Dog Trainers Directory stack, highlights the remaining blind spots that block confident production observability, and records the incremental fixes scheduled for the performance & monitoring hardening phase.

## Current Signals

| Signal | Source | Coverage | Notes |
| --- | --- | --- | --- |
| Structured error logging | `src/lib/errorLog.ts` + Supabase `error_logs` | CONFIRMED-WORKING – smoke test `tests/smoke/error-logging.test.ts` validates payload shape and context insertion | Acts as the base feed for dashboards + alert rules; batching + retries confirmed. |
| AI health dashboard | `src/components/admin/AiHealthDashboard.tsx` | CONFIRMED-WORKING – Vitest renders cover healthy + down states | Telemetry override toggle can force “Temporarily Down” or “Under Investigation” for ops drills; expiry enforced in Supabase. |
| Cron health dashboard | `src/components/admin/CronHealthDashboard.tsx` | CONFIRMED-WORKING – Vitest renders cover healthy + degraded states | Shares the override toggle to mark cron outages and ensures the new status strip reflects override state. |
| Admin status strip | `src/components/admin/AdminStatusStrip.tsx` + `/api/admin/health?extended=1` | CONFIRMED-WORKING | Footer banner surfaces telemetry health, last ABN recheck, emergency cron success/failure, and docs link for `scripts/preprod_verify.sh`. |
| Monetization health snapshot | `/api/admin/monetization/overview` + `EnhancedAdminDashboard` monetization tab | CONFIRMED-WORKING – Playwright monetization spec drives the admin tab + vitest unit coverage handles edge cases | Feature-flagged dashboard showing subscription counts, failure rate, sync-error list, and a resync button wired to `/api/admin/monetization/resync`. |
| Smoke suite | `npm run smoke` / `tests/smoke/*` | CONFIRMED-WORKING | Covers trainers RPC, emergency APIs, admin dashboards, error logging payloads, and the dashboard failure simulations. |
| Pre-prod verification | `scripts/preprod_verify.sh` | CONFIRMED-WORKING | Aggregates type-check, lint, smoke, and Doc Divergence Detector into a single PASS/FAIL gate. |
| ABN fallback telemetry | `src/app/api/admin/abn/fallback-stats/route.ts` + admin dashboard card | CONFIRMED-WORKING | Logs fallback reasons via `recordAbnFallbackEvent` and visualises 24h fallback rate on the admin home page. |

## Latency Metrics & Dashboards

Latency for the core flows now lands in the new `latency_metrics` table (`supabase/migrations/20251209093000_add_latency_metrics.sql`). The following surfaces consume it:

- **Search / trainer** – `logApiTelemetry` (client) posts to `/api/telemetry/log`, which writes to `search_telemetry` and `latency_metrics` so even browser searches capture result count, duration, and success.
- **Emergency APIs** – `/api/emergency/{triage,verify,triage/weekly}` call `recordLatencyMetric` on every response.
- **Admin /health endpoints** – `/api/health/llm` and `/api/admin/health` record duration and HTTP code so AI-health + cron-health dashboards can show success trends and alerts.
- **ABN verification + onboarding** – `/api/abn/verify` and `/api/onboarding` log duration, ABN metadata, and result.
- **Admin snapshot** – `GET /api/admin/telemetry/latency` aggregates P95/avg/success for the above flows and the admin dashboard renders the “Latency snapshot (24h)” card.
- **Monetization routes** – `/api/stripe/create-checkout-session`, `/api/webhooks/stripe`, and `/api/admin/monetization/{overview,resync}` report latency via `logMonetizationLatency` so the new subscription health card + alert rules have 24h performance context.

Admins can now see `Search → trainer API`, `Trainer profile SSR`, `Emergency triage/verify`, `ABN verify`, and `Onboarding` latency with success rates directly inside `EnhancedAdminDashboard`.

## Telemetry Gaps & Remediations

| Gap | Impact | Minimal addition (this phase) | Follow-up |
| --- | --- | --- | --- |
| Latency insight for critical Next.js routes | Hard to prove server bundles stay within acceptable hydration budgets | Converted `AppHeader` + `/emergency` shell to server components and captured bundle stats via `next build`; results logged in `DOCS/IMPLEMENTATION_REALITY_MAP.md`. | Automate a bundle-size budget script (Phase L2 monitoring). |
| Search/directory failed lookups | No structured count of zero-result triage or RPC failures | `scripts/preprod_verify.sh` enforces smoke execution so trainer/directory flows are exercised pre-release; Implementation Reality Map flags remaining UNKNOWN areas for manual validation. | Add Supabase aggregate view counting `search_results=0` w/ hourly digest. |
| ABN fallback rate & emergency verification retries | Ops could not see how often deterministic vs. AI paths trigger fallback | Added `recordAbnFallbackEvent`, `/api/admin/abn/fallback-stats`, and dashboard card showing 24h fallback rate; `/api/admin/health?extended=1` now reports cron job timestamps. | Stream fallback counters into long-term analytics + hook alerts when threshold breached. |
| Frontend UI error boundaries | Client-side exceptions not surfaced to ops | Error logging smoke test now verifies `logError` accepts manual UI reports, ensuring dashboards can display `client` category payloads. | Ship React error boundary + `/api/client-error` POST once budgeted (tracked in DEPRECATION_STAGING for legacy boundary). |

## Alert Conditions (Phase 6)

Alert evaluation lives in `src/lib/alerts.ts` with an API façade at `/api/admin/alerts/snapshot`. Rules:

| Alert | Trigger | Override | Notes |
| --- | --- | --- | --- |
| Emergency cron stale | `cron_job_runs` has no success in > 30 minutes | `emergency_cron` | Severity: critical. Metadata includes last success/failure timestamps. |
| AI health degraded | `/api/health/llm` success rate < 75% over 24h | `telemetry` | Uses latency metrics + override to suppress during drills. |
| Admin health degraded | `/api/admin/health` success rate < 80% | `telemetry` | Warns when cron status endpoint is flaky even if overrides are active. |
| ABN fallback rate high | `abn_fallback_events` / `abn_verifications` > 30% in 24h | `abn_recheck` | Shares fallback/verification counts so ops can confirm manual review backlog. |
| Search / emergency / onboarding latency | P95 above budget (search 3s, emergency verify 5s, ABN 3.5s) | Service-specific (telemetry or abn_recheck) | Surfaces as warnings; suppressed when override flag is set. |
| Monetization payment failures | `payment_audit` failure rate > 15% (or spikes over 35%) in 24h | `monetization` | Produces warning/critical alerts depending on the failure ratio; metadata shows rate and totals. |
| Monetization sync errors | `payment_audit` rows with `status=sync_error` ≥ 3 in 24h | `monetization` | Critical alert indicating webhook/admin resync issues; admin override suppresses if incident already tracked. |

Overrides (“Temporarily Down” / “Under Investigation”) suppress an alert but the alert still appears with `suppressed=true` so ops can review context.

## Alert Delivery – Email + Slack

- `scripts/run_alerts_email.ts` reads the alert snapshot, de-dupes against `.alert_state.json`, and sends notifications **only** when new unsuppressed alerts appear (pass `--dry-run` to preview, `--force` to resend even if unchanged).
- **Email**: uses Resend; configure `RESEND_API_KEY`, `ALERTS_EMAIL_TO` (comma-separated recipients), and optional `ALERTS_EMAIL_FROM`. Sample run: `npx tsx scripts/run_alerts_email.ts --dry-run`.
- **Slack/Webhook**: set `ALERTS_SLACK_WEBHOOK_URL` to post the same summary to an ops channel. Feature flag toggled automatically—no webhook means the script logs `slack:disabled`.
- Script output is referenced in `DOCS/IMPLEMENTATION_REALITY_MAP.md` and logged via `DOCS/CHANGE_CONTROL_LOG.md` so ops know when alert delivery shipped.

## Manual & Test Hooks

- `npm run smoke` gained `tests/smoke/alerts.test.ts` to validate alert evaluation logic (fallback-rate triggers, overrides suppress).
- `/api/admin/telemetry/latency` + `/api/admin/alerts/snapshot` are documented and used by the admin dashboard + alert runner; both are included in the governance doc to satisfy Doc Divergence Detector.
- `scripts/run_alerts_email.ts --dry-run` doubles as the manual verification hook; document this inside the change log + launch checklist.
- `npm run e2e` / `./scripts/preprod_e2e.sh` run Playwright E2E coverage (search → profile, emergency controls, AI/Cron dashboards, alerts snapshot) with baseline screenshots under `tests/e2e/*-snapshots`. Update baselines intentionally via `npm run e2e -- --update-snapshots`.

## Immediate Action Items (Completed)

1. **Server-shell refactor** – `AppHeader` and `/emergency` now hydrate only the interactive controls; bundle stats recorded in the reality map for regression tracking.
2. **Dashboard failure simulations** – Added Vitest cases that render AI/Cron dashboards with degraded snapshots to confirm status banners update with real error messaging.
3. **Error logging harness validation** – Wrote a smoke test that exercises `logAPIError` + manual `logError` payloads, ensuring Supabase inserts carry route/method/status context.
4. **Pre-prod verifier** – Created `scripts/preprod_verify.sh` to run type-check → smoke → lint → Doc Divergence sequentially with explicit PASS/FAIL output.
5. **Telemetry overrides** – Ops can now mark telemetry, ABN recheck, or emergency cron as “Temporarily Down” / “Under Investigation”; overrides write to `ops_overrides`, appear in dashboards + the footer strip, and auto-expire after 2 hours.
6. **ABN fallback telemetry** – `recordAbnFallbackEvent` logs manual-review and failure cases, `/api/admin/abn/fallback-stats` summarises the last 24h, and the admin dashboard surfaces the current fallback %, closing telemetry gap #3.
7. **Monetization telemetry + alerts** – Added `payment_audit`/`business_subscription_status`, wired `/api/stripe/create-checkout-session`, `/api/webhooks/stripe`, and `/api/admin/monetization/{overview,resync}` into latency logging, built the admin “Subscription Health (24h)” card, and taught the alert engine to flag payment failure/sync-error thresholds (delivered via email + Slack).

## Alert Stress Test Playbook (Phase 9B)

1. **Simulate payment failures** – Use the Stripe CLI or manual Supabase inserts to create `payment_audit` rows with `status='failed'` and verify `/api/admin/alerts/snapshot` emits `monetization-payment-failures`. Clear via webhook replay or by deleting the synthetic rows afterward.
2. **Simulate sync errors** – Replay a malformed webhook (missing `business_id`) or temporarily revoke Supabase permissions so `upsertSubscriptionStatus` fails. Confirm the alert snapshot shows `monetization-sync-errors` and that applying an override (`service='monetization'`) suppresses the notification.
3. **Latency spike** – Temporarily patch `/api/stripe/create-checkout-session` in staging to sleep + log >3s durations, then inspect `/api/admin/telemetry/latency` along with the alert snapshot to ensure the “monetization_api” route appears with the degraded metrics.
4. **Verify delivery** – Run `npx tsx scripts/run_alerts_email.ts --dry-run` to confirm the monetization alerts appear in the email/Slack payload. Remove the synthetic data, rerun the script, and confirm the alerts clear before removing overrides.

> **Note:** The steps above require staging credentials and real Supabase/Stripe access. Record evidence (API responses, CLI logs) in `DOCS/OPS_TELEMETRY_ENHANCEMENTS.md` or the launch checklist whenever the stress test is executed.

## Next Steps

- Add lightweight latency histograms for `/api/emergency/*` by capturing `duration_ms` inside `error_logs` during cron smoke tests.
- Stream ABN fallback counters into `/api/admin/health` once the Supabase views are ready.
- Instrument a client-side error boundary that forwards sanitized payloads to `logClientError`, keeping the dashboards aligned with SSOT runtime expectations.
