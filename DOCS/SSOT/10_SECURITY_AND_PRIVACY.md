# Security & Privacy — Auth, Data Protection, Secrets

**Status:** Canonical (Tier-1)  
**Version:** v1.2  
**Last Updated:** 2026-03-06

## 1. Secret handling
- Never commit real secrets. Use `.env.example` as the only env template.
- Client-exposed env vars must be `NEXT_PUBLIC_*` only.
- **Required secrets:**
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public client)
  - `SUPABASE_URL` (server-side alias used by tooling and Edge Functions)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, admin operations)
  - `SUPABASE_PGCRYPTO_KEY` (server-only, field decryption)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (server-only)
  - `ABR_GUID` (server-only, ABN verification)

## 2. Supabase access
- Use anon key on client.
- Service role keys are server-only.
- Admin APIs use `SUPABASE_SERVICE_ROLE_KEY` for elevated database access.
- Public browser clients use the anon key with RLS.
- Server-side public endpoints may use service-role-backed RPCs or controlled reads when needed for canonical search behaviour, decryption, or integrity checks, but secrets and decryption keys must remain server-only.

## 3. Admin boundary — ✅ RESOLVED (Phase 1 Batch 1)

### 3.1 Route Structure
- All admin pages under `/admin/**`.
- All admin APIs under `/api/admin/**`.

### 3.2 Proxy Protection (IMPLEMENTED)
**Status:** ✅ **Inconsistent admin auth RESOLVED**

**Implementation files:**
- `src/proxy.ts` — Next.js proxy enforcement for route protection
- `src/lib/auth.ts` — Authentication helper functions

**Protected routes:**
- All `/admin/**` page routes
- All `/api/admin/**` API routes

**Authentication flow:**
1. Proxy intercepts requests to protected routes
2. Calls `checkAdminAuthFromRequest()` from `src/lib/auth.ts`
3. Extracts user from Supabase session
4. Verifies user has admin role in `profiles` table
5. Non-admin users are redirected to `/login` (pages) or receive 401 Unauthorized (APIs)

**Auth helper functions:**
- `isAdmin(userId)` — Checks if user has admin role
- `getAuthenticatedUser()` — Extracts user ID from Supabase session
- `requireAdmin()` — Combined auth check + admin verification for API routes
- `checkAdminAuthFromRequest()` — Middleware-compatible auth check

**Enforcement:**
- ✅ All `/admin/**` pages protected by proxy enforcement
- ✅ All `/api/admin/**` endpoints protected by proxy enforcement
- ✅ Consistent authentication across all admin surfaces
- ✅ No admin functionality exposed without proper authorization

## 3.3 Test and operator-only endpoints
- `/api/test/**` endpoints are not public production surfaces.
- Outside explicit `E2E_TEST_MODE`, test endpoints that can write data or trigger side effects must be operator-only.
- `E2E_TEST_MODE` bypass exists only for deterministic automated verification and must not be relied on as production access control.

## 4. Sensitive fields
Bundle indicates encrypted columns exist for contact fields and are decrypted via `decrypt_sensitive` using `SUPABASE_PGCRYPTO_KEY`.

**Rules:**
- Decrypt on server only.
- Never return decrypted data to unauthorised clients.
- Encryption is server-side via `encrypt_sensitive` using `SUPABASE_PGCRYPTO_KEY`.

**Implementation:**
- ✅ Search API (`/api/public/search`) decrypts contact fields server-side using `SUPABASE_PGCRYPTO_KEY`
- ✅ Trainer profile pages decrypt sensitive data server-side via `get_trainer_profile` RPC
- ✅ Decryption key passed securely to Supabase RPCs, never exposed to client

**Encrypted fields:**
- `contact_email` (businesses table)
- `contact_phone` (businesses table)
- Other sensitive PII as defined in data contracts

## 5. Webhooks
- Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) must be required for webhook verification.
- Webhook event processing must be idempotent (verify `webhook_events` table or equivalent exists and is used).

## 6. Security hardening checklist

### Completed (Phase 1)
- ✅ Admin authentication proxy implementation
- ✅ Consistent admin auth enforcement across all `/admin/**` and `/api/admin/**` routes
- ✅ Server-side decryption of sensitive fields with proper key management
- ✅ Route protection via Next.js proxy enforcement

### Future enhancements
- [ ] Rate limiting on public APIs (especially search and emergency triage)
- [ ] CSRF token validation for sensitive mutations
- [ ] Audit logging for admin actions
- [ ] Session timeout and refresh token rotation
- [ ] IP allowlisting for admin access (optional)
- [ ] Two-factor authentication for admin accounts
