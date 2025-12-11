> **SSOT – Canonical Source of Truth**
> Scope: Stripe monetization rollout plan (Phase 9)
> Status: Draft · Last reviewed: 2025-12-09

# Monetization Rollout Plan

This document tracks the phased rollout of Featured Placement (one-time $20 AUD purchase, 30-day duration, FIFO queue with 5 concurrent slots per council) powered by Stripe Checkout. It links the backend, UI, telemetry, and governance controls necessary to safely launch monetization without compromising existing operational guarantees.

## Pricing Model (Phase 1 Final)
- **Featured Placement**: $20 AUD / 30-day placement / FIFO queue / max 5 concurrent slots per council
- **Subscription tiers** (e.g., Pro, Premium): DEFERRED to Phase 5+ pending Phase 4 KPI gates and user demand validation

## Objectives
- Offer an upgrade path (“Promote my listing”) to ABN-verified providers.
- Instrument everything via Stripe Checkout (one-time payment), Supabase audit tables, and the existing telemetry/alerting stack.
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

## Phase 9B Operations Runbook

**See `DOCS/automation/PHASE_9B_STAGING_HARDENING_RUNBOOK.md` for the definitive step-by-step operations manual.**

This runbook provides:
- Precondition verification checklist (Staging infra, Stripe test keys, production flag confirmation)
- Detailed step-by-step instructions for all 7 stages of the Phase 9B drill
- Command sequences with expected outputs
- Evidence capture templates for launch_runs/
- Troubleshooting & rollback procedures
- SSOT document update instructions

**Runbook Status:** Active (validated against Phase 9a codebase)

## Product Scope & Lifecycle (Authoritative Summary)

- **Live product:** Featured Placement upgrade priced at $20 AUD for 30 calendar days, limited to five concurrent slots per council (FIFO queue). No other paid tiers may be exposed until Phase 4+ KPIs (≥50 claimed trainers, ≥30% renewal, ≥200 inquiries/month) are met and governance explicitly signs off.
- **Checkout metadata (required):** `trainer_id`, `business_id`, `lga_id`, `tier`, and optional context (`desired_start`, `queue_position_hint`). Webhooks must reject any session lacking these fields.
- **Activation workflow:**
  1. Trainer clicks “Promote my listing,” selects LGA, and is redirected to Stripe Checkout.
  2. On success, Stripe redirects back to the dashboard and enqueues the webhook events listed below.
  3. Webhook handler verifies signature + idempotency, logs the event into `payment_audit`, and inspects the `featured_slots_status` row for that LGA.
  4. If `current_featured_count < 5`, activate immediately (set `featured_slot_active=true`, insert metrics row with start/end timestamps, send “Placement live” email).
  5. Otherwise enqueue trainer (insert into `featured_queue`, persist `queue_position`, send “You’re position N” email). Queue ETA baseline is `(position - 1) * 6 days` (30 days / 5 slots) unless telemetry shows a different duration.
  6. Daily cron handles expiries, renewals, and queue promotions. Renewals before expiry skip the queue entirely.
  7. Admin dashboards and `/api/admin/monetization/overview` surface active slots, queue lengths, failure/sync counts, and audit entries.

## Webhook & Metadata Contract

| Event | When it fires | Required handling |
| --- | --- | --- |
| `checkout.session.completed` | Hosted checkout completes for Featured Placement | Validate metadata, create `payment_audit` row (`checkout_session_completed`), transition trainer to `pending_activation` or activate immediately depending on slot availability, emit telemetry. |
| `payment_intent.succeeded` | Underlying PaymentIntent finalises (Stripe automatically triggers alongside checkout) | Additional guard in case Checkout redirect fails; confirm audit log + activation state match the session outcome. |
| `invoice.payment_failed` | Future subscription flows (deferred) or manual retries fail | Presently used for alerting/stub flows; log failure, notify ops, and surface in admin alerts. |
| `customer.subscription.deleted` | Future subscription tiers cancel | Keep handler in place but treated as no-op until subscriptions ship. |
| `charge.refunded` | Refund processed (manual support) | Insert `refund` entry in `payment_audit`, deactivate slot, remove from featured listings, notify trainer. |
| `charge.dispute.created` | Chargeback/dispute opened | Flag record, alert support, lock placement until resolved. |

**Signature & Idempotency:** All webhook deliveries must verify `Stripe-Signature` using `STRIPE_WEBHOOK_SECRET` and skip duplicate `event.id` values. Local harnesses may bypass verification, but production/staging must never accept unsigned payloads. Store `event.id`, `livemode`, `created`, essential metadata, and handler status in `payment_audit` for auditability.

## Legal, Refund, and Compliance Expectations

- **Payment terms:** All prices in AUD; Stripe (PCI Level 1) processes and stores card data. Platform servers never persist raw payment credentials.
- **Refund policy:**
  - Featured placement refunds allowed for 3 days after purchase; afterward treat as delivered service.
  - Refund processing occurs via Stripe dashboard or admin tooling, and webhook handler must mirror the refund in `payment_audit` + deactivate the slot.
- **Dispute workflow:** On `charge.dispute.created`, create a priority support ticket, gather evidence within Stripe, and notify support@dogtrainersdirectory.com.au. Admin UI should reflect dispute status so trainers are removed from paid listings until resolved.
- **Compliance copy (summarised):** Platform does not endorse trainers, cannot replace veterinary care, and treats trainers as independent contractors. ABN verification grants only a “verified business” badge; it is not an endorsement of qualifications. Privacy requirements include encrypting ABN metadata, retaining payment/financial logs for 7 years (ATO compliance), honoring deletion/export requests, and limiting disclosure to Stripe or statutory bodies.
- **Tax & record keeping:** Stripe retains 2.9% + $0.30 fees automatically. Net deposits land in the connected account. Operators must export monthly Stripe reports, reconcile deposits with bank statements, and record Stripe fees as deductible expenses for ATO filings. Trainers treat featured slot purchases as marketing spend on their own taxes; the platform never withholds PAYG.

## Operational Appendices

### A. Email & Notification Triggers
- Activation, queue added, queue position improved, expires soon (5-day reminder), expired/auto-promotion, renewal confirmation, dispute/refund notices, and inquiry confirmations. Content/timing mirror the legacy eight-template set; reference the onboarding copy deck when updating messaging.

### B. Support & Tooling Guard Rails
- Stripe dashboard is the canonical place for pausing subscriptions, issuing refunds, and rotating secrets. Do not tunnel production webhooks through local machines; use the repository harness on `127.0.0.1:4243` only for development.
- Feature flags remain default-off in every environment. Enabling monetization requires completing Launch Checklist section 10 + documented sign-off. Setting `E2E_TEST_MODE=1` or `x-e2e-stripe-test` should be reserved for automated tests; ops usage must be logged.
- Alerts exist for latency spikes (`monetization_api`), payment failures, and sync errors. Use telemetry overrides sparingly and record any override usage in ops logs.

## Phase 9B – Staging Hardening (IN PROGRESS – Stripe drill pending)

**Summary:** Phase 9B is executing entirely in the staging environment to validate the end-to-end $20 AUD Featured Placement payment flow, webhook handling, and downstream state changes without touching production. All tests are performed in Stripe test mode and against staging Supabase.

- Execution date: {{PHASE_9B_EXECUTION_DATE}} (to be set after Stripe drill)
- Operator: {{PHASE_9B_OPERATOR}} (human operator name)

Expected outcomes (to be verified during execution):
- E2E test: The $20 AUD Featured Placement checkout and payment flow is exercised end-to-end (Checkout Session → Payment Intent → webhook replay → DB upserts → admin surface updates).
- Evidence archive: Full evidence (session IDs, webhook deliveries, Supabase queries, logs, and screenshots) will be stored in:
  - DOCS/launch_runs/launch-staging-20251211-monetization-preflight.md
- Safety posture: Production monetization remains OFF. Production feature flags must remain:
  - `FEATURE_MONETIZATION_ENABLED=0`
  - `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=0`
- Gates to production: The monetization feature is gated and requires all of:
  - ≥ 50 claimed trainers in the platform,
  - ≥ 85% ABN auto-verification rate sustained,
  - Formal governance approval and documented sign-off.

Notes and next steps:
- Phase 9B execution is pending operator completion of the Stripe drill (Step 4).
- See `DOCS/launch_runs/launch-staging-20251211-monetization-preflight.md` for the step-by-step execution template.
- Monetization remains strictly staging-only until Phase 9C approves production enablement.
