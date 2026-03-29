# System Model — Actors, Workflows, State

**Status:** Canonical (Tier-1)  
**Version:** v1.3  
**Last Updated:** 2026-03-29

## 1. Scope
**Owns:**
- actor definitions
- major workflow families
- ownership boundaries between public, business, and admin domains
- high-level state transitions

**Does not own:**
- exact route and IA inventory
- API endpoint inventory
- schema, table, or RPC contracts
- auth/security mechanics
- AI rollout semantics

**See also:**
- `05_ROUTES_AND_NAV.md`
- `04_API_CONTRACTS.md`
- `03_DATA_CONTRACTS.md`
- `10_SECURITY_AND_PRIVACY.md`
- `07_AI_AUTOMATION.md`

## 2. Users and roles
- **Public user:** no login required; uses search/triage/emergency.
- **Business operator:** creates and maintains a listing via onboarding and the owned `/account/business/**` profile-management surface (may require verification).
- **Admin/operator:** monitors health, runs weekly exception loops, verifies ABN and emergency resources, moderates reviews, and supervises automation ceilings.

## 3. Core workflow families
### 3.1 Public discovery and trainer selection
- Public discovery spans the homepage, search, directory, and trainer-profile journey.
- The public user can move from discovery to trainer evaluation and then to an explicit contact path without entering admin or business-owned surfaces.
- Trainer selection may include bounded owner decision-support guidance, but public discovery remains deterministic in route and ranking behaviour.

### 3.2 Emergency and triage
- `/triage -> /search` remains deterministic and safety-first.
- `/emergency` is the urgent public surface for emergency resources and emergency triage.
- Emergency escalation remains higher priority than any AI-assisted interpretation or guidance.

### 3.3 Owner guidance inside the public journey
- `/triage -> /search` remains deterministic and safety-first.
- `/search` may explain the shortlist, suggest bounded refinements, and compare shortlisted trainers, but any search-changing action still requires explicit owner action.
- `/trainers/[id]` may prepare an enquiry draft or suggested questions, but the current contact/send path remains explicit and user-controlled.

## 4. Business workflows
- Business onboarding enters the platform through the business submission path and may include verification-related checks.
- Promotion is the monetisation workflow for featured placement.
- Post-onboarding profile management belongs to the authenticated `/account/business/**` family.
- Business-owned profile management is distinct from operator verification, publication, moderation, and monetisation control.

## 5. Admin workflows
- Admin work is pull-based and exceptions-first.
- Admin workflows cover moderation, verification, scaffold review, health monitoring, and automation supervision.
- `/admin/ai-health` is the canonical automation supervision surface.
- There is **no inbox** concept in the codebase.

## 6. State transitions (high level)
- Business verification: `verification_status` transitions (`pending` → `verified`/`rejected`/`manual_review`)
- Review moderation: `is_approved` toggled via admin moderation
- Featured placement: session/payment → placement active → expires via cron job
