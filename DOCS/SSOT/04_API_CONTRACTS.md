# API Contracts — Endpoints, Auth Boundaries, Payload Notes

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Endpoint groups (canonical)
### 1.1 Public helper APIs
- `/api/public/autocomplete`

### 1.2 Emergency
- `/api/emergency/resources`
- `/api/emergency/triage`
- `/api/emergency/triage/feedback`
- `/api/emergency/triage/weekly`
- `/api/emergency/verify`

### 1.3 ABN verification
- `/api/abn/verify`

### 1.4 Onboarding
- `/api/onboarding`

### 1.5 Stripe
- `/api/stripe/create-checkout-session`
- Webhooks: `/api/webhooks/stripe`

### 1.6 Admin APIs
Admin APIs live under `/api/admin/**`. They are operational surfaces and must be protected by admin auth (see `10_SECURITY_AND_PRIVACY.md`).
- `/api/admin/abn/[id]`
- `/api/admin/abn/fallback-stats`
- `/api/admin/alerts/snapshot`
- `/api/admin/ci-event`
- `/api/admin/dlq/replay`
- `/api/admin/errors`
- `/api/admin/errors/stats`
- `/api/admin/errors/trigger-alert`
- `/api/admin/featured/[id]/demote`
- `/api/admin/featured/[id]/extend`
- `/api/admin/featured/[id]/promote`
- `/api/admin/featured/expire`
- `/api/admin/featured/list`
- `/api/admin/health`
- `/api/admin/latency`
- `/api/admin/moderation/run`
- `/api/admin/monetization/overview`
- `/api/admin/monetization/resync`
- `/api/admin/ops-digest`
- `/api/admin/ops/overrides`
- `/api/admin/overview`
- `/api/admin/queues`
- `/api/admin/reviews/[id]`
- `/api/admin/run/featured-expire`
- `/api/admin/run/moderation`
- *(see route inventory for full list)*

## 2. Canonical auth boundary rules
- Any `/api/admin/**` endpoint is **admin-only**.
- Public endpoints must not expose privileged ops actions or sensitive data.

## 3. Canonical notes (from bundle)
- `/api/stripe/create-checkout-session` uses Stripe Checkout `mode: payment` and adds `tier: featured_placement_30d` metadata.
- `/api/webhooks/stripe` processes Stripe events and must be idempotent (see `06_MONETISATION.md`).

## 4. Source-of-truth
For full method/body/response shapes, refer to `ROUTE_INVENTORY.md` and the route handler code.
