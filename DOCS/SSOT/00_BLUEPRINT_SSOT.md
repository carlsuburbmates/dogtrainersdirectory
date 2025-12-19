# Blueprint SSOT (Tier-0) — Dog Trainers Directory (DTD)

**Status:** Canonical (Tier-0)  
**Version:** v1.0  
**Generated:** 2025-12-19  
**Input bundle SHA-256:** `466a6262210b39af94d4a94b09eac0ee9a9a6876551008971d733186534ea38d`

## 0. Purpose
This Blueprint SSOT defines the **post-launch truth** for the DTD application: scope, invariants, contracts, and operational reality.
If something is not defined here (or in Tier-1 canonical documents listed below), it is **non-authoritative**.

## 1. Authority & Precedence
**Tier-0 (this file)** overrides all other documentation.
**Tier-1** documents are canonical support and may be cited as detail, but may not contradict Tier-0.
Anything else is **non-canonical** unless explicitly promoted via `FILE_MANIFEST.md`.

### 1.1 Change rule
Any change that modifies behaviour, contracts, routes, monetisation, or operations **must** update the relevant Tier-0/Tier-1 docs in the same PR.

## 2. System Overview
DTD is a mobile-first directory + triage experience for dog owners, plus an admin operations surface for verification and moderation.

### 2.1 Primary actors
- **Public users (dog owners):** search directory, use triage, access emergency resources.
- **Businesses (trainers/services):** onboarding, profile presence, reviews, paid promotion.
- **Admins/operators:** verification, moderation queues, health monitoring, ops digest.

## 3. Non-negotiable invariants
- **Public/admin separation:** all admin surfaces are under `/admin` and `/api/admin/**`. Public pages must not expose admin tooling.
- **Schema-first:** code and docs must align to Supabase schema contracts. No “imagined” tables/columns.
- **No inbox fiction:** ops is pull-based (status strip + queues). There is no support inbox in code.
- **Monetisation checkout mode:** Stripe Checkout uses `mode: payment` (one-time featured placement) unless explicitly changed in this SSOT.

## 4. Route map (canonical)
See `05_ROUTES_AND_NAV.md` for the authoritative list of pages and admin surfaces.

## 5. Data & API contracts (canonical)
See:
- `03_DATA_CONTRACTS.md` (tables, enums, RPCs)
- `04_API_CONTRACTS.md` (API endpoints and boundaries)

## 6. Monetisation (canonical)
See `06_MONETISATION.md`.

## 7. AI automation controls (canonical)
See `07_AI_AUTOMATION.md`.

## 8. Operations (canonical)
See `08_OPS_RUNBOOK.md` and `09_DEPLOYMENT.md` (cron, health checks, runbooks).

## 9. Known gaps requiring confirmation
The input bundle indicates several references in code to tables/RPCs not present in migrations included in the bundle (e.g., `cron_job_runs`, `error_logs`, `webhook_events`, and some RPCs).  
**Rule:** treat these as **unknown** until verified in the real repo schema files. Track resolutions in `CHANGE_PROTOCOL.md`.

## 10. Canonical documents (Tier-1)
- `01_SYSTEM_MODEL.md`
- `02_ARCHITECTURE.md`
- `03_DATA_CONTRACTS.md`
- `04_API_CONTRACTS.md`
- `05_ROUTES_AND_NAV.md`
- `06_MONETISATION.md`
- `07_AI_AUTOMATION.md`
- `08_OPS_RUNBOOK.md`
- `09_DEPLOYMENT.md`
- `10_SECURITY_AND_PRIVACY.md`
- `FILE_MANIFEST.md`
- `CHANGE_PROTOCOL.md`
