# Product Context - Dog Trainers Directory (DTD)

**Status:** Canonical (Tier-1)  
**Version:** v1.4  
**Last Updated:** 2026-03-29

## 1. What this app is
DTD is a mobile-first dog trainer discovery and guidance platform.

In plain English, it does four jobs:
- helps dog owners find a suitable trainer
- helps dog owners decide what kind of help they need through triage
- helps dog owners access emergency resources when the situation is urgent
- helps trainer businesses join the directory, maintain their profile, and pay for featured visibility

It also includes a separate admin operations surface used to run and govern the platform.

Post-launch, the operating goal is a mostly self-running product where the owner supervises weekly exceptions, audits, and bounded overrides rather than doing routine daily queue babysitting.

This document is a plain-English product model. It summarises how the current product is meant to work, but it does not override the route, API, data, monetisation, security, or operations contracts defined elsewhere in Tier-0/Tier-1 SSOT.

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/FILE_MANIFEST.md`

## 2. Who it serves
- **Public users (dog owners):** find trainers, compare listings, use triage, access emergency resources, contact providers.
- **Business operators (trainers/services):** submit listings, maintain profile presence, and purchase featured placement.
- **Admins/operators:** moderate reviews, verify resources and business details, monitor system health, review operational queues, and oversee monetisation.

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`

## 3. Expected user workflows
### 3.1 Public user workflows
1. **Direct discovery**
   - User starts on `/`, `/search`, or `/directory`
   - User filters by location, service type, behaviour issue, age need, and related search filters
   - User compares listings, shortlist explanations, and bounded next-step guidance
   - User opens `/trainers/[id]`
   - User contacts a trainer by phone, email, website, or enquiry form

2. **Triage-led discovery**
   - User starts on `/triage`
   - User selects age and issue context
   - If the issue maps to emergency escalation, the emergency gate appears
   - If urgent, user is routed to `/emergency?flow=medical|stray|crisis`
   - If not urgent, user is routed to `/search` with relevant filters pre-applied and deterministic shortlist context explained clearly

3. **Owner decision support**
   - User stays on `/search` or `/trainers/[id]`
   - The product may explain shortlist fit, suggest a refinement, compare shortlisted trainers, or prepare an enquiry draft
   - Any refinement apply or send-like action still requires explicit owner action
   - Ranking, route truth, and emergency escalation remain deterministic

4. **Emergency help**
   - User starts on `/emergency`
   - User can browse emergency resources
   - User can submit a triage description
   - The system classifies the situation and returns guidance

5. **Failure recovery**
   - If a trainer profile cannot be loaded, the user sees a clear unavailable state
   - The user can recover via `Back to search`, `Browse directory`, or `Go home`

### 3.2 Business workflows
1. **Onboarding**
   - Business starts on `/onboarding`
   - Business submits identity, service, and listing details
   - Listing data enters the platform according to the current onboarding and verification rules

2. **Promotion**
   - Business starts on `/promote`
   - Business reviews the featured placement offer
   - If checkout is available, the business can start one-time Stripe Checkout
   - If checkout is not available, the product shows a controlled unavailable state instead of a broken payment path

3. **Profile management**
   - Business starts on `/account/business`
   - If only one owned business record exists, the flow can continue directly to `/account/business/[businessId]`
   - Business reviews and maintains its own listing/profile information after onboarding
   - The owned-record detail surface is `/account/business/[businessId]`
   - This surface is for business-owned profile quality and completeness work, not verification, promotion purchase, or operator review

### 3.3 Admin/operator workflows
1. **Platform oversight**
   - Operator starts on `/admin`
   - Operator reviews the exceptions-first weekly action strip, verification/ABN loop, scaffold-review loop, summaries, and monetisation visibility

2. **Moderation**
   - Operator uses `/admin/reviews`
   - Operator works the weekly moderation loop with explicit approve/reject actions and draft/shadow context kept distinct from final state

3. **Monitoring**
   - Operator uses `/admin/ai-health`, `/admin/cron-health`, `/admin/errors`, and `/admin/triage`
   - Operator monitors platform health, errors, triage activity, rollout readiness, workflow ceilings, and AI-related status through a dashboard-first, low-noise supervision model

**Source:** `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/06_MONETISATION.md`

## 4. Information architecture (IA)
### 4.1 Visible public IA
- `/` - public entry point
- `/search` - primary search and filtering surface
- `/directory` - canonical listing route
- `/trainers/[id]` - canonical trainer profile
- `/trainer/[id]` - compatibility redirect to `/trainers/[id]`
- `/triage` - guided issue and urgency assessment
- `/emergency` - emergency resources and emergency triage
- `/onboarding` - business listing submission
- `/promote` - featured placement offer and checkout entry
- `/login` - authentication entry point
- `/privacy`
- `/terms`
- `/disclaimer`

### 4.2 Authenticated business IA
- `/account/business` - business-owned profile-management entry point after onboarding
- `/account/business/[businessId]` - owned business record maintenance and completeness surface

### 4.3 Visible admin IA
- `/admin` - operator dashboard
- `/admin/reviews` - moderation
- `/admin/ai-health` - AI health, rollout-state, and supervision monitoring
- `/admin/cron-health` - cron and scheduled-job monitoring
- `/admin/errors` - error monitoring
- `/admin/triage` - triage monitoring

### 4.4 Navigation domains
- **Public discovery domain:** `/`, `/search`, `/directory`, `/trainers/[id]`, `/triage`, `/emergency`
- **Business acquisition domain:** `/onboarding`, `/promote`
- **Business management domain:** `/account/business/**`
- **Operator domain:** `/admin` and `/admin/**`

Admin routes must remain visually and operationally separate from public acquisition routes.

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`

## 5. API surface (supporting, not visible IA)
The API surface powers the workflows, but it is not part of the visible page hierarchy.

Users navigate to pages. Pages call APIs.

Examples:
- **Public discovery support:** `/api/public/search`, `/api/public/autocomplete`
- **Emergency support:** `/api/emergency/resources`, `/api/emergency/triage`
- **Onboarding support:** `/api/onboarding`, `/api/abn/verify`
- **Business management support:** `/api/account/business/[businessId]`
- **Monetisation support:** `/api/stripe/create-checkout-session`, Stripe webhooks
- **Admin support:** `/api/admin/**`

The first canonical post-onboarding business self-service API surface now exists at `/api/account/business/[businessId]`. It is limited to the authenticated business-owned profile-management contract and does not overlap with admin, verification, or monetisation APIs.

These routes exist to power the visible product. They are not intended to be user-facing navigation destinations.

Below the app-owned API routes, the system also depends on:
- Supabase RPCs such as `search_trainers(...)`, `get_trainer_profile(...)`, and `get_search_latency_stats(...)`
- Supabase Edge Functions such as `suburbs` and `triage`

**Source:** `DOCS/SSOT/03_DATA_CONTRACTS.md`, `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`

## 6. Layered system model
### 6.1 Visible product layer
The screens users and operators directly interact with.
- public pages
- business pages
- admin pages

### 6.2 Workflow layer
The journey logic that determines what happens next.
- discovery flow
- triage and emergency branching
- onboarding flow
- featured placement purchase flow
- admin monitoring and moderation flow

### 6.3 API and service layer
The server logic that receives requests, validates inputs, assembles responses, and enforces product rules.
- Next.js API routes
- shared application services and helpers

### 6.4 Database and data-services layer
The persistence and query layer.
- Supabase/Postgres tables
- database RPCs
- schema-defined enums and contracts

### 6.5 Admin and operations layer
The operating system for the platform itself.
- moderation
- verification
- health monitoring
- queue and status review

This layered model is the cleanest way to reason about the product:
- IA describes where users go
- workflows describe what happens next
- APIs describe how the app serves the pages
- the database describes where the truth is stored
- the admin layer describes how the platform is operated

**Source:** `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/02_ARCHITECTURE.md`, `DOCS/SSOT/03_DATA_CONTRACTS.md`, `DOCS/SSOT/04_API_CONTRACTS.md`, `DOCS/SSOT/08_OPS_RUNBOOK.md`

## 7. Core entities and business rules
### 7.1 Core entities
The platform relies on these main business and operating entities:
- location data: `councils`, `suburbs`
- identity and listings: `profiles`, `businesses`
- listing capability data: `trainer_services`, `trainer_behavior_issues`, `trainer_specializations`
- trust and moderation data: `reviews`, `ai_review_decisions`, ABN verification records
- emergency data: `emergency_resources`, `emergency_triage_logs`, related verification and metrics tables
- monetisation data: `featured_placements`, `featured_placement_queue`, `featured_placement_events`, `payment_audit`, `business_subscription_status`
- operations and telemetry data: `search_telemetry`, `latency_metrics`, `error_logs`, `error_alerts`, cron and digest tables

### 7.2 Non-negotiable product rules
- Public and admin surfaces must remain separate
- Code and docs must match the real schema
- There is no support inbox model in code
- Featured placement uses Stripe Checkout `mode: payment` (one-time payment) unless Tier-0 changes
- Sensitive fields are decrypted server-side only
- Owner decision-support helpers may prepare guidance, refinements, comparisons, and enquiry drafts, but they do not silently change route state or send messages
- Database identifiers remain in canonical schema form even when user-facing copy uses Australian English

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/03_DATA_CONTRACTS.md`, `DOCS/SSOT/06_MONETISATION.md`, `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`

## 8. Current scope boundary
DTD is currently a working, governed product that is functionally complete for the current application-layer audited scope.

That means:
- core public discovery works
- trainer profile and failure recovery paths work
- triage and emergency escalation logic are aligned
- owner low-touch guidance and confirmed owner action-preparation flows are present without widening control boundaries
- onboarding and promotion flows are present
- the first business-owned post-onboarding profile-management slice is present under `/account/business/**`
- featured placement no longer exposes a broken checkout path
- admin monitoring, moderation, and supervision surfaces are operationally separated and functionally usable for the audited scope

This does **not** imply that the product is already a fully mature or fully scaled marketplace. For example:
- live directory inventory is still a controlled baseline rather than a large real-world marketplace dataset
- some deeper technical debt may still exist below the app layer even when the app now handles the user-facing scenario safely

The current product should be understood as a coherent, functioning platform baseline, not as the final word on future scale, growth, or marketplace maturity.

**Source:** `DOCS/SSOT/WORKPLAN.md`, `DOCS/SSOT/08_OPS_RUNBOOK.md`

## 9. What this document is for
Use this file when you need the simplest accurate answer to:
- what the app is
- who it serves
- what users are expected to do in it
- how the information architecture is organised
- which technical layers support the visible product

Use the contract-specific SSOT files when you need exact route, API, data, monetisation, security, or deployment rules.

**Source:** `DOCS/SSOT/FILE_MANIFEST.md`
