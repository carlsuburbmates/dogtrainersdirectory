# System Model — Actors, Workflows, State

**Status:** Canonical (Tier-1)  
**Version:** v1.1  
**Last Updated:** Phase 1 Batch 3 - Documentation Updates

## 1. Users and roles
- **Public user:** no login required; uses search/triage/emergency.
- **Business operator:** creates/maintains a listing via onboarding flows (may require verification).
- **Admin/operator:** monitors health, runs queues, verifies ABN and emergency resources, moderates reviews. ✅ Protected by authentication middleware.

## 2. Core public workflows
### 2.1 Directory discovery — ✅ Implemented (Phase 1 Batch 1)
- Entry points: `/`, `/search`, `/directory`, `/trainers`
- Inputs: suburb, council context, needs (behaviour issue/service type), distance.
- Outputs: businesses (trainers) with verification badges, review counts, featured placement surfacing.

**Implementation details:**
- **Search API:** `/api/public/search` with 11+ filter parameters
- **UI:** Full search form with location, service type, behavior issue, age specialty, certifications, availability, ratings, pricing filters
- **Results:** Grid display with trainer cards, contact information, pagination
- **Backend:** Calls `search_trainers` RPC with decryption key for sensitive fields

### 2.2 Trainer profile — ✅ Enhanced (Phase 1 Batch 2)
- Pages: `/trainers/[id]` and `/trainer/[id]` (must resolve to the same profile experience).
- Contract: profile data is derived from **businesses-centric schema** (via RPC `get_trainer_profile(...)` where available).

**Implementation details:**
- **Hero section:** Business name, featured badge, ABN verification badge, rating display, location
- **Profile sections:** About/bio, services offered, behavior issues addressed, age specialties
- **Reviews:** Display up to 10 approved reviews with ratings and content
- **Contact sidebar:** Phone, email, website, physical address with icons
- **Contact form:** Integrated ContactForm component for direct inquiries
- **Redirect handler:** `/trainer/[id]` → 301 redirect to `/trainers/[id]` for backward compatibility

### 2.3 Emergency flow — ✅ Enhanced (Phase 1 Batch 2)
- Page: `/emergency` (public)
- Capabilities:
  - emergency resource lookup ✅ **Implemented**
  - emergency triage submission ✅ **Implemented**
  - verification endpoint and weekly digest cron (see `09_DEPLOYMENT.md`)

**Implementation details:**
- **Resources lookup:**
  - Search by location (suburb, postcode) and resource type (vet, shelter, crisis hotline, animal control)
  - API: `/api/emergency/resources`
  - Display: Contact info, address, hours, services offered
  
- **AI triage form:**
  - User describes emergency situation in natural language
  - API: `/api/emergency/triage`
  - Response includes:
    - Priority level (high/medium/low) with color coding
    - Classification (medical/stray/crisis/normal)
    - Follow-up actions
    - Medical emergency detection with confidence score
  
- **Safety features:**
  - Prominent disclaimer banner
  - Emergency hotline list (police, RSPCA, poisons hotline)
  - Crisis resource links

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

## 4. Admin workflows (pull-based) — ✅ Auth Protected (Phase 1 Batch 1)
Admin pages: /admin, /admin/ai-health, /admin/cron-health, /admin/errors, /admin/reviews, /admin/triage

**Authentication:** All admin routes protected by Next.js middleware (`src/middleware.ts`)

Admins operate via:
- **Status strip:** health/alerts/summary (pull)
- **Queues:** review moderation, ABN manual review, emergency verification, scaffolded listing verification
- **Health pages:** cron health, errors, AI health

There is **no inbox** concept in the codebase.

### 4.1 Review moderation — ✅ Implemented (Phase 1 Batch 2)
- Page: `/admin/reviews`
- API: `/api/admin/reviews/list` (fetch reviews), `/api/admin/reviews/[id]` (approve/reject)

**Implementation details:**
- **Filtering:** By status (pending/approved/rejected) and rating (1-5 stars)
- **Search:** Client-side search across reviewer name, title, content, business name
- **AI integration:** Display AI moderation suggestions (decision, confidence, reason)
- **Actions:** 
  - Approve review with one click
  - Reject review with required reason
  - Flag for review (placeholder)
- **Pagination:** 10 reviews per page with next/previous controls
- **Real-time updates:** Status updates reflected immediately after actions

## 5. State transitions (high level)
- Business verification: `verification_status` transitions (`pending` → `verified`/`rejected`/`manual_review`)
- Review moderation: `is_approved` toggled via admin moderation
- Featured placement: session/payment → placement active → expires via cron job
