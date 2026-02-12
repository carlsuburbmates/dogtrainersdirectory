# API Contracts - Boundaries and Invariants

**Status:** Canonical (Tier-1)
**Version:** v1.2
**Last Updated:** 2026-02-13

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

## 4. Endpoint contract source
- Full method lists are in `DOCS/SSOT/_generated/api.md`.
- Detailed request/response structures are defined by implementation and tests in `src/app/api/**/route.ts` and corresponding test files.
