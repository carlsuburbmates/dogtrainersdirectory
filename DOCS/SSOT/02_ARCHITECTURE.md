# Architecture — Runtime, Services, Boundaries

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Runtime
- **Framework:** Next.js (App Router)
- **Hosting:** Vercel (see `09_DEPLOYMENT.md`)
- **Images:** remote patterns allow `supabase.co` and `localhost` (see `next.config.js`)

## 2. Data layer
- **Primary datastore:** Supabase Postgres
- **Access patterns:**
  - Direct table reads/writes from API routes
  - RPCs for complex reads (e.g., `search_trainers`, `get_trainer_profile`)
- **Sensitive fields:** use encrypted columns + `decrypt_sensitive(...)` function with key argument where required (see migrations and `10_SECURITY_AND_PRIVACY.md`).

## 3. External integrations
- **Stripe:** Checkout in `payment` mode + webhooks (see `06_MONETISATION.md`)
- **ABR (ABN verification):** uses `ABR_GUID` in server routes (see env inventory)

## 4. Automation
- Vercel cron triggers call specific API endpoints (see `09_DEPLOYMENT.md`)
- AI automation is mode-gated (disabled/shadow/live + per-pipeline overrides) (see `07_AI_AUTOMATION.md`)

## 5. Key boundaries
- Admin UI must stay under `/admin/**`
- Admin APIs must stay under `/api/admin/**`
- Public endpoints are explicitly listed in `04_API_CONTRACTS.md`
