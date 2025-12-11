> **SSOT – Canonical Source of Truth**
> Scope: Stripe monetization rollout plan (Phase 9)
> Status: Draft · Last reviewed: 2025-12-09

# Monetization Rollout Plan

This document tracks the phased rollout of Featured Placement subscriptions powered by Stripe Checkout. It links the backend, UI, telemetry, and governance controls necessary to safely launch monetization without compromising existing operational guarantees.

## Objectives
- Offer an upgrade path (“Promote my listing”) to ABN-verified providers.
- Instrument everything via Stripe webhooks, Supabase audit tables, and the existing telemetry/alerting stack.
- Keep monetization feature-flagged (`FEATURE_MONETIZATION_ENABLED` / `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED`) so merges are safe until launch sign-off.

## Technical Checklist

| Area | Implementation summary | Status |
| --- | --- | --- |
| Checkout session API | `/api/stripe/create-checkout-session` validates ABN verification state, creates a session for `STRIPE_PRICE_FEATURED`, and logs to `payment_audit`. E2E mode short-circuits with a stub URL. | ✅ |
| Webhooks | `/api/webhooks/stripe` listens for `checkout.session.completed`, `customer.subscription.*`, and `invoice.payment_failed` events. It deduplicates events, upserts `business_subscription_status`, and records audit entries. E2E mode bypasses signature checks when `E2E_TEST_MODE=1` or the `x-e2e-stripe-test` header is present. | ✅ |
| Database | `payment_audit` + `business_subscription_status` tables track immutable events and the latest subscription state. | ✅ |
| Feature flag | Server + client flags gate both API + UI. Disabled by default in all environments. | ✅ |
| UI/UX | `/promote?businessId=` renders the upgrade panel (when feature flag ON) and only allows ABN-verified businesses to proceed. Admin dashboard shows “Subscription Health (24h)” card. | ✅ |
| Telemetry & alerts | Payment routes emit latency metrics; `alerts.ts` adds monetization alerts (payment failures, sync errors). Admin dashboards consume `/api/admin/monetization/overview`. | ✅ |
| Testing | Vitest coverage for checkout + webhook helpers, Playwright e2e for upgrade flow + simulated webhook. | ✅ |

## Launch Gates
1. **Feature flag** — Flip on via Vercel/ENV only after go-live rehearsal.
2. **Webhook dry-run** — Verified via staging `scripts/preprod_e2e.sh` and manual Stripe CLI replay.
3. **Payment audit trail** — At least one “checkout_session_created” + “subscription_active” entry logged in staging.
4. **Alerts + dashboards** — Admin “Subscription Health” card shows OK; alerts remain green (no unsuppressed monetization warnings).
5. **Launch checklist** — `DOCS/LAUNCH_READY_CHECKLIST.md` updated with monetization items (E2E run + webhook dry-run + audit log evidence).

## Rollout Phases
1. **Phase 9a (current)**: Build foundations, ship feature-flagged UI, land telemetry + tests.
2. **Phase 9b**: Connect to live Stripe data in staging, exercise webhook replay, verify alert thresholds.
3. **Phase 9c**: Enable feature flag for limited beta cohort; monitor payment audit + admin dashboards.
4. **Phase 9d**: Full production rollout (post beta sign-off + telemetery stability).

## Fallback / Disable Plan
- Set `FEATURE_MONETIZATION_ENABLED=0` (server) and `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0` (client) to immediately hide the UI and reject new checkout sessions.
- Stripe dashboard can pause subscriptions; webhook handlers respect cancellations and update `business_subscription_status` accordingly.
- Alerts escalate when payment failures spike; use overrides (`service = 'monetization'`) to temporarily silence if already investigating.

## References
- `src/lib/monetization.ts` — Checkout + webhook helpers
- `supabase/migrations/20251209101000_create_payment_tables.sql`
- `/api/stripe/create-checkout-session`
- `/api/webhooks/stripe`
- `/api/admin/monetization/overview`
- `tests/unit/monetization.test.ts`
- `tests/e2e/monetization.spec.ts`

## Phase 9B – Staging Hardening Checklist

1. **Environment readiness (staging)** – Run `scripts/check_env_ready.sh staging` with production-grade staging secrets (Stripe keys, Supabase service role, ABR GUID, monetization feature flags). Capture the console log and attach it to a new launch-run entry under `DOCS/launch_runs/`.
2. **Apply monetization migration** – Execute `supabase db push --linked` followed by `supabase db diff --linked` against staging. Record “Applied in staging (YYYY-MM-DD)” in `DOCS/db/MIGRATIONS_INDEX.md` for `20251209101000_create_payment_tables.sql`.
3. **Stripe drill** – In staging, create a Stripe Checkout Session, complete the test payment, replay the webhook (Stripe CLI), and confirm:
   - `payment_audit` contains `checkout_session_created` + `customer.subscription.*`
   - `business_subscription_status` reflects the latest status
   - `/api/admin/monetization/overview` shows the subscription
   - Alerts remain green (or capture their suppression if intentionally triggered)
   - Latency metrics capture the new route invocations (`monetization_api`)
4. **Evidence logging** – Add the drill output to `DOCS/LAUNCH_READY_CHECKLIST.md` and expand the relevant section in this plan with timestamps, Stripe session IDs, and Supabase query links.

> These steps require real infrastructure access. Until ops completes them, Phase 9 remains in “staging hardening” status even though the codebase is feature-complete.
