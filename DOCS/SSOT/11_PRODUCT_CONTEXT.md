# Product Context — Dog Trainers Directory (DTD)

**Status:** Canonical (Tier-1)  
**Version:** v1.0  
**Last Updated:** 2026-02-09

## 1. Purpose and scope
DTD is a mobile‑first directory and triage experience for dog owners, with an admin operations surface for verification and moderation. Scope includes public discovery, trainer profiles, emergency resources and triage, business onboarding and promotion, and admin monitoring/queues. Anything not defined in Tier‑0/Tier‑1 SSOT is non‑authoritative.  
**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/FILE_MANIFEST.md`

## 2. Primary users and jobs‑to‑be‑done
- Public users (dog owners): search the directory, use triage, access emergency resources.  
- Business operators (trainers/services): onboard, maintain listings, gain profile presence, receive reviews, purchase featured placement.  
- Admins/operators: verify ABNs and emergency resources, moderate reviews, monitor health/queues/ops digest.  
**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`

## 3. End‑to‑end website flows (public + admin)
- Directory discovery: `/`, `/search`, `/directory`, `/trainers` → filtered results with verification/featured indicators.  
- Trainer profile: `/trainers/[id]` (primary), `/trainer/[id]` (301 redirect) → full profile, services, issues, age specialties, reviews, contact info, badges.  
- Emergency flow: `/emergency` → resource lookup by location/type and triage submission.  
- Triage page: `/triage` → implemented; behaviour details not specified in SSOT.  
- Business onboarding: `/onboarding` → listing submission with ABN verification potentially triggered.  
- Promotion: `/promote` → Stripe checkout for featured placement; redirects with status.  
- Admin overview/monitoring: `/admin`, `/admin/ai-health`, `/admin/cron-health`, `/admin/errors` → pull‑based health/error monitoring.  
- Admin reviews: `/admin/reviews` → moderation queue with filtering and AI suggestions.  
- Admin triage monitoring: `/admin/triage` → triage monitoring surface; details not specified in SSOT.  
**Source:** `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`

## 4. Core data entities and relationships
Core entities include: `councils`, `suburbs`, `profiles` (linked to `auth.users`), `businesses`, `trainer_services`, `trainer_behavior_issues`, `trainer_specializations`, `reviews`, `ai_review_decisions`, `abn_verifications`, `abn_fallback_events`, `emergency_resources`, `emergency_triage_logs`, `emergency_triage_feedback`, `emergency_triage_weekly_metrics`, `emergency_resource_verification_events`, `emergency_resource_verification_runs`, `featured_placements`, `featured_placement_queue`, `featured_placement_events`, `payment_audit`, `business_subscription_status`, `webhook_events`, `search_telemetry`, `latency_metrics`, `ops_overrides`, `daily_ops_digests`, `cron_job_runs`, `error_logs`, `error_alerts`, `error_alert_events`, `triage_logs`, `triage_events`, `triage_metrics_hourly`, `ai_evaluation_runs`.  
Relationships defined in SSOT include: `profiles` link to `auth.users`; `trainer_services`/`trainer_behavior_issues`/`trainer_specializations` are per business; `reviews` link to `businesses`; emergency verification state is stored on `businesses` for emergency resource listings.  
**Source:** `DOCS/SSOT/03_DATA_CONTRACTS.md`

## 5. Business rules and non‑negotiable invariants
- Public/admin separation: all admin surfaces are under `/admin` and `/api/admin/**`.  
- Schema‑first: code and docs must align to Supabase schema contracts.  
- No support inbox: ops is pull‑based (status strip + queues only).  
- Stripe Checkout uses `mode: payment` for one‑time featured placement unless Tier‑0 changes.  
- ABN is verified only when `ABNStatus === "Active"`; other outcomes are `manual_review` or `rejected`.  
- Code must query `businesses` (not a `trainers` table) and write using canonical identifiers (`trainer_behavior_issues`, `trainer_services.service_type`).  
- Emergency verification state for emergency resource listings is stored on `businesses`.  
- Admin APIs are admin‑only and return 401 for non‑admin requests.  
- Decrypt sensitive fields server‑side only using `SUPABASE_PGCRYPTO_KEY`.  
- Client‑exposed environment variables must be `NEXT_PUBLIC_*` only.  
- Do not change database identifiers to match AU spelling.  
**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/03_DATA_CONTRACTS.md`, `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/06_MONETISATION.md`, `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`, `DOCS/SSOT/CHANGE_PROTOCOL.md`

## 6. Key journeys (search, triage, onboarding, reviews, emergency)
- Search: `/api/public/search` (GET) with query, distance, age specialties, behaviour issues, service type, verified/rescue filters, price max, limit/offset. Returns results plus metadata and filter echo. Uses `search_trainers` RPC and decrypts sensitive fields server‑side.  
- Emergency triage: `/api/emergency/triage` exists; response/payload details are not specified in SSOT. `/api/emergency/triage/feedback` and `/api/emergency/triage/weekly` exist but payloads are unspecified.  
- Onboarding: `/api/onboarding` exists; payload details not specified in SSOT.  
- Reviews (admin): `/api/admin/reviews/list` is specified with request/response shape; `/api/admin/reviews/[id]` handles approve/reject.  
- Emergency resources: `/api/emergency/resources` and `/api/emergency/verify` exist; payload details not specified in SSOT.  
**Source:** `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`

## 7. API surface expectations
Public endpoints include `/api/public/autocomplete`, `/api/public/search`, emergency endpoints (`/api/emergency/*`), ABN verification (`/api/abn/verify`), onboarding (`/api/onboarding`), Stripe checkout/webhooks. Admin endpoints live under `/api/admin/**` and are protected by admin auth. Only `/api/admin/reviews/list` has a specified request/response contract in SSOT.  
**Source:** `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`

## 8. Monetisation model and constraints
Monetisation is a one‑time featured placement via Stripe Checkout (`mode: payment`). Checkout metadata includes `tier: featured_placement_30d`. Featured placement lifecycle is stored in `featured_placements` and expires via cron calling `/api/admin/featured/expire`. Monetisation is gated by feature flags defined in SSOT.  
**Source:** `DOCS/SSOT/06_MONETISATION.md`, `DOCS/SSOT/09_DEPLOYMENT.md`, `DOCS/SSOT/04_API_CONTRACTS.md`

## 9. AI automation modes, safety constraints, fallbacks
Global AI mode is `AI_GLOBAL_MODE` with per‑pipeline overrides. AI is used for emergency triage, review moderation, and ops digest generation. Shadow mode must not write or trigger irreversible actions; live mode must respect feature flags and ops overrides. `OPENAI_API_KEY` acts as availability signalling, not permission.  
**Source:** `DOCS/SSOT/07_AI_AUTOMATION.md`, `DOCS/SSOT/09_DEPLOYMENT.md`

## 10. Operational model
Ops is pull‑based with dashboards and queues; no support inbox. Admin monitoring surfaces are under `/admin/**`. Cron schedule is defined in `vercel.json` (see `09_DEPLOYMENT.md`). Ops tooling includes verification harnesses and alerting hooks; no background worker framework exists beyond cron + request‑driven work.  
**Source:** `DOCS/SSOT/08_OPS_RUNBOOK.md`, `DOCS/SSOT/09_DEPLOYMENT.md`

## 11. Security and privacy expectations
Supabase Auth is used for authentication; authorisation is role‑based via `profiles.role`. Admin routes and APIs are protected by middleware and return 401 for non‑admins. Sensitive fields (e.g., `contact_email`, `contact_phone`) are encrypted and decrypted server‑side only using `SUPABASE_PGCRYPTO_KEY`. Webhook signature verification and idempotency are required for Stripe.  
**Source:** `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`, `DOCS/SSOT/04_API_CONTRACTS.md`

## 12. Known gaps / explicitly unspecified in SSOT
- `/triage` page behaviour is not specified beyond route existence.  
- Payloads and responses for `/api/public/autocomplete`, `/api/emergency/*` (except existence), and `/api/onboarding` are not specified.  
- Detailed admin page content for `/admin/ai-health`, `/admin/cron-health`, `/admin/errors`, `/admin/triage` is not specified beyond high‑level purpose.  
- `ROUTE_INVENTORY.md` and `FLAGS_AND_AI_MODES.md` are referenced but are not canonical SSOT sources.  
**Source:** `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/FILE_MANIFEST.md`
