# Routes and Navigation - Intent and Boundaries

**Status:** Canonical (Tier-1)
**Version:** v1.5
**Last Updated:** 2026-03-02

## 1. Inventory source
Implementation-discovered route inventory is generated and versioned at:
- `DOCS/SSOT/_generated/routes.md`

This file defines navigation intent, canonical route decisions, and separation rules.

## 2. Public journey intent
- Entry points for public visitors are `/`, `/triage`, `/search`, `/directory`, and `/emergency`.
- `/` is the guided public launch point: it should support fast shortlist setup (stage, suburb, key issues) while also clearly routing to triage, directory browse, and emergency help.
- `/triage` is the needs-first flow that routes users to either emergency help or focused search.
- `/search` is the shortlist refinement surface: filters and results must coexist in a way that keeps the next move to a trainer profile obvious and low-friction.
- `/search` is also the canonical first-slice landing surface for locality and service intent. When canonical query params are present (`suburbName`, `service_type`, `age_specialties`, `behavior_issues`, `q/query`), page heading, metadata, structured data, and internal discovery links should reflect that context without requiring a second route family.
- `/directory` and `/trainers/[id]` are discovery and profile surfaces.
- `/trainers/[id]` is the trust and contact decision surface: it must make fit, proof, and direct contact options visible before the user leaves the directory, and it should prioritise the fastest available direct contact path while retaining the enquiry form as a written fallback.
- `/trainer/[id]` exists for backward compatibility and must redirect to `/trainers/[id]`.
- Legal and policy pages (`/privacy`, `/terms`, `/disclaimer`) must remain publicly accessible.

## 3. Admin separation
- Admin surfaces are under `/admin/**` only.
- `/emergency` is a public surface and must not be repurposed as an admin console.
- Admin pages must be protected by middleware and role checks (see `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`).

## 4. Canonical routing decisions
- Canonical trainer listing route is `/directory`.
- `/trainers` is a compatibility route and may redirect to `/directory`.
- Route additions/removals must be reflected by regenerating `DOCS/SSOT/_generated/routes.md`.
