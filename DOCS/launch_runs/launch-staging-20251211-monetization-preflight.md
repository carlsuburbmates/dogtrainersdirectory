# Launch Run – staging – 2025-12-11 Monetization Preflight
- Commit: main (Phase 9a implementation complete)
- Operator(s): AI agent (automated test-mode hardening)

## Preprod Verification
- `npm run lint` → **PASS** (no ESLint errors)
- `npm run type-check` → **PASS** (TypeScript strict mode)
- `npm run smoke` → **13 tests PASS** (error-logging, admin-pages, trainers, emergency-api, alerts)
- `npm run e2e` → **8 tests PASS** (including monetization spec: upgrade flow, feature flag enforcement, ABN gating)
- `./scripts/preprod_verify.sh` → **ALL STEPS PASS** (lint, type-check, smoke, doc-divergence, env-ready)

## Stripe Test Mode Configuration
- ✅ Featured Placement product created: `prod_TaHM1RscSjUecJ` ($20 AUD / 30-day placement / FIFO queue)
- ℹ️ Pro Tier / subscription tiers: DEFERRED to Phase 5+ (no products created; Phase 1 scope is single featured slot only)
- ✅ Price IDs set in `.env.local`:
  - `STRIPE_PRICE_FEATURED=price_1Sd6oRClBfLESB1nh3NqPlvm` (featured placement: $20 AUD)
  - `STRIPE_PRICE_PRO=price_1Sd6oaClBfLESB1nI2Gfo0AX` (RESERVED for Phase 5+ expansion; do not enable until gates met)
- ✅ Monetization flags enabled (test mode only):
  - `FEATURE_MONETIZATION_ENABLED=1`
  - `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED=1`
- ✅ Alert config populated:
  - `ALERTS_EMAIL_TO=ops@dogtrainersdirectory.com.au`
  - `ALERTS_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/test-webhook-url`

## Test Results Detail
**E2E Monetization Coverage:**
- ✅ Provider upgrade flow + admin subscription tab (2.2s) – navigates to `/promote`, validates ABN gate, mocks checkout
- ✅ Hides upgrade CTA when feature flag disabled (211ms) – verifies server-side flag rejection
- ✅ Requires ABN verification before upgrade (263ms) – enforces business eligibility

**Smoke Tests:**
- ✅ Alert evaluation snapshot: ABN fallback alerts + suppression logic working
- ✅ Admin pages render without error (health dashboards, telemetry override toggles)
- ✅ Emergency & trainer search APIs respond correctly

## Staging Drill Status
- [ ] Create Stripe Checkout Session (test mode) and complete payment – **PENDING** (requires Stripe webhook endpoint registered)
- [ ] Replay Stripe webhook via CLI; capture CLI output – **PENDING** (stripe listen --forward-to requires staging deployment)
- [ ] Verify `payment_audit` + `business_subscription_status` rows – **PENDING** (migration not yet applied to staging DB)
- [ ] Screenshot `/admin` → MONETIZATION tab showing subscription health OK – **PENDING** (staging env not live yet)
- [ ] Confirm `/api/admin/alerts/snapshot` contains no monetization alerts – **PENDING** (staging validation required)
- [ ] Attach latency metric sample for `monetization_api` – **PENDING** (test data generation in staging)

## Next Actions
1. **Apply payment_audit migration to staging:** `supabase db push --linked` (pending staging DB credentials)
2. **Register test webhook endpoint:** Set up `stripe listen --forward-to https://staging.dogtrainersdirectory.com.au/api/webhooks/stripe` in staging environment
3. **Execute full Stripe drill:** Create test payment, replay webhook, capture evidence (session IDs, audit rows, alert snapshots)
4. **Update this entry** with drill results + evidence links before moving to Phase 9b

## Decision
- 🚫 **Blocked (Code Ready, Staging Infra Pending)**
- Test-mode code is feature-complete and validated via E2E. Awaiting staging database migration apply + webhook registration to proceed with full payment flow validation.
