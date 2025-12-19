# Monetisation — Stripe, Entitlements, Featured Placement

**Status:** Canonical (Tier-1)  
**Version:** v1.0

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

## 5. Environment configuration
Required server env vars (see `ENV_VARS_INVENTORY.md`):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FEATURED`
- Monetisation feature flags: `FEATURE_MONETIZATION_ENABLED` + `NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED`

## 6. Non-goals
Do not switch to subscription mode without explicitly updating Tier-0 and reworking entitlement logic.
