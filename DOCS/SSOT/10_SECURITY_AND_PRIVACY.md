# Security & Privacy — Auth, Data Protection, Secrets

**Status:** Canonical (Tier-1)  
**Version:** v1.1  
**Last Updated:** Phase 1 Batch 3 - Documentation Updates

## 1. Secret handling
- Never commit real secrets. Use `.env.example` as the only env template.
- Client-exposed env vars must be `NEXT_PUBLIC_*` only.
- **Required secrets:**
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, admin operations)
  - `SUPABASE_PGCRYPTO_KEY` (server-only, field decryption)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (server-only)
  - `ABR_GUID` (server-only, ABN verification)

## 2. Supabase access
- Use anon key on client.
- Service role keys are server-only.
- Admin APIs use `SUPABASE_SERVICE_ROLE_KEY` for elevated database access.
- Public APIs use standard Supabase client with RLS (Row Level Security).

## 3. Admin boundary — ✅ RESOLVED (Phase 1 Batch 1)

### 3.1 Route Structure
- All admin pages under `/admin/**`.
- All admin APIs under `/api/admin/**`.

### 3.2 Middleware Protection (IMPLEMENTED)
**Status:** ✅ **Inconsistent admin auth RESOLVED**

**Implementation files:**
- `src/middleware.ts` — Next.js middleware for route protection
- `src/lib/auth.ts` — Authentication helper functions

**Protected routes:**
- All `/admin/**` page routes
- All `/api/admin/**` API routes

**Authentication flow:**
1. Middleware intercepts requests to protected routes
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
- ✅ All `/admin/**` pages protected by middleware
- ✅ All `/api/admin/**` endpoints protected by middleware
- ✅ Consistent authentication across all admin surfaces
- ✅ No admin functionality exposed without proper authorization

## 4. Sensitive fields
Bundle indicates encrypted columns exist for contact fields and are decrypted via `decrypt_sensitive` using `SUPABASE_PGCRYPTO_KEY`.

**Rules:**
- Decrypt on server only.
- Never return decrypted data to unauthorised clients.

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
- ✅ Admin authentication middleware implementation
- ✅ Consistent admin auth enforcement across all `/admin/**` and `/api/admin/**` routes
- ✅ Server-side decryption of sensitive fields with proper key management
- ✅ Route protection via Next.js middleware

### Future enhancements
- [ ] Rate limiting on public APIs (especially search and emergency triage)
- [ ] CSRF token validation for sensitive mutations
- [ ] Audit logging for admin actions
- [ ] Session timeout and refresh token rotation
- [ ] IP allowlisting for admin access (optional)
- [ ] Two-factor authentication for admin accounts
