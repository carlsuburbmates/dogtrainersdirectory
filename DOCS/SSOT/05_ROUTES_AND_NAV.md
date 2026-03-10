# Routes and Navigation - Intent and Boundaries

**Status:** Canonical (Tier-1)
**Version:** v1.12
**Last Updated:** 2026-03-10

## 1. Inventory source
Implementation-discovered route inventory is generated and versioned at:
- `DOCS/SSOT/_generated/routes.md`

This file defines navigation intent, canonical route decisions, and separation rules.

## 2. Public journey intent
- Entry points for public visitors are `/`, `/triage`, `/search`, `/directory`, and `/emergency`.
- `/` is the guided public launch point: it should support fast shortlist setup (stage, suburb, key issues) while also clearly routing to triage, directory browse, and emergency help.
- `/triage` is the needs-first flow that routes users to either emergency help or focused search, and it must use one canonical emergency issue-to-flow mapping so the gate trigger and branch selection cannot diverge.
- `/triage` is a four-step journey in this order: age, issues, location, review. The normal completion path must hand canonical locality state into `/search`, and emergency-gated issues must branch to `/emergency`.
- In `/triage`, `suburbId` is the canonical location identity for URL state. If a saved or linked `suburbId` is present, the page must rehydrate the selected suburb from that id instead of relying on mutable location snapshot fields.
- `/search` is the shortlist refinement surface: filters and results must coexist in a way that keeps the next move to a trainer profile obvious and low-friction.
- `/search` is also the canonical first-slice landing surface for locality and service intent. When canonical query params are present (`suburbName`, `service_type`, `age_specialties`, `behavior_issues`, `q/query`), page heading, metadata, structured data, and internal discovery links should reflect that context without requiring a second route family.
- In `/search`, `suburbId` is the canonical location identity when present. Mutable location snapshot fields may remain as display/cache hints, but they must not override canonical suburb resolution for search correctness.
- `/directory` and `/trainers/[id]` are discovery and profile surfaces.
- `/trainers/[id]` is the trust and contact decision surface: it must make fit, proof, and direct contact options visible before the user leaves the directory, and it should prioritise the fastest available direct contact path while retaining the enquiry form as a written fallback.
- If `/trainers/[id]` cannot resolve to a live profile, the failure state must provide clear recovery actions back to search, directory, or home instead of ending in a hard stop.
- `/trainer/[id]` exists for backward compatibility and must redirect to `/trainers/[id]`.
- `/trainer/[id]` compatibility redirects must preserve meaningful query-string context when forwarding to `/trainers/[id]`.
- Legal and policy pages (`/privacy`, `/terms`, `/disclaimer`) must remain publicly accessible.

## 3. Business-owned management surface
- `/onboarding` remains the canonical business listing-submission path for first entry into DTD.
- `/promote` remains the canonical promotion and checkout support path. It is not the business listing/profile management surface.
- DTD canon reserves a future authenticated business profile-management route family under `/account/business/**` as the post-onboarding business-owned management surface. This family is planned, not implemented today.
- The purpose of `/account/business/**` is to let an authenticated business owner maintain the business-owned facts, profile content, and listing-quality inputs for their own record after onboarding, without entering operator workflows.
- Access to `/account/business/**` is for the authenticated business actor associated with the business record being managed. It is not an admin or multi-business operator surface.
- `/account/business/**` may cover self-service profile maintenance, completeness review, and future listing-quality guidance for the owned record.
- `/account/business/**` must not be treated as the place for verification grants, publication decisions, review moderation, scaffold review, checkout, featured or spotlight changes, or other operator/admin actions.
- Any future implementation of `/account/business/**` must add the supporting route, API, auth, and data-contract truth to SSOT before rollout.

## 4. Admin separation
- Admin surfaces are under `/admin/**` only.
- `/emergency` is a public surface and must not be repurposed as an admin console.
- Admin pages must be protected by middleware and role checks (see `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`).
- Admin pages must render inside an operator-specific shell and navigation model, not the public marketing shell.
- Public acquisition CTAs and the public footer chrome must not be shown on `/admin/**` routes.
- Scaffold-review queue routes under `/admin/**` and `/api/admin/**`, including `/api/admin/scaffolded`, are operator-only workflows. They are not business-owned listing-management routes.

## 5. Canonical routing decisions
- Canonical trainer listing route is `/directory`.
- `/trainers` is a compatibility route and may redirect to `/directory`.
- Route additions/removals must be reflected by regenerating `DOCS/SSOT/_generated/routes.md`.
