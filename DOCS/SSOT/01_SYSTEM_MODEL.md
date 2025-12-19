# System Model — Actors, Workflows, State

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Users and roles
- **Public user:** no login required; uses search/triage/emergency.
- **Business operator:** creates/maintains a listing via onboarding flows (may require verification).
- **Admin/operator:** monitors health, runs queues, verifies ABN and emergency resources, moderates reviews.

## 2. Core public workflows
### 2.1 Directory discovery
- Entry points: `/`, `/search`, `/directory`, `/trainers`
- Inputs: suburb, council context, needs (behaviour issue/service type), distance.
- Outputs: businesses (trainers) with verification badges, review counts, featured placement surfacing.

### 2.2 Trainer profile
- Pages: `/trainers/[id]` and `/trainer/[id]` (must resolve to the same profile experience).
- Contract: profile data is derived from **businesses-centric schema** (via RPC `get_trainer_profile(...)` where available).

### 2.3 Emergency flow
- Page: `/emergency` (public)
- Capabilities:
  - emergency resource lookup
  - emergency triage submission
  - verification endpoint and weekly digest cron (see `09_DEPLOYMENT.md`)

## 3. Business workflows
### 3.1 Onboarding
- Page: `/onboarding`
- Server: `/api/onboarding`
- Contracts:
  - writes must align to schema tables `trainer_behavior_issues` and `trainer_services.service_type`
  - ABN verification may be part of onboarding (via `/api/abn/verify`)

### 3.2 Promotion (featured placement)
- Page: `/promote`
- Server: `/api/stripe/create-checkout-session`
- Outcome: featured placement entitlement recorded and surfaced (see `06_MONETISATION.md`)

## 4. Admin workflows (pull-based)
Admin pages: /admin, /admin/ai-health, /admin/cron-health, /admin/errors, /admin/reviews, /admin/triage

Admins operate via:
- **Status strip:** health/alerts/summary (pull)
- **Queues:** review moderation, ABN manual review, emergency verification, scaffolded listing verification
- **Health pages:** cron health, errors, AI health

There is **no inbox** concept in the codebase.

## 5. State transitions (high level)
- Business verification: `verification_status` transitions (`pending` → `verified`/`rejected`/`manual_review`)
- Review moderation: `is_approved` toggled via admin moderation
- Featured placement: session/payment → placement active → expires via cron job
