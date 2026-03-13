# API Contracts - Boundaries and Invariants

**Status:** Canonical (Tier-1)
**Version:** v1.6
**Last Updated:** 2026-03-10

## 1. Inventory source
Implementation-discovered API inventory is generated and versioned at:
- `DOCS/SSOT/_generated/api.md` (Next.js route handlers and methods)
- `DOCS/SSOT/_generated/edge_functions.md` (Supabase Edge Functions)

This file defines policy-level API contracts and security boundaries only.

## 2. Auth boundary (canonical)
- Any endpoint under `/api/admin/**` is admin-only.
- Non-admin requests to `/api/admin/**` must return `401`.
- `/api/account/business/[businessId]` is a business-owned authenticated endpoint. It must return `401` when the caller is not signed in and must not treat general authenticated access as sufficient without owned-record authorisation.
- `/api/account/business/[businessId]` must stay outside `/api/admin/**` and must not inherit admin/operator powers simply because it updates business-owned profile data.
- Public endpoints must not expose privileged ops actions or secrets.
- Middleware and admin checks are implementation details; boundary rules here are normative.

## 3. Contract invariants (canonical)
- `/api/abn/verify`: ABN is verified only when `ABNStatus === "Active"` from ABR. Non-active outcomes resolve to `manual_review` or `rejected`.
- `/api/stripe/create-checkout-session`: checkout mode is `payment` for featured placement flow (`tier: featured_placement_30d` metadata).
- `/api/webhooks/stripe`: webhook processing must be idempotent and signature-verified.
- `/api/public/search`: server-side decryption must use `SUPABASE_PGCRYPTO_KEY`; decryption keys must never be client-exposed.
- Canonical locality identity is `suburbId`; mutable location snapshot fields (`suburbName`, `postcode`, `lat`, `lng`, `councilId`) are display/cache hints only and must not become the source of truth when `suburbId` is present.
- `/api/public/search`: when `suburbId` is present and resolves successfully, canonical suburb coordinates must be used for search correctness and conflicting snapshot coordinates must be ignored.
- `/api/public/search`: when `suburbId` is present but unresolvable, the route must not silently trust conflicting snapshot coordinates as if they were canonical.
- `/api/test/**`: test endpoints are not public truth surfaces. Outside explicit E2E mode they must be operator-only, and they must not expose unauthorised write or side-effect behaviour.
- `/api/test/seed-review`: any allowed seeded review write must remain schema-compatible with `public.reviews` and must create a pending review only.
- `/api/trainer/dashboard`: must not present fabricated analytics as real business performance. If analytics are unavailable, the route must return an explicit unavailable/unsupported response or clearly null unsupported fields instead of random values.
- `PATCH /api/account/business/[businessId]`: must load and update only the owned business record associated with the authenticated business actor and must return `404` for non-owned or missing business IDs.
- `PATCH /api/account/business/[businessId]`: must accept only the bounded profile-maintenance fields used by the business-owned profile surface (`businessName`, public contact fields, website, address, bio, pricing, primary and secondary service selections, age specialties, behaviour issues).
- `PATCH /api/account/business/[businessId]`: must reject verification, ABN, publication, moderation, scaffold-review, featured, spotlight, billing, checkout, ranking, and other admin-only or monetisation fields rather than silently ignoring them.
- `PATCH /api/account/business/[businessId]`: deterministic profile persistence remains the visible source of truth. Any `AA-706` listing-quality guidance attached to this route must stay shadow-only, audit-only, and non-outcome-changing for publication, verification, featured or spotlight state, monetisation, and ranking.
- `GET /api/admin/ai-rollouts`: returns rollout resolution per automation workflow, including env ceiling, rollout state, final runtime mode, rollout-state source, and whether the rollout registry was read successfully or is only showing an implicit fallback state.
- `PATCH /api/admin/ai-rollouts/[workflow]`: is admin-only and must enforce canonical transition rules. It must not allow a workflow to exceed canonical ceilings or env ceilings.
- `PATCH /api/admin/ai-rollouts/[workflow]`: every successful mutation must write both current control state and append-only event history with acting admin identity and reason.
- `/api/admin/ai-rollouts/**`: is a supervision/control-plane surface only. It must not directly trigger owner-facing or business-facing live rollout beyond canonical approval boundaries.
- `POST /api/admin/ops-digest`: must distinguish a persisted, reviewable digest run from a non-persisted fallback run. It must not present a local-only or non-persisted digest as qualifying shadow evidence for controlled-live review.

## 4. Endpoint contract source
- Full method lists are in `DOCS/SSOT/_generated/api.md`.
- Detailed request/response structures are defined by implementation and tests in `src/app/api/**/route.ts` and corresponding test files.
