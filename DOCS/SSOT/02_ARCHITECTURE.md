# Architecture — Runtime, Services, Boundaries

**Status:** Canonical (Tier-1)  
**Version:** v1.2  
**Last Updated:** 2026-03-29

## 1. Runtime
- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel (see `09_DEPLOYMENT.md`)
- **Images:** remote patterns allow `supabase.co` and `localhost` (see `next.config.js`)
- **Admin route protection:** Next.js proxy enforcement for `/admin/**` and `/api/admin/**` (see `src/proxy.ts`)

## 2. Authentication & Authorization
- **Authentication provider:** Supabase Auth
- **Authorization layer:** Role-based access control via `profiles.role` field

**Implementation:**
- `src/lib/auth.ts` — Authentication helper functions
  - `isAdmin(userId)` — Checks admin role in profiles table
  - `getAuthenticatedUser()` — Extracts user from Supabase session
  - `requireAdmin()` — Combined auth + admin verification for API routes
  - `checkAdminAuthFromRequest()` — Proxy-compatible auth check

- `src/proxy.ts` — Route protection proxy
  - Protects all `/admin/**` pages
  - Protects all `/api/admin/**` endpoints
  - Redirects non-admin users to `/login` (pages)
  - Returns 401 Unauthorized for non-admin API requests

**Security:**
- All admin surfaces require valid Supabase session + admin role
- Session validation on every protected request
- No admin functionality exposed without proper authorization

## 3. Data layer
- **Primary datastore:** Supabase Postgres
- **Access patterns:**
  - Direct table reads/writes from API routes
  - RPCs for complex reads (e.g., `search_trainers`, `get_trainer_profile`)
  - Admin operations use `SUPABASE_SERVICE_ROLE_KEY` for elevated access
- **Sensitive fields:** use encrypted columns + `decrypt_sensitive(...)` function with key argument where required (see migrations and `10_SECURITY_AND_PRIVACY.md`).

**Key RPCs:**
- `search_trainers` — Full-text search with filtering (accepts decryption key)
- `get_trainer_profile` — Comprehensive trainer profile data (accepts decryption key)

## 4. External integrations
- **Stripe:** Checkout in `payment` mode + webhooks (see `06_MONETISATION.md`)
- **ABR (ABN verification):** uses `ABR_GUID` in server routes (see env inventory)

## 5. Automation
- Vercel cron triggers call specific API endpoints (see `09_DEPLOYMENT.md`)
- AI automation is mode-gated by shared workflow families, rollout state, and per-workflow overrides (see `07_AI_AUTOMATION.md`)

## 6. Key boundaries
- Admin UI must stay under `/admin/**` and is enforced by proxy protection plus admin-role checks
- Admin APIs must stay under `/api/admin/**` and are enforced by proxy protection, with route-level admin checks where required
- Public endpoints are explicitly listed in `04_API_CONTRACTS.md`

## 7. API architecture

### 7.1 Public APIs
- **Search:** `/api/public/search` — Full-text search with 11+ filters
- **Emergency:** `/api/emergency/resources`, `/api/emergency/triage` — Emergency assistance
- **Onboarding:** `/api/onboarding` — Business registration
- **Stripe:** `/api/stripe/create-checkout-session` — Payment processing

### 7.2 Admin APIs (protected)
- **Reviews:** `/api/admin/reviews/list`, `/api/admin/reviews/[id]` — Review moderation
- **Featured:** `/api/admin/featured/**` — Featured placement management
- **Health:** `/api/admin/health`, `/api/admin/errors` — System monitoring
- **ABN:** `/api/admin/abn/**` — ABN verification management

All admin APIs are protected by proxy enforcement with automatic 401 rejection for unauthorized requests.
