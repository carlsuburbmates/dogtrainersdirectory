# Monetisation — Stripe, Entitlements, Featured Placement

**Status:** Canonical (Tier-1)  
**Version:** v1.2

## 1. Checkout mode (canonical)
Stripe Checkout uses **`mode: payment`** (one-time charge) for Featured Placement.

## 2. Canonical endpoint
- `/api/stripe/create-checkout-session`
  - line item: `STRIPE_PRICE_FEATURED`
  - metadata: `business_id`, `plan_id`, `tier: featured_placement_30d`
  - redirect: `/promote?businessId=<id>&status=success|cancelled`

## 3. Webhooks
- `/api/webhooks/stripe`
- Bundle indicates support for subscription-related events as well; treat subscription logic as **present but not the primary monetisation flow** unless Tier-0 is updated.

## 4. State storage
From migrations in bundle:
- `payment_audit` — immutable event log
- `business_subscription_status` — latest status per business (even if primary flow is one-time payment)

Featured placement lifecycle:
- `featured_placements` table stores placements with start/end dates and status.
- Expiry is automated via Vercel cron calling `/api/admin/featured/expire` (see `09_DEPLOYMENT.md`).

## 4.1 Current public-facing featured value (canonical)
- The current featured-placement proposition is based on visible differentiation already present in the product.
- Supported public-facing value today:
  - featured listings display a visible featured badge in `/directory`
  - featured listings sort ahead of standard listings within each directory region in `/directory`
  - featured listings display a `Featured listing` label on `/trainers/[id]`
- Unsupported claims today:
  - guaranteed rank priority across all `/search` results
  - impression counts, lead counts, or analytics dashboards
  - changes to verification status, reviews, or contact methods
- Monetisation copy and packaging must stay inside these boundaries unless the underlying public surfaces change in code and SSOT is updated in the same change.

## 5. Environment configuration
Required server env vars (see `ENV_VARS_INVENTORY.md`):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FEATURED`
- Monetisation feature flags: `FEATURE_MONETIZATION_ENABLED` + `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED`

## 5.1 Availability gating (canonical)
- `/promote` must not expose a live upgrade CTA unless checkout is actually available in the current runtime.
- When secure checkout is unavailable (for example missing Stripe configuration), the page must show a terminal unavailable state instead of a broken purchase path.
- E2E/test mode may expose a deterministic stubbed checkout path for verification, even when live Stripe configuration is incomplete.
- The admin monetisation surface must render a terminal failure state when monetisation data fails to load; it must not remain in a false loading state after a failed request.

## 6. Non-goals
Do not switch to subscription mode without explicitly updating Tier-0 and reworking entitlement logic.
Do not market featured placement as analytics-enabled or as a guaranteed all-surface ranking boost unless those capabilities are actually implemented and promoted into SSOT.
