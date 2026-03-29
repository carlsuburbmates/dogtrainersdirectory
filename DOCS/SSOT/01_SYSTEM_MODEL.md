# System Model — Actors, Workflows, State

**Status:** Canonical (Tier-1)  
**Version:** v1.2  
**Last Updated:** 2026-03-29

## 1. Users and roles
- **Public user:** no login required; uses search/triage/emergency.
- **Business operator:** creates and maintains a listing via onboarding and the owned `/account/business/**` profile-management surface (may require verification).
- **Admin/operator:** monitors health, runs weekly exception loops, verifies ABN and emergency resources, moderates reviews, and supervises automation ceilings.

## 2. Core public workflows
### 2.1 Directory discovery
- Entry points: `/`, `/search`, `/directory`, `/trainers`
- Inputs: canonical suburb/location context, needs (behaviour issue/service type), distance, and text query.
- Outputs: businesses (trainers) with verification badges, review counts, featured placement surfacing, and bounded shortlist guidance.

**Implementation details:**
- **Search API:** `/api/public/search` with 11+ filter parameters
- **UI:** Search form with canonical suburb state, service, behaviour, age, query, and refinement controls
- **Results:** Grid display with trainer cards, trust details, direct-contact context, pagination, owner-approved refinement suggestions, and shortlist comparison guidance
- **Backend:** Calls `search_trainers` RPC with decryption key for sensitive fields

### 2.2 Trainer profile
- Pages: `/trainers/[id]` and `/trainer/[id]` (must resolve to the same profile experience).
- Contract: profile data is derived from **businesses-centric schema** (via RPC `get_trainer_profile(...)` where available).

**Implementation details:**
- **Hero section:** Business name, featured badge, ABN verification badge, rating display, location
- **Profile sections:** About/bio, services offered, behavior issues addressed, age specialties
- **Reviews:** Display up to 10 approved reviews with ratings and content
- **Contact sidebar:** Phone, email, website, physical address with icons
- **Contact form:** Integrated ContactForm component for direct enquiries plus insert-only owner draft/question assistance
- **Redirect handler:** `/trainer/[id]` → 301 redirect to `/trainers/[id]` for backward compatibility

### 2.3 Emergency flow
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

### 2.4 Triage-led owner assistance
- `/triage -> /search` remains deterministic and safety-first.
- `/search` may explain the shortlist, suggest bounded refinements, and compare shortlisted trainers, but any search-changing action still requires explicit owner action.
- `/trainers/[id]` may prepare an enquiry draft or suggested questions, but the current contact/send path remains explicit and user-controlled.

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

### 3.3 Profile management
- Pages: `/account/business`, `/account/business/[businessId]`
- Outcome: business-owned listing/profile maintenance and deterministic completeness review, with shadow-only listing-quality guidance attached to the owned record
- Boundary: this surface does not grant operator verification, publication, moderation, or monetisation powers

## 4. Admin workflows (pull-based)
Admin pages: /admin, /admin/ai-health, /admin/cron-health, /admin/errors, /admin/reviews, /admin/triage

**Authentication:** All admin routes are protected by proxy enforcement and admin-role checks (`src/proxy.ts`, `src/lib/auth.ts`).

Admins operate via:
- **Exceptions-first dashboard:** weekly action strip, verification/ABN loop, scaffold-review loop, and lower-priority diagnostics
- **Queues:** review moderation, ABN manual review, emergency verification, scaffolded listing verification
- **Health pages:** cron health, errors, AI health, rollout and supervision truth

There is **no inbox** concept in the codebase.

### 4.1 Review moderation
- Page: `/admin/reviews`
- API: `/api/admin/reviews/list` (fetch reviews), `/api/admin/reviews/[id]` (approve/reject)

**Implementation details:**
- **Filtering:** By status (pending/approved/rejected) and rating (1-5 stars)
- **Search:** Client-side search across reviewer name, title, content, business name
- **AI integration:** Display draft/shadow moderation context with explicit approval state and reason
- **Actions:** 
  - Approve review explicitly
  - Reject review explicitly with reason
- **Pagination:** 10 reviews per page with next/previous controls
- **Real-time updates:** Status updates reflected immediately after actions

### 4.2 Automation supervision
- `/admin/ai-health` is the canonical automation supervision surface.
- It shows workflow ceilings, rollout truth, kill-switch guidance, and the distinction between deterministic visible behaviour and any future audit-backed AI workflow families.

## 5. State transitions (high level)
- Business verification: `verification_status` transitions (`pending` → `verified`/`rejected`/`manual_review`)
- Review moderation: `is_approved` toggled via admin moderation
- Featured placement: session/payment → placement active → expires via cron job
