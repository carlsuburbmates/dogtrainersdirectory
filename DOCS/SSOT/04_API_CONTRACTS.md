# API Contracts - Boundaries and Invariants

**Status:** Canonical (Tier-1)
**Version:** v1.5
**Last Updated:** 2026-03-06

## 1. Inventory source
Implementation-discovered API inventory is generated and versioned at:
- `DOCS/SSOT/_generated/api.md` (Next.js route handlers and methods)
- `DOCS/SSOT/_generated/edge_functions.md` (Supabase Edge Functions)

This file defines policy-level API contracts and security boundaries only.

## 2. Auth boundary (canonical)
- Any endpoint under `/api/admin/**` is admin-only.
- Non-admin requests to `/api/admin/**` must return `401`.
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

## 4. Endpoint contract source
- Full method lists are in `DOCS/SSOT/_generated/api.md`.
- Detailed request/response structures are defined by implementation and tests in `src/app/api/**/route.ts` and corresponding test files.
