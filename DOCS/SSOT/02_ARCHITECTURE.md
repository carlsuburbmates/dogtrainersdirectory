# Architecture — Runtime, Services, Boundaries

**Status:** Canonical (Tier-1)  
**Version:** v1.3  
**Last Updated:** 2026-03-29

## 1. Scope
**Owns:**
- runtime stack
- service boundaries
- technical enforcement model
- high-level data access patterns

**Does not own:**
- exact route inventory
- API endpoint inventory
- table, enum, or RPC contracts
- detailed product journey descriptions
- AI approval or rollout policy detail

**See also:**
- `05_ROUTES_AND_NAV.md`
- `04_API_CONTRACTS.md`
- `03_DATA_CONTRACTS.md`
- `10_SECURITY_AND_PRIVACY.md`
- `07_AI_AUTOMATION.md`
- `09_DEPLOYMENT.md`

## 2. Runtime
- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel (see `09_DEPLOYMENT.md`)
- **Images:** remote patterns allow `supabase.co` and `localhost` (see `next.config.js`)
- **Admin route protection:** Next.js proxy enforcement for `/admin/**` and `/api/admin/**` (see `src/proxy.ts`)

## 3. Authentication & Authorization
- **Authentication provider:** Supabase Auth
- **Authorization layer:** Role-based access control via `profiles.role` field
- Admin protection is enforced through the Next.js proxy layer plus route-level admin checks where required.
- Auth implementation detail and admin-boundary rules are owned by `10_SECURITY_AND_PRIVACY.md`.

## 4. Data layer
- **Primary datastore:** Supabase Postgres
- **Access patterns:**
  - Direct table reads/writes from API routes
  - RPCs for complex reads (e.g., `search_trainers`, `get_trainer_profile`)
  - Admin operations use `SUPABASE_SERVICE_ROLE_KEY` for elevated access
- **Sensitive fields:** use encrypted columns + `decrypt_sensitive(...)` function with key argument where required (see migrations and `10_SECURITY_AND_PRIVACY.md`).
- Exact schema, table, and RPC truth belongs in `03_DATA_CONTRACTS.md`.

## 5. External integrations
- **Stripe:** Checkout in `payment` mode + webhooks (see `06_MONETISATION.md`)
- **ABR (ABN verification):** uses `ABR_GUID` in server routes (see env inventory)

## 6. Automation
- Vercel cron triggers call specific API endpoints (see `09_DEPLOYMENT.md`)
- AI automation is mode-gated by shared workflow families, rollout state, and per-workflow overrides (see `07_AI_AUTOMATION.md`)

## 7. Key boundaries
- Admin UI must stay under `/admin/**` and is enforced by proxy protection plus admin-role checks
- Admin APIs must stay under `/api/admin/**` and are enforced by proxy protection, with route-level admin checks where required
- Public endpoints are explicitly listed in `04_API_CONTRACTS.md`
- API inventory and endpoint-specific behaviour belong in `04_API_CONTRACTS.md`.
