# Product Context - Dog Trainers Directory (DTD)

**Status:** Canonical (Tier-1)  
**Version:** v1.5  
**Last Updated:** 2026-03-29

## 1. Scope
**Owns:**
- plain-English product purpose
- user jobs and workflow intent
- current scope boundary
- product-level framing for how the platform is meant to work

**Does not own:**
- route inventory or route rules
- API inventory or contract detail
- schema, RPC, or entity contracts
- auth/security mechanics
- AI mode or rollout semantics

**See also:**
- `05_ROUTES_AND_NAV.md`
- `04_API_CONTRACTS.md`
- `03_DATA_CONTRACTS.md`
- `10_SECURITY_AND_PRIVACY.md`
- `07_AI_AUTOMATION.md`
- `WORKPLAN.md`

## 2. What this app is
DTD is a mobile-first dog-owner directory and guidance platform.

In plain English, it does four jobs:
- helps dog owners find suitable directory listings across training, behaviour, emergency, and urgent-care needs
- helps dog owners decide what kind of help they need through triage
- helps dog owners access emergency resources when the situation is urgent
- helps relevant dog-service businesses join the directory, maintain their profile, and pay for featured visibility

It also includes a separate admin operations surface used to run and govern the platform.

Post-launch, the operating goal is a mostly self-running product where the owner supervises weekly exceptions, audits, and bounded overrides rather than doing routine daily queue babysitting.

This document is a plain-English product model. It summarises how the current product is meant to work, but it does not override the route, API, data, monetisation, security, or operations contracts defined elsewhere in Tier-0/Tier-1 SSOT.

Directory-first clarification:
- DTD is a directory first; triage is a routing and guidance layer on top of the directory rather than a separate product that narrows directory scope.
- A listing may be valid for DTD even if it does not count toward the current trainer-specific launch gate.
- Resource types such as trainers, behaviour consultants, emergency vets, urgent care, and emergency shelters are all part of the directory model when they are truthful, geographically valid, and in scope.

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/FILE_MANIFEST.md`

## 3. Who it serves
- **Public users (dog owners):** find trainers, compare listings, use triage, access emergency resources, contact providers.
- **Business operators (trainers/services):** submit listings, maintain profile presence, and purchase featured placement.
- **Admins/operators:** moderate reviews, verify resources and business details, monitor system health, review operational queues, and oversee monetisation.

**Source:** `DOCS/SSOT/00_BLUEPRINT_SSOT.md`, `DOCS/SSOT/01_SYSTEM_MODEL.md`

## 4. Expected user workflows
### 4.1 Public user workflows
1. **Direct discovery**
   - User starts the discovery journey from the public entry points
   - User filters and compares listings
   - User opens a listing profile
   - User chooses a direct contact path

2. **Triage-led discovery**
   - User selects age and issue context
   - Urgent cases escalate to the emergency flow
   - Non-urgent cases continue into discovery with clearer shortlist context
   - Triage may steer the user toward trainers, behaviour consultants, or emergency-capable listings, but it does not redefine what belongs in the directory

3. **Owner decision support**
   - The product may explain shortlist fit, suggest a refinement, compare shortlisted trainers, or prepare an enquiry draft
   - Any refinement apply or send-like action still requires explicit owner action
   - Ranking, route truth, and emergency escalation remain deterministic

4. **Emergency help**
   - User can browse emergency resources
   - User can submit a triage description
   - The system classifies the situation and returns guidance
   - Emergency-capable directory listings remain first-class inventory, not side-channel exceptions

5. **Failure recovery**
   - If a trainer profile cannot be loaded, the user sees a clear unavailable state
   - The user can recover via `Back to search`, `Browse directory`, or `Go home`

### 4.2 Business workflows
1. **Onboarding**
   - Business submits identity, service, and listing details
   - Listing data enters the platform according to the current onboarding and verification rules

2. **Promotion**
   - Business reviews the featured placement offer
   - If checkout is available, the business can start one-time Stripe Checkout
   - If checkout is not available, the product shows a controlled unavailable state instead of a broken payment path

3. **Profile management**
   - Business reviews and maintains its own listing/profile information after onboarding
   - This surface is for business-owned profile quality and completeness work, not verification, promotion purchase, or operator review

### 4.3 Admin/operator workflows
1. **Platform oversight**
   - Operator reviews the exceptions-first weekly action strip, verification/ABN loop, scaffold-review loop, summaries, and monetisation visibility

2. **Moderation**
   - Operator works the weekly moderation loop with explicit approve/reject actions and draft/shadow context kept distinct from final state

3. **Monitoring**
   - Operator monitors platform health, errors, triage activity, rollout readiness, workflow ceilings, and AI-related status through a dashboard-first, low-noise supervision model

**Source:** `DOCS/SSOT/01_SYSTEM_MODEL.md`, `DOCS/SSOT/05_ROUTES_AND_NAV.md`, `DOCS/SSOT/06_MONETISATION.md`

## 5. Current scope boundary
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

## 6. What this document is for
Use this file when you need the simplest accurate answer to:
- what the app is
- who it serves
- what users and operators are trying to achieve in it
- where the current product scope boundary sits

Use the contract-specific SSOT files when you need exact route, API, data, monetisation, security, or deployment rules.

**Source:** `DOCS/SSOT/FILE_MANIFEST.md`
